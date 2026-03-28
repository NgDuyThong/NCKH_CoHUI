const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const fs = require('fs').promises;
const execPromise = util.promisify(exec);

// Hàm chạy toàn bộ quy trình CoHUI (Java thay thế Python)
const runCoIUMProcess = async (req, res) => {
    try {
        const serverPath = path.join(__dirname, '..');
        const projectRoot = path.join(serverPath, '..');
        const coiumDataPath = path.join(serverPath, 'CoIUM');
        const javaPath = path.join(projectRoot, 'CoHUI_CaiTien_RU_LA_KUL');
        const jarPath = path.join(javaPath, 'CoHUI_Server.jar');

        console.log('Bắt đầu quy trình CoHUI (Java)...');
        console.log('Server path:', serverPath);
        console.log('CoIUM data path:', coiumDataPath);
        console.log('Java path:', javaPath);

        // ===== Bước 1: Export orders từ MongoDB =====
        console.log('Bước 1/4: Export orders từ MongoDB...');
        const exportCmd = `node "${path.join(coiumDataPath, 'export-orders-for-coium.js')}"`;
        const { stdout: exportOutput, stderr: exportError } = await execPromise(exportCmd, {
            cwd: serverPath,
            maxBuffer: 10 * 1024 * 1024
        });

        if (exportError) {
            console.error('Export stderr:', exportError);
        }
        console.log('Export output:', exportOutput);

        // Đọc export_stats.json để tính minUtil
        const statsPath = path.join(coiumDataPath, 'export_stats.json');
        const statsData = JSON.parse(await fs.readFile(statsPath, 'utf8'));

        // Tính minUtil absolute từ ratio * totalDatasetUtility
        const minUtilRatio = 0.0001;
        const minCor = 0.5;
        const absMinUtil = Math.round(minUtilRatio * statsData.totalDatasetUtility);
        const maxTransactions = 99999;

        console.log(`   Tính minUtil: ${minUtilRatio} * ${statsData.totalDatasetUtility} = ${absMinUtil}`);

        // ===== Bước 2: Chạy CoHUI algorithm (Java) =====
        console.log('Bước 2/4: Chạy CoHUI algorithm (Java)...');
        const inputFile = path.join(coiumDataPath, 'fashion_store_utility.dat');
        const javaCmd = `java -jar "${jarPath}" "${inputFile}" ${maxTransactions} ${absMinUtil} ${minCor}`;

        console.log(`   Java command: ${javaCmd}`);

        const { stdout: javaOutput, stderr: javaError } = await execPromise(javaCmd, {
            cwd: javaPath,
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large output
            timeout: 300000 // 5 minutes timeout
        });

        if (javaError) {
            console.error('Java stderr:', javaError);
        }

        // Parse JSON output từ Java
        let cohuiResult;
        try {
            cohuiResult = JSON.parse(javaOutput);
        } catch (parseErr) {
            console.error('Java stdout (first 500 chars):', javaOutput.substring(0, 500));
            throw new Error(`Failed to parse Java output: ${parseErr.message}`);
        }

        console.log(`   CoHUI count: ${cohuiResult.cohui_count}`);
        console.log(`   Runtime: ${cohuiResult.runtime_ms} ms`);
        console.log(`   Memory: ${cohuiResult.memory_mb} MB`);

        // Lưu Java output để Step 3 đọc
        const cohuiOutputPath = path.join(coiumDataPath, 'cohui_output.json');
        await fs.writeFile(cohuiOutputPath, JSON.stringify(cohuiResult, null, 2), 'utf8');

        // Lưu metrics.json
        const metricsPath = path.join(coiumDataPath, 'metrics.json');
        const metrics = {
            runtime: cohuiResult.runtime_ms / 1000, // convert to seconds
            memory: cohuiResult.memory_mb,
            patterns_count: cohuiResult.cohui_count,
            total_transactions: cohuiResult.total_transactions,
            total_items: cohuiResult.total_items,
            minutil: minUtilRatio,
            mincor: minCor,
            abs_minutil: absMinUtil,
            timestamp: Math.floor(Date.now() / 1000),
            algorithm: 'CoHUI_CaiTien (Java)'
        };
        await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2), 'utf8');
        console.log('   Đã lưu metrics.json');

        // ===== Bước 3: Build correlation recommendations (Node.js thay Python) =====
        console.log('Bước 3/4: Build correlation recommendations...');
        const buildCmd = `node "${path.join(coiumDataPath, 'build-correlation-from-cohui.js')}"`;
        const { stdout: buildOutput, stderr: buildError } = await execPromise(buildCmd, {
            cwd: coiumDataPath,
            maxBuffer: 10 * 1024 * 1024
        });

        if (buildError) {
            console.error('Build stderr:', buildError);
        }
        console.log('Build output:', buildOutput);

        // ===== Bước 4: Generate correlation map =====
        console.log('Bước 4/4: Generate correlation map...');
        const generateCmd = `node "${path.join(coiumDataPath, 'generate-correlation-map.js')}"`;
        const { stdout: generateOutput, stderr: generateError } = await execPromise(generateCmd, {
            cwd: serverPath,
            maxBuffer: 10 * 1024 * 1024
        });

        if (generateError) {
            console.error('Generate stderr:', generateError);
        }
        console.log('Generate output:', generateOutput);

        // Đọc file correlation_map.json để lấy số lượng sản phẩm
        const correlationMapPath = path.join(coiumDataPath, 'correlation_map.json');
        let totalProducts = 0;
        let totalRecommendations = 0;

        try {
            const correlationMapData = await fs.readFile(correlationMapPath, 'utf8');
            const correlationMap = JSON.parse(correlationMapData);
            totalProducts = Object.keys(correlationMap).length;

            Object.values(correlationMap).forEach(recommendations => {
                totalRecommendations += recommendations.length;
            });
        } catch (error) {
            console.error('Lỗi khi đọc correlation_map.json:', error.message);
        }

        console.log('Hoàn thành quy trình CoHUI!');
        console.log(`Tổng số sản phẩm: ${totalProducts}`);
        console.log(`Tổng số recommendations: ${totalRecommendations}`);

        res.json({
            success: true,
            message: 'Chạy CoHUI thành công!',
            data: {
                totalProducts,
                totalRecommendations,
                avgRecommendationsPerProduct: totalProducts > 0 ? (totalRecommendations / totalProducts).toFixed(2) : 0,
                runtime: metrics.runtime,
                memory: metrics.memory,
                patternsCount: metrics.patterns_count,
                minutil: metrics.minutil,
                mincor: metrics.mincor,
                metricsTimestamp: metrics.timestamp
            }
        });
    } catch (error) {
        console.error('❌ Lỗi trong runCoIUMProcess:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi chạy CoHUI',
            error: error.message
        });
    }
};

module.exports = {
    runCoIUMProcess
};
