import { hashPassword, comparePassword, generateAccessToken } from '../src/modules/auth/auth.service';
import { JwtPayload } from '../src/types';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password correctly', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await hashPassword(password);
      const result = await comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });
  });
});

describe('JWT Utilities', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const payload: JwtPayload = { userId: 'user-1', username: 'testuser', role: 'ADMIN' };
      const token = generateAccessToken(payload);
      expect(token).toMatch(/^eyJ/);
      expect(token.split('.')).toHaveLength(3);
    });
  });
});
