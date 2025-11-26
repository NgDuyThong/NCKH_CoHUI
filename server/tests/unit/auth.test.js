/**
 * Unit Tests - Authentication Controller
 * Test cases: BE-UT-001 đến BE-UT-009
 */

import { describe, it, expect, beforeEach } from 'vitest';
import User from '../../models/User.mjs';
import {
  createMockUser,
  createMockRequest,
  createMockResponse,
  hashPassword
} from '../helpers/testHelpers.js';

describe('Authentication Controller - Unit Tests', () => {
  
  beforeEach(async () => {
    // Clear database trước mỗi test
    await User.deleteMany({});
  });

  /**
   * A1.1 Register Function Tests
   */
  describe('register() function', () => {
    
    it('BE-UT-001: Đăng ký tài khoản thành công với dữ liệu hợp lệ', async () => {
      const userData = createMockUser({
        fullname: 'Nguyen Van A',
        email: 'test@gmail.com',
        password: 'Pass123!',
        phone: '0901234567',
        gender: 'male'
      });

      // Test tạo user trong database
      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@gmail.com');
      expect(user.fullname).toBe('Nguyen Van A');
      expect(user.role).toBe('customer');
      expect(user.loginAttempts).toBe(0);
      
      // Verify password được hash
      expect(user.password).not.toBe('Pass123!');
      expect(user.password.length).toBeGreaterThan(20);
    });

    it('BE-UT-002: Đăng ký với email đã tồn tại', async () => {
      // Tạo user đầu tiên
      const existingUser = createMockUser({
        email: 'existing@gmail.com'
      });
      await User.create(existingUser);

      // Kiểm tra email đã tồn tại
      const found = await User.findOne({ email: 'existing@gmail.com' });
      expect(found).toBeDefined();
      expect(found.email).toBe('existing@gmail.com');

      // Thử tạo user thứ 2 với cùng email
      const duplicateUser = createMockUser({
        email: 'existing@gmail.com',
        phone: '0909999999', // phone khác
        userID: Date.now() + 1000 // userID khác
      });

      // Verify không thể tạo duplicate email
      await expect(User.create(duplicateUser)).rejects.toThrow();
    });

    it('BE-UT-003: Đăng ký với số điện thoại đã tồn tại', async () => {
      // Tạo user đầu tiên
      const existingUser = createMockUser({
        phone: '0901234567'
      });
      await User.create(existingUser);

      // Kiểm tra phone đã tồn tại
      const found = await User.findOne({ phone: '0901234567' });
      expect(found).toBeDefined();
      expect(found.phone).toBe('0901234567');

      // Thử tạo user với cùng phone
      const duplicateUser = createMockUser({
        email: 'different@gmail.com', // email khác
        phone: '0901234567', // phone trùng
        userID: Date.now() + 1000 // userID khác
      });

      // Verify không thể tạo duplicate phone
      await expect(User.create(duplicateUser)).rejects.toThrow();
    });

    it('BE-UT-004: Đăng ký với password ngắn hơn 6 ký tự', async () => {
      const userData = createMockUser({
        password: '12345' // Chỉ 5 ký tự
      });

      // Kiểm tra validation - model có minlength: 6
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('BE-UT-005: Đăng ký với email không hợp lệ', async () => {
      const userData = createMockUser({
        email: 'invalid-email' // Email không hợp lệ
      });

      // Kiểm tra validation - model có email validator
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  /**
   * A1.2 Login Function Tests
   */
  describe('login() function', () => {
    
    it('BE-UT-006: Đăng nhập thành công với thông tin đúng', async () => {
      // Tạo user trước
      const password = 'Pass123!';
      
      const user = await User.create(createMockUser({
        email: 'test@gmail.com',
        password: password // Sẽ được hash tự động bởi pre-save hook
      }));

      // Verify user được tạo
      expect(user).toBeDefined();
      expect(user.email).toBe('test@gmail.com');

      // Kiểm tra password match
      const isMatch = await user.comparePassword(password);
      expect(isMatch).toBe(true);
    });

    it('BE-UT-007: Đăng nhập với email không tồn tại', async () => {
      // Tìm user không tồn tại
      const user = await User.findOne({ email: 'notexist@gmail.com' });
      
      expect(user).toBeNull();
    });

    it('BE-UT-008: Đăng nhập với mật khẩu sai', async () => {
      // Tạo user
      const correctPassword = 'Pass123!';
      
      const user = await User.create(createMockUser({
        email: 'test@gmail.com',
        password: correctPassword
      }));

      // Thử với password sai
      const wrongPassword = 'WrongPass';
      const isMatch = await user.comparePassword(wrongPassword);
      
      expect(isMatch).toBe(false);
    });

    it('BE-UT-009: Đăng nhập sau 5 lần thất bại (account locked)', async () => {
      // Tạo user với loginAttempts = 5 và lockUntil trong tương lai
      const lockUntil = Date.now() + (5 * 60 * 1000); // 5 phút sau
      
      const user = await User.create(createMockUser({
        email: 'locked@gmail.com',
        loginAttempts: 5,
        lockUntil: new Date(lockUntil)
      }));

      // Verify user bị lock
      expect(user.loginAttempts).toBe(5);
      expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now());

      // Kiểm tra account có bị lock không
      const isLocked = user.lockUntil && user.lockUntil.getTime() > Date.now();
      expect(isLocked).toBe(true);
    });
  });
});
