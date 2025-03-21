import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientIntakeForm } from "@/components/intake/patient-intake-form";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

/**
 * Public form page accessible via email links
 * This page is not protected and uses form tokens to validate access
 */
export default function FormPage() {
  const { formToken } = useParams<{ formToken: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function validateFormToken() {
      try {
        // Skip API call for testing with 'test' token
        if (formToken === 'test') {
          setLoading(false);
          return;
        }

        // Validate the form token
        const response = await fetch(`/api/patient-forms/validate/${formToken}`);
        
        if (!response.ok) {
          throw new Error("Invalid or expired form token");
        }
        
        const data = await response.json();
        setFormData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error validating form token:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        setLoading(false);
        
        toast({
          title: "Error",
          description: "This form link is invalid or has expired. Please contact your dental office for assistance.",
          variant: "destructive",
        });
      }
    }

    validateFormToken();
  }, [formToken, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-3xl p-4">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl text-primary">DentaMind</CardTitle>
              <CardDescription>Loading your secure patient form...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-3xl p-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-primary">DentaMind</CardTitle>
              <CardDescription>Patient Form</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  This form link is invalid or has expired. Please contact your dental office for assistance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-4xl p-4">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 border-b pb-4">
            <CardTitle className="text-2xl text-primary flex items-center">
              <img 
                src="/dentamind-logo.svg" 
                alt="DentaMind Logo" 
                className="h-8 mr-2" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2328C76F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M20 18a8 8 0 1 0-16 0"/><path d="M12 10v2"/></svg>';
                }}
              />
              DentaMind
            </CardTitle>
            <CardDescription>
              Please complete this secure patient intake form. Your information is protected and encrypted.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <PatientIntakeForm formToken={formToken} />
          </CardContent>
        </Card>
        <div className="text-center text-xs text-muted-foreground mt-4">
          Powered by DentaMind | HIPAA Compliant & Secure
        </div>
      </div>
    </div>
  );
}