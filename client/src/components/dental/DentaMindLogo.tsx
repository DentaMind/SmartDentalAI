import React from 'react';

interface DentaMindLogoProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

const DentaMindLogo: React.FC<DentaMindLogoProps> = ({ 
  width = '160px', 
  height = 'auto', 
  className = '' 
}) => {
  return (
    <img 
      src="/assets/dentamind-face-logo.svg" 
      alt="DentaMind Logo" 
      width={width} 
      height={height}
      className={className}
      style={{ objectFit: 'contain', maxWidth: '100%' }}
    />
  );
};

export default DentaMindLogo; 