import React from 'react';
import { Card, Typography, Space, Tag, Tooltip } from 'antd';
import { CrownBridgeAnalysis, CrownBridgeSettings } from '../../../../server/types/crown-bridge';
import { QuestionCircleOutlined } from '@ant-design/icons';

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
        <Text type="secondary">Loading analysis...</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>Case Analysis Results</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>Recommended Material: </Text>
          <Tag color="blue">{analysis.recommendedMaterial}</Tag>
          <Tooltip title="AI recommendation based on preparation type, location, and occlusion">
            <QuestionCircleOutlined style={{ marginLeft: '8px' }} />
          </Tooltip>
        </div>

        <div>
          <Text strong>Recommended Design: </Text>
          <Tag color="green">{analysis.recommendedDesign}</Tag>
          <Tooltip title="AI recommendation based on tooth condition and restoration requirements">
            <QuestionCircleOutlined style={{ marginLeft: '8px' }} />
          </Tooltip>
        </div>

        <div>
          <Text strong>Preparation Clearance: </Text>
          <Tag color={analysis.prepClearance > 1.5 ? 'green' : 'orange'}>
            {analysis.prepClearance.toFixed(2)}mm
          </Tag>
          <Tooltip title="Minimum thickness required for the selected material">
            <QuestionCircleOutlined style={{ marginLeft: '8px' }} />
          </Tooltip>
        </div>

        <div>
          <Text strong>Confidence Level: </Text>
          <Tag color={analysis.confidence > 0.8 ? 'green' : 'orange'}>
            {(analysis.confidence * 100).toFixed(1)}%
          </Tag>
          <Tooltip title="AI confidence in the recommendations">
            <QuestionCircleOutlined style={{ marginLeft: '8px' }} />
          </Tooltip>
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