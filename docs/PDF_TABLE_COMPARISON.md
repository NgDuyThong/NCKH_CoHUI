# SO SÁNH BỐ CỤC BẢNG - TRƯỚC VÀ SAU

## TRƯỚC KHI SỬA

```
┌────┬──────────────────────────┬────────┬────┬────────┬────────┬─────────┬──────────┐
│STT │Ten, mau sac, kich thuoc  │Ma so   │DVT │Theo    │Thuc    │Don gia  │Thanh tien│
│    │san pham                  │        │    │chung tu│nhap    │         │          │
├────┼──────────────────────────┼────────┼────┼────────┼────────┼─────────┼──────────┤
│ 1  │Dapper Jeans - Quan Jeans │SP003   │Cai │   4    │   4    │ 535.500 │2.142.000 │
│    │Regular fit - Mau: Xanh   │   3    │ i  │        │        │         │          │
│    │duong dam - Size: S       │        │    │        │        │         │          │
└────┴──────────────────────────┴────────┴────┴────────┴────────┴─────────┴──────────┘
```

**Vấn đề:**
- ❌ "Cai" xuống dòng thành "Ca\ni"
- ❌ Header "Theo\nchung tu" xuống 2 dòng
- ❌ Mã số "SP0033" bị tách dòng
- ❌ Thiếu thẩm mỹ

## SAU KHI SỬA

```
┌───┬────────────────────────────────┬──────────┬─────┬──────────────┬───────────┬─────────┬──────────┐
│STT│Ten, mau sac, kich thuoc san pham│Ma so     │DVT  │Theo chung tu │Thuc nhap  │Don gia  │Thanh tien│
├───┼────────────────────────────────┼──────────┼─────┼──────────────┼───────────┼─────────┼──────────┤
│ 1 │Dapper Jeans - Quan Jeans       │SP0033    │Cai  │      4       │     4     │ 535.500 │2.142.000 │
│   │Regular fit - Mau: Xanh duong   │          │     │              │           │         │          │
│   │dam - Size: S                   │          │     │              │           │         │          │
└───┴────────────────────────────────┴──────────┴─────┴──────────────┴───────────┴─────────┴──────────┘
```

**Cải thiện:**
- ✅ Tất cả header trên 1 dòng
- ✅ "Cai" không bị xuống dòng
- ✅ Mã số hiển thị đầy đủ
- ✅ Bảng cân đối, chuyên nghiệp

## THAY ĐỔI CHI TIẾT

### 1. Độ rộng cột
- STT: 12 → 10 (-2mm)
- Tên SP: 55 → 60 (+5mm)
- Mã số: 18 → 20 (+2mm)
- ĐVT: 12 → 13 (+1mm)
- Theo CT: 18 → 16 (-2mm)
- Thực nhập: 18 → 16 (-2mm)
- Đơn giá: 25 → 25 (giữ nguyên)
- Thành tiền: 28 → 26 (-2mm)

### 2. Font size header
- 9pt → 8pt (nhỏ hơn để vừa)

### 3. Cell padding header
- 4px → 3px (gọn hơn)

### 4. Header text
- Loại bỏ `\n` để text không xuống dòng
- "Theo\nchung tu" → "Theo chung tu"
- "Thuc\nnhap" → "Thuc nhap"

## TỔNG KẾT

Bố cục mới cân đối hơn, tất cả thông tin hiển thị rõ ràng trên 1 dòng, không bị xuống dòng làm mất thẩm mỹ.
