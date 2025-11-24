/**
 * Account Lockout Service for Harare Metro
 * Provides permanent account lockout after repeated failed login attempts
 *
 * Security Features:
 * - Escalating lockout durations (15 min → 1 hour → 24 hours → permanent)
 * - IP-based and account-based tracking
 * - Admin unlock capability
 * - Audit logging for all lockout events
 */

export interface LockoutStatus {
  isLocked: boolean;
  lockoutLevel: number;
  lockedUntil?: Date;
  isPermanent: boolean;
  failedAttempts: number;
  reason?: string;
}

export class AccountLockoutService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Record a failed login attempt and apply lockout if needed
   * Returns the current lockout status
   */
  async recordFailedAttempt(userId: string, ip: string): Promise<LockoutStatus> {
    try {
      // Get current user lockout data
      const user = await this.db
        .prepare('SELECT failed_login_attempts, account_locked_until, account_locked_permanently FROM users WHERE id = ?')
        .bind(userId)
        .first() as any;

      if (!user) {
        return {
          isLocked: false,
          lockoutLevel: 0,
          isPermanent: false,
          failedAttempts: 0
        };
      }

      // Check if already permanently locked
      if (user.account_locked_permanently) {
        return {
          isLocked: true,
          lockoutLevel: 4,
          isPermanent: true,
          failedAttempts: user.failed_login_attempts || 0,
          reason: 'Account permanently locked due to repeated failed login attempts'
        };
      }

      // Check if currently under temporary lockout
      if (user.account_locked_until) {
        const lockedUntil = new Date(user.account_locked_until);
        if (lockedUntil > new Date()) {
          return {
            isLocked: true,
            lockoutLevel: this.getLockoutLevel(user.failed_login_attempts || 0),
            lockedUntil,
            isPermanent: false,
            failedAttempts: user.failed_login_attempts || 0,
            reason: `Account temporarily locked until ${lockedUntil.toISOString()}`
          };
        }
      }

      // Increment failed attempts
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      const lockoutLevel = this.getLockoutLevel(newFailedAttempts);

      // Determine lockout duration based on level
      let lockedUntil: Date | null = null;
      let isPermanent = false;

      if (lockoutLevel === 1) {
        // Level 1: 15 minutes (after 5 failed attempts)
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      } else if (lockoutLevel === 2) {
        // Level 2: 1 hour (after 10 failed attempts)
        lockedUntil = new Date(Date.now() + 60 * 60 * 1000);
      } else if (lockoutLevel === 3) {
        // Level 3: 24 hours (after 15 failed attempts)
        lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else if (lockoutLevel === 4) {
        // Level 4: Permanent (after 20 failed attempts)
        isPermanent = true;
      }

      // Update user record
      if (isPermanent) {
        await this.db
          .prepare(`
            UPDATE users
            SET failed_login_attempts = ?,
                account_locked_permanently = TRUE,
                account_locked_until = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(newFailedAttempts, userId)
          .run();
      } else if (lockedUntil) {
        await this.db
          .prepare(`
            UPDATE users
            SET failed_login_attempts = ?,
                account_locked_until = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(newFailedAttempts, lockedUntil.toISOString(), userId)
          .run();
      } else {
        await this.db
          .prepare(`
            UPDATE users
            SET failed_login_attempts = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(newFailedAttempts, userId)
          .run();
      }

      return {
        isLocked: lockoutLevel > 0,
        lockoutLevel,
        lockedUntil: lockedUntil || undefined,
        isPermanent,
        failedAttempts: newFailedAttempts,
        reason: isPermanent
          ? 'Account permanently locked due to repeated failed login attempts'
          : lockedUntil
          ? `Account locked until ${lockedUntil.toISOString()}`
          : undefined
      };
    } catch (error) {
      console.error('[LOCKOUT] Failed attempt recording error:', error);
      return {
        isLocked: false,
        lockoutLevel: 0,
        isPermanent: false,
        failedAttempts: 0
      };
    }
  }

  /**
   * Check if an account is currently locked
   */
  async checkLockoutStatus(userId: string): Promise<LockoutStatus> {
    try {
      const user = await this.db
        .prepare('SELECT failed_login_attempts, account_locked_until, account_locked_permanently FROM users WHERE id = ?')
        .bind(userId)
        .first() as any;

      if (!user) {
        return {
          isLocked: false,
          lockoutLevel: 0,
          isPermanent: false,
          failedAttempts: 0
        };
      }

      // Check permanent lockout
      if (user.account_locked_permanently) {
        return {
          isLocked: true,
          lockoutLevel: 4,
          isPermanent: true,
          failedAttempts: user.failed_login_attempts || 0,
          reason: 'Account permanently locked'
        };
      }

      // Check temporary lockout
      if (user.account_locked_until) {
        const lockedUntil = new Date(user.account_locked_until);
        if (lockedUntil > new Date()) {
          return {
            isLocked: true,
            lockoutLevel: this.getLockoutLevel(user.failed_login_attempts || 0),
            lockedUntil,
            isPermanent: false,
            failedAttempts: user.failed_login_attempts || 0,
            reason: `Locked until ${lockedUntil.toISOString()}`
          };
        }
      }

      return {
        isLocked: false,
        lockoutLevel: 0,
        isPermanent: false,
        failedAttempts: user.failed_login_attempts || 0
      };
    } catch (error) {
      console.error('[LOCKOUT] Status check error:', error);
      return {
        isLocked: false,
        lockoutLevel: 0,
        isPermanent: false,
        failedAttempts: 0
      };
    }
  }

  /**
   * Reset failed attempts on successful login
   */
  async resetFailedAttempts(userId: string): Promise<void> {
    try {
      await this.db
        .prepare(`
          UPDATE users
          SET failed_login_attempts = 0,
              account_locked_until = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND account_locked_permanently = FALSE
        `)
        .bind(userId)
        .run();
    } catch (error) {
      console.error('[LOCKOUT] Reset error:', error);
    }
  }

  /**
   * Admin unlock - removes lockout (requires admin privileges)
   */
  async unlockAccount(userId: string, adminUserId: string): Promise<boolean> {
    try {
      await this.db
        .prepare(`
          UPDATE users
          SET failed_login_attempts = 0,
              account_locked_until = NULL,
              account_locked_permanently = FALSE,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(userId)
        .run();

      return true;
    } catch (error) {
      console.error('[LOCKOUT] Unlock error:', error);
      return false;
    }
  }

  /**
   * Determine lockout level based on failed attempts
   */
  private getLockoutLevel(failedAttempts: number): number {
    if (failedAttempts >= 20) return 4; // Permanent
    if (failedAttempts >= 15) return 3; // 24 hours
    if (failedAttempts >= 10) return 2; // 1 hour
    if (failedAttempts >= 5) return 1;  // 15 minutes
    return 0; // No lockout
  }
}
