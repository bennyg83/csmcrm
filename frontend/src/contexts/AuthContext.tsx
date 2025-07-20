import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on load
    const initAuth = async () => {
      console.log('AuthContext - initAuth starting');
      const token = localStorage.getItem('token');
      console.log('AuthContext - token found:', !!token);
      
      if (token) {
        try {
          // Try to get user info with the token
          const userData = await apiService.getMe();
          console.log('AuthContext - user data received:', userData);
          setUser(userData);
        } catch (error) {
          console.log('AuthContext - token invalid, removing');
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
      console.log('AuthContext - initAuth completed');
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);
      localStorage.setItem('token', response.token);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    }
    
    // Clear all local storage
    localStorage.clear();
    
    // Clear user state
    setUser(null);
    
    // Force a complete page reload to clear any cached state
    window.location.replace('/login');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 