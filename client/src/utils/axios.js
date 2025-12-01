import axios from 'axios';

// Tạo instance axios với cấu hình mặc định
const instance = axios.create({
    baseURL: 'http://localhost:5000/',
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});

// Thêm interceptor cho request
instance.interceptors.request.use(
    (config) => {
        // Danh sách routes cần adminToken
        const adminRoutes = ['/admin', '/products/admin', '/products/upload-images', '/receipts'];
        const needsAdminToken = adminRoutes.some(route => config.url.includes(route));
        
        if (needsAdminToken) {
            // Sử dụng adminToken cho các route admin (kiểm tra cả localStorage và sessionStorage)
            const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            if (adminToken) {
                config.headers.Authorization = `Bearer ${adminToken}`;
            }
        } else {
            // Sử dụng customerToken cho các route khách hàng (kiểm tra cả localStorage và sessionStorage)
            const customerToken = localStorage.getItem('customerToken') || sessionStorage.getItem('customerToken');
            if (customerToken) {
                config.headers.Authorization = `Bearer ${customerToken}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Thêm interceptor cho response
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
            if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Kiểm tra xem request có phải từ admin route không
                    const adminRoutes = ['/admin', '/products/admin', '/products/upload-images', '/receipts'];
                    const isAdminRoute = adminRoutes.some(route => error.config.url.includes(route));
                    
                    if (isAdminRoute) {
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminInfo');
                        localStorage.removeItem('role');
                        sessionStorage.removeItem('adminToken');
                        sessionStorage.removeItem('adminInfo');
                        sessionStorage.removeItem('role');
                        // Chuyển hướng đến trang login
                        window.location.href = '/login';
                    } else {
                        localStorage.removeItem('customerToken');
                        localStorage.removeItem('customerInfo');
                        sessionStorage.removeItem('customerToken');
                        sessionStorage.removeItem('customerInfo');
                        // Chuyển hướng đến trang login customer
                        window.location.href = '/login';
                    }
                    // Thông báo cho người dùng
                    window.dispatchEvent(new Event('authChange'));
                    break;
                case 403:
                    console.error('Không có quyền truy cập');
                    break;
                case 404:
                    console.error('Không tìm thấy tài nguyên');
                    break;
                case 500:
                    console.error('Lỗi server');
                    break;
                default:
                    console.error('Có lỗi xảy ra');
            }
        } else if (error.request) {
            console.error('Không thể kết nối đến server');
        } else {
            console.error('Lỗi:', error.message);
        }
        return Promise.reject(error);
    }
);

export default instance;
