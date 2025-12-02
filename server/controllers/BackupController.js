const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const archiver = require('archiver');
const extract = require('extract-zip');

// Models để backup
const User = require('../models/User');
const Product = require('../models/Product');
const ProductColor = require('../models/ProductColor');
const ProductSizeStock = require('../models/ProductSizeStock');
const Category = require('../models/Category');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Cart = require('../models/Cart');
const Favorite = require('../models/Favorite');
const Address = require('../models/Address');
const Coupon = require('../models/Coupon');
const UserCoupon = require('../models/UserCoupon');
const Promotion = require('../models/Promotion');
const Notification = require('../models/Notification');
const UserNotification = require('../models/UserNotification');
const Review = require('../models/Review');
const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const Target = require('../models/Target');

class BackupController {
    constructor() {
        // Thư mục lưu backup
        this.backupDir = path.join(__dirname, '../backups');
        this.ensureBackupDirectory();
    }

    // Đảm bảo thư mục backup tồn tại
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    // Lấy danh sách tất cả collections
    getAllCollections() {
        return [
            { name: 'users', model: User, priority: 1, category: 'core' },
            { name: 'categories', model: Category, priority: 2, category: 'core' },
            { name: 'products', model: Product, priority: 3, category: 'core' },
            { name: 'productcolors', model: ProductColor, priority: 3, category: 'core' },
            { name: 'productsizestocks', model: ProductSizeStock, priority: 3, category: 'core' },
            { name: 'orders', model: Order, priority: 4, category: 'transaction' },
            { name: 'orderdetails', model: OrderDetail, priority: 4, category: 'transaction' },
            { name: 'receipts', model: Receipt, priority: 4, category: 'transaction' },
            { name: 'receiptitems', model: ReceiptItem, priority: 4, category: 'transaction' },
            { name: 'carts', model: Cart, priority: 5, category: 'user_data' },
            { name: 'favorites', model: Favorite, priority: 5, category: 'user_data' },
            { name: 'addresses', model: Address, priority: 5, category: 'user_data' },
            { name: 'reviews', model: Review, priority: 5, category: 'user_data' },
            { name: 'coupons', model: Coupon, priority: 6, category: 'marketing' },
            { name: 'usercoupons', model: UserCoupon, priority: 6, category: 'marketing' },
            { name: 'promotions', model: Promotion, priority: 6, category: 'marketing' },
            { name: 'targets', model: Target, priority: 6, category: 'marketing' },
            { name: 'notifications', model: Notification, priority: 7, category: 'system' },
            { name: 'usernotifications', model: UserNotification, priority: 7, category: 'system' }
        ];
    }

    // Tạo backup FULL
    async createFullBackup(req, res) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `backup_full_${timestamp}`;
            const backupPath = path.join(this.backupDir, backupName);
            
            // Tạo thư mục backup tạm
            fs.mkdirSync(backupPath, { recursive: true });

            const collections = this.getAllCollections();
            const backupData = {
                metadata: {
                    type: 'full',
                    created_at: new Date().toISOString(),
                    version: '1.0',
                    database: 'TVTStore',
                    total_collections: collections.length
                },
                collections: {}
            };

            let totalDocuments = 0;
            let totalSize = 0;

            // Backup từng collection
            for (const collection of collections) {
                try {
                    const data = await collection.model.find({}).lean();
                    
                    if (data && data.length > 0) {
                        backupData.collections[collection.name] = {
                            count: data.length,
                            priority: collection.priority,
                            category: collection.category,
                            data: data
                        };
                        
                        totalDocuments += data.length;
                        
                        // Lưu từng collection vào file riêng để dễ quản lý
                        const collectionFile = path.join(backupPath, `${collection.name}.json`);
                        fs.writeFileSync(collectionFile, JSON.stringify(data, null, 2));
                        
                        const stats = fs.statSync(collectionFile);
                        totalSize += stats.size;
                    }
                } catch (error) {
                    console.error(`Error backing up ${collection.name}:`, error.message);
                    backupData.collections[collection.name] = {
                        error: error.message,
                        count: 0
                    };
                }
            }

            // Lưu metadata
            backupData.metadata.total_documents = totalDocuments;
            backupData.metadata.total_size_bytes = totalSize;
            
            const metadataFile = path.join(backupPath, 'metadata.json');
            fs.writeFileSync(metadataFile, JSON.stringify(backupData.metadata, null, 2));

            // Nén thành file ZIP
            const zipPath = `${backupPath}.zip`;
            await this.compressBackup(backupPath, zipPath);

            // Xóa thư mục tạm
            fs.rmSync(backupPath, { recursive: true, force: true });

            const zipStats = fs.statSync(zipPath);

            res.json({
                success: true,
                message: 'Tạo backup thành công',
                backup: {
                    name: `${backupName}.zip`,
                    path: zipPath,
                    type: 'full',
                    size: this.formatFileSize(zipStats.size),
                    size_bytes: zipStats.size,
                    total_documents: totalDocuments,
                    total_collections: collections.length,
                    created_at: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Full backup error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo backup',
                error: error.message
            });
        }
    }

    // Tạo backup PARTIAL (chỉ dữ liệu quan trọng)
    async createPartialBackup(req, res) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `backup_partial_${timestamp}`;
            const backupPath = path.join(this.backupDir, backupName);
            
            fs.mkdirSync(backupPath, { recursive: true });

            // Chỉ backup các collection quan trọng
            const criticalCollections = this.getAllCollections().filter(c => 
                ['core', 'transaction'].includes(c.category)
            );

            const backupData = {
                metadata: {
                    type: 'partial',
                    created_at: new Date().toISOString(),
                    version: '1.0',
                    database: 'TVTStore',
                    included_categories: ['core', 'transaction'],
                    total_collections: criticalCollections.length
                },
                collections: {}
            };

            let totalDocuments = 0;
            let totalSize = 0;

            for (const collection of criticalCollections) {
                try {
                    const data = await collection.model.find({}).lean();
                    
                    if (data && data.length > 0) {
                        backupData.collections[collection.name] = {
                            count: data.length,
                            priority: collection.priority,
                            category: collection.category,
                            data: data
                        };
                        
                        totalDocuments += data.length;
                        
                        const collectionFile = path.join(backupPath, `${collection.name}.json`);
                        fs.writeFileSync(collectionFile, JSON.stringify(data, null, 2));
                        
                        const stats = fs.statSync(collectionFile);
                        totalSize += stats.size;
                    }
                } catch (error) {
                    console.error(`Error backing up ${collection.name}:`, error.message);
                }
            }

            backupData.metadata.total_documents = totalDocuments;
            backupData.metadata.total_size_bytes = totalSize;
            
            const metadataFile = path.join(backupPath, 'metadata.json');
            fs.writeFileSync(metadataFile, JSON.stringify(backupData.metadata, null, 2));

            const zipPath = `${backupPath}.zip`;
            await this.compressBackup(backupPath, zipPath);

            fs.rmSync(backupPath, { recursive: true, force: true });

            const zipStats = fs.statSync(zipPath);

            res.json({
                success: true,
                message: 'Tạo partial backup thành công',
                backup: {
                    name: `${backupName}.zip`,
                    path: zipPath,
                    type: 'partial',
                    size: this.formatFileSize(zipStats.size),
                    size_bytes: zipStats.size,
                    total_documents: totalDocuments,
                    total_collections: criticalCollections.length,
                    created_at: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Partial backup error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo partial backup',
                error: error.message
            });
        }
    }

    // Nén backup thành ZIP
    compressBackup(source, destination) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(destination);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));

            archive.pipe(output);
            archive.directory(source, false);
            archive.finalize();
        });
    }

    // Restore backup
    async restoreBackup(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn file backup'
                });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extractPath = path.join(this.backupDir, `restore_temp_${timestamp}`);
            
            // Giải nén file backup
            await extract(req.file.path, { dir: extractPath });

            // Đọc metadata
            const metadataPath = path.join(extractPath, 'metadata.json');
            if (!fs.existsSync(metadataPath)) {
                throw new Error('File backup không hợp lệ - thiếu metadata');
            }

            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

            // Kiểm tra version
            if (metadata.version !== '1.0') {
                throw new Error('Phiên bản backup không tương thích');
            }

            let restoredCollections = 0;
            let restoredDocuments = 0;
            const errors = [];

            // Đọc và restore từng collection theo thứ tự priority
            const collections = this.getAllCollections().sort((a, b) => a.priority - b.priority);

            for (const collection of collections) {
                const collectionFile = path.join(extractPath, `${collection.name}.json`);
                
                if (fs.existsSync(collectionFile)) {
                    try {
                        const data = JSON.parse(fs.readFileSync(collectionFile, 'utf8'));
                        
                        if (data && data.length > 0) {
                            // Xóa dữ liệu cũ
                            await collection.model.deleteMany({});
                            
                            // Insert dữ liệu mới
                            await collection.model.insertMany(data);
                            
                            restoredCollections++;
                            restoredDocuments += data.length;
                        }
                    } catch (error) {
                        console.error(`Error restoring ${collection.name}:`, error.message);
                        errors.push({
                            collection: collection.name,
                            error: error.message
                        });
                    }
                }
            }

            // Xóa file tạm
            fs.rmSync(extractPath, { recursive: true, force: true });
            fs.unlinkSync(req.file.path);

            res.json({
                success: true,
                message: 'Khôi phục dữ liệu thành công',
                restored: {
                    type: metadata.type,
                    collections: restoredCollections,
                    documents: restoredDocuments,
                    backup_date: metadata.created_at,
                    errors: errors.length > 0 ? errors : undefined
                }
            });

        } catch (error) {
            console.error('Restore error:', error);
            
            // Cleanup on error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                success: false,
                message: 'Lỗi khi khôi phục dữ liệu',
                error: error.message
            });
        }
    }

    // Lấy danh sách backup
    async getBackupList(req, res) {
        try {
            const files = fs.readdirSync(this.backupDir);
            const backups = [];

            for (const file of files) {
                if (file.endsWith('.zip')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    
                    // Parse tên file để lấy thông tin
                    const match = file.match(/backup_(full|partial)_(.+)\.zip/);
                    
                    if (match) {
                        backups.push({
                            id: file,
                            name: file,
                            type: match[1],
                            size: this.formatFileSize(stats.size),
                            size_bytes: stats.size,
                            created_at: stats.birthtime.toISOString(),
                            modified_at: stats.mtime.toISOString(),
                            path: filePath
                        });
                    }
                }
            }

            // Sắp xếp theo ngày tạo mới nhất
            backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            res.json({
                success: true,
                backups: backups,
                total: backups.length
            });

        } catch (error) {
            console.error('Get backup list error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách backup',
                error: error.message
            });
        }
    }

    // Download backup
    async downloadBackup(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join(this.backupDir, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'File backup không tồn tại'
                });
            }

            res.download(filePath, filename);

        } catch (error) {
            console.error('Download backup error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải xuống backup',
                error: error.message
            });
        }
    }

    // Xóa backup
    async deleteBackup(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join(this.backupDir, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'File backup không tồn tại'
                });
            }

            fs.unlinkSync(filePath);

            res.json({
                success: true,
                message: 'Xóa backup thành công'
            });

        } catch (error) {
            console.error('Delete backup error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa backup',
                error: error.message
            });
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    // Lấy thông tin hệ thống
    async getSystemInfo(req, res) {
        try {
            const collections = this.getAllCollections();
            const stats = [];
            let totalDocuments = 0;

            for (const collection of collections) {
                try {
                    const count = await collection.model.countDocuments();
                    stats.push({
                        name: collection.name,
                        category: collection.category,
                        priority: collection.priority,
                        documents: count
                    });
                    totalDocuments += count;
                } catch (error) {
                    stats.push({
                        name: collection.name,
                        error: error.message,
                        documents: 0
                    });
                }
            }

            // Thông tin thư mục backup
            const backupFiles = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.zip'));
            let totalBackupSize = 0;
            
            backupFiles.forEach(file => {
                const stats = fs.statSync(path.join(this.backupDir, file));
                totalBackupSize += stats.size;
            });

            res.json({
                success: true,
                system: {
                    database: 'TVTStore',
                    total_collections: collections.length,
                    total_documents: totalDocuments,
                    collections: stats,
                    backup_storage: {
                        total_backups: backupFiles.length,
                        total_size: this.formatFileSize(totalBackupSize),
                        backup_directory: this.backupDir
                    }
                }
            });

        } catch (error) {
            console.error('Get system info error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông tin hệ thống',
                error: error.message
            });
        }
    }
}

module.exports = new BackupController();
