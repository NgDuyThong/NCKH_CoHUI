# Test Cases - Phiếu Nhập Kho

## Test Case 1: Nhập size mới cho màu đã có size

### Điều kiện ban đầu:
- Sản phẩm: Dapper Jeans (SP0033)
- Màu: Xanh dương đậm
- Size hiện có: S (Tồn kho: 0)

### Các bước test:

1. **Chọn sản phẩm**
   - Tìm kiếm: "Dapper Jeans"
   - Chọn: "SP0033 - Dapper Jeans - Quần Jeans Regular fit"
   - ✅ Kiểm tra: Dropdown màu sắc được load

2. **Chọn màu**
   - Chọn: "Xanh dương đậm"
   - ✅ Kiểm tra: Dropdown size hiển thị:
     - "-- Chọn size --"
     - "S (Tồn kho: 0)"
     - "➕ Nhập size mới..."

3. **Chọn "Nhập size mới"**
   - Chọn: "➕ Nhập size mới..."
   - ✅ Kiểm tra: 
     - Input text xuất hiện bên dưới dropdown
     - Input có placeholder: "Nhập size mới (VD: 28, 29, 30, M, L, XL...)"
     - Input được focus tự động

4. **Nhập size**
   - Nhập: "28"
   - ✅ Kiểm tra: Giá trị "28" xuất hiện trong input

5. **Nhập số lượng và đơn giá**
   - Số lượng thực nhập: 15
   - Đơn giá: 595000
   - ✅ Kiểm tra: Thành tiền tự động tính = 8,925,000 đ

6. **Thêm vào phiếu**
   - Nhấn: "Thêm hàng hóa"
   - ✅ Kiểm tra:
     - Toast hiển thị: "Đã thêm hàng hóa vào phiếu"
     - Sản phẩm xuất hiện trong bảng với thông tin:
       - Tên: "Dapper Jeans - Quần Jeans Regular fit - Màu: Xanh dương đậm - Size: 28"
       - Số lượng: 15
       - Đơn giá: 595,000 đ
       - Thành tiền: 8,925,000 đ

7. **Lặp lại cho size 29**
   - Chọn lại sản phẩm và màu
   - Chọn "➕ Nhập size mới..."
   - Nhập: "29"
   - Số lượng: 12
   - Thêm vào phiếu
   - ✅ Kiểm tra: Có 2 dòng trong bảng

8. **Lưu phiếu**
   - Điền thông tin chứng từ
   - Nhấn: "Lưu phiếu nhập kho"
   - ✅ Kiểm tra:
     - Toast: "Tạo phiếu nhập kho thành công"
     - Console server log:
       ```
       [RECEIPT] Tìm thấy màu: Xanh dương đậm (ID: ...)
       [RECEIPT] Tạo mới ProductSizeStock: SKU=33_..._28_..., stock=15
       [RECEIPT] Tạo mới ProductSizeStock: SKU=33_..._29_..., stock=12
       ```

9. **Verify trong database**
   - Kiểm tra ProductSizeStock:
     - Size 28: stock = 15
     - Size 29: stock = 12
   - Kiểm tra ReceiptItem:
     - 2 items với colorName="Xanh dương đậm", size="28" và "29"

### Kết quả mong đợi:
✅ PASS - Có thể thêm size mới cho màu đã có size khác

---

## Test Case 2: Nhập size có sẵn (cập nhật stock)

### Điều kiện ban đầu:
- Sản phẩm: Dapper Jeans (SP0033)
- Màu: Xanh dương đậm
- Size hiện có: 28 (Tồn kho: 15)

### Các bước test:

1. Chọn sản phẩm và màu
2. Dropdown size hiển thị:
   - "28 (Tồn kho: 15)"
   - "➕ Nhập size mới..."
3. Chọn: "28 (Tồn kho: 15)"
4. Nhập số lượng: 10
5. Thêm vào phiếu
6. Lưu phiếu

### Kết quả mong đợi:
- Console log: `[RECEIPT] Cập nhật stock: 15 + 10 = 25`
- Database: Size 28 stock = 25
✅ PASS

---

## Test Case 3: Màu chưa có size (tự động chọn "Nhập size mới")

### Điều kiện ban đầu:
- Sản phẩm: Áo thun nam
- Màu: Đỏ (chưa có size nào)

### Các bước test:

1. Chọn sản phẩm: "Áo thun nam"
2. Chọn màu: "Đỏ"
3. ✅ Kiểm tra:
   - Dropdown tự động chọn "➕ Nhập size mới..."
   - Input text tự động xuất hiện
   - Thông báo: "Màu này chưa có size nào. Chọn 'Nhập size mới' để tạo."
4. Nhập size: "M"
5. Nhập số lượng: 20
6. Thêm vào phiếu
7. Lưu phiếu

### Kết quả mong đợi:
- Tạo mới ProductSizeStock cho màu "Đỏ", size "M", stock 20
✅ PASS

---

## Test Case 4: Chuyển đổi giữa size có sẵn và size mới

### Các bước test:

1. Chọn sản phẩm và màu (có size S)
2. Chọn "S (Tồn kho: 10)"
3. ✅ Kiểm tra: Input text KHÔNG hiển thị
4. Chọn "➕ Nhập size mới..."
5. ✅ Kiểm tra: Input text xuất hiện
6. Nhập: "28"
7. Chọn lại "S (Tồn kho: 10)"
8. ✅ Kiểm tra: 
   - Input text biến mất
   - productForm.size = "S"
9. Chọn lại "➕ Nhập size mới..."
10. ✅ Kiểm tra:
    - Input text xuất hiện
    - Input rỗng (không còn giá trị "28" cũ)

### Kết quả mong đợi:
✅ PASS - Chuyển đổi mượt mà, không bị lỗi

---

## Test Case 5: Validation khi chọn "Nhập size mới" nhưng không nhập gì

### Các bước test:

1. Chọn sản phẩm và màu
2. Chọn "➕ Nhập size mới..."
3. KHÔNG nhập gì vào input
4. Nhập số lượng và đơn giá
5. Nhấn "Thêm hàng hóa"

### Kết quả mong đợi:
- Toast error: "Vui lòng nhập size"
- Không thêm vào phiếu
✅ PASS

---

## Test Case 6: Nhập nhiều size khác nhau trong cùng 1 phiếu

### Các bước test:

1. Thêm size 28, số lượng 15
2. Thêm size 29, số lượng 12
3. Thêm size 30, số lượng 8
4. Thêm size S, số lượng 5
5. Lưu phiếu

### Kết quả mong đợi:
- Bảng hiển thị 4 dòng
- Tổng số lượng = 40
- Tổng tiền = (15+12+8+5) × 595,000 = 23,800,000 đ
- Database có 4 ProductSizeStock mới
✅ PASS

---

## Test Case 7: Reset form sau khi thêm

### Các bước test:

1. Chọn sản phẩm, màu, size mới "28"
2. Nhập số lượng 15
3. Nhấn "Thêm hàng hóa"
4. ✅ Kiểm tra:
   - Dropdown sản phẩm reset về "-- Chọn sản phẩm --"
   - Dropdown màu reset
   - Dropdown size reset
   - Input size mới biến mất
   - Số lượng reset về 0
   - isAddingNewSize = false
   - newSizeInput = ''

### Kết quả mong đợi:
✅ PASS - Form reset hoàn toàn

---

## Test Case 8: Sản phẩm chưa có màu

### Các bước test:

1. Chọn sản phẩm chưa có màu
2. ✅ Kiểm tra:
   - Dropdown màu trống
   - Thông báo: "Sản phẩm này chưa có màu sắc nào. Vui lòng thêm màu trước."
   - Dropdown size disabled
   - Không thể tiếp tục

### Kết quả mong đợi:
✅ PASS - Ngăn chặn nhập kho cho sản phẩm chưa có màu

---

## Bug Checklist

- [ ] Input text xuất hiện khi chọn "Nhập size mới"
- [ ] Input text biến mất khi chọn size có sẵn
- [ ] Giá trị input được lưu vào productForm.size
- [ ] Validation hoạt động đúng
- [ ] Reset form hoàn toàn sau khi thêm
- [ ] Tự động chọn "Nhập size mới" khi màu chưa có size
- [ ] Console log rõ ràng
- [ ] Toast thông báo chính xác
- [ ] Database cập nhật đúng

---

## Performance Test

### Test tải nhiều size:

1. Màu có 20 size khác nhau
2. Chọn màu
3. ✅ Kiểm tra:
   - Dropdown load nhanh (< 500ms)
   - Không bị lag khi scroll
   - Tất cả size hiển thị đúng

### Kết quả mong đợi:
✅ PASS - Hiệu suất tốt với nhiều size
