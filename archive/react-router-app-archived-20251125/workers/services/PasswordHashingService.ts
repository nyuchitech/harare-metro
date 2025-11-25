/**
 * Password Hashing Service for Harare Metro
 * Implements secure password hashing using Web Crypto API with salt
 * D1-first architecture - all password data stored in database
 */

export class PasswordHashingService {
  /**
   * Generate a cryptographically secure salt
   */
  private static generateSalt(): string {
    const saltArray = new Uint8Array(16);
    crypto.getRandomValues(saltArray);
    return Array.from(saltArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Hash password with salt using SHA-256
   * Format: salt:hash (both hex-encoded)
   */
  static async hashPassword(password: string): Promise<string> {
    // Generate unique salt for this password
    const salt = this.generateSalt();

    // Combine password and salt
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);

    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Return combined salt:hash format
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against stored hash
   * @param password - Plain text password to verify
   * @param storedHash - Stored hash in format "salt:hash"
   */
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
      // Split stored hash into salt and hash components
      const parts = storedHash.split(':');
      if (parts.length !== 2) {
        // Legacy hash format without salt (for backward compatibility)
        return this.verifyLegacyPassword(password, storedHash);
      }

      const [salt, hash] = parts;

      // Hash the input password with the same salt
      const encoder = new TextEncoder();
      const data = encoder.encode(password + salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Compare hashes using constant-time comparison
      return this.constantTimeCompare(hash, computedHash);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Verify legacy password hash (no salt)
   * Only for backward compatibility with existing hashes
   */
  private static async verifyLegacyPassword(password: string, storedHash: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return this.constantTimeCompare(storedHash, computedHash);
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Check if a hash needs to be upgraded to the new format
   */
  static needsRehash(storedHash: string): boolean {
    // If hash doesn't contain ':', it's a legacy hash without salt
    return !storedHash.includes(':');
  }

  /**
   * Validate password strength
   * Returns { valid: boolean, error?: string }
   */
  static validatePasswordStrength(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password must be less than 128 characters' };
    }

    // Check for at least one number OR special character
    const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    if (!hasNumberOrSpecial) {
      return { valid: false, error: 'Password must contain at least one number or special character' };
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty', 'admin123', 'letmein'];
    if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
      return { valid: false, error: 'Password is too common. Please choose a stronger password' };
    }

    return { valid: true };
  }
}
