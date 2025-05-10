import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-600">404</h1>
        <h2 className="text-3xl font-medium mt-4">Page Not Found</h2>
        <p className="mt-2 text-gray-600">The page you are looking for doesn't exist or has been moved.</p>
        <Link 
          to="/" 
          className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 