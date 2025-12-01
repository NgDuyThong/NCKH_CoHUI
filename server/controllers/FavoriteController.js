const Favorite = require('../models/Favorite');
const ProductSizeStock = require('../models/ProductSizeStock');
const Product = require('../models/Product');
const ProductColor = require('../models/ProductColor');
const Promotion = require('../models/Promotion');
const { getImageLink } = require('../middlewares/ImagesCloudinary_Controller');

//TODO: Xử lý ảnh với Cloudinary + Xử lý promotion cho sản phẩm
class FavoriteController {
    // Lấy danh sách yêu thích của user
    async getFavorites(req, res) {
        try {
            const userID = req.user.userID;
            const { page = 1, limit = 10 } = req.query;

            // Lấy danh sách yêu thích với phân trang
            const favorites = await Favorite.find({ userID })
                .sort('-addedAt')
                .skip((page - 1) * limit)
                .limit(limit);

            // Lấy thông tin chi tiết sản phẩm
            const items = await Promise.all(favorites.map(async (fav) => {
                try {
                    // Tìm thông tin ProductSizeStock
                    const sizeStock = await ProductSizeStock.findOne({ SKU: fav.SKU });
                    if (!sizeStock) {
                        // console.warn(`Không tìm thấy thông tin size cho SKU: ${fav.SKU}`);
                        return null;
                    }

                    // Parse productID và colorID từ SKU
                    const [productID, colorID] = sizeStock.SKU.split('_');

                    // Lấy thông tin sản phẩm
                    const product = await Product.findOne(
                        { productID: parseInt(productID), isActivated: true },
                        'productID name price thumbnail targetInfo categoryInfo isActivated'
                    ).populate('targetInfo').populate('categoryInfo');

                    if (!product) {
                        // console.warn(`FavC - Không tìm thấy thông tin sản phẩm cho productID : ${productID}`);
                        return null;
                    }

                    // Lấy thông tin màu sắc
                    let color = await ProductColor.findOne({
                        colorID: parseInt(colorID),
                        productID: parseInt(productID)
                    });

                    if (!color) {
                        // console.warn(`FavC - Không tìm thấy thông tin màu sắc cho colorID: ${colorID}, productID: ${productID}`);
                        color = {
                            colorName: 'Mặc định',
                            images: []
                        };
                    }

                    // Tính giá
                    const price = product.price;
                    const priceNumber = Number(price.replace(/\./g, ''));

                    // Xử lý ảnh với cloudinary
                    const thumbnail = await getImageLink(product.thumbnail);
                    const colorImages = await Promise.all((color?.images || []).map(img => getImageLink(img)));

                    return {
                        favoriteID: fav.favoriteID,
                        SKU: sizeStock.SKU,
                        product: {
                            productID: product.productID,
                            name: product.name,
                            originalPrice: priceNumber,
                            price: priceNumber,
                            isActivated: product.isActivated,
                            thumbnail: colorImages[0] || thumbnail,
                            images: colorImages.length > 0 ? colorImages : [thumbnail]
                        },
                        size: sizeStock.size,
                        colorName: color?.colorName,
                        note: fav.note
                    };
                } catch (error) {
                    console.error(`Lỗi khi xử lý item ${fav.favoriteID}:`, error);
                    return null;
                }
            }));

            // Lọc bỏ các item null và undefined
            const validItems = items.filter(item => item !== null);

            // Đếm tổng số item yêu thích
            const total = await Favorite.countDocuments({ userID });

            res.json({
                items: validItems,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page)
            });
        } catch (error) {
            console.error('Error in getFavorites:', error);
            res.status(500).json({
                error: error.message
            });
        }
    }

    // Thêm sản phẩm vào danh sách yêu thích
    async addToFavorites(req, res) {
        try {
            console.log('📥 POST /api/favorite/add - Request received');
            console.log('Request body:', req.body);
            console.log('User:', req.user);
            
            const userID = req.user.userID;
            const { SKU, note = '' } = req.body;

            if (!SKU) {
                console.log('❌ SKU is missing');
                return res.status(400).json({ message: 'SKU không được để trống' });
            }
            
            console.log('✅ Processing favorite add for SKU:', SKU, 'UserID:', userID);

            // Kiểm tra sản phẩm tồn tại
            let stockItem;
            try {
                console.log('🔍 Checking if ProductSizeStock exists for SKU:', SKU);
                stockItem = await ProductSizeStock.findOne({ SKU });
                
                // Nếu không tìm thấy bằng SKU, thử tìm bằng cách parse SKU
                if (!stockItem) {
                    console.log('⚠️ Not found by SKU, trying to parse SKU...');
                    const parts = SKU.split('_');
                    if (parts.length === 4) {
                        const [productID, colorID, size, sizeStockID] = parts;
                        console.log('🔍 Searching by parsed values:', { productID, colorID, size, sizeStockID });
                        
                        // Tìm bằng colorID và size
                        const stockByColorSize = await ProductSizeStock.findOne({ 
                            colorID: parseInt(colorID), 
                            size: size 
                        });
                        
                        if (stockByColorSize) {
                            console.log('✅ Found by colorID and size:', stockByColorSize.SKU);
                            console.log('⚠️ SKU mismatch! Requested:', SKU, 'Actual in DB:', stockByColorSize.SKU);
                            stockItem = stockByColorSize;
                        } else {
                            // Tìm bằng sizeStockID
                            const stockByID = await ProductSizeStock.findOne({ 
                                sizeStockID: parseInt(sizeStockID) 
                            });
                            if (stockByID) {
                                console.log('✅ Found by sizeStockID:', stockByID.SKU);
                                console.log('⚠️ SKU mismatch! Requested:', SKU, 'Actual in DB:', stockByID.SKU);
                                stockItem = stockByID;
                            }
                        }
                    }
                }
                
                console.log('📦 StockItem result:', stockItem ? `Found (SKU: ${stockItem.SKU}, sizeStockID: ${stockItem.sizeStockID})` : 'Not found');
            } catch (dbError) {
                console.error('❌ Database error when finding ProductSizeStock:', dbError);
                return res.status(500).json({ 
                    message: 'Lỗi khi kiểm tra sản phẩm',
                    error: dbError.message 
                });
            }
            
            if (!stockItem) {
                console.log('❌ ProductSizeStock not found for SKU:', SKU);
                // Log thêm thông tin để debug
                try {
                    const allStocks = await ProductSizeStock.find({}).limit(5);
                    console.log('📋 Sample SKUs in database:', allStocks.map(s => s.SKU));
                } catch (e) {
                    console.error('Error getting sample SKUs:', e);
                }
                return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
            }
            console.log('✅ ProductSizeStock found:', stockItem.sizeStockID, 'SKU:', stockItem.SKU);

            // Kiểm tra sản phẩm đã có trong danh sách yêu thích chưa
            let existingFavorite;
            try {
                console.log('🔍 Checking if favorite already exists for userID:', userID, 'SKU:', SKU);
                existingFavorite = await Favorite.findOne({ userID, SKU });
                console.log('💖 Existing favorite result:', existingFavorite ? `Found (favoriteID: ${existingFavorite.favoriteID})` : 'Not found (can add)');
            } catch (dbError) {
                console.error('❌ Database error when finding existing favorite:', dbError);
                return res.status(500).json({ 
                    message: 'Lỗi khi kiểm tra danh sách yêu thích',
                    error: dbError.message 
                });
            }
            
            if (existingFavorite) {
                console.log('⚠️ Favorite already exists, returning 400');
                return res.status(400).json({ message: 'Sản phẩm đã có trong danh sách yêu thích' });
            }

            // Tạo ID mới cho favorite
            let favoriteID;
            try {
                console.log('🔢 Getting next favoriteID...');
                const lastFavorite = await Favorite.findOne().sort({ favoriteID: -1 });
                favoriteID = lastFavorite ? lastFavorite.favoriteID + 1 : 1;
                console.log('✅ Next favoriteID:', favoriteID);
            } catch (dbError) {
                console.error('❌ Database error when getting next favoriteID:', dbError);
                return res.status(500).json({ 
                    message: 'Lỗi khi tạo ID mới',
                    error: dbError.message 
                });
            }

            // Thêm vào danh sách yêu thích
            console.log('📝 Creating new Favorite object...');
            const favorite = new Favorite({
                favoriteID,
                userID,
                SKU,
                note
            });
            console.log('💾 Saving favorite to database...');
            
            try {
                await favorite.save();
                console.log('✅ Favorite saved successfully! FavoriteID:', favorite.favoriteID);
            } catch (saveError) {
                console.error('❌ Error saving favorite:', saveError);
                console.error('Save error name:', saveError.name);
                console.error('Save error code:', saveError.code);
                console.error('Save error message:', saveError.message);
                
                // Xử lý lỗi duplicate key từ pre-save hook hoặc unique index
                if (saveError.code === 11000 || saveError.name === 'MongoServerError') {
                    console.error('⚠️ Duplicate key error during save');
                    return res.status(400).json({ 
                        message: 'Sản phẩm đã có trong danh sách yêu thích',
                        error: 'Duplicate entry'
                    });
                }
                
                // Xử lý lỗi từ pre-save hook
                if (saveError.message === 'Sản phẩm không tồn tại') {
                    return res.status(404).json({ 
                        message: 'Sản phẩm không tồn tại',
                        error: saveError.message
                    });
                }
                
                throw saveError; // Re-throw để catch block chính xử lý
            }

            console.log('📤 Sending success response...');
            res.status(201).json({
                message: 'Thêm vào danh sách yêu thích thành công',
                favorite
            });
            console.log('✅ Response sent successfully');
        } catch (error) {
            console.error('❌ ERROR in addToFavorites:');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            // Xử lý lỗi duplicate key (E11000)
            if (error.code === 11000 || error.name === 'MongoServerError') {
                console.error('⚠️ Duplicate key error - favorite already exists');
                return res.status(400).json({ 
                    message: 'Sản phẩm đã có trong danh sách yêu thích',
                    error: 'Duplicate entry'
                });
            }
            
            // Xử lý lỗi validation
            if (error.name === 'ValidationError') {
                console.error('⚠️ Validation error:', error.errors);
                return res.status(400).json({ 
                    message: 'Dữ liệu không hợp lệ',
                    error: error.message
                });
            }
            
            res.status(500).json({
                message: 'Có lỗi xảy ra khi thêm vào danh sách yêu thích',
                error: error.message
            });
        }
    }

    // Cập nhật ghi chú cho sản phẩm yêu thích
    async updateFavorite(req, res) {
        try {
            const userID = req.user.userID;
            const { id } = req.params;
            const { note } = req.body;

            const favorite = await Favorite.findOne({ favoriteID: id, userID });
            if (!favorite) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong danh sách yêu thích' });
            }

            favorite.note = note;
            await favorite.save();

            res.json({
                message: 'Cập nhật ghi chú thành công',
                favorite
            });
        } catch (error) {
            res.status(500).json({
                message: 'Có lỗi xảy ra khi cập nhật ghi chú',
                error: error.message
            });
        }
    }

    // Xóa sản phẩm khỏi danh sách yêu thích
    async removeFromFavorites(req, res) {
        try {
            const userID = req.user.userID;
            // Express tự động decode URL parameters, nhưng để chắc chắn ta decode lại
            let { SKU } = req.params;
            SKU = decodeURIComponent(SKU);
            
            if (!SKU) {
                return res.status(400).json({ message: 'SKU không hợp lệ' });
            }

            const favorite = await Favorite.findOne({ SKU, userID });
            
            if (!favorite) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong danh sách yêu thích' });
            }

            await favorite.deleteOne();

            res.json({ message: 'Xóa khỏi danh sách yêu thích thành công' });
        } catch (error) {
            console.error('Lỗi khi xóa khỏi danh sách yêu thích:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi xóa khỏi danh sách yêu thích',
                error: error.message
            });
        }
    }

    // Kiểm tra sản phẩm có trong danh sách yêu thích không
    async checkFavorite(req, res) {
        try {
            const userID = req.user.userID;
            // Express tự động decode URL parameters, nhưng để chắc chắn ta decode lại
            let { SKU } = req.params;
            SKU = decodeURIComponent(SKU);

            if (!SKU) {
                return res.status(400).json({ 
                    message: 'SKU không hợp lệ',
                    isFavorite: false 
                });
            }

            const favorite = await Favorite.findOne({ userID, SKU });

            res.json({
                isFavorite: !!favorite,
                favorite: favorite || null
            });
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi kiểm tra trạng thái yêu thích',
                error: error.message,
                isFavorite: false
            });
        }
    }

}

module.exports = new FavoriteController();
