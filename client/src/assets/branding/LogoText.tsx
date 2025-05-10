import React from 'react';

interface LogoTextProps {
  className?: string;
  invertColors?: boolean;
  showTagline?: boolean;
}

const LogoText: React.FC<LogoTextProps> = ({ 
  className = '', 
  invertColors = false,
  showTagline = true 
}) => {
  // Define colors based on invertColors prop
  const textColor = invertColors ? '#0d0d0d' : '#ffffff';
  const mutedTextColor = invertColors ? '#4a4a4a' : '#a0a0a0';
  const accentColor = '#65FF65';
  
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center">
        <span 
          className={`text-xl font-bold tracking-wider ${invertColors ? 'text-black' : 'text-white'}`}
          style={{ letterSpacing: '0.05em' }}
        >
          <span className="text-[#65FF65]">DENTA</span>
          <span style={{ color: textColor }}>MIND</span>
        </span>
      </div>
      
      {showTagline && (
        <span 
          className={`text-xs tracking-wider ${invertColors ? 'text-gray-700' : 'text-gray-300'}`}
          style={{ letterSpacing: '0.08em' }}
        >
          AI-POWERED DENTAL EXCELLENCE
        </span>
      )}
    </div>
  );
};

export default LogoText; 