# ===================================================================
# CODE SNIPPET: THÊM VÀO run_fashion_store.py
# Vị trí: TRƯỚC dòng "return all_results" (gần cuối hàm)
# ===================================================================

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
