const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const Product = require('../models/Product');

class ReceiptController {
    // Lấy danh sách sản phẩm để chọn (dùng cho form nhập kho)
    // Lấy TẤT CẢ sản phẩm (bao gồm cả deactivated) để đồng bộ với database
    async getProductsForReceipt(req, res) {
        try {
            const { search = '', limit } = req.query;

            // Tạo filter - BỎ isActivated để lấy TẤT CẢ sản phẩm
            const filter = {};
            if (search) {
                filter.name = new RegExp(search, 'i');
            }

            // Lấy sản phẩm - không giới hạn hoặc dùng limit nếu có
            let query = Product.find(filter)
                .select('productID name price description')
                .sort({ name: 1 });
            
            // Chỉ áp dụng limit nếu được chỉ định (để hỗ trợ tìm kiếm với giới hạn)
            if (limit) {
                query = query.limit(parseInt(limit));
            }

            const products = await query;

            // Format dữ liệu - productCode được tạo tự động từ productID
            const formattedProducts = products.map(product => ({
                productID: product.productID,
                productCode: `SP${product.productID.toString().padStart(4, '0')}`, // Tự động tạo từ productID
                name: product.name,
                price: typeof product.price === 'string' 
                    ? parseInt(product.price.replace(/\./g, '')) 
                    : product.price,
                description: product.description || '',
                unit: 'Cái' // Mặc định đơn vị tính
            }));

            res.json({
                success: true,
                data: formattedProducts,
                total: formattedProducts.length
            });
        } catch (error) {
            console.error('Error getting products for receipt:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi lấy danh sách sản phẩm',
                error: error.message
            });
        }
    }

    // Tạo phiếu nhập kho mới
    async createReceipt(req, res) {
        try {
            const {
                receiptNumber,
                receiptDate,
                supplierName,
                referenceDocument,
                warehouse,
                department,
                unit,
                accounting,
                totalAmountInWords,
                attachedDocuments,
                items
            } = req.body;

            // Validate
            if (!receiptNumber || !supplierName || !warehouse?.name || !items || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
                });
            }

            // Kiểm tra số phiếu đã tồn tại
            const existingReceipt = await Receipt.findOne({ receiptNumber });
            if (existingReceipt) {
                return res.status(400).json({
                    success: false,
                    message: 'Số phiếu đã tồn tại'
                });
            }

            // Tính tổng số lượng và tổng tiền
            let totalQuantity = 0;
            let totalAmount = 0;

            items.forEach(item => {
                totalQuantity += item.actualQuantity || 0;
                totalAmount += (item.actualQuantity || 0) * (item.unitPrice || 0);
            });

            // Tạo phiếu nhập kho
            const receipt = new Receipt({
                receiptNumber,
                receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
                supplierName,
                referenceDocument: referenceDocument || {},
                warehouse: warehouse || {},
                department,
                unit,
                accounting: accounting || {},
                totalQuantity,
                totalAmount,
                totalAmountInWords,
                attachedDocuments,
                createdBy: req.user?.userID,
                status: 'completed'
            });

            await receipt.save();

            // Tạo các receipt items và cập nhật stock
            const receiptItems = [];
            const ProductColor = require('../models/ProductColor');
            const ProductSizeStock = require('../models/ProductSizeStock');
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                
                // Validate màu và size
                if (!item.colorName || !item.size) {
                    throw new Error(`Vui lòng chọn màu sắc và size cho sản phẩm ${item.productName}`);
                }
                
                // Tìm colorID từ colorName và productID (case-insensitive)
                const productColor = await ProductColor.findOne({
                    productID: item.productID,
                    colorName: { $regex: new RegExp(`^${item.colorName.trim()}$`, 'i') }
                });
                
                if (!productColor) {
                    console.error(`[RECEIPT] Không tìm thấy màu "${item.colorName}" cho productID ${item.productID}`);
                    throw new Error(`Không tìm thấy màu "${item.colorName}" cho sản phẩm ${item.productName}. Vui lòng kiểm tra lại tên màu.`);
                }
                
                console.log(`[RECEIPT] Tìm thấy màu: ${productColor.colorName} (ID: ${productColor.colorID})`);
                
                // Tìm hoặc tạo ProductSizeStock
                let sizeStock = await ProductSizeStock.findOne({
                    colorID: productColor.colorID,
                    size: item.size
                });
                
                if (sizeStock) {
                    // Cập nhật số lượng tồn kho
                    const oldStock = sizeStock.stock;
                    sizeStock.stock += item.actualQuantity;
                    await sizeStock.save();
                    console.log(`[RECEIPT] Cập nhật stock: ${oldStock} + ${item.actualQuantity} = ${sizeStock.stock} (SKU: ${sizeStock.SKU})`);
                } else {
                    // Tạo mới nếu chưa tồn tại
                    const maxSizeStockID = await ProductSizeStock.findOne().sort({ sizeStockID: -1 });
                    const newSizeStockID = maxSizeStockID ? maxSizeStockID.sizeStockID + 1 : 1;
                    
                    sizeStock = new ProductSizeStock({
                        sizeStockID: newSizeStockID,
                        SKU: `${item.productID}_${productColor.colorID}_${item.size}_${newSizeStockID}`,
                        colorID: productColor.colorID,
                        size: item.size,
                        stock: item.actualQuantity
                    });
                    await sizeStock.save();
                    console.log(`[RECEIPT] Tạo mới ProductSizeStock: SKU=${sizeStock.SKU}, stock=${sizeStock.stock}`);
                }
                
                // Tạo receipt item
                const receiptItem = new ReceiptItem({
                    receiptID: receipt._id,
                    productID: item.productID,
                    productCode: item.productCode,
                    productName: item.productName,
                    colorName: item.colorName,
                    size: item.size,
                    unit: 'Cái', // Mặc định là Cái
                    documentQuantity: item.documentQuantity || 0,
                    actualQuantity: item.actualQuantity || 0,
                    unitPrice: item.unitPrice || 0,
                    sortOrder: i + 1
                });
                await receiptItem.save();
                receiptItems.push(receiptItem);
            }

            // Populate để trả về đầy đủ thông tin
            const receiptWithItems = await Receipt.findById(receipt._id)
                .populate({
                    path: 'items',
                    options: { sort: { sortOrder: 1 } }
                });

            res.status(201).json({
                success: true,
                message: 'Tạo phiếu nhập kho thành công',
                data: receiptWithItems
            });
        } catch (error) {
            console.error('Error creating receipt:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi tạo phiếu nhập kho',
                error: error.message
            });
        }
    }

    // Lấy thông tin phiếu nhập kho để xuất PDF
    async getReceiptForPDF(req, res) {
        try {
            const { id } = req.params;

            // Lấy phiếu nhập kho
            const receipt = await Receipt.findById(id);
            if (!receipt) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy phiếu nhập kho'
                });
            }

            // Lấy danh sách items
            const items = await ReceiptItem.find({ receiptID: receipt._id })
                .sort({ sortOrder: 1 });

            // Format dữ liệu để xuất PDF
            const formattedItems = items.map((item, index) => ({
                stt: index + 1,
                productName: item.productName,
                colorName: item.colorName || '',
                size: item.size || '',
                productCode: item.productCode,
                unit: item.unit,
                documentQuantity: item.documentQuantity,
                actualQuantity: item.actualQuantity,
                unitPrice: item.unitPrice,
                totalAmount: item.totalAmount
            }));

            // Format date
            const receiptDate = new Date(receipt.receiptDate);
            const day = receiptDate.getDate();
            const month = receiptDate.getMonth() + 1;
            const year = receiptDate.getFullYear();

            const refDocDate = receipt.referenceDocument?.date 
                ? new Date(receipt.referenceDocument.date)
                : null;

            const pdfData = {
                receiptNumber: receipt.receiptNumber,
                receiptDate: {
                    day,
                    month,
                    year
                },
                supplierName: receipt.supplierName,
                referenceDocument: {
                    number: receipt.referenceDocument?.number || '',
                    day: refDocDate ? refDocDate.getDate() : null,
                    month: refDocDate ? refDocDate.getMonth() + 1 : null,
                    year: refDocDate ? refDocDate.getFullYear() : null,
                    issuedBy: receipt.referenceDocument?.issuedBy || ''
                },
                warehouse: {
                    name: receipt.warehouse?.name || '',
                    location: receipt.warehouse?.location || ''
                },
                department: receipt.department || '',
                unit: receipt.unit || '',
                accounting: {
                    debit: receipt.accounting?.debit || '',
                    credit: receipt.accounting?.credit || ''
                },
                items: formattedItems,
                totalQuantity: receipt.totalQuantity,
                totalAmount: receipt.totalAmount,
                totalAmountInWords: receipt.totalAmountInWords || '',
                attachedDocuments: receipt.attachedDocuments || ''
            };

            res.json({
                success: true,
                data: pdfData
            });
        } catch (error) {
            console.error('Error getting receipt for PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi lấy thông tin phiếu nhập kho',
                error: error.message
            });
        }
    }

    // Lấy danh sách phiếu nhập kho
    async getReceipts(req, res) {
        try {
            const { page = 1, limit = 20, search = '' } = req.query;
            
            const filter = {};
            if (search) {
                filter.$or = [
                    { receiptNumber: new RegExp(search, 'i') },
                    { supplierName: new RegExp(search, 'i') }
                ];
            }

            const receipts = await Receipt.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await Receipt.countDocuments(filter);

            res.json({
                success: true,
                data: receipts,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error getting receipts:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi lấy danh sách phiếu nhập kho',
                error: error.message
            });
        }
    }

    // Lấy chi tiết phiếu nhập kho
    async getReceiptById(req, res) {
        try {
            const { id } = req.params;

            const receipt = await Receipt.findById(id);
            if (!receipt) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy phiếu nhập kho'
                });
            }

            const items = await ReceiptItem.find({ receiptID: receipt._id })
                .sort({ sortOrder: 1 });

            res.json({
                success: true,
                data: {
                    receipt,
                    items
                }
            });
        } catch (error) {
            console.error('Error getting receipt by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi lấy thông tin phiếu nhập kho',
                error: error.message
            });
        }
    }
}

module.exports = new ReceiptController();

