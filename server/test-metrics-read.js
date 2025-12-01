/**
 * TEST: Kiểm tra Backend có đọc được metrics.json không
 */

const path = require('path');
const fs = require('fs').promises;

async function testReadMetrics() {
    console.log('='.repeat(60));
    console.log('TEST: ĐỌC METRICS.JSON TỪ BACKEND');
    console.log('='.repeat(60) + '\n');
    
    const serverPath = __dirname;
    const projectRoot = path.join(serverPath, '..');
    const coiumPath = path.join(projectRoot, 'CoIUM_Final');
    const metricsPath = path.join(coiumPath, 'metrics.json');
    
    console.log('Paths:');
    console.log('  Server:', serverPath);
    console.log('  Project Root:', projectRoot);
    console.log('  CoIUM:', coiumPath);
    console.log('  Metrics:', metricsPath);
    console.log();
    
    // Test 1: File tồn tại
    try {
        const stats = await fs.stat(metricsPath);
        console.log('✅ File tồn tại');
        console.log('   Size:', stats.size, 'bytes');
        console.log('   Modified:', stats.mtime);
        console.log();
    } catch (error) {
        console.error('❌ File KHÔNG tồn tại:', error.message);
        return;
    }
    
    // Test 2: Đọc file
    try {
        const metricsData = await fs.readFile(metricsPath, 'utf8');
        console.log('✅ Đọc file thành công');
        console.log('   Content length:', metricsData.length, 'chars');
        console.log();
        
        // Test 3: Parse JSON
        const metricsJson = JSON.parse(metricsData);
        console.log('✅ Parse JSON thành công');
        console.log('   Keys:', Object.keys(metricsJson));
        console.log();
        
        // Test 4: Extract metrics
        const metrics = {
            runtime: metricsJson.runtime || 0,
            memory: metricsJson.memory || 0,
            patternsCount: metricsJson.patterns_count || 0,
            minutil: metricsJson.minutil || 0.001,
            mincor: metricsJson.mincor || 0.5,
            timestamp: metricsJson.timestamp || Date.now()
        };
        
        console.log('✅ Extract metrics thành công:');
        console.log('   Runtime:', metrics.runtime, 's');
        console.log('   Memory:', metrics.memory, 'MB');
        console.log('   Patterns:', metrics.patternsCount);
        console.log('   MinUtil:', metrics.minutil);
        console.log('   MinCor:', metrics.mincor);
        console.log('   Timestamp:', new Date(metrics.timestamp * 1000).toLocaleString());
        console.log();
        
        console.log('='.repeat(60));
        console.log('✅ TẤT CẢ TEST PASS!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error('   Stack:', error.stack);
    }
}

testReadMetrics();
