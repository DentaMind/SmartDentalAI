import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, message, Spin, Alert } from 'antd';
import { SurgicalGuideService } from '../../services/surgical-guide';
import { 
  Implant, 
  NerveTrace, 
  SurgicalGuideSettings, 
  GuideAnalysis, 
  GuideValidation 
} from '../../../server/types/surgical-guide';
import * as THREE from 'three';
import GuideAnalysisStep from './GuideAnalysisStep';
import GuideGenerationStep from './GuideGenerationStep';
import GuideValidationStep from './GuideValidationStep';
import GuideExportStep from './GuideExportStep';

const { Step } = Steps;

interface SurgicalGuideWorkflowProps {
  implants: Implant[];
  tissueSurface: THREE.BufferGeometry;
  nerveTraces: NerveTrace[];
}

const SurgicalGuideWorkflow: React.FC<SurgicalGuideWorkflowProps> = ({
  implants,
  tissueSurface,
  nerveTraces
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<GuideAnalysis | null>(null);
  const [validation, setValidation] = useState<GuideValidation | null>(null);
  const [guideGeometry, setGuideGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [settings, setSettings] = useState<SurgicalGuideSettings>({
    shellThickness: 2,
    offset: 0.5,
    sleeveDiameter: 3,
    drillClearance: 0.2,
    ventilationHoles: true,
    holeSpacing: 5,
    holeDiameter: 1
  });

  const guideService = SurgicalGuideService.getInstance();

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await guideService.analyzeGuide(implants, tissueSurface, nerveTraces);
      setAnalysis(result);
      setCurrentStep(1);
    } catch (err) {
      setError('Failed to analyze guide. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const stlBlob = await guideService.generateGuide(implants, tissueSurface, settings);
      
      // Create a URL for the STL file
      const url = window.URL.createObjectURL(stlBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'surgical-guide.stl';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setCurrentStep(2);
    } catch (err) {
      setError('Failed to generate guide. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!guideGeometry) return;

    try {
      setLoading(true);
      setError(null);
      const result = await guideService.validateGuide(guideGeometry, implants, nerveTraces);
      setValidation(result);
      setCurrentStep(3);
    } catch (err) {
      setError('Failed to validate guide. Please try again.');
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Analysis',
      content: (
        <GuideAnalysisStep
          implants={implants}
          tissueSurface={tissueSurface}
          nerveTraces={nerveTraces}
          onAnalyze={handleAnalyze}
          analysis={analysis}
        />
      )
    },
    {
      title: 'Generation',
      content: (
        <GuideGenerationStep
          settings={settings}
          onSettingsChange={setSettings}
          onGenerate={handleGenerate}
        />
      )
    },
    {
      title: 'Validation',
      content: (
        <GuideValidationStep
          guideGeometry={guideGeometry}
          validation={validation}
          onValidate={handleValidate}
        />
      )
    },
    {
      title: 'Export',
      content: (
        <GuideExportStep
          guideGeometry={guideGeometry}
          validation={validation}
        />
      )
    }
  ];

  return (
    <Card>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>

      <div className="steps-content">
        <Spin spinning={loading}>
          {steps[currentStep].content}
        </Spin>
      </div>

      <div className="steps-action" style={{ marginTop: 24 }}>
        {currentStep > 0 && (
          <Button style={{ marginRight: 8 }} onClick={() => setCurrentStep(currentStep - 1)}>
            Previous
          </Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
            Next
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SurgicalGuideWorkflow; 