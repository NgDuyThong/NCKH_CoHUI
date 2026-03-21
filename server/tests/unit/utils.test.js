/**
 * Unit Tests - Utils Functions
 * Test cases: BE-UT-025 đến BE-UT-030
 */

import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { generateTestToken, hashPassword, comparePassword } from '../helpers/testHelpers.js';

describe('Utils Functions - Unit Tests', () => {

  /**
   * A4.1 JWT Token Generation Tests
   */
  describe('JWT Token Functions', () => {
    
    it('BE-UT-025: Tạo JWT token với userID hợp lệ', () => {
      const userID = 12345;
      const token = generateTestToken(userID);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);

      // Verify token có thể decode
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_jwt_secret');
      expect(decoded.userID).toBe(userID);
      expect(decoded.role).toBe('customer'); // Default role
    });

    it('BE-UT-026: Tạo token với userID = 0', () => {
      const userID = 0;
      const token = generateTestToken(userID);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token có thể decode
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_jwt_secret');
      expect(decoded.userID).toBe(0);
    });

    it('BE-UT-027: Tạo token với userID = null', () => {
      const userID = null;
      const token = generateTestToken(userID);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token có thể decode
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_jwt_secret');
      expect(decoded.userID).toBeNull();
    });
  });

  /**
   * A4.2 Password Hashing Tests
   */
  describe('Password Hashing Functions', () => {
    
    it('BE-UT-028: Hash password thành công', async () => {
      const password = 'Pass123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(20);
      expect(hash).not.toBe(password); // Hash phải khác password gốc
      
      // Verify hash bắt đầu với $2b$ (bcrypt format)
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('BE-UT-029: So sánh password đúng', async () => {
      const password = 'Pass123!';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(password, hash);
      
      expect(isMatch).toBe(true);
    });

    it('BE-UT-030: So sánh password sai', async () => {
      const correctPassword = 'Pass123!';
      const wrongPassword = 'WrongPass';
      const hash = await hashPassword(correctPassword);

      const isMatch = await comparePassword(wrongPassword, hash);
      
      expect(isMatch).toBe(false);
    });
  });
});
