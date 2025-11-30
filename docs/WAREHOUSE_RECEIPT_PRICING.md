# Chính sách Giá Nhập Kho

## 📊 Công thức tính giá

### Giá nhập kho tự động
```
Giá nhập kho = Giá bán trên website × 90%
```

### Lợi nhuận
```
Lợi nhuận = Giá bán - Giá nhập = Giá bán × 10%
```

---

## 💰 Ví dụ cụ thể

### Sản phẩm: Dapper Jeans - Quần Jeans Regular fit

**Giá bán trên website:** 595,000 VNĐ

**Tính toán:**
- Giá nhập kho = 595,000 × 0.9 = **535,500 VNĐ**
- Lợi nhuận = 595,000 - 535,500 = **59,500 VNĐ** (10%)

**Khi nhập kho 10 cái:**
- Tổng chi phí nhập: 535,500 × 10 = 5,355,000 VNĐ
- Tổng doanh thu (nếu bán hết): 595,000 × 10 = 5,950,000 VNĐ
- Tổng lợi nhuận: 5,950,000 - 5,355,000 = **595,000 VNĐ** (10%)

---

## 🎯 Cách hoạt động trong hệ thống

### 1. Khi chọn sản phẩm

Hệ thống tự động:
1. Lấy giá bán từ database
2. Tính giá nhập = Giá bán × 90%
3. Làm tròn số (Math.round)
4. Điền vào ô "Đơn giá nhập"

**Console log:**
```
[CLIENT] Giá bán: 595,000 VNĐ
[CLIENT] Giá nhập: 535,500 VNĐ (90%)
[CLIENT] Lợi nhuận dự kiến: 59,500 VNĐ (10%)
```

### 2. Hiển thị trên giao diện

**Label:**
```
Đơn giá nhập (VND) * (Giá bán: 595,000 đ)
```

**Input:**
```
535500
```

**Thông báo bên dưới:**
```
Lợi nhuận dự kiến: 59,500 đ (10%)
```

### 3. Có thể chỉnh sửa

Người dùng **có thể thay đổi** giá nhập kho nếu cần:
- Nhập giá thấp hơn → Lợi nhuận cao hơn
- Nhập giá cao hơn → Lợi nhuận thấp hơn
- Hệ thống tự động tính lại % lợi nhuận

**Ví dụ:**
- Giá bán: 595,000 đ
- Nhập giá: 500,000 đ (thay vì 535,500 đ)
- Lợi nhuận: 95,000 đ (16%)

---

## 📋 Bảng tính lợi nhuận

| Giá bán | Giá nhập (90%) | Lợi nhuận (10%) |
|---------|----------------|-----------------|
| 100,000 | 90,000 | 10,000 |
| 200,000 | 180,000 | 20,000 |
| 300,000 | 270,000 | 30,000 |
| 500,000 | 450,000 | 50,000 |
| 595,000 | 535,500 | 59,500 |
| 1,000,000 | 900,000 | 100,000 |

---

## 🔍 Phân tích chi tiết

### Tại sao giảm 10%?

1. **Chi phí vận hành:** 3-5%
   - Kho bãi
   - Nhân viên
   - Điện nước

2. **Chi phí marketing:** 2-3%
   - Quảng cáo
   - Khuyến mãi
   - Social media

3. **Lợi nhuận ròng:** 2-5%
   - Sau khi trừ tất cả chi phí

**Tổng:** ~10%

### Linh hoạt điều chỉnh

Hệ thống cho phép điều chỉnh giá nhập để:
- **Tăng lợi nhuận:** Nhập giá thấp hơn (VD: 85% thay vì 90%)
- **Giảm giá bán:** Nhập giá cao hơn để giảm giá bán sau
- **Khuyến mãi:** Tính toán lợi nhuận khi có khuyến mãi

---

## 💡 Ví dụ thực tế

### Tình huống 1: Nhập hàng bình thường

**Sản phẩm:** Áo thun nam
- Giá bán: 150,000 đ
- Giá nhập: 135,000 đ (tự động)
- Số lượng: 50 cái

**Tính toán:**
- Tổng chi phí: 135,000 × 50 = 6,750,000 đ
- Tổng doanh thu: 150,000 × 50 = 7,500,000 đ
- Lợi nhuận: 750,000 đ (10%)

### Tình huống 2: Nhập hàng giá tốt

**Sản phẩm:** Quần jeans
- Giá bán: 595,000 đ
- Giá nhập: 500,000 đ (thương lượng được giá tốt)
- Số lượng: 20 cái

**Tính toán:**
- Tổng chi phí: 500,000 × 20 = 10,000,000 đ
- Tổng doanh thu: 595,000 × 20 = 11,900,000 đ
- Lợi nhuận: 1,900,000 đ (16%)

### Tình huống 3: Sản phẩm khuyến mãi

**Sản phẩm:** Áo khoác
- Giá bán gốc: 500,000 đ
- Giá bán khuyến mãi: 400,000 đ (giảm 20%)
- Giá nhập: 450,000 đ (90% giá gốc)
- Số lượng: 10 cái

**Tính toán:**
- Tổng chi phí: 450,000 × 10 = 4,500,000 đ
- Tổng doanh thu: 400,000 × 10 = 4,000,000 đ
- **Lỗ:** -500,000 đ (-11%)

**Giải pháp:** Điều chỉnh giá nhập xuống 360,000 đ (90% giá KM)
- Lợi nhuận: 400,000 - 360,000 = 40,000 đ/cái (10%)

---

## 📊 Báo cáo lợi nhuận

### Theo phiếu nhập kho

Mỗi phiếu nhập kho sẽ có:
- Tổng giá trị nhập (Cost)
- Tổng giá trị bán (Revenue)
- Lợi nhuận dự kiến (Profit)
- % Lợi nhuận (Margin)

### Theo sản phẩm

Mỗi sản phẩm sẽ có:
- Giá nhập trung bình
- Giá bán hiện tại
- Lợi nhuận/cái
- % Lợi nhuận

---

## ⚙️ Cấu hình

### Thay đổi % lợi nhuận mặc định

Nếu muốn thay đổi từ 10% sang giá trị khác:

**File:** `client/src/pages/admin/WarehouseReceipt.jsx`

**Dòng code:**
```javascript
const importPrice = Math.round(sellingPrice * 0.9); // 0.9 = 90% (lợi nhuận 10%)
```

**Thay đổi:**
- 15% lợi nhuận: `sellingPrice * 0.85`
- 20% lợi nhuận: `sellingPrice * 0.8`
- 5% lợi nhuận: `sellingPrice * 0.95`

---

## 🎯 Best Practices

### 1. Kiểm tra giá trước khi lưu
- Xem lại giá nhập có hợp lý không
- So sánh với giá thị trường
- Đảm bảo có lợi nhuận

### 2. Ghi chú đặc biệt
- Nếu giá nhập khác 90%, ghi chú lý do
- VD: "Nhập giá tốt từ nhà cung cấp"
- VD: "Hàng thanh lý, giảm giá"

### 3. Theo dõi lợi nhuận thực tế
- So sánh lợi nhuận dự kiến vs thực tế
- Điều chỉnh chiến lược giá
- Tối ưu hóa lợi nhuận

---

## ❓ FAQ

**Q: Tại sao giá nhập tự động là 90%?**
A: Để đảm bảo lợi nhuận 10% cho mỗi sản phẩm, bù đắp chi phí vận hành.

**Q: Tôi có thể thay đổi giá nhập không?**
A: Có, bạn có thể nhập bất kỳ giá nào. Hệ thống sẽ tự động tính lại % lợi nhuận.

**Q: Nếu tôi nhập giá cao hơn giá bán thì sao?**
A: Hệ thống sẽ hiển thị lợi nhuận âm (lỗ). Bạn nên kiểm tra lại.

**Q: Giá nhập có ảnh hưởng đến giá bán không?**
A: Không. Giá bán được quản lý riêng trong "Quản lý Sản phẩm".

**Q: Làm sao biết sản phẩm nào lợi nhuận cao?**
A: Xem cột "Lợi nhuận dự kiến" trong bảng hàng hóa đã nhập.

---

## 📈 Tương lai

### Tính năng sắp có:

1. **Báo cáo lợi nhuận**
   - Theo ngày/tháng/năm
   - Theo sản phẩm
   - Theo nhà cung cấp

2. **Cảnh báo lợi nhuận thấp**
   - Nếu < 5%: Cảnh báo vàng
   - Nếu < 0%: Cảnh báo đỏ

3. **Đề xuất giá nhập**
   - Dựa trên lịch sử
   - Dựa trên giá thị trường
   - Dựa trên mục tiêu lợi nhuận

4. **So sánh nhà cung cấp**
   - Nhà cung cấp nào giá tốt nhất
   - Lịch sử giá nhập
   - Đánh giá chất lượng
