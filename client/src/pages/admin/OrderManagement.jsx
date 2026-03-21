import React, { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiEye, FiX, FiShoppingCart, FiClock, FiCheck, FiAlertCircle, FiUser, FiPackage, FiShoppingBag, FiDollarSign, FiLoader, FiEdit, FiFilter, FiRefreshCw, FiFileText, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axios';
import { useTheme } from '../../contexts/AdminThemeContext';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { generateSalesInvoicePDF, generateOrderConfirmationPDF } from '../../utils/pdfGenerator';

const OrderManagement = () => {
    const { isDarkMode } = useTheme();

    // ===== STATES =====
    // ===== MAIN DATA STATES =====
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);

    // ===== UI CONTROL STATES =====
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ===== FILTER AND SORT STATES =====
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        orderStatus: 'all',
        shippingStatus: 'all',
        paymentStatus: 'all',
        sort: 'createdAt',
        order: 'desc'
    });

    // ===== EDIT FORM STATE =====
    const [editForm, setEditForm] = useState({
        orderStatus: '',
        shippingStatus: '',
        isPayed: false
    });

    // ===== DELETE CONFIRMATION STATE =====
    const [orderToDelete, setOrderToDelete] = useState(null);

    // ===== PAGINATION STATES =====
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // ===== STATE CHO LOADING KHI CẬP NHẬT =====
    const [isUpdating, setIsUpdating] = useState(false);

    // ===== STATE MỚI ĐỂ LƯU TRỮ totalPrice =====
    const [orderTotalPrice, setOrderTotalPrice] = useState(0);

    // ===== STATE CHO XUẤT HÓA ĐƠN THEO NGÀY =====
    const [isDateInvoiceModalOpen, setIsDateInvoiceModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // ===== API CALLS =====
    // ===== LẤY TẤT CẢ ĐƠN HÀNG =====
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/api/admin/orders/admin/orders');
            if (response.data.orders) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error);
            toast.error(error.response?.data?.message || 'Không thể lấy danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    // ===== LẤY THÔNG TIN ĐƠN HÀNG CHO ADMIN =====
    const getOrderDetailsForAdmin = async (orderId) => {
        try {
            const response = await axiosInstance.get(`/api/admin/order-details/${orderId}`);
            if (response.data) {
                setOrderDetails(response.data.orderDetails);
                setOrderTotalPrice(response.data.totalPrice);
                setShowOrderDetails(true);
                // Cập nhật coupon info vào selectedOrder
                if (response.data.coupon) {
                    setSelectedOrder(prev => ({
                        ...prev,
                        coupon: response.data.coupon
                    }));
                }
            }
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
            toast.error(error.response?.data?.message || 'Không thể lấy chi tiết đơn hàng');
        }
    };

    // ===== CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG =====
    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await axiosInstance.put(`/api/admin/order-details/${orderId}`, {
                orderStatus: newStatus
            });
            toast.success('Cập nhật trạng thái đơn hàng thành công');
            fetchOrders();
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng');
        }
    };

    // ===== EVENT HANDLERS =====
    // ===== XỬ LÝ CHI TIẾT ĐƠN HÀNG =====
    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        getOrderDetailsForAdmin(order.orderID);
    };

    // ===== XỬ LÝ CHỈNH SỬA ĐƠN HÀNG =====
    const handleEditClick = async (order) => {
        setSelectedOrder(order);
        setEditForm({
            orderStatus: order.orderStatus,
            shippingStatus: order.shippingStatus,
            isPayed: order.isPayed
        });
        try {
            const response = await axiosInstance.get(`/api/admin/order-details/${order.orderID}`);
            if (response.data) {
                setSelectedOrder(prev => ({
                    ...prev,
                    orderDetails: response.data.orderDetails,
                    coupon: response.data.coupon
                }));
                setOrderTotalPrice(response.data.totalPrice);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin chi tiết đơn hàng:', error);
            toast.error('Không thể lấy thông tin chi tiết đơn hàng');
        }
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // ===== XỬ LÝ LƯU THAY ĐỔI ĐƠN HÀNG =====
    const handleSaveChanges = async () => {
        try {
            setIsUpdating(true);
            const response = await axiosInstance.patch(`/api/admin/orders/admin/orders/update/${selectedOrder.orderID}`, {
                orderStatus: editForm.orderStatus,
                shippingStatus: editForm.shippingStatus,
                isPayed: editForm.isPayed
            });

            if (response.data) {
                // Cập nhật state orders với đơn hàng đã được cập nhật
                const updatedOrders = orders.map(order =>
                    order.orderID === selectedOrder.orderID
                        ? { ...order, ...editForm }
                        : order
                );
                setOrders(updatedOrders);

                // Đóng modal và reset form
                setIsEditMode(false);
                setSelectedOrder(null);
                setIsModalOpen(false);
                toast.success('Cập nhật đơn hàng thành công!');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật đơn hàng:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật đơn hàng!');
        } finally {
            setIsUpdating(false);
        }
    };

    // ===== XỬ LÝ XÓA ĐƠN HÀNG =====
    const handleDeleteClick = (order) => {
        setOrderToDelete(order);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await axiosInstance.delete(`/api/admin/orders/admin/orders/delete/${orderToDelete.orderID}`);

            if (response.status === 200) {
                // Cập nhật state orders sau khi xóa
                const updatedOrders = orders.filter(order => order.orderID !== orderToDelete.orderID);
                setOrders(updatedOrders);

                // Reset các state liên quan
                setShowDeleteConfirm(false);
                setOrderToDelete(null);

                toast.success('Xóa đơn hàng thành công!');
            }
        } catch (error) {
            console.error('Lỗi khi xóa đơn hàng:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa đơn hàng!');
        }
    };

    // ===== XỬ LÝ PHÂN TRANG =====
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // ===== HELPER FUNCTIONS =====
    // ===== HÀM ĐỊNH DẠNG NGÀY =====
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // ===== HÀM ĐỊNH DẠNG MÀU SẮC =====
    const getOrderStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
            case 'processing':
                return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100';
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
            case 'refunded':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
        }
    };

    // ===== HÀM ĐỊNH DẠNG MÀU SẮC =====
    const getShippingStatusColor = (status) => {
        switch (status) {
            case 'preparing':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
            case 'shipping':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
            case 'delivered':
                return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
            case 'returned':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
        }
    };

    // ===== HÀM ĐỊNH DẠNG TEXT TRẠNG THÁI =====
    const getOrderStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Chờ xác nhận';
            case 'confirmed':
                return 'Đã xác nhận';
            case 'processing':
                return 'Đang xử lý';
            case 'completed':
                return 'Hoàn thành';
            case 'cancelled':
                return 'Đã hủy';
            case 'refunded':
                return 'Đã hoàn tiền';
            default:
                return 'Không xác định';
        }
    };

    // ===== HÀM ĐỊNH DẠNG TEXT TRẠNG THÁI =====
    const getShippingStatusText = (status) => {
        switch (status) {
            case 'preparing':
                return 'Đang chuẩn bị';
            case 'shipping':
                return 'Đang giao hàng';
            case 'delivered':
                return 'Đã giao hàng';
            case 'returned':
                return 'Đã hoàn trả';
            case 'cancelled':
                return 'Đã hủy vận chuyển';
            default:
                return 'Không xác định';
        }
    };

    // ===== HANDLERS CHO PDF EXPORT =====
    const handleExportSalesInvoice = async (order) => {
        try {
            // Lấy chi tiết đơn hàng trực tiếp từ API
            const response = await axiosInstance.get(`/api/admin/order-details/${order.orderID}`);
            
            if (!response.data || !response.data.orderDetails) {
                toast.error('Không thể lấy thông tin đơn hàng');
                return;
            }

            const details = response.data.orderDetails;
            const totalPrice = response.data.totalPrice;

            // Chuẩn bị data cho PDF
            const invoiceData = {
                orderID: order.orderID,
                customerName: order.fullname,
                customerAddress: order.address,
                customerPhone: order.phoneNumber,
                shopAddress: '484 Le Van Sy, Phuong 14, Quan 3, TP. Ho Chi Minh',
                shopPhone: '0123456789',
                items: details.map(detail => ({
                    productName: detail.product?.name || 'San pham khong xac dinh',
                    color: detail.product?.color?.colorName || '',
                    size: detail.size || '',
                    quantity: detail.quantity,
                    price: Number(detail.product?.price?.toString().replace(/\./g, '') || 0)
                })),
                totalPrice: totalPrice,
                paymentPrice: order.totalPrice, // Giá gốc từ order
                finalPrice: order.paymentPrice, // Giá sau giảm
                discount: order.totalPrice - order.paymentPrice, // Số tiền giảm
                totalInWords: ''
            };

            generateSalesInvoicePDF(invoiceData);
            toast.success('Xuất hóa đơn thành công!');
        } catch (error) {
            console.error('Lỗi khi xuất hóa đơn:', error);
            toast.error('Không thể xuất hóa đơn');
        }
    };

    const handleExportOrderConfirmation = async (order) => {
        try {
            // Lấy chi tiết đơn hàng trực tiếp từ API
            const response = await axiosInstance.get(`/api/admin/order-details/${order.orderID}`);
            
            if (!response.data || !response.data.orderDetails) {
                toast.error('Không thể lấy thông tin đơn hàng');
                return;
            }

            const details = response.data.orderDetails;

            // Chuẩn bị data cho PDF
            const confirmationData = {
                orderID: order.orderID,
                customerName: order.fullname,
                customerAddress: order.address,
                customerPhone: order.phoneNumber,
                createdAt: order.createdAt,
                items: details.map(detail => ({
                    productName: detail.product?.name || 'San pham khong xac dinh',
                    color: detail.product?.color?.colorName || '',
                    size: detail.size || '',
                    quantity: detail.quantity,
                    price: Number(detail.product?.price?.toString().replace(/\./g, '') || 0)
                })),
                totalPrice: order.totalPrice, // Giá gốc
                finalPrice: order.paymentPrice, // Giá sau giảm
                discount: order.totalPrice - order.paymentPrice // Số tiền giảm
            };

            generateOrderConfirmationPDF(confirmationData);
            toast.success('Xuất xác nhận đơn hàng thành công!');
        } catch (error) {
            console.error('Lỗi khi xuất xác nhận:', error);
            toast.error('Không thể xuất xác nhận đơn hàng');
        }
    };

    // ===== HANDLER XUẤT HÓA ĐƠN THEO NGÀY =====
    const handleExportDailyInvoice = async () => {
        try {
            if (!selectedDate) {
                toast.error('Vui lòng chọn ngày');
                return;
            }

            // Lọc đơn hàng theo ngày được chọn
            const selectedDateObj = new Date(selectedDate);
            const ordersOnDate = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.toDateString() === selectedDateObj.toDateString();
            });

            if (ordersOnDate.length === 0) {
                toast.error('Không có đơn hàng nào trong ngày này');
                return;
            }

            // Lấy chi tiết tất cả đơn hàng trong ngày
            const allOrderDetails = [];
            for (const order of ordersOnDate) {
                const response = await axiosInstance.get(`/api/admin/order-details/${order.orderID}`);
                if (response.data && response.data.orderDetails) {
                    allOrderDetails.push({
                        order: order,
                        details: response.data.orderDetails,
                        totalPrice: response.data.totalPrice
                    });
                }
            }

            // Chuẩn bị data cho PDF hóa đơn theo ngày
            const dailyInvoiceData = {
                date: selectedDate,
                orders: allOrderDetails.map(item => ({
                    orderID: item.order.orderID,
                    customerName: item.order.fullname,
                    customerAddress: item.order.address,
                    customerCity: item.order.city || 'Thanh pho Ho Chi Minh, Viet Nam',
                    items: item.details.map(detail => ({
                        productName: detail.product?.name || 'San pham khong xac dinh',
                        color: detail.product?.color?.colorName || '',
                        size: detail.size || '',
                        quantity: detail.quantity,
                        price: Number(detail.product?.price?.toString().replace(/\./g, '') || 0)
                    })),
                    totalPrice: item.order.totalPrice, // Giá gốc từ order
                    finalPrice: item.order.paymentPrice, // Giá sau giảm
                    discount: item.order.totalPrice - item.order.paymentPrice // Số tiền giảm
                })),
                shopAddress: '484 Le Van Sy, Phuong 14, Quan 3, TP. Ho Chi Minh',
                shopPhone: '0123456789'
            };

            // Import function từ pdfGenerator
            const { generateDailyInvoicePDF } = await import('../../utils/pdfGenerator');
            generateDailyInvoicePDF(dailyInvoiceData);
            
            toast.success(`Xuất hóa đơn ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')} thành công!`);
            setIsDateInvoiceModalOpen(false);
        } catch (error) {
            console.error('Lỗi khi xuất hóa đơn theo ngày:', error);
            toast.error('Không thể xuất hóa đơn theo ngày');
        }
    };

    // ===== HÀM ĐỊNH DẠNG MÀU SẮC =====
    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-600';
            case 'processing':
                return 'bg-blue-100 text-blue-600';
            case 'shipping':
                return 'bg-indigo-100 text-indigo-600';
            case 'completed':
                return 'bg-green-100 text-green-600';
            case 'cancelled':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    // ===== HÀM ĐỊNH DẠNG TEXT TRẠNG THÁI =====
    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return '⏳ Chờ xác nhận đơn';
            case 'confirmed':
                return '✅ Đã xác nhận đơn';
            case 'processing':
                return '🔄 Đang xử lý đơn';
            case 'shipping':
                return '🚚 Đang vận chuyển';
            case 'completed':
                return '🎉 Đã hoàn thành';
            case 'cancelled':
                return '❌ Đã hủy đơn';
            case 'refunded':
                return '💸 Đã hoàn tiền';
            default:
                return '❓ Trạng thái không xác định';
        }
    };

    // ===== LỌC VÀ SẮP XẾP ĐƠN HÀNG =====
    const getFilteredAndSortedOrders = () => {
        let result = [...orders];

        // Lọc theo từ khóa tìm kiếm
        if (searchTerm) {
            result = result.filter(order =>
                order.orderID.toString().includes(searchTerm.toLowerCase()) ||
                order.fullname.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Lọc theo trạng thái đơn hàng
        if (filters.orderStatus !== 'all') {
            result = result.filter(order => order.orderStatus === filters.orderStatus);
        }

        // Lọc theo trạng thái vận chuyển
        if (filters.shippingStatus !== 'all') {
            result = result.filter(order => order.shippingStatus === filters.shippingStatus);
        }

        // Lọc theo trạng thái thanh toán
        if (filters.paymentStatus !== 'all') {
            result = result.filter(order =>
                filters.paymentStatus === 'paid' ? order.isPayed : !order.isPayed
            );
        }

        // Sắp xếp đơn hàng
        result.sort((a, b) => {
            let compareValue;
            switch (filters.sort) {
                case 'createdAt':
                    compareValue = new Date(b.createdAt) - new Date(a.createdAt);
                    break;
                case 'paymentPrice':
                    compareValue = b.paymentPrice - a.paymentPrice;
                    break;
                case 'orderStatus':
                    compareValue = a.orderStatus.localeCompare(b.orderStatus);
                    break;
                case 'shippingStatus':
                    compareValue = a.shippingStatus.localeCompare(b.shippingStatus);
                    break;
                default:
                    compareValue = 0;
            }
            return filters.order === 'asc' ? -compareValue : compareValue;
        });

        return result;
    };

    // Tính toán phân trang
    const filteredAndSortedOrders = getFilteredAndSortedOrders();
    const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredAndSortedOrders.slice(indexOfFirstItem, indexOfLastItem);

    // Thêm hàm xử lý thay đổi filter
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    // ===== EFFECTS =====
    useEffect(() => {
        fetchOrders();
    }, []);

    // ===== HÀM RENDER =====
    const renderActionButtons = (order) => (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => handleViewDetails(order)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                title="Xem chi tiết"
            >
                <FiEye size={20} />
            </button>
            <button
                onClick={() => handleEditClick(order)}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                title="Chỉnh sửa"
            >
                <FiEdit2 size={20} />
            </button>
            <button
                onClick={() => handleDeleteClick(order)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                title="Xóa"
            >
                <FiTrash2 size={20} />
            </button>
        </div>
    );

    const renderEditModal = () => {
        if (!isModalOpen) return null;

        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"></div>

                <div className="flex min-h-full items-center justify-center p-4">
                    <div className={`relative w-full max-w-6xl rounded-xl shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-all`}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <FiEdit2 className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Cập nhật đơn hàng</h2>
                                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Mã đơn: #{selectedOrder?.orderID}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Cột bên trái - Thông tin khách hàng */}
                                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <FiUser className="w-5 h-5" />
                                        Thông tin khách hàng
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Họ tên</p>
                                            <p className="font-medium mt-1">{selectedOrder?.fullname}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Số điện thoại</p>
                                            <p className="font-medium mt-1">{selectedOrder?.phone}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Địa chỉ</p>
                                            <p className="font-medium mt-1">{selectedOrder?.address}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ngày đặt hàng</p>
                                            <p className="font-medium mt-1">{formatDateTime(selectedOrder?.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cột giữa và phải - Form cập nhật trạng thái */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Trạng thái đơn hàng */}
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <FiPackage className="w-5 h-5" />
                                            Trạng thái đơn hàng
                                        </h3>
                                        <select
                                            value={editForm.orderStatus}
                                            onChange={(e) => setEditForm({ ...editForm, orderStatus: e.target.value })}
                                            className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                                    ? 'bg-gray-600 border-gray-500 text-white'
                                                    : 'bg-white border-gray-300'
                                                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                        >
                                            <option value="pending">⏳ Chờ xác nhận</option>
                                            <option value="confirmed">✅ Đã xác nhận</option>
                                            <option value="processing">🔄 Đang xử lý</option>
                                            <option value="completed">🎉 Hoàn thành</option>
                                            <option value="cancelled">❌ Đã hủy</option>
                                            <option value="refunded">💸 Đã hoàn tiền</option>
                                        </select>
                                    </div>

                                    {/* Trạng thái vận chuyển */}
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <FiShoppingCart className="w-5 h-5" />
                                            Trạng thái vận chuyển
                                        </h3>
                                        <select
                                            value={editForm.shippingStatus}
                                            onChange={(e) => setEditForm({ ...editForm, shippingStatus: e.target.value })}
                                            className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                                    ? 'bg-gray-600 border-gray-500 text-white'
                                                    : 'bg-white border-gray-300'
                                                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                                        >
                                            <option value="preparing">📦 Đang chuẩn bị</option>
                                            <option value="shipping">🚚 Đang giao hàng</option>
                                            <option value="delivered">✅ Đã giao hàng</option>
                                            <option value="returned">↩️ Đã hoàn trả</option>
                                            <option value="cancelled">❌ Đã hủy vận chuyển</option>
                                        </select>
                                    </div>

                                    {/* Trạng thái thanh toán */}
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <FiDollarSign className="w-5 h-5" />
                                            Trạng thái thanh toán
                                        </h3>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isPayed}
                                                onChange={(e) => setEditForm({ ...editForm, isPayed: e.target.checked })}
                                                className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                                            />
                                            <label className="ml-3 text-base">
                                                {editForm.isPayed ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chi tiết sản phẩm */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FiShoppingBag className="w-5 h-5" />
                                    Chi tiết sản phẩm
                                </h3>
                                <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                            <thead>
                                                <tr className={isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Sản phẩm</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Màu sắc</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kích thước</th>
                                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Số lượng</th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Đơn giá</th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                                {selectedOrder?.orderDetails?.map((detail, index) => {
                                                    // Parse giá từ string sang number
                                                    const parsePrice = (price) => {
                                                        if (!price) return 0;
                                                        if (typeof price === 'number') return price;
                                                        return Number(price.toString().replace(/\./g, ''));
                                                    };
                                                    
                                                    const hasPromotion = detail.product?.promotion;
                                                    const originalPrice = parsePrice(detail.product?.originalPrice || detail.product?.price);
                                                    const finalPrice = hasPromotion ? parsePrice(detail.product.promotion.discountedPrice) : originalPrice;
                                                    const subtotal = finalPrice * detail.quantity;
                                                    
                                                    return (
                                                        <tr key={detail.orderDetailID} className={index % 2 === 0 ? '' : isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'}>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="relative group">
                                                                        {detail.product?.color?.image && (
                                                                            <>
                                                                                <img
                                                                                    src={detail.product.color.image}
                                                                                    alt={detail.product.name}
                                                                                    className="h-16 w-16 object-cover rounded-lg shadow-sm transform transition-transform duration-200 group-hover:scale-110"
                                                                                />
                                                                                <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium">{detail.product?.name}</div>
                                                                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                            SKU: {detail.SKU}
                                                                        </div>
                                                                        {hasPromotion && (
                                                                            <div className="mt-1 flex items-center gap-2">
                                                                                <span className="inline-block px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded">
                                                                                    -{detail.product.promotion.discountPercent}%
                                                                                </span>
                                                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                                                    {detail.product.promotion.name}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 whitespace-nowrap">
                                                                    {detail.product.color?.colorName || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 whitespace-nowrap">
                                                                    {detail.size}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                                                                    {detail.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {hasPromotion && (
                                                                    <div className="text-xs text-gray-400 line-through mb-1">
                                                                        {originalPrice?.toLocaleString('vi-VN')}đ
                                                                    </div>
                                                                )}
                                                                <div className={`${hasPromotion ? 'text-red-600 font-medium' : ''}`}>
                                                                    {finalPrice?.toLocaleString('vi-VN')}đ
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {hasPromotion && (
                                                                    <div className="text-xs text-gray-400 line-through mb-1">
                                                                        {(originalPrice * detail.quantity)?.toLocaleString('vi-VN')}đ
                                                                    </div>
                                                                )}
                                                                <div className={`font-medium ${hasPromotion ? 'text-red-600' : ''}`}>
                                                                    {subtotal?.toLocaleString('vi-VN')}đ
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                                    <td colSpan="5" className="px-5 py-3 text-right font-medium text-gray-500">
                                                        Tổng tiền hàng:
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-medium">
                                                        {selectedOrder?.totalPrice?.toLocaleString('vi-VN')}đ
                                                    </td>
                                                </tr>
                                                {selectedOrder?.coupon && (selectedOrder.totalPrice - selectedOrder.paymentPrice) > 0 && (
                                                    <tr className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                                        <td colSpan="5" className="px-5 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="text-right">
                                                                    <div className="text-sm font-medium text-gray-500">Áp dụng mã giảm giá:</div>
                                                                    <div className="text-xs text-green-600 font-semibold">
                                                                        {selectedOrder.coupon.code}
                                                                        {selectedOrder.coupon.discountType === 'percentage' 
                                                                            ? ` (Giảm ${selectedOrder.coupon.discountValue}%)`
                                                                            : ` (Giảm ${selectedOrder.coupon.discountValue?.toLocaleString('vi-VN')}đ)`
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-medium text-red-500">
                                                            -{(selectedOrder.totalPrice - selectedOrder.paymentPrice).toLocaleString('vi-VN')}đ
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} font-bold`}>
                                                    <td colSpan="5" className="px-5 py-3 text-right">
                                                        Tổng thanh toán:
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-green-600">
                                                        {selectedOrder?.paymentPrice?.toLocaleString('vi-VN')}đ
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${isDarkMode
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={isUpdating}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${isDarkMode
                                        ? 'bg-green-600 text-white hover:bg-green-500'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isUpdating ? (
                                    <>
                                        <FiLoader className="w-5 h-5 animate-spin" />
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck className="w-5 h-5" />
                                        Cập nhật
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderOrderDetailsModal = () => (
        <div className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 ${showOrderDetails ? '' : 'hidden'}`}>
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-11/12 max-w-4xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto`}>
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Chi tiết đơn hàng</h2>
                            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Mã đơn: #{selectedOrder?.orderID}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowOrderDetails(false)}
                            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                        >
                            <FiX size={24} />
                        </button>
                    </div>

                    {selectedOrder && (
                        <>
                            {/* Thông tin chung */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {/* Thông tin khách hàng */}
                                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <FiUser className="w-5 h-5" />
                                        Thông tin khách hàng
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Họ tên</p>
                                            <p className="font-medium">{selectedOrder.fullname}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                                            <p className="font-medium">{selectedOrder.email}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Số điện thoại</p>
                                            <p className="font-medium">{selectedOrder.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin đơn hàng */}
                                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <FiPackage className="w-5 h-5" />
                                        Thông tin đơn hàng
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ngày đặt</p>
                                            <p className="font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Trạng thái</p>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(selectedOrder.orderStatus)}`}>
                                                {getOrderStatusText(selectedOrder.orderStatus)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phương thức thanh toán</p>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(selectedOrder.orderStatus)}`}>
                                                {getStatusText(selectedOrder.orderStatus)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin giao hàng */}
                                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <FiShoppingBag className="w-5 h-5" />
                                        Thông tin giao hàng
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Địa chỉ</p>
                                            <p className="font-medium">{selectedOrder.address}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Trạng thái</p>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getShippingStatusColor(selectedOrder.shippingStatus)}`}>
                                                {getShippingStatusText(selectedOrder.shippingStatus)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thanh toán</p>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedOrder.isPayed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {selectedOrder.isPayed ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chi tiết sản phẩm */}
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FiShoppingBag className="w-5 h-5" />
                                    Chi tiết sản phẩm
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Sản phẩm</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Màu sắc</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Kích thước</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Số lượng</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Đơn giá</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                            {orderDetails?.map((detail, index) => {
                                                // Parse giá từ string sang number
                                                const parsePrice = (price) => {
                                                    if (!price) return 0;
                                                    if (typeof price === 'number') return price;
                                                    return Number(price.toString().replace(/\./g, ''));
                                                };
                                                
                                                const hasPromotion = detail.product?.promotion;
                                                const originalPrice = parsePrice(detail.product?.originalPrice || detail.product?.price);
                                                const finalPrice = hasPromotion ? parsePrice(detail.product.promotion.discountedPrice) : originalPrice;
                                                const subtotal = finalPrice * detail.quantity;
                                                
                                                return (
                                                    <tr key={detail.orderDetailID} className={index % 2 === 0 ? 'bg-transparent' : isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50/50'}>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative group">
                                                                    {detail.product?.color?.image && (
                                                                        <>
                                                                            <img
                                                                                src={detail.product.color.image}
                                                                                alt={detail.product.name}
                                                                                className="h-16 w-16 object-cover rounded-lg shadow-sm transform transition-transform duration-200 group-hover:scale-110"
                                                                            />
                                                                            <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium hover:text-green-500 transition-colors duration-200">
                                                                        {detail.product?.name}
                                                                    </div>
                                                                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                        SKU: {detail.SKU}
                                                                    </div>
                                                                    {hasPromotion && (
                                                                        <div className="mt-1 flex items-center gap-2">
                                                                            <span className="inline-block px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded">
                                                                                -{detail.product.promotion.discountPercent}%
                                                                            </span>
                                                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                                                {detail.product.promotion.name}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 whitespace-nowrap">
                                                                {detail.product.color?.colorName || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 whitespace-nowrap">
                                                                {detail.size}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                                                                {detail.quantity}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {hasPromotion && (
                                                                <div className="text-xs text-gray-400 line-through mb-1">
                                                                    {originalPrice?.toLocaleString('vi-VN')}đ
                                                                </div>
                                                            )}
                                                            <div className={`font-medium ${hasPromotion ? 'text-red-600' : ''}`}>
                                                                {finalPrice?.toLocaleString('vi-VN')}đ
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {hasPromotion && (
                                                                <div className="text-xs text-gray-400 line-through mb-1">
                                                                    {(originalPrice * detail.quantity)?.toLocaleString('vi-VN')}đ
                                                                </div>
                                                            )}
                                                            <div className={`font-semibold ${hasPromotion ? 'text-red-600' : ''}`}>
                                                                {subtotal?.toLocaleString('vi-VN')}đ
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                                <td colSpan="5" className="px-4 py-3 text-right font-medium text-gray-500">
                                                    Tổng tiền hàng:
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {selectedOrder?.totalPrice?.toLocaleString('vi-VN')}đ
                                                </td>
                                            </tr>
                                            {selectedOrder?.coupon && (selectedOrder.totalPrice - selectedOrder.paymentPrice) > 0 && (
                                                <tr className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                                    <td colSpan="5" className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="text-right">
                                                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Áp dụng mã giảm giá:</div>
                                                                <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                                                    {selectedOrder.coupon.code}
                                                                    {selectedOrder.coupon.discountType === 'percentage' 
                                                                        ? ` (Giảm ${selectedOrder.coupon.discountValue}%)`
                                                                        : ` (Giảm ${selectedOrder.coupon.discountValue?.toLocaleString('vi-VN')}đ)`
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-red-500">
                                                        -{(selectedOrder.totalPrice - selectedOrder.paymentPrice).toLocaleString('vi-VN')}đ
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} font-bold`}>
                                                <td colSpan="5" className="px-4 py-3 text-right">
                                                    Tổng thanh toán:
                                                </td>
                                                <td className="px-4 py-3 text-right text-green-600">
                                                    {selectedOrder?.paymentPrice?.toLocaleString('vi-VN')}đ
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} py-8`}>
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-5xl font-bold mb-2">Quản lý đơn hàng</h1>
                        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Quản lý và theo dõi tất cả đơn hàng của bạn
                        </p>
                    </div>
                    <button
                        onClick={() => setIsDateInvoiceModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                        <FiFileText className="text-xl" />
                        Xuất hóa đơn theo ngày
                    </button>
                </div>

                {/* Thống kê */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Tổng đơn hàng */}
                    <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Tổng đơn hàng
                                </p>
                                <p className="text-3xl font-bold mt-1">{orders.length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-100/80">
                                <FiShoppingBag className="text-2xl text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    {/* Đơn hàng mới */}
                    <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Đơn hàng mới
                                </p>
                                <p className="text-3xl font-bold mt-1">{orders.filter(order => order.orderStatus === 'pending').length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-yellow-100/80">
                                <FiClock className="text-2xl text-yellow-600" />
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full"
                                style={{ width: `${(orders.filter(order => order.orderStatus === 'pending').length / orders.length) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* Đơn hàng đang xử lý */}
                    <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Đang xử lý
                                </p>
                                <p className="text-3xl font-bold mt-1">{orders.filter(order => order.orderStatus === 'processing').length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-indigo-100/80">
                                <FiLoader className="text-2xl text-indigo-600" />
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${(orders.filter(order => order.orderStatus === 'processing').length / orders.length) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* Doanh thu */}
                    <div className={`p-6 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Doanh thu
                                </p>
                                <p className="text-3xl font-bold mt-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orders.reduce((total, order) => total + order.paymentPrice, 0))}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-100/80">
                                <FiDollarSign className="text-2xl text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
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
                                    placeholder="Nhập mã đơn hàng, tên hoặc email khách hàng..."
                                    className={`w-full pl-12 pr-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${isDarkMode
                                            ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <FiSearch className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={24} />
                            </div>
                        </div>

                        {/* Lọc theo trạng thái đơn hàng */}
                        <select
                            className={`min-w-[210px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                            value={filters.orderStatus}
                            onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
                        >
                            <option value="all">🔄 Trạng thái đơn hàng</option>
                            <option value="pending">⏳ Chờ xác nhận</option>
                            <option value="confirmed">✅ Đã xác nhận</option>
                            <option value="processing">🔄 Đang xử lý</option>
                            <option value="completed">🎉 Hoàn thành</option>
                            <option value="cancelled">❌ Đã hủy</option>
                            <option value="refunded">💸 Đã hoàn tiền</option>
                        </select>

                        {/* Lọc theo trạng thái vận chuyển */}
                        <select
                            className={`min-w-[210px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                            value={filters.shippingStatus}
                            onChange={(e) => handleFilterChange('shippingStatus', e.target.value)}
                        >
                            <option value="all">🚚 Trạng thái vận chuyển</option>
                            <option value="preparing">📦 Đang chuẩn bị</option>
                            <option value="shipping">🚚 Đang giao hàng</option>
                            <option value="delivered">✅ Đã giao hàng</option>
                            <option value="returned">↩️ Đã hoàn trả</option>
                            <option value="cancelled">❌ Đã hủy vận chuyển</option>
                        </select>

                        {/* Lọc theo trạng thái thanh toán */}
                        <select
                            className={`min-w-[180px] border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-opacity-90 cursor-pointer ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                            value={filters.paymentStatus}
                            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                        >
                            <option value="all">💳 Tất cả thanh toán</option>
                            <option value="paid">✅ Đã thanh toán</option>
                            <option value="unpaid">⏳ Chưa thanh toán</option>
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
                            <option value="createdAt">📅 Ngày đặt hàng</option>
                            <option value="paymentPrice">💰 Tổng tiền</option>
                            <option value="orderStatus">📊 Trạng thái đơn hàng</option>
                            <option value="shippingStatus">🚚 Trạng thái vận chuyển</option>
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

                {/* Bảng đơn hàng */}
                <div className={`overflow-hidden rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`text-left ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '120px' }}>
                                        Mã đơn hàng
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '180px' }}>
                                        Khách hàng
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '130px' }}>
                                        Tổng tiền
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '150px' }}>
                                        Trạng thái đơn
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '170px' }}>
                                        Trạng thái vận chuyển
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '160px' }}>
                                        Thanh toán
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '120px' }}>
                                        Ngày đặt
                                    </th>
                                    <th className={`px-6 py-4 text-base font-medium text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} style={{ minWidth: '140px' }}>
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
                                ) : currentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8">
                                            <div className="flex flex-col items-center justify-center">
                                                <FiShoppingBag className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Không có đơn hàng nào
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentOrders.map((order) => (
                                        <tr
                                            key={order.orderID}
                                            className={`group transition-colors hover:${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                                        >
                                            <td className="px-6 py-4" style={{ minWidth: '120px' }}>
                                                <div className="flex items-center gap-2">
                                                    <FiShoppingBag className="w-5 h-5 text-green-500" />
                                                    <span className={`text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                        #{order.orderID}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4" style={{ minWidth: '180px' }}>
                                                <div className="flex items-center gap-2">
                                                    <FiUser className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                    <span className={`text-base whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        {order.fullname}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4" style={{ minWidth: '130px' }}>
                                                <span className="text-base font-semibold text-green-600 whitespace-nowrap">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.paymentPrice)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" style={{ minWidth: '150px' }}>
                                                <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${getOrderStatusColor(order.orderStatus)}`}>
                                                    {getOrderStatusText(order.orderStatus)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" style={{ minWidth: '170px' }}>
                                                <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${getShippingStatusColor(order.shippingStatus)}`}>
                                                    {getShippingStatusText(order.shippingStatus)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" style={{ minWidth: '160px' }}>
                                                <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${
                                                    order.isPayed 
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                                }`}>
                                                    {order.isPayed ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" style={{ minWidth: '120px' }}>
                                                <span className={`text-base whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    {formatDate(order.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button
                                                        onClick={() => handleViewDetails(order)}
                                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                            ? 'bg-blue-400/10 hover:bg-blue-400/20 text-blue-400'
                                                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                                        }`}
                                                        title="Xem chi tiết"
                                                    >
                                                        <FiEye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditClick(order)}
                                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                            ? 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400'
                                                            : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-600'
                                                        }`}
                                                        title="Cập nhật trạng thái"
                                                    >
                                                        <FiEdit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExportSalesInvoice(order)}
                                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                            ? 'bg-green-400/10 hover:bg-green-400/20 text-green-400'
                                                            : 'bg-green-100 hover:bg-green-200 text-green-600'
                                                        }`}
                                                        title="Xuất hóa đơn"
                                                    >
                                                        <FiFileText className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExportOrderConfirmation(order)}
                                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                            ? 'bg-purple-400/10 hover:bg-purple-400/20 text-purple-400'
                                                            : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                                                        }`}
                                                        title="Xuất xác nhận đơn"
                                                    >
                                                        <FiDownload className="w-5 h-5" />
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

            {/* Modal xác nhận xóa */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl max-w-md w-full p-6 transform transition-all duration-200 scale-100`}>
                        <div className="text-center">
                            <FiAlertCircle className="mx-auto text-red-500 w-14 h-14 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Xác nhận xóa đơn hàng</h3>
                            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Bạn có chắc chắn muốn xóa đơn hàng #{orderToDelete.orderID} không?
                                Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className={`px-4 py-2 rounded-lg ${isDarkMode
                                        ? 'bg-gray-700 hover:bg-gray-600'
                                        : 'bg-gray-200 hover:bg-gray-300'
                                        } transition-colors duration-200`}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                >
                                    Xác nhận xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {renderEditModal()}
            {renderOrderDetailsModal()}

            {/* ===== MODAL XUẤT HÓA ĐƠN THEO NGÀY ===== */}
            {isDateInvoiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        {/* Header */}
                        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-green-500/20">
                                    <FiFileText className="text-2xl text-green-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Xuất hóa đơn theo ngày</h2>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Chọn ngày để xuất hóa đơn tất cả đơn hàng
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDateInvoiceModalOpen(false)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Chọn ngày */}
                            <div>
                                <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Chọn ngày xuất hóa đơn *
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className={`w-full p-4 rounded-lg border-2 text-lg transition-all ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500' 
                                            : 'bg-white border-gray-300 focus:border-green-500'
                                    } focus:ring-2 focus:ring-green-500/20 focus:outline-none`}
                                />
                            </div>

                            {/* Thông tin đơn hàng trong ngày */}
                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <FiShoppingBag className="text-green-500" />
                                    <span className="font-semibold">Thông tin</span>
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Số đơn hàng trong ngày:{' '}
                                    <span className="font-bold text-green-500">
                                        {orders.filter(order => {
                                            const orderDate = new Date(order.createdAt);
                                            const selected = new Date(selectedDate);
                                            return orderDate.toDateString() === selected.toDateString();
                                        }).length}
                                    </span>
                                </p>
                            </div>

                            {/* Lưu ý */}
                            <div className={`p-4 rounded-xl border-2 ${isDarkMode ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
                                <div className="flex gap-3">
                                    <FiAlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                        <p className="font-semibold mb-1">Lưu ý:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Hóa đơn bao gồm tất cả đơn hàng trong ngày</li>
                                            <li>Chi tiết từng đơn hàng và khách hàng</li>
                                            <li>File PDF sẽ tự động download</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <button
                                onClick={() => setIsDateInvoiceModalOpen(false)}
                                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                    isDarkMode 
                                        ? 'bg-gray-700 hover:bg-gray-600' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleExportDailyInvoice}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <FiDownload />
                                Xuất hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
