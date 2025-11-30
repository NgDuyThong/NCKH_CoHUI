/**
 * ===============================================
 * PDF GENERATOR UTILITIES - ICONDENIM
 * ===============================================
 * Tạo các loại PDF theo biểu mẫu chuẩn IconDenim
 * 
 * QUAN TRỌNG: Xử lý tiếng Việt trong PDF
 * - jsPDF mặc định KHÔNG hỗ trợ Unicode (Times, Helvetica, Courier)
 * - Giải pháp: Loại bỏ dấu tiếng Việt cho TẤT CẢ text trong PDF
 * - Chỉ giữ nguyên tiếng Việt trong data backend, khi xuất PDF thì bỏ dấu
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ===== HELPER FUNCTIONS =====

/**
 * Loại bỏ dấu tiếng Việt - BẮT BUỘC cho tất cả text trong PDF
 * jsPDF không hỗ trợ Unicode nên phải convert sang không dấu
 */
const removeVietnameseTones = (str) => {
    if (!str) return '';
    str = str.toString();
    
    // Chữ thường
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    
    // Chữ hoa
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
    str = str.replace(/Đ/g, 'D');
    
    return str;
};

/**
 * Format số tiền VND
 */
const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '0';
    return new Intl.NumberFormat('vi-VN').format(amount);
};

// ===== COMPANY INFO =====
const COMPANY_INFO = {
    name: 'ICONDENIM',
    formCode: 'Mau so 01 - VT'
};

// ===== COMMON PDF FUNCTIONS =====

/**
 * Vẽ header công ty chuẩn
 */
const drawCompanyHeader = (doc, pageWidth, options = {}) => {
    const { 
        showFormCode = false, 
        fontSize = 16,
        yPosition = 20 
    } = options;
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(COMPANY_INFO.name, pageWidth / 2, yPosition, { align: 'center' });
    
    if (showFormCode) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(removeVietnameseTones(COMPANY_INFO.formCode), pageWidth - 15, yPosition, { align: 'right' });
    }
};

/**
 * Vẽ tiêu đề phiếu - BỎ DẤU tiếng Việt
 */
const drawTitle = (doc, title, pageWidth, yPosition) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(removeVietnameseTones(title), pageWidth / 2, yPosition, { align: 'center' });
};

/**
 * Vẽ chữ ký footer - BỎ DẤU tiếng Việt
 */
const drawSignatures = (doc, signatures, pageWidth, yPosition) => {
    const signatureWidth = (pageWidth - 30) / signatures.length;
    
    signatures.forEach((sig, index) => {
        const xPos = 15 + (signatureWidth * index) + signatureWidth / 2;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(removeVietnameseTones(sig.title), xPos, yPosition, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        let subYPos = yPosition + 5;
        
        if (sig.subtitle) {
            doc.text(removeVietnameseTones(sig.subtitle), xPos, subYPos, { align: 'center' });
            subYPos += 4;
        }
        if (sig.subtitle2) {
            doc.text(removeVietnameseTones(sig.subtitle2), xPos, subYPos, { align: 'center' });
            subYPos += 4;
        }
        if (sig.subtitle3) {
            doc.text(removeVietnameseTones(sig.subtitle3), xPos, subYPos, { align: 'center' });
        }
    });
};

/**
 * Style mặc định cho bảng
 */
const getDefaultTableStyles = () => ({
    theme: 'grid',
    styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0]
    },
    headStyles: {
        fillColor: [240, 248, 255],
        textColor: [0, 51, 102],
        fontStyle: 'bold',
        fontSize: 9,
        lineWidth: 0.5,
        lineColor: [0, 51, 102],
        halign: 'center',
        valign: 'middle'
    },
    bodyStyles: {
        lineWidth: 0.3,
        lineColor: [100, 100, 100],
        textColor: [30, 30, 30],
        fontStyle: 'normal'
    }
});

// ===== PDF GENERATORS =====

/**
 * PHIẾU NHẬP KHO - Theo mẫu biểu chuẩn IconDenim
 */
export const generateWarehouseReceiptPDF = (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Sử dụng font helvetica - font mặc định của jsPDF
    doc.setFont('helvetica', 'normal');
    
    // ===== HEADER - BÊN TRÁI =====
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(COMPANY_INFO.name, 15, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Don vi:....................', 15, 28);
    doc.text('Bo phan:....................', 15, 34);
    
    // ===== HEADER - BÊN PHẢI =====
    doc.setFontSize(9);
    doc.text(removeVietnameseTones(COMPANY_INFO.formCode), pageWidth - 15, 18, { align: 'right' });
    
    // ===== TIÊU ĐỀ CHÍNH =====
    drawTitle(doc, 'PHIEU NHAP KHO', pageWidth, 48);
    
    let yPos = 58;
    
    // ===== THÔNG TIN PHIẾU =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Ngày tháng năm
    const dateStr = `Ngay ${data.receiptDate?.day || '.....'} thang ${data.receiptDate?.month || '.....'} nam ${data.receiptDate?.year || '.....'}`;
    doc.text(dateStr, 20, yPos);
    yPos += 6;
    
    // Số phiếu và Nợ/Có
    doc.text(`So: ${data.receiptNumber || '.................'}`, 20, yPos);
    doc.text(`No: ${data.accounting?.debit || '.........'}`, pageWidth - 50, yPos - 6, { align: 'right' });
    doc.text(`Co: ${data.accounting?.credit || '.........'}`, pageWidth - 50, yPos, { align: 'right' });
    yPos += 6;
    
    // Họ và tên người giao
    const supplierName = removeVietnameseTones(data.supplierName || '.................');
    doc.text(`- Ho va ten nguoi giao: ${supplierName}`, 20, yPos);
    yPos += 6;
    
    // Theo chứng từ
    const refDateStr = data.referenceDocument?.day 
        ? `ngay ${data.referenceDocument.day} thang ${data.referenceDocument.month} nam ${data.referenceDocument.year}`
        : 'ngay ..... thang ..... nam .....';
    doc.text(`- Theo ............ so ${data.referenceDocument?.number || '............'} ${refDateStr}`, 20, yPos);
    yPos += 6;
    const issuedBy = removeVietnameseTones(data.referenceDocument?.issuedBy || '.................');
    doc.text(`  cua ${issuedBy}`, 20, yPos);
    yPos += 6;
    
    // Nhập tại kho
    const warehouseName = removeVietnameseTones(data.warehouse?.name || '.................');
    const warehouseLocation = removeVietnameseTones(data.warehouse?.location || '.................');
    doc.text(`Nhap tai kho: ${warehouseName} dia diem: ${warehouseLocation}`, 20, yPos);
    yPos += 10;
    
    // ===== BẢNG HÀNG HÓA =====
    const tableData = data.items.map((item, index) => {
        // Tạo tên đầy đủ: tên - màu sắc - size (BỎ DẤU tiếng Việt)
        let fullName = removeVietnameseTones(item.productName || '');
        if (item.colorName) fullName += ' - Mau: ' + removeVietnameseTones(item.colorName);
        if (item.size) fullName += ' - Size: ' + item.size;
        
        return [
            index + 1,
            fullName,
            item.productCode || '',
            item.unit || 'Cai',
            item.documentQuantity || 0,
            item.actualQuantity || 0,
            formatCurrency(item.unitPrice || 0),
            formatCurrency(item.totalAmount || 0)
        ];
    });
    
    // Thêm dòng CỘNG
    const totalQuantity = data.items.reduce((sum, item) => sum + (item.actualQuantity || 0), 0);
    const totalAmount = data.totalAmount || data.items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    
    tableData.push([
        'x',
        'CONG',
        'x',
        'x',
        'x',
        totalQuantity,
        'x',
        formatCurrency(totalAmount)
    ]);
    
    const tableStyles = getDefaultTableStyles();
    autoTable(doc, {
        startY: yPos,
        head: [[
            'STT',
            'Ten, mau sac, kich thuoc san pham',
            'Ma so',
            'DVT',
            'Theo chung tu',
            'Thuc nhap',
            'Don gia',
            'Thanh tien'
        ]],
        body: tableData,
        ...tableStyles,
        headStyles: {
            ...tableStyles.headStyles,
            fontSize: 8,
            cellPadding: 3,
            minCellHeight: 12
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 60, halign: 'left', fontStyle: 'bold' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 13, halign: 'center' },
            4: { cellWidth: 16, halign: 'center' },
            5: { cellWidth: 16, halign: 'center' },
            6: { cellWidth: 25, halign: 'right' },
            7: { cellWidth: 26, halign: 'right' }
        },
        didParseCell: function(cellData) {
            // Dòng CỘNG - làm nổi bật
            if (cellData.row.index === tableData.length - 1) {
                cellData.cell.styles.fontStyle = 'bold';
                cellData.cell.styles.fillColor = [255, 250, 205];
                cellData.cell.styles.textColor = [0, 51, 102];
                cellData.cell.styles.fontSize = 10;
            }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // ===== THÔNG TIN THÊM =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const totalInWords = removeVietnameseTones(data.totalAmountInWords || '.................');
    doc.text(`- Tong so tien (viet bang chu): ${totalInWords}`, 20, yPos);
    yPos += 6;
    doc.text(`- So chung tu goc kem theo: ${data.attachedDocuments || '.................'}`, 20, yPos);
    yPos += 20;
    
    // ===== FOOTER - 4 CHỮ KÝ =====
    const signatures = [
        { title: 'Nguoi lap phieu', subtitle: '(Ky, ho ten)' },
        { title: 'Nguoi giao hang', subtitle: '(Ky, ho ten)' },
        { title: 'Thu kho', subtitle: '(Ky, ho ten)' },
        { 
            title: 'Ke toan truong', 
            subtitle: '(Hoac bo phan co', 
            subtitle2: 'nhu cau nhap)', 
            subtitle3: '(Ky, ho ten)' 
        }
    ];
    
    drawSignatures(doc, signatures, pageWidth, yPos);
    
    // Lưu file
    const fileName = `PhieuNhapKho_${data.receiptNumber || Date.now()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};


/**
 * HÓA ĐƠN BÁN HÀNG
 */
export const generateSalesInvoicePDF = (orderData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    drawCompanyHeader(doc, pageWidth);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Dia chi: ' + (removeVietnameseTones(orderData.shopAddress) || '...'), pageWidth / 2, 27, { align: 'center' });
    doc.text('DT: ' + (orderData.shopPhone || '...'), pageWidth / 2, 32, { align: 'center' });
    
    // Tiêu đề
    let yPos = 45;
    drawTitle(doc, 'HOA DON BAN HANG', pageWidth, yPos);
    yPos += 12;
    
    // Thông tin khách hàng
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Ten khach hang: ' + (removeVietnameseTones(orderData.customerName) || '...'), 15, yPos);
    yPos += 6;
    doc.text('Dia chi: ' + (removeVietnameseTones(orderData.customerAddress) || '...'), 15, yPos);
    yPos += 10;
    
    // Bảng sản phẩm
    const tableData = orderData.items.map((item, index) => {
        let productInfo = removeVietnameseTones(item.productName);
        if (item.color) productInfo += ' - ' + removeVietnameseTones(item.color);
        if (item.size) productInfo += ' (' + item.size + ')';
        
        return [
            index + 1,
            productInfo,
            'Cai',
            item.quantity,
            formatCurrency(item.price),
            formatCurrency(item.price * item.quantity)
        ];
    });
    
    // Tổng tiền
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalAmount = orderData.finalPrice || orderData.paymentPrice || subtotal;
    
    tableData.push(['', 'CONG', '', orderData.items.reduce((s, i) => s + i.quantity, 0), '', formatCurrency(subtotal)]);
    if (orderData.discount > 0) {
        tableData.push(['', 'Giam gia', '', '', '', '-' + formatCurrency(orderData.discount)]);
    }
    tableData.push(['', 'TONG CONG', '', '', '', formatCurrency(finalAmount)]);
    
    const tableStyles = getDefaultTableStyles();
    autoTable(doc, {
        startY: yPos,
        head: [['STT', 'Ten hang hoa', 'DVT', 'SL', 'Don gia', 'Thanh tien']],
        body: tableData,
        ...tableStyles,
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 35, halign: 'right' }
        },
        didParseCell: function(cellData) {
            const lastRows = orderData.discount > 0 ? 3 : 2;
            if (cellData.row.index >= tableData.length - lastRows) {
                cellData.cell.styles.fontStyle = 'bold';
                if (cellData.row.index === tableData.length - 1) {
                    cellData.cell.styles.fillColor = [255, 250, 205];
                    cellData.cell.styles.textColor = [0, 51, 102];
                    cellData.cell.styles.fontSize = 10;
                }
            }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Chữ ký
    const today = new Date();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ngay ${today.getDate()} thang ${today.getMonth() + 1} nam ${today.getFullYear()}`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 10;
    
    const signatures = [
        { title: 'KHACH HANG' },
        { title: 'NGUOI BAN HANG' }
    ];
    drawSignatures(doc, signatures, pageWidth, yPos);
    
    // Lưu file
    const fileName = `HoaDon_${orderData.orderID || Date.now()}.pdf`;
    doc.save(fileName);
    return fileName;
};


/**
 * HÓA ĐƠN BÁN HÀNG THEO NGÀY
 */
export const generateDailyInvoicePDF = (dailyData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header
    drawCompanyHeader(doc, pageWidth);
    
    let yPos = 35;
    drawTitle(doc, 'HOA DON BAN HANG', pageWidth, yPos);
    yPos += 8;
    
    const invoiceDate = new Date(dailyData.date);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Ngay: ${invoiceDate.getDate()}/${invoiceDate.getMonth() + 1}/${invoiceDate.getFullYear()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    let grandTotal = 0;
    
    dailyData.orders.forEach((orderData) => {
        if (yPos > pageHeight - 80) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Don hang #${orderData.orderID}`, 15, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`KH: ${removeVietnameseTones(orderData.customerName) || 'N/A'}`, 15, yPos);
        yPos += 7;
        
        const tableData = orderData.items.map((item, index) => [
            index + 1,
            removeVietnameseTones(item.productName) + (item.color ? ' - ' + removeVietnameseTones(item.color) : '') + (item.size ? ' (' + item.size + ')' : ''),
            item.quantity,
            formatCurrency(item.price),
            formatCurrency(item.price * item.quantity)
        ]);
        
        const orderTotal = orderData.finalPrice || orderData.items.reduce((s, i) => s + i.price * i.quantity, 0);
        tableData.push(['', 'TONG', '', '', formatCurrency(orderTotal)]);
        grandTotal += orderTotal;
        
        const tableStyles = getDefaultTableStyles();
        autoTable(doc, {
            startY: yPos,
            head: [['STT', 'San pham', 'SL', 'Don gia', 'Thanh tien']],
            body: tableData,
            ...tableStyles,
            styles: { ...tableStyles.styles, fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 80, halign: 'left' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' }
            },
            didParseCell: function(cellData) {
                if (cellData.row.index === tableData.length - 1) {
                    cellData.cell.styles.fontStyle = 'bold';
                    cellData.cell.styles.fillColor = [255, 250, 205];
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
    });
    
    // Tổng cộng tất cả đơn hàng
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(`TONG CONG: ${formatCurrency(grandTotal)} VND`, pageWidth - 15, yPos, { align: 'right' });
    
    const fileName = `HoaDonNgay_${dailyData.date || Date.now()}.pdf`;
    doc.save(fileName);
    return fileName;
};

/**
 * PHIẾU NHẬP KHO CŨ (giữ lại để tương thích)
 */
export const generateInventoryImportPDF = (data) => {
    return generateWarehouseReceiptPDF({
        receiptNumber: data.importNumber,
        receiptDate: { day: new Date().getDate(), month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        supplierName: data.deliveryPerson,
        warehouse: { name: data.warehouseLocation },
        items: data.items.map(item => ({
            productName: item.productName,
            productCode: item.productCode,
            unit: item.unit,
            documentQuantity: item.quantity,
            actualQuantity: item.actualQuantity || item.quantity,
            unitPrice: item.price,
            totalAmount: item.total
        })),
        totalAmountInWords: data.totalInWords,
        attachedDocuments: data.attachedDocuments
    });
};


/**
 * BIỂU MẪU PHẢN HỒI KHÁCH HÀNG
 */
export const generateCustomerFeedbackPDF = (feedbackData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    drawCompanyHeader(doc, pageWidth);
    
    let yPos = 35;
    drawTitle(doc, 'BIEU MAU PHAN HOI KHACH HANG', pageWidth, yPos);
    yPos += 15;
    
    // Thông tin khách hàng
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Ten khach hang: ' + (removeVietnameseTones(feedbackData.customerName) || '...'), 15, yPos);
    yPos += 7;
    doc.text('Email: ' + (feedbackData.email || '...'), 15, yPos);
    yPos += 7;
    doc.text('So dien thoai: ' + (feedbackData.phone || '...'), 15, yPos);
    yPos += 10;
    
    // Nội dung phản hồi
    doc.setFont('helvetica', 'bold');
    doc.text('Noi dung phan hoi:', 15, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    const feedbackText = removeVietnameseTones(feedbackData.feedback || 'Khong co noi dung');
    const splitText = doc.splitTextToSize(feedbackText, pageWidth - 30);
    doc.text(splitText, 15, yPos);
    yPos += splitText.length * 7 + 10;
    
    // Đánh giá
    if (feedbackData.rating) {
        doc.setFont('helvetica', 'bold');
        doc.text('Danh gia: ' + feedbackData.rating + '/5 sao', 15, yPos);
        yPos += 10;
    }
    
    // Ngày gửi
    const today = new Date();
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(`Ngay gui: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`, 15, yPos);
    
    // Lưu file
    const fileName = `PhanHoi_${feedbackData.customerName || Date.now()}.pdf`;
    doc.save(fileName);
    return fileName;
};


/**
 * XÁC NHẬN ĐƠN HÀNG
 */
export const generateOrderConfirmationPDF = (orderData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    drawCompanyHeader(doc, pageWidth);
    
    let yPos = 35;
    drawTitle(doc, 'XAC NHAN DON HANG', pageWidth, yPos);
    yPos += 15;
    
    // Thông tin đơn hàng
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Ma don hang: ' + (orderData.orderID || '...'), 15, yPos);
    yPos += 7;
    doc.text('Khach hang: ' + (removeVietnameseTones(orderData.customerName) || '...'), 15, yPos);
    yPos += 7;
    doc.text('Dia chi: ' + (removeVietnameseTones(orderData.shippingAddress) || '...'), 15, yPos);
    yPos += 7;
    doc.text('So dien thoai: ' + (orderData.phone || '...'), 15, yPos);
    yPos += 10;
    
    // Bảng sản phẩm
    const tableData = orderData.items.map((item, index) => [
        index + 1,
        removeVietnameseTones(item.productName) + (item.color ? ' - ' + removeVietnameseTones(item.color) : '') + (item.size ? ' (' + item.size + ')' : ''),
        item.quantity,
        formatCurrency(item.price),
        formatCurrency(item.price * item.quantity)
    ]);
    
    const total = orderData.totalPrice || orderData.items.reduce((s, i) => s + i.price * i.quantity, 0);
    tableData.push(['', 'TONG CONG', '', '', formatCurrency(total)]);
    
    const tableStyles = getDefaultTableStyles();
    autoTable(doc, {
        startY: yPos,
        head: [['STT', 'San pham', 'SL', 'Don gia', 'Thanh tien']],
        body: tableData,
        ...tableStyles,
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 80, halign: 'left' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 33, halign: 'right' }
        },
        didParseCell: function(cellData) {
            if (cellData.row.index === tableData.length - 1) {
                cellData.cell.styles.fontStyle = 'bold';
                cellData.cell.styles.fillColor = [255, 250, 205];
                cellData.cell.styles.textColor = [0, 51, 102];
            }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Lời cảm ơn
    doc.setFont('helvetica', 'italic');
    doc.text('Cam on quy khach da dat hang tai ICONDENIM!', pageWidth / 2, yPos, { align: 'center' });
    
    const fileName = `XacNhanDonHang_${orderData.orderID || Date.now()}.pdf`;
    doc.save(fileName);
    return fileName;
};
