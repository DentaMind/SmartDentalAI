import React from 'react';
import { Card, Button, Slider, Switch, Space, Typography, Divider } from 'antd';
import { SurgicalGuideSettings } from '../../../server/types/surgical-guide';

const { Title, Text } = Typography;

interface GuideGenerationStepProps {
  settings: SurgicalGuideSettings;
  onSettingsChange: (settings: SurgicalGuideSettings) => void;
  onGenerate: () => void;
}

const GuideGenerationStep: React.FC<GuideGenerationStepProps> = ({
  settings,
  onSettingsChange,
  onGenerate
}) => {
  const handleSliderChange = (key: keyof SurgicalGuideSettings) => (value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleSwitchChange = (key: keyof SurgicalGuideSettings) => (checked: boolean) => {
    onSettingsChange({ ...settings, [key]: checked });
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Guide Settings</Title>
          <Text type="secondary">
            Adjust the guide parameters to optimize the design for your case.
          </Text>
        </div>

        <div>
          <Text strong>Shell Thickness (mm)</Text>
          <Slider
            min={1}
            max={5}
            step={0.1}
            value={settings.shellThickness}
            onChange={handleSliderChange('shellThickness')}
          />
        </div>

        <div>
          <Text strong>Offset (mm)</Text>
          <Slider
            min={0.1}
            max={2}
            step={0.1}
            value={settings.offset}
            onChange={handleSliderChange('offset')}
          />
        </div>

        <div>
          <Text strong>Sleeve Diameter (mm)</Text>
          <Slider
            min={3}
            max={10}
            step={0.1}
            value={settings.sleeveDiameter}
            onChange={handleSliderChange('sleeveDiameter')}
          />
        </div>

        <div>
          <Text strong>Drill Clearance (mm)</Text>
          <Slider
            min={0.1}
            max={1}
            step={0.1}
            value={settings.drillClearance}
            onChange={handleSliderChange('drillClearance')}
          />
        </div>

        <Divider />

        <div>
          <Text strong>Ventilation Holes</Text>
          <Switch
            checked={settings.ventilationHoles}
            onChange={handleSwitchChange('ventilationHoles')}
            style={{ marginLeft: 16 }}
          />
        </div>

        {settings.ventilationHoles && (
          <>
            <div>
              <Text strong>Hole Spacing (mm)</Text>
              <Slider
                min={5}
                max={20}
                step={1}
                value={settings.holeSpacing}
                onChange={handleSliderChange('holeSpacing')}
              />
            </div>

            <div>
              <Text strong>Hole Diameter (mm)</Text>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={settings.holeDiameter}
                onChange={handleSliderChange('holeDiameter')}
              />
            </div>
          </>
        )}

        <Divider />

        <Button type="primary" onClick={onGenerate}>
          Generate Guide
        </Button>
      </Space>
    </Card>
  );
};

export default GuideGenerationStep; 