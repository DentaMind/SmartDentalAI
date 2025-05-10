import React, { useEffect, useState } from 'react';
import { Card, Switch, Button, Form, InputNumber, message } from 'antd';
import { alertService } from '../services/alertService';

const AlertSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await alertService.getAlertConfig();
        form.setFieldsValue(config);
      } catch (error) {
        message.error('Failed to load alert settings');
      }
    };
    fetchConfig();
  }, [form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await alertService.updateAlertConfig(values);
      message.success('Alert settings updated successfully');
    } catch (error) {
      message.error('Failed to update alert settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlert = async (type: 'email' | 'sms') => {
    try {
      await alertService.sendTestAlert(type);
      message.success(`Test ${type.toUpperCase()} alert sent successfully`);
    } catch (error) {
      message.error(`Failed to send test ${type.toUpperCase()} alert`);
    }
  };

  return (
    <Card title="Alert Settings" style={{ marginBottom: '24px' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          email: true,
          sms: false,
          thresholds: {
            cpu: 80,
            memory: 85,
            disk: 90
          }
        }}
      >
        <Form.Item label="Email Alerts" name="email" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="SMS Alerts" name="sms" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="CPU Threshold (%)" name={['thresholds', 'cpu']}>
          <InputNumber min={0} max={100} />
        </Form.Item>
        <Form.Item label="Memory Threshold (%)" name={['thresholds', 'memory']}>
          <InputNumber min={0} max={100} />
        </Form.Item>
        <Form.Item label="Disk Threshold (%)" name={['thresholds', 'disk']}>
          <InputNumber min={0} max={100} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Settings
          </Button>
          <Button 
            style={{ marginLeft: 8 }} 
            onClick={() => handleTestAlert('email')}
          >
            Test Email
          </Button>
          <Button 
            style={{ marginLeft: 8 }} 
            onClick={() => handleTestAlert('sms')}
          >
            Test SMS
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AlertSettings; 