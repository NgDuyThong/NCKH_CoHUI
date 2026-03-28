const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');
const ProductSizeStock = require('../models/ProductSizeStock');
const ProductColor = require('../models/ProductColor');

/**
 * Controller cho CoHUI Recommendation System
 * Tích hợp thuật toán CoHUI Cải Tiến (Java) thay thế Python
 * Updated: Sử dụng kết quả từ CoHUI analysis
 */

// Load correlation map từ CoIUM (cache trong memory)
let correlationMap = null;
let correlationMapLastLoaded = null;

function loadCorrelationMap() {
    try {
        const correlationMapPath = path.join(__dirname, '../CoIUM/correlation_map.json');
        
        // Kiểm tra file có tồn tại không
        if (!fs.existsSync(correlationMapPath)) {
            console.warn('⚠️  correlation_map.json không tồn tại. Chạy nút "Chạy CoIUM" trên trang admin để tạo file này.');
            return null;
        }
        
        // Kiểm tra file có thay đổi không (reload nếu cần)
        const stats = fs.statSync(correlationMapPath);
        const lastModified = stats.mtime.getTime();
        
        if (!correlationMap || !correlationMapLastLoaded || lastModified > correlationMapLastLoaded) {
            console.log('📊 Đang RELOAD correlation map từ CoIUM...');
            console.log(`   📅 File modified: ${new Date(lastModified).toLocaleString()}`);
            console.log(`   📅 Last loaded: ${correlationMapLastLoaded ? new Date(correlationMapLastLoaded).toLocaleString() : 'Never'}`);
            const data = fs.readFileSync(correlationMapPath, 'utf8');
            correlationMap = JSON.parse(data);
            correlationMapLastLoaded = lastModified;
            console.log(`✅ Đã load correlation map cho ${Object.keys(correlationMap).length} sản phẩm`);
        } else {
            console.log('✅ Sử dụng correlation map đã cache (không thay đổi)');
        }
        
        return correlationMap;
    } catch (error) {
        console.error('❌ Lỗi khi load correlation map:', error.message);
        return null;
    }
}

class CoHUIController {
    
    /**
     * Chuẩn bị dữ liệu đơn hàng từ MongoDB cho thuật toán (OPTIMIZED)
     * Sử dụng aggregation pipeline để giảm số lượng queries
     * @param {number} limit - Số lượng đơn hàng tối đa (0 = tất cả, default = 5000)
     */
    static async prepareOrdersData(limit = 5000) {
        try {
            console.time('prepareOrdersData');
            
            // Step 1: Load tất cả lookup data vào memory (chỉ 3 queries thay vì hàng ngàn)
            const [allSizeStocks, allProductColors, allProducts] = await Promise.all([
                ProductSizeStock.find().lean(),
                ProductColor.find().lean(), 
                Product.find().lean()
            ]);
            
            // Tạo Map để lookup nhanh O(1)
            const sizeStockMap = new Map(allSizeStocks.map(s => [s.SKU, s]));
            const productColorMap = new Map(allProductColors.map(c => [c.colorID, c]));
            const productMap = new Map(allProducts.map(p => [p.productID, p]));
            
            // Step 2: Lấy orders và order details
            // limit = 0 nghĩa là lấy tất cả, ngược lại limit theo số lượng
            let ordersQuery = Order.find({ 
                $or: [
                    { orderStatus: 'completed' },
                    { shippingStatus: 'delivered' }
                ]
            }).sort({ createdAt: -1 }).select('orderID');
            
            if (limit > 0) {
                ordersQuery = ordersQuery.limit(limit);
            }
            
            const orders = await ordersQuery.lean();
            
            const orderIDs = orders.map(o => o.orderID);
            const allOrderDetails = await OrderDetail.find({ 
                orderID: { $in: orderIDs } 
            }).lean();
            
            // Group order details by orderID
            const orderDetailsMap = new Map();
            for (const detail of allOrderDetails) {
                if (!orderDetailsMap.has(detail.orderID)) {
                    orderDetailsMap.set(detail.orderID, []);
                }
                orderDetailsMap.get(detail.orderID).push(detail);
            }
            
            // Step 3: Build orders data
            const ordersData = [];
            
            for (const order of orders) {
                const orderDetails = orderDetailsMap.get(order.orderID) || [];
                
                if (orderDetails.length > 0) {
                    const items = [];
                    
                    for (const detail of orderDetails) {
                        const sizeStock = sizeStockMap.get(detail.SKU);
                        if (sizeStock) {
                            const productColor = productColorMap.get(sizeStock.colorID);
                            if (productColor) {
                                const product = productMap.get(productColor.productID);
                                if (product) {
                                    items.push({
                                        productID: product.productID,
                                        quantity: detail.quantity || 1,
                                        price: product.price || 0
                                    });
                                }
                            }
                        }
                    }

                    if (items.length > 0) {
                        ordersData.push({
                            orderID: order.orderID,
                            items: items
                        });
                    }
                }
            }
            
            console.timeEnd('prepareOrdersData');
            console.log(`✅ Prepared ${ordersData.length} orders with ${allOrderDetails.length} items`);

            return ordersData;
        } catch (error) {
            console.error('Error preparing orders data:', error);
            throw error;
        }
    }

    /**
     * Gọi Java CoHUI algorithm để phân tích real-time
     * Tạo temp file chứa dữ liệu → chạy JAR → đọc JSON output
     */
    static async callJavaService(ordersData, options = {}) {
        const { minutil = 0.001, mincor = 0.3 } = options;
        const javaPath = path.join(__dirname, '../../CoHUI_CaiTien_RU_LA_KUL');
        const jarPath = path.join(javaPath, 'CoHUI_Server.jar');
        const tempFile = path.join(__dirname, '../CoIUM', `temp_analysis_${Date.now()}.dat`);

        try {
            // Build utility format từ orders data
            let totalDatasetUtility = 0;
            const lines = [];

            for (const order of ordersData) {
                // Deduplicate by productID within order
                const deduped = {};
                for (const item of order.items) {
                    if (deduped[item.productID]) {
                        deduped[item.productID].quantity += (item.quantity || 1);
                    } else {
                        deduped[item.productID] = {
                            productID: item.productID,
                            quantity: item.quantity || 1,
                            price: item.price || 0
                        };
                    }
                }

                const sorted = Object.values(deduped).sort((a, b) => a.productID - b.productID);
                const ids = sorted.map(e => e.productID);
                const utilities = sorted.map(e => e.price * e.quantity);
                const transactionUtility = utilities.reduce((sum, u) => sum + u, 0);
                totalDatasetUtility += transactionUtility;

                lines.push(`${ids.join(' ')}:${transactionUtility}:${utilities.join(' ')}`);
            }

            // Write temp file
            fs.writeFileSync(tempFile, lines.join('\n'), 'utf8');

            // Calculate absolute minUtil
            const absMinUtil = Math.max(1, Math.round(minutil * totalDatasetUtility));
            const maxTransactions = 99999;

            // Run Java
            const cmd = `java -jar "${jarPath}" "${tempFile}" ${maxTransactions} ${absMinUtil} ${mincor}`;
            console.log(`   Java command: ${cmd}`);

            const output = execSync(cmd, {
                cwd: javaPath,
                maxBuffer: 50 * 1024 * 1024,
                timeout: 120000 // 2 minutes
            }).toString();

            const result = JSON.parse(output);

            return {
                success: true,
                totalPatterns: result.cohui_count,
                runtime_ms: result.runtime_ms,
                memory_mb: result.memory_mb,
                cohuis: result.cohuis || [],
                recommendations: (result.cohuis || []).slice(0, 100).map(c => ({
                    items: c.items,
                    utility: c.utility,
                    kulc: c.kulc
                }))
            };
        } catch (error) {
            console.error('Java service error:', error.message);
            throw error;
        } finally {
            // Cleanup temp file
            try {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            } catch (e) { /* ignore cleanup errors */ }
        }
    }

    /**
     * API: Lấy gợi ý sản phẩm chung (từ CoIUM)
     * GET /api/cohui/recommendations
     * Updated: Sử dụng correlation map để lấy top sản phẩm có nhiều correlation nhất
     */
    static async getRecommendations(req, res) {
        try {
            // Lấy topN từ query, nếu không có hoặc = 'all' thì trả về tất cả
            const { topN } = req.query;
            const limit = topN && topN !== 'all' ? parseInt(topN) : null;

            // Load correlation map từ CoIUM
            const correlationMapData = loadCorrelationMap();
            
            if (!correlationMapData) {
                return res.status(200).json({
                    success: false,
                    message: 'Chưa có dữ liệu correlation. Vui lòng chạy: node test-product-recommendations.js',
                    recommendations: []
                });
            }

            // Đếm số lần mỗi sản phẩm xuất hiện trong recommendations
            const productFrequency = {};
            const productCorrelations = {};

            for (const [sourceProduct, recommendations] of Object.entries(correlationMapData)) {
                // Đếm source product (product có recommendations cho người khác)
                const sourceID = parseInt(sourceProduct);
                if (!productFrequency[sourceID]) {
                    productFrequency[sourceID] = 0;
                    productCorrelations[sourceID] = [];
                }
                // Source product được tính 1 điểm cơ bản vì nó có mặt trong correlation map
                productFrequency[sourceID] += 1;
                productCorrelations[sourceID].push(0.5);

                recommendations.forEach((rec, index) => {
                    const productID = rec.productID;

                    // Đếm frequency
                    if (!productFrequency[productID]) {
                        productFrequency[productID] = 0;
                        productCorrelations[productID] = [];
                    }

                    productFrequency[productID]++;

                    // Lưu correlation score (càng cao càng tốt, càng xuất hiện đầu trong list càng quan trọng)
                    const position = index + 1;
                    const positionScore = 1 / position; // Top 1 = 1.0, Top 2 = 0.5, Top 3 = 0.33...
                    productCorrelations[productID].push(positionScore);
                });
            }

            // Tính điểm cho mỗi sản phẩm (kết hợp frequency và correlation position)
            const productScores = Object.entries(productFrequency).map(([productID, frequency]) => {
                const avgCorrelation = productCorrelations[productID].reduce((a, b) => a + b, 0) / productCorrelations[productID].length;
                const score = frequency * avgCorrelation; // Điểm = tần suất × correlation trung bình
                
                return {
                    productID: parseInt(productID),
                    frequency: frequency,
                    avgCorrelation: avgCorrelation,
                    score: score
                };
            });

            // Sort theo score giảm dần
            productScores.sort((a, b) => b.score - a.score);
            
            // Lấy top N hoặc tất cả nếu không có giới hạn
            const topProducts = limit ? productScores.slice(0, limit) : productScores;

            // Lấy thông tin chi tiết sản phẩm (chỉ lấy sản phẩm đang hoạt động)
            const productIDs = topProducts.map(p => p.productID);
            const products = await Product.find({ 
                productID: { $in: productIDs },
                isActivated: { $ne: false } // Lọc bỏ sản phẩm đã vô hiệu hóa
            }).lean();

            // Map kết quả
            const recommendations = topProducts.map(item => {
                const product = products.find(p => p.productID === item.productID);
                if (!product) return null;

                return {
                    productID: product.productID,
                    name: product.name,
                    price: product.price,
                    thumbnail: product.thumbnail,
                    categoryID: product.categoryID,
                    targetID: product.targetID,
                    // Thống kê từ correlation analysis
                    frequency: item.frequency, // Số lần xuất hiện trong recommendations
                    avgCorrelation: item.avgCorrelation,
                    score: item.score,
                    source: 'CoIUM'
                };
            }).filter(r => r !== null);

            res.status(200).json({
                success: true,
                message: `Tìm thấy ${recommendations.length} sản phẩm được gợi ý nhiều nhất`,
                totalRecommendations: recommendations.length,
                recommendations: recommendations,
                source: 'CoIUM correlation analysis',
                description: 'Top sản phẩm có tính tương quan cao với nhiều sản phẩm khác'
            });

        } catch (error) {
            console.error('Error in getRecommendations:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy gợi ý sản phẩm',
                error: error.message
            });
        }
    }

    /**
     * API: Lấy gợi ý sản phẩm chung (OLD VERSION - Python real-time)
     * Giữ lại để backup
     */
    static async getRecommendationsPython(req, res) {
        try {
            const { 
                minutil = 0.001, 
                mincor = 0.3, 
                maxlen = 3, 
                topN = 10,
                limit = 5000
            } = req.query;

            // Lấy dữ liệu đơn hàng với limit
            const ordersData = await CoHUIController.prepareOrdersData(parseInt(limit));

            if (ordersData.length < 2) {
                return res.status(200).json({
                    success: false,
                    message: 'Không đủ dữ liệu đơn hàng để phân tích (cần ít nhất 2 đơn hàng)',
                    recommendations: []
                });
            }

            // Gọi Python service
            const inputData = {
                action: 'recommend',
                orders: ordersData,
                minutil: parseFloat(minutil),
                mincor: parseFloat(mincor),
                maxlen: parseInt(maxlen),
                topN: parseInt(topN)
            };

            const result = await CoHUIController.callPythonService(inputData);
            
            // Thêm thông tin số đơn hàng đã xử lý
            result.totalOrders = ordersData.length;

            // Lấy thông tin chi tiết sản phẩm
            if (result.success && result.recommendations.length > 0) {
                const productIDs = result.recommendations.map(r => r.productID);
                const products = await Product.find({ 
                    productID: { $in: productIDs } 
                }).lean();

                // Map thông tin sản phẩm
                result.recommendations = result.recommendations.map(rec => {
                    const product = products.find(p => p.productID === rec.productID);
                    return {
                        ...rec,
                        productDetails: product ? {
                            productID: product.productID,
                            name: product.name,
                            price: product.price,
                            thumbnail: product.thumbnail,
                            categoryID: product.categoryID
                        } : null
                    };
                });
            }

            res.status(200).json(result);

        } catch (error) {
            console.error('Error in getRecommendationsPython:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy gợi ý sản phẩm',
                error: error.message
            });
        }
    }

    /**
     * API: Lấy sản phẩm tương quan cho 1 sản phẩm cụ thể (từ CoIUM)
     * GET /api/cohui/recommendations/:productID
     * Sử dụng kết quả đã phân tích từ CoIUM thay vì chạy Python real-time
     */
    static async getProductRecommendations(req, res) {
        try {
            const { productID } = req.params;
            const { topN = 10 } = req.query;

            // Kiểm tra sản phẩm tồn tại
            const product = await Product.findOne({ productID: parseInt(productID) });
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm'
                });
            }

            // Load correlation map từ CoIUM
            const correlationMapData = loadCorrelationMap();
            
            if (!correlationMapData) {
                // Fallback: Nếu không có correlation map, trả về sản phẩm cùng category
                console.warn(`⚠️  Không có correlation map, sử dụng fallback cho product #${productID}`);
                return CoHUIController.getFallbackRecommendations(req, res, product, parseInt(topN));
            }

            // Lấy recommendations từ correlation map
            const recommendedProducts = correlationMapData[productID];
            
            if (!recommendedProducts || recommendedProducts.length === 0) {
                // Fallback nếu sản phẩm không có trong correlation map
                console.warn(`⚠️  Sản phẩm #${productID} không có trong correlation map, sử dụng fallback`);
                return CoHUIController.getFallbackRecommendations(req, res, product, parseInt(topN));
            }

            // Giới hạn số lượng recommendations
            const limitedRecommendations = recommendedProducts.slice(0, parseInt(topN));

            // Lấy thông tin chi tiết từ DB (để có dữ liệu mới nhất, chỉ lấy sản phẩm đang hoạt động)
            const productIDs = limitedRecommendations.map(r => r.productID);
            const fullProducts = await Product.find({ 
                productID: { $in: productIDs },
                isActivated: { $ne: false } // Lọc bỏ sản phẩm đã vô hiệu hóa
            }).lean();

            // Map kết quả
            const recommendations = limitedRecommendations.map(rec => {
                const fullProduct = fullProducts.find(p => p.productID === rec.productID);
                if (!fullProduct) return null;

                return {
                    productID: fullProduct.productID,
                    name: fullProduct.name,
                    price: fullProduct.price,
                    thumbnail: fullProduct.thumbnail,
                    categoryID: fullProduct.categoryID,
                    targetID: fullProduct.targetID,
                    // Thông tin từ correlation analysis
                    correlationScore: rec.correlationScore || 1.0,
                    source: 'CoIUM'
                };
            }).filter(r => r !== null);

            // Thêm sản phẩm đang tìm vào đầu danh sách với correlationScore = 1.0
            const searchedProduct = {
                productID: product.productID,
                name: product.name,
                price: product.price,
                thumbnail: product.thumbnail,
                categoryID: product.categoryID,
                targetID: product.targetID,
                correlationScore: 1.0, // Score cao nhất cho sản phẩm đang tìm
                source: 'searched',
                isSearchedProduct: true // Đánh dấu đây là sản phẩm đang tìm
            };

            // Kết hợp: sản phẩm đang tìm + các sản phẩm tương quan
            const finalRecommendations = [searchedProduct, ...recommendations];

            res.status(200).json({
                success: true,
                productID: parseInt(productID),
                productName: product.name,
                totalRecommendations: finalRecommendations.length,
                recommendations: finalRecommendations,
                product: searchedProduct, // Thông tin sản phẩm đang tìm
                source: 'CoIUM correlation analysis',
                message: 'Gợi ý dựa trên phân tích correlation từ CoIUM'
            });

        } catch (error) {
            console.error('Error in getProductRecommendations:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy gợi ý sản phẩm',
                error: error.message
            });
        }
    }

    /**
     * Fallback recommendations khi không có correlation map
     * Trả về sản phẩm cùng category và target
     */
    static async getFallbackRecommendations(req, res, product, topN = 10) {
        try {
            // Lấy sản phẩm cùng category và target (chỉ lấy sản phẩm đang hoạt động)
            const similarProducts = await Product.find({
                productID: { $ne: product.productID },
                categoryID: product.categoryID,
                targetID: product.targetID,
                isActivated: { $ne: false } // Lọc bỏ sản phẩm đã vô hiệu hóa
            }).limit(topN).lean();

            // Nếu không đủ, lấy thêm cùng category VÀ cùng targetID (chỉ lấy sản phẩm đang hoạt động)
            if (similarProducts.length < topN) {
                const additionalProducts = await Product.find({
                    productID: { 
                        $ne: product.productID,
                        $nin: similarProducts.map(p => p.productID)
                    },
                    categoryID: product.categoryID,
                    targetID: product.targetID, // Thêm filter targetID
                    isActivated: { $ne: false } // Lọc bỏ sản phẩm đã vô hiệu hóa
                }).limit(topN - similarProducts.length).lean();
                
                similarProducts.push(...additionalProducts);
            }

            const recommendations = similarProducts.map(p => ({
                productID: p.productID,
                name: p.name,
                price: p.price,
                thumbnail: p.thumbnail,
                categoryID: p.categoryID,
                targetID: p.targetID,
                source: 'Fallback'
            }));

            // Thêm sản phẩm đang tìm vào đầu danh sách
            const searchedProduct = {
                productID: product.productID,
                name: product.name,
                price: product.price,
                thumbnail: product.thumbnail,
                categoryID: product.categoryID,
                targetID: product.targetID,
                correlationScore: 1.0,
                source: 'searched',
                isSearchedProduct: true
            };

            // Kết hợp: sản phẩm đang tìm + các sản phẩm tương quan
            const finalRecommendations = [searchedProduct, ...recommendations];

            res.status(200).json({
                success: true,
                productID: product.productID,
                productName: product.name,
                totalRecommendations: finalRecommendations.length,
                recommendations: finalRecommendations,
                product: searchedProduct,
                source: 'Fallback (same category)',
                message: 'Gợi ý dựa trên category tương tự (correlation map chưa có)'
            });

        } catch (error) {
            console.error('Error in getFallbackRecommendations:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy gợi ý fallback',
                error: error.message
            });
        }
    }

    /**
     * API: Lấy sản phẩm thường mua cùng
     * GET /api/cohui/bought-together/:productID
     * Updated: Sử dụng correlation map từ CoIUM
     */
    static async getBoughtTogether(req, res) {
        try {
            const { productID } = req.params;
            const { topN = 5 } = req.query;

            // Kiểm tra sản phẩm tồn tại
            const product = await Product.findOne({ productID: parseInt(productID) });
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm'
                });
            }

            // Load correlation map từ CoIUM
            const correlationMapData = loadCorrelationMap();
            
            if (!correlationMapData) {
                console.warn(`⚠️  Không có correlation map cho bought-together #${productID}, sử dụng fallback`);
                return CoHUIController.getFallbackRecommendations(req, res, product, parseInt(topN));
            }

            // Lấy recommendations từ correlation map
            const recommendedProducts = correlationMapData[productID];
            
            if (!recommendedProducts || recommendedProducts.length === 0) {
                console.warn(`⚠️  Sản phẩm #${productID} không có trong correlation map, sử dụng fallback`);
                return CoHUIController.getFallbackRecommendations(req, res, product, parseInt(topN));
            }

            // ✅ FIX: Lấy NHIỀU hơn từ correlation map (topN * 3) để sau khi filter vẫn đủ
            const extendedLimit = Math.min(recommendedProducts.length, parseInt(topN) * 3);
            const limitedRecommendations = recommendedProducts.slice(0, extendedLimit);

            // Lấy thông tin chi tiết từ DB (chỉ lấy sản phẩm đang hoạt động VÀ cùng targetID)
            const productIDs = limitedRecommendations.map(r => r.productID);
            const fullProducts = await Product.find({ 
                productID: { $in: productIDs },
                targetID: product.targetID, // Chỉ lấy sản phẩm cùng giới tính
                isActivated: { $ne: false } // Lọc bỏ sản phẩm đã vô hiệu hóa
            }).lean();
            
            console.log(`🎯 Filter: Sản phẩm #${productID} (targetID: ${product.targetID})`);
            console.log(`   📊 Correlation map: ${recommendedProducts.length} sản phẩm tổng`);
            console.log(`   📌 Lấy: ${extendedLimit} sản phẩm để filter`);
            console.log(`   🔍 productIDs to query: ${productIDs.join(', ')}`);
            console.log(`   ✅ Sau filter DB (targetID=${product.targetID}): ${fullProducts.length} sản phẩm`);
            
            // Debug: Hiển thị targetID của các sản phẩm trong correlation map
            if (fullProducts.length < 3) {
                const debugInfo = limitedRecommendations.slice(0, 5).map(rec => {
                    const prod = fullProducts.find(p => p.productID === rec.productID);
                    return {
                        id: rec.productID,
                        name: rec.name,
                        targetID: rec.targetID,
                        inDB: !!prod,
                        matchGender: rec.targetID === product.targetID ? '✅' : '❌'
                    };
                });
                console.log('   🔍 DEBUG: Top 5 từ correlation map:', debugInfo);
            }

            // Map kết quả theo format mà ProductDetail.jsx mong đợi
            const recommendations = limitedRecommendations.map(rec => {
                const fullProduct = fullProducts.find(p => p.productID === rec.productID);
                if (!fullProduct) return null;

                return {
                    productID: fullProduct.productID,
                    correlation: rec.correlationScore || 1.0,
                    utility: 0, // Không cần thiết cho UI
                    productDetails: {
                        productID: fullProduct.productID,
                        name: fullProduct.name,
                        price: fullProduct.price,
                        thumbnail: fullProduct.thumbnail,
                        categoryID: fullProduct.categoryID,
                        targetID: fullProduct.targetID
                    }
                };
            })
            .filter(r => r !== null)
            .slice(0, parseInt(topN)); // ✅ Giới hạn về topN sau khi filter

            // Thêm sản phẩm đang tìm vào đầu danh sách
            const searchedProduct = {
                productID: product.productID,
                correlation: 1.0,
                utility: 0,
                productDetails: {
                    productID: product.productID,
                    name: product.name,
                    price: product.price,
                    thumbnail: product.thumbnail,
                    categoryID: product.categoryID,
                    targetID: product.targetID
                },
                isSearchedProduct: true
            };

            // Kết hợp: sản phẩm đang tìm + các sản phẩm mua cùng
            const finalRecommendations = [searchedProduct, ...recommendations];

            res.status(200).json({
                success: true,
                productID: parseInt(productID),
                productName: product.name,
                totalRecommendations: finalRecommendations.length,
                recommendations: finalRecommendations,
                product: product,
                source: 'CoIUM correlation analysis',
                message: 'Sản phẩm thường được mua cùng (từ CoIUM)'
            });

        } catch (error) {
            console.error('Error in getBoughtTogether:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy sản phẩm thường mua cùng',
                error: error.message
            });
        }
    }

    /**
     * API: Lấy sản phẩm thường mua cùng (OLD VERSION - Sử dụng Python real-time)
     * Giữ lại để backup, có thể xóa sau
     */
    static async getBoughtTogetherPython(req, res) {
        try {
            const { productID } = req.params;
            const { minutil = 0.001, mincor = 0.3, topN = 5, limit = 5000 } = req.query;

            // Kiểm tra sản phẩm tồn tại
            const product = await Product.findOne({ productID: parseInt(productID) });
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm'
                });
            }

            // Lấy dữ liệu đơn hàng với limit
            const ordersData = await CoHUIController.prepareOrdersData(parseInt(limit));

            if (ordersData.length < 2) {
                return res.status(200).json({
                    success: false,
                    message: 'Không đủ dữ liệu để phân tích',
                    recommendations: []
                });
            }

            // Gọi Python service
            const inputData = {
                action: 'bought_together',
                orders: ordersData,
                productID: parseInt(productID),
                minutil: parseFloat(minutil),
                mincor: parseFloat(mincor),
                topN: parseInt(topN)
            };

            const result = await CoHUIController.callPythonService(inputData);

            // Lấy thông tin chi tiết sản phẩm
            if (result.success && result.recommendations.length > 0) {
                const productIDs = result.recommendations.map(r => r.productID);
                const products = await Product.find({ 
                    productID: { $in: productIDs } 
                }).lean();

                result.recommendations = result.recommendations.map(rec => {
                    const prod = products.find(p => p.productID === rec.productID);
                    return {
                        ...rec,
                        productDetails: prod ? {
                            productID: prod.productID,
                            name: prod.name,
                            price: prod.price,
                            thumbnail: prod.thumbnail,
                            categoryID: prod.categoryID
                        } : null
                    };
                });
            }

            res.status(200).json(result);

        } catch (error) {
            console.error('Error in getBoughtTogetherPython:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy sản phẩm mua cùng',
                error: error.message
            });
        }
    }

    /**
     * API: Lấy gợi ý sản phẩm cho giỏ hàng (NEW - Optimized for Cart)
     * POST /api/cohui/cart-recommendations
     * Body: { cartItems: [productID1, productID2, ...] }
     * 
     * Tính năng:
     * - Phân tích tất cả sản phẩm trong giỏ hàng
     * - Tìm sản phẩm có correlation cao với items trong cart
     * - Aggregate và rank recommendations
     * - Filter duplicate và items đã có trong cart
     */
    static async getCartRecommendations(req, res) {
        try {
            const { cartItems = [] } = req.body;
            const { topN = 8, minCorrelation = 0.5 } = req.query;

            // Validate input
            if (!Array.isArray(cartItems) || cartItems.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Giỏ hàng trống',
                    recommendations: [],
                    cartItems: []
                });
            }

            // Convert to integers
            const cartProductIDs = cartItems.map(id => parseInt(id));
            console.log(`🛒 Cart Recommendations Request: ${cartProductIDs.length} items in cart`);

            // Load correlation map từ CoIUM
            const correlationMapData = loadCorrelationMap();
            
            if (!correlationMapData) {
                console.warn('⚠️  Không có correlation map cho cart recommendations, sử dụng fallback');
                return CoHUIController.getCartRecommendationsFallback(req, res, cartProductIDs, parseInt(topN));
            }

            // Aggregate recommendations từ tất cả items trong cart
            const recommendationScores = {};
            const recommendationSources = {}; // Track sản phẩm nào recommend cái gì
            
            for (const productID of cartProductIDs) {
                const recommendations = correlationMapData[productID];
                
                if (recommendations && recommendations.length > 0) {
                    recommendations.forEach(rec => {
                        const recProductID = rec.productID;
                        
                        // Skip nếu là sản phẩm đang có trong cart
                        if (cartProductIDs.includes(recProductID)) {
                            return;
                        }
                        
                        // Aggregate scores (tính điểm tổng hợp)
                        if (!recommendationScores[recProductID]) {
                            recommendationScores[recProductID] = {
                                totalScore: 0,
                                count: 0,
                                maxCorrelation: 0,
                                sources: []
                            };
                        }
                        
                        const score = rec.correlationScore || 1.0;
                        recommendationScores[recProductID].totalScore += score;
                        recommendationScores[recProductID].count++;
                        recommendationScores[recProductID].maxCorrelation = Math.max(
                            recommendationScores[recProductID].maxCorrelation,
                            score
                        );
                        recommendationScores[recProductID].sources.push(productID);
                    });
                }
            }

            // Calculate final scores và sort
            const rankedRecommendations = Object.entries(recommendationScores)
                .map(([productID, data]) => ({
                    productID: parseInt(productID),
                    avgCorrelation: data.totalScore / data.count,
                    maxCorrelation: data.maxCorrelation,
                    matchCount: data.count, // Số items trong cart match với sản phẩm này
                    sources: data.sources,
                    // Weighted score: avg correlation * match count (càng nhiều items match càng tốt)
                    score: (data.totalScore / data.count) * Math.log(data.count + 1)
                }))
                .filter(rec => rec.avgCorrelation >= parseFloat(minCorrelation))
                .sort((a, b) => b.score - a.score)
                .slice(0, parseInt(topN));

            console.log(`✅ Found ${rankedRecommendations.length} recommendations after filtering`);

            // Lấy thông tin chi tiết sản phẩm từ DB
            if (rankedRecommendations.length > 0) {
                const recommendedProductIDs = rankedRecommendations.map(r => r.productID);
                const products = await Product.find({ 
                    productID: { $in: recommendedProductIDs },
                    isActivated: { $ne: false }
                }).lean();

                // Map với thông tin đầy đủ
                const fullRecommendations = rankedRecommendations
                    .map(rec => {
                        const product = products.find(p => p.productID === rec.productID);
                        if (!product) return null;

                        return {
                            productID: product.productID,
                            name: product.name,
                            price: product.price,
                            thumbnail: product.thumbnail,
                            categoryID: product.categoryID,
                            targetID: product.targetID,
                            // Thống kê
                            avgCorrelation: rec.avgCorrelation,
                            maxCorrelation: rec.maxCorrelation,
                            matchCount: rec.matchCount,
                            score: rec.score,
                            sources: rec.sources,
                            source: 'CoIUM Cart Analysis'
                        };
                    })
                    .filter(r => r !== null);

                res.status(200).json({
                    success: true,
                    message: `Tìm thấy ${fullRecommendations.length} sản phẩm gợi ý cho giỏ hàng`,
                    totalRecommendations: fullRecommendations.length,
                    recommendations: fullRecommendations,
                    cartItems: cartProductIDs,
                    source: 'CoIUM',
                    description: 'Sản phẩm được gợi ý dựa trên correlation với items trong giỏ hàng'
                });
            } else {
                // Không tìm thấy recommendations, dùng fallback
                console.warn('⚠️  Không tìm thấy recommendations phù hợp, sử dụng fallback');
                return CoHUIController.getCartRecommendationsFallback(req, res, cartProductIDs, parseInt(topN));
            }

        } catch (error) {
            console.error('Error in getCartRecommendations:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy gợi ý cho giỏ hàng',
                error: error.message
            });
        }
    }

    /**
     * Fallback cho Cart Recommendations
     * Lấy sản phẩm cùng category với items trong cart
     */
    static async getCartRecommendationsFallback(req, res, cartProductIDs, topN = 8) {
        try {
            // Lấy thông tin các sản phẩm trong cart
            const cartProducts = await Product.find({ 
                productID: { $in: cartProductIDs } 
            }).lean();

            if (cartProducts.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Giỏ hàng trống',
                    recommendations: [],
                    cartItems: cartProductIDs
                });
            }

            // Lấy categories và targets từ cart
            const categories = [...new Set(cartProducts.map(p => p.categoryID))];
            const targets = [...new Set(cartProducts.map(p => p.targetID))];

            // Lấy sản phẩm cùng category/target (chỉ lấy sản phẩm đang hoạt động)
            const recommendations = await Product.find({
                productID: { $nin: cartProductIDs },
                $or: [
                    { categoryID: { $in: categories }, targetID: { $in: targets } },
                    { categoryID: { $in: categories} }
                ],
                isActivated: { $ne: false }
            }).limit(topN).lean();

            const formattedRecommendations = recommendations.map(p => ({
                productID: p.productID,
                name: p.name,
                price: p.price,
                thumbnail: p.thumbnail,
                categoryID: p.categoryID,
                targetID: p.targetID,
                source: 'Fallback (Same Category)'
            }));

            res.status(200).json({
                success: true,
                message: `Gợi ý ${formattedRecommendations.length} sản phẩm liên quan`,
                totalRecommendations: formattedRecommendations.length,
                recommendations: formattedRecommendations,
                cartItems: cartProductIDs,
                source: 'Fallback',
                description: 'Sản phẩm cùng danh mục với items trong giỏ hàng'
            });

        } catch (error) {
            console.error('Error in getCartRecommendationsFallback:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy gợi ý fallback',
                error: error.message
            });
        }
    }

    /**
     * API: Phân tích giỏ hàng và gợi ý (Java real-time)
     * POST /api/cohui/cart-analysis
     * Body: { cartItems: [productID1, productID2, ...] }
     */
    static async analyzeCart(req, res) {
        try {
            const { cartItems = [] } = req.body;
            const { minutil = 0.001, mincor = 0.3, topN = 5, limit = 5000 } = req.query;

            if (!Array.isArray(cartItems) || cartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giỏ hàng trống hoặc không hợp lệ'
                });
            }

            // Lấy dữ liệu đơn hàng với limit
            const ordersData = await CoHUIController.prepareOrdersData(parseInt(limit));

            if (ordersData.length < 2) {
                return res.status(200).json({
                    success: false,
                    message: 'Không đủ dữ liệu để phân tích',
                    recommendations: []
                });
            }

            // Gọi Java service
            const result = await CoHUIController.callJavaService(ordersData, {
                minutil: parseFloat(minutil),
                mincor: parseFloat(mincor)
            });

            // Tìm recommendations liên quan đến cartItems
            const cartItemIDs = cartItems.map(id => parseInt(id));
            const relatedItems = {};

            if (result.success && result.cohuis) {
                for (const cohui of result.cohuis) {
                    const hasCartItem = cohui.items.some(id => cartItemIDs.includes(id));
                    if (hasCartItem) {
                        for (const itemID of cohui.items) {
                            if (!cartItemIDs.includes(itemID)) {
                                if (!relatedItems[itemID]) {
                                    relatedItems[itemID] = { score: 0, count: 0 };
                                }
                                relatedItems[itemID].score += cohui.kulc * cohui.utility;
                                relatedItems[itemID].count++;
                            }
                        }
                    }
                }
            }

            // Sort by score and take topN
            const topRecommendations = Object.entries(relatedItems)
                .sort((a, b) => b[1].score - a[1].score)
                .slice(0, parseInt(topN))
                .map(([productID, data]) => ({
                    productID: parseInt(productID),
                    correlation: data.score,
                    matchCount: data.count
                }));

            // Lấy thông tin chi tiết sản phẩm
            if (topRecommendations.length > 0) {
                const productIDs = topRecommendations.map(r => r.productID);
                const products = await Product.find({
                    productID: { $in: productIDs }
                }).lean();

                const recommendations = topRecommendations.map(rec => {
                    const prod = products.find(p => p.productID === rec.productID);
                    return {
                        ...rec,
                        productDetails: prod ? {
                            productID: prod.productID,
                            name: prod.name,
                            price: prod.price,
                            thumbnail: prod.thumbnail,
                            categoryID: prod.categoryID
                        } : null
                    };
                });

                res.status(200).json({
                    success: true,
                    totalPatterns: result.totalPatterns,
                    recommendations,
                    source: 'CoHUI_CaiTien (Java)'
                });
            } else {
                res.status(200).json({
                    success: true,
                    totalPatterns: result.totalPatterns || 0,
                    recommendations: [],
                    message: 'Không tìm thấy patterns liên quan đến giỏ hàng',
                    source: 'CoHUI_CaiTien (Java)'
                });
            }

        } catch (error) {
            console.error('Error in analyzeCart:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi phân tích giỏ hàng',
                error: error.message
            });
        }
    }

    /**
     * API: Lấy thống kê CoHUI patterns
     * GET /api/cohui/statistics
     * Ưu tiên đọc từ metrics.json (đã lưu từ pipeline), fallback chạy Java real-time
     */
    static async getStatistics(req, res) {
        try {
            const { minutil = 0.001, mincor = 0.3 } = req.query;

            // Ưu tiên đọc metrics.json đã lưu sẵn
            const metricsPath = path.join(__dirname, '../CoIUM/metrics.json');
            if (fs.existsSync(metricsPath)) {
                const metricsData = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
                const statistics = {
                    totalOrders: metricsData.total_transactions || 0,
                    totalPatterns: metricsData.patterns_count || 0,
                    runtime: metricsData.runtime || 0,
                    memory: metricsData.memory || 0,
                    algorithm: metricsData.algorithm || 'CoHUI_CaiTien (Java)',
                    parameters: {
                        minutil: metricsData.minutil || minutil,
                        mincor: metricsData.mincor || mincor,
                        abs_minutil: metricsData.abs_minutil || 0
                    },
                    timestamp: metricsData.timestamp || 0
                };

                return res.status(200).json({
                    success: true,
                    statistics,
                    source: 'cached metrics'
                });
            }

            // Fallback: chạy Java real-time
            const ordersData = await CoHUIController.prepareOrdersData();

            if (ordersData.length < 2) {
                return res.status(200).json({
                    success: false,
                    message: 'Không đủ dữ liệu để phân tích',
                    statistics: null
                });
            }

            const result = await CoHUIController.callJavaService(ordersData, {
                minutil: parseFloat(minutil),
                mincor: parseFloat(mincor)
            });

            const statistics = {
                totalOrders: ordersData.length,
                totalPatterns: result.totalPatterns || 0,
                runtime: (result.runtime_ms || 0) / 1000,
                memory: result.memory_mb || 0,
                algorithm: 'CoHUI_CaiTien (Java)',
                parameters: {
                    minutil,
                    mincor
                }
            };

            res.status(200).json({
                success: true,
                statistics,
                source: 'real-time Java analysis'
            });

        } catch (error) {
            console.error('Error in getStatistics:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thống kê',
                error: error.message
            });
        }
    }
}

module.exports = CoHUIController;
