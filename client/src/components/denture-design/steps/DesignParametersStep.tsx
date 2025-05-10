import React from 'react';
import { Card, Form, Select, Slider, Space, Typography } from 'antd';
import { DentureSettings } from '../../../../server/types/denture';

const { Title } = Typography;
const { Option } = Select;

interface DesignParametersStepProps {
  settings: DentureSettings;
  onSettingsChange: (settings: Partial<DentureSettings>) => void;
}

export const DesignParametersStep: React.FC<DesignParametersStepProps> = ({
  settings,
  onSettingsChange
}) => {
  return (
    <Card>
      <Title level={4}>Design Parameters</Title>
      
      <Form layout="vertical">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item label="Denture System">
            <Select
              value={settings.system}
              onChange={(value) => onSettingsChange({ system: value })}
              style={{ width: '100%' }}
            >
              <Option value="full-plate">Full Plate</Option>
              <Option value="horseshoe">Horseshoe</Option>
              <Option value="partial">Partial</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Palate Shape">
            <Select
              value={settings.palateShape}
              onChange={(value) => onSettingsChange({ palateShape: value })}
              style={{ width: '100%' }}
            >
              <Option value="u-shaped">U-Shaped</Option>
              <Option value="v-shaped">V-Shaped</Option>
              <Option value="flat">Flat</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Border Extension (mm)">
            <Slider
              min={1}
              max={5}
              step={0.5}
              value={settings.borderExtension}
              onChange={(value) => onSettingsChange({ borderExtension: value })}
            />
          </Form.Item>

          <Form.Item label="Posterior Occlusion">
            <Select
              value={settings.posteriorOcclusion}
              onChange={(value) => onSettingsChange({ posteriorOcclusion: value })}
              style={{ width: '100%' }}
            >
              <Option value="balanced">Balanced</Option>
              <Option value="lingualized">Lingualized</Option>
              <Option value="monoplane">Monoplane</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Tooth Setup">
            <Select
              value={settings.toothSetup}
              onChange={(value) => onSettingsChange({ toothSetup: value })}
              style={{ width: '100%' }}
            >
              <Option value="ai-recommended">AI Recommended</Option>
              <Option value="standard">Standard</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
}; 