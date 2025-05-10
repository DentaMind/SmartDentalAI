import React from 'react';
import { Card, Button, List, Tag, Typography, Space } from 'antd';
import { 
  Implant, 
  NerveTrace, 
  GuideAnalysis 
} from '../../../server/types/surgical-guide';
import * as THREE from 'three';

const { Title, Text } = Typography;

interface GuideAnalysisStepProps {
  implants: Implant[];
  tissueSurface: THREE.BufferGeometry;
  nerveTraces: NerveTrace[];
  onAnalyze: () => void;
  analysis: GuideAnalysis | null;
}

const GuideAnalysisStep: React.FC<GuideAnalysisStepProps> = ({
  implants,
  tissueSurface,
  nerveTraces,
  onAnalyze,
  analysis
}) => {
  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Case Analysis</Title>
          <List>
            <List.Item>
              <Text strong>Implants:</Text> {implants.length} planned
            </List.Item>
            <List.Item>
              <Text strong>Tissue Surface:</Text> {tissueSurface.attributes.position.count / 3} vertices
            </List.Item>
            <List.Item>
              <Text strong>Nerve Traces:</Text> {nerveTraces.length} detected
            </List.Item>
          </List>
        </div>

        {analysis ? (
          <div>
            <Title level={4}>Analysis Results</Title>
            <List>
              <List.Item>
                <Text strong>Recommended System:</Text>{' '}
                <Tag color="blue">{analysis.recommendedSystem}</Tag>
              </List.Item>
              <List.Item>
                <Text strong>Bone Type:</Text>{' '}
                <Tag color="green">{analysis.boneType}</Tag>
              </List.Item>
              <List.Item>
                <Text strong>Guide Type:</Text>{' '}
                <Tag color="purple">{analysis.guideType}</Tag>
              </List.Item>
              <List.Item>
                <Text strong>Confidence:</Text>{' '}
                <Tag color="orange">{Math.round(analysis.confidence * 100)}%</Tag>
              </List.Item>
            </List>

            <Title level={5}>Reasoning</Title>
            <List
              dataSource={analysis.reasoning}
              renderItem={item => <List.Item>{item}</List.Item>}
            />

            {analysis.warnings.length > 0 && (
              <>
                <Title level={5}>Warnings</Title>
                <List
                  dataSource={analysis.warnings}
                  renderItem={item => (
                    <List.Item>
                      <Tag color="red">{item}</Tag>
                    </List.Item>
                  )}
                />
              </>
            )}

            {analysis.suggestions.length > 0 && (
              <>
                <Title level={5}>Suggestions</Title>
                <List
                  dataSource={analysis.suggestions}
                  renderItem={item => (
                    <List.Item>
                      <Tag color="blue">{item}</Tag>
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        ) : (
          <Button type="primary" onClick={onAnalyze}>
            Analyze Case
          </Button>
        )}
      </Space>
    </Card>
  );
};

export default GuideAnalysisStep; 