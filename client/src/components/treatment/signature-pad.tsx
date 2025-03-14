import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  initialSignature?: string;
  label?: string;
  description?: string;
}

export function SignaturePad({ 
  onSave, 
  onCancel, 
  initialSignature, 
  label = 'Please sign below', 
  description = 'Use your finger or stylus to sign' 
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize signature pad
  useEffect(() => {
    const initSignaturePad = async () => {
      try {
        setIsLoading(true);
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Set the canvas to be responsive
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);

        // Import SignaturePad dynamically
        const SignaturePadLib = (await import('signature_pad')).default;
        
        // Initialize the signature pad
        signaturePadRef.current = new SignaturePadLib(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)'
        });
        
        // Listen for signature pad events
        signaturePadRef.current.addEventListener("beginStroke", () => {
          setIsEmpty(false);
        });
        
        // If there's an initial signature, load it
        if (initialSignature) {
          signaturePadRef.current.fromDataURL(initialSignature);
          setIsEmpty(false);
        }
        
      } catch (error) {
        console.error("Error initializing signature pad:", error);
        toast({
          title: "Signature Pad Error",
          description: "Could not initialize the signature pad. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initSignaturePad();

    // Handle window resize
    const handleResize = () => {
      if (signaturePadRef.current) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Save the current signature data
        const data = signaturePadRef.current.toDataURL();
        
        // Resize the canvas
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        
        // Restore the signature data
        signaturePadRef.current.fromDataURL(data);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, [initialSignature]);

  // Clear the signature
  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
    }
  };

  // Save the signature
  const saveSignature = () => {
    if (!signaturePadRef.current) {
      toast({
        title: "Signature Pad Error",
        description: "Could not access the signature pad. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    if (signaturePadRef.current.isEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please sign before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    const signatureData = signaturePadRef.current.toDataURL();
    onSave(signatureData);
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-muted rounded-md animate-pulse">
            <span className="text-muted-foreground">Loading signature pad...</span>
          </div>
        ) : (
          <div className="border rounded-md p-2 bg-white touch-manipulation">
            <canvas 
              ref={canvasRef}
              className="w-full h-64 border-0 touch-none cursor-crosshair"
              style={{ touchAction: "none" }}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={clearSignature} disabled={isEmpty}>
            Clear
          </Button>
        </div>
        <Button onClick={saveSignature} disabled={isEmpty || isLoading}>
          Save Signature
        </Button>
      </CardFooter>
    </Card>
  );
}