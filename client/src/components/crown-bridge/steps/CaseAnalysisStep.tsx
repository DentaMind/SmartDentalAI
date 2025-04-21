import React from 'react';
import { Card, Typography, Space, Tag, List, Spin } from 'antd';
import { CrownBridgeAnalysis, CrownBridgeSettings } from '../../../../server/types/crown-bridge';

const { Title, Text } = Typography;

interface CaseAnalysisStepProps {
  analysis: CrownBridgeAnalysis | null;
  onSettingsChange: (settings: Partial<CrownBridgeSettings>) => void;
}

export const CaseAnalysisStep: React.FC<CaseAnalysisStepProps> = ({
  analysis,
  onSettingsChange
}) => {
  if (!analysis) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spin size="large" />
          <Text>Analyzing case...</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>Case Analysis Results</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>Recommended System:</Text>
          <Space style={{ marginLeft: '1rem' }}>
            <Tag color="blue">{analysis.recommendedMaterial}</Tag>
            <Tag color="green">{analysis.recommendedDesign}</Tag>
          </Space>
        </div>

        <div>
          <Text strong>Preparation Analysis:</Text>
          <div style={{ marginTop: '0.5rem' }}>
            <Text>Clearance: {analysis.prepClearance.toFixed(2)}mm</Text>
            <Tag color={analysis.prepClearance >= 1.0 ? 'success' : 'warning'}>
              {analysis.prepClearance >= 1.0 ? 'Adequate' : 'Insufficient'}
            </Tag>
          </div>
        </div>

        <div>
          <Text strong>Confidence Level:</Text>
          <div style={{ marginTop: '0.5rem' }}>
            <Tag color={analysis.confidence >= 0.8 ? 'success' : 'warning'}>
              {(analysis.confidence * 100).toFixed(1)}%
            </Tag>
          </div>
        </div>

        {analysis.reasoning.length > 0 && (
          <div>
            <Text strong>Analysis Reasoning:</Text>
            <List
              size="small"
              dataSource={analysis.reasoning}
              renderItem={item => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </div>
        )}

        {analysis.warnings.length > 0 && (
          <div>
            <Text strong type="warning">Warnings:</Text>
            <List
              size="small"
              dataSource={analysis.warnings}
              renderItem={item => (
                <List.Item>
                  <Text type="warning">{item}</Text>
                </List.Item>
              )}
            />
          </div>
        )}

        {analysis.suggestions.length > 0 && (
          <div>
            <Text strong>AI Suggestions:</Text>
            <List
              size="small"
              dataSource={analysis.suggestions}
              renderItem={suggestion => (
                <List.Item>
                  <Space direction="vertical">
                    <Text>{suggestion.label}</Text>
                    {suggestion.recommended && (
                      <Tag color="green">Recommended</Tag>
                    )}
                    <Text type="secondary">
                      Settings: {Object.entries(suggestion.settings)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}
      </Space>
    </Card>
  );
}; 