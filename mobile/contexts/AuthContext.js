import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth as authAPI } from '../api/client';

/**
 * AuthContext - Global authentication state management
 *
 * Provides:
 * - user: Current user object
 * - isAuthenticated: Boolean auth status
 * - isLoading: Loading state during auth checks
 * - login: Login function
 * - register: Register function
 * - logout: Logout function
 * - checkAuth: Check authentication status
 */

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkAuth: async () => {},
});

// Storage keys
const AUTH_TOKEN_KEY = '@mukoko_auth_token';
const USER_DATA_KEY = '@mukoko_user_data';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app start
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated
   */
  const checkAuth = async () => {
    try {
      setIsLoading(true);

      // Get stored auth token
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);

      if (token && userData) {
        // Verify token with backend
        const { data, error } = await authAPI.getSession();

        if (data && !error) {
          setUser(JSON.parse(userData));
        } else {
          // Token invalid, clear storage
          await clearAuthData();
        }
      }
    } catch (error) {
      console.error('[Auth] Check auth error:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    try {
      const { data, error } = await authAPI.signIn(email, password);

      if (error) {
        return { error };
      }

      if (data?.user) {
        // Store auth token and user data
        if (data.token) {
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
        }
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));

        setUser(data.user);
        return { user: data.user, error: null };
      }

      return { error: 'Login failed' };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { error: error.message };
    }
  };

  /**
   * Register new user
   */
  const register = async (email, password, displayName, username) => {
    try {
      const { data, error } = await authAPI.signUp(
        email,
        password,
        displayName,
        username
      );

      if (error) {
        return { error };
      }

      if (data?.user) {
        // Store auth token and user data
        if (data.token) {
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
        }
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));

        setUser(data.user);
        return { user: data.user, error: null };
      }

      return { error: 'Registration failed' };
    } catch (error) {
      console.error('[Auth] Register error:', error);
      return { error: error.message };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authAPI.signOut();
      await clearAuthData();
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      return { error: error.message };
    }
  };

  /**
   * Clear authentication data from storage
   */
  const clearAuthData = async () => {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Get auth token from storage
 */
export async function getAuthToken() {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('[Auth] Get token error:', error);
    return null;
  }
}

export default AuthContext;
