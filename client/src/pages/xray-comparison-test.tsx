import React, { useState } from 'react';
import { XRayComparison } from '@/components/xray/xray-comparison';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';

// Sample X-ray data for testing
const sampleXrays = [
  {
    id: '1',
    imageUrl: '/sample-xrays/panoramic-2023.svg',
    type: 'Panoramic',
    date: '2023-06-15',
    provider: 'Dr. Smith',
    description: 'Annual panoramic X-ray',
    aiAnalyzed: true,
    aiFindings: [
      'No visible caries detected',
      'Mild bone loss in posterior regions',
      'Normal root morphology',
      'No visible periapical pathology'
    ]
  },
  {
    id: '2',
    imageUrl: '/sample-xrays/panoramic-2024.svg',
    type: 'Panoramic',
    date: '2024-02-20',
    provider: 'Dr. Johnson',
    description: 'Follow-up panoramic X-ray',
    aiAnalyzed: true,
    aiFindings: [
      'No visible caries detected',
      'Stable bone levels in posterior regions',
      'Normal root morphology',
      'Healing evident in periapical area of tooth #9'
    ]
  },
  {
    id: '3',
    imageUrl: '/sample-xrays/bitewing-left-2023.svg',
    type: 'Bitewing',
    date: '2023-06-15',
    provider: 'Dr. Smith',
    description: 'Left posterior bitewing',
    aiAnalyzed: true,
    aiFindings: [
      'Small occlusal caries on tooth #19',
      'Moderate bone loss between #18-19',
      'Existing restoration on #20 with good margins'
    ]
  },
  {
    id: '4',
    imageUrl: '/sample-xrays/bitewing-left-2024.svg',
    type: 'Bitewing',
    date: '2024-02-20',
    provider: 'Dr. Johnson',
    description: 'Left posterior bitewing follow-up',
    aiAnalyzed: true,
    aiFindings: [
      'Restoration placed on tooth #19',
      'Stable bone levels between #18-19',
      'No new caries detected'
    ]
  }
];

// Use the sample X-rays directly
const testXrays = sampleXrays;

export default function XRayComparisonTestPage() {
  const [comparing, setComparing] = useState(false);
  const [xrayType, setXrayType] = useState<'panoramic' | 'bitewing'>('panoramic');
  
  // Select the appropriate X-rays based on the selected type
  const beforeXray = testXrays.find(x => 
    xrayType === 'panoramic' ? x.id === '1' : x.id === '3'
  )!;
  
  const afterXray = testXrays.find(x => 
    xrayType === 'panoramic' ? x.id === '2' : x.id === '4'
  )!;
  
  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="X-Ray Comparison Test"
        description="This page demonstrates the X-ray comparison component with sample data"
      />
      
      {!comparing ? (
        <div className="my-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-medium mb-4">Select X-ray Type</h2>
            <p className="text-muted-foreground mb-6">
              Choose which type of X-rays you want to compare. This will load sample data to demonstrate the comparison functionality.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="panoramic" 
                  name="xrayType" 
                  checked={xrayType === 'panoramic'} 
                  onChange={() => setXrayType('panoramic')}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <label htmlFor="panoramic" className="text-sm font-medium">
                  Panoramic X-rays (June 2023 vs. February 2024)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="bitewing" 
                  name="xrayType" 
                  checked={xrayType === 'bitewing'} 
                  onChange={() => setXrayType('bitewing')}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <label htmlFor="bitewing" className="text-sm font-medium">
                  Bitewing X-rays - Left Side (June 2023 vs. February 2024)
                </label>
              </div>
              
              <div className="pt-4 border-t mt-6">
                <Button 
                  onClick={() => setComparing(true)}
                  className="w-full"
                >
                  Compare X-rays
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <XRayComparison 
          beforeXray={beforeXray}
          afterXray={afterXray}
          patientName="John Smith"
          onClose={() => setComparing(false)}
        />
      )}
    </div>
  );
}