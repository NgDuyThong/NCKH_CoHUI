const express = require('express');
const router = express.Router();
const ReceiptController = require('../controllers/ReceiptController');
const { authenticateProductManager } = require('../middlewares/auth.middleware');

// Tất cả routes đều cần authenticate Product Manager (hoặc Admin)
// Lấy danh sách sản phẩm để chọn cho form nhập kho
router.get('/products', ...authenticateProductManager, ReceiptController.getProductsForReceipt);

// Tạo phiếu nhập kho mới
router.post('/', ...authenticateProductManager, ReceiptController.createReceipt);

// Lấy danh sách phiếu nhập kho
router.get('/', ...authenticateProductManager, ReceiptController.getReceipts);

// Lấy chi tiết phiếu nhập kho
router.get('/:id', ...authenticateProductManager, ReceiptController.getReceiptById);

// Lấy thông tin phiếu để xuất PDF
router.get('/:id/pdf', ...authenticateProductManager, ReceiptController.getReceiptForPDF);

module.exports = router;

