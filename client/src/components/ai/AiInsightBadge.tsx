import React, { useState } from 'react';
import { useBrand } from '../ui/BrandProvider';

interface AiInsightBadgeProps {
  confidence: number; // 0-100
  insight: string;
  detailedExplanation?: string;
  type?: 'diagnosis' | 'treatment' | 'alert' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * A badge component that displays AI diagnostic/treatment insights with confidence level
 */
const AiInsightBadge: React.FC<AiInsightBadgeProps> = ({
  confidence,
  insight,
  detailedExplanation,
  type = 'diagnosis',
  size = 'md',
  className = '',
}) => {
  const { colors, mode } = useBrand();
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Determine badge color based on confidence and type
  const getColor = () => {
    // Base colors by type
    const typeColors = {
      diagnosis: colors.primary,
      treatment: colors.info,
      alert: colors.error,
      info: colors.success,
    };
    
    // Adjust opacity based on confidence
    if (confidence < 50) {
      return {
        bg: `${typeColors[type]}30`, // 30% opacity
        text: mode === 'dark' ? colors.textPrimary : colors.textSecondary,
        border: `${typeColors[type]}50` // 50% opacity
      };
    } else if (confidence < 75) {
      return {
        bg: `${typeColors[type]}50`, // 50% opacity
        text: type === 'diagnosis' ? colors.bgDark : colors.textPrimary,
        border: `${typeColors[type]}70` // 70% opacity
      };
    } else {
      return {
        bg: typeColors[type],
        text: type === 'diagnosis' ? colors.bgDark : colors.textPrimary,
        border: typeColors[type]
      };
    }
  };
  
  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          badge: 'text-xs px-2 py-0.5',
          icon: 'w-3 h-3',
          confidence: 'w-8',
        };
      case 'lg':
        return {
          badge: 'text-base px-3 py-1.5',
          icon: 'w-5 h-5',
          confidence: 'w-12',
        };
      case 'md':
      default:
        return {
          badge: 'text-sm px-2.5 py-1',
          icon: 'w-4 h-4',
          confidence: 'w-10',
        };
    }
  };
  
  const { badge: badgeSize, icon: iconSize, confidence: confidenceSize } = getSizeClasses();
  const { bg, text, border } = getColor();
  
  // Icon based on type
  const getIcon = () => {
    switch (type) {
      case 'diagnosis':
        return (
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        );
      case 'treatment':
        return (
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'alert':
        return (
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  return (
    <div className={`relative inline-flex ${className}`}>
      <div 
        className={`flex items-center gap-1.5 rounded-full border ${badgeSize}`}
        style={{ 
          backgroundColor: bg,
          color: text,
          borderColor: border
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="flex items-center">
          {getIcon()}
        </span>
        <span>AI: {confidence}%</span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && detailedExplanation && (
        <div 
          className="absolute top-full left-0 mt-2 p-3 rounded-md shadow-lg z-50 max-w-xs"
          style={{
            backgroundColor: mode === 'dark' ? colors.bgMedium : colors.textPrimary,
            color: mode === 'dark' ? colors.textPrimary : colors.textLight,
            border: `1px solid ${border}`
          }}
        >
          <div className="font-medium mb-1">{insight}</div>
          <div className="text-sm opacity-90">{detailedExplanation}</div>
          <div 
            className="absolute bottom-full left-4 w-3 h-3 rotate-45"
            style={{
              backgroundColor: mode === 'dark' ? colors.bgMedium : colors.textPrimary,
              borderLeft: `1px solid ${border}`,
              borderTop: `1px solid ${border}`
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default AiInsightBadge; 