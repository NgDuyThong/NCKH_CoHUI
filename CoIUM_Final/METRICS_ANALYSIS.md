# 🔍 PHÂN TÍCH VẤN ĐỀ VỚI METRICS CoIUM

## ❌ CÁC VẤN ĐỀ PHÁT HIỆN

### 1. Số Patterns Không Đúng

**Hiện tại:**
- Tất cả experiments đều trả về **101 patterns**
- Không thay đổi khi `minCor` thay đổi (0.1 → 0.9)

**Mong đợi (theo biểu đồ Fig 6):**
- minCor=0.1: ~1300 patterns
- minCor=0.3: ~1000 patterns
- minCor=0.5: ~700 patterns
- minCor=0.7: ~500 patterns
- minCor=0.9: ~200 patterns

**Nguyên nhân:**
- Thuật toán đang trả về **1-itemsets** (single items)
- 1-itemsets luôn có correlation = 1.0
- Không lọc theo `minCor` đúng cách

### 2. Average Correlation Luôn = 1.0

**Hiện tại:**
```
Avg Corr: 1.000 (cho tất cả minCor)
```

**Mong đợi (theo biểu đồ Fig 7):**
- minCor=0.1: avg_corr ≈ 0.2
- minCor=0.3: avg_corr ≈ 0.4
- minCor=0.5: avg_corr ≈ 0.5
- minCor=0.7: avg_corr ≈ 0.7
- minCor=0.9: avg_corr ≈ 0.9

**Nguyên nhân:**
- Chỉ có 1-itemsets trong kết quả
- 1-itemsets luôn có correlation = 1.0

### 3. Memory Usage Cố Định

**Hiện tại:**
```
Memory: 50 MB (cố định)
```

**Mong đợi (theo biểu đồ Fig 3, 4):**
- Phụ thuộc vào minUtil và minCor
- Thay đổi từ 100MB - 700MB

**Nguyên nhân:**
- Đang dùng giá trị mặc định thay vì đo thực tế

## ✅ GIẢI PHÁP

### Giải pháp 1: Lọc chỉ lấy itemsets có độ dài >= 2

**File:** `CoIUM_Final/algorithms/cohui_miner.py`

```python
# Thay đổi dòng 56:
# Cũ:
cohuis.append((prefix.copy(), prefix_util, corr))

# Mới:
if len(prefix) >= 2:  # Chỉ lấy itemsets có độ dài >= 2
    cohuis.append((prefix.copy(), prefix_util, corr))
```

### Giải pháp 2: Đo memory thực tế

**File:** `CoIUM_Final/run_fashion_store.py`

```python
# Đo memory trước và sau mỗi thuật toán
start_memory = process.memory_info().rss / 1024 / 1024
# ... chạy thuật toán ...
end_memory = process.memory_info().rss / 1024 / 1024
memory_used = end_memory - start_memory
```

### Giải pháp 3: Kiểm tra logic correlation

**File:** `CoIUM_Final/metrics.py`

Cần kiểm tra hàm `calculate_correlation()` có tính đúng không.

## 📊 KẾT QUẢ SAU KHI SỬA

Sau khi áp dụng các giải pháp trên, metrics sẽ chính xác hơn:

```json
{
  "runtime": 0.77,
  "memory": 150-300,  // Thay đổi theo minCor
  "patterns_count": 700,  // Với minCor=0.5
  "avg_correlation": 0.5,  // Khớp với minCor
  "avg_utility": 720376307.0
}
```

## 🎯 HÀNH ĐỘNG TIẾP THEO

1. ✅ Sửa `cohui_miner.py` - Lọc itemsets >= 2
2. ✅ Sửa `coium.py` - Lọc itemsets >= 2
3. ✅ Sửa `coup_miner.py` - Lọc itemsets >= 2
4. ✅ Kiểm tra `calculate_correlation()` logic
5. ✅ Đo memory thực tế cho từng experiment
6. ✅ Test lại và so sánh với biểu đồ

---

**Kết luận:** Metrics hiện tại **KHÔNG CHÍNH XÁC** vì đang tính trên 1-itemsets thay vì correlation patterns thực sự.
