const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Định nghĩa schema cho Receipt (Phiếu Nhập Kho)
const receiptSchema = new Schema({
    receiptNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    receiptDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    supplierName: {
        type: String,
        required: true,
        trim: true
    },
    referenceDocument: {
        number: {
            type: String,
            trim: true
        },
        date: {
            type: Date
        },
        issuedBy: {
            type: String,
            trim: true
        }
    },
    warehouse: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        location: {
            type: String,
            trim: true
        }
    },
    department: {
        type: String,
        trim: true
    },
    unit: {
        type: String,
        trim: true
    },
    accounting: {
        debit: {
            type: String,
            trim: true
        },
        credit: {
            type: String,
            trim: true
        }
    },
    totalQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    totalAmountInWords: {
        type: String,
        trim: true
    },
    attachedDocuments: {
        type: String,
        trim: true
    },
    createdBy: {
        type: Number,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['draft', 'completed', 'cancelled'],
        default: 'draft'
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// Thêm index
receiptSchema.index({ receiptDate: -1 });
receiptSchema.index({ status: 1 });
receiptSchema.index({ createdAt: -1 });

// Virtual field để lấy danh sách items
receiptSchema.virtual('items', {
    ref: 'ReceiptItem',
    localField: '_id',
    foreignField: 'receiptID',
    justOne: false
});

// Tạo model từ schema
const Receipt = mongoose.model('Receipt', receiptSchema, 'receipts');

module.exports = Receipt;

