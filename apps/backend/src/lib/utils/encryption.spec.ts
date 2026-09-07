import { encrypt, decrypt } from './encryption.js';

// Mock config package to ensure env encryption key is set
jest.mock('@notifyiq/config', () => ({
  env: {
    ENCRYPTION_KEY: '12345678901234567890123456789012',
  },
}));

describe('Encryption Utils', () => {
  it('should encrypt and decrypt a string successfully', () => {
    const text = 'meta-waba-secret-permanent-token';
    const encrypted = encrypt(text);
    
    expect(encrypted).toBeDefined();
    expect(encrypted).toContain(':');
    
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3); // iv, authTag, ciphertext

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it('should return empty string for empty inputs', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
  });

  it('should fail decryption if format is invalid', () => {
    expect(() => decrypt('invalid-format')).toThrow();
  });
});
