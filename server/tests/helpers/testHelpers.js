/**
 * Test Helper Functions
 * Các hàm tiện ích dùng chung cho tests
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

/**
 * Tạo mock user data
 */
const createMockUser = (overrides = {}) => {
  return {
    userID: Date.now(),
    fullname: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    phone: '0901234567',
    gender: 'male',
    role: 'customer',
    isActivated: true,
    loginAttempts: 0,
    lockUntil: null,
    ...overrides
  };
};

/**
 * Tạo mock admin user
 */
const createMockAdmin = (overrides = {}) => {
  return createMockUser({
    email: 'admin@example.com',
    role: 'admin',
    ...overrides
  });
};

/**
 * Tạo mock product data
 */
const createMockProduct = (overrides = {}) => {
  return {
    productID: Date.now(),
    name: 'Test Product',
    description: 'Test product description',
    price: 200000,
    categoryID: 1,
    targetID: 1,
    isActivated: true,
    createdAt: new Date(),
    ...overrides
  };
};

/**
 * Tạo mock order data
 */
const createMockOrder = (overrides = {}) => {
  return {
    orderID: Date.now(),
    userID: 12345,
    fullname: 'Test User',
    phone: '0901234567',
    address: '123 Test Street',
    totalPrice: 500000,
    paymentPrice: 500000,
    orderStatus: 'pending',
    shippingStatus: 'preparing',
    paymentMethod: 'cod',
    isPayed: false,
    createdAt: new Date(),
    ...overrides
  };
};

/**
 * Generate JWT token cho testing
 */
const generateTestToken = (userID, role = 'customer') => {
  return jwt.sign(
    { userID, role },
    process.env.JWT_SECRET || 'test_jwt_secret',
    { expiresIn: '24h' }
  );
};

/**
 * Hash password cho testing
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

/**
 * Compare password cho testing
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Tạo mock request object
 */
const createMockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  };
};

/**
 * Tạo mock response object
 */
const createMockResponse = () => {
  const res = {
    statusCode: 200,
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    },
    send: function(data) {
      this.data = data;
      return this;
    }
  };
  return res;
};

/**
 * Wait helper cho async operations
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Tạo mock correlation map data
 */
const createMockCorrelationMap = () => {
  return {
    '104': [
      { productID: 105, correlation: 0.85, frequency: 50 },
      { productID: 106, correlation: 0.75, frequency: 40 }
    ],
    '105': [
      { productID: 104, correlation: 0.85, frequency: 50 },
      { productID: 107, correlation: 0.65, frequency: 30 }
    ]
  };
};

/**
 * Clean up test data
 */
const cleanupTestData = async (Model) => {
  if (Model && Model.deleteMany) {
    await Model.deleteMany({});
  }
};

// Export all functions
export {
  createMockUser,
  createMockAdmin,
  createMockProduct,
  createMockOrder,
  generateTestToken,
  hashPassword,
  comparePassword,
  createMockRequest,
  createMockResponse,
  wait,
  createMockCorrelationMap,
  cleanupTestData
};
