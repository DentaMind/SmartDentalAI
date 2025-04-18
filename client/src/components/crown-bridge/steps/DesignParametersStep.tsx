import React from 'react';
import { Card, Form, Select, Slider, Space, Typography, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
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
  return (
    <Card>
      <Title level={4}>Design Parameters</Title>
      
      <Form layout="vertical">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item label={
            <Space>
              <span>Material</span>
              <Tooltip title="Select the material for the restoration">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }>
            <Select
              value={settings.material}
              onChange={(value) => onSettingsChange({ material: value })}
              style={{ width: '100%' }}
            >
              <Option value="zirconia">Zirconia</Option>
              <Option value="e-max">E.max</Option>
              <Option value="pfm">PFM</Option>
              <Option value="gold">Gold</Option>
              <Option value="composite">Composite</Option>
            </Select>
          </Form.Item>

          <Form.Item label={
            <Space>
              <span>Design Type</span>
              <Tooltip title="Select the type of restoration">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }>
            <Select
              value={settings.designType}
              onChange={(value) => onSettingsChange({ designType: value })}
              style={{ width: '100%' }}
            >
              <Option value="full-coverage">Full Coverage</Option>
              <Option value="onlay">Onlay</Option>
              <Option value="inlay">Inlay</Option>
              <Option value="veneer">Veneer</Option>
              <Option value="bridge">Bridge</Option>
            </Select>
          </Form.Item>

          <Form.Item label={
            <Space>
              <span>Margin Type</span>
              <Tooltip title="Select the margin design">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }>
            <Select
              value={settings.marginType}
              onChange={(value) => onSettingsChange({ marginType: value })}
              style={{ width: '100%' }}
            >
              <Option value="chamfer">Chamfer</Option>
              <Option value="shoulder">Shoulder</Option>
              <Option value="feather">Feather</Option>
              <Option value="bevel">Bevel</Option>
            </Select>
          </Form.Item>

          <Form.Item label={
            <Space>
              <span>Occlusion Type</span>
              <Tooltip title="Select the occlusion scheme">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }>
            <Select
              value={settings.occlusionType}
              onChange={(value) => onSettingsChange({ occlusionType: value })}
              style={{ width: '100%' }}
            >
              <Option value="centric">Centric</Option>
              <Option value="eccentric">Eccentric</Option>
              <Option value="balanced">Balanced</Option>
            </Select>
          </Form.Item>

          <Form.Item label={
            <Space>
              <span>Minimum Thickness (mm)</span>
              <Tooltip title="Set the minimum material thickness">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }>
            <Slider
              min={0.3}
              max={2.0}
              step={0.1}
              value={settings.minimumThickness}
              onChange={(value) => onSettingsChange({ minimumThickness: value })}
            />
          </Form.Item>

          {settings.designType === 'bridge' && (
            <Form.Item label={
              <Space>
                <span>Connector Size (mm)</span>
                <Tooltip title="Set the connector size for bridge design">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }>
              <Slider
                min={2}
                max={5}
                step={0.5}
                value={settings.connectorSize}
                onChange={(value) => onSettingsChange({ connectorSize: value })}
              />
            </Form.Item>
          )}
        </Space>
      </Form>
    </Card>
  );
}; 