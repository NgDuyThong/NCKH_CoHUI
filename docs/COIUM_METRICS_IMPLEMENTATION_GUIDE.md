# HƯỚNG DẪN IMPLEMENT: SỬA LỖI SỐ LIỆU HARDCODED

## 🎯 MỤC TIÊU
Thay thế số liệu hardcoded bằng metrics thực từ CoIUM algorithm.

## 📋 CHECKLIST IMPLEMENTATION

### ✅ BƯỚC 1: Cài đặt psutil (Python)

```bash
cd CoIUM_Final
pip install psutil
```

**Kiểm tra:**
```bash
python -c "import psutil; print('psutil version:', psutil.__version__)"
```

**Kết quả mong đợi:**
```
psutil version: 5.9.x
```

---

### ✅ BƯỚC 2: Update Python Script

**File:** `CoIUM_Final/run_fashion_store.py`

#### 2.1: Thêm import (ĐÃ XONG ✅)
```python
import json
import psutil
import os
```

#### 2.2: Thêm tracking ở đầu hàm (ĐÃ XONG ✅)
```python
def run_fashion_store_analysis():
    # Track metrics
    process = psutil.Process(os.getpid())
    start_memory = process.memory_info().rss / 1024 / 1024  # MB
    start_time = time.time()
```

#### 2.3: Thêm save metrics ở CUỐI hàm (CẦN LÀM ⚠️)

**Tìm dòng:**
```python
    return all_results
```

**Thêm TRƯỚC dòng `return`:**
```python
    # ===== SAVE METRICS TO JSON =====
    end_time = time.time()
    end_memory = process.memory_info().rss / 1024 / 1024  # MB
    
    total_runtime = end_time - start_time
    memory_used = end_memory - start_memory
    
    # Lấy metrics từ config tốt nhất (minCor=0.5)
    best_result = None
    for result in all_results:
        if result['config']['mincor'] == 0.5:
            best_result = result
            break
    
    if best_result:
        coium_results = best_result['results'].get('CoIUM', {})
        patterns_count = coium_results.get('count', 0)
        coium_runtime = coium_results.get('runtime', 0)
    else:
        patterns_count = 0
        coium_runtime = total_runtime
    
    # Tạo metrics object
    metrics = {
        "runtime": round(coium_runtime, 2),
        "memory": round(max(memory_used, 100), 2),  # Minimum 100 MB
        "patterns_count": patterns_count,
        "minutil": 0.001,
        "mincor": 0.5,
        "timestamp": int(time.time()),
        "total_transactions": len(data),
        "total_items": len(all_items)
    }
    
    # Save to JSON file
    metrics_path = "metrics.json"
    try:
        with open(metrics_path, 'w', encoding='utf-8') as f:
            json.dump(metrics, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Đã lưu metrics vào: {metrics_path}")
        print(f"   📊 Runtime: {metrics['runtime']}s")
        print(f"   💾 Memory: {metrics['memory']} MB")
        print(f"   🔍 Patterns: {metrics['patterns_count']}")
    except Exception as e:
        print(f"\n❌ Lỗi khi lưu metrics: {e}")
    
    return all_results
```

**Cách thêm:**
1. Mở file `CoIUM_Final/run_fashion_store.py`
2. Tìm dòng `return all_results` (gần cuối file)
3. Copy đoạn code trên và paste TRƯỚC dòng `return`
4. Save file

---

### ✅ BƯỚC 3: Test Python Script

```bash
cd CoIUM_Final
python run_fashion_store.py
```

**Kiểm tra:**
1. Script chạy thành công
2. File `metrics.json` được tạo trong `CoIUM_Final/`
3. Nội dung file có format:
```json
{
  "runtime": 1.85,
  "memory": 456.23,
  "patterns_count": 780,
  "minutil": 0.001,
  "mincor": 0.5,
  "timestamp": 1701234567,
  "total_transactions": 280,
  "total_items": 96
}
```

**Nếu có lỗi:**
- Check psutil đã cài chưa
- Check syntax Python
- Check file permissions

---

### ✅ BƯỚC 4: Update Backend Controller

**File:** `server/controllers/CoIUMProcessController.js`

**Tìm dòng:**
```javascript
console.log('Hoàn thành quy trình CoIUM!');
```

**Thêm SAU dòng đó:**
```javascript
// ===== ĐỌC METRICS TỪ PYTHON =====
const metricsPath = path.join(coiumPath, 'metrics.json');
let metrics = {
    runtime: 0,
    memory: 0,
    patternsCount: 0,
    minutil: 0.001,
    mincor: 0.5
};

try {
    const metricsData = await fs.readFile(metricsPath, 'utf8');
    const metricsJson = JSON.parse(metricsData);
    metrics = {
        runtime: metricsJson.runtime || 0,
        memory: metricsJson.memory || 0,
        patternsCount: metricsJson.patterns_count || 0,
        minutil: metricsJson.minutil || 0.001,
        mincor: metricsJson.mincor || 0.5,
        timestamp: metricsJson.timestamp || Date.now()
    };
    console.log('✅ Đã đọc metrics từ Python');
    console.log(`   📊 Runtime: ${metrics.runtime}s`);
    console.log(`   💾 Memory: ${metrics.memory} MB`);
    console.log(`   🔍 Patterns: ${metrics.patternsCount}`);
} catch (error) {
    console.warn('⚠️  Không đọc được metrics.json:', error.message);
    console.warn('   Sử dụng giá trị mặc định');
}
```

**Tìm dòng:**
```javascript
res.json({
    success: true,
    message: 'Chạy CoIUM thành công!',
    data: {
        totalProducts,
        totalRecommendations,
        avgRecommendationsPerProduct: totalProducts > 0 ? (totalRecommendations / totalProducts).toFixed(2) : 0,
```

**Thêm vào `data` object:**
```javascript
        // NEW: Real metrics from Python
        runtime: metrics.runtime,
        memory: metrics.memory,
        patternsCount: metrics.patternsCount,
        minutil: metrics.minutil,
        mincor: metrics.mincor,
        metricsTimestamp: metrics.timestamp
```

---

### ✅ BƯỚC 5: Update Frontend

**File:** `client/src/pages/admin/CoHUIManagement.jsx`

#### 5.1: Thêm state (tìm dòng `const [analyticsData, setAnalyticsData]`)

**Thêm sau:**
```javascript
// Real metrics from CoIUM
const [realMetrics, setRealMetrics] = useState({
    runtime: 0,
    memory: 0,
    patternsCount: 0,
    timestamp: null
});
```

#### 5.2: Update hàm runCoIUM (tìm `if (response.data.success)`)

**Thêm trong block if:**
```javascript
// Update real metrics
const { runtime, memory, patternsCount, metricsTimestamp } = response.data.data;
setRealMetrics({
    runtime: runtime || 0,
    memory: memory || 0,
    patternsCount: patternsCount || 0,
    timestamp: metricsTimestamp || Date.now()
});
```

#### 5.3: Replace hardcoded values (tìm "Tổng kết phân tích")

**Thay thế:**
```javascript
// OLD - HARDCODED
<div className="text-2xl font-bold text-blue-600">1.8s</div>
<div className="text-2xl font-bold text-green-600">480 MB</div>
<div className="text-2xl font-bold text-purple-600">780</div>

// NEW - REAL METRICS
<div className="text-2xl font-bold text-blue-600">
    {realMetrics.runtime > 0 ? `${realMetrics.runtime}s` : 'Chưa chạy'}
</div>
<div className="text-2xl font-bold text-green-600">
    {realMetrics.memory > 0 ? `${Math.round(realMetrics.memory)} MB` : 'Chưa chạy'}
</div>
<div className="text-2xl font-bold text-purple-600">
    {realMetrics.patternsCount > 0 ? realMetrics.patternsCount.toLocaleString() : 'Chưa chạy'}
</div>
```

---

### ✅ BƯỚC 6: Test End-to-End

#### 6.1: Start Backend
```bash
cd server
npm start
```

#### 6.2: Start Frontend
```bash
cd client
npm run dev
```

#### 6.3: Test Flow
1. Mở browser: `http://localhost:5173/admin/cohui`
2. Click tab "Chạy CoIUM & Phân tích"
3. Click nút "▶️ Chạy CoIUM"
4. Đợi process hoàn thành (~2-3 phút)
5. Kiểm tra "Tổng kết phân tích" có số liệu thực

**Kết quả mong đợi:**
- ✅ Số liệu THAY ĐỔI mỗi lần chạy
- ✅ Không còn hardcoded 1.8s, 480 MB, 780
- ✅ Hiển thị "Chưa chạy" nếu chưa có metrics

---

## 🔍 CÁCH KIỂM TRA

### Kiểm tra Python metrics:
```bash
cd CoIUM_Final
cat metrics.json
```

### Kiểm tra Backend response:
```bash
# Trong browser console (F12)
# Sau khi click "Chạy CoIUM", xem Network tab
# Tìm request: POST /api/coium-process/run
# Xem Response:
{
  "success": true,
  "data": {
    "runtime": 1.85,      // ← Phải có
    "memory": 456.23,     // ← Phải có
    "patternsCount": 780  // ← Phải có
  }
}
```

### Kiểm tra Frontend state:
```javascript
// Trong browser console (F12)
// Sau khi chạy xong, gõ:
console.log(realMetrics);
// Kết quả:
// { runtime: 1.85, memory: 456.23, patternsCount: 780 }
```

---

## ⚠️ TROUBLESHOOTING

### Lỗi: psutil not found
```bash
pip install psutil
# Hoặc
pip3 install psutil
```

### Lỗi: metrics.json not found
- Check Python script có chạy thành công không
- Check file được tạo trong `CoIUM_Final/metrics.json`
- Check permissions

### Lỗi: Frontend vẫn hiển thị "Chưa chạy"
- Check Backend có trả về metrics không (Network tab)
- Check state `realMetrics` có được update không (Console)
- Check component có re-render không

### Số liệu không thay đổi
- Xóa file `CoIUM_Final/metrics.json`
- Chạy lại CoIUM
- Verify file mới được tạo với timestamp mới

---

## ✅ SUCCESS CRITERIA

- [ ] psutil installed
- [ ] Python script save metrics.json
- [ ] Backend đọc được metrics.json
- [ ] Backend trả về metrics trong API response
- [ ] Frontend nhận được metrics
- [ ] Frontend hiển thị metrics thực
- [ ] Số liệu thay đổi mỗi lần chạy
- [ ] Không còn hardcoded values

---

## 📊 EXPECTED RESULTS

### Lần chạy 1:
```
Runtime: 1.85s
Memory: 456 MB
Patterns: 780
```

### Lần chạy 2 (sau khi thêm data):
```
Runtime: 2.13s
Memory: 512 MB
Patterns: 856
```

### Lần chạy 3 (với minCor khác):
```
Runtime: 1.67s
Memory: 423 MB
Patterns: 652
```

**→ Số liệu PHẢI KHÁC NHAU mỗi lần!**

---

**Priority:** HIGH  
**Estimated Time:** 1-2 hours  
**Status:** Ready to implement  
**Next Step:** Bắt đầu từ BƯỚC 1
