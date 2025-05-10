import React from 'react';
import { CardVariant, useBrand } from './BrandProvider';

interface BrandCardProps {
  variant?: CardVariant;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
  onClick?: () => void;
  highlight?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'none';
}

const BrandCard: React.FC<BrandCardProps> = ({
  variant = 'default',
  title,
  subtitle,
  icon,
  footer,
  headerAction,
  className = '',
  contentClassName = '',
  children,
  onClick,
  highlight = 'none',
}) => {
  const { colors } = useBrand();

  // Variant classes
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white border border-gray-200 shadow-md',
    outlined: `border-2 border-[${colors.primary}] bg-white`,
    highlighted: `bg-gradient-to-br from-[${colors.bgDark}] to-[${colors.bgMedium}] text-white`,
  };

  // Highlight indicator class
  const highlightClass = highlight !== 'none' ? `border-l-4 border-[${colors[highlight]}]` : '';

  // Is card clickable
  const isClickable = !!onClick;
  const clickableClasses = isClickable ? 'cursor-pointer transition-transform hover:scale-[1.01]' : '';

  return (
    <div 
      className={`
        ${variantClasses[variant]}
        ${highlightClass}
        ${clickableClasses}
        rounded-lg overflow-hidden
        ${className}
      `}
      onClick={onClick}
    >
      {/* Card Header (optional) */}
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            {icon && <div className="text-[${colors.primary}]">{icon}</div>}
            <div>
              {title && (
                <h3 className={variant === 'highlighted' ? 'text-white text-lg font-medium' : 'text-gray-800 text-lg font-medium'}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={variant === 'highlighted' ? 'text-gray-300 text-sm' : 'text-gray-500 text-sm'}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {/* Card Content */}
      <div className={`px-5 py-4 ${contentClassName}`}>
        {children}
      </div>

      {/* Card Footer (optional) */}
      {footer && (
        <div className={`
          px-5 py-3 border-t 
          ${variant === 'highlighted' ? 'border-gray-700 bg-[${colors.bgMedium}]' : 'border-gray-100 bg-gray-50'}
        `}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default BrandCard; 