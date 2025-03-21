import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

type MascotEmotion = 'happy' | 'excited' | 'thinking' | 'explaining' | 'greeting';
type MascotPosition = 'left' | 'right' | 'bottom' | 'top';

export interface MascotMessage {
  id: string;
  text: string;
  emotion?: MascotEmotion;
  action?: () => void;
  actionLabel?: string;
  duration?: number; // Duration in ms before auto-dismissing
}

interface MascotCharacterProps {
  position?: MascotPosition;
  initialEmotion?: MascotEmotion;
  name?: string;
  showMessage?: MascotMessage;
  size?: 'sm' | 'md' | 'lg';
  onMessageDismiss?: () => void;
  onInteract?: () => void;
}

export const MascotCharacter: React.FC<MascotCharacterProps> = ({
  position = 'bottom',
  initialEmotion = 'happy',
  name = 'Denti',
  showMessage,
  size = 'md',
  onMessageDismiss,
  onInteract,
}) => {
  const [currentEmotion, setCurrentEmotion] = useState<MascotEmotion>(initialEmotion);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Handle automatic message dismissal if duration is provided
  useEffect(() => {
    if (showMessage?.duration && showMessage.duration > 0) {
      const timer = setTimeout(() => {
        onMessageDismiss?.();
      }, showMessage.duration);
      
      return () => clearTimeout(timer);
    }
  }, [showMessage, onMessageDismiss]);
  
  // Set emotion based on the message
  useEffect(() => {
    if (showMessage?.emotion) {
      setCurrentEmotion(showMessage.emotion);
    }
  }, [showMessage]);

  const handleMascotClick = () => {
    setIsAnimating(true);
    onInteract?.();
    
    // Revert animation state after a short delay
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Set size-dependent styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: '70px', height: '70px' };
      case 'lg':
        return { width: '150px', height: '150px' };
      case 'md':
      default:
        return { width: '100px', height: '100px' };
    }
  };

  // Position-dependent styles
  const getPositionStyles = () => {
    switch (position) {
      case 'left':
        return { left: '20px', bottom: '20px' };
      case 'right':
        return { right: '20px', bottom: '20px' };
      case 'top':
        return { top: '20px', right: '20px' };
      case 'bottom':
      default:
        return { bottom: '20px', right: '20px' };
    }
  };

  // Message bubble position based on mascot position
  const getMessagePosition = () => {
    switch (position) {
      case 'left':
        return 'left-full ml-4';
      case 'right':
        return 'right-full mr-4';
      case 'top':
        return 'top-full mt-4';
      case 'bottom':
      default:
        return 'bottom-full mb-4';
    }
  };

  // Get emotion-specific styles and expressions
  const getEmotionStyles = () => {
    switch (currentEmotion) {
      case 'excited':
        return {
          color: '#FFC107',
          eyeStyle: 'rounded-full',
          mouthStyle: 'rounded-full w-4 h-4',
          eyebrowStyle: 'rotate-[-15deg] translate-y-[-3px]',
        };
      case 'thinking':
        return {
          color: '#64B5F6',
          eyeStyle: 'rounded-full',
          mouthStyle: 'w-3 h-1 rounded-full',
          eyebrowStyle: 'transform rotate-[15deg] translate-y-[-2px]',
        };
      case 'explaining':
        return {
          color: '#4CAF50',
          eyeStyle: 'rounded-full',
          mouthStyle: 'w-4 h-3 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%]',
          eyebrowStyle: '',
        };
      case 'greeting':
        return {
          color: '#FF9800',
          eyeStyle: 'rounded-full',
          mouthStyle: 'w-5 h-3 rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%]',
          eyebrowStyle: 'rotate-[-10deg] translate-y-[-2px]',
        };
      case 'happy':
      default:
        return {
          color: '#28C76F', // DentaMind green
          eyeStyle: 'rounded-full',
          mouthStyle: 'w-5 h-3 rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%]',
          eyebrowStyle: '',
        };
    }
  };

  const emotionStyles = getEmotionStyles();
  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();
  const messagePosition = getMessagePosition();

  if (!isVisible) return null;

  return (
    <div 
      className="fixed z-50"
      style={positionStyles}
    >
      {/* Message bubble */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className={`absolute ${messagePosition} w-64 bg-white rounded-xl p-4 shadow-lg border-2`}
            style={{ borderColor: emotionStyles.color }}
          >
            <div className="relative">
              <h4 className="font-bold text-gray-700 text-sm mb-1">{name} says:</h4>
              <p className="text-gray-600 text-sm">{showMessage.text}</p>
              
              {showMessage.action && showMessage.actionLabel && (
                <Button
                  onClick={showMessage.action}
                  size="sm"
                  className="mt-2 w-full"
                  style={{ backgroundColor: emotionStyles.color }}
                >
                  {showMessage.actionLabel}
                </Button>
              )}
              
              <button 
                onClick={onMessageDismiss}
                className="absolute -top-2 -right-2 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-300 transition-colors"
                aria-label="Dismiss message"
              >
                <span className="text-xs">&times;</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mascot character */}
      <motion.div
        className="cursor-pointer rounded-full flex items-center justify-center shadow-lg"
        style={{
          ...sizeStyles,
          backgroundColor: emotionStyles.color,
          boxShadow: `0 5px 15px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255, 255, 255, 0.8)`,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={isAnimating ? { rotate: [0, 15, -15, 10, -10, 5, -5, 0] } : {}}
        onClick={handleMascotClick}
      >
        {/* Robot head for mascot */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Robot eyes */}
          <div className="flex space-x-2 mb-1">
            <motion.div 
              className="bg-white rounded-sm w-3 h-3"
              animate={{ scaleY: isAnimating ? [1, 0.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="bg-white rounded-sm w-3 h-3"
              animate={{ scaleY: isAnimating ? [1, 0.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Robot mouth/speaker */}
          <div className="mt-1 bg-white w-6 h-1.5 rounded-sm flex justify-center items-center">
            <div className="w-4 h-0.5 bg-current opacity-30"></div>
          </div>
          
          {/* Antenna */}
          <div className="absolute top-[-8px] w-1 h-3 bg-white rounded-full"></div>
        </div>
      </motion.div>
    </div>
  );
};