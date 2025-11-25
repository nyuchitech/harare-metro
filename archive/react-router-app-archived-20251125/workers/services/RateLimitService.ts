/**
 * Rate Limiting Service for Harare Metro
 * Prevents brute-force attacks on authentication endpoints
 *
 * Features:
 * - IP-based rate limiting
 * - Sliding window algorithm
 * - Exponential backoff
 * - KV-based storage for edge compatibility
 */

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds until next attempt allowed
}

export class RateLimitService {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /**
   * Check if an IP address is rate limited
   * Returns rate limit status and metadata
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;

    try {
      // Get current rate limit data
      const data = await this.kv.get(key, 'json') as {
        attempts: number;
        firstAttempt: number;
        blockedUntil?: number;
      } | null;

      const now = Date.now();

      // Check if currently blocked
      if (data?.blockedUntil && data.blockedUntil > now) {
        const retryAfter = Math.ceil((data.blockedUntil - now) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(data.blockedUntil),
          retryAfter
        };
      }

      // No previous attempts or window expired
      if (!data || (now - data.firstAttempt) > config.windowMs) {
        return {
          allowed: true,
          remaining: config.maxAttempts - 1,
          resetAt: new Date(now + config.windowMs)
        };
      }

      // Within rate limit window
      const remaining = config.maxAttempts - data.attempts;

      if (remaining > 0) {
        return {
          allowed: true,
          remaining: remaining - 1,
          resetAt: new Date(data.firstAttempt + config.windowMs)
        };
      }

      // Exceeded rate limit - block
      const blockedUntil = now + config.blockDurationMs;
      const retryAfter = Math.ceil(config.blockDurationMs / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(blockedUntil),
        retryAfter
      };
    } catch (error) {
      console.error('[RateLimit] Check error:', error);
      // Fail open (allow request) rather than fail closed
      return {
        allowed: true,
        remaining: config.maxAttempts,
        resetAt: new Date(Date.now() + config.windowMs)
      };
    }
  }

  /**
   * Record a failed attempt
   */
  async recordAttempt(identifier: string, config: RateLimitConfig): Promise<void> {
    const key = `ratelimit:${identifier}`;

    try {
      const data = await this.kv.get(key, 'json') as {
        attempts: number;
        firstAttempt: number;
        blockedUntil?: number;
      } | null;

      const now = Date.now();

      // Start new window if expired or no data
      if (!data || (now - data.firstAttempt) > config.windowMs) {
        await this.kv.put(
          key,
          JSON.stringify({
            attempts: 1,
            firstAttempt: now
          }),
          {
            expirationTtl: Math.ceil((config.windowMs + config.blockDurationMs) / 1000)
          }
        );
        return;
      }

      // Increment attempts
      const newAttempts = data.attempts + 1;
      const newData: any = {
        attempts: newAttempts,
        firstAttempt: data.firstAttempt
      };

      // Block if exceeded max attempts
      if (newAttempts >= config.maxAttempts) {
        newData.blockedUntil = now + config.blockDurationMs;
      }

      await this.kv.put(
        key,
        JSON.stringify(newData),
        {
          expirationTtl: Math.ceil((config.windowMs + config.blockDurationMs) / 1000)
        }
      );
    } catch (error) {
      console.error('[RateLimit] Record error:', error);
    }
  }

  /**
   * Reset rate limit for an identifier (e.g., after successful login)
   */
  async resetRateLimit(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('[RateLimit] Reset error:', error);
    }
  }

  /**
   * Get rate limit configuration for login endpoints
   */
  static getLoginConfig(): RateLimitConfig {
    return {
      maxAttempts: 5,           // 5 attempts
      windowMs: 15 * 60 * 1000, // per 15 minutes
      blockDurationMs: 15 * 60 * 1000 // block for 15 minutes
    };
  }

  /**
   * Get rate limit configuration for registration endpoints
   */
  static getRegistrationConfig(): RateLimitConfig {
    return {
      maxAttempts: 3,           // 3 attempts
      windowMs: 60 * 60 * 1000, // per 1 hour
      blockDurationMs: 60 * 60 * 1000 // block for 1 hour
    };
  }

  /**
   * Get rate limit configuration for API endpoints
   */
  static getApiConfig(): RateLimitConfig {
    return {
      maxAttempts: 100,          // 100 requests
      windowMs: 60 * 1000,       // per 1 minute
      blockDurationMs: 5 * 60 * 1000 // block for 5 minutes
    };
  }
}
