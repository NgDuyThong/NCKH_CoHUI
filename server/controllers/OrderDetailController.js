const OrderDetail = require('../models/OrderDetail');
const Order = require('../models/Order');
const ProductSizeStock = require('../models/ProductSizeStock');
const ProductColor = require('../models/ProductColor');
const Product = require('../models/Product');
const { getImageLink } = require('../middlewares/ImagesCloudinary_Controller');

class OrderDetailController {
    // Lấy danh sách chi tiết đơn hàng
    async getOrderDetails(req, res) {
        try {
            const { orderID } = req.params;
            const userID = req.user.userID;

            // Kiểm tra đơn hàng tồn tại và thuộc về user
            const order = await Order.findOne({ orderID });
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            // Nếu không phải admin, kiểm tra đơn hàng có thuộc về user không
            if (req.user.role !== 'admin' && order.userID !== userID) {
                return res.status(403).json({
                    message: 'Bạn không có quyền xem chi tiết đơn hàng này'
                });
            }

            // Lấy danh sách chi tiết đơn hàng
            const orderDetails = await OrderDetail.find({ orderID });

            // Lấy thông tin sản phẩm cho từng chi tiết đơn hàng
            const result = await Promise.all(orderDetails.map(async (detail) => {
                // Lấy thông tin kho
                const stock = await ProductSizeStock.findOne({ SKU: detail.SKU });
                if (!stock) return { ...detail.toObject(), productInfo: null };

                // Lấy thông tin màu sắc và sản phẩm
                const color = await ProductColor.findOne({ colorID: stock.colorID });
                if (!color) return { ...detail.toObject(), productInfo: { ...stock.toObject() } };

                const product = await Product.findOne({ productID: color.productID });

                // Trả về thông tin đầy đủ
                return {
                    orderDetailID: detail.orderDetailID,
                    orderID: detail.orderID,
                    SKU: detail.SKU,
                    quantity: detail.quantity,
                    productInfo: {
                        name: product?.name,
                        price: product?.price,
                        thumbnail: product?.thumbnail,
                        colorName: color.colorName,
                        size: stock.size,
                        stock: stock.stock,
                        images: color.images
                    }
                };
            }));

            res.json(result);
        } catch (error) {
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy chi tiết đơn hàng',
                error: error.message
            });
        }
    }

    // Lấy chi tiết một sản phẩm trong đơn hàng
    async getOrderDetailById(req, res) {
        try {
            const { orderID, id } = req.params;

            // Tìm chi tiết đơn hàng
            const detail = await OrderDetail.findOne({
                orderDetailID: id,
                orderID
            });

            if (!detail) {
                return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn hàng' });
            }

            // Lấy thông tin kho
            const stock = await ProductSizeStock.findOne({ SKU: detail.SKU });
            if (!stock) return { ...detail.toObject(), productInfo: null };

            // Lấy thông tin màu sắc và sản phẩm
            const color = await ProductColor.findOne({ colorID: stock.colorID });
            if (!color) return { ...detail.toObject(), productInfo: { ...stock.toObject() } };

            const product = await Product.findOne({ productID: color.productID });

            // Trả về thông tin đầy đủ
            res.json({
                orderDetailID: detail.orderDetailID,
                orderID: detail.orderID,
                SKU: detail.SKU,
                quantity: detail.quantity,
                productInfo: {
                    name: product?.name,
                    price: product?.price,
                    thumbnail: product?.thumbnail,
                    colorName: color.colorName,
                    size: stock.size,
                    stock: stock.stock,
                    images: color.images
                }
            });
        } catch (error) {
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy chi tiết đơn hàng',
                error: error.message
            });
        }
    }

    //!ADMIN
    // ADMIN: Lấy chi tiết đơn hàng
    async getOrderDetailschoADMIN(req, res) {
        try {
            const { orderID } = req.params;
            
            // Lấy thông tin đơn hàng để lấy coupon và thời gian đặt hàng
            const order = await Order.findOne({ orderID: orderID });
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            const orderCreatedAt = order.createdAt; // Thời gian đặt hàng
            console.log(`📅 Order created at: ${orderCreatedAt}`);

            const orderDetails = await OrderDetail.find({ orderID: orderID });
            

            if (!orderDetails || orderDetails.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn hàng' });
            }

            const detailsWithProducts = await Promise.all(
                orderDetails.map(async (detail) => {
                    const stockItem = await ProductSizeStock.findOne({ SKU: detail.SKU });
                    if (!stockItem) return null;

                    const [productID, colorID] = stockItem.SKU.split('_');

                    const [product, color] = await Promise.all([
                        Product.findOne({ productID: Number(productID) })
                            .select('_id productID name price images'),
                        ProductColor.findOne({
                            productID: Number(productID),
                            colorID: Number(colorID)
                        }).select('colorName colorID images')
                    ]);

                    // Lấy đường dẫn Cloudinary cho ảnh
                    let cloudinaryImageUrl = null;
                    if (color && color.images && color.images.length > 0) {
                        cloudinaryImageUrl = await getImageLink(color.images[0]);
                    }

                    // Tính giá sau khuyến mãi nếu có
                    let promotionInfo = null;
                    
                    if (product && product._id) {
                        try {
                            const Promotion = require('../models/Promotion');
                            
                            // Tìm promotion đang active tại thời điểm đặt hàng
                            const promotion = await Promotion.findOne({
                                products: product._id,
                                startDate: { $lte: orderCreatedAt },
                                endDate: { $gte: orderCreatedAt }
                            }).sort({ discountPercent: -1 }); // Lấy promotion có % giảm cao nhất
                            
                            console.log(`🔍 Checking promotion for product ${productID} at ${orderCreatedAt}`);
                            console.log(`🔍 Found promotion:`, promotion?.name);
                            
                            if (promotion) {
                                const discountedPrice = Math.round(product.price * (1 - promotion.discountPercent / 100));
                                promotionInfo = {
                                    name: promotion.name,
                                    discountPercent: promotion.discountPercent,
                                    discountedPrice: discountedPrice
                                };
                                console.log(`✅ Promotion "${promotion.name}" (${promotion.discountPercent}%) applied to product ${productID}`);
                                console.log(`   Original: ${product.price}, Discounted: ${discountedPrice}`);
                            } else {
                                console.log(`ℹ️ No promotion active for product ${productID} at order time`);
                            }
                        } catch (promotionError) {
                            console.error(`❌ Error fetching promotion for product ${productID}:`, promotionError.message);
                        }
                    }

                    return {
                        orderDetailID: detail.orderDetailID,
                        quantity: detail.quantity,
                        SKU: detail.SKU,
                        size: stockItem.size,
                        price: stockItem.price,
                        product: product ? {
                            productID: product.productID,
                            name: product.name,
                            price: product.price,
                            originalPrice: product.price,
                            promotion: promotionInfo,
                            color: color ? {
                                colorName: color.colorName,
                                colorID: color.colorID,
                                image: cloudinaryImageUrl // Sử dụng đường dẫn Cloudinary
                            } : null
                        } : {
                            name: 'Sản phẩm không tồn tại',
                            price: 0,
                            images: []
                        }
                    };
                })
            );

            const validDetails = detailsWithProducts.filter(detail => detail !== null);

            // Tính tổng giá trị đơn hàng hiện tại (giá gốc)
            const currentTotalPrice = validDetails.reduce((sum, detail) => {
                const price = Number(detail.product.price.toString().replace(/\./g, ''));
                return sum + (price * detail.quantity);
            }, 0);

            // Lấy tổng giá đã lưu trong order (đã áp dụng promotion)
            const orderTotalPrice = order.totalPrice;
            
            console.log(`💰 Current total (no promotion): ${currentTotalPrice}`);
            console.log(`💰 Order total (with promotion): ${orderTotalPrice}`);

            // Nếu có sự chênh lệch, tính % giảm giá và cập nhật promotion info
            if (currentTotalPrice > orderTotalPrice) {
                const discountPercent = Math.round(((currentTotalPrice - orderTotalPrice) / currentTotalPrice) * 100);
                console.log(`🎉 Detected ${discountPercent}% discount applied to order`);
                
                // Tìm promotion có % giảm giá tương ứng để lấy tên
                const Promotion = require('../models/Promotion');
                let promotionName = 'Khuyến mãi đã áp dụng';
                
                try {
                    // Tìm promotion có % giảm giá gần đúng (trong khoảng ±2%)
                    const matchingPromotion = await Promotion.findOne({
                        discountPercent: { 
                            $gte: discountPercent - 2, 
                            $lte: discountPercent + 2 
                        }
                    }).sort({ createdAt: -1 });
                    
                    if (matchingPromotion) {
                        promotionName = matchingPromotion.name;
                        console.log(`✅ Found matching promotion: ${promotionName}`);
                    }
                } catch (error) {
                    console.log(`⚠️ Could not find promotion name: ${error.message}`);
                }
                
                // Cập nhật promotion info cho từng sản phẩm dựa trên % chung
                validDetails.forEach(detail => {
                    if (!detail.product.promotion) {
                        const originalPrice = Number(detail.product.price.toString().replace(/\./g, ''));
                        const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100));
                        
                        detail.product.promotion = {
                            name: promotionName,
                            discountPercent: discountPercent,
                            discountedPrice: discountedPrice
                        };
                        
                        console.log(`   ✅ Applied ${discountPercent}% (${promotionName}) to product ${detail.product.productID}`);
                    }
                });
            }

            const totalPrice = orderTotalPrice; // Sử dụng giá đã lưu trong order

            // Lấy thông tin coupon nếu có
            let couponInfo = null;
            if (order.userCouponsID) {
                try {
                    const UserCoupon = require('../models/UserCoupon');
                    const Coupon = require('../models/Coupon');
                    
                    const userCoupon = await UserCoupon.findOne({ userCouponsID: order.userCouponsID });
                    if (userCoupon) {
                        const coupon = await Coupon.findOne({ couponID: userCoupon.couponID });
                        if (coupon) {
                            couponInfo = {
                                code: coupon.code,
                                discountType: coupon.discountType,
                                discountValue: coupon.discountValue,
                                maxDiscountAmount: coupon.maxDiscountAmount
                            };
                        }
                    }
                } catch (couponError) {
                    console.error('Error fetching coupon:', couponError);
                    // Không throw error, chỉ log và tiếp tục
                }
            }

            res.json({
                orderDetails: validDetails,
                totalPrice: totalPrice,
                coupon: couponInfo
            });
        } catch (error) {
            console.error('Error in getOrderDetailschoADMIN:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy chi tiết đơn hàng',
                error: error.message
            });
        }
    }
}

module.exports = new OrderDetailController();
