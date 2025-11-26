# TEST CASE SPECIFICATION - ICONDENIM E-COMMERCE SYSTEM
## Khóa luận tốt nghiệp - Testing Documentation

---

## 📋 TỔNG QUAN

**Dự án:** IconDenim - Website Bán Quần Áo Thời Trang  
**Mục đích:** Kiểm thử toàn diện hệ thống (Unit, Integration, E2E)  
**Phương pháp:** Test-Driven Development (TDD)  
**Framework:** Vitest + React Testing Library + Playwright  
**Tổng số Test Cases:** 150 test cases

---

## 📊 PHÂN BỐ TEST CASES

### Backend Testing (60 test cases)
- **Unit Tests:** 30 test cases
- **Integration Tests:** 30 test cases

### Frontend Testing (60 test cases)
- **Unit Tests:** 30 test cases
- **Integration Tests:** 30 test cases

### E2E Testing (30 test cases)
- **Critical User Flows:** 30 test cases

---

## 🎯 CẤU TRÚC TEST CASE

Mỗi test case bao gồm:
1. **Test Case#** - Mã định danh duy nhất
2. **Test case functions** - Chức năng được test
3. **Test case types** - Loại test (Normal/Abnormal/Boundary)
4. **Test Title** - Tiêu đề mô tả test
5. **Test Data** - Dữ liệu đầu vào
6. **Expected Result** - Kết quả mong đợi
7. **Actual Result** - Kết quả thực tế (để trống, điền khi chạy test)
8. **Status** - Trạng thái (Pass/Fail/Pending)
9. **Notes** - Ghi chú bổ sung

---


# PHẦN 1: BACKEND TESTING

## A. UNIT TESTS - BACKEND (30 test cases)

---

### A1. Authentication Controller Tests (9 test cases)

#### A1.1 Register Function

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-UT-001 | register() | Normal | Đăng ký tài khoản thành công với dữ liệu hợp lệ | `{fullname: "Nguyen Van A", email: "test@gmail.com", password: "Pass123!", phone: "0901234567", gender: "male"}` | Status 201, trả về token và user info | | Pending | |
| BE-UT-002 | register() | Abnormal | Đăng ký với email đã tồn tại | `{email: "existing@gmail.com", ...}` | Status 400, message: "Email đã được sử dụng" | | Pending | |
| BE-UT-003 | register() | Abnormal | Đăng ký với số điện thoại đã tồn tại | `{phone: "0901234567", ...}` | Status 400, message: "Số điện thoại đã được sử dụng" | | Pending | |
| BE-UT-004 | register() | Boundary | Đăng ký với password ngắn hơn 6 ký tự | `{password: "12345", ...}` | Status 400, validation error | | Pending | |
| BE-UT-005 | register() | Boundary | Đăng ký với email không hợp lệ | `{email: "invalid-email", ...}` | Status 400, validation error | | Pending | |

#### A1.2 Login Function

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-UT-006 | login() | Normal | Đăng nhập thành công với thông tin đúng | `{email: "test@gmail.com", password: "Pass123!"}` | Status 200, trả về token và user info | | Pending | |
| BE-UT-007 | login() | Abnormal | Đăng nhập với email không tồn tại | `{email: "notexist@gmail.com", password: "Pass123!"}` | Status 401, message: "Email không tồn tại" | | Pending | |
| BE-UT-008 | login() | Abnormal | Đăng nhập với mật khẩu sai | `{email: "test@gmail.com", password: "WrongPass"}` | Status 401, message: "Mật khẩu không đúng" | | Pending | |
| BE-UT-009 | login() | Boundary | Đăng nhập sau 5 lần thất bại (account locked) | `{email: "locked@gmail.com", password: "any"}` | Status 403, message: "Tài khoản bị khóa" | | Pending | Test lockout mechanism |

---

### A2. Product Controller Tests (9 test cases)

#### A2.1 Get Products Function

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-UT-010 | getProducts() | Normal | Lấy danh sách sản phẩm với pagination mặc định | `{page: 1, limit: 12}` | Status 200, trả về 12 sản phẩm, có pagination info | | Pending | |
| BE-UT-011 | getProducts() | Normal | Lọc sản phẩm theo category | `{category: 1, page: 1}` | Status 200, chỉ trả về sản phẩm thuộc category 1 | | Pending | |
| BE-UT-012 | getProducts() | Normal | Lọc sản phẩm theo target (Nam/Nữ) | `{target: 1, page: 1}` | Status 200, chỉ trả về sản phẩm cho Nam | | Pending | |
| BE-UT-013 | getProducts() | Normal | Lọc sản phẩm theo khoảng giá | `{minPrice: 100000, maxPrice: 500000}` | Status 200, chỉ trả về sản phẩm trong khoảng giá | | Pending | |
| BE-UT-014 | getProducts() | Normal | Tìm kiếm sản phẩm theo tên | `{search: "áo thun"}` | Status 200, trả về sản phẩm có tên chứa "áo thun" | | Pending | |
| BE-UT-015 | getProducts() | Normal | Sắp xếp sản phẩm theo giá tăng dần | `{sort: "price-asc"}` | Status 200, sản phẩm được sắp xếp giá tăng dần | | Pending | |
| BE-UT-016 | getProducts() | Boundary | Lấy sản phẩm với page vượt quá số trang | `{page: 9999, limit: 12}` | Status 200, trả về mảng rỗng | | Pending | |
| BE-UT-017 | getProducts() | Boundary | Lấy sản phẩm với limit = 0 | `{page: 1, limit: 0}` | Status 400, validation error | | Pending | |
| BE-UT-018 | getProducts() | Abnormal | Lọc với category không tồn tại | `{category: 9999}` | Status 200, trả về mảng rỗng | | Pending | |

---

### A3. CoHUI Controller Tests (6 test cases)

#### A3.1 Load Correlation Map Function

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-UT-019 | loadCorrelationMap() | Normal | Load correlation map thành công | File `correlation_map.json` tồn tại | Trả về object chứa correlation data | | Pending | |
| BE-UT-020 | loadCorrelationMap() | Abnormal | Load khi file không tồn tại | File không tồn tại | Trả về null, log warning | | Pending | |
| BE-UT-021 | loadCorrelationMap() | Abnormal | Load file JSON không hợp lệ | File JSON bị lỗi syntax | Trả về null, log error | | Pending | |

#### A3.2 Get Recommendations Function

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-UT-022 | getRecommendations() | Normal | Lấy recommendations cho product ID hợp lệ | `productID: 104` | Status 200, trả về danh sách sản phẩm tương quan | | Pending | |
| BE-UT-023 | getRecommendations() | Abnormal | Lấy recommendations cho product không tồn tại | `productID: 99999` | Status 404, message: "Sản phẩm không tồn tại" | | Pending | |
| BE-UT-024 | getRecommendations() | Boundary | Lấy recommendations khi chưa chạy CoIUM | Correlation map = null | Status 400, message: "Chưa có dữ liệu phân tích" | | Pending | |

---

### A4. Utils Functions Tests (6 test cases)

#### A4.1 JWT Token Generation

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-UT-025 | generateToken() | Normal | Tạo JWT token với userID hợp lệ | `userID: 12345` | Trả về JWT token string hợp lệ | | Pending | |
| BE-UT-026 | generateToken() | Boundary | Tạo token với userID = 0 | `userID: 0` | Trả về JWT token string hợp lệ | | Pending | |
| BE-UT-027 | generateToken() | Abnormal | Tạo token với userID = null | `userID: null` | Throw error hoặc trả về token với payload null | | Pending | |

#### A4.2 Password Hashing

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-UT-028 | hashPassword() | Normal | Hash password thành công | `password: "Pass123!"` | Trả về bcrypt hash string | | Pending | |
| BE-UT-029 | comparePassword() | Normal | So sánh password đúng | `password: "Pass123!", hash: "$2b$10$..."` | Trả về true | | Pending | |
| BE-UT-030 | comparePassword() | Abnormal | So sánh password sai | `password: "WrongPass", hash: "$2b$10$..."` | Trả về false | | Pending | |

---

## B. INTEGRATION TESTS - BACKEND (30 test cases)

---

### B1. Authentication API Integration Tests (9 test cases)

#### B1.1 Register API Endpoint

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-001 | POST /api/auth/register | Normal | API đăng ký tài khoản thành công | `{fullname: "Test User", email: "newuser@test.com", password: "Pass123!", phone: "0912345678", gender: "male"}` | Status 201, user được tạo trong DB, trả về token | | Pending | |
| BE-IT-002 | POST /api/auth/register | Abnormal | API đăng ký với email trùng | `{email: "existing@test.com", ...}` | Status 400, không tạo user mới trong DB | | Pending | |
| BE-IT-003 | POST /api/auth/register | Abnormal | API đăng ký thiếu required fields | `{email: "test@test.com"}` | Status 400, validation error | | Pending | |

#### B1.2 Login API Endpoint

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-004 | POST /api/auth/login | Normal | API đăng nhập thành công | `{email: "test@test.com", password: "Pass123!"}` | Status 200, trả về token, cập nhật lastLogin trong DB | | Pending | |
| BE-IT-005 | POST /api/auth/login | Abnormal | API đăng nhập với credentials sai | `{email: "test@test.com", password: "Wrong"}` | Status 401, tăng loginAttempts trong DB | | Pending | |
| BE-IT-006 | POST /api/auth/login | Boundary | API đăng nhập lần thứ 5 thất bại | 5 requests với password sai | Status 403, account bị lock, lockUntil được set | | Pending | |

#### B1.3 Forgot Password API Endpoint

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-007 | POST /api/auth/forgot-password | Normal | API gửi email reset password thành công | `{email: "test@test.com"}` | Status 200, email được gửi, reset token được lưu DB | | Pending | |
| BE-IT-008 | POST /api/auth/forgot-password | Abnormal | API với email không tồn tại | `{email: "notexist@test.com"}` | Status 404, không gửi email | | Pending | |
| BE-IT-009 | POST /api/auth/reset-password | Normal | API reset password với token hợp lệ | `{token: "valid-token", newPassword: "NewPass123!"}` | Status 200, password được cập nhật trong DB | | Pending | |

---

### B2. Product API Integration Tests (9 test cases)

#### B2.1 Get Products API

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-010 | GET /api/products | Normal | API lấy danh sách sản phẩm với pagination | `?page=1&limit=12` | Status 200, trả về 12 products, pagination metadata | | Pending | |
| BE-IT-011 | GET /api/products | Normal | API lọc sản phẩm theo nhiều điều kiện | `?category=1&target=1&minPrice=100000&maxPrice=500000` | Status 200, products thỏa mãn tất cả điều kiện | | Pending | |
| BE-IT-012 | GET /api/products | Normal | API search sản phẩm | `?search=áo thun` | Status 200, products có tên chứa "áo thun" | | Pending | |

#### B2.2 Create Product API

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-013 | POST /api/products | Normal | API tạo sản phẩm mới thành công (admin) | `{name: "Áo thun mới", price: 200000, categoryID: 1, ...}` + Auth header | Status 201, product được tạo trong DB | | Pending | Requires admin token |
| BE-IT-014 | POST /api/products | Abnormal | API tạo sản phẩm không có auth token | `{name: "Áo thun", ...}` | Status 401, không tạo product | | Pending | |
| BE-IT-015 | POST /api/products | Abnormal | API tạo sản phẩm với user role (không phải admin) | `{name: "Áo thun", ...}` + Customer token | Status 403, không tạo product | | Pending | |

#### B2.3 Update Product API

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-016 | PUT /api/products/:id | Normal | API cập nhật sản phẩm thành công | `{price: 250000}` + Admin token | Status 200, product được cập nhật trong DB | | Pending | |
| BE-IT-017 | PUT /api/products/:id | Abnormal | API cập nhật sản phẩm không tồn tại | `productID: 99999` + Admin token | Status 404, không có thay đổi trong DB | | Pending | |
| BE-IT-018 | DELETE /api/products/:id | Normal | API xóa sản phẩm (soft delete) | `productID: 123` + Admin token | Status 200, isActivated = false trong DB | | Pending | |

---

### B3. Order API Integration Tests (6 test cases)

#### B3.1 Create Order API

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-019 | POST /api/orders | Normal | API tạo đơn hàng thành công | `{items: [{productID: 1, quantity: 2}], shippingAddress: {...}}` + User token | Status 201, order và orderDetails được tạo trong DB, giảm stock | | Pending | |
| BE-IT-020 | POST /api/orders | Abnormal | API tạo đơn hàng với sản phẩm hết hàng | `{items: [{productID: 1, quantity: 999}]}` + User token | Status 400, không tạo order, stock không đổi | | Pending | |
| BE-IT-021 | POST /api/orders | Abnormal | API tạo đơn hàng không có auth | `{items: [...]}` | Status 401, không tạo order | | Pending | |

#### B3.2 Get Orders API

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-022 | GET /api/orders | Normal | API lấy danh sách đơn hàng của user | User token | Status 200, chỉ trả về orders của user đó | | Pending | |
| BE-IT-023 | GET /api/orders | Normal | API admin lấy tất cả đơn hàng | Admin token | Status 200, trả về tất cả orders | | Pending | |
| BE-IT-024 | PUT /api/orders/:id/status | Normal | API cập nhật trạng thái đơn hàng | `{orderStatus: "completed"}` + Admin token | Status 200, orderStatus được cập nhật trong DB | | Pending | |

---

### B4. CoIUM Process Integration Tests (6 test cases)

#### B4.1 Run CoIUM Process API

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-025 | POST /api/coium/run | Normal | API chạy CoIUM process thành công | Admin token | Status 200, file correlation_map.json được tạo | | Pending | Long running process |
| BE-IT-026 | POST /api/coium/run | Abnormal | API chạy CoIUM không có quyền admin | User token | Status 403, không chạy process | | Pending | |
| BE-IT-027 | POST /api/coium/run | Abnormal | API chạy CoIUM khi không có đơn hàng | Admin token, DB không có orders | Status 400, message: "Không có dữ liệu đơn hàng" | | Pending | |

#### B4.2 Get CoIUM Recommendations API

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| BE-IT-028 | GET /api/cohui/recommendations | Normal | API lấy general recommendations | None | Status 200, trả về danh sách sản phẩm gợi ý | | Pending | |
| BE-IT-029 | GET /api/cohui/recommendations/:productId | Normal | API lấy recommendations theo product | `productID: 104` | Status 200, trả về sản phẩm tương quan với product 104 | | Pending | |
| BE-IT-030 | GET /api/cohui/recommendations/:productId | Abnormal | API lấy recommendations khi chưa chạy CoIUM | `productID: 104`, correlation_map chưa có | Status 400, message: "Chưa có dữ liệu phân tích" | | Pending | |

---

# PHẦN 2: FRONTEND TESTING

## C. UNIT TESTS - FRONTEND (30 test cases)

---

### C1. Utils Functions Tests (12 test cases)

#### C1.1 Date Utils Tests

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-UT-001 | formatDate() | Normal | Format date thành dd/mm/yyyy | `new Date('2024-01-15')` | "15/01/2024" | | Pending | |
| FE-UT-002 | formatDate() | Boundary | Format với date = null | `null` | "" (empty string) | | Pending | |
| FE-UT-003 | formatDate() | Boundary | Format với date = undefined | `undefined` | "" (empty string) | | Pending | |
| FE-UT-004 | formatDateTime() | Normal | Format date time thành dd/mm/yyyy hh:mm | `new Date('2024-01-15 14:30')` | "15/01/2024 14:30" | | Pending | |
| FE-UT-005 | formatDateForInput() | Normal | Format date cho input type="date" | `new Date('2024-01-15')` | "2024-01-15" | | Pending | |

#### C1.2 Color Utils Tests

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-UT-006 | colorMap | Normal | Lấy mã màu hex cho màu "Đen" | `colorMap['Đen']` | "#000000" | | Pending | |
| FE-UT-007 | colorMap | Normal | Lấy mã màu hex cho màu "Trắng" | `colorMap['Trắng']` | "#FFFFFF" | | Pending | |
| FE-UT-008 | colorMap | Boundary | Lấy mã màu không tồn tại | `colorMap['Màu không có']` | undefined | | Pending | |
| FE-UT-009 | patternMap | Normal | Lấy pattern gradient cho "Họa tiết Đen" | `patternMap['Họa tiết Đen']` | Linear gradient string | | Pending | |

#### C1.3 PDF Generator Tests

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-UT-010 | formatCurrency() | Normal | Format số tiền VND | `200000` | "200,000" | | Pending | |
| FE-UT-011 | formatCurrency() | Boundary | Format với amount = 0 | `0` | "0" | | Pending | |
| FE-UT-012 | removeVietnameseTones() | Normal | Chuyển tiếng Việt có dấu sang không dấu | `"Áo thun đẹp"` | "Ao thun dep" | | Pending | |

---

### C2. Component Tests (18 test cases)

#### C2.1 CoHUIRecommendations Component

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-UT-013 | CoHUIRecommendations | Normal | Render component với recommendations data | `recommendations: [{productID: 1, name: "Áo thun", ...}]` | Component hiển thị danh sách sản phẩm | | Pending | |
| FE-UT-014 | CoHUIRecommendations | Boundary | Render với recommendations = [] | `recommendations: []` | Hiển thị message "Không có gợi ý" | | Pending | |
| FE-UT-015 | CoHUIRecommendations | Abnormal | Render với recommendations = null | `recommendations: null` | Không crash, hiển thị fallback UI | | Pending | |

#### C2.2 ProductCard Component

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-UT-016 | ProductCard | Normal | Render product card với đầy đủ thông tin | `{name: "Áo thun", price: 200000, image: "url"}` | Card hiển thị tên, giá, hình ảnh | | Pending | |
| FE-UT-017 | ProductCard | Normal | Click vào product card | Click event | Navigate đến product detail page | | Pending | |
| FE-UT-018 | ProductCard | Boundary | Render với price = 0 | `{price: 0}` | Hiển thị "0 đ" | | Pending | |

#### C2.3 Cart Component

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-UT-019 | Cart | Normal | Hiển thị giỏ hàng với items | `cartItems: [{productID: 1, quantity: 2}]` | Hiển thị danh sách items, tổng tiền | | Pending | |
| FE-UT-020 | Cart | Normal | Tăng số lượng sản phẩm trong giỏ | Click nút "+" | Quantity tăng 1, tổng tiền cập nhật | | Pending | |
| FE-UT-021 | Cart | Normal | Giảm số lượng sản phẩm trong giỏ | Click nút "-" | Quantity giảm 1, tổng tiền cập nhật | | Pending | |
| FE-UT-022 | Cart | Boundary | Giảm số lượng khi quantity = 1 | Click nút "-" khi quantity = 1 | Hiển thị confirm dialog xóa item | | Pending | |
| FE-UT-023 | Cart | Normal | Xóa sản phẩm khỏi giỏ hàng | Click nút xóa | Item bị xóa, tổng tiền cập nhật | | Pending | |
| FE-UT-024 | Cart | Boundary | Hiển thị giỏ hàng rỗng | `cartItems: []` | Hiển thị "Giỏ hàng trống" | | Pending | |

#### C2.4 Login Form Component

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-UT-025 | LoginForm | Normal | Submit form với dữ liệu hợp lệ | `{email: "test@test.com", password: "Pass123!"}` | Call API login, không có validation error | | Pending | |
| FE-UT-026 | LoginForm | Abnormal | Submit form với email rỗng | `{email: "", password: "Pass123!"}` | Hiển thị validation error "Email là bắt buộc" | | Pending | |
| FE-UT-027 | LoginForm | Abnormal | Submit form với password rỗng | `{email: "test@test.com", password: ""}` | Hiển thị validation error "Password là bắt buộc" | | Pending | |
| FE-UT-028 | LoginForm | Boundary | Submit form với email không hợp lệ | `{email: "invalid-email", password: "Pass123!"}` | Hiển thị validation error "Email không hợp lệ" | | Pending | |

#### C2.5 Search Component

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-UT-029 | SearchBar | Normal | Nhập từ khóa và search | Input: "áo thun" | Call search API với keyword "áo thun" | | Pending | |
| FE-UT-030 | SearchBar | Boundary | Search với keyword rỗng | Input: "" | Không call API hoặc hiển thị tất cả sản phẩm | | Pending | |

---

## D. INTEGRATION TESTS - FRONTEND (30 test cases)

---

### D1. Authentication Flow Tests (9 test cases)

#### D1.1 Register Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-IT-001 | Register Flow | Normal | Đăng ký tài khoản thành công end-to-end | Fill form → Submit → API call | Form submit, API success, redirect to home, show toast success | | Pending | |
| FE-IT-002 | Register Flow | Abnormal | Đăng ký với email đã tồn tại | Fill form với email trùng → Submit | API error, hiển thị toast error "Email đã được sử dụng" | | Pending | |
| FE-IT-003 | Register Flow | Abnormal | Đăng ký với validation errors | Submit form thiếu fields | Hiển thị validation errors, không call API | | Pending | |

#### D1.2 Login Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-IT-004 | Login Flow | Normal | Đăng nhập thành công end-to-end | Fill credentials → Submit | API success, token saved to localStorage, redirect to home | | Pending | |
| FE-IT-005 | Login Flow | Abnormal | Đăng nhập với credentials sai | Fill wrong password → Submit | API error, hiển thị toast error, không redirect | | Pending | |
| FE-IT-006 | Login Flow | Normal | Đăng nhập và persist session | Login → Refresh page | User vẫn logged in, không bị logout | | Pending | |

#### D1.3 Logout Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-IT-007 | Logout Flow | Normal | Đăng xuất thành công | Click logout button | Token removed from localStorage, redirect to login | | Pending | |
| FE-IT-008 | Logout Flow | Normal | Access protected route sau khi logout | Logout → Navigate to /admin | Redirect to login page | | Pending | |
| FE-IT-009 | Forgot Password Flow | Normal | Gửi email reset password | Fill email → Submit | API success, hiển thị message "Đã gửi email" | | Pending | |

---

### D2. Product Management Flow Tests (9 test cases)

#### D2.1 Browse Products Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-IT-010 | Browse Products | Normal | Load trang sản phẩm lần đầu | Navigate to /products | API call, hiển thị 12 sản phẩm, pagination | | Pending | |
| FE-IT-011 | Browse Products | Normal | Filter sản phẩm theo category | Select category "Áo" | API call với category filter, hiển thị filtered products | | Pending | |
| FE-IT-012 | Browse Products | Normal | Filter sản phẩm theo giá | Set minPrice=100000, maxPrice=500000 | API call với price filter, hiển thị products trong khoảng giá | | Pending | |
| FE-IT-013 | Browse Products | Normal | Search sản phẩm | Input "áo thun" → Enter | API call với search keyword, hiển thị search results | | Pending | |
| FE-IT-014 | Browse Products | Normal | Pagination - chuyển trang | Click page 2 | API call với page=2, hiển thị products trang 2 | | Pending | |
| FE-IT-015 | Browse Products | Normal | Sort sản phẩm theo giá | Select "Giá tăng dần" | API call với sort=price-asc, products được sắp xếp | | Pending | |

#### D2.2 Product Detail Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-IT-016 | Product Detail | Normal | Xem chi tiết sản phẩm | Click vào product card | Navigate to /products/:id, API call, hiển thị product details | | Pending | |
| FE-IT-017 | Product Detail | Normal | Chọn màu sắc và size | Select color, select size | UI cập nhật, hiển thị stock availability | | Pending | |
| FE-IT-018 | Product Detail | Normal | Thêm sản phẩm vào giỏ hàng | Click "Thêm vào giỏ" | Product added to cart, cart count tăng, toast success | | Pending | |

---

### D3. Shopping Cart Flow Tests (6 test cases)

#### D3.1 Cart Management Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-IT-019 | Cart Management | Normal | Xem giỏ hàng | Navigate to /cart | Hiển thị cart items, tổng tiền, buttons | | Pending | |
| FE-IT-020 | Cart Management | Normal | Cập nhật số lượng trong giỏ | Click tăng/giảm quantity | API call update cart, UI cập nhật, tổng tiền thay đổi | | Pending | |
| FE-IT-021 | Cart Management | Normal | Xóa sản phẩm khỏi giỏ | Click nút xóa → Confirm | API call delete, item removed, tổng tiền cập nhật | | Pending | |
| FE-IT-022 | Cart Management | Boundary | Tăng quantity vượt quá stock | Click tăng khi quantity = stock | Hiển thị error "Vượt quá số lượng tồn kho" | | Pending | |

#### D3.2 Checkout Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-IT-023 | Checkout | Normal | Checkout thành công | Fill shipping info → Select payment → Submit | API create order, redirect to success page, cart cleared | | Pending | |
| FE-IT-024 | Checkout | Abnormal | Checkout khi chưa login | Click checkout button | Redirect to login page | | Pending | |

---

### D4. Admin Dashboard Flow Tests (6 test cases)

#### D4.1 Product Management (Admin)

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-IT-025 | Admin Product | Normal | Thêm sản phẩm mới | Fill form → Upload image → Submit | API create product, product xuất hiện trong list, toast success | | Pending | |
| FE-IT-026 | Admin Product | Normal | Sửa thông tin sản phẩm | Edit form → Submit | API update product, product info cập nhật, toast success | | Pending | |
| FE-IT-027 | Admin Product | Normal | Xóa sản phẩm (soft delete) | Click delete → Confirm | API soft delete, product isActivated = false | | Pending | |

#### D4.2 Order Management (Admin)

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| FE-IT-028 | Admin Order | Normal | Xem danh sách đơn hàng | Navigate to /admin/orders | API call, hiển thị all orders với pagination | | Pending | |
| FE-IT-029 | Admin Order | Normal | Cập nhật trạng thái đơn hàng | Select status → Click update | API update order status, UI cập nhật, toast success | | Pending | |
| FE-IT-030 | Admin Order | Normal | Xem chi tiết đơn hàng | Click view details | Navigate to order detail, hiển thị full order info | | Pending | |

---

# PHẦN 3: END-TO-END TESTING

## E. E2E TESTS - CRITICAL USER FLOWS (30 test cases)

---

### E1. Customer Journey Tests (15 test cases)

#### E1.1 Complete Purchase Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-001 | Complete Purchase | Normal | Khách hàng mua hàng thành công từ đầu đến cuối | Register → Browse → Add to cart → Checkout → Payment | Order created, payment success, email confirmation sent | | Pending | Critical flow |
| E2E-002 | Complete Purchase | Normal | Khách hàng đã có tài khoản mua hàng | Login → Browse → Add to cart → Checkout → Payment | Order created, payment success | | Pending | | (fail)
| E2E-003 | Complete Purchase | Abnormal | Checkout với sản phẩm hết hàng | Add out-of-stock product → Checkout | Error message, không tạo order | | Pending | |

#### E1.2 Product Discovery Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-004 | Product Discovery | Normal | Tìm kiếm và lọc sản phẩm | Search "áo thun" → Filter by price → Sort | Hiển thị filtered & sorted results | | Pending | |
| E2E-005 | Product Discovery | Normal | Xem chi tiết sản phẩm và recommendations | Click product → View details → See recommendations | Product details hiển thị, recommendations xuất hiện | | Pending | |
| E2E-006 | Product Discovery | Normal | Thêm nhiều sản phẩm vào giỏ hàng | Add product 1 → Continue shopping → Add product 2 | Cart có 2 products, cart count = 2 | | Pending | |

#### E1.3 Account Management Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-007 | Account Management | Normal | Cập nhật thông tin cá nhân | Login → Profile → Edit info → Save | Profile updated, toast success | | Pending | | (fail)
| E2E-008 | Account Management | Normal | Thêm địa chỉ giao hàng mới | Login → Addresses → Add new address | Address saved, xuất hiện trong list | | Pending | |
| E2E-009 | Account Management | Normal | Xem lịch sử đơn hàng | Login → Orders → View order history | Hiển thị all orders của user | | Pending | |

#### E1.4 Wishlist & Favorites Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-010 | Wishlist | Normal | Thêm sản phẩm vào wishlist | Login → Product detail → Click heart icon | Product added to wishlist, icon filled | | Pending | |
| E2E-011 | Wishlist | Normal | Xem danh sách wishlist | Navigate to /wishlist | Hiển thị all favorited products | | Pending | |
| E2E-012 | Wishlist | Normal | Xóa sản phẩm khỏi wishlist | Wishlist page → Click remove | Product removed from wishlist | | Pending | |

#### E1.5 Review & Rating Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-013 | Review | Normal | Viết đánh giá sản phẩm sau khi mua | Order completed → Product detail → Write review | Review submitted, hiển thị trong product page | | Pending | |
| E2E-014 | Review | Abnormal | Viết đánh giá khi chưa mua sản phẩm | Product detail → Write review (no purchase) | Error message "Bạn chưa mua sản phẩm này" | | Pending | |
| E2E-015 | Review | Normal | Xem tất cả đánh giá của sản phẩm | Product detail → Reviews tab | Hiển thị all reviews với rating | | Pending | |

---

### E2. Admin Management Tests (15 test cases)

#### E2.1 Product Management Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-016 | Admin Product | Normal | Thêm sản phẩm mới hoàn chỉnh | Login admin → Products → Add → Fill all fields → Upload images → Add colors/sizes → Save | Product created với đầy đủ thông tin, hiển thị trong customer site | | Pending | |
| E2E-017 | Admin Product | Normal | Cập nhật stock sản phẩm | Products → Edit → Update stock → Save | Stock updated, reflected trong customer site | | Pending | |
| E2E-018 | Admin Product | Normal | Tạo promotion cho sản phẩm | Promotions → Create → Select products → Set discount → Save | Promotion active, giá giảm hiển thị trong customer site | | Pending | |

#### E2.2 Order Management Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-019 | Admin Order | Normal | Xử lý đơn hàng từ pending → completed | Orders → Select order → Update status to "processing" → "shipping" → "completed" | Order status updated qua các bước, customer nhận notification | | Pending | |
| E2E-020 | Admin Order | Normal | Hủy đơn hàng | Orders → Select order → Cancel → Confirm | Order cancelled, stock restored, customer nhận notification | | Pending | |
| E2E-021 | Admin Order | Normal | Xem chi tiết đơn hàng và in hóa đơn | Orders → View details → Print invoice | PDF invoice generated và downloaded | | Pending | |

#### E2.3 CoIUM Analysis Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-022 | CoIUM Analysis | Normal | Chạy CoIUM algorithm và xem kết quả | Login admin → CoHUI Management → Click "Chạy CoIUM" → Wait → View analytics | Process completes, 7 charts hiển thị, correlation_map.json created | | Pending | Critical for thesis |
| E2E-023 | CoIUM Analysis | Normal | Xem Fig 6 - Pattern Comparison | CoHUI Management → Analytics tab → Scroll to Fig 6 | Fig 6 hiển thị với X-axis = minCor (0.1, 0.3, 0.5, 0.7, 0.9) | | Pending | Important chart |
| E2E-024 | CoIUM Analysis | Normal | Xem general recommendations sau khi chạy CoIUM | CoHUI Management → General tab | Hiển thị top recommended products với correlation scores | | Pending | |
| E2E-025 | CoIUM Analysis | Normal | Tìm kiếm recommendations theo product ID | CoHUI Management → By Product tab → Input product ID → Search | Hiển thị correlated products cho product đó | | Pending | |

#### E2.4 Customer Management Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-026 | Admin Customer | Normal | Xem danh sách khách hàng | Login admin → Customers | Hiển thị all customers với pagination | | Pending | |
| E2E-027 | Admin Customer | Normal | Xem chi tiết khách hàng và lịch sử mua hàng | Customers → View details | Hiển thị customer info, order history, total spent | | Pending | |
| E2E-028 | Admin Customer | Normal | Khóa/mở khóa tài khoản khách hàng | Customers → Select customer → Lock/Unlock | Account status updated, customer không thể login khi locked | | Pending | |

#### E2.5 Dashboard & Reports Flow

| Test Case# | Test case functions | Test case types | Test Title | Test Data | Expected Result | Actual Result | Status | Notes |
|------------|-------------------|----------------|------------|-----------|----------------|---------------|--------|-------|
| E2E-029 | Admin Dashboard | Normal | Xem dashboard với thống kê tổng quan | Login admin → Dashboard | Hiển thị revenue, orders, customers charts | | Pending | |
| E2E-030 | Admin Dashboard | Normal | Export báo cáo doanh thu | Dashboard → Select date range → Export Excel | Excel file downloaded với revenue data | | Pending | |

---

---

# PHẦN 4: TEST EXECUTION PLAN

## 📅 Lịch trình thực hiện Testing

### Phase 1: Backend Unit Tests (2 ngày)
- **Ngày 1:** Authentication & Product Controller Tests (BE-UT-001 đến BE-UT-018)
- **Ngày 2:** CoHUI Controller & Utils Tests (BE-UT-019 đến BE-UT-030)

### Phase 2: Backend Integration Tests (2 ngày)
- **Ngày 3:** Authentication & Product API Tests (BE-IT-001 đến BE-IT-018)
- **Ngày 4:** Order & CoIUM API Tests (BE-IT-019 đến BE-IT-030)

### Phase 3: Frontend Unit Tests (2 ngày)
- **Ngày 5:** Utils Functions & Basic Components (FE-UT-001 đến FE-UT-015)
- **Ngày 6:** Complex Components Tests (FE-UT-016 đến FE-UT-030)

### Phase 4: Frontend Integration Tests (2 ngày)
- **Ngày 7:** Authentication & Product Flows (FE-IT-001 đến FE-IT-018)
- **Ngày 8:** Cart & Admin Flows (FE-IT-019 đến FE-IT-030)

### Phase 5: E2E Tests (3 ngày)
- **Ngày 9:** Customer Journey Tests (E2E-001 đến E2E-015)
- **Ngày 10:** Admin Management Tests (E2E-016 đến E2E-025)
- **Ngày 11:** Final E2E Tests & Bug Fixes (E2E-026 đến E2E-030)

### Phase 6: Bug Fixing & Re-testing (2 ngày)
- **Ngày 12:** Fix failed tests, re-run all tests
- **Ngày 13:** Final verification, generate test reports

**Tổng thời gian:** 13 ngày làm việc

---

## 🎯 Test Coverage Goals

### Backend Coverage Target
- **Unit Tests:** 80% code coverage
- **Integration Tests:** 70% API endpoint coverage
- **Critical Paths:** 100% coverage

### Frontend Coverage Target
- **Unit Tests:** 75% code coverage
- **Integration Tests:** 70% component coverage
- **E2E Tests:** 100% critical user flows

---

## 🛠️ Testing Tools & Setup

### Backend Testing
```bash
# Install dependencies
cd server
npm install --save-dev vitest @vitest/ui supertest

# Run tests
npm run test              # Run all tests
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:coverage     # Generate coverage report
```

### Frontend Testing
```bash
# Install dependencies
cd client
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Run tests
npm run test              # Run all tests
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:coverage     # Generate coverage report
```

### E2E Testing
```bash
# Install Playwright
cd client
npm install --save-dev @playwright/test

# Run E2E tests
npx playwright test                    # Run all E2E tests
npx playwright test --ui               # Run with UI mode
npx playwright test --headed           # Run in headed mode
npx playwright codegen localhost:5173  # Generate test code
npx playwright show-report             # Show test report
```

---

## 📊 Test Report Template

### Test Summary Report

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Total Test Cases | 150 | - | Pending |
| Passed | - | - | - |
| Failed | - | - | - |
| Skipped | - | - | - |
| Pass Rate | ≥ 95% | - | - |
| Code Coverage (Backend) | ≥ 80% | - | - |
| Code Coverage (Frontend) | ≥ 75% | - | - |

### Test Execution by Category

| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| Backend Unit Tests | 30 | - | - | - |
| Backend Integration Tests | 30 | - | - | - |
| Frontend Unit Tests | 30 | - | - | - |
| Frontend Integration Tests | 30 | - | - | - |
| E2E Tests | 30 | - | - | - |

---

## 🐛 Bug Tracking Template

| Bug ID | Test Case# | Severity | Description | Status | Fixed By | Notes |
|--------|-----------|----------|-------------|--------|----------|-------|
| BUG-001 | - | - | - | Open | - | - |
| BUG-002 | - | - | - | Open | - | - |

**Severity Levels:**
- **Critical:** Hệ thống không hoạt động, mất dữ liệu
- **High:** Chức năng chính không hoạt động
- **Medium:** Chức năng phụ có lỗi
- **Low:** Lỗi UI, typo, không ảnh hưởng chức năng

---

## ✅ Test Sign-off Checklist

### Before Testing
- [ ] Test environment setup completed
- [ ] Test data prepared
- [ ] All testing tools installed
- [ ] Database seeded with test data
- [ ] Backend server running
- [ ] Frontend dev server running

### During Testing
- [ ] All test cases executed
- [ ] Test results documented
- [ ] Bugs logged and tracked
- [ ] Failed tests re-run after fixes
- [ ] Coverage reports generated

### After Testing
- [ ] All critical bugs fixed
- [ ] Pass rate ≥ 95%
- [ ] Code coverage targets met
- [ ] Test documentation completed
- [ ] Test reports generated
- [ ] Sign-off from stakeholders

---

## 📝 Notes for Thesis Documentation

### Sections to Include in Thesis

1. **Testing Strategy**
   - Giải thích tại sao chọn Vitest + RTL + Playwright
   - Mô tả test pyramid approach
   - Phân tích coverage targets

2. **Test Case Design**
   - Giải thích phương pháp Normal/Abnormal/Boundary
   - Mô tả cách thiết kế test cases
   - Ví dụ cụ thể cho từng loại test

3. **Test Execution Results**
   - Bảng tổng hợp kết quả test
   - Screenshots của test reports
   - Coverage reports với charts

4. **Bug Analysis**
   - Thống kê bugs theo severity
   - Root cause analysis
   - Lessons learned

5. **Conclusion**
   - Đánh giá chất lượng code
   - Recommendations cho future work
   - Testing best practices learned

---

## 🎓 Appendix: Test Examples

### Example 1: Backend Unit Test
```javascript
// server/tests/unit/auth.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { register } from '../../controllers/AuthController';

describe('AuthController - register()', () => {
  it('BE-UT-001: Đăng ký tài khoản thành công với dữ liệu hợp lệ', async () => {
    const req = {
      body: {
        fullname: "Nguyen Van A",
        email: "test@gmail.com",
        password: "Pass123!",
        phone: "0901234567",
        gender: "male"
      }
    };
    const res = {
      status: (code) => ({
        json: (data) => ({ statusCode: code, data })
      })
    };
    
    const result = await register(req, res);
    
    expect(result.statusCode).toBe(201);
    expect(result.data.success).toBe(true);
    expect(result.data.token).toBeDefined();
  });
});
```

### Example 2: Frontend Component Test
```javascript
// client/tests/unit/dateUtils.test.js
import { describe, it, expect } from 'vitest';
import { formatDate } from '../../src/utils/dateUtils';

describe('dateUtils - formatDate()', () => {
  it('FE-UT-001: Format date thành dd/mm/yyyy', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date);
    expect(result).toBe('15/01/2024');
  });
  
  it('FE-UT-002: Format với date = null', () => {
    const result = formatDate(null);
    expect(result).toBe('');
  });
});
```

### Example 3: E2E Test
```javascript
// client/tests/e2e/purchase.spec.js
import { test, expect } from '@playwright/test';

test('E2E-001: Khách hàng mua hàng thành công từ đầu đến cuối', async ({ page }) => {
  // Step 1: Register
  await page.goto('http://localhost:5173/register');
  await page.fill('input[name="email"]', 'customer@test.com');
  await page.fill('input[name="password"]', 'Pass123!');
  await page.click('button[type="submit"]');
  
  // Step 2: Browse products
  await page.goto('http://localhost:5173/products');
  await page.click('.product-card:first-child');
  
  // Step 3: Add to cart
  await page.click('button:has-text("Thêm vào giỏ")');
  await expect(page.locator('.cart-count')).toHaveText('1');
  
  // Step 4: Checkout
  await page.goto('http://localhost:5173/cart');
  await page.click('button:has-text("Thanh toán")');
  
  // Step 5: Complete order
  await page.fill('input[name="address"]', '123 Test Street');
  await page.click('button:has-text("Đặt hàng")');
  
  // Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## 📞 Contact & Support

**Người thực hiện:** [Tên sinh viên]  
**MSSV:** [Mã số sinh viên]  
**Email:** [Email]  
**Giảng viên hướng dẫn:** [Tên GVHD]

**Ngày bắt đầu:** [DD/MM/YYYY]  
**Ngày hoàn thành dự kiến:** [DD/MM/YYYY]

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Status:** Draft / In Progress / Completed

---

# KẾT THÚC TEST CASE SPECIFICATION

