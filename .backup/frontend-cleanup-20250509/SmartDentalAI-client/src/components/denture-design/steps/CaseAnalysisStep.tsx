import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { DentureAnalysis, DentureSettings } from '../../../../server/types/denture';

const { Title, Text } = Typography;

interface CaseAnalysisStepProps {
  analysis: DentureAnalysis | null;
  onSettingsChange: (settings: Partial<DentureSettings>) => void;
}

export const CaseAnalysisStep: React.FC<CaseAnalysisStepProps> = ({
  analysis,
  onSettingsChange
}) => {
  if (!analysis) {
    return (
      <Card>
        <Text type="secondary">Loading analysis...</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>Case Analysis Results</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>Recommended System: </Text>
          <Tag color="blue">{analysis.recommendedSystem}</Tag>
        </div>

        <div>
          <Text strong>Bone Type: </Text>
          <Tag color="green">{analysis.boneType}</Tag>
        </div>

        <div>
          <Text strong>Confidence Level: </Text>
          <Tag color={analysis.confidence > 0.8 ? 'green' : 'orange'}>
            {(analysis.confidence * 100).toFixed(1)}%
          </Tag>
        </div>

        <div>
          <Text strong>Reasoning:</Text>
          <ul>
            {analysis.reasoning.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>

        {analysis.warnings.length > 0 && (
          <div>
            <Text strong type="warning">Warnings:</Text>
            <ul>
              {analysis.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <Text strong>Suggestions:</Text>
          <ul>
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index}>
                {suggestion.label}
                {suggestion.recommended && (
                  <Tag color="green" style={{ marginLeft: '8px' }}>Recommended</Tag>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Space>
    </Card>
  );
}; 