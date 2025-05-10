import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Paper, Slider, Stack, Tooltip } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FlipIcon from '@mui/icons-material/Flip';
import ContrastIcon from '@mui/icons-material/Contrast';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';

interface FindingAnnotation {
  id: string;
  type: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

interface XrayViewerProps {
  imageUrl: string;
  alt?: string;
  findings?: FindingAnnotation[];
  showAnnotations?: boolean;
  onAnnotationClick?: (finding: FindingAnnotation) => void;
  width?: number | string;
  height?: number | string;
}

const XrayViewer: React.FC<XrayViewerProps> = ({
  imageUrl,
  alt = "Dental X-ray",
  findings = [],
  showAnnotations = true,
  onAnnotationClick,
  width = '100%',
  height = 500
}) => {
  // State for image manipulation
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Reset all image manipulations
  const resetImage = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setIsFlipped(false);
  };
  
  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + 0.1, 5));
    } else {
      setScale(prev => Math.max(prev - 0.1, 0.5));
    }
  };
  
  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartDragPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startDragPos.x,
        y: e.clientY - startDragPos.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartDragPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - startDragPos.x,
        y: e.touches[0].clientY - startDragPos.y
      });
    }
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  // Add event listeners for mouse and touch
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mouseleave', handleMouseUp);
      container.addEventListener('touchend', handleTouchEnd);
      container.addEventListener('touchcancel', handleTouchEnd);
      
      return () => {
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseUp);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, []);
  
  // Calculate image style based on state
  const imageStyle = {
    transform: `scale(${isFlipped ? -scale : scale}, ${scale}) rotate(${rotation}deg)`,
    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    transformOrigin: 'center',
    maxWidth: '100%',
    maxHeight: '100%',
    cursor: isDragging ? 'grabbing' : 'grab',
  };
  
  // Calculate container style based on state
  const containerStyle = {
    position: 'relative' as const,
    overflow: 'hidden',
    width,
    height,
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  const imageContainerStyle = {
    position: 'absolute' as const,
    transform: `translate(${position.x}px, ${position.y}px)`,
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={3}
        ref={containerRef}
        sx={containerStyle}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div style={imageContainerStyle}>
          <img
            ref={imageRef}
            src={imageUrl}
            alt={alt}
            style={imageStyle}
            draggable={false}
          />
          
          {/* Render finding annotations if enabled */}
          {showAnnotations && findings.map(finding => (
            <Box
              key={finding.id}
              sx={{
                position: 'absolute',
                left: finding.coordinates.x,
                top: finding.coordinates.y,
                width: finding.coordinates.width,
                height: finding.coordinates.height,
                border: '2px solid #f44336',
                borderRadius: '4px',
                backgroundColor: 'rgba(244, 67, 54, 0.3)',
                transform: `scale(${scale})`,
                cursor: 'pointer',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '-20px',
                  left: '0',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                },
                '&:hover::after': {
                  content: `"${finding.type} (${Math.round(finding.confidence * 100)}%)"`,
                  opacity: 1,
                },
              }}
              onClick={() => onAnnotationClick && onAnnotationClick(finding)}
            />
          ))}
        </div>
      </Paper>
      
      {/* Controls toolbar */}
      <Box sx={{ mt: 2, px: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
          <Tooltip title="Zoom Out">
            <IconButton onClick={() => setScale(prev => Math.max(prev - 0.1, 0.5))}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ width: 100 }}>
            <Slider
              value={scale}
              min={0.5}
              max={5}
              step={0.1}
              onChange={(_, value) => setScale(value as number)}
              aria-label="Zoom"
            />
          </Box>
          
          <Tooltip title="Zoom In">
            <IconButton onClick={() => setScale(prev => Math.min(prev + 0.1, 5))}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Rotate Left">
            <IconButton onClick={() => setRotation(prev => prev - 90)}>
              <RotateLeftIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Rotate Right">
            <IconButton onClick={() => setRotation(prev => prev + 90)}>
              <RotateRightIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Flip Horizontally">
            <IconButton onClick={() => setIsFlipped(prev => !prev)}>
              <FlipIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Reset">
            <IconButton onClick={resetImage}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: 200 }}>
            <BrightnessHighIcon sx={{ mr: 1 }} />
            <Slider
              value={brightness}
              min={50}
              max={150}
              onChange={(_, value) => setBrightness(value as number)}
              aria-label="Brightness"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', width: 200 }}>
            <ContrastIcon sx={{ mr: 1 }} />
            <Slider
              value={contrast}
              min={50}
              max={150}
              onChange={(_, value) => setContrast(value as number)}
              aria-label="Contrast"
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default XrayViewer; 