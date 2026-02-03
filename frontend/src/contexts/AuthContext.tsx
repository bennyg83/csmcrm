import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, type?: 'internal' | 'external') => Promise<{ success: boolean; error?: string }>;
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
    const initAuth = () => {
      console.log('AuthContext - initAuth starting');
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      console.log('AuthContext - token found:', !!token, 'userType:', userType);
      
      // Always start with null user state
      setUser(null);
      
      if (token && userType === 'internal') {
        // For internal users, try to validate token
        console.log('AuthContext - attempting to validate internal user token');
        
        // Use a timeout to avoid blocking the initial render
        setTimeout(async () => {
          try {
            const userData = await apiService.getMe();
            console.log('AuthContext - internal user data received:', userData);
            setUser(userData);
          } catch (error) {
            console.log('AuthContext - token invalid, removing');
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            setUser(null);
          }
        }, 100);
      } else {
        console.log('AuthContext - no valid token or userType, skipping authentication');
      }
      
      setLoading(false);
      console.log('AuthContext - initAuth completed');
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, type: 'internal' | 'external' = 'internal') => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password, type);
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', type);
      setUser(response.user);
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
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

  // Debug logging for user state changes
  useEffect(() => {
    console.log('AuthContext - user state changed:', user);
    console.log('AuthContext - isAuthenticated:', !!user);
  }, [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 