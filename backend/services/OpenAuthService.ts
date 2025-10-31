// OpenAuth library not needed - using simple D1 + KV auth
// import { createAuthHandler } from '@openauthjs/openauth'
import * as v from 'valibot'

/**
 * OpenAuth Service for Harare Metro
 * Cloudflare-native authentication replacing Supabase
 * Supports: creator, business-creator, moderator, admin roles
 */

// User role validation schema
const UserRole = v.picklist(['creator', 'business-creator', 'moderator', 'admin'])
const UserStatus = v.picklist(['active', 'suspended', 'deleted'])

// User schema for database operations
const UserSchema = v.object({
  id: v.string(),
  email: v.pipe(v.string(), v.email()),
  display_name: v.optional(v.string()),
  role: UserRole,
  status: UserStatus,
  email_verified: v.boolean(),
  created_at: v.string(),
  updated_at: v.string(),
  last_login_at: v.optional(v.string()),
  login_count: v.number(),
  preferences: v.optional(v.any()),
  analytics_consent: v.boolean()
})

// Session schema
const SessionSchema = v.object({
  id: v.string(),
  user_id: v.string(),
  token_hash: v.string(),
  expires_at: v.string(),
  created_at: v.string(),
  last_accessed_at: v.string(),
  ip_address: v.optional(v.string()),
  user_agent: v.optional(v.string()),
  device_type: v.optional(v.string()),
  browser: v.optional(v.string()),
  os: v.optional(v.string()),
  location: v.optional(v.string())
})

export interface OpenAuthBindings {
  DB: D1Database
  AUTH_STORAGE: KVNamespace
}

export class OpenAuthService {
  private db: D1Database
  private kv: KVNamespace

  constructor(bindings: OpenAuthBindings) {
    this.db = bindings.DB
    this.kv = bindings.AUTH_STORAGE
  }

  /**
   * Send verification code (for development, log to console)
   * In production, integrate with email service
   */
  private async sendVerificationCode(email: string, code: string): Promise<void> {
    console.log(`Verification code for ${email}: ${code}`)
    
    // Store code in KV for verification with 10-minute expiry
    await this.kv.put(`verification:${email}`, code, { expirationTtl: 600 })
    
    // TODO: Integrate with Cloudflare Email Routing or SendGrid
    // await this.sendEmailVerification(email, code)
  }

  /**
   * Verify authentication code
   */
  private async verifyCode(email: string, code: string): Promise<boolean> {
    const storedCode = await this.kv.get(`verification:${email}`)
    
    if (!storedCode || storedCode !== code) {
      return false
    }
    
    // Clean up used code
    await this.kv.delete(`verification:${email}`)
    return true
  }

  /**
   * Create or update user in D1 database
   */
  async createOrUpdateUser(email: string, metadata?: any): Promise<any> {
    try {
      // Check if user exists
      const existingUser = await this.db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(email)
        .first()

      if (existingUser) {
        // Update existing user
        const result = await this.db
          .prepare(`
            UPDATE users 
            SET last_login_at = CURRENT_TIMESTAMP, 
                login_count = login_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE email = ?
            RETURNING *
          `)
          .bind(email)
          .first()
        
        return result
      } else {
        // Create new user with default role 'creator'
        const userId = crypto.randomUUID()

        // Generate default username from email if not provided
        let username = metadata?.username
        if (!username) {
          // Extract email prefix and sanitize
          username = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()

          // Ensure uniqueness by adding random suffix if needed
          let attempts = 0
          let uniqueUsername = username
          while (attempts < 10) {
            const existing = await this.db
              .prepare('SELECT id FROM users WHERE username = ?')
              .bind(uniqueUsername)
              .first()

            if (!existing) break

            // Use cryptographically secure random number
            const randomArray = new Uint32Array(1)
            crypto.getRandomValues(randomArray)
            const randomSuffix = randomArray[0] % 10000
            uniqueUsername = `${username}${randomSuffix}`
            attempts++
          }
          username = uniqueUsername
        }

        const result = await this.db
          .prepare(`
            INSERT INTO users (
              id, email, username, role, status, email_verified,
              login_count, analytics_consent, preferences
            ) VALUES (?, ?, ?, 'creator', 'active', TRUE, 1, TRUE, '{}')
            RETURNING *
          `)
          .bind(userId, email, username)
          .first()

        // Log user creation for audit
        await this.logAuditEvent('user_created', 'user', userId, null, {
          email,
          username,
          role: 'creator',
          ip_address: metadata?.ip_address
        })

        return result
      }
    } catch (error) {
      console.error('Error creating/updating user:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    return await this.db
      .prepare('SELECT * FROM users WHERE id = ? AND status = "active"')
      .bind(userId)
      .first()
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any> {
    return await this.db
      .prepare('SELECT * FROM users WHERE email = ? AND status = "active"')
      .bind(email)
      .first()
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<any> {
    return await this.db
      .prepare('SELECT * FROM users WHERE username = ? AND status = "active"')
      .bind(username)
      .first()
  }

  /**
   * Update username (user can change their own username)
   */
  async updateUsername(userId: string, newUsername: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate username format (3-30 chars, alphanumeric + underscore/hyphen)
      if (!newUsername || newUsername.length < 3 || newUsername.length > 30) {
        return { success: false, error: 'Username must be 3-30 characters' }
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
        return { success: false, error: 'Username can only contain letters, numbers, underscores and hyphens' }
      }

      // Check if username is already taken
      const existing = await this.getUserByUsername(newUsername)
      if (existing && existing.id !== userId) {
        return { success: false, error: 'Username is already taken' }
      }

      // Update username
      await this.db
        .prepare('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(newUsername, userId)
        .run()

      // Log username change for audit
      await this.logAuditEvent('username_updated', 'user', userId, userId, {
        new_username: newUsername
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error updating username:', error)
      return { success: false, error: 'Failed to update username' }
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, newRole: string, adminUserId: string): Promise<boolean> {
    try {
      // Validate role
      v.parse(UserRole, newRole)
      
      // Get current user data for audit
      const currentUser = await this.getUserById(userId)
      if (!currentUser) {
        throw new Error('User not found')
      }
      
      // Update role
      await this.db
        .prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(newRole, userId)
        .run()
      
      // Log role change for audit
      await this.logAuditEvent('role_updated', 'user', userId, adminUserId, {
        old_role: currentUser.role,
        new_role: newRole
      })
      
      return true
    } catch (error) {
      console.error('Error updating user role:', error)
      return false
    }
  }

  /**
   * Create user session
   */
  async createSession(userId: string, metadata: any): Promise<string> {
    const sessionId = crypto.randomUUID()
    const tokenHash = await this.hashToken(sessionId)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    await this.db
      .prepare(`
        INSERT INTO user_sessions (
          id, user_id, token_hash, expires_at, 
          ip_address, user_agent, device_type, browser, os
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        sessionId, userId, tokenHash, expiresAt.toISOString(),
        metadata.ip_address, metadata.user_agent, metadata.device_type,
        metadata.browser, metadata.os
      )
      .run()
    
    return sessionId
  }

  /**
   * Validate session and return user
   */
  async validateSession(sessionToken: string): Promise<any> {
    const tokenHash = await this.hashToken(sessionToken)
    
    const session = await this.db
      .prepare(`
        SELECT s.*, u.* FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.status = 'active'
      `)
      .bind(tokenHash)
      .first()
    
    if (session) {
      // Update last accessed time
      await this.db
        .prepare('UPDATE user_sessions SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(session.id)
        .run()
    }
    
    return session
  }

  /**
   * Revoke session (logout)
   */
  async revokeSession(sessionToken: string): Promise<void> {
    const tokenHash = await this.hashToken(sessionToken)
    
    await this.db
      .prepare('DELETE FROM user_sessions WHERE token_hash = ?')
      .bind(tokenHash)
      .run()
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    await this.db
      .prepare('DELETE FROM user_sessions WHERE expires_at < datetime("now")')
      .run()
  }

  /**
   * Get user statistics for admin dashboard
   */
  async getUserStats(): Promise<any> {
    const stats = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'creator' THEN 1 END) as creators,
          COUNT(CASE WHEN role = 'business-creator' THEN 1 END) as business_creators,
          COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderators,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN last_login_at > datetime('now', '-30 days') THEN 1 END) as monthly_active
        FROM users
      `)
      .first()
    
    return stats
  }

  /**
   * Log audit events for observability
   */
  private async logAuditEvent(
    action: string, 
    resourceType: string, 
    resourceId: string, 
    actorUserId: string | null, 
    details: any
  ): Promise<void> {
    try {
      await this.db
        .prepare(`
          INSERT INTO audit_log (
            action, resource_type, resource_id, actor_user_id, 
            new_values, request_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `)
        .bind(
          action, resourceType, resourceId, actorUserId,
          JSON.stringify(details), crypto.randomUUID()
        )
        .run()
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  /**
   * Hash token for secure storage
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Check if user has required role
   */
  hasRole(user: any, requiredRoles: string[]): boolean {
    return requiredRoles.includes(user.role)
  }

  /**
   * Middleware for role-based access control
   */
  requireRole(requiredRoles: string[]) {
    return async (c: any, next: any) => {
      const user = c.get('user')
      
      if (!user) {
        return c.json({ error: 'Authentication required' }, 401)
      }
      
      if (!this.hasRole(user, requiredRoles)) {
        return c.json({ error: 'Insufficient permissions' }, 403)
      }
      
      await next()
    }
  }
}

export { UserRole, UserStatus, UserSchema, SessionSchema }