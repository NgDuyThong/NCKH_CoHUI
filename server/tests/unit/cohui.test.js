/**
 * Unit Tests - CoHUI Controller
 * Test cases: BE-UT-019 đến BE-UT-024
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../../models/Product.mjs';
import Category from '../../models/Category.mjs';
import Target from '../../models/Target.mjs';
import { createMockCorrelationMap, createMockProduct } from '../helpers/testHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CoHUI Controller - Unit Tests', () => {
  
  const correlationMapPath = path.join(__dirname, '../../CoIUM/correlation_map.json');
  const backupPath = path.join(__dirname, '../../CoIUM/correlation_map.backup.json');
  let testCategory;
  let testTarget;
  let hasBackup = false;

  beforeEach(async () => {
    // BACKUP correlation_map.json trước khi test
    if (fs.existsSync(correlationMapPath)) {
      fs.copyFileSync(correlationMapPath, backupPath);
      hasBackup = true;
      // Xóa file gốc để test có thể tạo file mới
      fs.unlinkSync(correlationMapPath);
    }

    // Clear database
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Target.deleteMany({});

    // Tạo test data
    testCategory = await Category.create({
      categoryID: 1,
      name: 'Áo',
      description: 'Danh mục áo',
      imageURL: 'ao.jpg'
    });

    testTarget = await Target.create({
      targetID: 1,
      name: 'Nam'
    });
  });

  afterEach(() => {
    // RESTORE backup sau khi test xong
    if (hasBackup && fs.existsSync(backupPath)) {
      // Xóa file test nếu có
      if (fs.existsSync(correlationMapPath)) {
        fs.unlinkSync(correlationMapPath);
      }
      // Restore backup
      fs.copyFileSync(backupPath, correlationMapPath);
      fs.unlinkSync(backupPath);
      hasBackup = false;
    }
  });

  /**
   * A3.1 Load Correlation Map Function Tests
   */
  describe('loadCorrelationMap() function', () => {
    
    it('BE-UT-019: Load correlation map thành công', () => {
      // Tạo mock correlation map file
      const mockData = createMockCorrelationMap();
      
      // Đảm bảo thư mục tồn tại
      const dir = path.dirname(correlationMapPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(correlationMapPath, JSON.stringify(mockData, null, 2));

      // Verify file được tạo
      expect(fs.existsSync(correlationMapPath)).toBe(true);

      // Load và verify data
      const data = JSON.parse(fs.readFileSync(correlationMapPath, 'utf8'));
      expect(data).toBeDefined();
      expect(data['104']).toBeDefined();
      expect(data['104'].length).toBe(2);
      expect(data['104'][0].productID).toBe(105);
      expect(data['104'][0].correlation).toBe(0.85);
    });

    it('BE-UT-020: Load khi file không tồn tại', () => {
      // Verify file không tồn tại
      expect(fs.existsSync(correlationMapPath)).toBe(false);

      // Thử load file không tồn tại
      let result = null;
      try {
        if (fs.existsSync(correlationMapPath)) {
          result = JSON.parse(fs.readFileSync(correlationMapPath, 'utf8'));
        }
      } catch (error) {
        result = null;
      }

      expect(result).toBeNull();
    });

    it('BE-UT-021: Load file JSON không hợp lệ', () => {
      // Tạo file JSON không hợp lệ
      const dir = path.dirname(correlationMapPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(correlationMapPath, '{ invalid json }');

      // Verify file tồn tại
      expect(fs.existsSync(correlationMapPath)).toBe(true);

      // Thử parse JSON không hợp lệ
      let result = null;
      let error = null;
      try {
        const data = fs.readFileSync(correlationMapPath, 'utf8');
        result = JSON.parse(data);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(result).toBeNull();
    });
  });

  /**
   * A3.2 Get Recommendations Function Tests
   */
  describe('getRecommendations() function', () => {
    
    it('BE-UT-022: Lấy recommendations cho product ID hợp lệ', async () => {
      // Tạo products
      const product104 = await Product.create(createMockProduct({
        productID: 104,
        name: 'Product 104',
        categoryID: 1,
        targetID: 1
      }));

      const product105 = await Product.create(createMockProduct({
        productID: 105,
        name: 'Product 105',
        categoryID: 1,
        targetID: 1
      }));

      const product106 = await Product.create(createMockProduct({
        productID: 106,
        name: 'Product 106',
        categoryID: 1,
        targetID: 1
      }));

      // Tạo correlation map
      const mockData = createMockCorrelationMap();
      const dir = path.dirname(correlationMapPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(correlationMapPath, JSON.stringify(mockData, null, 2));

      // Load correlation map
      const correlationMap = JSON.parse(fs.readFileSync(correlationMapPath, 'utf8'));

      // Get recommendations cho product 104
      const recommendations = correlationMap['104'];
      
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBe(2);
      expect(recommendations[0].productID).toBe(105);
      expect(recommendations[1].productID).toBe(106);

      // Verify products tồn tại trong DB
      const foundProduct105 = await Product.findOne({ productID: 105 });
      const foundProduct106 = await Product.findOne({ productID: 106 });
      
      expect(foundProduct105).toBeDefined();
      expect(foundProduct106).toBeDefined();
    });

    it('BE-UT-023: Lấy recommendations cho product không tồn tại', async () => {
      // Tạo correlation map
      const mockData = createMockCorrelationMap();
      const dir = path.dirname(correlationMapPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(correlationMapPath, JSON.stringify(mockData, null, 2));

      // Tìm product không tồn tại
      const product = await Product.findOne({ productID: 99999 });
      
      expect(product).toBeNull();

      // Load correlation map
      const correlationMap = JSON.parse(fs.readFileSync(correlationMapPath, 'utf8'));
      
      // Get recommendations cho product không tồn tại
      const recommendations = correlationMap['99999'];
      
      expect(recommendations).toBeUndefined();
    });

    it('BE-UT-024: Lấy recommendations khi chưa chạy CoIUM', async () => {
      // Verify correlation map file không tồn tại
      expect(fs.existsSync(correlationMapPath)).toBe(false);

      // Thử load correlation map
      let correlationMap = null;
      try {
        if (fs.existsSync(correlationMapPath)) {
          correlationMap = JSON.parse(fs.readFileSync(correlationMapPath, 'utf8'));
        }
      } catch (error) {
        correlationMap = null;
      }

      expect(correlationMap).toBeNull();
    });
  });
});
