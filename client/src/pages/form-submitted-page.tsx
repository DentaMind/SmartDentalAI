import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Thank you page shown after a patient form is submitted successfully
 */
export default function FormSubmittedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-3xl p-4">
        <Card>
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-primary">Thank You!</CardTitle>
            <CardDescription className="text-lg">
              Your form has been submitted successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Thank you for taking the time to complete your patient intake form. 
              Your information has been securely recorded and will help us provide 
              you with the best possible dental care.
            </p>
            
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mt-6 text-left">
              <h3 className="font-medium text-primary mb-2">What happens next?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Our team will review your information before your appointment</li>
                <li>If we have any questions, we'll contact you via phone or email</li>
                <li>Please arrive 10-15 minutes early for your first appointment</li>
                <li>Be sure to bring your insurance card and a valid ID</li>
              </ul>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              If you need to update any information or have questions, please call our office.
            </p>
            
            <div className="mt-8 flex flex-col items-center space-y-2">
              <a href="https://dentamind.replit.app/">
                <Button>Return to DentaMind</Button>
              </a>
              <p className="text-xs text-muted-foreground">
                You may now close this window.
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="text-center text-xs text-muted-foreground mt-4">
          Powered by DentaMind | HIPAA Compliant & Secure
        </div>
      </div>
    </div>
  );
}