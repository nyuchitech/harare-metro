// Custom backend types - no Supabase dependencies
export interface User {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface Session {
  user: User;
  access_token: string;
}

export interface AuthResponse {
  data: { user: User | null; session: Session | null };
  error: AuthError | null;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  updated_at?: string;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  image_url?: string;
  source: string;
  category: string;
  published_at: string;
  created_at: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
  priority: number;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
  article?: Article;
}

export interface Like {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  updatePassword: (password: string) => Promise<AuthResponse>;
  isConfigured: boolean;
}