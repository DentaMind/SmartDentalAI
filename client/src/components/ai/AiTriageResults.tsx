import React from 'react';
import { Card, Typography, Tag, Space, Divider } from 'antd';
import { CheckCircleOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AiTriageResultsProps {
  result: {
    analysis: {
      symptoms: Record<string, boolean>;
      riskFactors: string[];
      conditions: string[];
    };
    outcome: 'improved' | 'worsened' | 'stable';
    nextStep: string;
    xrayFindings?: any;
  };
}

export const AiTriageResults: React.FC<AiTriageResultsProps> = ({ result }) => {
  const getOutcomeIcon = () => {
    switch (result.outcome) {
      case 'improved':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'worsened':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'stable':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const getOutcomeColor = () => {
    switch (result.outcome) {
      case 'improved':
        return 'success';
      case 'worsened':
        return 'error';
      case 'stable':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={4}>AI Triage Results</Title>
        
        <Space>
          <Text strong>Outcome:</Text>
          <Tag icon={getOutcomeIcon()} color={getOutcomeColor()}>
            {result.outcome.toUpperCase()}
          </Tag>
        </Space>

        <Space>
          <Text strong>Next Step:</Text>
          <Tag color="blue">{result.nextStep}</Tag>
        </Space>

        <Divider />

        <Title level={5}>Analysis</Title>
        
        <Space direction="vertical">
          <Text strong>Symptoms:</Text>
          <Space wrap>
            {Object.entries(result.analysis.symptoms).map(([symptom, present]) => (
              <Tag key={symptom} color={present ? 'red' : 'green'}>
                {symptom}
              </Tag>
            ))}
          </Space>
        </Space>

        <Space direction="vertical">
          <Text strong>Risk Factors:</Text>
          <Space wrap>
            {result.analysis.riskFactors.map((factor) => (
              <Tag key={factor} color="orange">
                {factor}
              </Tag>
            ))}
          </Space>
        </Space>

        <Space direction="vertical">
          <Text strong>Conditions:</Text>
          <Space wrap>
            {result.analysis.conditions.map((condition) => (
              <Tag key={condition} color="purple">
                {condition}
              </Tag>
            ))}
          </Space>
        </Space>

        {result.xrayFindings && (
          <>
            <Divider />
            <Title level={5}>X-ray Findings</Title>
            <Space direction="vertical">
              {Object.entries(result.xrayFindings).map(([finding, value]) => (
                <Space key={finding}>
                  <Text strong>{finding}:</Text>
                  <Text>{value ? 'Present' : 'Not Present'}</Text>
                </Space>
              ))}
            </Space>
          </>
        )}
      </Space>
    </Card>
  );
}; 