const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/FavoriteController');

// Tất cả routes đã được áp dụng authenticateCustomer ở server.js
// Không cần thêm middleware ở đây

// Routes cho danh sách yêu thích
// Lưu ý: Đặt các routes cụ thể trước các routes có param động để tránh conflict
router.get('/', FavoriteController.getFavorites); // Lấy danh sách yêu thích của user
router.post('/add', FavoriteController.addToFavorites); // Thêm sản phẩm vào yêu thích
router.get('/check/:SKU', FavoriteController.checkFavorite); // Kiểm tra với param (phải đặt trước /:SKU)
router.put('/:id', FavoriteController.updateFavorite); // Cập nhật ghi chú
router.delete('/:SKU', FavoriteController.removeFromFavorites); // Xóa khỏi yêu thích

module.exports = router;
