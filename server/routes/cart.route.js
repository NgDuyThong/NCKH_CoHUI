const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');

// Tất cả routes đã được áp dụng authenticateCustomer ở server.js

// Routes cho giỏ hàng
router.get('/', CartController.getCart); // Lấy giỏ hàng của user
router.post('/add-combo', CartController.addComboToCart); // Thêm combo vào giỏ hàng
router.post('/add', CartController.addToCart); // Thêm sản phẩm vào giỏ
router.put('/:id', CartController.updateCartItem); // Cập nhật số lượng sản phẩm
router.delete('/:id', CartController.removeFromCart); // Xóa sản phẩm khỏi giỏ
router.delete('/', CartController.clearCart); // Xóa toàn bộ giỏ hàng

module.exports = router;
