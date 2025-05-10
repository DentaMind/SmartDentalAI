import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CrownBridgeWorkflow } from '../components/crown-bridge/CrownBridgeWorkflow';
import { ScanUploader } from '../components/crown-bridge/ScanUploader';
import { Button, Card, Space, Typography, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import * as THREE from 'three';
import { CrownBridgeSettings } from '../../server/types/crown-bridge';

const { Title } = Typography;

// Mock data for development
const mockPreparationScan = new THREE.BoxGeometry(1, 1, 1);
const mockOpposingScan = new THREE.BoxGeometry(1, 1, 1);
const mockAdjacentTeeth = [
  {
    id: '1',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    width: 1,
    height: 1,
    depth: 1
  }
];

export const CrownBridgePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [preparationScan, setPreparationScan] = useState<THREE.BufferGeometry | null>(null);
  const [opposingScan, setOpposingScan] = useState<THREE.BufferGeometry | null>(null);
  const [adjacentTeeth, setAdjacentTeeth] = useState<any[]>([]);
  const [settings, setSettings] = useState<CrownBridgeSettings | null>(null);

  const handleSaveCase = async () => {
    if (!preparationScan || !settings) {
      message.error('Please complete the workflow before saving');
      return;
    }

    try {
      // TODO: Implement case saving to backend
      message.success('Case saved successfully');
    } catch (error) {
      message.error('Failed to save case');
    }
  };

  const handleSettingsChange = (newSettings: CrownBridgeSettings) => {
    setSettings(newSettings);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>
            {patientId ? `Patient ${patientId} - Crown & Bridge` : 'Crown & Bridge Design'}
          </Title>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveCase}
            disabled={!preparationScan || !settings}
          >
            Save Case
          </Button>
        </div>

        {!preparationScan ? (
          <ScanUploader
            onPreparationScanUpload={setPreparationScan}
            onOpposingScanUpload={setOpposingScan}
            onAdjacentTeethUpload={setAdjacentTeeth}
          />
        ) : (
          <CrownBridgeWorkflow
            preparationScan={preparationScan}
            opposingScan={opposingScan || new THREE.BoxGeometry(1, 1, 1)}
            adjacentTeeth={adjacentTeeth}
            onSettingsChange={handleSettingsChange}
          />
        )}
      </Space>
    </div>
  );
}; 