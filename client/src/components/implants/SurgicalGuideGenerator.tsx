import React, { useState } from 'react';
import { Button, Form, Input, Slider, Switch, message } from 'antd';
import { SaveOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/use-auth';
import { SurgicalGuideSettings } from '../../types/surgical-guide';
import { Implant } from '../../types/implant';
import { NerveTrace } from '../../types/nerve-trace';

interface SurgicalGuideGeneratorProps {
  implants: Implant[];
  tissueSurfacePath: string;
  nerveTrace?: NerveTrace;
  onGuideGenerated?: (guidePath: string) => void;
}

export const SurgicalGuideGenerator: React.FC<SurgicalGuideGeneratorProps> = ({
  implants,
  tissueSurfacePath,
  nerveTrace,
  onGuideGenerated
}) => {
  const [form] = Form.useForm();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const defaultSettings: SurgicalGuideSettings = {
    shellThickness: 2.5,
    offset: 0.2,
    sleeveDiameter: 5,
    drillClearance: 0.1,
    ventilationHoles: true,
    holeSpacing: 10,
    holeDiameter: 1.5
  };

  const handleGenerateGuide = async (values: SurgicalGuideSettings) => {
    try {
      setLoading(true);

      const response = await fetch('/api/surgical-guide/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          implants,
          tissueSurfacePath,
          settings: values,
          nerveTrace
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate guide');
      }

      message.success('Surgical guide generated successfully');
      onGuideGenerated?.(data.guidePath);
    } catch (error) {
      console.error('Error generating guide:', error);
      message.error(error instanceof Error ? error.message : 'Failed to generate guide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surgical-guide-generator">
      <Form
        form={form}
        layout="vertical"
        initialValues={defaultSettings}
        onFinish={handleGenerateGuide}
      >
        <Form.Item
          label="Shell Thickness (mm)"
          name="shellThickness"
          rules={[{ required: true }]}
        >
          <Slider min={1} max={5} step={0.1} />
        </Form.Item>

        <Form.Item
          label="Offset (mm)"
          name="offset"
          rules={[{ required: true }]}
        >
          <Slider min={0.1} max={2} step={0.1} />
        </Form.Item>

        <Form.Item
          label="Sleeve Diameter (mm)"
          name="sleeveDiameter"
          rules={[{ required: true }]}
        >
          <Slider min={3} max={10} step={0.1} />
        </Form.Item>

        <Form.Item
          label="Drill Clearance (mm)"
          name="drillClearance"
          rules={[{ required: true }]}
        >
          <Slider min={0.1} max={1} step={0.1} />
        </Form.Item>

        <Form.Item
          label="Ventilation Holes"
          name="ventilationHoles"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Hole Spacing (mm)"
          name="holeSpacing"
          rules={[{ required: true }]}
        >
          <Slider min={5} max={20} step={1} />
        </Form.Item>

        <Form.Item
          label="Hole Diameter (mm)"
          name="holeDiameter"
          rules={[{ required: true }]}
        >
          <Slider min={1} max={3} step={0.1} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
          >
            Generate Guide
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}; 