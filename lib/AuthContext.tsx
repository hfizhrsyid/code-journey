import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import authService from './auth';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        // Update API client with stored token
        const { quizAPI } = await import('./api');
        await quizAPI.setToken(storedToken);
        // Try to fetch user profile
        try {
          const profile = await authService.getUserProfile();
          setUser(profile);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Token might be invalid, clear it
          await AsyncStorage.removeItem('authToken');
          setToken(null);
          await quizAPI.setToken(null);
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await authService.signIn(username, password);
    setToken(response.token);
    setUser(response.user);
    // Update API client with new token
    const { quizAPI } = await import('./api');
    await quizAPI.setToken(response.token);
  };

  const signup = async (username: string, email: string, password: string, firstName?: string, lastName?: string) => {
    const response = await authService.signUp(username, email, password, firstName, lastName);
    setToken(response.token);
    setUser(response.user);
    // Update API client with new token
    const { quizAPI } = await import('./api');
    await quizAPI.setToken(response.token);
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setToken(null);
    // Clear token from API client
    const { quizAPI } = await import('./api');
    await quizAPI.setToken(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const profile = await authService.getUserProfile();
        setUser(profile);
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
