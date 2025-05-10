import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

export const AdvancedXrayAnalyzer = () => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Advanced X-ray Analysis</Card.Title>
        <Card.Description>
          Upload dental X-rays for AI-powered analysis and diagnosis
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500">
              Drag and drop X-ray images here, or click to select files
            </p>
          </div>
          <Button variant="primary" className="w-full">
            Analyze X-rays
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
};