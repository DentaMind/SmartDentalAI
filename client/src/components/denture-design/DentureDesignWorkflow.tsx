import React, { useState, useEffect } from 'react';
import { Steps, Card, Button, message, Typography, Space } from 'antd';
import { useDentureAI } from '../../hooks/useDentureAI';
import { DenturePreview } from './DenturePreview';
import { SuggestionPanel } from '../ai/SuggestionPanel';
import { CaseAnalysisStep } from './steps/CaseAnalysisStep';
import { DesignParametersStep } from './steps/DesignParametersStep';
import { ValidationStep } from './steps/ValidationStep';
import { ExportStep } from './steps/ExportStep';
import { 
  DentureSettings, 
  Tooth, 
  ArchType 
} from '../../../server/types/denture';
import * as THREE from 'three';

const { Step } = Steps;
const { Title } = Typography;

interface DentureDesignWorkflowProps {
  archType: ArchType;
  remainingTeeth: Tooth[];
  occlusionMap: number[][];
  archScan: THREE.BufferGeometry;
  token: string;
}

export const DentureDesignWorkflow: React.FC<DentureDesignWorkflowProps> = ({
  archType,
  remainingTeeth,
  occlusionMap,
  archScan,
  token
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<DentureSettings>({
    archType,
    system: 'full-plate',
    palateShape: 'u-shaped',
    borderExtension: 2,
    posteriorOcclusion: 'balanced',
    toothSetup: 'ai-recommended'
  });

  const {
    loading,
    error,
    analysis,
    validation,
    analyzeCase,
    generateDenture,
    validateDesign,
    exportPDF,
    clearError
  } = useDentureAI({ token });

  useEffect(() => {
    if (archScan && remainingTeeth.length > 0) {
      analyzeCase(archType, remainingTeeth, occlusionMap, archScan);
    }
  }, [archType, remainingTeeth, occlusionMap, archScan, analyzeCase]);

  const handleSettingsChange = (newSettings: Partial<DentureSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleGenerate = async () => {
    const stlBlob = await generateDenture(settings);
    if (stlBlob) {
      const url = URL.createObjectURL(stlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'denture.stl';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Denture generated successfully');
    }
  };

  const handleExportPDF = async () => {
    const pdfBlob = await exportPDF(archScan, settings);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'denture-documentation.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('PDF exported successfully');
    }
  };

  const steps = [
    {
      title: 'Case Analysis',
      content: (
        <CaseAnalysisStep
          analysis={analysis}
          onSettingsChange={handleSettingsChange}
        />
      )
    },
    {
      title: 'Design Parameters',
      content: (
        <DesignParametersStep
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      )
    },
    {
      title: 'Validation',
      content: (
        <ValidationStep
          validation={validation}
          onValidate={() => validateDesign(archScan, settings)}
        />
      )
    },
    {
      title: 'Export',
      content: (
        <ExportStep
          onGenerate={handleGenerate}
          onExportPDF={handleExportPDF}
          loading={loading}
        />
      )
    }
  ];

  return (
    <div className="denture-design-workflow">
      <Card>
        <Title level={3}>DentaMind Prosthetics Lab</Title>
        
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <Steps current={currentStep} style={{ marginBottom: '2rem' }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>

        <div className="step-content">
          {steps[currentStep].content}
        </div>

        <div className="preview-section" style={{ marginTop: '2rem' }}>
          <DenturePreview
            archScan={archScan}
            settings={settings}
            remainingTeeth={remainingTeeth}
          />
        </div>

        <div className="suggestions-section" style={{ marginTop: '2rem' }}>
          <SuggestionPanel
            module="denture-design"
            suggestions={analysis?.suggestions || []}
            onAccept={(id) => {
              const suggestion = analysis?.suggestions.find(s => s.id === id);
              if (suggestion) {
                handleSettingsChange(suggestion.settings);
                message.success('Applied AI suggestion');
              }
            }}
            onReject={(id) => {
              console.log('Rejected suggestion:', id);
            }}
          />
        </div>

        <div className="navigation-buttons" style={{ marginTop: '2rem' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}; 