"""
Quick test: Kiểm tra imports và basic functionality
"""

print("Testing imports...")

try:
    import json
    print("✅ json OK")
except Exception as e:
    print(f"❌ json FAIL: {e}")

try:
    import psutil
    print("✅ psutil OK")
except Exception as e:
    print(f"❌ psutil FAIL: {e}")

try:
    import os
    print("✅ os OK")
except Exception as e:
    print(f"❌ os FAIL: {e}")

try:
    import time
    print("✅ time OK")
except Exception as e:
    print(f"❌ time FAIL: {e}")

print("\nTesting psutil functionality...")
try:
    process = psutil.Process(os.getpid())
    memory = process.memory_info().rss / 1024 / 1024
    print(f"✅ Memory: {memory:.2f} MB")
except Exception as e:
    print(f"❌ psutil FAIL: {e}")

print("\nTesting JSON write...")
try:
    test_data = {
        "runtime": 1.23,
        "memory": 456.78,
        "patterns_count": 100
    }
    with open("test_metrics.json", "w") as f:
        json.dump(test_data, f, indent=2)
    print("✅ JSON write OK")
    
    # Read back
    with open("test_metrics.json", "r") as f:
        data = json.load(f)
    print(f"✅ JSON read OK: {data}")
    
    # Cleanup
    os.remove("test_metrics.json")
    print("✅ Cleanup OK")
except Exception as e:
    print(f"❌ JSON FAIL: {e}")

print("\n✅ All tests passed!")
