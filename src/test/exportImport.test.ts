import { describe, it, expect } from 'vitest';
import { exportToCSV, parseCSV } from '@/lib/exportImport';

describe('exportImport utilities', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV correctly', () => {
      const csv = 'Name,Price\nPaneer Tikka,280\nButter Chicken,380';
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0].Name).toBe('Paneer Tikka');
      expect(result[0].Price).toBe('280');
      expect(result[1].Name).toBe('Butter Chicken');
    });

    it('should handle quoted fields with commas', () => {
      const csv = 'Name,Description\n"Dal Makhani","Rich, creamy lentils"';
      const result = parseCSV(csv);
      expect(result).toHaveLength(1);
      expect(result[0].Description).toBe('Rich, creamy lentils');
    });

    it('should handle empty CSV', () => {
      const result = parseCSV('');
      expect(result).toHaveLength(0);
    });

    it('should handle headers only', () => {
      const result = parseCSV('Name,Price');
      expect(result).toHaveLength(0);
    });

    it('should handle escaped quotes', () => {
      const csv = 'Name,Note\n"Item ""Special""","test"';
      const result = parseCSV(csv);
      expect(result[0].Name).toBe('Item "Special"');
    });
  });
});
