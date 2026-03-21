/**
 * Unit Tests - Color Utils
 * Test cases: FE-UT-006 đến FE-UT-009
 */

import { describe, it, expect } from 'vitest';
import { colorMap, patternMap } from '../../utils/colorUtils';

describe('Color Utils - Unit Tests', () => {
  
  describe('colorMap', () => {
    
    it('FE-UT-006: Lấy mã màu hex cho màu "Đen"', () => {
      const color = colorMap['Đen'];
      expect(color).toBe('#000000');
    });

    it('FE-UT-007: Lấy mã màu hex cho màu "Trắng"', () => {
      const color = colorMap['Trắng'];
      expect(color).toBe('#FFFFFF');
    });

    it('FE-UT-008: Lấy mã màu không tồn tại', () => {
      const color = colorMap['Màu không có'];
      expect(color).toBeUndefined();
    });
  });

  describe('patternMap', () => {
    
    it('FE-UT-009: Lấy pattern gradient cho "Họa tiết Đen"', () => {
      const pattern = patternMap['Họa tiết Đen'];
      expect(pattern).toBeDefined();
      expect(pattern).toContain('linear-gradient');
    });
  });
});
