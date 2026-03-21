const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BackupController = require('../controllers/BackupController');

// Đảm bảo thư mục temp tồn tại
const tempDir = path.join(__dirname, '../backups/temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Cấu hình multer để upload file backup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `restore_${timestamp}_${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.zip', '.sql'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file .zip hoặc .sql'));
        }
    }
});

// Routes - Tất cả đã được áp dụng authenticateAdmin ở server.js

// Lấy thông tin hệ thống
router.get('/system-info', (req, res) => BackupController.getSystemInfo(req, res));

// Lấy danh sách backup
router.get('/list', (req, res) => BackupController.getBackupList(req, res));

// Tạo full backup
router.post('/create-full', (req, res) => BackupController.createFullBackup(req, res));

// Tạo partial backup
router.post('/create-partial', (req, res) => BackupController.createPartialBackup(req, res));

// Restore backup
router.post('/restore', upload.single('backupFile'), (req, res) => BackupController.restoreBackup(req, res));

// Download backup
router.get('/download/:filename', (req, res) => BackupController.downloadBackup(req, res));

// Xóa backup
router.delete('/delete/:filename', (req, res) => BackupController.deleteBackup(req, res));

module.exports = router;
