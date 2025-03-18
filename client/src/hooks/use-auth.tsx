import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

// Type guard for axios error responses
function isAxiosError(error: any): error is { response?: { status: number; data?: any } } {
  return error && typeof error === 'object' && 'response' in error;
}

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
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        // Set the user from localStorage data temporarily
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem('user');
      }
    }
    
    // Check the server session status regardless of local storage
    (async () => {
      try {
        const response = await api.get('/user');
        if (response.status === 200) {
          // Update user from server data, which is the source of truth
          setUser(response.data);
          // Update localStorage with the latest user data
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (err: unknown) {
        console.log('No active session found on server');
        // Clear any potentially stale user data
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);
  
  const login = async (username: string, password: string, mfaCode?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear any existing auth flags to prevent UI issues
      sessionStorage.removeItem("inAuthPage");
      
      const response = await api.post('/auth/login', { 
        username, 
        password,
        mfaCode
      });
      
      const userData = response.data;
      
      // Handle MFA required response
      if (userData.status === 'mfa_required') {
        setIsLoading(false);
        console.log('MFA required for login');
        throw new Error('MFA_REQUIRED');
      }
      
      // For session-based auth, we don't need to store tokens
      // Instead, just store user data for UI purposes
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      console.log('User logged in successfully');
      
      // Clear redirected path on successful login
      const redirectedFrom = sessionStorage.getItem("redirectedFrom");
      if (redirectedFrom) {
        console.log('Will redirect to:', redirectedFrom);
      }
    } catch (err: unknown) {
      // Format error message for user-friendly display
      let message = 'Login failed. Please check your credentials.';
      
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          message = 'Invalid username or password. Please try again.';
        } else if (err.response?.status === 429) {
          message = 'Too many login attempts. Please try again later.';
        } else if (err.response?.status === 403) {
          message = 'Your account is locked. Please contact an administrator.';
        } else if (err.response?.data?.message) {
          message = err.response.data.message;
        }
      } else if (err instanceof Error) {
        if (err.message === 'MFA_REQUIRED') {
          message = 'Multi-factor authentication required';
        } else if (err.message) {
          message = err.message;
        }
      }
      
      console.error('Login error:', message);
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
      const response = await api.post('/auth/register', userData);
      const data = response.data;
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(data));
      
      setUser(data);
      console.log('User registered successfully:', data);
    } catch (err: unknown) {
      let message = 'Registration failed. Please try again.';
      
      if (isAxiosError(err)) {
        if (err.response?.status === 409) {
          message = 'Username or email already exists. Please try another.';
        } else if (err.response?.status === 400) {
          message = err.response?.data?.message || 'Invalid registration data. Please check all fields.';
        } else if (err.response?.data?.message) {
          message = err.response.data.message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      
      console.error('Registration error:', err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      // Call the logout endpoint
      await api.post('/auth/logout');
    } catch (err: unknown) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage regardless of server response
      localStorage.removeItem('user');
      setUser(null);
    }
  };
  
  const refreshAuth = async () => {
    try {
      // For session-based auth, we just need to check if the session is still valid
      const response = await api.get('/user');
      
      if (response.status === 200) {
        setUser(response.data);
        // Store updated user data
        localStorage.setItem('user', JSON.stringify(response.data));
        return true;
      }
      return false;
    } catch (err: unknown) {
      console.error('Auth refresh failed:', err);
      // Only clear user data if the error is a 401 (unauthorized)
      // This prevents clearing user data on network errors
      if (isAxiosError(err) && err.response?.status === 401) {
        console.log('Session expired or invalid, clearing user data');
        localStorage.removeItem('user');
        setUser(null);
      }
      return false;
    }
  };
  
  const setupMFA = async (): Promise<MFASetupData> => {
    try {
      const response = await api.post('/auth/mfa/setup');
      return response.data;
    } catch (err: unknown) {
      let message = 'MFA setup failed';
      
      if (isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      
      setError(message);
      throw err;
    }
  };
  
  const enableMFA = async (verificationCode: string): Promise<void> => {
    try {
      await api.post('/auth/mfa/enable', { verificationCode });
    } catch (err: unknown) {
      let message = 'Failed to enable MFA';
      
      if (isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      
      setError(message);
      throw err;
    }
  };
  
  const disableMFA = async (password: string): Promise<void> => {
    try {
      await api.post('/auth/mfa/disable', { password });
    } catch (err: unknown) {
      let message = 'Failed to disable MFA';
      
      if (isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      
      setError(message);
      throw err;
    }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await api.post('/auth/password/change', { 
        currentPassword, 
        newPassword 
      });
    } catch (err: unknown) {
      let message = 'Password change failed';
      
      if (isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      
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
