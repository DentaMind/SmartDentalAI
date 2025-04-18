import React from 'react';
import { Timeline, Card, Typography, Tag, Space } from 'antd';
import { CheckCircleOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { AiTriageResults } from './AiTriageResults';

const { Title, Text } = Typography;

interface TriageResult {
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
}

interface AiTriageTimelineProps {
  results: TriageResult[];
}

export const AiTriageTimeline: React.FC<AiTriageTimelineProps> = ({ results }) => {
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

  return (
    <Card>
      <Title level={4}>Triage History</Title>
      <Timeline>
        {results.map((result) => (
          <Timeline.Item
            key={result.id}
            dot={getOutcomeIcon(result.outcome)}
            color={getOutcomeColor(result.outcome)}
          >
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Text strong>Date:</Text>
                  <Text>{new Date(result.createdAt).toLocaleDateString()}</Text>
                </Space>

                <Space>
                  <Text strong>Outcome:</Text>
                  <Tag color={getOutcomeColor(result.outcome)}>
                    {result.outcome.toUpperCase()}
                  </Tag>
                </Space>

                <Space>
                  <Text strong>Next Step:</Text>
                  <Tag color="blue">{result.nextStep}</Tag>
                </Space>

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
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
}; 