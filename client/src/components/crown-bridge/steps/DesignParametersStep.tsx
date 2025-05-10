import React from 'react';
import { Card, Form, Select, InputNumber, Space, Typography } from 'antd';
import { CrownBridgeSettings } from '../../../../server/types/crown-bridge';

const { Title } = Typography;
const { Option } = Select;

interface DesignParametersStepProps {
  settings: CrownBridgeSettings;
  onSettingsChange: (settings: Partial<CrownBridgeSettings>) => void;
}

export const DesignParametersStep: React.FC<DesignParametersStepProps> = ({
  settings,
  onSettingsChange
}) => {
  const handleChange = (field: keyof CrownBridgeSettings, value: any) => {
    onSettingsChange({ [field]: value });
  };

  return (
    <Card>
      <Title level={4}>Design Parameters</Title>
      
      <Form layout="vertical">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item label="Material">
            <Select
              value={settings.material}
              onChange={(value) => handleChange('material', value)}
              style={{ width: '100%' }}
            >
              <Option value="zirconia">Zirconia</Option>
              <Option value="lithium_disilicate">Lithium Disilicate</Option>
              <Option value="porcelain">Porcelain</Option>
              <Option value="metal">Metal</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Design Type">
            <Select
              value={settings.design}
              onChange={(value) => handleChange('design', value)}
              style={{ width: '100%' }}
            >
              <Option value="full_contour">Full Contour</Option>
              <Option value="layered">Layered</Option>
              <Option value="monolithic">Monolithic</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Margin Type">
            <Select
              value={settings.margin}
              onChange={(value) => handleChange('margin', value)}
              style={{ width: '100%' }}
            >
              <Option value="chamfer">Chamfer</Option>
              <Option value="shoulder">Shoulder</Option>
              <Option value="feather">Feather</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Occlusion Type">
            <Select
              value={settings.occlusion}
              onChange={(value) => handleChange('occlusion', value)}
              style={{ width: '100%' }}
            >
              <Option value="centric">Centric</Option>
              <Option value="balanced">Balanced</Option>
              <Option value="group_function">Group Function</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Minimum Thickness (mm)">
            <InputNumber
              value={settings.minThickness}
              onChange={(value) => handleChange('minThickness', value)}
              min={0.5}
              max={2.0}
              step={0.1}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Connector Height (mm)">
            <InputNumber
              value={settings.connectorHeight}
              onChange={(value) => handleChange('connectorHeight', value)}
              min={3.0}
              max={5.0}
              step={0.1}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Connector Width (mm)">
            <InputNumber
              value={settings.connectorWidth}
              onChange={(value) => handleChange('connectorWidth', value)}
              min={2.0}
              max={4.0}
              step={0.1}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
}; 