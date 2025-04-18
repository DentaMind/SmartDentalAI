import React from 'react';
import { Card, Typography, Tag, Space, Timeline } from 'antd';
import { CheckCircleOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface TriageSummaryProps {
  triageResults: {
    id: number;
    analysis: {
      symptoms: Record<string, boolean>;
      riskFactors: string[];
      conditions: string[];
    };
    outcome: 'improved' | 'worsened' | 'stable';
    nextStep: string;
    xrayFindings?: any;
    createdAt: string;
  }[];
}

export const TriageSummary: React.FC<TriageSummaryProps> = ({ triageResults }) => {
  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
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

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <Title level={4}>Treatment Progress</Title>
      <Timeline>
        {triageResults.map((result) => (
          <Timeline.Item
            key={result.id}
            dot={getOutcomeIcon(result.outcome)}
            color={getOutcomeColor(result.outcome)}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Text strong>Date:</Text>
                <Text>{formatDate(result.createdAt)}</Text>
              </Space>

              <Space>
                <Text strong>Status:</Text>
                <Tag color={getOutcomeColor(result.outcome)}>
                  {result.outcome.toUpperCase()}
                </Tag>
              </Space>

              <Space>
                <Text strong>Next Step:</Text>
                <Text>{result.nextStep}</Text>
              </Space>

              {result.analysis.conditions.length > 0 && (
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
              )}

              {result.xrayFindings && (
                <Space direction="vertical">
                  <Text strong>X-ray Findings:</Text>
                  <Space wrap>
                    {Object.entries(result.xrayFindings).map(([finding, value]) => (
                      <Tag key={finding} color={value ? 'red' : 'green'}>
                        {finding}: {value ? 'Present' : 'Not Present'}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              )}
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
}; 