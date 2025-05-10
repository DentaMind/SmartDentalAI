import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Button, Slider, Select, Space, Card, Tabs, message, Spin } from 'antd';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { SurgicalGuideAIService } from '../../../server/services/surgical-guide-ai';
import { Implant, SurgicalGuideSettings, GuideAnalysis, GuideValidation, NerveHeatmap } from '../../../server/types/surgical-guide';

const { Option } = Select;
const { TabPane } = Tabs;

interface SurgicalGuideWorkspaceProps {
  implants: Implant[];
  tissueSurface: THREE.BufferGeometry;
  nerveTraces: THREE.Vector3[];
  onGuideGenerated?: (guide: THREE.Group) => void;
}

const SurgicalGuideWorkspace: React.FC<SurgicalGuideWorkspaceProps> = ({
  implants,
  tissueSurface,
  nerveTraces,
  onGuideGenerated,
}) => {
  const [settings, setSettings] = useState<SurgicalGuideSettings>({
    shellThickness: 2,
    offset: 0.5,
    sleeveDiameter: 3,
    drillClearance: 0.2,
    ventilationHoles: true,
    holeSpacing: 5,
    holeDiameter: 1,
  });

  const [analysis, setAnalysis] = useState<GuideAnalysis | null>(null);
  const [validation, setValidation] = useState<GuideValidation | null>(null);
  const [heatmap, setHeatmap] = useState<NerveHeatmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [guideType, setGuideType] = useState<'tooth' | 'mucosa' | 'bone'>('mucosa');
  const [guideMesh, setGuideMesh] = useState<THREE.Group | null>(null);
  const [activeTab, setActiveTab] = useState('preview');

  const aiService = SurgicalGuideAIService.getInstance();

  useEffect(() => {
    analyzeGuide();
  }, [implants, tissueSurface, nerveTraces]);

  const analyzeGuide = async () => {
    setLoading(true);
    try {
      const analysis = await aiService.analyzeGuide(implants, tissueSurface, nerveTraces);
      setAnalysis(analysis);
      setGuideType(analysis.guideType);
    } catch (error) {
      message.error('Failed to analyze guide');
    } finally {
      setLoading(false);
    }
  };

  const generateGuide = async () => {
    setLoading(true);
    try {
      const guide = await aiService.generateGuide(implants, tissueSurface, settings);
      setGuideMesh(guide);
      onGuideGenerated?.(guide);

      const validation = await aiService.validateGuide(guide, implants, tissueSurface, nerveTraces);
      setValidation(validation);

      const heatmap = await aiService.generateNerveHeatmap(implants, nerveTraces);
      setHeatmap(heatmap);
    } catch (error) {
      message.error('Failed to generate guide');
    } finally {
      setLoading(false);
    }
  };

  const exportGuide = () => {
    if (!guideMesh) return;

    const exporter = new STLExporter();
    const stlString = exporter.parse(guideMesh);
    
    const blob = new Blob([stlString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'surgical-guide.stl';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSettingsChange = (key: keyof SurgicalGuideSettings, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '300px', padding: '20px', borderRight: '1px solid #ddd' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Preview" key="preview">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card title="Guide Type">
                <Select
                  value={guideType}
                  onChange={setGuideType}
                  style={{ width: '100%' }}
                >
                  <Option value="tooth">Tooth-Supported</Option>
                  <Option value="mucosa">Mucosa-Supported</Option>
                  <Option value="bone">Bone-Supported</Option>
                </Select>
              </Card>

              <Card title="Guide Settings">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <label>Shell Thickness (mm)</label>
                    <Slider
                      min={1}
                      max={5}
                      step={0.1}
                      value={settings.shellThickness}
                      onChange={(value) => handleSettingsChange('shellThickness', value)}
                    />
                  </div>
                  <div>
                    <label>Offset (mm)</label>
                    <Slider
                      min={0}
                      max={2}
                      step={0.1}
                      value={settings.offset}
                      onChange={(value) => handleSettingsChange('offset', value)}
                    />
                  </div>
                  <div>
                    <label>Sleeve Diameter (mm)</label>
                    <Slider
                      min={2}
                      max={5}
                      step={0.1}
                      value={settings.sleeveDiameter}
                      onChange={(value) => handleSettingsChange('sleeveDiameter', value)}
                    />
                  </div>
                </Space>
              </Card>

              <Button
                type="primary"
                onClick={generateGuide}
                loading={loading}
                style={{ width: '100%' }}
              >
                Generate Guide
              </Button>

              {guideMesh && (
                <Button
                  onClick={exportGuide}
                  style={{ width: '100%' }}
                >
                  Export STL
                </Button>
              )}
            </Space>
          </TabPane>

          <TabPane tab="Analysis" key="analysis">
            {analysis && (
              <Card title="Guide Analysis">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <strong>Recommended System:</strong> {analysis.recommendedSystem}
                  </div>
                  <div>
                    <strong>Bone Type:</strong> {analysis.boneType}
                  </div>
                  <div>
                    <strong>Confidence:</strong> {analysis.confidence}%
                  </div>
                  {analysis.warnings.length > 0 && (
                    <div>
                      <strong>Warnings:</strong>
                      <ul>
                        {analysis.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.suggestions.length > 0 && (
                    <div>
                      <strong>Suggestions:</strong>
                      <ul>
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Space>
              </Card>
            )}
          </TabPane>

          <TabPane tab="Validation" key="validation">
            {validation && (
              <Card title="Guide Validation">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <strong>Status:</strong> {validation.isValid ? 'Valid' : 'Invalid'}
                  </div>
                  {validation.warnings.length > 0 && (
                    <div>
                      <strong>Warnings:</strong>
                      <ul>
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.suggestions.length > 0 && (
                    <div>
                      <strong>Suggestions:</strong>
                      <ul>
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Space>
              </Card>
            )}
          </TabPane>
        </Tabs>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 100]} />
          <OrbitControls />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {/* Tissue Surface */}
          <mesh geometry={tissueSurface}>
            <meshStandardMaterial color="#f0f0f0" transparent opacity={0.5} />
          </mesh>

          {/* Implants */}
          {implants.map((implant, index) => (
            <mesh
              key={index}
              position={new THREE.Vector3(...implant.position)}
              rotation={new THREE.Euler(...implant.rotation)}
            >
              <cylinderGeometry
                args={[implant.diameter / 2, implant.diameter / 2, implant.length]}
              />
              <meshStandardMaterial color="#4a90e2" />
            </mesh>
          ))}

          {/* Nerve Traces */}
          {nerveTraces.map((point, index) => (
            <mesh key={index} position={point}>
              <sphereGeometry args={[0.5]} />
              <meshStandardMaterial color="#ff0000" />
            </mesh>
          ))}

          {/* Guide Mesh */}
          {guideMesh && <primitive object={guideMesh} />}

          {/* Heatmap */}
          {heatmap && (
            <mesh>
              <boxGeometry
                args={[
                  heatmap.dimensions.width,
                  heatmap.dimensions.height,
                  heatmap.dimensions.depth,
                ]}
              />
              <meshStandardMaterial
                color="#ff0000"
                transparent
                opacity={0.5}
                vertexColors
              />
            </mesh>
          )}
        </Canvas>
      </div>
    </div>
  );
};

export default SurgicalGuideWorkspace; 