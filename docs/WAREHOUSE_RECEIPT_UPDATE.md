# Cập nhật Phiếu Nhập Kho - Màu Sắc và Size

## Tổng quan thay đổi

Phiếu nhập kho đã được cập nhật để sử dụng **Màu sắc** và **Size** thay vì "Nhãn hiệu, Quy cách, Phẩm chất".

## Các thay đổi chính

### 1. Model ReceiptItem
- **Đã xóa**: `productBrand`, `productSpecs`, `productQuality`
- **Đã thêm**: 
  - `colorName` (String, required) - Tên màu sắc
  - `size` (String, required) - Kích thước (hỗ trợ cả size chữ: S, M, L và size số: 28, 29, 30...)
- **ĐVT**: Mặc định là "Cái" (không thể thay đổi)

### 1.1. Model ProductSizeStock
- **Đã cập nhật**: Xóa enum constraint cho trường `size`
- **Lý do**: Hỗ trợ linh hoạt cả size chữ (S, M, L, XL, XXL) và size số (28, 29, 30, 31, 32...)
- **SKU validation**: Cập nhật regex để chấp nhận mọi định dạng size

### 2. Logic nhập kho
Khi tạo phiếu nhập kho, hệ thống sẽ:

1. **Kiểm tra màu sắc**: Tìm màu sắc theo `colorName` và `productID`
2. **Tìm hoặc tạo ProductSizeStock**:
   - Nếu đã tồn tại variant (màu + size): **Tăng số lượng tồn kho**
   - Nếu chưa tồn tại: **Tạo mới** với số lượng từ phiếu nhập
3. **Lưu ReceiptItem**: Ghi lại thông tin nhập kho

### 3. Giao diện nhập kho

#### Form nhập hàng hóa:
- **Chọn sản phẩm** → Tự động load danh sách màu sắc từ API
- **Chọn màu sắc** (bắt buộc) → Dropdown với các màu có sẵn, tự động load size khi chọn màu
- **Chọn size** (bắt buộc):
  - Dropdown luôn hiển thị với 2 loại option:
    - Size có sẵn trong kho (hiển thị số lượng tồn)
    - "➕ Nhập size mới..." (luôn có)
  - Khi chọn "Nhập size mới" → Hiển thị input text để nhập
  - Nếu màu chưa có size → Tự động chọn "Nhập size mới"
- **ĐVT**: Hiển thị "Cái" (read-only)

#### Tính năng thông minh:
- Tự động phát hiện size đã tồn tại trong kho
- Hiển thị số lượng tồn kho hiện tại cho mỗi size
- **Luôn cho phép thêm size mới** ngay cả khi đã có size khác
- Tự động chọn "Nhập size mới" nếu màu chưa có size
- Validate màu sắc phải tồn tại trước khi nhập kho

#### Bảng hàng hóa đã thêm:
- Hiển thị: `Tên sản phẩm - Màu: [màu] - Size: [size]`

### 4. Xuất PDF
- Cột tiêu đề: "Tên sản phẩm, màu sắc, kích thước"
- Nội dung: `Tên - Màu: [màu] - Size: [size]`

## Ví dụ sử dụng

### Trường hợp 1: Nhập sản phẩm mới (chưa có trong kho)
```
Sản phẩm: Áo thun nam
Màu: Vàng
Size: M
Số lượng: 10

→ Tạo mới ProductSizeStock với stock = 10
```

### Trường hợp 2: Nhập thêm sản phẩm đã có
```
Trong kho: Áo thun nam - Vàng - M: 3 cái

Nhập thêm:
Sản phẩm: Áo thun nam
Màu: Vàng
Size: M
Số lượng: 10

→ Cập nhật ProductSizeStock: stock = 3 + 10 = 13
```

### Trường hợp 3: Nhập sản phẩm cùng màu khác size
```
Trong kho: Áo thun nam - Vàng - M: 13 cái

Nhập thêm:
Sản phẩm: Áo thun nam
Màu: Vàng
Size: L
Số lượng: 5

→ Tạo mới ProductSizeStock cho size L với stock = 5
```

## API Endpoints

### Lấy màu sắc của sản phẩm
```
GET /api/admin/product-colors/product/:productID
Response: {
  success: true,
  data: [
    { colorID, colorName, images, ... }
  ]
}
```

### Lấy danh sách size theo màu (MỚI)
```
GET /api/admin/product-size-stock/sizes/:colorID
Response: {
  success: true,
  data: [
    { size: "28", currentStock: 5 },
    { size: "29", currentStock: 3 },
    { size: "30", currentStock: 0 }
  ]
}
```

### Tạo phiếu nhập kho
```
POST /api/receipts
Body: {
  receiptNumber, receiptDate, supplierName, ...
  items: [
    {
      productID, productCode, productName,
      colorName, size,  // Bắt buộc
      actualQuantity, unitPrice, ...
    }
  ]
}
```

## Validation

- `colorName`: Phải tồn tại trong ProductColor của sản phẩm
- `size`: Chuỗi không rỗng, hỗ trợ mọi định dạng (S, M, L, 28, 29, 30...)
- `actualQuantity`: Phải > 0
- `unitPrice`: Phải > 0

## Lưu ý quan trọng

1. **Ràng buộc dữ liệu**: Hệ thống tự động kiểm tra và tạo/cập nhật stock
2. **Không thể nhập kho** nếu màu sắc chưa được tạo cho sản phẩm
3. **ĐVT luôn là "Cái"**: Không thể thay đổi
4. **Tự động tính toán**: Thành tiền = Số lượng × Đơn giá
5. **Size linh hoạt**: Hỗ trợ cả size chữ (S, M, L) và size số (28, 29, 30...) tùy theo loại sản phẩm
6. **Load động**: Danh sách size được load từ database, không hardcode
7. **Tạo size mới**: Nếu màu chưa có size nào, có thể nhập size mới trực tiếp

## Quy trình nhập kho chi tiết

1. **Chọn sản phẩm** → Hệ thống load danh sách màu sắc
2. **Chọn màu** → Hệ thống load danh sách size đã có (nếu có)
3. **Chọn/Nhập size**:
   - Nếu có size → Chọn từ dropdown (hiển thị số lượng tồn)
   - Nếu chưa có → Nhập size mới vào ô input
4. **Nhập số lượng và đơn giá**
5. **Thêm vào phiếu** → Hệ thống validate và thêm vào danh sách
6. **Lưu phiếu** → Hệ thống tự động:
   - Tìm ProductSizeStock theo colorID + size
   - Nếu có → Cộng thêm số lượng
   - Nếu chưa có → Tạo mới ProductSizeStock
