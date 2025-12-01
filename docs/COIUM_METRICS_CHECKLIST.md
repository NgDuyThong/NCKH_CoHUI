# ✅ CHECKLIST: SỬA LỖI SỐ LIỆU HARDCODED

## 📋 PROGRESS TRACKER

**Status:** ⬜ Not Started | 🟨 In Progress | ✅ Done

---

## PHASE 1: PYTHON SETUP

- [ ] **1.1** Cài đặt psutil
  ```bash
  pip install psutil
  ```
  **Verify:** `python -c "import psutil; print('OK')"`

- [ ] **1.2** Test psutil hoạt động
  ```python
  import psutil
  import os
  process = psutil.Process(os.getpid())
  print(f"Memory: {process.memory_info().rss / 1024 / 1024} MB")
  ```

---

## PHASE 2: UPDATE PYTHON SCRIPT

- [ ] **2.1** Mở file `CoIUM_Final/run_fashion_store.py`

- [ ] **2.2** Verify imports đã có (line 1-16):
  - [x] `import json` ✅
  - [x] `import psutil` ✅
  - [x] `import os` ✅

- [ ] **2.3** Verify tracking code đã có (line 23-25):
  - [x] `process = psutil.Process(os.getpid())` ✅
  - [x] `start_memory = ...` ✅
  - [x] `start_time = time.time()` ✅

- [ ] **2.4** Tìm dòng `return all_results` (gần cuối file)

- [ ] **2.5** Copy code từ `CoIUM_Final/METRICS_CODE_SNIPPET.py`

- [ ] **2.6** Paste code TRƯỚC dòng `return all_results`

- [ ] **2.7** Save file

---

## PHASE 3: TEST PYTHON

- [ ] **3.1** Chạy Python script
  ```bash
  cd CoIUM_Final
  python run_fashion_store.py
  ```

- [ ] **3.2** Verify không có lỗi

- [ ] **3.3** Check file `metrics.json` được tạo
  ```bash
  ls -la metrics.json
  ```

- [ ] **3.4** Xem nội dung file
  ```bash
  cat metrics.json
  ```

- [ ] **3.5** Chạy test script
  ```bash
  python test_metrics.py
  ```

- [ ] **3.6** Verify test PASS ✅

---

## PHASE 4: UPDATE BACKEND

- [ ] **4.1** Mở file `server/controllers/CoIUMProcessController.js`

- [ ] **4.2** Tìm dòng `console.log('Hoàn thành quy trình CoIUM!');`

- [ ] **4.3** Thêm code đọc metrics (xem guide)

- [ ] **4.4** Tìm `res.json({ success: true, ...`

- [ ] **4.5** Thêm metrics vào response data

- [ ] **4.6** Save file

---

## PHASE 5: TEST BACKEND

- [ ] **5.1** Start backend
  ```bash
  cd server
  npm start
  ```

- [ ] **5.2** Test API endpoint
  ```bash
  # Hoặc dùng Postman/Thunder Client
  POST http://localhost:5000/api/coium-process/run
  ```

- [ ] **5.3** Verify response có metrics
  ```json
  {
    "runtime": 1.85,
    "memory": 456,
    "patternsCount": 780
  }
  ```

---

## PHASE 6: UPDATE FRONTEND

- [ ] **6.1** Mở file `client/src/pages/admin/CoHUIManagement.jsx`

- [ ] **6.2** Tìm dòng `const [analyticsData, setAnalyticsData]`

- [ ] **6.3** Thêm state `realMetrics`

- [ ] **6.4** Tìm hàm `runCoIUM`

- [ ] **6.5** Thêm code update `realMetrics`

- [ ] **6.6** Tìm "Tổng kết phân tích"

- [ ] **6.7** Replace hardcoded values:
  - [ ] `1.8s` → `{realMetrics.runtime}s`
  - [ ] `480 MB` → `{realMetrics.memory} MB`
  - [ ] `780` → `{realMetrics.patternsCount}`

- [ ] **6.8** Save file

---

## PHASE 7: TEST FRONTEND

- [ ] **7.1** Start frontend
  ```bash
  cd client
  npm run dev
  ```

- [ ] **7.2** Mở browser: `http://localhost:5173/admin/cohui`

- [ ] **7.3** Mở DevTools (F12) → Console tab

- [ ] **7.4** Click "Chạy CoIUM & Phân tích"

- [ ] **7.5** Click "▶️ Chạy CoIUM"

- [ ] **7.6** Đợi process hoàn thành

- [ ] **7.7** Verify "Tổng kết phân tích" hiển thị số liệu mới

- [ ] **7.8** Gõ trong Console:
  ```javascript
  console.log(realMetrics);
  ```

- [ ] **7.9** Verify có giá trị thực

---

## PHASE 8: FINAL VERIFICATION

- [ ] **8.1** Xóa file `CoIUM_Final/metrics.json`

- [ ] **8.2** Chạy lại CoIUM từ UI

- [ ] **8.3** Verify số liệu THAY ĐỔI

- [ ] **8.4** Chạy lại lần 2

- [ ] **8.5** Verify số liệu KHÁC với lần 1

- [ ] **8.6** Screenshot kết quả

- [ ] **8.7** Document changes

---

## 📊 SUMMARY

**Total Tasks:** 50+  
**Estimated Time:** 1-2 hours  
**Priority:** HIGH

**Progress:**
- Phase 1: ⬜⬜⬜⬜⬜ 0/2
- Phase 2: ⬜⬜⬜⬜⬜⬜⬜ 0/7
- Phase 3: ⬜⬜⬜⬜⬜⬜ 0/6
- Phase 4: ⬜⬜⬜⬜⬜⬜ 0/6
- Phase 5: ⬜⬜⬜ 0/3
- Phase 6: ⬜⬜⬜⬜⬜⬜⬜⬜ 0/8
- Phase 7: ⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0/9
- Phase 8: ⬜⬜⬜⬜⬜⬜⬜ 0/7

**Overall:** 0/48 tasks completed (0%)

---

## 🎯 SUCCESS CRITERIA

- [x] Python imports OK ✅ (đã có)
- [x] Python tracking code OK ✅ (đã có)
- [ ] Python save metrics.json
- [ ] Backend đọc metrics
- [ ] Backend trả về metrics
- [ ] Frontend nhận metrics
- [ ] Frontend hiển thị metrics
- [ ] **Số liệu thay đổi mỗi lần chạy** ← MỤC TIÊU CHÍNH

---

**Last Updated:** 2025-11-30  
**Status:** Ready to implement  
**Next Step:** Phase 2.4 - Thêm code save metrics vào Python
