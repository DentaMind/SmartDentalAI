import React, { createContext, useState, useContext, useEffect } from "react";
// Import API from lib/api
import API from '../lib/api';

// Define AuthContext types
type User = {
  id: string;
  email: string;
  name?: string;         // From MSW mock
  full_name?: string;    // From API response
  role: string;
  is_active?: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in (token exists)
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Get current user from localStorage if available
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        }

        // Otherwise try to get from API
        try {
          const userResponse = await API.get('/api/auth/profile');
          if (userResponse) {
            setUser(userResponse);
            localStorage.setItem('user', JSON.stringify(userResponse));
          }
        } catch (err) {
          console.error("Failed to get current user:", err);
          // Don't clear token here as it might be a temporary API issue
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        // Clear invalid token or data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await API.post('/api/auth/login', { email, password });
      
      // Store token in localStorage 
      if (response.token) {
        localStorage.setItem('token', response.token);
        
        // Store user data
        if (response.user) {
          setUser(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          setLoading(false);
          return true;
        }
      }
      
      setLoading(false);
      setError("Invalid response from server");
      return false;
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Login failed. Please check your credentials.");
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext; 