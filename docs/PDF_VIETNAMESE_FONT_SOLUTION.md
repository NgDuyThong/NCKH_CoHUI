# GIẢI PHÁP FONT TIẾNG VIỆT TRONG PDF - ICONDENIM

## VẤN ĐỀ

jsPDF mặc định **KHÔNG hỗ trợ Unicode**. Các font built-in (Times, Helvetica, Courier) chỉ hỗ trợ ASCII và Latin-1, không hiển thị được tiếng Việt có dấu.

### Triệu chứng
- Ký tự tiếng Việt hiển thị sai: `&P&H&I&¾&U&` thay vì `PHIẾU NHẬP KHO`
- Dấu thanh, dấu hỏi, dấu ngã bị lỗi
- Chữ đ, ă, ơ, ư không hiển thị đúng

## GIẢI PHÁP ĐÃ ÁP DỤNG

### Phương án: Loại bỏ dấu tiếng Việt

**Lý do chọn:**
- Đơn giản, không cần embed font custom
- File PDF nhẹ, tải nhanh
- Tương thích 100% với mọi PDF reader
- Phù hợp với biểu mẫu kế toán (thường dùng chữ không dấu)

### Implementation

```javascript
const removeVietnameseTones = (str) => {
    // Convert tất cả ký tự có dấu sang không dấu
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    // ... (xem code đầy đủ trong pdfGenerator.js)
    return str;
};
```

### Áp dụng cho TẤT CẢ text trong PDF
- Header công ty
- Tiêu đề phiếu
- Thông tin chi tiết
- Tên sản phẩm, màu sắc
- Chữ ký footer
- Ghi chú


## KẾT QUẢ

### Trước khi sửa
```
&P&H&I&¾&U& &N&H&~&P& &K&H&O
&N&g&à&y& &3& &t&h&á&n&g& &1&2& &n&ă&m& &2&0&2&5
```

### Sau khi sửa
```
PHIEU NHAP KHO
Ngay 3 thang 12 nam 2025
```

## CÁC PHƯƠNG ÁN KHÁC (KHÔNG DÙNG)

### 1. Embed Custom Font (VD: Roboto, Arial Unicode)
**Ưu điểm:** Giữ nguyên tiếng Việt có dấu
**Nhược điểm:**
- File PDF nặng hơn (thêm 200-500KB cho font)
- Phức tạp, cần convert font sang base64
- Có thể gặp lỗi license font

### 2. Sử dụng thư viện khác (pdfmake, puppeteer)
**Ưu điểm:** Hỗ trợ Unicode tốt hơn
**Nhược điểm:**
- Phải refactor toàn bộ code
- pdfmake: cú pháp khác hoàn toàn
- puppeteer: cần headless browser, nặng

## HƯỚNG DẪN SỬ DỤNG

### Khi tạo PDF mới
```javascript
// ĐÚNG - Bỏ dấu tất cả text
doc.text(removeVietnameseTones('Phiếu nhập kho'), x, y);

// SAI - Giữ nguyên tiếng Việt
doc.text('Phiếu nhập kho', x, y); // ❌ Sẽ hiển thị lỗi
```

### Với data từ database
```javascript
// Data có dấu từ DB
const productName = 'Quần Jean Xanh Đậm';
const colorName = 'Xanh Navy';

// Bỏ dấu khi xuất PDF
const pdfText = removeVietnameseTones(productName) + ' - ' + 
                removeVietnameseTones(colorName);
// => "Quan Jean Xanh Dam - Xanh Navy"
```

## LƯU Ý QUAN TRỌNG

1. **Database vẫn lưu tiếng Việt có dấu** - Chỉ bỏ dấu khi xuất PDF
2. **Giao diện web vẫn hiển thị có dấu** - Người dùng nhập và xem có dấu bình thường
3. **Chỉ PDF mới không dấu** - Đây là giới hạn kỹ thuật của jsPDF

## TEST

Chạy test để kiểm tra:
```bash
node client/test-pdf-vietnamese.js
```

Kết quả mong đợi: Tất cả ký tự có dấu được convert sang không dấu.
