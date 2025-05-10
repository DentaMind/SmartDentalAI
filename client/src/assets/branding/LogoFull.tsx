import React from 'react';

interface LogoProps {
  className?: string;
  invertColors?: boolean;
}

const LogoFull: React.FC<LogoProps> = ({ className = '', invertColors = false }) => {
  // Define colors based on invertColors prop
  const bgColor = invertColors ? '#ffffff' : '#0d0d0d';
  const primaryColor = '#65FF65';
  const textColor = invertColors ? '#0d0d0d' : '#ffffff';
  const accentColor = '#ffffff';
  
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-3"
      >
        <path
          d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
          fill="#000000"
        />
        <path
          d="M20 38C29.9411 38 38 29.9411 38 20C38 10.0589 29.9411 2 20 2C10.0589 2 2 10.0589 2 20C2 29.9411 10.0589 38 20 38Z"
          fill={bgColor}
        />
        <path
          d="M20 15C23.866 15 27 12.3137 27 9C27 5.68629 23.866 3 20 3C16.134 3 13 5.68629 13 9C13 12.3137 16.134 15 20 15Z"
          fill={primaryColor}
        />
        <path
          d="M18 9C18 10.6569 18.8954 12 20 12C21.1046 12 22 10.6569 22 9C22 7.34315 21.1046 6 20 6C18.8954 6 18 7.34315 18 9Z"
          fill={accentColor}
        />
        <path
          d="M10 20C10 24.4183 14.4772 28 20 28C25.5228 28 30 24.4183 30 20C30 15.5817 25.5228 12 20 12C14.4772 12 10 15.5817 10 20Z"
          fill={primaryColor}
        />
        <path
          d="M14 20C14 22.2091 16.6863 24 20 24C23.3137 24 26 22.2091 26 20C26 17.7909 23.3137 16 20 16C16.6863 16 14 17.7909 14 20Z"
          fill={bgColor}
        />
        <path
          d="M18 32C18 34.7614 18.8954 37 20 37C21.1046 37 22 34.7614 22 32C22 29.2386 21.1046 27 20 27C18.8954 27 18 29.2386 18 32Z"
          fill={primaryColor}
        />
        
        {/* Add subtle circuit patterns */}
        <path
          d="M20 28L20 30"
          stroke={primaryColor}
          strokeWidth="0.75"
          strokeOpacity="0.8"
        />
        <path
          d="M24 20H26"
          stroke={primaryColor}
          strokeWidth="0.75"
          strokeOpacity="0.8"
        />
        <path
          d="M14 20H16"
          stroke={primaryColor}
          strokeWidth="0.75"
          strokeOpacity="0.8"
        />
      </svg>
      
      <div className="flex flex-col">
        <span className={`text-xl font-bold ${invertColors ? 'text-black' : 'text-white'}`}>
          DENTAMIND
        </span>
        <span className={`text-xs tracking-wider ${invertColors ? 'text-gray-700' : 'text-gray-300'}`}>
          AI-POWERED DENTAL EXCELLENCE
        </span>
      </div>
    </div>
  );
};

export default LogoFull; 