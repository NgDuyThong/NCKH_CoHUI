# CHECKLIST: TỐI ƯU HÓA LỌC ĐƠN HÀNG CHO COIUM

## 📋 PRE-IMPLEMENTATION

### Chuẩn bị
- [ ] Đọc `COIUM_OPTIMIZATION_ANALYSIS.md` để hiểu vấn đề
- [ ] Đọc `COIUM_FILTER_IMPLEMENTATION.md` để hiểu giải pháp
- [ ] Backup database hiện tại
- [ ] Backup file `export-orders-for-coium.js`
- [ ] Tạo branch mới: `git checkout -b feature/coium-filter-optimization`

### Phân tích hiện trạng
- [ ] Chạy export hiện tại và ghi lại metrics:
  - [ ] Tổng số orders: _____
  - [ ] Số orders cancelled: _____
  - [ ] Số orders pending: _____
  - [ ] Số transactions: _____
  - [ ] Số unique products: _____
  - [ ] Avg items/transaction: _____

## 🔧 PHASE 1: LỌC TRẠNG THÁI (Ưu tiên cao)

### Implementation
- [ ] Thêm function `filterValidOrders()` vào `export-orders-for-coium.js`
- [ ] Update main function để sử dụng filter
- [ ] Thêm logging chi tiết cho quá trình filter
- [ ] Thêm thống kê orders bị loại bỏ

### Testing
- [ ] Test với database dev
- [ ] Verify số lượng orders sau filter
- [ ] Check format file output không thay đổi
- [ ] Verify file có thể load bởi CoIUM

### Validation
- [ ] So sánh số lượng transactions trước/sau
- [ ] Verify không có orders cancelled trong output
- [ ] Verify không có orders pending trong output
- [ ] Check logs không có errors

## 🔧 PHASE 2: LỌC THỜI GIAN (Ưu tiên trung bình)

### Implementation
- [ ] Thêm filter theo `createdAt` trong `filterValidOrders()`
- [ ] Thêm parameter `monthsBack` (default: 6)
- [ ] Update logging để hiển thị date range
- [ ] Thêm thống kê orders theo tháng

### Testing
- [ ] Test với monthsBack = 3, 6, 12
- [ ] Verify chỉ lấy orders trong khoảng thời gian
- [ ] Check distribution của orders theo tháng
- [ ] Verify patterns phản ánh xu hướng gần đây

### Validation
- [ ] So sánh patterns với/không filter thời gian
- [ ] Verify recommendations phù hợp với xu hướng hiện tại
- [ ] Check không có orders quá cũ trong output

## 🔧 PHASE 3: XỬ LÝ QUANTITY (Ưu tiên trung bình)

### Implementation
- [ ] Thêm function `createTransaction()` 
- [ ] Xử lý để không lặp lại items
- [ ] Update logic tạo transaction lines
- [ ] Thêm logging cho unique items

### Testing
- [ ] Test với orders có nhiều items giống nhau
- [ ] Verify mỗi product chỉ xuất hiện 1 lần/transaction
- [ ] Check số lượng items/transaction giảm
- [ ] Verify patterns không bị bias

### Validation
- [ ] So sánh avg items/transaction trước/sau
- [ ] Verify patterns "mua cùng nhau" chính xác hơn
- [ ] Check không có duplicate items trong transaction

## 🔧 PHASE 4: TÍNH UTILITY CHÍNH XÁC (Ưu tiên thấp)

### Implementation
- [ ] Thêm function `calculateProductUtilities()`
- [ ] Tính utility = quantity × price
- [ ] Update profit file với utilities
- [ ] Thêm logging cho utility calculation

### Testing
- [ ] Test với orders có discount
- [ ] Verify utility phản ánh giá trị thực
- [ ] Check profit file format đúng
- [ ] Verify CoIUM load được profit file

### Validation
- [ ] So sánh utilities với prices
- [ ] Verify high-utility patterns được ưu tiên
- [ ] Check recommendations có ý nghĩa kinh tế

## 🔧 PHASE 5: CẤU HÌNH LINH HOẠT (Optional)

### Implementation
- [ ] Tạo file `server/CoIUM/config.json`
- [ ] Thêm parameter options cho `exportDataForCoIUM()`
- [ ] Support multiple filter profiles
- [ ] Thêm CLI arguments (optional)

### Testing
- [ ] Test với các config khác nhau
- [ ] Verify config được load đúng
- [ ] Test default values
- [ ] Test invalid config handling

## 📊 POST-IMPLEMENTATION

### Run CoIUM với data mới
- [ ] Export data với filters mới
- [ ] Run `python run_fashion_store.py`
- [ ] Ghi lại metrics:
  - [ ] Số patterns tìm được: _____
  - [ ] Avg correlation: _____
  - [ ] Avg utility: _____
  - [ ] Runtime: _____

### So sánh kết quả
- [ ] So sánh số lượng patterns trước/sau
- [ ] So sánh quality của patterns
- [ ] So sánh recommendations
- [ ] Đánh giá cải thiện

### Documentation
- [ ] Update README với instructions mới
- [ ] Document filter options
- [ ] Thêm examples
- [ ] Update troubleshooting guide

## ✅ FINAL VALIDATION

### Code quality
- [ ] Code review
- [ ] No syntax errors
- [ ] Proper error handling
- [ ] Good logging
- [ ] Comments đầy đủ

### Functionality
- [ ] All tests pass
- [ ] No regressions
- [ ] Backward compatible
- [ ] Performance acceptable

### Documentation
- [ ] README updated
- [ ] API docs updated
- [ ] Examples added
- [ ] Changelog updated

## 🚀 DEPLOYMENT

### Pre-deploy
- [ ] Merge branch vào main
- [ ] Tag version: `git tag v1.1.0-coium-filter`
- [ ] Backup production data
- [ ] Prepare rollback plan

### Deploy
- [ ] Deploy code changes
- [ ] Run export script
- [ ] Verify output files
- [ ] Run CoIUM algorithm
- [ ] Check recommendations

### Post-deploy
- [ ] Monitor for errors
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Document lessons learned

## 📈 SUCCESS CRITERIA

- [ ] ✅ Giảm noise data (loại bỏ cancelled/pending)
- [ ] ✅ Patterns phản ánh xu hướng hiện tại
- [ ] ✅ Recommendations chính xác hơn
- [ ] ✅ Performance không giảm
- [ ] ✅ Backward compatible 100%

---

**Progress:** ___/100 tasks completed

**Current Phase:** _____________

**Estimated Completion:** _____________
