/**
 * Authentication Utilities
 * 
 * Functions for managing authentication tokens and user information.
 */

// Token storage key
const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'user_info';

/**
 * Get the authentication token from local storage
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set the authentication token in local storage
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove the authentication token from local storage
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Get the user information from local storage
 */
export function getUserInfo<T = any>(): T | null {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  
  if (!userInfo) {
    return null;
  }
  
  try {
    return JSON.parse(userInfo) as T;
  } catch (error) {
    console.error('Error parsing user info:', error);
    return null;
  }
}

/**
 * Set the user information in local storage
 */
export function setUserInfo<T = any>(userInfo: T): void {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
}

/**
 * Remove the user information from local storage
 */
export function removeUserInfo(): void {
  localStorage.removeItem(USER_INFO_KEY);
}

/**
 * Parse a JWT token to get its payload
 */
export function parseToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseToken(token);
  
  if (!payload || !payload.exp) {
    return true;
  }
  
  // Convert expiration time to milliseconds
  const expirationTime = payload.exp * 1000;
  
  // Check if the token is expired
  return Date.now() >= expirationTime;
}

/**
 * Get the token expiration date
 */
export function getTokenExpirationDate(token: string): Date | null {
  const payload = parseToken(token);
  
  if (!payload || !payload.exp) {
    return null;
  }
  
  // Convert expiration time to milliseconds
  const expirationTime = payload.exp * 1000;
  
  return new Date(expirationTime);
}

/**
 * Get the remaining time until the token expires (in seconds)
 */
export function getTokenRemainingTime(token: string): number {
  const expirationDate = getTokenExpirationDate(token);
  
  if (!expirationDate) {
    return 0;
  }
  
  const remainingTime = Math.max(0, Math.floor((expirationDate.getTime() - Date.now()) / 1000));
  
  return remainingTime;
}

/**
 * Logout the user by removing the token and user info
 */
export function logout(): void {
  removeToken();
  removeUserInfo();
}

export default {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  parseToken,
  isTokenExpired,
  getTokenExpirationDate,
  getTokenRemainingTime,
  logout
}; 