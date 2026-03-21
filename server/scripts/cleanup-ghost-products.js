/**
 * Script để tìm và xóa các sản phẩm "ma" - những sản phẩm không hợp lệ trong database
 * Chạy: node server/scripts/cleanup-ghost-products.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product.model');
const ProductColor = require('../models/ProductColor.model');
const ProductSizeStock = require('../models/ProductSizeStock.model');

async function cleanupGhostProducts() {
    try {
        // Kết nối database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Đã kết nối MongoDB');

        // Lấy tất cả sản phẩm
        const allProducts = await Product.find({});
        console.log(`\n📦 Tìm thấy ${allProducts.length} sản phẩm trong database`);

        // Phân tích sản phẩm
        const invalidProducts = [];
        const validProducts = [];

        for (const product of allProducts) {
            const issues = [];
            
            // Kiểm tra các vấn đề
            if (!product._id) {
                issues.push('Không có _id');
            }
            if (!product.productID && !product._id) {
                issues.push('Không có productID và _id');
            }
            if (!product.name || product.name.trim() === '') {
                issues.push('Không có tên');
            }
            if (!product.categoryID) {
                issues.push('Không có categoryID');
            }
            if (!product.targetID) {
                issues.push('Không có targetID');
            }

            if (issues.length > 0) {
                invalidProducts.push({
                    _id: product._id,
                    productID: product.productID,
                    name: product.name || 'N/A',
                    issues: issues
                });
            } else {
                validProducts.push(product);
            }
        }

        // Hiển thị kết quả
        console.log(`\n✅ Sản phẩm hợp lệ: ${validProducts.length}`);
        console.log(`❌ Sản phẩm không hợp lệ: ${invalidProducts.length}`);

        if (invalidProducts.length > 0) {
            console.log('\n⚠️  DANH SÁCH SẢN PHẨM KHÔNG HỢP LỆ:');
            invalidProducts.forEach((p, index) => {
                console.log(`\n${index + 1}. ${p.name}`);
                console.log(`   _id: ${p._id}`);
                console.log(`   productID: ${p.productID || 'N/A'}`);
                console.log(`   Vấn đề: ${p.issues.join(', ')}`);
            });

            // Hỏi có muốn xóa không
            console.log('\n🗑️  Bạn có muốn xóa các sản phẩm không hợp lệ này không?');
            console.log('   Để xóa, hãy sửa dòng DELETE_INVALID_PRODUCTS = false thành true trong file này\n');
            
            const DELETE_INVALID_PRODUCTS = false; // Đổi thành true để xóa

            if (DELETE_INVALID_PRODUCTS) {
                console.log('⏳ Đang xóa sản phẩm không hợp lệ...');
                
                for (const invalidProduct of invalidProducts) {
                    // Xóa colors và sizes liên quan
                    const colors = await ProductColor.find({ 
                        productID: invalidProduct.productID || invalidProduct._id.toString() 
                    });
                    const colorIDs = colors.map(c => c.colorID);
                    
                    if (colorIDs.length > 0) {
                        await ProductSizeStock.deleteMany({ colorID: { $in: colorIDs } });
                        await ProductColor.deleteMany({ 
                            productID: invalidProduct.productID || invalidProduct._id.toString() 
                        });
                    }
                    
                    // Xóa sản phẩm
                    await Product.deleteOne({ _id: invalidProduct._id });
                    
                    console.log(`   ✅ Đã xóa: ${invalidProduct.name}`);
                }
                
                console.log(`\n✅ Đã xóa ${invalidProducts.length} sản phẩm không hợp lệ`);
            }
        } else {
            console.log('\n✅ Không tìm thấy sản phẩm không hợp lệ nào!');
        }

        // Đóng kết nối
        await mongoose.connection.close();
        console.log('\n✅ Hoàn thành!');
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

// Chạy script
cleanupGhostProducts();
