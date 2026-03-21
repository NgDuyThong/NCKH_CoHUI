const express = require('express');
const router = express.Router();
const multer = require('multer');
const ProductController = require('../controllers/ProductController');
const { authenticateToken, isAdmin, authenticateProductManager } = require('../middlewares/auth.middleware');
const { uploadFile, getImageLink } = require('../middlewares/ImagesCloudinary_Controller');

// Cấu hình multer để lưu file tạm thời
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/uploadPendingImages/');
    },
    filename: function (req, file, cb) {
        // Tạo chuỗi ngẫu nhiên 5 ký tự
        const randomString = Math.random().toString(36).substring(2, 7);
        cb(null, randomString);
    }
});
const upload = multer({ storage: storage });

//!ADMIN & PRODUCT MANAGER - UPLOAD ẢNH
router.post('/upload-images', 
    authenticateProductManager, 
    upload.array('images'), 
    async (req, res) => {
        try {
            console.log('[UPLOAD] Received upload request from:', req.user?.email);
            console.log('[UPLOAD] Files count:', req.files?.length);
            
            const files = req.files;
            
            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có file nào được upload'
                });
            }
            
            const imageUrls = [];
            
            // Upload từng file lên Cloudinary
            for (const file of files) {
                console.log(`[UPLOAD] Uploading file: ${file.originalname}`);
                const publicId = await uploadFile(file.path);
                const imageUrl = await getImageLink(publicId);
                imageUrls.push(imageUrl); // Trả về URL để hiển thị
                console.log(`[UPLOAD] Uploaded: ${publicId} -> ${imageUrl}`);
            }

            console.log(`[UPLOAD] ✅ Successfully uploaded ${imageUrls.length} images`);
            
            res.json({
                success: true,
                imageUrls, // Array các URL
                message: `Đã upload ${imageUrls.length} ảnh thành công`
            });
        } catch (error) {
            console.error('[UPLOAD] ❌ Error uploading images:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi upload ảnh: ' + error.message
            });
        }
    }
);

//!ADMIN - DASHBOARD
router.get('/all-by-categories', ProductController.getAllProductsByCategories);

//!ADMIN & PRODUCT MANAGER - PRODUCT MANAGEMENT (Phải đặt TRƯỚC các route customer)
router.get('/admin', authenticateProductManager, ProductController.getProductsChoADMIN); // Lấy danh sách
router.get('/admin/:id', authenticateProductManager, ProductController.getProductByIdChoADMIN); // Lấy chi tiết
router.put('/admin/update/:id', authenticateProductManager, ProductController.updateProduct); // Cập nhật
router.post('/admin/create', authenticateProductManager, ProductController.createProduct); // Tạo
router.delete('/admin/delete/:id', authenticateProductManager, ProductController.deleteProduct); // Xóa
router.patch('/admin/toggle/:id', authenticateProductManager, ProductController.toggleProductStatus); // Bật tắt vô hiệu hoá

//?CUSTOMER - HOMEPAGE (Đặt SAU các route admin để tránh conflict)
router.get('/', ProductController.getProducts);
router.get('/basic', ProductController.getAllProductsBasicInfo);
router.get('/gender', ProductController.getProductsByGender);
router.get('/category/:categoryID', ProductController.getProductsByCategory);
router.get('/:id', ProductController.getProductById);

module.exports = router;
