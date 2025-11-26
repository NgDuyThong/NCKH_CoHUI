// Import các thư viện cần thiết
import { useState, useEffect } from 'react';
import axios from '../../utils/axios';  // Import axios đã được cấu hình sẵn
import { FiSearch, FiEdit2, FiUserX, FiUserCheck, FiUser, FiPower, FiFileText, FiDownload, FiShield } from 'react-icons/fi'; // Import các icon
import { toast } from 'react-toastify'; // Import thư viện để hiển thị thông báo
import { useTheme } from '../../contexts/AdminThemeContext'; // Import context để sử dụng theme sáng/tối
import { generateCustomerFeedbackPDF } from '../../utils/pdfGenerator';

// Component quản lý khách hàng
const Customers = () => {
    // Sử dụng theme tối/sáng
    const { isDarkMode } = useTheme();

    // ===== STATES =====
    // ===== DỮ LIỆU KHÁCH HÀNG =====
    const [allCustomers, setAllCustomers] = useState([]); // Danh sách tất cả khách hàng
    const [filteredCustomers, setFilteredCustomers] = useState([]); // Danh sách sau khi lọc
    const [loading, setLoading] = useState(true); // Trạng thái đang tải

    // ===== TÌM KIẾM & LỌC =====
    const [searchTerm, setSearchTerm] = useState(''); // Từ khóa tìm kiếm
    const [filters, setFilters] = useState({
        status: 'all',      // Lọc theo trạng thái
        gender: '',         // Lọc theo giới tính
        sort: 'createAt',   // Sắp xếp theo trường
        order: 'desc'       // Thứ tự sắp xếp
    });

    // ===== PHÂN TRANG =====
    const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
    const [itemsPerPage] = useState(10); // Số khách hàng mỗi trang
    const [totalPages, setTotalPages] = useState(0); // Tổng số trang

    // ===== THỐNG KÊ =====
    const [stats, setStats] = useState({
        total: 0,      // Tổng số khách hàng
        active: 0,     // Số khách hàng hoạt động
        disabled: 0    // Số khách hàng bị khóa
    });

    // ===== CHỈNH SỬA KHÁCH HÀNG =====
    const [editingCustomer, setEditingCustomer] = useState(null); // Khách hàng đang sửa
    const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái modal

    // ===== PHẢN HỒI KHÁCH HÀNG =====
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackData, setFeedbackData] = useState({
        userID: '',
        fullname: '',
        phone: '',
        email: '',
        address: '',
        feedbackDate: new Date(),
        feedback: '',
        resolution: '',
        rating: ''
    });

    // ===== PHÂN QUYỀN =====
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedUserForRole, setSelectedUserForRole] = useState(null);
    const [newRole, setNewRole] = useState('');

    // Danh sách các role trong hệ thống
    const roles = [
        { value: 'customer', label: 'Khách hàng', description: 'Người dùng thông thường, mua sắm trên website' },
        { value: 'admin', label: 'Quản trị viên', description: 'Toàn quyền quản lý hệ thống' },
        { value: 'customer_manager', label: 'Quản lý khách hàng', description: 'Quản lý thông tin và phản hồi khách hàng' },
        { value: 'product_manager', label: 'Quản lý sản phẩm', description: 'Quản lý danh mục và sản phẩm' },
        { value: 'order_manager', label: 'Quản lý đơn hàng', description: 'Xử lý và theo dõi đơn hàng' },
        { value: 'coupon_manager', label: 'Quản lý mã giảm giá', description: 'Tạo và quản lý mã giảm giá' },
        { value: 'promotion_manager', label: 'Quản lý khuyến mãi', description: 'Tạo và quản lý chương trình khuyến mãi' },
        { value: 'notification_manager', label: 'Quản lý thông báo', description: 'Gửi và quản lý thông báo hệ thống' }
    ];

    // Hàm lấy tên role hiển thị
    const getRoleLabel = (roleValue) => {
        const role = roles.find(r => r.value === roleValue);
        return role ? role.label : roleValue;
    };

    // ===== CÁC HÀM TIỆN ÍCH =====
    // Chuyển đổi giới tính sang tiếng Việt
    const getGenderText = (gender) => {
        return gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : '';
    };

    // Chuyển đổi giới tính sang tiếng Anh
    const getGenderValue = (genderText) => {
        return genderText === 'Nam' ? 'male' : genderText === 'Nữ' ? 'female' : '';
    };

    // ===== CÁC HÀM XỬ LÝ =====
    // Lấy dữ liệu khách hàng từ server
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/admin/users/admin/users');

                if (response.data?.users) {
                    setAllCustomers(response.data.users);
                    setFilteredCustomers(response.data.users);
                    setTotalPages(Math.ceil(response.data.users.length / itemsPerPage));
                }

                // Cập nhật thống kê
                if (response.data?.stats) {
                    setStats({
                        total: response.data.stats.totalUser || 0,
                        active: response.data.stats.totalActiveUser || 0,
                        disabled: response.data.stats.totalDeactivatedUser || 0
                    });
                }
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu:', error);
                toast.error('Có lỗi xảy ra khi tải danh sách người dùng');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [itemsPerPage]);

    // Xử lý tìm kiếm và lọc
    useEffect(() => {
        let result = [...allCustomers];

        // Lọc theo từ khóa
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(customer =>
                customer.fullname?.toLowerCase().includes(searchLower) ||
                customer.email?.toLowerCase().includes(searchLower) ||
                customer.phone?.includes(searchTerm) ||
                customer.userID?.toString().includes(searchTerm)
            );
        }

        // Lọc theo trạng thái
        if (filters.status !== 'all') {
            result = result.filter(customer =>
                filters.status === 'active' ? !customer.isDisabled : customer.isDisabled
            );
        }

        // Lọc theo giới tính
        if (filters.gender) {
            const genderValue = getGenderValue(filters.gender);
            result = result.filter(customer => customer.gender === genderValue);
        }

        // Sắp xếp kết quả
        if (filters.sort) {
            result.sort((a, b) => {
                let compareResult = 0;
                switch (filters.sort) {
                    case 'userID':
                        compareResult = (a.userID || 0) - (b.userID || 0);
                        break;
                    case 'fullname':
                        compareResult = (a.fullname || '').localeCompare(b.fullname || '');
                        break;
                    case 'email':
                        compareResult = (a.email || '').localeCompare(b.email || '');
                        break;
                    default:
                        compareResult = 0;
                }
                return filters.order === 'asc' ? compareResult : -compareResult;
            });
        }

        // Cập nhật kết quả và reset trang
        setFilteredCustomers(result);
        setTotalPages(Math.ceil(result.length / itemsPerPage));
        setCurrentPage(1);
    }, [allCustomers, searchTerm, filters, itemsPerPage]);

    // 3. Hàm xử lý thay đổi bộ lọc
    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 4. Hàm xử lý vô hiệu hóa/kích hoạt tài khoản
    const handleToggleStatus = async (userID, currentStatus) => {
        try {
            const response = await axios.patch(`/api/admin/users/admin/users/toggle/${userID}`, {
                isDisabled: !currentStatus
            });

            if (response.status === 200) {
                // Cập nhật lại danh sách người dùng
                const updatedCustomers = allCustomers.map(customer =>
                    customer.userID === userID ? { ...customer, isDisabled: !currentStatus } : customer
                );
                setAllCustomers(updatedCustomers);

                // Cập nhật lại state thống kê
                setStats(prevStats => ({
                    ...prevStats,
                    // Nếu đang vô hiệu hóa (currentStatus = false -> true)
                    active: prevStats.active + (currentStatus ? 1 : -1),
                    disabled: prevStats.disabled + (currentStatus ? -1 : 1)
                }));

                // Hiển thị thông báo thành công
                toast.success(response.data.message);
            }
        } catch (error) {
            console.error('Lỗi khi thay đổi trạng thái:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái tài khoản');
        }
    };

    // 5. Hàm xử lý mở modal chỉnh sửa
    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    // 6. Hàm xử lý cập nhật thông tin khách hàng
    const handleUpdate = async () => {
        try {
            const response = await axios.put(`/api/admin/users/admin/users/${editingCustomer.userID}`, {
                fullname: editingCustomer.fullname,
                phone: editingCustomer.phone,
                gender: editingCustomer.gender
            });

            if (response.data.user) {
                // Cập nhật lại danh sách người dùng
                const updatedCustomers = allCustomers.map(customer =>
                    customer.userID === editingCustomer.userID ? response.data.user : customer
                );
                setAllCustomers(updatedCustomers);

                // Đóng modal và hiển thị thông báo thành công
                setIsModalOpen(false);
                toast.success(response.data.message);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin người dùng';
            toast.error(errorMessage);
        }
    };

    // 7. Các hàm tiện ích cho phân trang
    // Lấy danh sách khách hàng cho trang hiện tại
    const getCurrentCustomers = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredCustomers.slice(startIndex, endIndex);
    };

    // Xử lý chuyển trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu trang
    };

    // ===== HANDLERS CHO PHẢN HỒI KHÁCH HÀNG =====
    const handleOpenFeedbackForm = (customer) => {
        setFeedbackData({
            userID: customer.userID,
            fullname: customer.fullname,
            phone: customer.phone,
            email: customer.email,
            address: customer.address || '',
            feedbackDate: new Date(),
            feedback: '',
            resolution: '',
            rating: ''
        });
        setIsFeedbackModalOpen(true);
    };

    const handleGenerateFeedbackPDF = () => {
        try {
            if (!feedbackData.feedback.trim()) {
                toast.warning('Vui lòng nhập nội dung phản hồi');
                return;
            }
            
            const fileName = generateCustomerFeedbackPDF(feedbackData);
            toast.success(`Xuất biểu mẫu phản hồi thành công: ${fileName}`);
            setIsFeedbackModalOpen(false);
        } catch (error) {
            console.error('Lỗi khi xuất PDF:', error);
            toast.error('Không thể xuất biểu mẫu phản hồi');
        }
    };

    // ===== HANDLERS CHO PHÂN QUYỀN =====
    const handleOpenRoleModal = (customer) => {
        setSelectedUserForRole(customer);
        setNewRole(customer.role);
        setIsRoleModalOpen(true);
    };

    const handleUpdateRole = async () => {
        try {
            if (!newRole) {
                toast.warning('Vui lòng chọn vai trò');
                return;
            }

            if (newRole === selectedUserForRole.role) {
                toast.info('Vai trò không thay đổi');
                setIsRoleModalOpen(false);
                return;
            }

            const response = await axios.patch(`/api/admin/users/admin/users/${selectedUserForRole.userID}/role`, {
                role: newRole
            });

            if (response.status === 200) {
                // Cập nhật lại danh sách người dùng
                const updatedCustomers = allCustomers.map(customer =>
                    customer.userID === selectedUserForRole.userID 
                        ? { ...customer, role: newRole } 
                        : customer
                );
                setAllCustomers(updatedCustomers);

                toast.success('Cập nhật vai trò thành công');
                setIsRoleModalOpen(false);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật vai trò:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật vai trò');
        }
    };

    // Modal chỉnh sửa
    const EditModal = () => (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                <div className={`relative w-full max-w-2xl p-8 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {/* Modal Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Chỉnh sửa thông tin khách hàng
                            </h3>
                            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Cập nhật thông tin cá nhân của khách hàng
                            </p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Thông tin cơ bản
                            </h4>
                            <div className="grid grid-cols-2 gap-6">
                                {/* ID người dùng */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        ID người dùng
                                    </label>
                                    <input
                                        type="text"
                                        value={editingCustomer?.userID || ''}
                                        disabled
                                        className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editingCustomer?.email || ''}
                                        disabled
                                        className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                                        title="Email không thể thay đổi"
                                    />
                                </div>

                                {/* Họ và tên */}
                                <div className="col-span-2">
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        value={editingCustomer?.fullname || ''}
                                        onChange={(e) => setEditingCustomer({ ...editingCustomer, fullname: e.target.value })}
                                        className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                            } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                        required
                                    />
                                </div>

                                {/* Số điện thoại */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        value={editingCustomer?.phone || ''}
                                        onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                        className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                            } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                        required
                                    />
                                </div>

                                {/* Giới tính */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        Giới tính
                                    </label>
                                    <select
                                        value={getGenderText(editingCustomer?.gender || '')}
                                        onChange={(e) => setEditingCustomer({ ...editingCustomer, gender: getGenderValue(e.target.value) })}
                                        className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                            } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                        required
                                    >
                                        <option value="">Chọn giới tính</option>
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </div>

                                {/* Trạng thái */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        Trạng thái
                                    </label>
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${!editingCustomer.isDisabled
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-red-100 text-red-600'
                                            }`}>
                                            {editingCustomer.isDisabled ? 'Đã vô hiệu hóa' : 'Đang hoạt động'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className={`px-6 py-2.5 rounded-lg transition-colors ${isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdate}
                            className={`px-6 py-2.5 rounded-lg transition-colors ${isDarkMode
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-green-500 hover:bg-green-600'
                                } text-white flex items-center gap-2`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Modal phân quyền
    const RoleModal = () => (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                <div className={`relative w-full max-w-3xl p-8 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {/* Modal Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-orange-500/20">
                                <FiShield className="text-2xl text-orange-500" />
                            </div>
                            <div>
                                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Phân quyền người dùng
                                </h3>
                                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Thay đổi vai trò và quyền hạn của người dùng
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsRoleModalOpen(false)}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="space-y-6">
                        {/* Thông tin người dùng */}
                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Thông tin người dùng
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedUserForRole?.fullname || ''}
                                        disabled
                                        className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={selectedUserForRole?.email || ''}
                                        disabled
                                        className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Vai trò hiện tại
                                    </label>
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                                        <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                                            selectedUserForRole?.role === 'admin' 
                                                ? 'bg-red-100 text-red-600'
                                                : selectedUserForRole?.role === 'customer'
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-yellow-100 text-yellow-600'
                                        }`}>
                                            {getRoleLabel(selectedUserForRole?.role)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chọn vai trò mới */}
                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Chọn vai trò mới
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {roles.map((role) => (
                                    <button
                                        key={role.value}
                                        onClick={() => setNewRole(role.value)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                                            newRole === role.value
                                                ? 'border-orange-500 bg-orange-500/10'
                                                : isDarkMode
                                                    ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <FiShield className={`w-5 h-5 ${newRole === role.value ? 'text-orange-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {role.label}
                                                    </span>
                                                </div>
                                                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {role.description}
                                                </p>
                                            </div>
                                            {newRole === role.value && (
                                                <div className="ml-3 flex-shrink-0">
                                                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsRoleModalOpen(false)}
                            className={`px-6 py-2.5 rounded-lg transition-colors ${isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdateRole}
                            className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 transition-colors"
                        >
                            <FiShield className="w-5 h-5" />
                            Cập nhật vai trò
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-5xl font-bold mb-3">Quản lý khách hàng</h1>
                        <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Quản lý và theo dõi tất cả khách hàng trong hệ thống
                        </p>
                    </div>
                </div>

                {/* Thống kê */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Tổng số khách hàng */}
                    <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Tổng số khách hàng
                                </p>
                                <p className="text-3xl font-bold mt-1">{stats.total}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-100/80">
                                <FiUser className="text-2xl text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    {/* Đang hoạt động */}
                    <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Đang hoạt động
                                </p>
                                <p className="text-3xl font-bold mt-1">{stats.active}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-100/80">
                                <FiUserCheck className="text-2xl text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full"
                                style={{ width: `${(stats.active / stats.total) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* Đã vô hiệu hóa */}
                    <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Đã vô hiệu hóa
                                </p>
                                <p className="text-3xl font-bold mt-1">{stats.disabled}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-red-100/80">
                                <FiUserX className="text-2xl text-red-600" />
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full"
                                style={{ width: `${(stats.disabled / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Bộ lọc và tìm kiếm */}
                <div className={`p-6 rounded-xl shadow-sm mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex flex-wrap gap-4">
                        {/* Tìm kiếm */}
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Nhập tên, email hoặc số điện thoại..."
                                    className={`w-full pl-12 pr-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${isDarkMode
                                            ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <FiSearch className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                        </div>

                        {/* Lọc theo trạng thái */}
                        <select
                            className={`min-w-[210px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="all">👥 Tất cả trạng thái ({filteredCustomers.length})</option>
                            <option value="active">✅ Đang hoạt động ({filteredCustomers.filter(c => !c.isDisabled).length})</option>
                            <option value="disabled">❌ Đã vô hiệu hóa ({filteredCustomers.filter(c => c.isDisabled).length})</option>
                        </select>

                        {/* Lọc theo giới tính */}
                        <select
                            className={`min-w-[180px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                            value={filters.gender}
                            onChange={(e) => handleFilterChange('gender', e.target.value)}
                        >
                            <option value="">👤 Tất cả giới tính</option>
                            <option value="Nam">👨 Nam ({filteredCustomers.filter(c => c.gender === 'male').length})</option>
                            <option value="Nữ">👩 Nữ ({filteredCustomers.filter(c => c.gender === 'female').length})</option>
                        </select>

                        {/* Sắp xếp */}
                        <select
                            className={`min-w-[180px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                            value={filters.sort}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                        >
                            <option value="userID">🔢 Theo ID</option>
                            <option value="fullname">📝 Theo tên</option>
                            <option value="email">📧 Theo email</option>
                        </select>

                        {/* Thứ tự */}
                        <select
                            className={`min-w-[180px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                            value={filters.order}
                            onChange={(e) => handleFilterChange('order', e.target.value)}
                        >
                            <option value="desc">⬇️ Giảm dần</option>
                            <option value="asc">⬆️ Tăng dần</option>
                        </select>
                    </div>
                </div>

                {/* Bảng danh sách khách hàng */}
                <div className={`overflow-hidden rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`text-left ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '180px' }}>
                                        Họ và tên
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '100px' }}>
                                        Giới tính
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '200px' }}>
                                        Email
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '130px' }}>
                                        Số điện thoại
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '150px' }}>
                                        Vai trò
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '150px' }}>
                                        Trạng thái
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '180px' }}>
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8">
                                            <div className="flex justify-center items-center space-x-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : getCurrentCustomers().length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8">
                                            <div className="flex flex-col items-center justify-center">
                                                <FiUser className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Không tìm thấy khách hàng nào
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    getCurrentCustomers().map((customer) => (
                                        <tr
                                            key={customer._id}
                                            className={`group transition-colors hover:${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                                        >
                                            <td className="px-6 py-4" style={{ minWidth: '180px' }}>
                                                <div className="flex items-center gap-2">
                                                    <FiUser className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                    <span className={`text-base font-medium whitespace-nowrap ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                        {customer.fullname}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4" style={{ minWidth: '100px' }}>
                                                <span className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${customer.gender === 'male'
                                                        ? 'bg-indigo-100 text-indigo-600'
                                                        : 'bg-pink-100 text-pink-600'
                                                    }`}>
                                                    {getGenderText(customer.gender)}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} style={{ minWidth: '200px' }}>
                                                {customer.email}
                                            </td>
                                            <td className={`px-6 py-4 text-base whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} style={{ minWidth: '130px' }}>
                                                {customer.phone}
                                            </td>
                                            <td className="px-6 py-4" style={{ minWidth: '150px' }}>
                                                <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${
                                                    customer.role === 'admin' 
                                                        ? 'bg-red-100 text-red-600'
                                                        : customer.role === 'customer'
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                    {getRoleLabel(customer.role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" style={{ minWidth: '150px' }}>
                                                <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${!customer.isDisabled
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {customer.isDisabled ? 'Đã vô hiệu hóa' : 'Đang hoạt động'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button
                                                        onClick={() => handleOpenRoleModal(customer)}
                                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                                ? 'bg-orange-400/10 hover:bg-orange-400/20 text-orange-400'
                                                                : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                                                            }`}
                                                        title="Phân quyền"
                                                    >
                                                        <FiShield className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(customer.userID, customer.isDisabled)}
                                                        className={`p-2 rounded-lg transition-colors ${!customer.isDisabled
                                                                ? isDarkMode
                                                                    ? 'bg-green-400/10 hover:bg-green-400/20 text-green-400'
                                                                    : 'bg-green-100 hover:bg-green-200 text-green-600'
                                                                : isDarkMode
                                                                    ? 'bg-red-400/10 hover:bg-red-400/20 text-red-400'
                                                                    : 'bg-red-100 hover:bg-red-200 text-red-600'
                                                            }`}
                                                        title={customer.isDisabled ? 'Kích hoạt' : 'Vô hiệu hóa'}
                                                    >
                                                        <FiPower className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(customer)}
                                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                                ? 'bg-blue-400/10 hover:bg-blue-400/20 text-blue-400'
                                                                : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                                            }`}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <FiEdit2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenFeedbackForm(customer)}
                                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                                ? 'bg-purple-400/10 hover:bg-purple-400/20 text-purple-400'
                                                                : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                                                            }`}
                                                        title="Phản hồi khách hàng"
                                                    >
                                                        <FiFileText className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Phân trang */}
                <div className="flex justify-center space-x-2 mt-4 mb-6">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={`px-4 py-2 border rounded-lg transition-colors ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
                                : 'bg-white border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
                            }`}
                    >
                        Trước
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-4 py-2 border rounded-lg transition-colors ${currentPage === page
                                            ? 'bg-green-500 text-white border-green-500'
                                            : isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                                                : 'bg-white hover:bg-gray-50 border-gray-300'
                                        }`}
                                >
                                    {page}
                                </button>
                            );
                        }
                        if (page === 2 || page === totalPages - 1) {
                            return <span key={page} className={`px-4 py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>...</span>;
                        }
                        return null;
                    })}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className={`px-4 py-2 border rounded-lg transition-colors ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
                                : 'bg-white border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
                            }`}
                    >
                        Sau
                    </button>
                </div>
            </div>
            {isModalOpen && editingCustomer && EditModal()}
            {isRoleModalOpen && selectedUserForRole && RoleModal()}

            {/* ===== MODAL PHẢN HỒI KHÁCH HÀNG ===== */}
            {isFeedbackModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        {/* Header */}
                        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-purple-500/20">
                                    <FiFileText className="text-2xl text-purple-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Biểu Mẫu Phản Hồi Khách Hàng</h2>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Ghi nhận phản hồi và đánh giá của khách hàng
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsFeedbackModalOpen(false)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Phần I: Thông tin khách hàng */}
                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FiUser className="text-purple-500" />
                                    I. Thông tin khách hàng
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Họ và tên
                                        </label>
                                        <input
                                            type="text"
                                            value={feedbackData.fullname}
                                            readOnly
                                            className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'} cursor-not-allowed`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="text"
                                            value={feedbackData.phone}
                                            readOnly
                                            className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'} cursor-not-allowed`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Email
                                        </label>
                                        <input
                                            type="text"
                                            value={feedbackData.email}
                                            readOnly
                                            className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'} cursor-not-allowed`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Ngày phản hồi
                                        </label>
                                        <input
                                            type="date"
                                            value={feedbackData.feedbackDate.toISOString().split('T')[0]}
                                            onChange={(e) => setFeedbackData({ ...feedbackData, feedbackDate: new Date(e.target.value) })}
                                            className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Địa chỉ
                                        </label>
                                        <input
                                            type="text"
                                            value={feedbackData.address}
                                            onChange={(e) => setFeedbackData({ ...feedbackData, address: e.target.value })}
                                            className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            placeholder="Nhập địa chỉ khách hàng"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Phần II: Nội dung phản hồi */}
                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <h3 className="text-lg font-semibold mb-4">II. Nội dung phản hồi của khách hàng</h3>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Nội dung phản hồi *
                                    </label>
                                    <textarea
                                        value={feedbackData.feedback}
                                        onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                                        rows={5}
                                        className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'} resize-none`}
                                        placeholder="Nhập nội dung phản hồi của khách hàng..."
                                    />
                                </div>
                            </div>

                            {/* Phần III: Phương án xử lý */}
                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <h3 className="text-lg font-semibold mb-4">III. Phương án xử lý của nhân viên/shop</h3>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Phương án xử lý
                                    </label>
                                    <textarea
                                        value={feedbackData.resolution}
                                        onChange={(e) => setFeedbackData({ ...feedbackData, resolution: e.target.value })}
                                        rows={5}
                                        className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'} resize-none`}
                                        placeholder="Nhập phương án xử lý và giải quyết vấn đề..."
                                    />
                                </div>
                            </div>

                            {/* Phần IV: Đánh giá */}
                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <h3 className="text-lg font-semibold mb-4">IV. Đánh giá sau xử lý của khách hàng</h3>
                                <div>
                                    <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Mức độ hài lòng
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['Rất hài lòng', 'Hài lòng', 'Bình thường', 'Không hài lòng'].map((rating) => (
                                            <button
                                                key={rating}
                                                onClick={() => setFeedbackData({ ...feedbackData, rating })}
                                                className={`p-3 rounded-lg border-2 transition-all ${
                                                    feedbackData.rating === rating
                                                        ? 'border-purple-500 bg-purple-500/20 text-purple-500'
                                                        : isDarkMode
                                                            ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                                                            : 'border-gray-300 hover:border-gray-400 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                        feedbackData.rating === rating
                                                            ? 'border-purple-500 bg-purple-500'
                                                            : 'border-gray-400'
                                                    }`}>
                                                        {feedbackData.rating === rating && (
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium">{rating}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`sticky bottom-0 flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <button
                                onClick={() => setIsFeedbackModalOpen(false)}
                                className={`px-6 py-3 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleGenerateFeedbackPDF}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                            >
                                <FiDownload /> Xuất PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
