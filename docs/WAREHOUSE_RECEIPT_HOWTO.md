# Hướng dẫn Sử dụng Phiếu Nhập Kho

## 📋 Tình huống 1: Nhập sản phẩm đã có màu và size

**Ví dụ:** Sản phẩm "Dapper Jeans" màu "Xanh dương đậm" đã có size S với 0 cái trong kho. Bạn muốn nhập thêm 10 cái size S.

### Các bước:

1. **Chọn sản phẩm**
   - Tìm kiếm: "Dapper Jeans"
   - Chọn từ dropdown: "SP0033 - Dapper Jeans - Quần Jeans Regular fit"

2. **Chọn màu sắc**
   - Dropdown tự động load màu có sẵn
   - Chọn: "Xanh dương đậm"

3. **Chọn size**
   - Dropdown hiển thị:
     - "-- Chọn size --"
     - "S (Tồn kho: 0)" ← Chọn cái này
     - "➕ Nhập size mới..."
   - Chọn "S (Tồn kho: 0)"

4. **Nhập số lượng**
   - Số lượng theo chứng từ: 0 (tùy chọn)
   - Số lượng thực nhập: 10

5. **Nhập đơn giá**
   - Đơn giá: 595000

6. **Thêm vào phiếu**
   - Nhấn nút "Thêm hàng hóa"
   - Sản phẩm xuất hiện trong bảng "Danh sách hàng hóa đã nhập"

7. **Lưu phiếu**
   - Điền thông tin chứng từ (số phiếu, người giao...)
   - Nhấn "Lưu phiếu nhập kho"

**Kết quả:**
- Stock size S tăng từ 0 → 10

---

## 📋 Tình huống 2: Thêm size mới cho màu đã có

**Ví dụ:** Sản phẩm "Dapper Jeans" màu "Xanh dương đậm" đã có size S. Bạn muốn thêm size 28, 29, 30.

### Các bước:

1. **Chọn sản phẩm**
   - Chọn: "SP0033 - Dapper Jeans - Quần Jeans Regular fit"

2. **Chọn màu sắc**
   - Chọn: "Xanh dương đậm"

3. **Chọn "Nhập size mới"**
   - Dropdown hiển thị:
     - "-- Chọn size --"
     - "S (Tồn kho: 10)"
     - "➕ Nhập size mới..." ← Chọn cái này
   - Chọn "➕ Nhập size mới..."

4. **Nhập size mới**
   - Input text xuất hiện
   - Nhập: "28"

5. **Nhập số lượng và đơn giá**
   - Số lượng thực nhập: 15
   - Đơn giá: 595000

6. **Thêm vào phiếu**
   - Nhấn "Thêm hàng hóa"

7. **Lặp lại cho size 29 và 30**
   - Chọn lại sản phẩm và màu
   - Chọn "➕ Nhập size mới..."
   - Nhập "29", số lượng 12
   - Thêm vào phiếu
   - Lặp lại cho size "30", số lượng 8

8. **Lưu phiếu**

**Kết quả:**
- Màu "Xanh dương đậm" giờ có 4 size:
  - S: 10 cái
  - 28: 15 cái (mới)
  - 29: 12 cái (mới)
  - 30: 8 cái (mới)

---

## 📋 Tình huống 3: Nhập sản phẩm có màu nhưng chưa có size

**Ví dụ:** Sản phẩm "Áo thun nam" có màu "Đỏ" nhưng chưa có size nào.

### Các bước:

1. **Chọn sản phẩm**
   - Chọn: "Áo thun nam"

2. **Chọn màu sắc**
   - Chọn: "Đỏ"
   - Hệ thống tự động load size → Không có size nào

3. **Tự động chọn "Nhập size mới"**
   - Dropdown tự động chọn "➕ Nhập size mới..."
   - Input text tự động hiển thị
   - Thông báo: "Màu này chưa có size nào. Chọn 'Nhập size mới' để tạo."

4. **Nhập size**
   - Nhập: "M"

5. **Nhập số lượng và đơn giá**
   - Số lượng: 20
   - Đơn giá: 150000

6. **Thêm vào phiếu và lưu**

**Kết quả:**
- Tạo mới ProductSizeStock cho màu "Đỏ", size "M", stock 20

---

## 📋 Tình huống 4: Sản phẩm chưa có màu

**Ví dụ:** Sản phẩm "Quần short" chưa có màu nào.

### Các bước:

1. **Chọn sản phẩm**
   - Chọn: "Quần short"
   - Hệ thống load màu → Không có màu nào

2. **Thông báo lỗi**
   - Hiển thị: "Sản phẩm này chưa có màu sắc nào. Vui lòng thêm màu trước."
   - Dropdown màu sắc trống

3. **Không thể tiếp tục**
   - Không thể chọn size
   - Không thể thêm vào phiếu

### Giải pháp:

1. Vào "Quản lý Sản phẩm"
2. Tìm sản phẩm "Quần short"
3. Nhấn "Quản lý Màu & Size"
4. Nhấn "Thêm màu mới"
5. Nhập tên màu (VD: "Đen")
6. Upload hình ảnh
7. Thêm size (VD: S, M, L) với số lượng ban đầu = 0
8. Lưu
9. Quay lại "Phiếu Nhập Kho" và thử lại

---

## 💡 Tips và Lưu ý

### 1. Quy tắc đặt tên size
- **Size chữ**: S, M, L, XL, XXL, XXXL
- **Size số (quần)**: 28, 29, 30, 31, 32, 33, 34, 36, 38
- **Size số (giày)**: 36, 37, 38, 39, 40, 41, 42, 43, 44
- **Size tùy chỉnh**: Bất kỳ chuỗi nào (VD: "One Size", "Free Size")

### 2. Khi nào dùng "Nhập size mới"?
- Thêm size mới cho sản phẩm (VD: Có S, M, L → Thêm XL, XXL)
- Thêm size số cho quần jeans (VD: Có 28, 29 → Thêm 30, 31, 32)
- Màu chưa có size nào (tự động chọn)

### 3. Khi nào chọn size có sẵn?
- Nhập thêm số lượng cho size đã có trong kho
- Cập nhật tồn kho

### 4. Kiểm tra trước khi lưu
- ✅ Tất cả sản phẩm đã có màu và size
- ✅ Số lượng > 0
- ✅ Đơn giá > 0
- ✅ Thông tin chứng từ đầy đủ

### 5. Sau khi lưu phiếu
- Kiểm tra stock trong "Quản lý Màu & Size"
- Xuất PDF để lưu trữ
- Số lượng tồn kho đã được cập nhật tự động

---

## ❓ FAQ

**Q: Tôi chọn "Nhập size mới" nhưng không thấy input text?**
A: Kiểm tra xem bạn đã chọn màu sắc chưa. Input chỉ hiển thị sau khi chọn màu.

**Q: Tôi muốn thêm size 28 nhưng dropdown chỉ có size S?**
A: Chọn "➕ Nhập size mới..." trong dropdown, sau đó nhập "28" vào input text.

**Q: Làm sao biết size nào đã có trong kho?**
A: Dropdown sẽ hiển thị: "Size X (Tồn kho: Y)". VD: "28 (Tồn kho: 10)"

**Q: Tôi nhập sai size, làm sao xóa?**
A: Hiện tại chưa có chức năng xóa size. Bạn có thể set stock = 0 trong "Quản lý Màu & Size".

**Q: Size có phân biệt hoa thường không?**
A: Có. "S" khác "s". Nên dùng chữ in hoa cho size chữ (S, M, L, XL).

**Q: Tôi có thể nhập nhiều size cùng lúc không?**
A: Không. Mỗi lần chỉ nhập được 1 size. Nhưng bạn có thể thêm nhiều dòng vào phiếu, mỗi dòng 1 size khác nhau.

**Q: Đơn giá có thể khác nhau cho mỗi size không?**
A: Có. Mỗi dòng trong phiếu có thể có đơn giá riêng.

---

## 🎯 Checklist Nhập Kho

### Trước khi bắt đầu:
- [ ] Sản phẩm đã được tạo trong hệ thống
- [ ] Sản phẩm đã có ít nhất 1 màu sắc
- [ ] Màu sắc đã có hình ảnh

### Khi nhập kho:
- [ ] Đã chọn đúng sản phẩm
- [ ] Đã chọn đúng màu sắc
- [ ] Đã chọn/nhập đúng size
- [ ] Số lượng > 0
- [ ] Đơn giá > 0
- [ ] Đã kiểm tra lại thông tin trước khi thêm

### Sau khi lưu phiếu:
- [ ] Kiểm tra stock đã tăng đúng
- [ ] Xuất PDF lưu trữ
- [ ] Thông báo cho bộ phận liên quan
