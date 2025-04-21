import React, { useState } from 'react';
import { Steps, Card, Button, Space, message } from 'antd';
import { DentureSettings, DentureAnalysis, DentureValidation, DentureDesign } from '../../types/denture';
import { ScanUploader } from './ScanUploader';
import { CaseAnalysisStep } from './steps/CaseAnalysisStep';
import { DesignParametersStep } from './steps/DesignParametersStep';
import { ValidationStep } from './steps/ValidationStep';
import { DenturePreview } from './DenturePreview';
import { analyzeDenture, generateDenture, validateDenture } from '../../api/denture';

const { Step } = Steps;

export const DentureWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [upperScan, setUpperScan] = useState<THREE.BufferGeometry | null>(null);
  const [lowerScan, setLowerScan] = useState<THREE.BufferGeometry | null>(null);
  const [settings, setSettings] = useState<DentureSettings>({
    system: 'full_plate',
    palateShape: 'u_shaped',
    borderExtension: 2.0,
    posteriorOcclusion: 'balanced',
    toothSetup: 'ai_recommended',
    material: 'acrylic',
    shade: 'A2'
  });
  const [analysis, setAnalysis] = useState<DentureAnalysis | null>(null);
  const [design, setDesign] = useState<DentureDesign | null>(null);
  const [validation, setValidation] = useState<DentureValidation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!upperScan || !lowerScan) {
      message.error('Please upload both upper and lower scans');
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeDenture(upperScan, lowerScan);
      setAnalysis(result);
      setCurrentStep(1);
    } catch (error) {
      message.error('Failed to analyze case');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!analysis) {
      message.error('Please analyze the case first');
      return;
    }

    setLoading(true);
    try {
      const result = await generateDenture(upperScan!, lowerScan!, settings);
      setDesign(result);
      setCurrentStep(2);
    } catch (error) {
      message.error('Failed to generate design');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!design) {
      message.error('Please generate a design first');
      return;
    }

    setLoading(true);
    try {
      const result = await validateDenture(design);
      setValidation(result);
      setCurrentStep(3);
    } catch (error) {
      message.error('Failed to validate design');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Upload Scans',
      content: (
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <ScanUploader
              title="Upper Arch Scan"
              onUpload={setUpperScan}
              acceptedFormats={['.stl', '.obj', '.gltf', '.glb']}
            />
            <ScanUploader
              title="Lower Arch Scan"
              onUpload={setLowerScan}
              acceptedFormats={['.stl', '.obj', '.gltf', '.glb']}
            />
            <Button
              type="primary"
              onClick={handleAnalyze}
              disabled={!upperScan || !lowerScan || loading}
              loading={loading}
            >
              Analyze Case
            </Button>
          </Space>
        </Card>
      ),
    },
    {
      title: 'Design Parameters',
      content: (
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <CaseAnalysisStep analysis={analysis} onSettingsChange={setSettings} />
            <DesignParametersStep settings={settings} onSettingsChange={setSettings} />
            <Button
              type="primary"
              onClick={handleGenerate}
              disabled={!analysis || loading}
              loading={loading}
            >
              Generate Design
            </Button>
          </Space>
        </Card>
      ),
    },
    {
      title: 'Validation',
      content: (
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DenturePreview
              upperScan={upperScan}
              lowerScan={lowerScan}
              settings={settings}
              design={design}
            />
            <ValidationStep validation={validation} onValidate={handleValidate} />
          </Space>
        </Card>
      ),
    },
    {
      title: 'Export',
      content: (
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DenturePreview
              upperScan={upperScan}
              lowerScan={lowerScan}
              settings={settings}
              design={design}
            />
            <ValidationStep validation={validation} onValidate={handleValidate} />
            <Button type="primary" onClick={() => message.success('Exporting design...')}>
              Export Design
            </Button>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Steps current={currentStep} style={{ marginBottom: '24px' }}>
        {steps.map((step) => (
          <Step key={step.title} title={step.title} />
        ))}
      </Steps>
      <div>{steps[currentStep].content}</div>
    </div>
  );
}; 