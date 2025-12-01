# 📚 SỬA LỖI SỐ LIỆU HARDCODED - HƯỚNG DẪN NHANH

## 🎯 VẤN ĐỀ
Số liệu thống kê (1.8s, 480 MB, 780) bị **HARDCODED** và không thay đổi.

## 💡 GIẢI PHÁP
Python → metrics.json → Backend → Frontend

## 🚀 QUICK START (5 BƯỚC)

### 1️⃣ Cài psutil
```bash
cd CoIUM_Final
pip install psutil
```

### 2️⃣ Update Python
**File:** `CoIUM_Final/run_fashion_store.py`

**Copy code từ:** `CoIUM_Final/METRICS_CODE_SNIPPET.py`

**Paste vào:** Trước dòng `return all_results`

### 3️⃣ Test Python
```bash
python run_fashion_store.py
python test_metrics.py
```

**Kết quả:** File `metrics.json` được tạo ✅

### 4️⃣ Update Backend
**File:** `server/controllers/CoIUMProcessController.js`

**Thêm code đọc metrics** (xem chi tiết trong `COIUM_METRICS_IMPLEMENTATION_GUIDE.md`)

### 5️⃣ Update Frontend
**File:** `client/src/pages/admin/CoHUIManagement.jsx`

**Thay hardcoded values** bằng `realMetrics` state

---

## 📖 TÀI LIỆU CHI TIẾT

### 1. COIUM_METRICS_IMPLEMENTATION_GUIDE.md ⭐ ĐỌC ĐẦU TIÊN
**Nội dung:** Hướng dẫn từng bước chi tiết  
**Thời gian:** 30 phút đọc, 1-2 giờ implement

### 2. COIUM_STATISTICS_FIX.md 📊 PHÂN TÍCH VẤN ĐỀ
**Nội dung:** Phân tích nguyên nhân và 2 options giải pháp

### 3. COIUM_STATISTICS_SUMMARY.md 📋 TÓM TẮT
**Nội dung:** Tóm tắt ngắn gọn vấn đề và giải pháp

---

## 🔍 CÁCH KIỂM TRA

### Kiểm tra Python:
```bash
cd CoIUM_Final
python test_metrics.py
```

### Kiểm tra Backend:
```bash
# Browser Console (F12) → Network tab
# POST /api/coium-process/run
# Response phải có: runtime, memory, patternsCount
```

### Kiểm tra Frontend:
```bash
# Browser Console (F12)
console.log(realMetrics);
# Phải có: { runtime: 1.85, memory: 456, patternsCount: 780 }
```

---

## ✅ SUCCESS CRITERIA

- [ ] psutil installed
- [ ] Python tạo metrics.json
- [ ] Backend đọc được metrics
- [ ] Frontend hiển thị metrics thực
- [ ] **Số liệu thay đổi mỗi lần chạy** ← QUAN TRỌNG

---

## 📁 FILES CREATED

1. `docs/COIUM_METRICS_IMPLEMENTATION_GUIDE.md` - Hướng dẫn chi tiết
2. `docs/COIUM_STATISTICS_FIX.md` - Phân tích vấn đề
3. `docs/COIUM_STATISTICS_SUMMARY.md` - Tóm tắt
4. `CoIUM_Final/METRICS_CODE_SNIPPET.py` - Code để copy
5. `CoIUM_Final/test_metrics.py` - Script test
6. `docs/COIUM_METRICS_README.md` - File này

---

## 🆘 CẦN TRỢ GIÚP?

### Lỗi psutil:
```bash
pip install psutil
```

### Lỗi metrics.json not found:
- Check Python script chạy thành công
- Check file trong `CoIUM_Final/metrics.json`

### Frontend vẫn hiển thị hardcoded:
- Check Backend response (Network tab)
- Check state được update (Console)

---

**Priority:** HIGH  
**Time:** 1-2 hours  
**Status:** Ready to implement  
**Next:** Đọc `COIUM_METRICS_IMPLEMENTATION_GUIDE.md`
