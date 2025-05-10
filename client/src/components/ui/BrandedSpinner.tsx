import React from 'react';
import { useBrand } from './BrandProvider';

interface BrandedSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'light' | 'dark';
  className?: string;
  label?: string;
  centered?: boolean;
}

const BrandedSpinner: React.FC<BrandedSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  label,
  centered = false,
}) => {
  const { colors } = useBrand();

  // Size mapping
  const sizeMap = {
    xs: { spinner: 'w-4 h-4', text: 'text-xs' },
    sm: { spinner: 'w-6 h-6', text: 'text-sm' },
    md: { spinner: 'w-8 h-8', text: 'text-base' },
    lg: { spinner: 'w-12 h-12', text: 'text-lg' },
  };

  // Color mapping
  const colorMap = {
    primary: {
      border: `border-[${colors.primaryTransparent}]`,
      spinner: `border-[${colors.primary}]`,
      text: `text-[${colors.primary}]`,
    },
    light: {
      border: 'border-gray-200',
      spinner: 'border-white',
      text: 'text-white',
    },
    dark: {
      border: `border-[${colors.bgLight}]`,
      spinner: `border-[${colors.bgDark}]`,
      text: 'text-gray-700',
    },
  };

  // Container classes
  const containerClasses = `
    ${centered ? 'flex flex-col items-center justify-center' : ''}
    ${className}
  `;

  // Calculate animation delay for the dots
  const dotAnimationDelay = (index: number) => {
    return `animation-delay-${index * 100}ms`;
  };

  return (
    <div className={containerClasses}>
      {/* Spinner */}
      <div className="relative">
        <div 
          className={`
            ${sizeMap[size].spinner}
            ${colorMap[variant].border}
            border-4 rounded-full
            opacity-30
          `}
        ></div>
        <div 
          className={`
            ${sizeMap[size].spinner}
            ${colorMap[variant].spinner}
            border-4 rounded-full
            border-t-transparent
            animate-spin
            absolute
            top-0
            left-0
          `}
        ></div>
      </div>

      {/* Optional loading text */}
      {label && (
        <div className={`mt-2 ${sizeMap[size].text} ${colorMap[variant].text} flex items-center`}>
          <span>{label}</span>
          <span className="flex ml-1">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className={`animate-pulse ${dotAnimationDelay(i)}`}
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                .
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandedSpinner; 