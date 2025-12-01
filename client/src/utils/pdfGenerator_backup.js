/**
 * ===============================================
 * PDF GENERATOR UTILITIES - ICONDENIM
 * ===============================================
 * Tạo các loại PDF theo biểu mẫu chuẩn IconDenim
 * Sử dụng font không dấu để tránh lỗi Unicode
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ===== HELPER FUNCTIONS =====

/**
 * Giữ nguyên tiếng Việt có dấu - sử dụng font Times hỗ trợ Unicode
 */
const keepVietnamese = (str) => {
    if (!str) return '';
    return str.toString();
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


/**
 * PHIẾU NHẬP KHO - Theo mẫu biểu chuẩn IconDenim
 */
export const generateWarehouseReceiptPDF = (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Sử dụng font times - hỗ trợ tiếng Việt tốt hơn
    doc.setFont('times', 'normal');
    
    // ===== HEADER - BÊN TRÁI =====
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 51, 102); // Màu xanh đậm cho logo
    doc.text('ICONDENIM', 15, 18);
    
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Đơn vị:....................', 15, 28);
    doc.text('Bộ phận:....................', 15, 34);
    
    // ===== HEADER - BÊN PHẢI =====
    doc.setFontSize(9);
    doc.text(COMPANY_INFO.formCode, pageWidth - 15, 18, { align: 'right' });
    
    // ===== TIÊU ĐỀ CHÍNH =====
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('PHIẾU NHẬP KHO', pageWidth / 2, 48, { align: 'center' });
    
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
    doc.text(`- Ho va ten nguoi giao: ${removeVietnameseTones(data.supplierName) || '.................'}`, 20, yPos);
    yPos += 6;
    
    // Theo chứng từ
    const refDateStr = data.referenceDocument?.day 
        ? `ngay ${data.referenceDocument.day} thang ${data.referenceDocument.month} nam ${data.referenceDocument.year}`
        : 'ngay ..... thang ..... nam .....';
    doc.text(`- Theo ............ so ${data.referenceDocument?.number || '............'} ${refDateStr}`, 20, yPos);
    yPos += 6;
    doc.text(`  cua ${removeVietnameseTones(data.referenceDocument?.issuedBy) || '.................'}`, 20, yPos);
    yPos += 6;
    
    // Nhập tại kho
    doc.text(`Nhap tai kho: ${removeVietnameseTones(data.warehouse?.name) || '.................'} dia diem: ${removeVietnameseTones(data.warehouse?.location) || '.................'}`, 20, yPos);
    yPos += 10;
    
    // ===== BẢNG HÀNG HÓA =====
    const tableData = data.items.map((item, index) => {
        // Tạo tên đầy đủ: tên - màu sắc - size (không dấu)
        let fullName = removeVietnameseTones(item.productName) || '';
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

    
    autoTable(doc, {
        startY: yPos,
        head: [[
            'STT',
            'Ten, mau sac, kich thuoc san pham',
            'Ma so',
            'DVT',
            'Theo\nchung tu',
            'Thuc\nnhap',
            'Don gia',
            'Thanh tien'
        ]],
        body: tableData,
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
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 55, halign: 'left', fontStyle: 'bold' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 12, halign: 'center' },
            4: { cellWidth: 18, halign: 'center' },
            5: { cellWidth: 18, halign: 'center' },
            6: { cellWidth: 25, halign: 'right' },
            7: { cellWidth: 28, halign: 'right' }
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
    doc.text(`- Tong so tien (viet bang chu): ${removeVietnameseTones(data.totalAmountInWords) || '.................'}`, 20, yPos);
    yPos += 6;
    doc.text(`- So chung tu goc kem theo: ${data.attachedDocuments || '.................'}`, 20, yPos);
    yPos += 20;
    
    // ===== FOOTER - 4 CHỮ KÝ =====
    const signatureWidth = (pageWidth - 30) / 4;
    const signatures = [
        { title: 'Nguoi lap phieu', subtitle: '(Ky, ho ten)' },
        { title: 'Nguoi giao hang', subtitle: '(Ky, ho ten)' },
        { title: 'Thu kho', subtitle: '(Ky, ho ten)' },
        { title: 'Ke toan truong', subtitle: '(Hoac bo phan co', subtitle2: 'nhu cau nhap)', subtitle3: '(Ky, ho ten)' }
    ];
    
    signatures.forEach((sig, index) => {
        const xPos = 15 + (signatureWidth * index) + signatureWidth / 2;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(sig.title, xPos, yPos, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        if (sig.subtitle) doc.text(sig.subtitle, xPos, yPos + 5, { align: 'center' });
        if (sig.subtitle2) doc.text(sig.subtitle2, xPos, yPos + 9, { align: 'center' });
        if (sig.subtitle3) doc.text(sig.subtitle3, xPos, yPos + 13, { align: 'center' });
    });
    
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
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('ICONDENIM', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Dia chi: ' + (removeVietnameseTones(orderData.shopAddress) || '...'), pageWidth / 2, 27, { align: 'center' });
    doc.text('DT: ' + (orderData.shopPhone || '...'), pageWidth / 2, 32, { align: 'center' });
    
    // Tiêu đề
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    let yPos = 45;
    doc.text('HOA DON BAN HANG', pageWidth / 2, yPos, { align: 'center' });
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

    
    autoTable(doc, {
        startY: yPos,
        head: [['STT', 'Ten hang hoa', 'DVT', 'SL', 'Don gia', 'Thanh tien']],
        body: tableData,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        headStyles: {
            fillColor: [240, 248, 255],
            textColor: [0, 51, 102],
            fontStyle: 'bold',
            fontSize: 9
        },
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
    doc.text(`Ngay ${today.getDate()} thang ${today.getMonth() + 1} nam ${today.getFullYear()}`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('KHACH HANG', pageWidth / 4, yPos, { align: 'center' });
    doc.text('NGUOI BAN HANG', (pageWidth * 3) / 4, yPos, { align: 'center' });
    
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
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('ICONDENIM', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    let yPos = 35;
    doc.text('HOA DON BAN HANG', pageWidth / 2, yPos, { align: 'center' });
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

        
        autoTable(doc, {
            startY: yPos,
            head: [['STT', 'San pham', 'SL', 'Don gia', 'Thanh tien']],
            body: tableData,
            theme: 'grid',
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [240, 248, 255], textColor: [0, 51, 102], fontStyle: 'bold' },
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
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('ICONDENIM', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    let yPos = 35;
    doc.text('BIEU MAU PHAN HOI KHACH HANG', pageWidth / 2, yPos, { align: 'center' });
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
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('ICONDENIM', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    let yPos = 35;
    doc.text('XAC NHAN DON HANG', pageWidth / 2, yPos, { align: 'center' });
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
    
    autoTable(doc, {
        startY: yPos,
        head: [['STT', 'San pham', 'SL', 'Don gia', 'Thanh tien']],
        body: tableData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [240, 248, 255], textColor: [0, 51, 102], fontStyle: 'bold' },
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
