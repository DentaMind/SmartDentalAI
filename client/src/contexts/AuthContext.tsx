import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthAPI } from "../lib/api";

// Define AuthContext types
type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
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
        // Get current user info
        const response = await AuthAPI.getCurrentUser();
        setUser(response.data);
      } catch (err) {
        console.error("Auth check failed:", err);
        // Clear invalid token
        localStorage.removeItem('token');
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
      const response = await AuthAPI.login(email, password);
      
      // Store token in localStorage
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        
        // Get user info
        const userResponse = await AuthAPI.getCurrentUser();
        setUser(userResponse.data);
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
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