import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiMail, FiPhone, FiLock, FiSave } from 'react-icons/fi';
import axiosInstance from '../utils/axios';
import { toast } from 'react-toastify';

const AdminProfileModal = ({ isOpen, onClose, isDarkMode }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [profileData, setProfileData] = useState({
        fullname: '',
        email: '',
        phone: '',
        role: '',
        gender: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadProfile();
        }
    }, [isOpen]);

    const loadProfile = () => {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo') || '{}');
        setProfileData({
            fullname: adminInfo.fullname || '',
            email: adminInfo.email || '',
            phone: adminInfo.phone || '',
            role: adminInfo.role || '',
            gender: adminInfo.gender || '' // Giữ nguyên format database: male, female
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateProfile = async () => {
        // Validation
        if (!profileData.fullname || profileData.fullname.trim() === '') {
            toast.error('Vui lòng nhập họ và tên');
            return;
        }

        if (profileData.phone && !/^[0-9]{10}$/.test(profileData.phone)) {
            toast.error('Số điện thoại phải có 10 chữ số');
            return;
        }

        try {
            setLoading(true);
            
            // Lấy token admin - ưu tiên localStorage
            const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            
            if (!adminToken) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                return;
            }

            console.log('Sending update request with token:', adminToken ? 'Token exists' : 'No token');
            
            const response = await axiosInstance.put('/api/user/profile', {
                fullname: profileData.fullname,
                phone: profileData.phone,
                gender: profileData.gender
            }, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            console.log('Update response:', response.data);

            // Cập nhật localStorage/sessionStorage
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo') || '{}');
            const updatedInfo = {
                ...adminInfo,
                fullname: profileData.fullname,
                phone: profileData.phone,
                gender: profileData.gender
            };

            if (localStorage.getItem('adminInfo')) {
                localStorage.setItem('adminInfo', JSON.stringify(updatedInfo));
            } else {
                sessionStorage.setItem('adminInfo', JSON.stringify(updatedInfo));
            }

            // Trigger event để sidebar cập nhật
            window.dispatchEvent(new Event('adminInfoUpdated'));

            toast.success('Cập nhật thông tin thành công!');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            console.error('Error response:', error.response);
            
            if (error.response?.status === 403) {
                toast.error('Bạn không có quyền truy cập. Vui lòng đăng nhập lại.');
            } else if (error.response?.status === 401) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword) {
            toast.error('Vui lòng nhập mật khẩu hiện tại!');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu mới không khớp!');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            toast.error('Mật khẩu mới phải khác mật khẩu cũ!');
            return;
        }

        try {
            setLoading(true);
            
            // Lấy token admin
            const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            
            await axiosInstance.put('/api/user/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            toast.success('Đổi mật khẩu thành công!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setIsChangingPassword(false);
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    const getRoleText = (role) => {
        const roleMap = {
            'admin': 'Quản trị viên',
            'customer_manager': 'Quản lý khách hàng',
            'product_manager': 'Quản lý sản phẩm',
            'order_manager': 'Quản lý đơn hàng',
            'coupon_manager': 'Quản lý mã giảm giá',
            'promotion_manager': 'Quản lý khuyến mãi',
            'notification_manager': 'Quản lý thông báo'
        };
        return roleMap[role] || role;
    };

    const getGenderText = (gender) => {
        const genderMap = {
            'male': 'Nam',
            'female': 'Nữ'
        };
        return genderMap[gender] || 'Chưa cập nhật';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className={`relative w-full max-w-2xl rounded-lg shadow-2xl ${
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } max-h-[90vh] overflow-hidden`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                    <h2 className="text-2xl font-bold">Thông tin cá nhân</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                    >
                        <FiX className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* Thông tin cơ bản */}
                    <div className="space-y-4">
                        {/* Họ tên */}
                        <div>
                            <label className="flex items-center mb-2 text-sm font-medium">
                                <FiUser className="mr-2" />
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                name="fullname"
                                value={profileData.fullname}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2 rounded-lg border ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                } ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="flex items-center mb-2 text-sm font-medium">
                                <FiMail className="mr-2" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={profileData.email}
                                disabled
                                className={`w-full px-4 py-2 rounded-lg border opacity-60 cursor-not-allowed ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            />
                            <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi</p>
                        </div>

                        {/* Số điện thoại */}
                        <div>
                            <label className="flex items-center mb-2 text-sm font-medium">
                                <FiPhone className="mr-2" />
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2 rounded-lg border ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                } ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                            />
                        </div>

                        {/* Giới tính */}
                        <div>
                            <label className="flex items-center mb-2 text-sm font-medium">
                                Giới tính
                            </label>
                            <select
                                name="gender"
                                value={profileData.gender}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2 rounded-lg border ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                } ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                            </select>
                        </div>

                        {/* Vai trò */}
                        <div>
                            <label className="flex items-center mb-2 text-sm font-medium">
                                Vai trò
                            </label>
                            <input
                                type="text"
                                value={getRoleText(profileData.role)}
                                disabled
                                className={`w-full px-4 py-2 rounded-lg border opacity-60 cursor-not-allowed ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Đổi mật khẩu */}
                    {!isEditing && (
                        <div className="mt-6">
                            <button
                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                                className={`flex items-center text-sm font-medium ${
                                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                }`}
                            >
                                <FiLock className="mr-2" />
                                {isChangingPassword ? 'Hủy đổi mật khẩu' : 'Đổi mật khẩu'}
                            </button>

                            {isChangingPassword && (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">
                                            Mật khẩu hiện tại
                                        </label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            className={`w-full px-4 py-2 rounded-lg border ${
                                                isDarkMode 
                                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">
                                            Mật khẩu mới
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className={`w-full px-4 py-2 rounded-lg border ${
                                                isDarkMode 
                                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">
                                            Xác nhận mật khẩu mới
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className={`w-full px-4 py-2 rounded-lg border ${
                                                isDarkMode 
                                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={loading}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`flex justify-end gap-3 p-6 border-t ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    loadProfile();
                                }}
                                disabled={loading}
                                className={`px-6 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                                    isDarkMode 
                                        ? 'bg-gray-700 hover:bg-gray-600' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateProfile}
                                disabled={loading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                            >
                                <FiSave className="mr-2" />
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className={`px-6 py-2 rounded-lg transition-colors ${
                                    isDarkMode 
                                        ? 'bg-gray-700 hover:bg-gray-600' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setIsChangingPassword(false);
                                }}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <FiUser className="mr-2" />
                                Chỉnh sửa thông tin
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminProfileModal;
