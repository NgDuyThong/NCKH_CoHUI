# 🔍 KIỂM TRA LỖI BACKEND

## ✅ ĐÃ VERIFY

1. ✅ Python syntax OK
2. ✅ psutil installed OK
3. ✅ File metrics.json tồn tại
4. ✅ Frontend code OK
5. ✅ Backend code OK (no syntax errors)

## ❌ VẤN ĐỀ

Lỗi 500 khi gọi API `/api/coium-process/run`

## 🔍 NGUYÊN NHÂN CÓ THỂ

### 1. Backend đang chạy code CŨ
**Giải pháp:** Restart backend server

```bash
# Stop server (Ctrl+C)
# Start lại
cd server
npm start
```

### 2. File metrics.json chưa được tạo khi chạy từ Backend
**Giải pháp:** Chạy Python script thủ công trước

```bash
cd CoIUM_Final
python run_fashion_store.py
```

### 3. Path không đúng
**Kiểm tra:** Backend logs khi chạy CoIUM

```
CoIUM path: E:\DoAnTN\Fashion-Store-IconDenim\CoIUM_Final
```

## 🚀 CÁCH SỬA

### Bước 1: Stop tất cả servers
- Stop Backend (Ctrl+C)
- Stop Frontend (Ctrl+C)

### Bước 2: Test Python script
```bash
cd CoIUM_Final
python run_fashion_store.py
```

**Kiểm tra:**
- Console hiển thị: "✅ Đã lưu metrics vào: metrics.json"
- File `metrics.json` được update

### Bước 3: Restart Backend
```bash
cd server
npm start
```

**Kiểm tra:**
- Server start thành công
- Không có lỗi

### Bước 4: Restart Frontend
```bash
cd client
npm run dev
```

### Bước 5: Test lại
1. Mở browser: `http://localhost:5173/admin/cohui`
2. F12 → Console tab (xem lỗi)
3. F12 → Network tab (xem API response)
4. Click "Chạy CoIUM"
5. Xem response

## 🔍 DEBUG

### Nếu vẫn lỗi 500:

#### Check Backend console:
```
Tìm dòng lỗi màu đỏ
Copy error message
```

#### Check Frontend console:
```
F12 → Console
Tìm lỗi màu đỏ
```

#### Check Network tab:
```
F12 → Network
Click request "run"
Xem Response tab
Copy error message
```

## 📝 LƯU Ý

File `metrics.json` hiện tại có data:
```json
{
  "runtime": 0.76,
  "memory": 100,
  "patterns_count": 101,
  "minutil": 0.001,
  "mincor": 0.5,
  "timestamp": 1764471367,
  "total_transactions": 25764,
  "total_items": 106
}
```

Backend PHẢI đọc được file này!

## ✅ EXPECTED RESULT

Sau khi restart servers:
- API trả về 200 OK
- Response có metrics
- UI hiển thị số liệu thực

---

**Next:** Restart servers và test lại!
