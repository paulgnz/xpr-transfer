import { describe, it, expect } from 'vitest';
import {
  formatAmount,
  formatQuantity,
  validateRecipient,
  validateAmount,
} from './transfer';

describe('transfer service', () => {
  describe('formatAmount', () => {
    it('formats amount with correct precision', () => {
      expect(formatAmount('10', 4)).toBe('10.0000');
      expect(formatAmount('10.5', 4)).toBe('10.5000');
      expect(formatAmount('10.1234', 4)).toBe('10.1234');
    });

    it('throws for invalid amounts', () => {
      expect(() => formatAmount('abc', 4)).toThrow('Invalid amount');
      expect(() => formatAmount('', 4)).toThrow('Invalid amount');
    });
  });

  describe('formatQuantity', () => {
    it('formats quantity with symbol', () => {
      const token = { contract: 'eosio.token', symbol: 'XPR', precision: 4, name: 'XPR Network' };
      expect(formatQuantity('100', token)).toBe('100.0000 XPR');
    });
  });

  describe('validateRecipient', () => {
    it('validates correct account names', () => {
      expect(validateRecipient('alice')).toBe(true);
      expect(validateRecipient('bob12345')).toBe(true);
      expect(validateRecipient('a.b.c')).toBe(true);
    });

    it('rejects invalid account names', () => {
      expect(validateRecipient('')).toBe(false);
      expect(validateRecipient('toolongaccount123')).toBe(false);
      expect(validateRecipient('UPPERCASE')).toBe(false);
      expect(validateRecipient('invalid@char')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('validates correct amounts', () => {
      expect(validateAmount('100', 4)).toBe(true);
      expect(validateAmount('10.5', 4)).toBe(true);
      expect(validateAmount('0.0001', 4)).toBe(true);
    });

    it('rejects invalid amounts', () => {
      expect(validateAmount('', 4)).toBe(false);
      expect(validateAmount('0', 4)).toBe(false);
      expect(validateAmount('-10', 4)).toBe(false);
      expect(validateAmount('10.12345', 4)).toBe(false);
    });
  });
});
