# CoIUM - Correlation-based Item Utility Mining

Thư mục này chứa các file xử lý thuật toán CoIUM và tích hợp với server.

## 📁 Cấu Trúc Files

### 1. `export-orders-for-coium.js`
**Mục đích**: Export dữ liệu orders và order_details từ MongoDB sang định dạng CoIUM

**Input**: MongoDB (Orders, OrderDetails, Products)

**Output**:
- `../../CoIUM_Final/datasets/fashion_store.dat` - File transactions
- `../../CoIUM_Final/profits/fashion_store_profits.txt` - File profits

**Cách chạy**:
```bash
node export-orders-for-coium.js
```

**Định dạng output**:
- **Transactions**: Mỗi dòng là 1 order, chứa các productID cách nhau bởi space
  ```
  1 5 10 23
  2 15 20
  ```
- **Profits**: Mỗi dòng là 1 cặp productID và profit
  ```
  1 50000
  2 75000
  ```

---

### 2. `generate-correlation-map.js`
**Mục đích**: Tạo file `correlation_map.json` từ kết quả phân tích CoIUM

**Input**: `../../CoIUM_Final/correlation_recommendations.json`

**Output**: `correlation_map.json`

**Cách chạy**:
```bash
node generate-correlation-map.js
```

**Định dạng output**:
```json
{
  "104": [
    {
      "productID": 76,
      "name": "Quần Tuytsi ống loe Artiste",
      "categoryID": 7,
      "targetID": 2,
      "price": 645000
    }
  ]
}
```

---

### 3. `correlation_map.json`
**Mục đích**: File cache chứa dữ liệu correlation đã được làm giàu với thông tin sản phẩm

**Sử dụng bởi**: 
- `CoHUIController.js` - Load correlation map để gợi ý sản phẩm
- Tự động reload khi file thay đổi

**Cấu trúc**:
- Key: productID (string)
- Value: Array của objects chứa thông tin sản phẩm liên quan

---

## 🔄 Quy Trình Hoạt Động

### Khi click nút "Chạy CoIUM" trên admin panel:

1. **Export Data** (`export-orders-for-coium.js`)
   - Lấy tất cả orders từ MongoDB
   - Chuyển đổi sang định dạng CoIUM
   - Lưu vào `CoIUM_Final/datasets/`

2. **Run CoIUM Algorithm** (`../../CoIUM_Final/run_fashion_store.py`)
   - Chạy thuật toán CoIUM, CoUPM, CoHUI-Miner
   - Tạo file kết quả trong `CoIUM_Final/results/`

3. **Analyze Correlation** (`../../CoIUM_Final/analyze_correlation_results.py`)
   - Tính co-occurrence matrix
   - Tính Lift scores
   - Tạo `correlation_recommendations.json`

4. **Generate Correlation Map** (`generate-correlation-map.js`)
   - Đọc `correlation_recommendations.json`
   - Làm giàu với thông tin sản phẩm từ MongoDB
   - Tạo `correlation_map.json`

---

## 🔌 API Endpoints Sử Dụng

### 1. POST `/api/coium-process/run`
Chạy toàn bộ quy trình CoIUM (4 bước trên)

**Response**:
```json
{
  "success": true,
  "message": "Chạy CoIUM thành công!",
  "data": {
    "totalProducts": 105,
    "totalRecommendations": 1050,
    "avgRecommendationsPerProduct": "10.00"
  }
}
```

### 2. GET `/api/cohui/recommendations/:productID`
Lấy danh sách sản phẩm tương quan với 1 sản phẩm cụ thể

### 3. GET `/api/cohui/bought-together/:productID`
Lấy danh sách sản phẩm thường mua cùng

### 4. GET `/api/cohui/recommendations`
Lấy danh sách sản phẩm được gợi ý nhiều nhất

---

## 📝 Lưu Ý

- File `correlation_map.json` được cache trong memory ở `CoHUIController.js`
- Khi file thay đổi, sẽ tự động reload
- Nên chạy lại quy trình CoIUM khi:
  - Cập nhật giá sản phẩm
  - Thêm nhiều đơn hàng mới
  - Thêm/xóa sản phẩm

---

## 🔗 Liên Kết

- **CoIUM Algorithm**: `../../CoIUM_Final/`
- **Controller**: `../controllers/CoIUMProcessController.js`
- **Route**: `../routes/coium-process.route.js`
