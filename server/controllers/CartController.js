const Cart = require('../models/Cart');
const ProductSizeStock = require('../models/ProductSizeStock');
const Product = require('../models/Product');
const ProductColor = require('../models/ProductColor');
const Promotion = require('../models/Promotion');
const { getImageLink } = require('../middlewares/ImagesCloudinary_Controller');

class CartController {
    // Lấy giỏ hàng của user
    async getCart(req, res) {
        try {
            // Lấy các items trong giỏ hàng
            const userID = req.user.userID;
            const cartItems = await Cart.find({ userID });

            // Lấy ngày hiện tại để kiểm tra khuyến mãi
            const currentDate = new Date();

            // Tính tổng tiền
            let totalAmount = 0;
            const items = await Promise.all(cartItems.map(async (item) => {
                try {
                    // Tìm thông tin size và stock
                    const sizeStock = await ProductSizeStock.findOne({ SKU: item.SKU });
                    if (!sizeStock) {
                        console.warn(`Không tìm thấy thông tin size cho SKU: ${item.SKU}`);
                        return null;
                    }

                    // Parse productID và colorID từ SKU
                    const [productID, colorID] = sizeStock.SKU.split('_');

                    // Lấy thông tin sản phẩm
                    const product = await Product.findOne({ productID: parseInt(productID) })
                        .populate(['targetInfo', 'categoryInfo']);
                    if (!product) {
                        console.warn(`Không tìm thấy thông tin sản phẩm cho productID: ${productID}`);
                        return null;
                    }

                    // Lấy thông tin màu sắc
                    let color = await ProductColor.findOne({ 
                        colorID: parseInt(colorID),
                        productID: parseInt(productID)
                    });

                    // Nếu không tìm thấy màu sắc, tạo object mặc định
                    if (!color) {
                        console.warn(`Không tìm thấy thông tin màu sắc cho colorID: ${colorID}, productID: ${productID}`);
                        color = {
                            colorName: 'Mặc định',
                            images: []
                        };
                    }

                    // Xử lý ảnh với cloudinary
                    const thumbnail = await getImageLink(product.thumbnail);
                    const colorImages = await Promise.all((color.images || []).map(img => getImageLink(img)));

                    // Tìm khuyến mãi áp dụng
                    const activePromotion = await Promotion.findOne({
                        $or: [
                            { products: product._id },
                            { categories: product.categoryInfo.name }
                        ],
                        startDate: { $lte: currentDate },
                        endDate: { $gte: currentDate },
                        status: 'active'
                    }).sort({ discountPercent: -1 });

                    // Tính giá và khuyến mãi
                    const originalPrice = parseInt(product.price.replace(/\./g, ''));
                    let finalPrice = originalPrice;
                    let promotionDetails = null;

                    if (activePromotion) {
                        const discountedValue = Math.round(originalPrice * (1 - activePromotion.discountPercent / 100));
                        finalPrice = discountedValue;
                        promotionDetails = {
                            name: activePromotion.name,
                            discountPercent: activePromotion.discountPercent,
                            discountedPrice: discountedValue.toLocaleString('vi-VN'),
                            endDate: activePromotion.endDate
                        };
                    }

                    // Tính tổng giá trị của mỗi sản phẩm
                    const subtotal = finalPrice * item.quantity;
                    totalAmount += subtotal;

                    // Trả về dữ liệu
                    const productObj = product.toObject();
                    return {
                        cartID: item.cartID,
                        SKU: sizeStock.SKU,
                        product: {
                            ...productObj,
                            imageURL: colorImages[0] || thumbnail,
                            thumbnail: thumbnail,
                            promotion: promotionDetails,
                            description: undefined
                        },
                        size: {
                            name: sizeStock.size
                        },
                        color: {
                            colorName: color.colorName,
                            images: colorImages
                        },
                        quantity: item.quantity,
                        price: finalPrice.toLocaleString('vi-VN'),
                        originalPrice: product.price,
                        subtotal: subtotal.toLocaleString('vi-VN'),
                        stock: sizeStock.stock
                    };
                } catch (error) {
                    console.error(`Lỗi khi xử lý item ${item.cartID}:`, error);
                    return null;
                }
            }));

            // Lọc bỏ các item null và undefined
            const validItems = items.filter(item => item !== null);

            // Tính lại tổng tiền từ các item hợp lệ
            totalAmount = validItems.reduce((sum, item) => sum + parseInt(item.subtotal.replace(/\./g, '')), 0);

            // Trả về dữ liệu
            res.json({
                message: 'Lấy giỏ hàng thành công',
                items: validItems,
                totalAmount: totalAmount.toLocaleString('vi-VN'),
                itemCount: validItems.length
            });
        } catch (error) {
            console.error('Lỗi lấy giỏ hàng:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy giỏ hàng',
                error: error.message
            });
        }
    }

    // Thêm combo sản phẩm vào giỏ hàng
    async addComboToCart(req, res) {
        try {
            const { product1, product2 } = req.body;
            const userID = req.user.userID;

            console.log('=== ADD COMBO TO CART ===');
            console.log('UserID:', userID);
            console.log('Product 1:', product1);
            console.log('Product 2:', product2);

            // Validate input
            if (!product1 || !product2) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin sản phẩm'
                });
            }

            if (!product1.colorID || !product1.sizeStockID || !product2.colorID || !product2.sizeStockID) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn đầy đủ màu sắc và kích thước cho cả 2 sản phẩm'
                });
            }

            // Thêm từng sản phẩm vào giỏ
            const products = [product1, product2];
            const addedItems = [];

            for (const product of products) {
                // Tìm thông tin sản phẩm
                const productInfo = await Product.findOne({ productID: product.productID });
                if (!productInfo) {
                    return res.status(404).json({
                        success: false,
                        message: `Không tìm thấy sản phẩm #${product.productID}`
                    });
                }

                // Kiểm tra màu sắc
                const colorInfo = await ProductColor.findOne({
                    productID: product.productID,
                    colorID: product.colorID
                });

                if (!colorInfo) {
                    return res.status(404).json({
                        success: false,
                        message: `Màu sắc không hợp lệ cho sản phẩm ${productInfo.name}`
                    });
                }

                // Tìm thông tin size và tồn kho bằng sizeStockID
                const sizeStock = await ProductSizeStock.findOne({ 
                    sizeStockID: product.sizeStockID,
                    colorID: product.colorID
                });

                if (!sizeStock) {
                    console.error('❌ Size stock not found:', {
                        sizeStockID: product.sizeStockID,
                        colorID: product.colorID,
                        productID: product.productID
                    });
                    return res.status(404).json({
                        success: false,
                        message: `Không tìm thấy kích thước cho sản phẩm ${productInfo.name}`
                    });
                }

                const SKU = sizeStock.SKU;
                console.log('✅ Found SKU:', SKU, 'Stock:', sizeStock.stock);

                if (sizeStock.stock < 1) {
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm "${productInfo.name}" đã hết hàng`
                    });
                }

                // Kiểm tra xem đã có trong giỏ chưa
                let cartItem = await Cart.findOne({ userID, SKU });

                if (cartItem) {
                    // Nếu đã có thì tăng số lượng
                    const newQuantity = cartItem.quantity + 1;
                    
                    if (newQuantity > sizeStock.stock) {
                        return res.status(400).json({
                            success: false,
                            message: `Sản phẩm "${productInfo.name}" chỉ còn ${sizeStock.stock} trong kho`
                        });
                    }

                    cartItem.quantity = newQuantity;
                    await cartItem.save();
                } else {
                    // Nếu chưa có thì thêm mới
                    const lastCart = await Cart.findOne().sort({ cartID: -1 });
                    const cartID = lastCart ? lastCart.cartID + 1 : 1;

                    cartItem = new Cart({
                        cartID,
                        userID,
                        SKU,
                        quantity: 1
                    });
                    await cartItem.save();
                }

                addedItems.push({
                    productID: product.productID,
                    name: productInfo.name,
                    SKU,
                    quantity: cartItem.quantity
                });
            }

            console.log('✅ Added combo items:', addedItems);

            res.status(201).json({
                success: true,
                message: 'Đã thêm combo vào giỏ hàng',
                items: addedItems
            });

        } catch (error) {
            console.error('❌ Error adding combo to cart:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi thêm combo vào giỏ hàng',
                error: error.message
            });
        }
    }

    // Thêm sản phẩm vào giỏ hàng
    async addToCart(req, res) {
        try {
            console.log('📥 POST /api/cart/add - Request received');
            console.log('Request body:', req.body);
            console.log('User:', req.user);
            
            const userID = req.user.userID;
            const { SKU, quantity = 1 } = req.body;

            if (!SKU) {
                console.log('❌ SKU is missing');
                return res.status(400).json({ message: 'SKU không được để trống' });
            }
            
            console.log('✅ Processing cart add for SKU:', SKU, 'quantity:', quantity, 'UserID:', userID);

            if (!quantity || quantity < 1) {
                return res.status(400).json({ message: 'Số lượng phải lớn hơn 0' });
            }

            // Kiểm tra sản phẩm tồn tại và còn hàng
            console.log('🔍 Checking if ProductSizeStock exists for SKU:', SKU);
            let stockItem = await ProductSizeStock.findOne({ SKU });
            
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
                        // Cập nhật SKU để sử dụng SKU đúng từ database
                        SKU = stockByColorSize.SKU;
                    } else {
                        // Tìm bằng sizeStockID
                        const stockByID = await ProductSizeStock.findOne({ 
                            sizeStockID: parseInt(sizeStockID) 
                        });
                        if (stockByID) {
                            console.log('✅ Found by sizeStockID:', stockByID.SKU);
                            console.log('⚠️ SKU mismatch! Requested:', SKU, 'Actual in DB:', stockByID.SKU);
                            stockItem = stockByID;
                            // Cập nhật SKU để sử dụng SKU đúng từ database
                            SKU = stockByID.SKU;
                        }
                    }
                }
            }
            
            console.log('📦 StockItem result:', stockItem ? `Found (SKU: ${stockItem.SKU}, stock: ${stockItem.stock})` : 'Not found');
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

            if (stockItem.stock < quantity) {
                return res.status(400).json({ 
                    message: `Số lượng sản phẩm trong kho không đủ. Chỉ còn ${stockItem.stock} sản phẩm`,
                    maxQuantity: stockItem.stock 
                });
            }

            // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
            let cartItem = await Cart.findOne({ userID, SKU });

            if (cartItem) {
                // Nếu đã có, cập nhật số lượng
                const newQuantity = cartItem.quantity + quantity;
                if (newQuantity > stockItem.stock) {
                    return res.status(400).json({ 
                        message: `Số lượng sản phẩm trong kho không đủ. Chỉ còn ${stockItem.stock} sản phẩm`,
                        maxQuantity: stockItem.stock 
                    });
                }

                cartItem.quantity = newQuantity;
                await cartItem.save();
            } else {
                // Nếu chưa có, tạo mới
                const lastCart = await Cart.findOne().sort({ cartID: -1 });
                const cartID = lastCart ? lastCart.cartID + 1 : 1;

                cartItem = new Cart({
                    cartID,
                    userID,
                    SKU,
                    quantity
                });
                await cartItem.save();
            }

            res.status(201).json({
                message: 'Thêm vào giỏ hàng thành công',
                cartItem
            });
        } catch (error) {
            console.error('❌ ERROR in addToCart:');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            // Xử lý lỗi duplicate key (E11000)
            if (error.code === 11000 || error.name === 'MongoServerError') {
                console.error('⚠️ Duplicate key error - cart item already exists');
                return res.status(400).json({ 
                    message: 'Sản phẩm đã có trong giỏ hàng',
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
                message: 'Có lỗi xảy ra khi thêm vào giỏ hàng',
                error: error.message
            });
        }
    }

    // Cập nhật số lượng sản phẩm trong giỏ
    async updateCartItem(req, res) {
        try {
            const userID = req.user.userID;
            const { id } = req.params;
            const { quantity } = req.body;

            // Kiểm tra item tồn tại trong giỏ
            const cartItem = await Cart.findOne({ cartID: id, userID });
            if (!cartItem) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
            }

            // Kiểm tra số lượng tồn kho
            const stockItem = await ProductSizeStock.findOne({ SKU: cartItem.SKU });
            if (stockItem.stock < quantity) {
                return res.status(400).json({ message: 'Số lượng sản phẩm trong kho không đủ', maxQuantity: stockItem.stock });
            }

            // Cập nhật số lượng
            cartItem.quantity = quantity;
            await cartItem.save();

            res.json({
                message: 'Cập nhật số lượng thành công',
                cartItem
            });
        } catch (error) {
            res.status(500).json({
                message: 'Có lỗi xảy ra khi cập nhật số lượng',
                error: error.message
            });
        }
    }

    // Xóa sản phẩm khỏi giỏ hàng
    async removeFromCart(req, res) {
        try {
            const userID = req.user.userID;
            const { id } = req.params;

            const cartItem = await Cart.findOne({ cartID: id, userID });
            if (!cartItem) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
            }

            await cartItem.deleteOne();

            res.json({ message: 'Xóa sản phẩm khỏi giỏ hàng thành công' });
        } catch (error) {
            res.status(500).json({
                message: 'Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng',
                error: error.message
            });
        }
    }

    // Xóa toàn bộ giỏ hàng
    async clearCart(req, res) {
        try {
            const userID = req.user.userID;
            
            await Cart.deleteMany({ userID });

            res.json({ message: 'Xóa giỏ hàng thành công' });
        } catch (error) {
            res.status(500).json({
                message: 'Có lỗi xảy ra khi xóa giỏ hàng',
                error: error.message
            });
        }
    }
}

module.exports = new CartController();
