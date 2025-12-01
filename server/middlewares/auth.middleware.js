const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware xác thực token
const authenticateToken = async (req, res, next) => {
    try {
        console.log(`🔐 AuthenticateToken - ${req.method} ${req.path}`);
        // Lấy token từ header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            console.log('❌ No token found');
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Tìm user và kiểm tra trạng thái
        const user = await User.findOne({ userID: decoded.userID });
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.isDisabled) {
            console.log('❌ User is disabled');
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            });
        }

        // Kiểm tra tài khoản có đang bị khóa không
        if (user.lockUntil && user.lockUntil > Date.now()) {
            console.log('❌ User is locked');
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đang bị khóa, vui lòng thử lại sau'
            });
        }

        // Lưu thông tin user vào request
        req.user = user;
        console.log('✅ Token authenticated for user:', user.userID, 'role:', user.role);
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('❌ Token expired');
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }
        
        console.log('❌ Token invalid:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

// Middleware kiểm tra role admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
    next();
};

// Middleware kiểm tra role customer
const isCustomer = (req, res, next) => {
    console.log(`👤 isCustomer check - ${req.method} ${req.path}, user role:`, req.user?.role);
    if (req.user.role !== 'customer') {
        console.log('❌ User is not a customer');
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
    console.log('✅ User is a customer');
    next();
};

// Middleware kiểm tra role nhân viên quản lý khách hàng
const isCustomerManager = (req, res, next) => {
    if (req.user.role !== 'customer_manager' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
    next();
};

// Middleware kiểm tra role nhân viên quản lý sản phẩm
const isProductManager = (req, res, next) => {
    if (req.user.role !== 'product_manager' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
    next();
};

// Middleware kiểm tra role nhân viên quản lý đơn hàng
const isOrderManager = (req, res, next) => {
    if (req.user.role !== 'order_manager' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
    next();
};

// Middleware kiểm tra role nhân viên quản lý mã giảm giá
const isCouponManager = (req, res, next) => {
    if (req.user.role !== 'coupon_manager' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
    next();
};

// Middleware kiểm tra role nhân viên quản lý khuyến mãi
const isPromotionManager = (req, res, next) => {
    if (req.user.role !== 'promotion_manager' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
    next();
};

// Middleware kiểm tra role nhân viên quản lý thông báo
const isNotificationManager = (req, res, next) => {
    if (req.user.role !== 'notification_manager' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
    next();
};

// Middleware xác thực admin
const authenticateAdmin = [authenticateToken, isAdmin];

// Middleware xác thực customer
const authenticateCustomer = [authenticateToken, isCustomer];

// Middleware xác thực các role nhân viên
const authenticateCustomerManager = [authenticateToken, isCustomerManager];
const authenticateProductManager = [authenticateToken, isProductManager];
const authenticateOrderManager = [authenticateToken, isOrderManager];
const authenticateCouponManager = [authenticateToken, isCouponManager];
const authenticatePromotionManager = [authenticateToken, isPromotionManager];
const authenticateNotificationManager = [authenticateToken, isNotificationManager];

module.exports = {
    authenticateToken,
    authenticateAdmin,
    authenticateCustomer,
    authenticateCustomerManager,
    authenticateProductManager,
    authenticateOrderManager,
    authenticateCouponManager,
    authenticatePromotionManager,
    authenticateNotificationManager,
    isAdmin,
    isCustomer,
    isCustomerManager,
    isProductManager,
    isOrderManager,
    isCouponManager,
    isPromotionManager,
    isNotificationManager
};
