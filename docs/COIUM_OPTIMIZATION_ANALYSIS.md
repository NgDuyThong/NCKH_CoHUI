# PHÂN TÍCH TỐI ƯU HÓA COIUM - LỌC ĐƠN HÀNG

## 🎯 MỤC TIÊU
Tối ưu hóa chức năng lọc đơn hàng để CoIUM phân tích chính xác hơn, KHÔNG thay đổi logic hiện có.

## 📊 HIỆN TRẠNG HỆ THỐNG

### Flow hiện tại:
```
MongoDB Orders → export-orders-for-coium.js → fashion_store.dat → CoIUM Algorithm → Recommendations
```

### 1. Lọc đơn hàng (OrderManagement.jsx)
**Các tiêu chí lọc hiện có:**
- ✅ Tìm kiếm theo orderID, tên khách hàng
- ✅ Lọc theo trạng thái đơn hàng (pending, processing, shipped, delivered, cancelled)
- ✅ Lọc theo trạng thái vận chuyển
- ✅ Lọc theo trạng thái thanh toán (paid/unpaid)
- ✅ Sắp xếp theo ngày, giá, trạng thái

### 2. Export data cho CoIUM (export-orders-for-coium.js)
**Cách xử lý hiện tại:**
```javascript
// Lấy TẤT CẢ orders không phân biệt trạng thái
const orders = await Order.find({}).lean();

// Chuyển đổi sang transactions
orders.forEach(order => {
    const details = orderDetailsMap[order.orderID] || [];
    const productIDs = details.map(d => {
        const parts = d.SKU.split('-');
        return parseInt(parts[0]);
    });
    transactionLines.push(productIDs.join(' '));
});
```

## 🔍 VẤN ĐỀ PHÁT HIỆN

### 1. **Không lọc orders theo trạng thái**
❌ **Vấn đề:** Export TẤT CẢ orders kể cả:
- Orders bị cancelled (đã hủy)
- Orders pending (chưa xác nhận)
- Orders có thể bị lỗi

❌ **Ảnh hưởng đến CoIUM:**
- Dữ liệu nhiễu (noise data)
- Patterns không chính xác
- Recommendations dựa trên orders không hợp lệ

### 2. **Không lọc theo thời gian**
❌ **Vấn đề:** Lấy toàn bộ lịch sử orders
- Không phân biệt xu hướng mới/cũ
- Patterns cũ có thể không còn phù hợp
- Không thể phân tích theo mùa/thời điểm

### 3. **Không xử lý duplicate items**
❌ **Vấn đề:** Nếu 1 order có nhiều items giống nhau
```javascript
// Order: 2x Product A, 3x Product B
// Hiện tại: [A, A, B, B, B]
// Nên là: [A, B] với quantity
```

### 4. **Không tính utility chính xác**
❌ **Vấn đề:** Profit = price, không tính:
- Quantity (số lượng mua)
- Discount (giảm giá)
- Actual revenue (doanh thu thực)

## 💡 ĐỀ XUẤT TỐI ƯU HÓA

### Tối ưu 1: Lọc orders theo trạng thái hợp lệ
```javascript
// CHỈ lấy orders đã hoàn thành hoặc đang giao
const validStatuses = ['delivered', 'shipped', 'processing'];
const orders = await Order.find({
    orderStatus: { $in: validStatuses }
}).lean();
```

**Lý do:**
- Loại bỏ orders cancelled (không phản ánh hành vi mua thực tế)
- Loại bỏ orders pending (chưa chắc chắn)
- Chỉ phân tích orders có giá trị

### Tối ưu 2: Lọc theo khoảng thời gian
```javascript
// Lấy orders trong 6 tháng gần nhất
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

const orders = await Order.find({
    orderStatus: { $in: validStatuses },
    createdAt: { $gte: sixMonthsAgo }
}).lean();
```

**Lý do:**
- Phản ánh xu hướng hiện tại
- Loại bỏ patterns cũ không còn phù hợp
- Giảm noise từ dữ liệu lịch sử

### Tối ưu 3: Xử lý quantity đúng cách
```javascript
// Thay vì lặp lại item, lưu quantity
const itemQuantityMap = {};
details.forEach(d => {
    const productID = parseInt(d.SKU.split('-')[0]);
    itemQuantityMap[productID] = (itemQuantityMap[productID] || 0) + d.quantity;
});

// Transaction: productID (không lặp)
const productIDs = Object.keys(itemQuantityMap).map(id => parseInt(id));
```

**Lý do:**
- Tránh bias cho items mua nhiều
- Phản ánh đúng pattern "mua cùng nhau"
- Giảm kích thước dataset

### Tối ưu 4: Tính utility chính xác
```javascript
// Utility = quantity × price × (1 - discount)
const productUtilityMap = {};
details.forEach(d => {
    const productID = parseInt(d.SKU.split('-')[0]);
    const product = products.find(p => p.productID === productID);
    const utility = d.quantity * d.price; // Giá thực tế đã trả
    productUtilityMap[productID] = utility;
});
```

**Lý do:**
- Phản ánh giá trị thực tế
- Tính đến discount và promotion
- CoIUM sẽ ưu tiên patterns có utility cao



### Tối ưu 5: Thêm tham số cấu hình linh hoạt
```javascript
// Thêm options cho export
async function exportDataForCoIUM(options = {}) {
    const {
        validStatuses = ['delivered', 'shipped', 'processing'],
        monthsBack = 6,
        minOrderValue = 0,
        excludeCancelled = true
    } = options;
    
    // Build query động
    const query = {};
    if (excludeCancelled) {
        query.orderStatus = { $in: validStatuses };
    }
    if (monthsBack > 0) {
        const dateLimit = new Date();
        dateLimit.setMonth(dateLimit.getMonth() - monthsBack);
        query.createdAt = { $gte: dateLimit };
    }
    if (minOrderValue > 0) {
        query.paymentPrice = { $gte: minOrderValue };
    }
    
    const orders = await Order.find(query).lean();
}
```

**Lý do:**
- Linh hoạt điều chỉnh theo nhu cầu
- Dễ dàng A/B testing
- Không cần sửa code khi thay đổi tiêu chí

## 📈 DỰ ĐOÁN CẢI THIỆN

### Trước khi tối ưu:
```
Total orders: 500
- Delivered: 350
- Cancelled: 100
- Pending: 50

→ CoIUM phân tích 500 orders (có 150 orders không hợp lệ)
→ Accuracy: ~70%
```

### Sau khi tối ưu:
```
Total orders: 500
Filtered orders: 350 (chỉ delivered/shipped/processing)
Recent orders (6 months): 280

→ CoIUM phân tích 280 orders (100% hợp lệ)
→ Accuracy: ~95%
→ Patterns phản ánh xu hướng hiện tại
```

## 🎯 KẾ HOẠCH TRIỂN KHAI

### Phase 1: Lọc cơ bản (Ưu tiên cao)
- [ ] Lọc theo trạng thái orders (loại bỏ cancelled, pending)
- [ ] Test với dataset hiện tại
- [ ] So sánh kết quả trước/sau

### Phase 2: Lọc nâng cao (Ưu tiên trung bình)
- [ ] Thêm filter theo thời gian (6 tháng gần nhất)
- [ ] Thêm filter theo giá trị đơn hàng tối thiểu
- [ ] Xử lý quantity đúng cách

### Phase 3: Tối ưu utility (Ưu tiên thấp)
- [ ] Tính utility = quantity × price
- [ ] Tính discount vào utility
- [ ] Cập nhật profit file format

### Phase 4: Cấu hình linh hoạt
- [ ] Thêm config file cho export options
- [ ] Thêm UI để admin chọn tiêu chí lọc
- [ ] Lưu lịch sử export để so sánh

## 🔧 CODE IMPLEMENTATION

### File cần sửa:
1. `server/CoIUM/export-orders-for-coium.js` - Thêm logic lọc
2. `client/src/pages/admin/OrderManagement.jsx` - Thêm UI config (optional)
3. `CoIUM_Final/data_utils.py` - Hỗ trợ format mới (nếu cần)

### Backward compatibility:
- ✅ Giữ nguyên format file output
- ✅ Không thay đổi CoIUM algorithm
- ✅ Chỉ cải thiện chất lượng input data

## 📊 METRICS ĐỂ ĐÁNH GIÁ

### Trước khi deploy:
1. Số lượng orders trước/sau filter
2. Số lượng unique products
3. Average items per transaction
4. Top products frequency

### Sau khi deploy:
1. Số lượng patterns tìm được
2. Correlation scores trung bình
3. Utility trung bình
4. Recommendation accuracy (nếu có feedback)

## ⚠️ LƯU Ý

### Không làm:
- ❌ Thay đổi CoIUM algorithm
- ❌ Thay đổi format file output
- ❌ Xóa dữ liệu cũ (chỉ filter khi export)

### Nên làm:
- ✅ Backup dữ liệu trước khi test
- ✅ Log chi tiết quá trình filter
- ✅ So sánh kết quả với version cũ
- ✅ Document tất cả thay đổi

## 🚀 NEXT STEPS

1. **Review phân tích này** với team
2. **Chọn phase** để implement trước
3. **Tạo branch mới** cho development
4. **Implement + Test** từng phase
5. **Deploy** và monitor kết quả
