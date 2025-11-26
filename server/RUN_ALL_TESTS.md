# 🧪 HƯỚNG DẪN CHẠY TESTS

## 📋 Danh sách Tests

### Unit Tests (30 tests)
```bash
# Chạy tất cả unit tests
npm run test:unit

# Hoặc chạy từng file
npm test tests/unit/auth.test.js
npm test tests/unit/product.test.js
npm test tests/unit/cohui.test.js
npm test tests/unit/utils.test.js
```

### Integration Tests (18 tests)
```bash
# Chạy tất cả integration tests
npm run test:integration

# Hoặc chạy từng file
npm test tests/integration/auth.api.test.js
npm test tests/integration/product.api.test.js
```

### Chạy TẤT CẢ Tests
```bash
# Chạy tất cả tests một lần
npm test -- --run

# Chạy với UI mode
npm run test:ui

# Chạy với coverage report
npm run test:coverage
```

---

## 📊 Kết quả mong đợi

```
✓ tests/unit/auth.test.js (9)
✓ tests/unit/product.test.js (9)
✓ tests/unit/cohui.test.js (6)
✓ tests/unit/utils.test.js (6)
✓ tests/integration/auth.api.test.js (9)
✓ tests/integration/product.api.test.js (9)

Test Files  6 passed (6)
Tests  48 passed (48)
Duration  ~15-20s
```

---

## 🎯 Coverage Report

Sau khi chạy `npm run test:coverage`, mở file:
```
server/coverage/index.html
```

Trong browser để xem báo cáo chi tiết.

---

## ⚠️ Lưu ý

1. **MongoDB Memory Server**: Lần đầu chạy có thể mất 30-60s để download
2. **Port conflicts**: Đảm bảo không có server nào đang chạy trên port 5000
3. **Node version**: Cần Node.js >= 18.x

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module"
```bash
cd server
npm install
```

### Lỗi: "MongoDB Memory Server download failed"
```bash
# Xóa cache và thử lại
rm -rf node_modules/.cache
npm test
```

### Lỗi: "Port already in use"
```bash
# Kill process đang dùng port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

---

## 📝 Test Scripts trong package.json

```json
{
  "scripts": {
    "test": "cross-env NODE_ENV=test vitest",
    "test:unit": "cross-env NODE_ENV=test vitest run tests/unit",
    "test:integration": "cross-env NODE_ENV=test vitest run tests/integration",
    "test:coverage": "cross-env NODE_ENV=test vitest run --coverage",
    "test:ui": "cross-env NODE_ENV=test vitest --ui",
    "test:watch": "cross-env NODE_ENV=test vitest watch"
  }
}
```
