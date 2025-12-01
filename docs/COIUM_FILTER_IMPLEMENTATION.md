# IMPLEMENTATION: TỐI ƯU HÓA LỌC ĐƠN HÀNG CHO COIUM

## 🎯 OBJECTIVE
Cải thiện chất lượng dữ liệu đầu vào cho CoIUM bằng cách lọc orders hợp lệ.

## 📝 CHANGES OVERVIEW

### File: `server/CoIUM/export-orders-for-coium.js`

#### Change 1: Thêm function lọc orders hợp lệ
```javascript
/**
 * Lọc orders hợp lệ cho CoIUM analysis
 * @param {Array} orders - Danh sách tất cả orders
 * @param {Object} options - Tùy chọn lọc
 * @returns {Array} - Danh sách orders đã lọc
 */
function filterValidOrders(orders, options = {}) {
    const {
        validStatuses = ['delivered', 'shipped', 'processing'],
        monthsBack = 6,
        minOrderValue = 0,
        excludeCancelled = true
    } = options;
    
    let filtered = [...orders];
    
    // 1. Lọc theo trạng thái
    if (excludeCancelled) {
        filtered = filtered.filter(order => 
            validStatuses.includes(order.orderStatus)
        );
        console.log(`   ✓ Sau khi lọc trạng thái: ${filtered.length} orders`);
    }
    
    // 2. Lọc theo thời gian
    if (monthsBack > 0) {
        const dateLimit = new Date();
        dateLimit.setMonth(dateLimit.getMonth() - monthsBack);
        filtered = filtered.filter(order => 
            new Date(order.createdAt) >= dateLimit
        );
        console.log(`   ✓ Sau khi lọc thời gian (${monthsBack} tháng): ${filtered.length} orders`);
    }
    
    // 3. Lọc theo giá trị đơn hàng
    if (minOrderValue > 0) {
        filtered = filtered.filter(order => 
            order.paymentPrice >= minOrderValue
        );
        console.log(`   ✓ Sau khi lọc giá trị (>= ${minOrderValue}): ${filtered.length} orders`);
    }
    
    return filtered;
}
```

#### Change 2: Xử lý quantity đúng cách
```javascript
/**
 * Tạo transaction từ order details (không lặp lại items)
 * @param {Array} details - Order details
 * @returns {Array} - Danh sách unique productIDs
 */
function createTransaction(details) {
    const productSet = new Set();
    
    details.forEach(d => {
        const parts = d.SKU.split('-');
        const productID = parseInt(parts[0]);
        if (!isNaN(productID)) {
            productSet.add(productID);
        }
    });
    
    return Array.from(productSet).sort((a, b) => a - b);
}
```

#### Change 3: Tính utility chính xác
```javascript
/**
 * Tính utility cho mỗi product trong order
 * @param {Array} details - Order details
 * @param {Object} productMap - Map productID -> product info
 * @returns {Object} - Map productID -> utility
 */
function calculateProductUtilities(details, productMap) {
    const utilities = {};
    
    details.forEach(d => {
        const parts = d.SKU.split('-');
        const productID = parseInt(parts[0]);
        
        if (!isNaN(productID)) {
            // Utility = quantity × actual price paid
            const utility = d.quantity * d.price;
            utilities[productID] = (utilities[productID] || 0) + utility;
        }
    });
    
    return utilities;
}
```

#### Change 4: Update main function
```javascript
async function exportDataForCoIUM(options = {}) {
    try {
        console.log('🔌 Đang kết nối MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối thành công!\n');

        // Lấy tất cả orders
        console.log('📦 Đang lấy dữ liệu orders...');
        const allOrders = await Order.find({}).lean();
        console.log(`✅ Đã lấy ${allOrders.length} orders\n`);
        
        // ===== LỌC ORDERS HỢP LỆ =====
        console.log('🔍 Đang lọc orders hợp lệ...');
        const validOrders = filterValidOrders(allOrders, options);
        console.log(`✅ Còn lại ${validOrders.length} orders hợp lệ\n`);
        
        // Lấy order details và products
        const orderDetails = await OrderDetail.find({}).lean();
        const products = await Product.find({}).lean();
        
        // Tạo maps
        const orderDetailsMap = {};
        orderDetails.forEach(od => {
            if (!orderDetailsMap[od.orderID]) {
                orderDetailsMap[od.orderID] = [];
            }
            orderDetailsMap[od.orderID].push(od);
        });
        
        const productMap = {};
        products.forEach(p => {
            productMap[p.productID] = p;
        });
        
        // ===== TẠO TRANSACTIONS =====
        console.log('📝 Đang tạo transactions...');
        let transactionLines = [];
        let validTransactionCount = 0;
        const allProductUtilities = {};
        
        validOrders.forEach(order => {
            const details = orderDetailsMap[order.orderID] || [];
            if (details.length > 0) {
                // Tạo transaction (unique products)
                const productIDs = createTransaction(details);
                
                if (productIDs.length > 0) {
                    transactionLines.push(productIDs.join(' '));
                    validTransactionCount++;
                    
                    // Tính utilities
                    const utilities = calculateProductUtilities(details, productMap);
                    Object.entries(utilities).forEach(([pid, util]) => {
                        allProductUtilities[pid] = (allProductUtilities[pid] || 0) + util;
                    });
                }
            }
        });
        
        // Lưu files...
        // (giữ nguyên phần còn lại)
        
        // ===== THỐNG KÊ CHI TIẾT =====
        console.log('\n📊 THỐNG KÊ LỌC DỮ LIỆU:\n');
        console.log('═'.repeat(80));
        console.log(`Tổng số orders ban đầu    : ${allOrders.length}`);
        console.log(`Orders sau khi lọc        : ${validOrders.length}`);
        console.log(`Tỷ lệ giữ lại             : ${((validOrders.length / allOrders.length) * 100).toFixed(2)}%`);
        console.log(`Transactions hợp lệ       : ${validTransactionCount}`);
        console.log('═'.repeat(80));
        
        // Thống kê orders bị loại bỏ
        const removedOrders = allOrders.length - validOrders.length;
        if (removedOrders > 0) {
            console.log(`\n🗑️  ORDERS BỊ LOẠI BỎ: ${removedOrders}\n`);
            
            const statusCount = {};
            allOrders.forEach(order => {
                if (!validOrders.find(v => v.orderID === order.orderID)) {
                    statusCount[order.orderStatus] = (statusCount[order.orderStatus] || 0) + 1;
                }
            });
            
            Object.entries(statusCount).forEach(([status, count]) => {
                console.log(`   - ${status}: ${count} orders`);
            });
        }
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.disconnect();
    }
}
```

## 🔧 USAGE

### Cách 1: Sử dụng mặc định (recommended)
```bash
node server/CoIUM/export-orders-for-coium.js
```
**Mặc định:**
- Chỉ lấy orders: delivered, shipped, processing
- Trong 6 tháng gần nhất
- Không có giá trị tối thiểu

### Cách 2: Custom options
```javascript
// Trong file export-orders-for-coium.js
exportDataForCoIUM({
    validStatuses: ['delivered', 'shipped'],
    monthsBack: 3,
    minOrderValue: 100000,
    excludeCancelled: true
});
```

### Cách 3: Tạo config file
```javascript
// server/CoIUM/config.json
{
    "filterOptions": {
        "validStatuses": ["delivered", "shipped", "processing"],
        "monthsBack": 6,
        "minOrderValue": 0,
        "excludeCancelled": true
    }
}

// Trong export-orders-for-coium.js
const config = require('./config.json');
exportDataForCoIUM(config.filterOptions);
```

## 📊 EXPECTED OUTPUT

### Console log mẫu:
```
🔌 Đang kết nối MongoDB...
✅ Kết nối thành công!

📦 Đang lấy dữ liệu orders...
✅ Đã lấy 500 orders

🔍 Đang lọc orders hợp lệ...
   ✓ Sau khi lọc trạng thái: 380 orders
   ✓ Sau khi lọc thời gian (6 tháng): 280 orders
   ✓ Sau khi lọc giá trị (>= 0): 280 orders
✅ Còn lại 280 orders hợp lệ

📝 Đang tạo transactions...
✅ Đã tạo fashion_store.dat
   - 280 transactions hợp lệ

💰 Đang tạo profits...
✅ Đã tạo fashion_store_profits.txt
   - 45 sản phẩm có profit

📊 THỐNG KÊ LỌC DỮ LIỆU:
════════════════════════════════════════════════════════════════════════════════
Tổng số orders ban đầu    : 500
Orders sau khi lọc        : 280
Tỷ lệ giữ lại             : 56.00%
Transactions hợp lệ       : 280
════════════════════════════════════════════════════════════════════════════════

🗑️  ORDERS BỊ LOẠI BỎ: 220

   - cancelled: 100 orders
   - pending: 50 orders
   - old_orders: 70 orders
```

## ✅ TESTING CHECKLIST

- [ ] Test với database hiện tại
- [ ] Verify số lượng orders trước/sau filter
- [ ] Check format file output không thay đổi
- [ ] Run CoIUM với data mới
- [ ] So sánh patterns trước/sau
- [ ] Verify recommendations có ý nghĩa hơn

## 🚀 DEPLOYMENT

1. Backup file cũ:
```bash
cp server/CoIUM/export-orders-for-coium.js server/CoIUM/export-orders-for-coium.js.backup
```

2. Apply changes

3. Test:
```bash
node server/CoIUM/export-orders-for-coium.js
```

4. Run CoIUM:
```bash
cd CoIUM_Final
python run_fashion_store.py
```

5. Compare results

## 📈 SUCCESS METRICS

- ✅ Giảm noise data (loại bỏ cancelled orders)
- ✅ Tăng relevance (chỉ phân tích orders gần đây)
- ✅ Patterns chính xác hơn
- ✅ Recommendations phù hợp hơn với xu hướng hiện tại
