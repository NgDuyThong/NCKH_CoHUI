/**
 * Unit Tests - Date Utils
 * Test cases: FE-UT-001 đến FE-UT-005
 */

import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatDateForInput } from '../../utils/dateUtils';

describe('Date Utils - Unit Tests', () => {
  
  describe('formatDate()', () => {
    
    it('FE-UT-001: Format date thành dd/mm/yyyy', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBe('15/01/2024');
    });

    it('FE-UT-002: Format với date = null', () => {
      const result = formatDate(null);
      expect(result).toBe('');
    });

    it('FE-UT-003: Format với date = undefined', () => {
      const result = formatDate(undefined);
      expect(result).toBe('');
    });
  });

  describe('formatDateTime()', () => {
    
    it('FE-UT-004: Format date time thành dd/mm/yyyy hh:mm', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toBe('15/01/2024 14:30');
    });
  });

  describe('formatDateForInput()', () => {
    
    it('FE-UT-005: Format date cho input type="date"', () => {
      const date = new Date('2024-01-15');
      const result = formatDateForInput(date);
      expect(result).toBe('2024-01-15');
    });
  });
});
