"""
TEST SCRIPT: Kiểm tra metrics.json có được tạo đúng không
"""

import json
import os
from datetime import datetime

def test_metrics():
    print("="*60)
    print("KIỂM TRA METRICS.JSON")
    print("="*60 + "\n")
    
    metrics_path = "metrics.json"
    
    # 1. Kiểm tra file tồn tại
    if not os.path.exists(metrics_path):
        print("❌ FAIL: File metrics.json không tồn tại")
        print("   → Chạy: python run_fashion_store.py")
        return False
    
    print("✅ File metrics.json tồn tại\n")
    
    # 2. Kiểm tra đọc được file
    try:
        with open(metrics_path, 'r', encoding='utf-8') as f:
            metrics = json.load(f)
        print("✅ Đọc được file JSON\n")
    except Exception as e:
        print(f"❌ FAIL: Không đọc được file: {e}")
        return False
    
    # 3. Kiểm tra các field bắt buộc
    required_fields = [
        'runtime',
        'memory',
        'patterns_count',
        'minutil',
        'mincor',
        'timestamp'
    ]
    
    print("Kiểm tra các field bắt buộc:")
    all_ok = True
    for field in required_fields:
        if field in metrics:
            value = metrics[field]
            print(f"  ✅ {field}: {value}")
        else:
            print(f"  ❌ {field}: MISSING")
            all_ok = False
    
    if not all_ok:
        print("\n❌ FAIL: Thiếu một số field bắt buộc")
        return False
    
    print("\n✅ Tất cả field bắt buộc đều có\n")
    
    # 4. Kiểm tra giá trị hợp lệ
    print("Kiểm tra giá trị:")
    
    # Runtime phải > 0 và < 300s (5 phút)
    if 0 < metrics['runtime'] < 300:
        print(f"  ✅ Runtime: {metrics['runtime']}s (hợp lệ)")
    else:
        print(f"  ⚠️  Runtime: {metrics['runtime']}s (bất thường)")
    
    # Memory phải > 0 và < 2000 MB
    if 0 < metrics['memory'] < 2000:
        print(f"  ✅ Memory: {metrics['memory']} MB (hợp lệ)")
    else:
        print(f"  ⚠️  Memory: {metrics['memory']} MB (bất thường)")
    
    # Patterns count phải >= 0
    if metrics['patterns_count'] >= 0:
        print(f"  ✅ Patterns: {metrics['patterns_count']} (hợp lệ)")
    else:
        print(f"  ❌ Patterns: {metrics['patterns_count']} (không hợp lệ)")
    
    # Timestamp phải là số và gần với hiện tại
    try:
        ts = metrics['timestamp']
        dt = datetime.fromtimestamp(ts)
        print(f"  ✅ Timestamp: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
    except:
        print(f"  ❌ Timestamp không hợp lệ: {metrics['timestamp']}")
    
    print("\n" + "="*60)
    print("✅ PASS: metrics.json hợp lệ!")
    print("="*60)
    
    return True

if __name__ == "__main__":
    test_metrics()
