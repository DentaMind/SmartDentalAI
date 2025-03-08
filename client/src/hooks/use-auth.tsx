import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialization?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string, mfaCode?: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<boolean | undefined>;
  setupMFA: () => Promise<MFASetupData>;
  enableMFA: (verificationCode: string) => Promise<void>;
  disableMFA: (password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

interface MFASetupData {
  mfaSecret: string;
  currentCode: string;
  setupUri: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  specialization?: string;
  licenseNumber?: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Effect to check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setIsLoading(false);
    
    // If token exists, validate it
    if (token) {
      refreshAuth();
    }
  }, []);
  
  const login = async (username: string, password: string, mfaCode?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/login', { 
        username, 
        password,
        mfaCode
      });
      
      const userData = response.data;
      
      // Handle MFA required response
      if (userData.status === 'mfa_required') {
        setIsLoading(false);
        throw new Error('MFA_REQUIRED');
      }
      
      // For session-based auth, we don't need to store tokens
      // Instead, just store user data for UI purposes
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      console.log('User logged in successfully:', userData);
    } catch (err: any) {
      const message = err.response?.data?.message || 
                      err.message || 
                      'Login failed. Please check your credentials.';
      console.error('Login error:', err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest('POST', '/api/auth/register', userData);
      const data = await res.json();
      
      // Save tokens
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };
  
  const refreshAuth = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;
    
    try {
      const res = await apiRequest('POST', '/api/auth/refresh', { refreshToken });
      const data = await res.json();
      
      // Update tokens
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Keep current user data
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // Clear auth data on refresh failure
      logout();
      return false;
    }
  };
  
  const setupMFA = async (): Promise<MFASetupData> => {
    try {
      const res = await apiRequest('POST', '/api/auth/mfa/setup', {});
      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'MFA setup failed';
      setError(message);
      throw err;
    }
  };
  
  const enableMFA = async (verificationCode: string): Promise<void> => {
    try {
      await apiRequest('POST', '/api/auth/mfa/enable', { verificationCode });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'MFA enable failed';
      setError(message);
      throw err;
    }
  };
  
  const disableMFA = async (password: string): Promise<void> => {
    try {
      await apiRequest('POST', '/api/auth/mfa/disable', { password });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'MFA disable failed';
      setError(message);
      throw err;
    }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await apiRequest('POST', '/api/auth/password/change', { 
        currentPassword, 
        newPassword 
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password change failed';
      setError(message);
      throw err;
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        error, 
        login, 
        register, 
        logout, 
        refreshAuth,
        setupMFA,
        enableMFA,
        disableMFA,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
