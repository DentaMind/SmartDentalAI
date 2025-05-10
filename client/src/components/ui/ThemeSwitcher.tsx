import React from 'react';
import { useBrand } from './BrandProvider';

interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A component that allows users to toggle between light and dark modes
 */
const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = '',
  showLabel = false,
  size = 'md',
}) => {
  const { mode, toggleMode } = useBrand();
  const isDark = mode === 'dark';

  // Sizes for the toggle
  const sizeClasses = {
    sm: {
      toggle: 'w-10 h-5',
      circle: 'w-4 h-4',
      translate: 'translate-x-5',
      icons: 'text-xs',
      label: 'text-xs',
    },
    md: {
      toggle: 'w-14 h-7',
      circle: 'w-5 h-5',
      translate: 'translate-x-7',
      icons: 'text-sm',
      label: 'text-sm',
    },
    lg: {
      toggle: 'w-16 h-8',
      circle: 'w-6 h-6',
      translate: 'translate-x-8',
      icons: 'text-base',
      label: 'text-base',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      {showLabel && (
        <span 
          className={`mr-2 ${currentSize.label}`} 
          style={{ color: 'var(--color-text-primary)' }}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
      
      <button
        type="button"
        onClick={toggleMode}
        className={`relative inline-flex flex-shrink-0 items-center ${currentSize.toggle} rounded-full transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 border border-solid`}
        style={{
          backgroundColor: 'var(--color-bg-subtle)',
          borderColor: 'var(--color-border)',
        }}
        aria-label={`Toggle ${isDark ? 'light' : 'dark'} mode`}
      >
        <span className="sr-only">Toggle theme</span>
        
        {/* Sun icon (light mode) */}
        <span 
          className={`absolute inset-y-0 left-0 flex items-center justify-center w-1/2 ${currentSize.icons} transition-opacity ${isDark ? 'opacity-40' : 'opacity-100'}`}
          style={{ color: isDark ? 'var(--color-text-muted)' : '#000000' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full max-w-[65%] max-h-[65%]">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" />
          </svg>
        </span>
        
        {/* Moon icon (dark mode) */}
        <span 
          className={`absolute inset-y-0 right-0 flex items-center justify-center w-1/2 ${currentSize.icons} transition-opacity ${isDark ? 'opacity-100' : 'opacity-40'}`}
          style={{ color: isDark ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full max-w-[65%] max-h-[65%]">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </span>
        
        {/* Toggle knob */}
        <span
          className={`pointer-events-none inline-block ${currentSize.circle} transform rounded-full shadow-lg ring-0 transition ease-in-out duration-200 ${isDark ? currentSize.translate : 'translate-x-0'}`}
          style={{ 
            backgroundColor: isDark ? 'var(--color-primary)' : '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </button>
    </div>
  );
};

export default ThemeSwitcher; 