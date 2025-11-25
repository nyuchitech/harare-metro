/**
 * CSRF Protection Service for Harare Metro
 * Generates and validates CSRF tokens to prevent cross-site request forgery attacks
 *
 * Security Features:
 * - Cryptographically secure token generation
 * - Token binding to session
 * - Time-based token expiration (1 hour)
 * - Constant-time token comparison
 */

import { PasswordHashService } from './PasswordHashService';

export interface CSRFTokenData {
  token: string;
  sessionId: string;
  expiresAt: string;
}

export class CSRFService {
  private kv: KVNamespace;
  private static readonly TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /**
   * Generate a new CSRF token for a session
   * Token is bound to the session ID and stored in KV
   */
  async generateToken(sessionId: string): Promise<string> {
    // Generate cryptographically secure token
    const token = PasswordHashService.generateSecureToken(32);
    const expiresAt = new Date(Date.now() + CSRFService.TOKEN_EXPIRY_MS);

    // Store token in KV with session binding
    const tokenData: CSRFTokenData = {
      token,
      sessionId,
      expiresAt: expiresAt.toISOString()
    };

    await this.kv.put(
      `csrf:${token}`,
      JSON.stringify(tokenData),
      { expirationTtl: Math.ceil(CSRFService.TOKEN_EXPIRY_MS / 1000) }
    );

    return token;
  }

  /**
   * Validate a CSRF token against a session
   * Uses constant-time comparison to prevent timing attacks
   */
  async validateToken(token: string, sessionId: string): Promise<boolean> {
    if (!token || !sessionId) {
      return false;
    }

    try {
      // Retrieve token data from KV
      const tokenDataStr = await this.kv.get(`csrf:${token}`);
      if (!tokenDataStr) {
        return false;
      }

      const tokenData: CSRFTokenData = JSON.parse(tokenDataStr);

      // Check if token has expired
      const expiresAt = new Date(tokenData.expiresAt);
      if (expiresAt < new Date()) {
        // Delete expired token
        await this.kv.delete(`csrf:${token}`);
        return false;
      }

      // Verify token is bound to the correct session (constant-time comparison)
      if (!this.constantTimeEqual(tokenData.sessionId, sessionId)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('[CSRF] Token validation error:', error);
      return false;
    }
  }

  /**
   * Invalidate a CSRF token (e.g., after use or on logout)
   */
  async invalidateToken(token: string): Promise<void> {
    try {
      await this.kv.delete(`csrf:${token}`);
    } catch (error) {
      console.error('[CSRF] Token invalidation error:', error);
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeEqual(a: string, b: string): boolean {
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
   * Clean up expired CSRF tokens for a session
   */
  async cleanupExpiredTokens(sessionId: string): Promise<void> {
    // KV automatically expires tokens via expirationTtl
    // This is a no-op but provided for completeness
  }
}
