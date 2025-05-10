import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component
 * 
 * Checks if the user is authenticated.
 * If authenticated, renders the children
 * If not authenticated, redirects to login page with return path
 * Prevents redirect loops by tracking redirect attempts
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // Reset the redirect counter if the user successfully authenticates
    if (isAuthenticated) {
      sessionStorage.removeItem('redirectAttempts');
    }
  }, [isAuthenticated]);
  
  // If still loading auth status, don't render anything yet
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }
  
  // If not authenticated, redirect to login, but prevent infinite loops
  if (!isAuthenticated) {
    // Get current redirect attempts count
    const attemptsStr = sessionStorage.getItem('redirectAttempts') || '0';
    let attempts = parseInt(attemptsStr, 10);
    
    // Increment and store the attempts
    attempts += 1;
    sessionStorage.setItem('redirectAttempts', attempts.toString());
    
    // If too many attempts, show an error instead of redirecting
    if (attempts > 5) {
      return (
        <div style={{ 
          padding: '20px', 
          maxWidth: '600px', 
          margin: '100px auto', 
          textAlign: 'center',
          border: '1px solid #f2f2f2',
          borderRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#d32f2f', marginBottom: '16px' }}>Authentication Error</h2>
          <p>There seems to be a problem with your login session.</p>
          <p style={{ marginTop: '16px' }}>
            <a href="/login" 
              onClick={() => sessionStorage.removeItem('redirectAttempts')} 
              style={{ color: '#2196f3', textDecoration: 'underline' }}>
              Return to login
            </a>
          </p>
        </div>
      );
    }
    
    // Save the location they were trying to go to and redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If authenticated, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute; 