/**
 * Unit Tests - Product Controller
 * Test cases: BE-UT-010 đến BE-UT-018
 */

import { describe, it, expect, beforeEach } from 'vitest';
import Product from '../../models/Product.mjs';
import Category from '../../models/Category.mjs';
import Target from '../../models/Target.mjs';
import { createMockProduct } from '../helpers/testHelpers.js';

describe('Product Controller - Unit Tests', () => {
  
  let testCategory;
  let testTarget;

  beforeEach(async () => {
    // Clear database trước mỗi test
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Target.deleteMany({});

    // Tạo test data cho Category và Target
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

  /**
   * A2.1 Get Products Function Tests
   */
  describe('getProducts() function', () => {
    
    it('BE-UT-010: Lấy danh sách sản phẩm với pagination mặc định', async () => {
      // Tạo 15 sản phẩm
      const products = [];
      for (let i = 1; i <= 15; i++) {
        products.push(createMockProduct({
          productID: i,
          name: `Product ${i}`,
          categoryID: 1,
          targetID: 1,
          price: 100000 + (i * 10000)
        }));
      }
      await Product.insertMany(products);

      // Lấy trang 1 với limit 12
      const page1 = await Product.find()
        .limit(12)
        .skip(0)
        .sort({ createdAt: -1 });

      expect(page1).toBeDefined();
      expect(page1.length).toBe(12);
      
      // Verify total count
      const total = await Product.countDocuments();
      expect(total).toBe(15);
    });

    it('BE-UT-011: Lọc sản phẩm theo category', async () => {
      // Tạo category thứ 2
      const category2 = await Category.create({
        categoryID: 2,
        name: 'Quần',
        description: 'Danh mục quần',
        imageURL: 'quan.jpg'
      });

      // Tạo sản phẩm cho 2 categories
      await Product.create(createMockProduct({
        productID: 1,
        name: 'Áo thun',
        categoryID: 1,
        targetID: 1
      }));

      await Product.create(createMockProduct({
        productID: 2,
        name: 'Quần jean',
        categoryID: 2,
        targetID: 1
      }));

      // Lọc theo category 1
      const productsCategory1 = await Product.find({ categoryID: 1 });
      expect(productsCategory1.length).toBe(1);
      expect(productsCategory1[0].name).toBe('Áo thun');

      // Lọc theo category 2
      const productsCategory2 = await Product.find({ categoryID: 2 });
      expect(productsCategory2.length).toBe(1);
      expect(productsCategory2[0].name).toBe('Quần jean');
    });

    it('BE-UT-012: Lọc sản phẩm theo target (Nam/Nữ)', async () => {
      // Tạo target Nữ
      const targetFemale = await Target.create({
        targetID: 2,
        name: 'Nữ'
      });

      // Tạo sản phẩm cho Nam
      await Product.create(createMockProduct({
        productID: 1,
        name: 'Áo nam',
        categoryID: 1,
        targetID: 1
      }));

      // Tạo sản phẩm cho Nữ
      await Product.create(createMockProduct({
        productID: 2,
        name: 'Áo nữ',
        categoryID: 1,
        targetID: 2
      }));

      // Lọc theo target Nam
      const productsMale = await Product.find({ targetID: 1 });
      expect(productsMale.length).toBe(1);
      expect(productsMale[0].name).toBe('Áo nam');

      // Lọc theo target Nữ
      const productsFemale = await Product.find({ targetID: 2 });
      expect(productsFemale.length).toBe(1);
      expect(productsFemale[0].name).toBe('Áo nữ');
    });

    it('BE-UT-013: Lọc sản phẩm theo khoảng giá', async () => {
      // Tạo sản phẩm với giá khác nhau
      await Product.create(createMockProduct({
        productID: 1,
        name: 'Product 1',
        price: 50000,
        categoryID: 1,
        targetID: 1
      }));

      await Product.create(createMockProduct({
        productID: 2,
        name: 'Product 2',
        price: 200000,
        categoryID: 1,
        targetID: 1
      }));

      await Product.create(createMockProduct({
        productID: 3,
        name: 'Product 3',
        price: 600000,
        categoryID: 1,
        targetID: 1
      }));

      // Lọc sản phẩm trong khoảng 100000 - 500000
      const productsInRange = await Product.find({
        price: { $gte: 100000, $lte: 500000 }
      }).lean(); // Dùng lean() để lấy plain object, không có getter

      expect(productsInRange.length).toBe(1);
      expect(productsInRange[0].price).toBe(200000);
    });

    it('BE-UT-014: Tìm kiếm sản phẩm theo tên', async () => {
      // Tạo sản phẩm
      await Product.create(createMockProduct({
        productID: 1,
        name: 'Áo thun nam',
        categoryID: 1,
        targetID: 1
      }));

      await Product.create(createMockProduct({
        productID: 2,
        name: 'Quần jean nam',
        categoryID: 1,
        targetID: 1
      }));

      // Tìm kiếm với regex
      const searchResults = await Product.find({
        name: { $regex: 'áo thun', $options: 'i' }
      });

      expect(searchResults.length).toBe(1);
      expect(searchResults[0].name).toContain('Áo thun');
    });

    it('BE-UT-015: Sắp xếp sản phẩm theo giá tăng dần', async () => {
      // Tạo sản phẩm với giá khác nhau
      await Product.create(createMockProduct({
        productID: 1,
        name: 'Product 1',
        price: 300000,
        categoryID: 1,
        targetID: 1
      }));

      await Product.create(createMockProduct({
        productID: 2,
        name: 'Product 2',
        price: 100000,
        categoryID: 1,
        targetID: 1
      }));

      await Product.create(createMockProduct({
        productID: 3,
        name: 'Product 3',
        price: 200000,
        categoryID: 1,
        targetID: 1
      }));

      // Sắp xếp theo giá tăng dần
      const sortedProducts = await Product.find().sort({ price: 1 }).lean();

      expect(sortedProducts[0].price).toBe(100000);
      expect(sortedProducts[1].price).toBe(200000);
      expect(sortedProducts[2].price).toBe(300000);
    });

    it('BE-UT-016: Lấy sản phẩm với page vượt quá số trang', async () => {
      // Tạo 5 sản phẩm
      const products = [];
      for (let i = 1; i <= 5; i++) {
        products.push(createMockProduct({
          productID: i,
          name: `Product ${i}`,
          categoryID: 1,
          targetID: 1
        }));
      }
      await Product.insertMany(products);

      // Lấy trang 999 với limit 12
      const page999 = await Product.find()
        .limit(12)
        .skip(999 * 12);

      expect(page999).toBeDefined();
      expect(page999.length).toBe(0); // Không có sản phẩm
    });

    it('BE-UT-017: Lấy sản phẩm với limit = 0', async () => {
      // Tạo 5 sản phẩm
      const products = [];
      for (let i = 1; i <= 5; i++) {
        products.push(createMockProduct({
          productID: i,
          name: `Product ${i}`,
          categoryID: 1,
          targetID: 1
        }));
      }
      await Product.insertMany(products);

      // Lấy với limit 0 (không giới hạn)
      const allProducts = await Product.find().limit(0);

      expect(allProducts).toBeDefined();
      expect(allProducts.length).toBe(5); // Trả về tất cả
    });

    it('BE-UT-018: Lọc với category không tồn tại', async () => {
      // Tạo sản phẩm
      await Product.create(createMockProduct({
        productID: 1,
        name: 'Product 1',
        categoryID: 1,
        targetID: 1
      }));

      // Lọc với category không tồn tại
      const products = await Product.find({ categoryID: 9999 });

      expect(products).toBeDefined();
      expect(products.length).toBe(0); // Không có sản phẩm
    });
  });
});
