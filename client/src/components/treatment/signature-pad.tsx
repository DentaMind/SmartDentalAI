import { useState, useRef, useEffect } from 'react';
import SignaturePadLib from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, Check, Undo2, X } from 'lucide-react';

interface SignaturePadProps {
  width?: number;
  height?: number;
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  initialData?: string;
}

export function SignaturePad({
  width = 500,
  height = 200,
  onSave,
  onCancel,
  initialData
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current) {
      // Fix for high DPI displays
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvasRef.current.width = width * ratio;
      canvasRef.current.height = height * ratio;
      canvasRef.current.getContext('2d')?.scale(ratio, ratio);
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
      
      // Initialize signature pad
      signaturePadRef.current = new SignaturePadLib(canvasRef.current, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'black',
        minWidth: 1,
        maxWidth: 2.5
      });
      
      // Set initial data if provided
      if (initialData) {
        signaturePadRef.current.fromDataURL(initialData);
        setIsEmpty(false);
      }
      
      // Listen for signature pad events
      signaturePadRef.current.addEventListener('beginStroke', () => {
        setIsDrawing(true);
      });
      
      signaturePadRef.current.addEventListener('endStroke', () => {
        setIsDrawing(false);
        setIsEmpty(signaturePadRef.current?.isEmpty() || false);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, [width, height, initialData]);
  
  // Clear the signature pad
  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
    }
  };
  
  // Save the signature
  const saveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureData = signaturePadRef.current.toDataURL('image/png');
      onSave(signatureData);
    }
  };

  return (
    <div className="flex flex-col">
      <Card className="border-2 mb-4">
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            className="signature-pad-canvas touch-none cursor-crosshair bg-white"
          />
        </CardContent>
      </Card>
      
      {isEmpty && !isDrawing && (
        <div className="flex items-center mb-4 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
          Please sign above using your mouse or finger
        </div>
      )}
      
      <CardFooter className="flex justify-between px-0">
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={isEmpty}
            className="mr-2"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
        
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="mr-2"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button
            type="button"
            onClick={saveSignature}
            disabled={isEmpty}
            size="sm"
          >
            <Check className="h-4 w-4 mr-2" />
            Save Signature
          </Button>
        </div>
      </CardFooter>
    </div>
  );
}