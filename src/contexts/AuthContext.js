import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

// Create Authentication Context
const AuthContext = createContext(null);

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  // Initialize axios instance with authentication header
  const authAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  // Verify token and load user data on startup
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Check token expiration
        const decodedToken = jwt_decode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token expired
          logout();
          setLoading(false);
          return;
        }
        
        // Token valid, get user info
        const response = await authAxios.get('/users/me');
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Token verification failed:', err);
        logout();
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Update axios authorization header when token changes
  useEffect(() => {
    authAxios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }, [token]);

  // Login user
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/token`, {
        username,
        password,
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Get user data
      const userResponse = await authAxios.get('/users/me');
      setUser(userResponse.data);
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      setLoading(false);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Register user (if needed)
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/users`, userData);
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
      setLoading(false);
      throw err;
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        register,
        hasRole,
        authAxios,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 