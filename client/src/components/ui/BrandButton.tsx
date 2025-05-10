import React from 'react';
import { ButtonVariant, useBrand } from './BrandProvider';

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

const BrandButton: React.FC<BrandButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  startIcon,
  endIcon,
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const { colors, mode } = useBrand();

  // Determine base classes based on size
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg',
  };

  // Build proper variant styles with CSS variables
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return `bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-medium`;
      case 'secondary':
        return `bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-medium)] ${mode === 'dark' ? 'text-white' : 'text-black'}`;
      case 'outline':
        return `border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-transparent)]`;
      case 'ghost':
        return `text-[var(--color-primary)] hover:bg-[var(--color-primary-transparent)]`;
      case 'danger':
        return `bg-[var(--color-error)] hover:opacity-90 text-white`;
      default:
        return `bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-medium`;
    }
  };

  // Combine all classes
  const buttonClasses = `
    ${sizeClasses[size]}
    ${getVariantClasses()}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    flex items-center justify-center gap-2 rounded-md transition-colors
    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-50
    ${className}
  `;

  return (
    <button
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading && (
        <div className="loading-spinner mr-2 h-4 w-4"></div>
      )}
      
      {startIcon && !loading && <span className="icon-container">{startIcon}</span>}
      <span>{children}</span>
      {endIcon && <span className="icon-container">{endIcon}</span>}
    </button>
  );
};

export default BrandButton; 