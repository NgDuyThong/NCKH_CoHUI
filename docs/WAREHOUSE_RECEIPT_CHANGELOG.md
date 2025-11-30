# Changelog - Phiếu Nhập Kho v2.0

## Ngày cập nhật: 29/11/2025

### 🎯 Mục tiêu
Cải thiện hệ thống nhập kho để hỗ trợ quản lý tồn kho theo màu sắc và size một cách chính xác và linh hoạt.

---

## 🔧 Thay đổi Backend

### 1. Models

#### ProductSizeStock.js
- ✅ **Xóa enum constraint** cho trường `size`
- ✅ **Cập nhật SKU validation** để chấp nhận mọi định dạng size
- 📝 Lý do: Hỗ trợ cả size chữ (S, M, L) và size số (28, 29, 30...)

#### ReceiptItem.js
- ✅ **Xóa**: `productBrand`, `productSpecs`, `productQuality`
- ✅ **Thêm**: `colorName` (String, required), `size` (String, required)
- ✅ **Xóa enum constraint** cho trường `size`

### 2. Controllers

#### ProductSizeStockController.js
- ✅ **Thêm method mới**: `getSizesByColorID(req, res)`
  - Endpoint: `GET /api/admin/product-size-stock/sizes/:colorID`
  - Trả về danh sách size + số lượng tồn kho hiện tại
  - Dùng cho form nhập kho để hiển thị size có sẵn

#### ReceiptController.js
- ✅ **Cập nhật logic nhập kho**:
  - Validate màu sắc tồn tại
  - Tìm ProductSizeStock theo colorID + size
  - Nếu có → Cộng thêm số lượng (UPDATE)
  - Nếu chưa có → Tạo mới (INSERT)
  - Tự động tạo SKU theo format: `productID_colorID_size_sizeStockID`

### 3. Routes

#### product-size-stock.route.js
- ✅ **Thêm route mới**: `GET /sizes/:colorID`
  - Middleware: `authenticateToken`, `isAdmin`
  - Controller: `ProductSizeStockController.getSizesByColorID`

---

## 🎨 Thay đổi Frontend

### 1. WarehouseReceipt.jsx

#### State Management
- ✅ **Thêm states**:
  - `availableSizes` - Danh sách size động từ API
  - `selectedColorID` - ID màu đang chọn
- ✅ **Xóa**: Hardcoded size array `['S', 'M', 'L', 'XL', 'XXL']`

#### Functions
- ✅ **Cập nhật `handleSelectProduct`**:
  - Load màu sắc từ API
  - Reset size khi chọn sản phẩm mới
  - Hiển thị thông báo nếu sản phẩm chưa có màu

- ✅ **Thêm `handleSelectColor`**:
  - Tìm colorID từ colorName
  - Load danh sách size từ API
  - Nếu chưa có size → Cho phép nhập size mới

- ✅ **Cập nhật `handleAddProduct`**:
  - Validate màu sắc và size
  - Reset tất cả states sau khi thêm

#### UI Components
- ✅ **Dropdown màu sắc**:
  - Hiển thị thông báo nếu chưa có màu
  - Disable khi chưa chọn sản phẩm

- ✅ **Input/Dropdown size thông minh**:
  - **Có size trong kho** → Hiển thị dropdown với số lượng tồn
  - **Chưa có size** → Hiển thị input text để nhập size mới
  - Hiển thị số lượng size có sẵn
  - Hiển thị thông báo hướng dẫn

### 2. pdfGenerator.js
- ✅ **Cập nhật tiêu đề cột**: "Tên sản phẩm, màu sắc, kích thước"
- ✅ **Cập nhật format dữ liệu**: `Tên - Màu: [màu] - Size: [size]`

---

## 📊 Luồng hoạt động mới

```
1. Chọn sản phẩm
   ↓
2. Load màu sắc (API: /api/admin/product-colors/product/:productID)
   ↓
3. Chọn màu sắc
   ↓
4. Load size (API: /api/admin/product-size-stock/sizes/:colorID)
   ↓
5a. Nếu có size → Chọn từ dropdown (hiển thị tồn kho)
5b. Nếu chưa có → Nhập size mới
   ↓
6. Nhập số lượng + đơn giá
   ↓
7. Thêm vào phiếu
   ↓
8. Lưu phiếu → Backend tự động tạo/cập nhật ProductSizeStock
```

---

## ✅ Lợi ích

1. **Linh hoạt**: Hỗ trợ mọi loại size (chữ, số, custom)
2. **Chính xác**: Tự động cập nhật tồn kho theo đúng màu + size
3. **Thông minh**: Hiển thị số lượng tồn kho hiện tại
4. **Dễ sử dụng**: UI tự động điều chỉnh theo dữ liệu có sẵn
5. **Mở rộng**: Dễ dàng thêm size mới mà không cần sửa code

---

## 🧪 Test Cases

### TC1: Nhập sản phẩm mới (chưa có trong kho)
- Input: Sản phẩm A, Màu Đỏ, Size 28, SL: 10
- Expected: Tạo mới ProductSizeStock với stock = 10

### TC2: Nhập thêm sản phẩm đã có
- Hiện tại: Sản phẩm A, Màu Đỏ, Size 28, Stock: 5
- Input: Sản phẩm A, Màu Đỏ, Size 28, SL: 10
- Expected: Cập nhật stock = 5 + 10 = 15

### TC3: Nhập sản phẩm cùng màu khác size
- Hiện tại: Sản phẩm A, Màu Đỏ, Size 28, Stock: 15
- Input: Sản phẩm A, Màu Đỏ, Size 29, SL: 8
- Expected: Tạo mới ProductSizeStock cho size 29 với stock = 8

### TC4: Sản phẩm chưa có màu
- Input: Chọn sản phẩm chưa có màu
- Expected: Hiển thị thông báo "Sản phẩm này chưa có màu sắc nào"

### TC5: Màu chưa có size
- Input: Chọn màu chưa có size nào
- Expected: Hiển thị input text để nhập size mới

---

## 📝 Migration Notes

### Dữ liệu cũ
Nếu có dữ liệu ReceiptItem cũ với `productBrand`, `productSpecs`, `productQuality`:
- Dữ liệu cũ vẫn tồn tại trong database
- Không ảnh hưởng đến phiếu đã tạo trước đó
- Phiếu mới sẽ sử dụng `colorName` và `size`

### Khuyến nghị
- Backup database trước khi deploy
- Test kỹ trên môi trường staging
- Đảm bảo tất cả sản phẩm đã có màu sắc trước khi nhập kho

---

## 🔗 Files Changed

### Backend
- `server/models/ProductSizeStock.js`
- `server/models/ReceiptItem.js`
- `server/controllers/ProductSizeStockController.js`
- `server/controllers/ReceiptController.js`
- `server/routes/product-size-stock.route.js`

### Frontend
- `client/src/pages/admin/WarehouseReceipt.jsx`
- `client/src/utils/pdfGenerator.js`

### Documentation
- `docs/WAREHOUSE_RECEIPT_UPDATE.md`
- `docs/WAREHOUSE_RECEIPT_CHANGELOG.md` (new)
