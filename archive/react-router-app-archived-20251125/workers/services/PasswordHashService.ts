/**
 * Secure Password Hashing Service for Harare Metro
 * Uses scrypt from @noble/hashes for secure password hashing
 *
 * Security features:
 * - Scrypt algorithm (memory-hard, resistant to ASIC attacks)
 * - Random salt per password
 * - Configurable work factor (N=2^14, default secure setting)
 * - Constant-time comparison to prevent timing attacks
 */

import { scrypt } from '@noble/hashes/scrypt.js';

export class PasswordHashService {
  // Scrypt parameters (N=2^14, r=8, p=1)
  // N=16384 provides good security while being fast enough for Workers
  private static readonly SCRYPT_N = 16384; // CPU/memory cost
  private static readonly SCRYPT_R = 8;     // Block size
  private static readonly SCRYPT_P = 1;     // Parallelization
  private static readonly KEY_LENGTH = 32;   // 32 bytes = 256 bits
  private static readonly SALT_LENGTH = 16;  // 16 bytes = 128 bits

  /**
   * Hash a password with scrypt
   * Returns: salt:hash (both hex-encoded)
   */
  static async hashPassword(password: string): Promise<string> {
    // Generate random salt
    const salt = new Uint8Array(this.SALT_LENGTH);
    crypto.getRandomValues(salt);

    // Hash password with scrypt
    const hash = scrypt(password, salt, {
      N: this.SCRYPT_N,
      r: this.SCRYPT_R,
      p: this.SCRYPT_P,
      dkLen: this.KEY_LENGTH
    });

    // Return salt:hash (both hex-encoded)
    return `${this.bytesToHex(salt)}:${this.bytesToHex(hash)}`;
  }

  /**
   * Verify a password against a stored hash
   * Uses constant-time comparison to prevent timing attacks
   */
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
      // Parse stored hash (format: salt:hash)
      const parts = storedHash.split(':');
      if (parts.length !== 2) {
        // Try to handle legacy SHA-256 hashes
        return await this.verifyLegacyPassword(password, storedHash);
      }

      const [saltHex, hashHex] = parts;
      const salt = this.hexToBytes(saltHex);
      const expectedHash = this.hexToBytes(hashHex);

      // Hash the provided password with the same salt
      const actualHash = scrypt(password, salt, {
        N: this.SCRYPT_N,
        r: this.SCRYPT_R,
        p: this.SCRYPT_P,
        dkLen: this.KEY_LENGTH
      });

      // Constant-time comparison
      return this.constantTimeEqual(actualHash, expectedHash);
    } catch (error) {
      console.error('[PasswordHash] Verification error:', error);
      return false;
    }
  }

  /**
   * Verify legacy SHA-256 password (for migration)
   * This should only match existing passwords, not new ones
   */
  private static async verifyLegacyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return actualHash === storedHash;
    } catch (error) {
      console.error('[PasswordHash] Legacy verification error:', error);
      return false;
    }
  }

  /**
   * Check if a hash is using the legacy SHA-256 format
   */
  static isLegacyHash(storedHash: string): boolean {
    // Legacy hashes are 64 hex characters (SHA-256)
    // New hashes have format salt:hash (both hex)
    return storedHash.length === 64 && !storedHash.includes(':');
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private static constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }

    return result === 0;
  }

  /**
   * Convert bytes to hex string
   */
  private static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to bytes
   */
  private static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Generate a secure random token (for session tokens, etc.)
   */
  static generateSecureToken(length: number = 32): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return this.bytesToHex(bytes);
  }
}
