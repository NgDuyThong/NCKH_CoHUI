# Hướng dẫn Debug Phiếu Nhập Kho

## Các lỗi thường gặp và cách khắc phục

### 1. Lỗi 500 khi load màu sắc

**Triệu chứng:**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
:5000/api/admin/prod_colors/product/33:1
Error loading colors: AxiosError
```

**Nguyên nhân:**
- API endpoint sai
- ProductID không tồn tại
- Lỗi trong controller

**Cách khắc phục:**
1. Kiểm tra console log server để xem lỗi chi tiết
2. Verify productID có tồn tại trong database không
3. Kiểm tra route mounting trong `server/server.js`

**API đúng:**
```
GET /api/admin/product-colors/product/:productID
```

### 2. Dropdown màu sắc trống

**Nguyên nhân:**
- Sản phẩm chưa có màu sắc nào
- API trả về format sai
- Lỗi khi parse response

**Cách khắc phục:**
1. Mở "Quản lý Màu & Size" trong ProductManagement
2. Thêm màu sắc cho sản phẩm
3. Kiểm tra response format: `{ success: true, data: [...] }`

### 3. Dropdown size trống

**Nguyên nhân:**
- Màu chưa có size nào (bình thường, có thể nhập size mới)
- Lỗi API getSizesByColorID

**Cách khắc phục:**
- Nếu màu chưa có size → Nhập size mới vào ô input
- Nếu lỗi API → Kiểm tra console log

### 4. Lỗi khi lưu phiếu nhập kho

**Triệu chứng:**
```
Không tìm thấy màu "Xanh dương đậm" cho sản phẩm ...
```

**Nguyên nhân:**
- Tên màu không khớp (case-sensitive đã được fix)
- Màu không tồn tại trong database

**Cách khắc phục:**
1. Kiểm tra tên màu trong database
2. Đảm bảo tên màu khớp chính xác
3. Hệ thống đã hỗ trợ case-insensitive matching

---

## Logging và Debug

### Server-side logs

Khi tạo phiếu nhập kho, server sẽ log:

```
[RECEIPT] Tìm thấy màu: Xanh dương đậm (ID: 123)
[RECEIPT] Cập nhật stock: 5 + 10 = 15 (SKU: 33_123_28_456)
```

hoặc

```
[RECEIPT] Tạo mới ProductSizeStock: SKU=33_123_29_457, stock=10
```

### Client-side logs

Khi chọn sản phẩm và màu:

```
[CLIENT] Loading colors for productID: 33
[CLIENT] Colors response: { success: true, data: [...] }
[CLIENT] Loading sizes for colorID: 123
[CLIENT] Sizes response: { success: true, data: [...] }
```

---

## Checklist trước khi nhập kho

- [ ] Sản phẩm đã được tạo
- [ ] Sản phẩm đã có ít nhất 1 màu sắc
- [ ] Màu sắc có hình ảnh
- [ ] (Tùy chọn) Màu đã có size trong kho

---

## Test Cases

### TC1: Nhập sản phẩm có màu nhưng chưa có size

**Bước thực hiện:**
1. Chọn sản phẩm "Dapper Jeans"
2. Chọn màu "Xanh dương đậm"
3. Nhập size mới: "28"
4. Nhập số lượng: 10
5. Lưu phiếu

**Kết quả mong đợi:**
- Tạo mới ProductSizeStock với size 28, stock 10
- Hiển thị thông báo thành công

### TC2: Nhập thêm sản phẩm đã có trong kho

**Điều kiện:**
- Sản phẩm "Dapper Jeans", màu "Xanh dương đậm", size 28 đã có stock = 10

**Bước thực hiện:**
1. Chọn sản phẩm "Dapper Jeans"
2. Chọn màu "Xanh dương đậm"
3. Chọn size "28" từ dropdown (hiển thị: Tồn kho: 10)
4. Nhập số lượng: 5
5. Lưu phiếu

**Kết quả mong đợi:**
- Cập nhật stock: 10 + 5 = 15
- Hiển thị thông báo thành công

### TC3: Sản phẩm chưa có màu

**Bước thực hiện:**
1. Chọn sản phẩm chưa có màu

**Kết quả mong đợi:**
- Hiển thị thông báo: "Sản phẩm này chưa có màu sắc nào"
- Dropdown màu sắc trống
- Không thể tiếp tục nhập kho

---

## API Endpoints

### 1. Lấy danh sách sản phẩm
```
GET /api/receipts/products?search=
Response: {
  success: true,
  data: [
    {
      productID, productCode, name, price, unit
    }
  ]
}
```

### 2. Lấy màu sắc của sản phẩm
```
GET /api/admin/product-colors/product/:productID
Response: {
  success: true,
  data: [
    {
      colorID, productID, colorName, images, sizes: [...]
    }
  ]
}
```

### 3. Lấy size theo màu
```
GET /api/admin/product-size-stock/sizes/:colorID
Response: {
  success: true,
  data: [
    { size: "28", currentStock: 10 },
    { size: "29", currentStock: 5 }
  ]
}
```

### 4. Tạo phiếu nhập kho
```
POST /api/receipts
Body: {
  receiptNumber, receiptDate, supplierName, warehouse, ...
  items: [
    {
      productID, productCode, productName,
      colorName, size,
      actualQuantity, unitPrice, ...
    }
  ]
}
Response: {
  success: true,
  message: "Tạo phiếu nhập kho thành công",
  data: { receipt, items }
}
```

---

## Troubleshooting Commands

### Kiểm tra sản phẩm có màu không
```javascript
// MongoDB
db.product_colors.find({ productID: 33 })
```

### Kiểm tra màu có size không
```javascript
// MongoDB
db.product_sizes_stocks.find({ colorID: 123 })
```

### Kiểm tra phiếu nhập kho
```javascript
// MongoDB
db.receipts.find().sort({ createdAt: -1 }).limit(1)
db.receiptItems.find({ receiptID: ObjectId("...") })
```

---

## Lưu ý quan trọng

1. **Luôn thêm màu trước khi nhập kho**
2. **Size có thể nhập mới** nếu chưa có
3. **Tên màu không phân biệt hoa thường** (case-insensitive)
4. **ĐVT luôn là "Cái"** - không thể thay đổi
5. **Kiểm tra console log** để debug chi tiết
