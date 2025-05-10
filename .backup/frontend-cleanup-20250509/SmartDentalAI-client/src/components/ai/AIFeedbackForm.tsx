import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message } from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;

interface AIFeedbackFormProps {
  practiceId: number;
  doctorId: number;
  patientId: number;
  formId: number;
  originalAiResult: any;
}

export const AIFeedbackForm: React.FC<AIFeedbackFormProps> = ({
  practiceId,
  doctorId,
  patientId,
  formId,
  originalAiResult,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await axios.post('/api/ai-feedback', {
        practiceId,
        doctorId,
        patientId,
        formId,
        originalAiResult,
        overrideData: values.overrideData,
        overrideType: values.overrideType,
        overrideReason: values.overrideReason,
      });
      message.success('Feedback submitted successfully');
      form.resetFields();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      message.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Title level={4}>AI Feedback Form</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          overrideType: 'triage',
        }}
      >
        <Form.Item
          name="overrideType"
          label="Override Type"
          rules={[{ required: true, message: 'Please select an override type' }]}
        >
          <Select>
            <Select.Option value="triage">Triage</Select.Option>
            <Select.Option value="symptoms">Symptoms</Select.Option>
            <Select.Option value="diagnosis">Diagnosis</Select.Option>
            <Select.Option value="treatment">Treatment</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="overrideData"
          label="Override Data"
          rules={[{ required: true, message: 'Please provide override data' }]}
        >
          <TextArea
            rows={4}
            placeholder="Enter the corrected data in JSON format"
          />
        </Form.Item>

        <Form.Item
          name="overrideReason"
          label="Reason for Override"
          rules={[{ required: true, message: 'Please provide a reason' }]}
        >
          <TextArea
            rows={4}
            placeholder="Explain why you are overriding the AI's assessment"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Feedback
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}; 