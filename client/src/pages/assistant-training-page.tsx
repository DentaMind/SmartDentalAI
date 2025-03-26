import React from "react";
import { Helmet } from "react-helmet";
import AssistantTab from "@/components/training/assistant-tab";
import { Card } from "@/components/ui/card";

export default function AssistantTrainingPage() {
  return (
    <>
      <Helmet>
        <title>Assistant Training | DentaMind</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Assistant Training Center</h1>
        
        <Card className="p-4 mb-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-2">Welcome to the Training Center</h2>
          <p className="mb-2">
            This section contains comprehensive training modules for dental assistants. 
            Each module includes step-by-step instructions, visual aids, and a quiz to 
            test your knowledge.
          </p>
          <p>
            To complete a module, study the material and pass the quiz with a score of 
            90% or higher.
          </p>
        </Card>
        
        <AssistantTab />
      </div>
    </>
  );
}