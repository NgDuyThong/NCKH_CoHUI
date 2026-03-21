import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiFileText, FiSearch, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from '../../utils/axios';
import { useTheme } from '../../contexts/AdminThemeContext';
import { generateWarehouseReceiptPDF } from '../../utils/pdfGenerator';

const WarehouseReceipt = () => {
    const { isDarkMode } = useTheme();

    // ===== STATES =====
    // (A) Thông tin chứng từ
    const [receiptInfo, setReceiptInfo] = useState({
        receiptNumber: '',
        receiptDate: new Date().toISOString().split('T')[0],
        supplierName: '',
        referenceDocument: {
            number: '',
            date: '',
            issuedBy: ''
        },
        warehouse: {
            name: '',
            location: ''
        },
        department: '',
        unit: '',
        accounting: {
            debit: '',
            credit: ''
        },
        totalAmountInWords: '',
        attachedDocuments: ''
    });

    // (B) Bảng danh sách hàng hóa để chọn
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        productID: null,
        productCode: '',
        productName: '',
        colorName: '',
        size: '',
        unit: 'Cái',
        documentQuantity: 0,
        actualQuantity: 0,
        unitPrice: 0
    });
    
    // Danh sách màu và size của sản phẩm được chọn
    const [availableColors, setAvailableColors] = useState([]);
    const [availableSizes, setAvailableSizes] = useState([]);
    const [selectedColorID, setSelectedColorID] = useState(null);
    const [isAddingNewSize, setIsAddingNewSize] = useState(false);
    const [newSizeInput, setNewSizeInput] = useState('');
    const [searchProduct, setSearchProduct] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(false);

    // (C) Bảng hàng hóa đã thêm
    const [addedItems, setAddedItems] = useState([]);
    const [editingItemIndex, setEditingItemIndex] = useState(null);

    const [loading, setLoading] = useState(false);

    // ===== EFFECTS =====
    useEffect(() => {
        // Tự động sinh số phiếu nếu chưa có
        if (!receiptInfo.receiptNumber) {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setReceiptInfo(prev => ({
                ...prev,
                receiptNumber: `NK${year}${month}${day}${random}`
            }));
        }
        
        // Kiểm tra adminToken trước khi load products
        const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (adminToken) {
            loadProducts();
        }
    }, []);

    useEffect(() => {
        // Auto-calculate totals khi items thay đổi
    }, [addedItems]);

    // Reload products khi searchProduct thay đổi
    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (adminToken) {
            // Debounce search để tránh gọi API quá nhiều
            const timeoutId = setTimeout(() => {
                loadProducts();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [searchProduct]);

    // ===== FUNCTIONS =====
    const loadProducts = async () => {
        try {
            setLoadingProducts(true);
            // Không truyền limit để lấy tất cả sản phẩm (hoặc có thể truyền limit lớn nếu có nhiều sản phẩm)
            const response = await axios.get('/api/receipts/products', {
                params: { search: searchProduct } // Bỏ limit để lấy tất cả sản phẩm
            });
            if (response.data.success) {
                setProducts(response.data.data);
                console.log(`Đã tải ${response.data.data.length} sản phẩm`);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // Không hiển thị error nếu là 401 - axios interceptor sẽ xử lý
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Không thể tải danh sách sản phẩm');
            }
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleSelectProduct = async (product) => {
        setSelectedProduct(product);
        
        // Reset states
        setAvailableColors([]);
        setAvailableSizes([]);
        setSelectedColorID(null);
        setIsAddingNewSize(false);
        setNewSizeInput('');
        
        // Load màu sắc của sản phẩm
        try {
            console.log(`[CLIENT] Loading colors for productID: ${product.productID}`);
            const response = await axios.get(`/api/admin/product-colors/product/${product.productID}`);
            console.log('[CLIENT] Colors response:', response.data);
            
            if (response.data.success && response.data.data) {
                setAvailableColors(response.data.data);
                if (response.data.data.length === 0) {
                    toast.warning('Sản phẩm này chưa có màu sắc nào. Vui lòng thêm màu trước khi nhập kho.');
                }
            } else {
                setAvailableColors([]);
                toast.warning('Không tìm thấy màu sắc cho sản phẩm này');
            }
        } catch (error) {
            console.error('[CLIENT] Error loading colors:', error);
            console.error('[CLIENT] Error response:', error.response?.data);
            setAvailableColors([]);
            
            if (error.response?.status === 404) {
                toast.error('Sản phẩm không tồn tại');
            } else if (error.response?.status === 500) {
                toast.error('Lỗi server khi tải màu sắc. Vui lòng kiểm tra console.');
            } else {
                toast.error('Không thể tải danh sách màu sắc');
            }
        }
        
        // Tính giá nhập kho = 90% giá bán (giảm 10% để tính lợi nhuận)
        const sellingPrice = product.price || 0;
        const importPrice = Math.round(sellingPrice * 0.9); // Giảm 10%
        
        console.log(`[CLIENT] Giá bán: ${sellingPrice.toLocaleString('vi-VN')} VNĐ`);
        console.log(`[CLIENT] Giá nhập: ${importPrice.toLocaleString('vi-VN')} VNĐ (90%)`);
        console.log(`[CLIENT] Lợi nhuận dự kiến: ${(sellingPrice - importPrice).toLocaleString('vi-VN')} VNĐ (10%)`);
        
        setProductForm({
            productID: product.productID,
            productCode: product.productCode,
            productName: product.name,
            colorName: '',
            size: '',
            unit: 'Cái',
            documentQuantity: 0,
            actualQuantity: 0,
            unitPrice: importPrice
        });
    };

    const handleSelectColor = async (colorName) => {
        // Tìm colorID từ colorName
        const selectedColor = availableColors.find(c => c.colorName === colorName);
        if (!selectedColor) {
            setAvailableSizes([]);
            setSelectedColorID(null);
            setIsAddingNewSize(false);
            setNewSizeInput('');
            return;
        }

        setSelectedColorID(selectedColor.colorID);
        setProductForm({ ...productForm, colorName, size: '' });
        setIsAddingNewSize(false);
        setNewSizeInput('');

        // Load danh sách size của màu này
        try {
            console.log(`[CLIENT] Loading sizes for colorID: ${selectedColor.colorID}`);
            const response = await axios.get(`/api/admin/product-size-stock/sizes/${selectedColor.colorID}`);
            console.log('[CLIENT] Sizes response:', response.data);
            
            if (response.data.success && response.data.data) {
                setAvailableSizes(response.data.data);
                if (response.data.data.length === 0) {
                    console.log('[CLIENT] Màu này chưa có size, tự động chọn "Nhập size mới"');
                    // Tự động chọn "Nhập size mới" nếu chưa có size nào
                    setIsAddingNewSize(true);
                    setNewSizeInput('');
                }
            } else {
                setAvailableSizes([]);
                setIsAddingNewSize(true);
                setNewSizeInput('');
            }
        } catch (error) {
            console.error('[CLIENT] Error loading sizes:', error);
            console.error('[CLIENT] Error response:', error.response?.data);
            // Nếu chưa có size nào hoặc lỗi, tự động chọn "Nhập size mới"
            setAvailableSizes([]);
            setIsAddingNewSize(true);
            setNewSizeInput('');
        }
    };

    const handleAddProduct = () => {
        if (!productForm.productID) {
            toast.error('Vui lòng chọn sản phẩm');
            return;
        }
        if (!productForm.colorName) {
            toast.error('Vui lòng chọn màu sắc');
            return;
        }
        if (!productForm.size || productForm.size.trim() === '') {
            toast.error('Vui lòng nhập size');
            return;
        }
        if (productForm.actualQuantity <= 0) {
            toast.error('Vui lòng nhập số lượng thực nhập');
            return;
        }
        if (productForm.unitPrice <= 0) {
            toast.error('Vui lòng nhập đơn giá');
            return;
        }

        const newItem = {
            ...productForm,
            totalAmount: productForm.actualQuantity * productForm.unitPrice
        };

        setAddedItems([...addedItems, newItem]);
        
        // Reset form
        setProductForm({
            productID: null,
            productCode: '',
            productName: '',
            colorName: '',
            size: '',
            unit: 'Cái',
            documentQuantity: 0,
            actualQuantity: 0,
            unitPrice: 0
        });
        setSelectedProduct(null);
        setAvailableColors([]);
        setAvailableSizes([]);
        setSelectedColorID(null);
        setIsAddingNewSize(false);
        setNewSizeInput('');
        toast.success('Đã thêm hàng hóa vào phiếu');
    };

    const handleDeleteItem = (index) => {
        const newItems = addedItems.filter((_, i) => i !== index);
        setAddedItems(newItems);
        toast.success('Đã xóa hàng hóa');
    };

    const handleEditItem = (index, field, value) => {
        const newItems = [...addedItems];
        newItems[index][field] = value;
        
        // Auto-calculate totalAmount
        if (field === 'actualQuantity' || field === 'unitPrice') {
            newItems[index].totalAmount = newItems[index].actualQuantity * newItems[index].unitPrice;
        }
        
        setAddedItems(newItems);
    };

    const calculateTotals = () => {
        const totalQuantity = addedItems.reduce((sum, item) => sum + (item.actualQuantity || 0), 0);
        const totalAmount = addedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        return { totalQuantity, totalAmount };
    };

    const convertNumberToWords = (num) => {
        // Hàm chuyển số sang chữ (cải tiến)
        if (!num || num === 0) return 'Không đồng';
        
        // Đơn giản hóa: format số và thêm "đồng"
        // Trong thực tế có thể sử dụng thư viện chuyên dụng để chuyển số sang chữ tiếng Việt
        // Tạm thời chỉ format số để người dùng có thể tự chỉnh sửa
        const formattedNum = num.toLocaleString('vi-VN');
        return `${formattedNum} đồng`;
    };

    const handleSaveReceipt = async () => {
        if (!receiptInfo.receiptNumber || !receiptInfo.supplierName || !receiptInfo.warehouse.name) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        if (addedItems.length === 0) {
            toast.error('Vui lòng thêm ít nhất một mặt hàng');
            return;
        }

        try {
            setLoading(true);
            const { totalAmount } = calculateTotals();
            
            const receiptData = {
                ...receiptInfo,
                totalAmountInWords: receiptInfo.totalAmountInWords || convertNumberToWords(totalAmount),
                items: addedItems.map(item => ({
                    ...item,
                    totalAmount: item.actualQuantity * item.unitPrice
                }))
            };

            const response = await axios.post('/api/receipts', receiptData);
            
            if (response.data.success) {
                toast.success('Lưu phiếu nhập kho thành công');
                // Reset form
                handleResetForm();
            } else {
                toast.error(response.data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error saving receipt:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu phiếu');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (addedItems.length === 0) {
            toast.error('Vui lòng thêm ít nhất một mặt hàng');
            return;
        }

        try {
            const { totalAmount } = calculateTotals();
            const receiptDate = new Date(receiptInfo.receiptDate);
            
            const pdfData = {
                receiptNumber: receiptInfo.receiptNumber,
                receiptDate: {
                    day: receiptDate.getDate(),
                    month: receiptDate.getMonth() + 1,
                    year: receiptDate.getFullYear()
                },
                supplierName: receiptInfo.supplierName,
                referenceDocument: {
                    number: receiptInfo.referenceDocument.number,
                    day: receiptInfo.referenceDocument.date ? new Date(receiptInfo.referenceDocument.date).getDate() : null,
                    month: receiptInfo.referenceDocument.date ? new Date(receiptInfo.referenceDocument.date).getMonth() + 1 : null,
                    year: receiptInfo.referenceDocument.date ? new Date(receiptInfo.referenceDocument.date).getFullYear() : null,
                    issuedBy: receiptInfo.referenceDocument.issuedBy
                },
                warehouse: receiptInfo.warehouse,
                department: receiptInfo.department,
                unit: receiptInfo.unit,
                accounting: receiptInfo.accounting,
                items: addedItems.map(item => ({
                    ...item,
                    totalAmount: item.actualQuantity * item.unitPrice
                })),
                totalAmount: totalAmount,
                totalAmountInWords: receiptInfo.totalAmountInWords || convertNumberToWords(totalAmount),
                attachedDocuments: receiptInfo.attachedDocuments
            };

            generateWarehouseReceiptPDF(pdfData);
            toast.success('Xuất PDF thành công');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error('Có lỗi xảy ra khi xuất PDF');
        }
    };

    const handleResetForm = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        setReceiptInfo({
            receiptNumber: `NK${year}${month}${day}${random}`,
            receiptDate: new Date().toISOString().split('T')[0],
            supplierName: '',
            referenceDocument: {
                number: '',
                date: '',
                issuedBy: ''
            },
            warehouse: {
                name: '',
                location: ''
            },
            department: '',
            unit: '',
            accounting: {
                debit: '',
                credit: ''
            },
            totalAmountInWords: '',
            attachedDocuments: ''
        });
        setAddedItems([]);
        setSelectedProduct(null);
    };

    const { totalQuantity, totalAmount } = calculateTotals();

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} py-8`}>
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Phiếu Nhập Kho</h1>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tạo và quản lý phiếu nhập kho
                    </p>
                </div>

                {/* (A) Thông tin chứng từ */}
                <div className={`rounded-lg shadow-md p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className="text-xl font-bold mb-4">(A) Thông tin chứng từ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Số phiếu *</label>
                            <input
                                type="text"
                                value={receiptInfo.receiptNumber}
                                onChange={(e) => setReceiptInfo({ ...receiptInfo, receiptNumber: e.target.value })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày nhập *</label>
                            <input
                                type="date"
                                value={receiptInfo.receiptDate}
                                onChange={(e) => setReceiptInfo({ ...receiptInfo, receiptDate: e.target.value })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Họ tên người giao *</label>
                            <input
                                type="text"
                                value={receiptInfo.supplierName}
                                onChange={(e) => setReceiptInfo({ ...receiptInfo, supplierName: e.target.value })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Đơn vị</label>
                            <input
                                type="text"
                                value={receiptInfo.unit}
                                onChange={(e) => setReceiptInfo({ ...receiptInfo, unit: e.target.value })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bộ phận</label>
                            <input
                                type="text"
                                value={receiptInfo.department}
                                onChange={(e) => setReceiptInfo({ ...receiptInfo, department: e.target.value })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nhập tại kho *</label>
                            <input
                                type="text"
                                value={receiptInfo.warehouse.name}
                                onChange={(e) => setReceiptInfo({ 
                                    ...receiptInfo, 
                                    warehouse: { ...receiptInfo.warehouse, name: e.target.value }
                                })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Địa điểm</label>
                            <input
                                type="text"
                                value={receiptInfo.warehouse.location}
                                onChange={(e) => setReceiptInfo({ 
                                    ...receiptInfo, 
                                    warehouse: { ...receiptInfo.warehouse, location: e.target.value }
                                })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Theo chứng từ số</label>
                            <input
                                type="text"
                                value={receiptInfo.referenceDocument.number}
                                onChange={(e) => setReceiptInfo({ 
                                    ...receiptInfo, 
                                    referenceDocument: { ...receiptInfo.referenceDocument, number: e.target.value }
                                })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày chứng từ</label>
                            <input
                                type="date"
                                value={receiptInfo.referenceDocument.date}
                                onChange={(e) => setReceiptInfo({ 
                                    ...receiptInfo, 
                                    referenceDocument: { ...receiptInfo.referenceDocument, date: e.target.value }
                                })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Của</label>
                            <input
                                type="text"
                                value={receiptInfo.referenceDocument.issuedBy}
                                onChange={(e) => setReceiptInfo({ 
                                    ...receiptInfo, 
                                    referenceDocument: { ...receiptInfo.referenceDocument, issuedBy: e.target.value }
                                })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nợ</label>
                            <input
                                type="text"
                                value={receiptInfo.accounting.debit}
                                onChange={(e) => setReceiptInfo({ 
                                    ...receiptInfo, 
                                    accounting: { ...receiptInfo.accounting, debit: e.target.value }
                                })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Có</label>
                            <input
                                type="text"
                                value={receiptInfo.accounting.credit}
                                onChange={(e) => setReceiptInfo({ 
                                    ...receiptInfo, 
                                    accounting: { ...receiptInfo.accounting, credit: e.target.value }
                                })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Tổng số tiền (viết bằng chữ)</label>
                            <input
                                type="text"
                                value={receiptInfo.totalAmountInWords}
                                onChange={(e) => setReceiptInfo({ ...receiptInfo, totalAmountInWords: e.target.value })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Số chứng từ gốc kèm theo</label>
                            <input
                                type="text"
                                value={receiptInfo.attachedDocuments}
                                onChange={(e) => setReceiptInfo({ ...receiptInfo, attachedDocuments: e.target.value })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* (B) Bảng danh sách hàng hóa để chọn */}
                <div className={`rounded-lg shadow-md p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">(B) Danh sách hàng hóa</h2>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Tổng: {products.length} sản phẩm
                        </span>
                    </div>
                    
                    {/* Search */}
                    <div className="mb-4 flex gap-2">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && loadProducts()}
                                className={`w-full pl-10 pr-4 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <button
                            onClick={loadProducts}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Tìm kiếm
                        </button>
                    </div>

                    {/* Product selection form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                        <div>
                            <label className="block text-sm font-medium mb-1">Chọn sản phẩm</label>
                            <select
                                value={selectedProduct?.productID || ''}
                                onChange={(e) => {
                                    const product = products.find(p => p.productID === Number(e.target.value));
                                    if (product) handleSelectProduct(product);
                                }}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            >
                                <option value="">-- Chọn sản phẩm --</option>
                                {products.map(product => (
                                    <option key={product.productID} value={product.productID}>
                                        {product.productCode} - {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mã số (tự động)</label>
                            <input
                                type="text"
                                value={productForm.productCode}
                                readOnly
                                title="Mã sản phẩm được tạo tự động theo định dạng: SP + productID (4 chữ số)"
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-600 border-gray-600' : 'bg-gray-100 border-gray-300'}`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Format: SP + {productForm.productID ? productForm.productID.toString().padStart(4, '0') : 'XXXX'}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Tên hàng hóa</label>
                            <input
                                type="text"
                                value={productForm.productName}
                                onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Màu sắc *</label>
                            <select
                                value={productForm.colorName}
                                onChange={(e) => handleSelectColor(e.target.value)}
                                disabled={!selectedProduct || availableColors.length === 0}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                required
                            >
                                <option value="">-- Chọn màu sắc --</option>
                                {availableColors.map(color => (
                                    <option key={color.colorID} value={color.colorName}>
                                        {color.colorName}
                                    </option>
                                ))}
                            </select>
                            {selectedProduct && availableColors.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Sản phẩm này chưa có màu sắc nào. Vui lòng thêm màu trước.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Kích thước (Size) * 
                                {availableSizes.length > 0 && (
                                    <span className="text-xs text-gray-500 ml-2">
                                        (Có {availableSizes.length} size trong kho)
                                    </span>
                                )}
                            </label>
                            
                            {/* Luôn hiển thị dropdown với option "Nhập size mới" */}
                            <select
                                value={isAddingNewSize ? '__NEW__' : productForm.size}
                                onChange={(e) => {
                                    if (e.target.value === '__NEW__') {
                                        setIsAddingNewSize(true);
                                        setNewSizeInput('');
                                        setProductForm({ ...productForm, size: '' });
                                    } else {
                                        setIsAddingNewSize(false);
                                        setNewSizeInput('');
                                        setProductForm({ ...productForm, size: e.target.value });
                                    }
                                }}
                                disabled={!productForm.colorName}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                required
                            >
                                <option value="">-- Chọn size --</option>
                                {availableSizes.map(sizeItem => (
                                    <option key={sizeItem.size} value={sizeItem.size}>
                                        {sizeItem.size} (Tồn kho: {sizeItem.currentStock})
                                    </option>
                                ))}
                                <option value="__NEW__">➕ Nhập size mới...</option>
                            </select>
                            
                            {/* Hiển thị input khi chọn "Nhập size mới" */}
                            {isAddingNewSize && (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        value={newSizeInput}
                                        placeholder="Nhập size mới (VD: 28, 29, 30, M, L, XL...)"
                                        onChange={(e) => {
                                            const value = e.target.value.trim();
                                            setNewSizeInput(value);
                                            setProductForm({ ...productForm, size: value });
                                        }}
                                        disabled={!productForm.colorName}
                                        className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}
                            
                            {/* Thông báo hướng dẫn */}
                            {productForm.colorName && availableSizes.length === 0 && !isAddingNewSize && (
                                <p className="text-xs text-blue-500 mt-1">Màu này chưa có size nào. Chọn "Nhập size mới" để tạo.</p>
                            )}
                            {productForm.colorName && availableSizes.length > 0 && isAddingNewSize && (
                                <p className="text-xs text-blue-500 mt-1">Nhập size mới sẽ được thêm vào kho.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">ĐVT</label>
                            <input
                                type="text"
                                value="Cái"
                                readOnly
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-600 border-gray-600' : 'bg-gray-100 border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Số lượng theo chứng từ</label>
                            <input
                                type="number"
                                min="0"
                                value={productForm.documentQuantity}
                                onChange={(e) => setProductForm({ ...productForm, documentQuantity: Number(e.target.value) || 0 })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Số lượng thực nhập *</label>
                            <input
                                type="number"
                                min="0"
                                value={productForm.actualQuantity}
                                onChange={(e) => setProductForm({ ...productForm, actualQuantity: Number(e.target.value) || 0 })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Đơn giá nhập (VND) *
                                {selectedProduct && (
                                    <span className="text-xs text-gray-500 ml-2">
                                        (Giá bán: {selectedProduct.price.toLocaleString('vi-VN')} đ)
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={productForm.unitPrice}
                                onChange={(e) => setProductForm({ ...productForm, unitPrice: Number(e.target.value) || 0 })}
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                required
                            />
                            {selectedProduct && productForm.unitPrice > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                    Lợi nhuận dự kiến: {(selectedProduct.price - productForm.unitPrice).toLocaleString('vi-VN')} đ 
                                    ({Math.round(((selectedProduct.price - productForm.unitPrice) / selectedProduct.price) * 100)}%)
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Thành tiền</label>
                            <input
                                type="text"
                                value={(productForm.actualQuantity * productForm.unitPrice).toLocaleString('vi-VN') + ' đ'}
                                readOnly
                                className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-600 border-gray-600' : 'bg-gray-100 border-gray-300'}`}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                onClick={handleAddProduct}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                <FiPlus /> Thêm hàng hóa
                            </button>
                        </div>
                    </div>

                    {/* Products table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <th className="px-4 py-2 text-left">Mã hàng</th>
                                    <th className="px-4 py-2 text-left">Tên hàng</th>
                                    <th className="px-4 py-2 text-left">ĐVT</th>
                                    <th className="px-4 py-2 text-right">Giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingProducts ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-4 text-center">Đang tải...</td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-4 text-center">Không có sản phẩm nào</td>
                                    </tr>
                                ) : (
                                    products.map(product => (
                                        <tr
                                            key={product.productID}
                                            className={`border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                selectedProduct?.productID === product.productID ? 'bg-blue-100 dark:bg-blue-900' : ''
                                            }`}
                                            onClick={() => handleSelectProduct(product)}
                                        >
                                            <td className="px-4 py-2">{product.productCode}</td>
                                            <td className="px-4 py-2">{product.name}</td>
                                            <td className="px-4 py-2">{product.unit}</td>
                                            <td className="px-4 py-2 text-right">{product.price.toLocaleString('vi-VN')} đ</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* (C) Bảng hàng hóa đã thêm */}
                <div className={`rounded-lg shadow-md p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className="text-xl font-bold mb-4">(C) Danh sách hàng hóa đã nhập</h2>
                    
                    {addedItems.length === 0 ? (
                        <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Chưa có hàng hóa nào được thêm. Vui lòng chọn sản phẩm ở bảng trên và nhấn "Thêm hàng hóa".
                        </p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <th className="px-4 py-2 text-center">STT</th>
                                            <th className="px-4 py-2 text-left">Tên hàng hóa</th>
                                            <th className="px-4 py-2 text-center">Mã số</th>
                                            <th className="px-4 py-2 text-center">ĐVT</th>
                                            <th className="px-4 py-2 text-center">Số lượng<br/>theo chứng từ</th>
                                            <th className="px-4 py-2 text-center">Số lượng<br/>thực nhập</th>
                                            <th className="px-4 py-2 text-right">Đơn giá</th>
                                            <th className="px-4 py-2 text-right">Thành tiền</th>
                                            <th className="px-4 py-2 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addedItems.map((item, index) => (
                                            <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                <td className="px-4 py-2 text-center">{index + 1}</td>
                                                                <td className="px-4 py-2">
                                                    {item.productName}
                                                    {item.colorName && ` - Màu: ${item.colorName}`}
                                                    {item.size && ` - Size: ${item.size}`}
                                                </td>
                                                <td className="px-4 py-2 text-center">{item.productCode}</td>
                                                <td className="px-4 py-2 text-center">{item.unit}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.documentQuantity}
                                                        onChange={(e) => handleEditItem(index, 'documentQuantity', Number(e.target.value) || 0)}
                                                        className={`w-20 px-2 py-1 rounded border text-center ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.actualQuantity}
                                                        onChange={(e) => handleEditItem(index, 'actualQuantity', Number(e.target.value) || 0)}
                                                        className={`w-20 px-2 py-1 rounded border text-center ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleEditItem(index, 'unitPrice', Number(e.target.value) || 0)}
                                                        className={`w-32 px-2 py-1 rounded border text-right ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-semibold">
                                                    {item.totalAmount.toLocaleString('vi-VN')} đ
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => handleDeleteItem(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Dòng tổng cộng */}
                                        <tr className={`font-bold ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <td colSpan="4" className="px-4 py-2 text-center">CỘNG</td>
                                            <td className="px-4 py-2 text-center">-</td>
                                            <td className="px-4 py-2 text-center">{totalQuantity}</td>
                                            <td className="px-4 py-2 text-right">-</td>
                                            <td className="px-4 py-2 text-right">{totalAmount.toLocaleString('vi-VN')} đ</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={handleResetForm}
                        className="px-6 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <FiX className="inline mr-2" /> Làm mới
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={addedItems.length === 0}
                        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <FiFileText className="inline mr-2" /> Xuất PDF
                    </button>
                    <button
                        onClick={handleSaveReceipt}
                        disabled={loading || addedItems.length === 0}
                        className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang lưu...' : (
                            <>
                                <FiSave className="inline mr-2" /> Lưu phiếu nhập kho
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WarehouseReceipt;

