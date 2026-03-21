/**
 * SCRIPT XUẤT DỮ LIỆU TỪ MONGODB SANG ĐỊNH DẠNG CHO CoIUM
 * Đồ án tốt nghiệp - Fashion Store
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');

async function exportDataForCoIUM() {
    try {
        console.log('🔌 Đang kết nối MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối thành công!\n');

        // Lấy tất cả orders
        console.log('📦 Đang lấy dữ liệu orders và order details...');
        const orders = await Order.find({}).lean();
        const orderDetails = await OrderDetail.find({}).lean();
        const products = await Product.find({}).lean();

        console.log(`✅ Đã lấy ${orders.length} orders`);
        console.log(`✅ Đã lấy ${orderDetails.length} order details`);
        console.log(`✅ Đã lấy ${products.length} products\n`);

        // Tạo map productID -> price cho profits
        const productProfitMap = {};
        products.forEach(p => {
            productProfitMap[p.productID] = Math.round(p.price);
        });

        // Group order details theo orderID
        const orderDetailsMap = {};
        orderDetails.forEach(od => {
            if (!orderDetailsMap[od.orderID]) {
                orderDetailsMap[od.orderID] = [];
            }
            orderDetailsMap[od.orderID].push(od);
        });

        // ========================================================================
        // 1. TẠO FILE TRANSACTIONS (định dạng: itemID itemID itemID...)
        // ========================================================================
        console.log('📝 Đang tạo file transactions...');
        let transactionLines = [];
        let utilityLines = [];
        let validOrderCount = 0;
        let totalDatasetUtility = 0;

        orders.forEach(order => {
            const details = orderDetailsMap[order.orderID] || [];
            if (details.length > 0) {
                // Collect {productID, quantity, price} per detail line
                const itemEntries = details.map(d => {
                    // SKU format: PRODUCT_ID-SIZE-COLOR_ID hoặc PRODUCT_ID-COLOR_ID
                    const parts = d.SKU.split('-');
                    const productID = parseInt(parts[0]);
                    const quantity = d.quantity || 1;
                    const price = productProfitMap[productID] || 1000;
                    return { productID, quantity, price };
                }).filter(entry => !isNaN(entry.productID));

                if (itemEntries.length > 0) {
                    // --- Transaction line (co-occurrence format, keep as-is) ---
                    const productIDs = itemEntries.map(e => e.productID);
                    transactionLines.push(productIDs.join(' '));

                    // --- Utility line (Java HUIM format) ---
                    // Deduplicate by productID: sum quantities for same product
                    const deduped = {};
                    itemEntries.forEach(entry => {
                        if (deduped[entry.productID]) {
                            deduped[entry.productID].quantity += entry.quantity;
                        } else {
                            deduped[entry.productID] = { ...entry };
                        }
                    });

                    // Sort by productID ascending
                    const sorted = Object.values(deduped).sort((a, b) => a.productID - b.productID);

                    const sortedIDs = sorted.map(e => e.productID);
                    const itemUtilities = sorted.map(e => e.price * e.quantity);
                    const transactionUtility = itemUtilities.reduce((sum, u) => sum + u, 0);
                    totalDatasetUtility += transactionUtility;

                    // Format: item1 item2:totalUtility:util1 util2
                    utilityLines.push(
                        `${sortedIDs.join(' ')}:${transactionUtility}:${itemUtilities.join(' ')}`
                    );

                    validOrderCount++;
                }
            }
        });

        const transactionFile = path.join(__dirname, 'fashion_store.dat');
        fs.writeFileSync(transactionFile, transactionLines.join('\n'), 'utf8');
        console.log(`✅ Đã tạo ${transactionFile}`);
        console.log(`   - ${validOrderCount} transactions hợp lệ\n`);

        // ========================================================================
        // 2. TẠO FILE UTILITY (Java HUIM format: items:TU:utilities)
        // ========================================================================
        console.log('⚡ Đang tạo file utility...');
        const utilityFile = path.join(__dirname, 'fashion_store_utility.dat');
        fs.writeFileSync(utilityFile, utilityLines.join('\n'), 'utf8');
        console.log(`✅ Đã tạo ${utilityFile}`);
        console.log(`   - ${utilityLines.length} transactions với utility\n`);

        // ========================================================================
        // 3. TẠO FILE PROFITS (định dạng: itemID profit)
        // ========================================================================
        console.log('💰 Đang tạo file profits...');

        // Lấy tất cả unique productIDs từ transactions
        const allProductIDs = new Set();
        transactionLines.forEach(line => {
            line.split(' ').forEach(id => allProductIDs.add(parseInt(id)));
        });

        // Tạo profit line
        const profitPairs = [];
        Array.from(allProductIDs).sort((a, b) => a - b).forEach(productID => {
            const profit = productProfitMap[productID] || 1000; // Default 1000 nếu không tìm thấy
            profitPairs.push(`${productID}:${profit}`);
        });

        const profitFile = path.join(__dirname, 'fashion_store_profits.txt');
        // Format: item profit (mỗi cặp trên 1 dòng) để phù hợp với load_profits_from_file
        const profitLines = profitPairs.map(pair => pair.replace(':', ' '));
        fs.writeFileSync(profitFile, profitLines.join('\n'), 'utf8');
        console.log(`✅ Đã tạo ${profitFile}`);
        console.log(`   - ${profitPairs.length} sản phẩm có profit\n`);

        // ========================================================================
        // 4. TẠO FILE EXPORT STATS (JSON)
        // ========================================================================
        console.log('📊 Đang tạo file export stats...');
        const exportStats = {
            totalTransactions: validOrderCount,
            totalUniqueItems: allProductIDs.size,
            totalDatasetUtility: totalDatasetUtility,
            exportTimestamp: Math.floor(Date.now() / 1000)
        };
        const statsFile = path.join(__dirname, 'export_stats.json');
        fs.writeFileSync(statsFile, JSON.stringify(exportStats, null, 2), 'utf8');
        console.log(`✅ Đã tạo ${statsFile}\n`);

        // ========================================================================
        // 5. THỐNG KÊ
        // ========================================================================
        console.log('📊 THỐNG KÊ DỮ LIỆU:\n');
        console.log('═'.repeat(80));
        console.log(`Tổng số orders           : ${orders.length}`);
        console.log(`Orders hợp lệ            : ${validOrderCount}`);
        console.log(`Tổng order details       : ${orderDetails.length}`);
        console.log(`Tổng sản phẩm unique     : ${allProductIDs.size}`);
        console.log(`Tổng sản phẩm có profit  : ${profitPairs.length}`);
        console.log(`Tổng dataset utility     : ${totalDatasetUtility.toLocaleString()}`);
        console.log('═'.repeat(80));

        // Thống kê số items per transaction
        const itemsPerTrans = transactionLines.map(line => line.split(' ').length);
        const avgItems = (itemsPerTrans.reduce((a, b) => a + b, 0) / itemsPerTrans.length).toFixed(2);
        const minItems = Math.min(...itemsPerTrans);
        const maxItems = Math.max(...itemsPerTrans);

        console.log(`\nSố items/transaction:`);
        console.log(`  - Trung bình: ${avgItems}`);
        console.log(`  - Min: ${minItems}`);
        console.log(`  - Max: ${maxItems}`);

        // Top 10 sản phẩm xuất hiện nhiều nhất
        const productCount = {};
        transactionLines.forEach(line => {
            line.split(' ').forEach(id => {
                productCount[id] = (productCount[id] || 0) + 1;
            });
        });

        console.log(`\n🏆 TOP 10 SẢN PHẨM XUẤT HIỆN NHIỀU NHẤT:\n`);
        Object.entries(productCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([productID, count], index) => {
                const product = products.find(p => p.productID === parseInt(productID));
                const name = product ? product.name : 'Unknown';
                console.log(`${index + 1}. Product #${productID} (${name}): ${count} lần`);
            });

        console.log('\n✅ XUẤT DỮ LIỆU HOÀN TẤT!\n');
        console.log('📁 Files đã tạo:');
        console.log(`   1. ${transactionFile}  (co-occurrence transactions)`);
        console.log(`   2. ${utilityFile}  (Java HUIM utility format)`);
        console.log(`   3. ${profitFile}  (item profits)`);
        console.log(`   4. ${statsFile}  (export statistics)\n`);
        console.log('🚀 Dữ liệu đã sẵn sàng cho CoHUI Java pipeline.\n');

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

// Chạy script
exportDataForCoIUM();
