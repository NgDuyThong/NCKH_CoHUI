const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Định nghĩa schema cho ReceiptItem (Chi tiết hàng hóa trong phiếu nhập kho)
const receiptItemSchema = new Schema({
    receiptID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Receipt'
    },
    productID: {
        type: Number,
        required: true,
        ref: 'Product'
    },
    productCode: {
        type: String,
        required: true,
        trim: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    colorName: {
        type: String,
        required: true,
        trim: true
    },
    size: {
        type: String,
        required: true,
        trim: true
        // Không giới hạn enum để hỗ trợ cả size chữ (S, M, L) và size số (28, 29, 30...)
    },
    unit: {
        type: String,
        required: true,
        trim: true,
        default: 'Cái'
    },
    documentQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    actualQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Middleware để tự động tính totalAmount
receiptItemSchema.pre('save', function(next) {
    this.totalAmount = this.actualQuantity * this.unitPrice;
    next();
});

// Thêm index
receiptItemSchema.index({ receiptID: 1 });
receiptItemSchema.index({ productID: 1 });

// Virtual field để lấy thông tin sản phẩm
receiptItemSchema.virtual('productInfo', {
    ref: 'Product',
    localField: 'productID',
    foreignField: 'productID',
    justOne: true
});

// Tạo model từ schema
const ReceiptItem = mongoose.model('ReceiptItem', receiptItemSchema, 'receiptItems');

module.exports = ReceiptItem;

