/**
 * Supabase Authentication Service
 * Handles admin role authentication and authorization using Supabase
 */

export interface SupabaseUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResult {
  success: boolean;
  user?: SupabaseUser;
  error?: string;
}

export class AuthService {
  private supabaseUrl: string;
  private supabaseServiceKey: string;
  private adminRoles: string[];

  constructor(supabaseUrl: string, supabaseServiceKey: string, adminRoles: string[]) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseServiceKey = supabaseServiceKey;
    this.adminRoles = adminRoles;
  }

  /**
   * Verify Supabase JWT token and get user profile
   */
  async verifyToken(token: string): Promise<SupabaseUser | null> {
    try {
      // Verify token with Supabase and get user
      const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': this.supabaseServiceKey
        }
      });

      if (!response.ok) {
        return null;
      }

      const userData: any = await response.json();
      
      if (!userData || !userData.id) {
        return null;
      }

      // Get user profile with role information
      const profile = await this.getUserProfile(userData.id);
      
      if (!profile) {
        return null;
      }

      return {
        id: userData.id,
        email: userData.email,
        role: profile.role || 'user',
        full_name: profile.full_name,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Check if user has admin access
   */
  isAdmin(user: SupabaseUser): boolean {
    return this.adminRoles.includes(user.role);
  }

  /**
   * Get user profile from Supabase
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'apikey': this.supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const profiles: any = await response.json();
      return profiles && profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Update user role in Supabase
   */
  async updateUserRole(userId: string, role: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'apikey': this.supabaseServiceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to update user role'
        };
      }

      const updatedProfile: any = await response.json();
      
      return {
        success: true,
        user: updatedProfile[0]
      };
    } catch (error) {
      console.error('Failed to update user role:', error);
      return {
        success: false,
        error: 'Failed to update user role'
      };
    }
  }

  /**
   * List all users with admin capabilities (admin only)
   */
  async listUsers(): Promise<SupabaseUser[]> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/profiles?select=*&order=created_at.desc`, {
        headers: {
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'apikey': this.supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return [];
      }

      const profiles: any = await response.json();
      return profiles || [];
    } catch (error) {
      console.error('Failed to list users:', error);
      return [];
    }
  }
}