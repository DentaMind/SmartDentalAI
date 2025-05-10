import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Button, Select, Slider, Space, message, Card, Typography, Tooltip } from 'antd';
import { 
  SaveOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined,
  DownloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import './SurgicalGuideBuilder.css';
import { AIEngine, AISuggestion } from '../../ai/AIEngine';
import { FeedbackLogger } from '../../ai/FeedbackLogger';
import { Implant, SurgicalGuideSettings } from '../../../server/types/surgical-guide';
import { useSurgicalGuide } from '../../hooks/useSurgicalGuide';
import { SuggestionPanel } from '../ai/SuggestionPanel';
import { GuidePreview } from './GuidePreview';

const { Text } = Typography;

interface SurgicalGuideBuilderProps {
  implants: Implant[];
  tissueSurface: THREE.BufferGeometry;
  nerveTraces: any[];
  token: string;
}

const GuidePreview: React.FC<{
  implants: Implant[];
  tissueSurface?: THREE.BufferGeometry;
  guideType: 'tooth' | 'mucosa' | 'bone';
  guideThickness: number;
  sleeveHeight: number;
  sleeveOffset: number;
  showTissue: boolean;
}> = ({ 
  implants, 
  tissueSurface, 
  guideType, 
  guideThickness,
  sleeveHeight,
  sleeveOffset,
  showTissue 
}) => {
  const { scene } = useThree();
  const guideRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!tissueSurface) return;

    // Clear previous guide
    if (guideRef.current) {
      scene.remove(guideRef.current);
    }

    // Create guide base
    const guideBase = new THREE.Mesh(
      tissueSurface,
      new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
    );

    // Create guide group
    const guideGroup = new THREE.Group();
    guideGroup.add(guideBase);

    // Add sleeves for each implant
    implants.forEach(implant => {
      const sleeveGeometry = new THREE.CylinderGeometry(
        implant.diameter / 2 + sleeveOffset,
        implant.diameter / 2 + sleeveOffset,
        sleeveHeight,
        32
      );
      
      const sleeve = new THREE.Mesh(
        sleeveGeometry,
        new THREE.MeshPhongMaterial({ 
          color: 0xff0000,
          transparent: true,
          opacity: 0.7
        })
      );

      // Position sleeve based on implant position and rotation
      sleeve.position.set(...implant.position);
      sleeve.rotation.set(...implant.rotation);
      
      guideGroup.add(sleeve);
    });

    scene.add(guideGroup);
    guideRef.current = guideGroup;

    return () => {
      if (guideRef.current) {
        scene.remove(guideRef.current);
      }
    };
  }, [implants, tissueSurface, guideType, guideThickness, sleeveHeight, sleeveOffset]);

  return null;
};

export const SurgicalGuideBuilder: React.FC<SurgicalGuideBuilderProps> = ({
  implants,
  tissueSurface,
  nerveTraces,
  token
}) => {
  const [guideType, setGuideType] = useState<'full' | 'partial'>('full');
  const [thickness, setThickness] = useState(2);
  const [sleeveHeight, setSleeveHeight] = useState(5);
  const [offset, setOffset] = useState(0.5);

  const {
    loading,
    error,
    analysis,
    validation,
    analyze,
    generate,
    validate,
    clearError
  } = useSurgicalGuide({ token });

  useEffect(() => {
    if (implants.length && tissueSurface) {
      analyze(implants, tissueSurface, nerveTraces);
    }
  }, [implants, tissueSurface, nerveTraces, analyze]);

  const handleGenerate = async () => {
    const settings: SurgicalGuideSettings = {
      guideType,
      shellThickness: thickness,
      sleeveHeight,
      offset,
      sleeveDiameter: 2.5,
      drillClearance: 0.2,
      ventilationHoles: true,
      holeSpacing: 5,
      holeDiameter: 1
    };

    const stlBlob = await generate(implants, tissueSurface, settings);
    if (stlBlob) {
      const url = URL.createObjectURL(stlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'surgical-guide.stl';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Surgical guide generated successfully');
    }
  };

  const handleSuggestionAccept = (id: string) => {
    if (analysis?.suggestions) {
      const suggestion = analysis.suggestions.find(s => s.id === id);
      if (suggestion) {
        // Apply suggestion values
        if (suggestion.guideType) setGuideType(suggestion.guideType);
        if (suggestion.shellThickness) setThickness(suggestion.shellThickness);
        if (suggestion.sleeveHeight) setSleeveHeight(suggestion.sleeveHeight);
        if (suggestion.offset) setOffset(suggestion.offset);
        message.success('Applied AI suggestion');
      }
    }
  };

  return (
    <div className="surgical-guide-builder">
      <Card title="Surgical Guide Builder">
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <SuggestionPanel
          module="surgical-guide"
          suggestions={analysis?.suggestions || []}
          onAccept={handleSuggestionAccept}
          onReject={(id) => console.log('Rejected suggestion:', id)}
        />

        <div className="controls" style={{ marginBottom: '1rem' }}>
          <div className="control-group">
            <label>Guide Type</label>
            <Select
              value={guideType}
              onChange={setGuideType}
              style={{ width: '100%' }}
            >
              <Select.Option value="full">Full Arch</Select.Option>
              <Select.Option value="partial">Partial Arch</Select.Option>
            </Select>
          </div>

          <div className="control-group">
            <label>Shell Thickness (mm)</label>
            <Slider
              min={1}
              max={5}
              step={0.1}
              value={thickness}
              onChange={setThickness}
            />
          </div>

          <div className="control-group">
            <label>Sleeve Height (mm)</label>
            <Slider
              min={2}
              max={10}
              step={0.5}
              value={sleeveHeight}
              onChange={setSleeveHeight}
            />
          </div>

          <div className="control-group">
            <label>Offset (mm)</label>
            <Slider
              min={0.1}
              max={2}
              step={0.1}
              value={offset}
              onChange={setOffset}
            />
          </div>
        </div>

        <GuidePreview
          implants={implants}
          tissueSurface={tissueSurface}
          settings={{
            guideType,
            shellThickness: thickness,
            sleeveHeight,
            offset,
            sleeveDiameter: 2.5,
            drillClearance: 0.2,
            ventilationHoles: true,
            holeSpacing: 5,
            holeDiameter: 1
          }}
        />

        <Button
          type="primary"
          onClick={handleGenerate}
          loading={loading}
          style={{ marginTop: '1rem' }}
        >
          Generate STL
        </Button>
      </Card>
    </div>
  );
};

export default SurgicalGuideBuilder; 