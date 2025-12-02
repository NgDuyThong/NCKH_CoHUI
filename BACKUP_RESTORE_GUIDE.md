# 🔐 HỆ THỐNG BACKUP & RESTORE - TVT STORE

## 📋 TỔNG QUAN

Hệ thống Backup & Restore được xây dựng chuyên nghiệp cho phép:
- **Sao lưu dữ liệu** toàn bộ hoặc từng phần
- **Khôi phục dữ liệu** từ file backup
- **Quản lý backup** (download, xóa, xem lịch sử)
- **Giám sát hệ thống** (thống kê collections, documents)

---

## 🗂️ CẤU TRÚC DỮ LIỆU BACKUP

### **Collections được backup (19 collections):**

#### **1. CORE (Dữ liệu cốt lõi) - Priority 1-3**
- `users` - Người dùng (admin, customer, nhân viên)
- `categories` - Danh mục sản phẩm
- `products` - Sản phẩm
- `productcolors` - Màu sắc sản phẩm
- `productsizestocks` - Kho size sản phẩm

#### **2. TRANSACTION (Giao dịch) - Priority 4**
- `orders` - Đơn hàng
- `orderdetails` - Chi tiết đơn hàng
- `receipts` - Phiếu nhập kho
- `receiptitems` - Chi tiết phiếu nhập

#### **3. USER_DATA (Dữ liệu người dùng) - Priority 5**
- `carts` - Giỏ hàng
- `favorites` - Yêu thích
- `addresses` - Địa chỉ
- `reviews` - Đánh giá sản phẩm

#### **4. MARKETING (Tiếp thị) - Priority 6**
- `coupons` - Mã giảm giá
- `usercoupons` - Mã giảm giá của user
- `promotions` - Khuyến mãi
- `targets` - Mục tiêu bán hàng

#### **5. SYSTEM (Hệ thống) - Priority 7**
- `notifications` - Thông báo
- `usernotifications` - Thông báo của user

---

## 🚀 CHỨC NĂNG

### **1. Full Backup (Backup toàn bộ)**
```
POST /api/admin/backup/create-full
```
- Sao lưu **TẤT CẢ 19 collections**
- Bao gồm toàn bộ dữ liệu hệ thống
- File size: ~40-50 MB (tùy dữ liệu)
- Format: `.zip` chứa 19 file JSON + metadata

**Khi nào dùng:**
- Backup định kỳ hàng tuần/tháng
- Trước khi update hệ thống lớn
- Trước khi migrate database
- Backup toàn diện nhất

### **2. Partial Backup (Backup từng phần)**
```
POST /api/admin/backup/create-partial
```
- Chỉ sao lưu **dữ liệu CORE + TRANSACTION** (9 collections)
- Loại bỏ: cart, favorite, reviews, marketing, notifications
- File size: ~15-25 MB
- Nhanh hơn, nhẹ hơn Full Backup

**Khi nào dùng:**
- Backup hàng ngày
- Chỉ cần backup dữ liệu quan trọng
- Tiết kiệm dung lượng
- Backup nhanh

### **3. Restore (Khôi phục)**
```
POST /api/admin/backup/restore
Content-Type: multipart/form-data
Body: { backupFile: File }
```
- Upload file `.zip` backup
- Tự động giải nén và validate
- Xóa dữ liệu cũ → Insert dữ liệu mới
- Restore theo thứ tự priority (1→7)

**Quy trình:**
1. Upload file backup
2. Xác nhận (cảnh báo ghi đè)
3. Hệ thống giải nén
4. Đọc metadata
5. Restore từng collection
6. Xóa file tạm
7. Thông báo kết quả

### **4. Quản lý Backup**

#### **Danh sách backup:**
```
GET /api/admin/backup/list
```
Response:
```json
{
  "success": true,
  "backups": [
    {
      "id": "backup_full_2024-12-02T14-30-00.zip",
      "name": "backup_full_2024-12-02T14-30-00.zip",
      "type": "full",
      "size": "45.2 MB",
      "size_bytes": 47412345,
      "created_at": "2024-12-02T14:30:00.000Z",
      "modified_at": "2024-12-02T14:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### **Download backup:**
```
GET /api/admin/backup/download/:filename
```
- Download file backup về máy
- Stream file để tối ưu memory

#### **Xóa backup:**
```
DELETE /api/admin/backup/delete/:filename
```
- Xóa file backup khỏi server
- Xác nhận trước khi xóa

### **5. Thông tin hệ thống**
```
GET /api/admin/backup/system-info
```
Response:
```json
{
  "success": true,
  "system": {
    "database": "TVTStore",
    "total_collections": 19,
    "total_documents": 15432,
    "collections": [
      {
        "name": "users",
        "category": "core",
        "priority": 1,
        "documents": 150
      }
    ],
    "backup_storage": {
      "total_backups": 5,
      "total_size": "200 MB",
      "backup_directory": "/path/to/backups"
    }
  }
}
```

---

## 📦 CẤU TRÚC FILE BACKUP

### **File .zip chứa:**
```
backup_full_2024-12-02T14-30-00.zip
├── metadata.json           # Thông tin backup
├── users.json             # Collection users
├── categories.json        # Collection categories
├── products.json          # Collection products
├── productcolors.json
├── productsizestocks.json
├── orders.json
├── orderdetails.json
├── receipts.json
├── receiptitems.json
├── carts.json
├── favorites.json
├── addresses.json
├── reviews.json
├── coupons.json
├── usercoupons.json
├── promotions.json
├── targets.json
├── notifications.json
└── usernotifications.json
```

### **metadata.json:**
```json
{
  "type": "full",
  "created_at": "2024-12-02T14:30:00.000Z",
  "version": "1.0",
  "database": "TVTStore",
  "total_collections": 19,
  "total_documents": 15432,
  "total_size_bytes": 47412345,
  "included_categories": ["core", "transaction", "user_data", "marketing", "system"]
}
```

---

## 🔧 SETUP & CÀI ĐẶT

### **Backend Dependencies:**
```bash
npm install archiver extract-zip multer
```

### **Thư mục:**
```
server/
├── backups/          # Lưu file backup
│   ├── temp/        # Temp khi restore
│   └── .gitignore
├── controllers/
│   └── BackupController.js
└── routes/
    └── backup.route.js
```

### **Environment:**
```env
MONGODB_URI=mongodb+srv://...
```

### **Routes trong server.js:**
```javascript
const backupRoutes = require('./routes/backup.route');
app.use('/api/admin/backup', ...authenticateAdmin, backupRoutes);
```

---

## 🎨 GIAO DIỆN ADMIN

### **Trang /admin/backup:**

#### **Section 1: Tạo Backup**
- Radio buttons: Full / Partial
- Button "Tạo Backup Ngay"
- Loading state khi đang backup

#### **Section 2: Restore**
- Drag & drop zone upload file
- Preview file đã chọn
- Button "Khôi Phục Dữ Liệu"
- Warning box cảnh báo

#### **Section 3: Lịch Sử Backup**
- Table danh sách backup
- Columns: Tên, Loại, Size, Ngày, Trạng thái, Actions
- Actions: Download, Delete
- Auto-refresh

---

## 🔐 BẢO MẬT

### **Authentication:**
- **Role-based:** Chỉ `admin` mới truy cập được
- Middleware: `authenticateAdmin`
- JWT token validation

### **File Upload:**
- Max size: 100MB
- Allowed extensions: `.zip`, `.sql`
- Sanitize filename
- Temp folder cleanup

### **Validation:**
- Kiểm tra metadata
- Validate backup version
- Error handling mọi bước

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **1. Trước khi Restore:**
- ✅ **LUÔN LUÔN** backup trước khi restore
- ✅ Kiểm tra kỹ file backup
- ✅ Xác nhận đúng file cần restore
- ✅ Thông báo cho users (nếu production)

### **2. Downtime:**
- Restore sẽ **xóa toàn bộ dữ liệu hiện tại**
- Nên thực hiện vào **lúc ít traffic**
- Ước tính thời gian: 1-5 phút (tùy dữ liệu)

### **3. Storage:**
- Backup files lưu tại `server/backups/`
- Nên backup ra external storage (S3, Google Drive...)
- Cleanup định kỳ các backup cũ

### **4. Monitoring:**
- Check disk space thường xuyên
- Log mọi thao tác backup/restore
- Alert khi backup thất bại

---

## 📊 BEST PRACTICES

### **Lịch trình Backup khuyến nghị:**

| Loại | Tần suất | Thời gian | Retention |
|------|----------|-----------|-----------|
| **Partial** | Hàng ngày | 2:00 AM | 7 ngày |
| **Full** | Hàng tuần | Chủ nhật 1:00 AM | 4 tuần |
| **Full** | Hàng tháng | Ngày 1 hàng tháng | 12 tháng |

### **Automation (Tương lai):**
```javascript
// Cron job backup tự động
const cron = require('node-cron');

// Backup partial mỗi ngày lúc 2:00 AM
cron.schedule('0 2 * * *', async () => {
  await BackupController.createPartialBackup();
});

// Backup full mỗi Chủ nhật lúc 1:00 AM
cron.schedule('0 1 * * 0', async () => {
  await BackupController.createFullBackup();
});
```

---

## 🐛 TROUBLESHOOTING

### **Lỗi thường gặp:**

#### **1. "File quá lớn"**
- Tăng `fileSize` limit trong multer
- Compress file trước khi upload

#### **2. "Thiếu metadata"**
- File backup bị hỏng
- Download lại từ source

#### **3. "Version không tương thích"**
- Backup từ version cũ
- Cần migrate script

#### **4. "Restore thất bại"**
- Check MongoDB connection
- Check disk space
- Check permissions

---

## 📈 FUTURE ENHANCEMENTS

- [ ] **Cloud Backup:** Tự động upload lên S3/Google Drive
- [ ] **Scheduled Backup:** Cron jobs tự động
- [ ] **Incremental Backup:** Chỉ backup thay đổi
- [ ] **Backup Encryption:** Mã hóa file backup
- [ ] **Email Notifications:** Thông báo khi backup xong
- [ ] **Backup Verification:** Tự động test restore
- [ ] **Multi-region Backup:** Backup nhiều vùng địa lý
- [ ] **Compression Optimization:** Nén tốt hơn

---

## 👨‍💻 DEVELOPER NOTES

### **Code Structure:**
- **Controller:** `BackupController.js` - Business logic
- **Routes:** `backup.route.js` - API endpoints
- **Frontend:** `BackupRestore.jsx` - UI component

### **Key Technologies:**
- **archiver:** Nén file thành ZIP
- **extract-zip:** Giải nén ZIP
- **multer:** Upload file handling
- **mongoose:** MongoDB ODM

### **Testing:**
1. Test Full Backup
2. Test Partial Backup
3. Test Restore (với file backup test)
4. Test Download
5. Test Delete
6. Test với data lớn (>100k documents)

---

## 📞 SUPPORT

Nếu có vấn đề hoặc câu hỏi:
1. Check logs tại `server/logs/`
2. Check disk space
3. Check MongoDB connection
4. Review metadata file
5. Contact admin team

---

**Version:** 1.0  
**Last Updated:** 02/12/2024  
**Author:** TVT Store Development Team
