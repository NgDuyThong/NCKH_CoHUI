# 🔄 HƯỚNG DẪN RESTART SERVERS

## ✅ ĐÃ VERIFY

Backend CÓ THỂ đọc metrics.json! Test script chạy thành công:
```
✅ Runtime: 0.83s
✅ Memory: 100 MB
✅ Patterns: 101
```

## ❌ VẤN ĐỀ

Backend server đang chạy **CODE CŨ** (trước khi sửa)

## 🔧 GIẢI PHÁP

### BƯỚC 1: STOP TẤT CẢ SERVERS

#### Terminal Backend:
```
Nhấn: Ctrl + C
Đợi: Server stop hoàn toàn
```

#### Terminal Frontend:
```
Nhấn: Ctrl + C
Đợi: Dev server stop
```

### BƯỚC 2: CLEAR CACHE (Optional nhưng recommended)

```bash
# Clear node_modules cache
cd server
npm cache clean --force

cd ../client
npm cache clean --force
```

### BƯỚC 3: START BACKEND

```bash
cd server
npm start
```

**Kiểm tra console phải thấy:**
```
Server is running on port 5000
Connected to MongoDB
```

**KHÔNG được có lỗi màu đỏ!**

### BƯỚC 4: START FRONTEND

```bash
cd client
npm run dev
```

**Kiểm tra console phải thấy:**
```
VITE ready in xxx ms
Local: http://localhost:5173/
```

### BƯỚC 5: TEST

1. Mở browser: `http://localhost:5173/admin/cohui`
2. Mở DevTools: F12
3. Chọn tab: Console
4. Clear console: Click icon 🚫
5. Click: "Chạy CoIUM & Phân tích"
6. Click: "▶️ Chạy CoIUM"
7. Xem console logs

**Nếu thành công, sẽ thấy:**
```
POST /api/coium-process/run 200 OK
✅ Chạy CoIUM thành công!
```

**Nếu vẫn lỗi, sẽ thấy:**
```
POST /api/coium-process/run 500 Error
❌ Lỗi khi chạy CoIUM
```

## 🔍 NẾU VẪN LỖI 500

### Kiểm tra Backend Terminal:

Tìm dòng lỗi màu đỏ, thường là:
```
Error: ...
    at ...
```

### Các lỗi thường gặp:

#### Lỗi 1: Python not found
```
Error: spawn python ENOENT
```
**Fix:** Cài Python hoặc dùng `python3`

#### Lỗi 2: Script Python lỗi
```
Python stderr: Traceback...
```
**Fix:** Xem chi tiết lỗi Python

#### Lỗi 3: File not found
```
Error: ENOENT: no such file or directory
```
**Fix:** Check paths

#### Lỗi 4: Timeout
```
Error: Command failed: timeout
```
**Fix:** Tăng timeout hoặc giảm data

## 📸 SCREENSHOT

Nếu vẫn lỗi, chụp màn hình:
1. Backend terminal (toàn bộ logs)
2. Frontend console (F12)
3. Network tab (request/response)

Gửi cho tôi để phân tích!

---

**TL;DR:**
1. Stop tất cả servers
2. Start Backend: `cd server && npm start`
3. Start Frontend: `cd client && npm run dev`
4. Test lại
5. Nếu vẫn lỗi → Gửi screenshot Backend logs
