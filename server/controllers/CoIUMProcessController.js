const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const fs = require('fs').promises;
const execPromise = util.promisify(exec);

// Hàm chạy toàn bộ quy trình CoIUM
const runCoIUMProcess = async (req, res) => {
    try {
        const serverPath = path.join(__dirname, '..');
        const projectRoot = path.join(serverPath, '..');
        const coiumPath = path.join(projectRoot, 'CoIUM_Final');
        
        console.log('Bắt đầu quy trình CoIUM...');
        console.log('Server path:', serverPath);
        console.log('Project root:', projectRoot);
        console.log('CoIUM path:', coiumPath);
        
        // Bước 1: Export orders từ MongoDB
        console.log('Bước 1/4: Export orders từ MongoDB...');
        const exportCmd = `node "${path.join(serverPath, 'CoIUM', 'export-orders-for-coium.js')}"`;
        const { stdout: exportOutput, stderr: exportError } = await execPromise(exportCmd, {
            cwd: serverPath,
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        
        if (exportError) {
            console.error('Export stderr:', exportError);
        }
        console.log('Export output:', exportOutput);
        
        // Bước 2: Chạy CoIUM algorithm
        console.log('Bước 2/4: Chạy CoIUM algorithm...');
        const pythonCmd = `python run_fashion_store.py`;
        const { stdout: pythonOutput, stderr: pythonError } = await execPromise(pythonCmd, {
            cwd: coiumPath,
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 300000 // 5 minutes timeout
        });
        
        if (pythonError && !pythonError.includes('WARNING')) {
            console.error('Python stderr:', pythonError);
        }
        console.log('Python output:', pythonOutput);
        
        // Bước 3: Phân tích correlation
        console.log('Bước 3/4: Phân tích correlation...');
        const analyzeCmd = `python analyze_correlation_results.py`;
        const { stdout: analyzeOutput, stderr: analyzeError } = await execPromise(analyzeCmd, {
            cwd: coiumPath,
            maxBuffer: 10 * 1024 * 1024
        });
        
        if (analyzeError && !analyzeError.includes('WARNING')) {
            console.error('Analyze stderr:', analyzeError);
        }
        console.log('Analyze output:', analyzeOutput);
        
        // Bước 4: Generate correlation map
        console.log('Bước 4/4: Generate correlation map...');
        const generateCmd = `node "${path.join(serverPath, 'CoIUM', 'generate-correlation-map.js')}"`;
        const { stdout: generateOutput, stderr: generateError } = await execPromise(generateCmd, {
            cwd: serverPath,
            maxBuffer: 10 * 1024 * 1024
        });
        
        if (generateError) {
            console.error('Generate stderr:', generateError);
        }
        console.log('Generate output:', generateOutput);
        
        // Đọc file correlation_map.json để lấy số lượng sản phẩm
        const correlationMapPath = path.join(serverPath, 'CoIUM', 'correlation_map.json');
        let totalProducts = 0;
        let totalRecommendations = 0;
        
        try {
            const correlationMapData = await fs.readFile(correlationMapPath, 'utf8');
            const correlationMap = JSON.parse(correlationMapData);
            totalProducts = Object.keys(correlationMap).length;
            
            // Đếm tổng số recommendations
            Object.values(correlationMap).forEach(recommendations => {
                totalRecommendations += recommendations.length;
            });
        } catch (error) {
            console.error('Lỗi khi đọc correlation_map.json:', error.message);
        }
        
        console.log('Hoàn thành quy trình CoIUM!');
        console.log(`Tổng số sản phẩm: ${totalProducts}`);
        console.log(`Tổng số recommendations: ${totalRecommendations}`);
        
        // ===== ĐỌC METRICS TỪ PYTHON =====
        const metricsPath = path.join(coiumPath, 'metrics.json');
        let metrics = {
            runtime: 0,
            memory: 0,
            patternsCount: 0,
            minutil: 0.001,
            mincor: 0.5
        };
        
        try {
            const metricsData = await fs.readFile(metricsPath, 'utf8');
            const metricsJson = JSON.parse(metricsData);
            metrics = {
                runtime: metricsJson.runtime || 0,
                memory: metricsJson.memory || 0,
                patternsCount: metricsJson.patterns_count || 0,
                minutil: metricsJson.minutil || 0.001,
                mincor: metricsJson.mincor || 0.5,
                timestamp: metricsJson.timestamp || Date.now()
            };
            console.log('✅ Đã đọc metrics từ Python');
            console.log(`   📊 Runtime: ${metrics.runtime}s`);
            console.log(`   💾 Memory: ${metrics.memory} MB`);
            console.log(`   🔍 Patterns: ${metrics.patternsCount}`);
        } catch (error) {
            console.warn('⚠️  Không đọc được metrics.json:', error.message);
            console.warn('   Sử dụng giá trị mặc định');
        }
        
        res.json({
            success: true,
            message: 'Chạy CoIUM thành công!',
            data: {
                totalProducts,
                totalRecommendations,
                avgRecommendationsPerProduct: totalProducts > 0 ? (totalRecommendations / totalProducts).toFixed(2) : 0,
                // NEW: Real metrics from Python
                runtime: metrics.runtime,
                memory: metrics.memory,
                patternsCount: metrics.patternsCount,
                minutil: metrics.minutil,
                mincor: metrics.mincor,
                metricsTimestamp: metrics.timestamp
            }
        });
    } catch (error) {
        console.error('❌ Lỗi trong runCoIUMProcess:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi chạy CoIUM',
            error: error.message
        });
    }
};

module.exports = {
    runCoIUMProcess
};
