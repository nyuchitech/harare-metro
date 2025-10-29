/**
 * AuthService
 *
 * Handles authentication operations:
 * - Password hashing and verification (bcrypt-compatible using Web Crypto API)
 * - JWT token generation and validation (using Web Crypto API)
 * - Session management (KV storage)
 * - User login/logout
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface Session {
  session_id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

export class AuthService {
  private db: D1Database;
  private kv: KVNamespace;
  private jwtSecret: string;
  private sessionTtlDays: number;

  constructor(db: D1Database, kv: KVNamespace, jwtSecret: string, sessionTtlDays = 30) {
    this.db = db;
    this.kv = kv;
    this.jwtSecret = jwtSecret;
    this.sessionTtlDays = sessionTtlDays;
  }

  // ===========================================================================
  // PASSWORD HASHING (Web Crypto API - Cloudflare Workers compatible)
  // ===========================================================================

  /**
   * Hash a password using PBKDF2 (Web Crypto API)
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Import the password as a key
    const key = await crypto.subtle.importKey(
      "raw",
      data,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256
    );

    // Combine salt and hash
    const hashArray = new Uint8Array(derivedBits);
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt);
    combined.set(hashArray, salt.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);

      // Decode the stored hash
      const combined = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0));

      // Extract salt and hash
      const salt = combined.slice(0, 16);
      const storedHash = combined.slice(16);

      // Import the password as a key
      const key = await crypto.subtle.importKey(
        "raw",
        data,
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );

      // Derive bits using the same salt
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        key,
        256
      );

      const derivedHash = new Uint8Array(derivedBits);

      // Compare hashes
      if (derivedHash.length !== storedHash.length) {
        return false;
      }

      let match = true;
      for (let i = 0; i < derivedHash.length; i++) {
        if (derivedHash[i] !== storedHash[i]) {
          match = false;
        }
      }

      return match;
    } catch (error) {
      console.error("[AUTH] Password verification error:", error);
      return false;
    }
  }

  // ===========================================================================
  // JWT TOKEN GENERATION AND VALIDATION
  // ===========================================================================

  /**
   * Generate a JWT token for a user
   */
  async generateJWT(user: User): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.sessionTtlDays * 24 * 60 * 60; // TTL in seconds

    const payload: JWTPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: exp,
    };

    // Create header
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    // Encode header and payload
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

    // Create signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.signHMAC(data, this.jwtSecret);

    return `${data}.${signature}`;
  }

  /**
   * Validate and decode a JWT token
   */
  async validateJWT(token: string): Promise<JWTPayload | null> {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const [encodedHeader, encodedPayload, signature] = parts;

      // Verify signature
      const data = `${encodedHeader}.${encodedPayload}`;
      const expectedSignature = await this.signHMAC(data, this.jwtSecret);

      if (signature !== expectedSignature) {
        console.error("[AUTH] JWT signature mismatch");
        return null;
      }

      // Decode payload
      const payload: JWTPayload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.error("[AUTH] JWT expired");
        return null;
      }

      return payload;
    } catch (error) {
      console.error("[AUTH] JWT validation error:", error);
      return null;
    }
  }

  /**
   * Sign data using HMAC-SHA256
   */
  private async signHMAC(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
    return this.base64UrlEncode(new Uint8Array(signature));
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(input: string | Uint8Array): string {
    const str = typeof input === "string" ? input : String.fromCharCode(...input);
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(input: string): string {
    let str = input.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) {
      str += "=";
    }
    return atob(str);
  }

  // ===========================================================================
  // SESSION MANAGEMENT (KV Storage)
  // ===========================================================================

  /**
   * Create a session for a user
   */
  async createSession(user: User): Promise<{ session_id: string; token: string }> {
    const session_id = crypto.randomUUID();
    const token = await this.generateJWT(user);

    const session: Session = {
      session_id,
      user_id: user.id,
      email: user.email,
      role: user.role,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + this.sessionTtlDays * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Store in KV (TTL in seconds)
    const ttlSeconds = this.sessionTtlDays * 24 * 60 * 60;
    await this.kv.put(`session:${session_id}`, JSON.stringify(session), {
      expirationTtl: ttlSeconds,
    });

    return { session_id, token };
  }

  /**
   * Get a session by ID
   */
  async getSession(session_id: string): Promise<Session | null> {
    const sessionData = await this.kv.get(`session:${session_id}`);
    if (!sessionData) {
      return null;
    }

    return JSON.parse(sessionData) as Session;
  }

  /**
   * Delete a session (logout)
   */
  async deleteSession(session_id: string): Promise<void> {
    await this.kv.delete(`session:${session_id}`);
  }

  /**
   * Validate a session and return user info
   */
  async validateSession(session_id: string): Promise<Session | null> {
    const session = await this.getSession(session_id);
    if (!session) {
      return null;
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      await this.deleteSession(session_id);
      return null;
    }

    return session;
  }

  // ===========================================================================
  // USER AUTHENTICATION
  // ===========================================================================

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    display_name?: string
  ): Promise<{ user: User; session_id: string; token: string } | { error: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.db
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(email)
        .first();

      if (existingUser) {
        return { error: "User already exists" };
      }

      // Hash password
      const password_hash = await this.hashPassword(password);

      // Generate user ID
      const user_id = crypto.randomUUID();

      // Insert user
      await this.db
        .prepare(
          `INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        )
        .bind(user_id, email, password_hash, display_name || null, "creator")
        .run();

      // Fetch created user
      const user = (await this.db
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .first()) as User;

      if (!user) {
        return { error: "Failed to create user" };
      }

      // Create session
      const { session_id, token } = await this.createSession(user);

      return { user, session_id, token };
    } catch (error: any) {
      console.error("[AUTH] Registration error:", error);
      return { error: error.message || "Registration failed" };
    }
  }

  /**
   * Login a user
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: User; session_id: string; token: string } | { error: string }> {
    try {
      // Fetch user
      const user = (await this.db
        .prepare("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .first()) as User;

      if (!user) {
        return { error: "Invalid email or password" };
      }

      // Verify password
      const isValid = await this.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return { error: "Invalid email or password" };
      }

      // Create session
      const { session_id, token } = await this.createSession(user);

      return { user, session_id, token };
    } catch (error: any) {
      console.error("[AUTH] Login error:", error);
      return { error: error.message || "Login failed" };
    }
  }

  /**
   * Logout a user
   */
  async logout(session_id: string): Promise<void> {
    await this.deleteSession(session_id);
  }

  /**
   * Get user by ID
   */
  async getUserById(user_id: string): Promise<User | null> {
    const user = (await this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(user_id)
      .first()) as User;

    return user || null;
  }
}
