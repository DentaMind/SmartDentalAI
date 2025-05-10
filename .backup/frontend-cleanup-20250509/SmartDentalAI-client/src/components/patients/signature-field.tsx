import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/use-toast';

interface SignatureFieldProps {
  name: string;
  label: string;
  latestFormId?: number;
}

export function SignatureField({ name, label, latestFormId }: SignatureFieldProps) {
  const { control } = useFormContext();
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);
  const form = useForm();

  const clearSignature = () => {
    signatureRef.current?.clear();
    setIsSigned(false);
  };

  const validateSignature = () => {
    if (!signatureRef.current) return false;
    return !signatureRef.current.isEmpty();
  };

  useEffect(() => {
    const values = form.getValues();

    if (values.additionalInfo?.patientSignature && values.additionalInfo?.providerSignature && latestFormId) {
      // Call API to update form record status
      fetch(`/api/patient-form-records/${latestFormId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'signed' }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to update form status');
          }
          toast.success('Form signed successfully');
        })
        .catch(error => {
          console.error('Error updating form status:', error);
          toast.error('Failed to update form status');
        });
    }
  }, [form.watch('additionalInfo.patientSignature'), form.watch('additionalInfo.providerSignature'), latestFormId]);

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: {
          required: (value) => {
            if (!value) return true; // Allow empty
            return value.startsWith("data:image/") || "Invalid signature format";
          },
        },
      }}
      render={({ field: { onChange, value } }) => (
        <div className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Card>
            <CardContent className="p-4">
              <div className="border rounded-md">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: "w-full h-32 bg-white",
                  }}
                  onEnd={() => {
                    if (validateSignature()) {
                      const signature = signatureRef.current?.toDataURL();
                      if (signature) {
                        onChange(signature);
                        setIsSigned(true);
                      }
                    } else {
                      onChange("");
                      setIsSigned(false);
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearSignature();
                    onChange("");
                  }}
                >
                  Clear
                </Button>
                {isSigned && (
                  <span className="text-sm text-green-600">Signature saved</span>
                )}
              </div>
              {value && (
                <div className="mt-2">
                  <img
                    src={value}
                    alt="Saved signature preview"
                    className="h-16 border rounded"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    />
  );
} 