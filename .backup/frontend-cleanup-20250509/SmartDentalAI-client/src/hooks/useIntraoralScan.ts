import { useState, useCallback } from 'react';
import { IntraoralScan } from '@shared/schema';

interface UseIntraoralScanProps {
  scan: IntraoralScan;
  onTransformChange?: (transform: any) => void;
}

export const useIntraoralScan = ({ scan, onTransformChange }: UseIntraoralScanProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(scan.opacity);
  const [transform, setTransform] = useState(scan.transform || {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const updateOpacity = useCallback((newOpacity: number) => {
    setOpacity(newOpacity);
  }, []);

  const updateTransform = useCallback((newTransform: any) => {
    setTransform(newTransform);
    if (onTransformChange) {
      onTransformChange(newTransform);
    }
  }, [onTransformChange]);

  const resetTransform = useCallback(() => {
    const defaultTransform = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
    setTransform(defaultTransform);
    if (onTransformChange) {
      onTransformChange(defaultTransform);
    }
  }, [onTransformChange]);

  const handleDrag = useCallback((event: any) => {
    const { x, y } = event.target.position();
    updateTransform({
      ...transform,
      position: { ...transform.position, x, y }
    });
  }, [transform, updateTransform]);

  const handleRotate = useCallback((event: any) => {
    const { rotation } = event.target.attrs;
    updateTransform({
      ...transform,
      rotation: { ...transform.rotation, z: rotation }
    });
  }, [transform, updateTransform]);

  const handleScale = useCallback((event: any) => {
    const { scaleX, scaleY } = event.target.attrs;
    updateTransform({
      ...transform,
      scale: { ...transform.scale, x: scaleX, y: scaleY }
    });
  }, [transform, updateTransform]);

  return {
    isVisible,
    opacity,
    transform,
    toggleVisibility,
    updateOpacity,
    updateTransform,
    resetTransform,
    handleDrag,
    handleRotate,
    handleScale
  };
}; 