const express = require('express');
const router = express.Router();
const userNotificationController = require('../controllers/UserNotificationController');

// Tất cả routes đã được áp dụng authenticateCustomer ở server.js

router.get('/', userNotificationController.getNotifications);// Lấy danh sách thông báo của user
router.put('/:userNotificationID/read', userNotificationController.markAsRead);// Đánh dấu thông báo đã đọc
router.put('/read-all', userNotificationController.markAllAsRead);// Đánh dấu tất cả thông báo đã đọc
router.get('/unread/count', userNotificationController.getUnreadCount);// Lấy số lượng thông báo chưa đọc

module.exports = router;
