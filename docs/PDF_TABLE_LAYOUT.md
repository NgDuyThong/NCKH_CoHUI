# BỐ CỤC BẢNG PDF - PHIẾU NHẬP KHO

## VẤN ĐỀ CŨ
- Cột "Mã số" và "ĐVT" bị xuống dòng
- Header "Theo\nchung tu" và "Thuc\nnhap" xuống 2 dòng
- Thiếu thẩm mỹ, không chỉnh chu

## GIẢI PHÁP MỚI

### Điều chỉnh độ rộng cột (tổng = 186mm)

| Cột | Cũ | Mới | Lý do |
|-----|-----|-----|-------|
| STT | 12 | 10 | Giảm vì chỉ cần số 1-2 chữ số |
| Tên SP | 55 | 60 | Tăng để chứa tên dài |
| Mã số | 18 | 20 | Tăng để tránh xuống dòng |
| ĐVT | 12 | 13 | Tăng nhẹ cho "Cai" |
| Theo CT | 18 | 16 | Giảm, số lượng ngắn |
| Thực nhập | 18 | 16 | Giảm, số lượng ngắn |
| Đơn giá | 25 | 25 | Giữ nguyên |
| Thành tiền | 28 | 26 | Giảm nhẹ |

### Điều chỉnh header
```javascript
// CŨ - Xuống dòng
'Theo\nchung tu'
'Thuc\nnhap'

// MỚI - Một dòng
'Theo chung tu'
'Thuc nhap'
```

### Điều chỉnh font size header
- Font size: 9 → 8 (nhỏ hơn để vừa)
- Cell padding: 4 → 3 (gọn hơn)
- Min height: 12px (đủ cao cho text)

## KẾT QUẢ
✅ Tất cả header trên 1 dòng
✅ Mã sản phẩm không bị xuống dòng
✅ ĐVT hiển thị gọn gàng
✅ Bảng cân đối, chuyên nghiệp hơn

## CODE THAY ĐỔI

```javascript
headStyles: {
    ...tableStyles.headStyles,
    fontSize: 8,           // Nhỏ hơn
    cellPadding: 3,        // Gọn hơn
    minCellHeight: 12      // Đủ cao
},
columnStyles: {
    0: { cellWidth: 10, halign: 'center' },
    1: { cellWidth: 60, halign: 'left', fontStyle: 'bold' },
    2: { cellWidth: 20, halign: 'center' },
    3: { cellWidth: 13, halign: 'center' },
    4: { cellWidth: 16, halign: 'center' },
    5: { cellWidth: 16, halign: 'center' },
    6: { cellWidth: 25, halign: 'right' },
    7: { cellWidth: 26, halign: 'right' }
}
```
