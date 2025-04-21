import React, { useState } from 'react';
import { Steps, Card, Button, notification, Space, Typography } from 'antd';
import { useCrownBridgeAI } from '../../hooks/useCrownBridgeAI';
import { CaseAnalysisStep } from './steps/CaseAnalysisStep';
import { DesignParametersStep } from './steps/DesignParametersStep';
import { ValidationStep } from './steps/ValidationStep';
import { ExportStep } from './steps/ExportStep';
import { CrownBridgePreview } from './CrownBridgePreview';
import { CrownBridgeSettings, CrownBridgeAnalysis, CrownBridgeValidation, Tooth } from '../../../server/types/crown-bridge';
import * as THREE from 'three';

const { Title } = Typography;
const { Step } = Steps;

interface CrownBridgeWorkflowProps {
  preparationScan: THREE.BufferGeometry;
  opposingScan: THREE.BufferGeometry;
  adjacentTeeth: Tooth[];
  onSettingsChange: (settings: CrownBridgeSettings) => void;
}

export const CrownBridgeWorkflow: React.FC<CrownBridgeWorkflowProps> = ({
  preparationScan,
  opposingScan,
  adjacentTeeth,
  onSettingsChange
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<CrownBridgeSettings>({
    material: 'zirconia',
    design: 'full_contour',
    margin: 'chamfer',
    occlusion: 'centric',
    minThickness: 0.7,
    connectorHeight: 3.5,
    connectorWidth: 3.0
  });
  const [analysis, setAnalysis] = useState<CrownBridgeAnalysis | null>(null);
  const [validation, setValidation] = useState<CrownBridgeValidation | null>(null);
  const [design, setDesign] = useState<THREE.BufferGeometry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    analyzeCrownBridge,
    generateCrownBridge,
    validateCrownBridge,
    exportPDF
  } = useCrownBridgeAI();

  const handleSettingsChange = (newSettings: Partial<CrownBridgeSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange(updatedSettings);
  };

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      const result = await analyzeCrownBridge(preparationScan, settings);
      setAnalysis(result);
      notification.success({
        message: 'Analysis Complete',
        description: 'The case has been analyzed successfully.'
      });
      setCurrentStep(1);
    } catch (error) {
      notification.error({
        message: 'Analysis Failed',
        description: 'Failed to analyze the case. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const result = await generateCrownBridge(preparationScan, settings);
      setDesign(result);
      notification.success({
        message: 'Design Generated',
        description: 'The crown/bridge design has been generated successfully.'
      });
      setCurrentStep(2);
    } catch (error) {
      notification.error({
        message: 'Generation Failed',
        description: 'Failed to generate the design. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!design) return;
    
    try {
      setIsLoading(true);
      const result = await validateCrownBridge(design, settings);
      setValidation(result);
      notification.success({
        message: 'Validation Complete',
        description: 'The design has been validated successfully.'
      });
      setCurrentStep(3);
    } catch (error) {
      notification.error({
        message: 'Validation Failed',
        description: 'Failed to validate the design. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!design) return;
    
    try {
      setIsLoading(true);
      await exportPDF(design, settings);
      notification.success({
        message: 'Export Complete',
        description: 'The design has been exported successfully.'
      });
    } catch (error) {
      notification.error({
        message: 'Export Failed',
        description: 'Failed to export the design. Please try again.'
      });
    } finally {
      setIsLoading(false);
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
      ),
      action: (
        <Button
          type="primary"
          onClick={handleAnalyze}
          loading={isLoading}
          disabled={!preparationScan}
        >
          Analyze Case
        </Button>
      )
    },
    {
      title: 'Design Parameters',
      content: (
        <DesignParametersStep
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      ),
      action: (
        <Button
          type="primary"
          onClick={handleGenerate}
          loading={isLoading}
          disabled={!analysis}
        >
          Generate Design
        </Button>
      )
    },
    {
      title: 'Validation',
      content: (
        <ValidationStep
          validation={validation}
          onValidate={handleValidate}
        />
      ),
      action: (
        <Button
          type="primary"
          onClick={handleValidate}
          loading={isLoading}
          disabled={!design}
        >
          Validate Design
        </Button>
      )
    },
    {
      title: 'Export',
      content: (
        <ExportStep
          design={design}
          settings={settings}
          onExport={handleExport}
        />
      ),
      action: (
        <Button
          type="primary"
          onClick={handleExport}
          loading={isLoading}
          disabled={!validation}
        >
          Export Design
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Crown & Bridge Design Workflow</Title>
      
      <Steps current={currentStep} style={{ marginBottom: '24px' }}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              {steps[currentStep].content}
            </div>
            <div style={{ width: '400px' }}>
              <CrownBridgePreview
                preparationScan={preparationScan}
                opposingScan={opposingScan}
                settings={settings}
                adjacentTeeth={adjacentTeeth}
              />
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            {currentStep > 0 && (
              <Button
                style={{ marginRight: '8px' }}
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={isLoading}
              >
                Previous
              </Button>
            )}
            {steps[currentStep].action}
          </div>
        </Space>
      </Card>
    </div>
  );
}; 