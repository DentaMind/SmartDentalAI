import React, { useState, useEffect } from 'react';
import { Steps, Card, Button, message, Typography, Space } from 'antd';
import { useCrownBridgeAI } from '../../hooks/useCrownBridgeAI';
import { CrownBridgePreview } from './CrownBridgePreview';
import { SuggestionPanel } from '../ai/SuggestionPanel';
import { CaseAnalysisStep } from './steps/CaseAnalysisStep';
import { DesignParametersStep } from './steps/DesignParametersStep';
import { ValidationStep } from './steps/ValidationStep';
import { ExportStep } from './steps/ExportStep';
import { 
  CrownBridgeSettings, 
  Tooth, 
  MaterialType,
  DesignType
} from '../../../server/types/crown-bridge';
import * as THREE from 'three';

const { Step } = Steps;
const { Title } = Typography;

interface CrownBridgeDesignWorkflowProps {
  preparationScan: THREE.BufferGeometry;
  opposingScan: THREE.BufferGeometry;
  adjacentTeeth: Tooth[];
  token: string;
}

export const CrownBridgeDesignWorkflow: React.FC<CrownBridgeDesignWorkflowProps> = ({
  preparationScan,
  opposingScan,
  adjacentTeeth,
  token
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<CrownBridgeSettings>({
    material: 'zirconia',
    designType: 'full-coverage',
    marginType: 'chamfer',
    occlusionType: 'centric',
    minimumThickness: 0.5,
    connectorSize: 3,
    ponticDesign: 'modified-ridge-lap'
  });

  const {
    loading,
    error,
    analysis,
    validation,
    analyzeCase,
    generateDesign,
    validateDesign,
    exportPDF,
    clearError
  } = useCrownBridgeAI({ token });

  useEffect(() => {
    if (preparationScan && opposingScan) {
      analyzeCase(preparationScan, opposingScan, adjacentTeeth);
    }
  }, [preparationScan, opposingScan, adjacentTeeth, analyzeCase]);

  const handleSettingsChange = (newSettings: Partial<CrownBridgeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleGenerate = async () => {
    const stlBlob = await generateDesign(settings);
    if (stlBlob) {
      const url = URL.createObjectURL(stlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crown-bridge.stl';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Design generated successfully');
    }
  };

  const handleExportPDF = async () => {
    const pdfBlob = await exportPDF(preparationScan, settings);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crown-bridge-documentation.pdf';
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
          onValidate={() => validateDesign(preparationScan, settings)}
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
    <div className="crown-bridge-design-workflow">
      <Card>
        <Title level={3}>DentaMind Crown & Bridge Lab</Title>
        
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
          <CrownBridgePreview
            preparationScan={preparationScan}
            opposingScan={opposingScan}
            settings={settings}
            adjacentTeeth={adjacentTeeth}
          />
        </div>

        <div className="suggestions-section" style={{ marginTop: '2rem' }}>
          <SuggestionPanel
            module="crown-bridge"
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