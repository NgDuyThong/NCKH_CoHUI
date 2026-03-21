import { useState, useEffect } from 'react';
import { FiPlus, FiClock, FiEdit2, FiTrash2, FiX, FiBell, FiCheckCircle, FiXCircle, FiSearch,} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useTheme } from '../../contexts/AdminThemeContext';
import axios from '../../utils/axios';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

const NotificationManagement = () => {
    const { isDarkMode } = useTheme();

    // ===== STATE QUẢN LÝ =====
    const [allNotifications, setAllNotifications] = useState([]);
    const [displayedNotifications, setDisplayedNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        type: 'all',
        searchTerm: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    const [expandedMessages, setExpandedMessages] = useState({});

    // ===== STATE PHÂN TRANG =====
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // ===== STATE THỐNG KÊ =====
    const [stats, setStats] = useState({
        totalNotifications: 0,
        totalPendingNotifications: 0,
        totalExpiredNotifications: 0,
        totalActiveNotifications: 0
    });

    // ===== STATE CHỌN USER =====
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [searchUser, setSearchUser] = useState('');

    // ===== FETCH THÔNG BÁO =====
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/notifications/admin/notifications');
            const { notifications, stats: apiStats } = response.data;

            setAllNotifications(notifications);
            setStats(prevStats => ({
                ...prevStats,
                totalNotifications: apiStats.totalNotifications,
                totalPendingNotifications: apiStats.totalPendingNotifications,
                totalExpiredNotifications: apiStats.totalExpiredNotifications,
                totalActiveNotifications: apiStats.totalActiveNotifications
            }));
            filterNotifications(notifications);
        } catch (error) {
            console.error('Lỗi tải thông báo:', error);
            toast.error('Không thể tải danh sách thông báo');
        } finally {
            setLoading(false);
        }
    };

    // ===== LỌC VÀ SẮP XẾP THÔNG BÁO =====
    const filterNotifications = (notifications) => {
        let result = [...notifications];

        // ===== LỌC THEO LOẠI =====
        if (filters.type !== 'all') {
            result = result.filter(notification =>
                notification.type === filters.type
            );
        }

        // ===== LỌC THEO TỪ KHÓA =====
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            result = result.filter(notification =>
                notification.title.toLowerCase().includes(searchLower) ||
                notification.message.toLowerCase().includes(searchLower)
            );
        }

        // ===== SẮP XẾP THÔNG BÁO =====
        result.sort((a, b) => {
            const order = filters.sortOrder === 'asc' ? 1 : -1;

            switch (filters.sortBy) {
                case 'readCount':
                    return (a.readCount - b.readCount) * order;
                case 'createdAt':
                    return (new Date(a.createdAt) - new Date(b.createdAt)) * order;
                default:
                    return 0;
            }
        });

        setDisplayedNotifications(result);
    };

    // Xử lý thay đổi sắp xếp
    const handleSortChange = (sortBy) => {
        setFilters(prev => ({
            ...prev,
            sortBy,
            sortOrder: prev.sortBy === sortBy ? (prev.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'
        }));
        filterNotifications(allNotifications);
    };

    // Thêm hàm fetch users
    const fetchUsers = async () => {
        try {
            setIsLoadingUsers(true);
            const response = await axios.get('/api/admin/users/admin/users', {
                params: {
                    limit: 1000 // Lấy tối đa 1000 users
                }
            });
            if (response.data && response.data.users) {
                setAllUsers(response.data.users);
            } else {
                toast.error('Dữ liệu không hợp lệ');
                setAllUsers([]);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách user:', error);
            toast.error(error.response?.data?.message || 'Không thể tải danh sách user');
            setAllUsers([]);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // ===== CHỈNH SỬA HÀM handleSaveNotification =====
    const handleSaveNotification = async () => {
        try {
            if (!selectedNotification.title || !selectedNotification.message || !selectedNotification.type) {
                toast.error('Vui lòng điền đầy đủ thông tin');
                return;
            }

            // ===== CHUYỂN ĐỔI THỜI GIAN TỪ LOCAL TIME SANG UTC =====
            const scheduledForDate = new Date(selectedNotification.scheduledFor);
            const expiresAtDate = new Date(selectedNotification.expiresAt);

            const payload = {
                ...selectedNotification,
                adminID: '1737806878397',
                scheduledFor: scheduledForDate.toISOString(),
                expiresAt: expiresAtDate.toISOString(),
                userIDs: selectedUsers
            };

            if (selectedNotification.notificationID) {
                await axios.put(`/api/admin/notifications/admin/notifications/update/${selectedNotification.notificationID}`, payload);
                toast.success('Cập nhật thông báo thành công');
            } else {
                await axios.post('/api/admin/notifications/admin/notifications/create', payload);
                toast.success('Tạo thông báo thành công');
            }

            setIsModalOpen(false);
            setSelectedUsers([]);
            fetchNotifications();
        } catch (error) {
            console.error('Lỗi lưu thông báo:', error);
            toast.error('Không thể sửa thông báo đã gửi');
        }
    };

    //! Toàn thêm
    // ===== XÓA THÔNG BÁO =====
    const handleDeleteNotification = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
            try {
                await axios.delete(`/api/admin/notifications/admin/notifications/delete/${id}`);
                toast.success('Xóa thông báo thành công');
                fetchNotifications();
            } catch (error) {
                console.error('Lỗi xóa thông báo:', error);
                toast.error('Không thể xóa thông báo');
            }
        }
    };

    // ===== RENDER PHÂN TRANG =====
    const renderPagination = () => {
        return (
            <div className="flex justify-center space-x-2 mt-4 mb-6">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                    className={`px-4 py-2 border rounded-lg ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
                        : 'bg-white border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
                        }`}
                >
                    Trước
                </button>

                {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 border rounded-lg ${currentPage === page
                                ? 'bg-green-500 text-white border-green-500'
                                : isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                                    : 'bg-white hover:bg-gray-50 border-gray-300'
                                }`}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 border rounded-lg ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
                        : 'bg-white border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
                        }`}
                >
                    Sau
                </button>
            </div>
        );
    };

    // ===== XỬ LÝ CHỈNH SỬA THÔNG BÁO =====
    const handleEditNotification = (notification) => {
        // ===== CHUYỂN ĐỔI UTC SANG LOCAL TIME =====
        const scheduledForLocal = notification.scheduledFor ? new Date(notification.scheduledFor) : '';
        const expiresAtLocal = notification.expiresAt ? new Date(notification.expiresAt) : '';

        setSelectedNotification({
            ...notification,
            scheduledFor: scheduledForLocal ? scheduledForLocal.toISOString().slice(0, 16) : '',
            expiresAt: expiresAtLocal ? expiresAtLocal.toISOString().slice(0, 16) : ''
        });
        setIsModalOpen(true);
    };

    // ===== RENDER THỐNG KÊ =====
    const renderStats = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Tổng thông báo */}
                <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Tổng số thông báo
                            </p>
                            <div className="flex items-baseline mt-2">
                                <p className="text-2xl font-bold">{stats.totalNotifications}</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-100/80">
                            <FiBell className="text-2xl text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                {/* Thông báo đã gửi */}
                <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Đang chờ gửi
                            </p>
                            <div className="flex items-baseline mt-2">
                                <p className="text-2xl font-bold">{stats.totalPendingNotifications}</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-yellow-100/80">
                            <FiClock className="text-2xl text-yellow-600" />
                        </div>
                    </div>
                    <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" 
                             style={{ width: `${(stats.totalPendingNotifications / stats.totalNotifications) * 100}%` }}></div>
                    </div>
                </div>

                {/* Thông báo đã đọc */}
                <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Đang hoạt động
                            </p>
                            <div className="flex items-baseline mt-2">
                                <p className="text-2xl font-bold">{stats.totalActiveNotifications}</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-green-100/80">
                            <FiCheckCircle className="text-2xl text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" 
                             style={{ width: `${(stats.totalActiveNotifications / stats.totalNotifications) * 100}%` }}></div>
                    </div>
                </div>

                {/* Tỷ lệ đọc */}
                <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Đã hết hạn
                            </p>
                            <div className="flex items-baseline mt-2">
                                <p className="text-2xl font-bold">{stats.totalExpiredNotifications}</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-red-100/80">
                            <FiXCircle className="text-2xl text-red-600" />
                        </div>
                    </div>
                    <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" 
                             style={{ width: `${(stats.totalExpiredNotifications / stats.totalNotifications) * 100}%` }}></div>
                    </div>
                </div>
            </div>
        );
    };

    // ===== RENDER BẢNG THÔNG BÁO =====
    const renderNotificationTable = () => {
        return (
            <div className={`overflow-hidden rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <table className="w-full">
                    <thead>
                        <tr className={`text-left ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <th className="px-6 py-4 text-left text-base font-medium uppercase tracking-wider">
                                Tiêu đề
                            </th>
                            <th className="px-6 py-4 text-left text-base font-medium uppercase tracking-wider">
                                Loại
                            </th>
                            <th className="px-6 py-4 text-left text-base font-medium uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-6 py-4 text-left text-base font-medium uppercase tracking-wider">
                                Lượt đọc
                            </th>
                            <th className="px-6 py-4 text-left text-base font-medium uppercase tracking-wider">
                                Ngày tạo
                            </th>
                            <th className="px-6 py-4 text-left text-base font-medium uppercase tracking-wider">
                                Ngày hiển thị
                            </th>
                            <th className="px-6 py-4 text-left text-base font-medium uppercase tracking-wider">
                                Ngày hết hạn
                            </th>
                            <th className="px-6 py-4 text-center text-base font-medium uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan="9">
                                    <div className="flex justify-center items-center py-8">
                                        <div className="flex space-x-2">
                                            <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce" 
                                                 style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce" 
                                                 style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce" 
                                                 style={{ animationDelay: '0.3s' }}></div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : displayedNotifications.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4">
                                    Không có thông báo nào
                                </td>
                            </tr>
                        ) : (
                            currentNotifications.map((notification) => (
                                <tr 
                                    key={notification.notificationID}
                                    className={`group transition-colors hover:${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="text-base font-medium flex items-center gap-2">
                                            <FiBell className="w-5 h-5 text-green-500" />
                                            {notification.title}
                                        </div>
                                        <div className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                            <div className="flex flex-col">
                                                <p className="text-base">
                                                    {formatMessage(notification.message, notification.notificationID)}
                                                </p>
                                                {notification.message && notification.message.length > 50 && (
                                                    <button
                                                        onClick={() => toggleMessage(notification.notificationID)}
                                                        className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                                            } hover:underline`}
                                                    >
                                                        {expandedMessages[notification.notificationID] ? 'Thu gọn' : 'Xem thêm'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeStyle(notification.type)}`}>
                                            {getTypeLabel(notification.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCombinedStatusStyle(notification)}`}>
                                            {getCombinedStatusLabel(notification)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-base">
                                        {notification.readCount}
                                    </td>
                                    <td className="px-6 py-4 text-base">
                                        {formatDateTime(notification.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-base">
                                        {formatDateTime(notification.scheduledFor)}
                                    </td>
                                    <td className="px-6 py-4 text-base">
                                        {formatDateTime(notification.expiresAt)}
                                    </td>
                                    <td className="px-6 py-4 text-base text-center">
                                        <div className="flex items-center justify-end space-x-2">
                                            {!notification.isSent && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditNotification(notification)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            isDarkMode
                                                                ? 'bg-blue-400/10 hover:bg-blue-400/20 text-blue-400'
                                                                : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                                        }`}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <FiEdit2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteNotification(notification.notificationID)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            isDarkMode
                                                                ? 'bg-red-400/10 hover:bg-red-400/20 text-red-400'
                                                                : 'bg-red-100 hover:bg-red-200 text-red-600'
                                                        }`}
                                                        title="Xóa"
                                                    >
                                                        <FiTrash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    // ===== HÀM XỬ LÝ THU GỌN/MỞ RỘNG NỘI DUNG =====
    const toggleMessage = (id) => {
        setExpandedMessages(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // ===== HÀM FORMAT NỘI DUNG THÔNG BÁO =====
    const formatMessage = (message, id) => {
        if (!message) return '';
        if (expandedMessages[id]) {
            return message;
        }
        return message.length > 50 ? message.substring(0, 50) + '...' : message;
    };

    // ===== HÀM HỖ TRỢ HIỂN THỊ LOẠI THÔNG BÁO =====
    const getTypeLabel = (type) => {
        const types = {
            welcome: 'Chào mừng',
            promotion: 'Khuyến mãi',
            system: 'Hệ thống',
            new_collection: 'BST mới',
            membership: 'Thành viên',
            policy: 'Chính sách',
            survey: 'Khảo sát',
            security: 'Bảo mật',
            holiday: 'Ngày lễ'
        };
        return types[type] || type;
    };

    // ===== HÀM HỖ TRỢ CHỌN LOẠI THÔNG BÁO =====
    const getTypeStyle = (type) => {
        const styles = {
            welcome: 'bg-green-100 text-green-800',
            promotion: 'bg-yellow-100 text-yellow-800',
            system: 'bg-red-100 text-red-800',
            new_collection: 'bg-purple-100 text-purple-800',
            membership: 'bg-blue-100 text-blue-800',
            policy: 'bg-gray-100 text-gray-800',
            survey: 'bg-pink-100 text-pink-800',
            security: 'bg-orange-100 text-orange-800',
            holiday: 'bg-indigo-100 text-indigo-800'
        };
        return styles[type] || 'bg-gray-100 text-gray-800';
    };

    // ===== THÊM CÁC HÀM HỖ TRỢ MỚI =====
    const getCombinedStatusLabel = (notification) => {
        const currentDate = new Date();
        const scheduledDate = new Date(notification.scheduledFor);
        const expiredDate = new Date(notification.expiresAt);

        if (currentDate > expiredDate) {
            return 'Đã hết hạn';
        } else if (currentDate > scheduledDate) {
            return 'Đã gửi';
        } else if (currentDate < scheduledDate) {
            return 'Đang chờ';
        }
    };

    // ===== HÀM HỖ TRỢ CHỌN LOẠI THÔNG BÁO =====
    const getCombinedStatusStyle = (notification) => {
        const currentDate = new Date();
        const scheduledDate = new Date(notification.scheduledFor);
        const expiredDate = new Date(notification.expiresAt);

        if (currentDate > expiredDate) {
            return 'bg-red-100 text-red-800'; // Đã hết hạn - màu đỏ
        } else if (currentDate > scheduledDate) {
            return 'bg-green-100 text-green-800'; // Đã gửi - màu xanh lá
        } else if (currentDate < scheduledDate) {
            return 'bg-yellow-100 text-yellow-800'; // Đang chờ - màu vàng
        }
    };

    // ===== RENDER MODAL THÊM/SỬA THÔNG BÁO =====
    const renderNotificationModal = () => {
        if (!isModalOpen) return null;

        const filteredUsers = allUsers.filter(user =>
            user.fullName?.toLowerCase().includes(searchUser.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
            user.userID?.toString().includes(searchUser)
        );

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`w-full max-w-4xl rounded-xl shadow-2xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {selectedNotification.notificationID ? (
                                <>
                                    <FiEdit2 className="w-6 h-6" />
                                    Chỉnh sửa thông báo
                                </>
                            ) : (
                                <>
                                    <FiPlus className="w-6 h-6" />
                                    Thêm thông báo mới
                                </>
                            )}
                        </h2>
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className={`p-2 rounded-full hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-base font-medium mb-2">Tiêu đề</label>
                                    <input
                                        type="text"
                                        value={selectedNotification.title}
                                        onChange={(e) => setSelectedNotification(prev => ({
                                            ...prev,
                                            title: e.target.value
                                        }))}
                                        className={`w-full px-4 py-2.5 border rounded-lg ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                                                : 'bg-white border-gray-300 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                        placeholder="Nhập tiêu đề thông báo..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-base font-medium mb-2">Loại thông báo</label>
                                    <select
                                        value={selectedNotification.type}
                                        onChange={(e) => setSelectedNotification(prev => ({
                                            ...prev,
                                            type: e.target.value
                                        }))}
                                        className={`w-full px-4 py-2.5 border rounded-lg ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                                                : 'bg-white border-gray-300 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                    >
                                        <option value="welcome">🎉 Chào mừng</option>
                                        <option value="promotion">🏷️ Khuyến mãi</option>
                                        <option value="system">⚙️ Hệ thống</option>
                                        <option value="new_collection">👕 BST mới</option>
                                        <option value="membership">👑 Thành viên</option>
                                        <option value="policy">📜 Chính sách</option>
                                        <option value="survey">📝 Khảo sát</option>
                                        <option value="security">🔒 Bảo mật</option>
                                        <option value="holiday">🎊 Ngày lễ</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-base font-medium mb-2">Thời gian hiển thị</label>
                                    <input
                                        type="datetime-local"
                                        value={selectedNotification.scheduledFor || ''}
                                        onChange={(e) => {
                                            // const localDate = new Date(e.target.value);
                                            setSelectedNotification(prev => ({
                                                ...prev,
                                                scheduledFor: e.target.value
                                            }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                                                : 'bg-white border-gray-300 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-base font-medium mb-2">Thời gian hết hạn</label>
                                    <input
                                        type="datetime-local"
                                        value={selectedNotification.expiresAt || ''}
                                        onChange={(e) => {
                                            // const localDate = new Date(e.target.value);
                                            setSelectedNotification(prev => ({
                                                ...prev,
                                                expiresAt: e.target.value
                                            }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                                                : 'bg-white border-gray-300 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                    />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-base font-medium mb-2">Nội dung</label>
                                    <textarea
                                        value={selectedNotification.message}
                                        onChange={(e) => setSelectedNotification(prev => ({
                                            ...prev,
                                            message: e.target.value
                                        }))}
                                        className={`w-full px-4 py-2.5 border rounded-lg h-[150px] resize-none ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                                                : 'bg-white border-gray-300 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                        placeholder="Nhập nội dung thông báo..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-base font-medium mb-2">Người nhận</label>
                                    <div className={`p-4 border rounded-lg ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Tìm kiếm user..."
                                                        value={searchUser}
                                                        onChange={(e) => setSearchUser(e.target.value)}
                                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                                                            isDarkMode
                                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                                : 'bg-white border-gray-300'
                                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedUsers([])}
                                                className={`px-3 py-2 rounded-lg text-base ${
                                                    isDarkMode
                                                        ? 'bg-gray-700 hover:bg-gray-600'
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                            >
                                                Bỏ chọn tất cả
                                            </button>
                                            <button
                                                onClick={() => setSelectedUsers(allUsers.map(u => u.userID))}
                                                className="px-3 py-2 rounded-lg text-base bg-green-500 text-white hover:bg-green-600"
                                            >
                                                Chọn tất cả
                                            </button>
                                        </div>

                                        <div className={`max-h-[200px] overflow-y-auto rounded-lg ${
                                            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                                        }`}>
                                            {isLoadingUsers ? (
                                                <div className="flex justify-center items-center py-8">
                                                    <div className="flex space-x-2">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                                    </div>
                                                </div>
                                            ) : filteredUsers.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500">Không tìm thấy user nào</div>
                                            ) : (
                                                <div className="divide-y divide-gray-200">
                                                    {filteredUsers.map(user => (
                                                        <div
                                                            key={user.userID}
                                                            className={`flex items-center p-3 hover:bg-opacity-50 ${
                                                                isDarkMode
                                                                    ? 'hover:bg-gray-600'
                                                                    : 'hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.includes(user.userID)}
                                                                onChange={() => {
                                                                    setSelectedUsers(prev =>
                                                                        prev.includes(user.userID)
                                                                            ? prev.filter(id => id !== user.userID)
                                                                            : [...prev, user.userID]
                                                                    );
                                                                }}
                                                                className="w-4 h-4 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <div>
                                                                <div className="font-medium">{user.fullName}</div>
                                                                <div className="text-base text-gray-500">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2 text-base text-gray-500">
                                            {selectedUsers.length > 0
                                                ? `Đã chọn ${selectedUsers.length} user`
                                                : 'Chưa chọn user nào (sẽ gửi cho tất cả)'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className={`px-6 py-2.5 rounded-lg font-medium ${
                                isDarkMode
                                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSaveNotification}
                            className="px-6 py-2.5 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600"
                        >
                            {selectedNotification.notificationID ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Effect để fetch thông báo khi component mount
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Effect để lọc lại khi thay đổi bộ lọc
    useEffect(() => {
        filterNotifications(allNotifications);
    }, [filters]);

    // Thêm useEffect để fetch users khi mở modal
    useEffect(() => {
        if (isModalOpen) {
            fetchUsers();
        }
    }, [isModalOpen]);

    // Render phân trang
    const totalPages = Math.ceil(displayedNotifications.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentNotifications = displayedNotifications.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Tiêu đề */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-5xl font-bold mb-3">Quản lý thông báo</h1>
                    <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Quản lý và theo dõi tất cả thông báo trong hệ thống
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedNotification({
                            title: '',
                            message: '',
                            type: 'welcome',
                            scheduledFor: new Date().toISOString().slice(0, 16),
                            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                            status: 'pending'
                        });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center px-6 py-3 text-lg font-medium rounded-xl transition-all duration-300 bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/30"
                >
                    <FiPlus className="mr-2 w-6 h-6" /> Thêm thông báo
                </button>
            </div>

            {/* Thống kê */}
            {renderStats()}

            {/* Thanh công cụ */}
            <div className={`p-6 rounded-xl shadow-sm mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex flex-wrap gap-4">
                    {/* Tìm kiếm */}
                    <div className="flex-1 min-w-[240px]">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                className={`w-full pl-12 pr-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
                                        : 'bg-gray-50 border-gray-200'
                                }`}
                            />
                            <FiSearch className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={24} />
                        </div>
                    </div>

                    {/* Lọc theo loại */}
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        className={`min-w-[180px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${
                            isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                        <option value="all">🔍 Tất cả loại</option>
                        <option value="welcome">🎉 Chào mừng</option>
                        <option value="promotion">🏷️ Khuyến mãi</option>
                        <option value="system">⚙️ Hệ thống</option>
                        <option value="new_collection">👕 BST mới</option>
                        <option value="membership">👑 Thành viên</option>
                        <option value="policy">📜 Chính sách</option>
                        <option value="survey">📝 Khảo sát</option>
                        <option value="security">🔒 Bảo mật</option>
                        <option value="holiday">🎊 Ngày lễ</option>
                    </select>

                    {/* Sắp xếp */}
                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className={`min-w-[180px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${
                            isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                        <option value="createdAt">📅 Ngày tạo</option>
                        <option value="readCount">👁️ Lượt đọc</option>
                    </select>

                    {/* Thứ tự sắp xếp */}
                    <select
                        value={filters.sortOrder}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                        className={`min-w-[180px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${
                            isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                        <option value="desc">⬇️ Giảm dần</option>
                        <option value="asc">⬆️ Tăng dần</option>
                    </select>
                </div>
            </div>

            {/* Bảng thông báo */}
            <div className={`rounded-xl overflow-hidden shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {renderNotificationTable()}
            </div>

            {/* Phân trang */}
            {renderPagination()}

            {/* Modal */}
            {renderNotificationModal()}
        </div>
    );
};
export default NotificationManagement;

