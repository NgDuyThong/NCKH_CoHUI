# TÓM TẮT SỬA LỖI FONT TIẾNG VIỆT TRONG PDF

## Vấn đề
PDF hiển thị ký tự lỗi: `&P&H&I&¾&U&` thay vì `PHIẾU NHẬP KHO`

## Nguyên nhân
jsPDF không hỗ trợ Unicode - font Times/Helvetica built-in chỉ hỗ trợ ASCII

## Giải pháp
Loại bỏ dấu tiếng Việt cho TẤT CẢ text trong PDF

## Thay đổi code

### 1. Hàm removeVietnameseTones() - Đã có sẵn và hoạt động tốt
```javascript
const removeVietnameseTones = (str) => {
    // Convert à→a, ă→a, â→a, đ→d, etc.
}
```

### 2. Áp dụng cho tất cả text
- ✅ Header công ty
- ✅ Tiêu đề phiếu  
- ✅ Thông tin chi tiết (ngày, số phiếu, người giao, kho)
- ✅ Tên sản phẩm, màu sắc trong bảng
- ✅ Chữ ký footer
- ✅ Ghi chú

### 3. Đổi font từ Times → Helvetica
Font Helvetica render tốt hơn cho chữ không dấu

## Kết quả
✅ PDF hiển thị đúng, không còn ký tự lỗi
✅ Tất cả text đều không dấu, dễ đọc
✅ File PDF nhẹ, tương thích 100%

## Lưu ý
- Database VẪN lưu tiếng Việt có dấu
- Giao diện web VẪN hiển thị có dấu
- CHỈ PDF mới không dấu (giới hạn kỹ thuật)
