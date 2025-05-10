import React from 'react';
import { Card, Button, Progress, Typography, Space, List, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { CrownBridgeValidation } from '../../../../server/types/crown-bridge';

const { Title, Text } = Typography;

interface ValidationStepProps {
  validation: CrownBridgeValidation | null;
  onValidate: () => void;
}

export const ValidationStep: React.FC<ValidationStepProps> = ({
  validation,
  onValidate
}) => {
  return (
    <Card>
      <Title level={4}>Design Validation</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {!validation ? (
          <Button type="primary" onClick={onValidate}>
            Run Validation
          </Button>
        ) : (
          <>
            <div>
              <Space>
                <Text strong>Margin Fit: </Text>
                <Tooltip title="Assessment of margin adaptation">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
              <Progress
                percent={validation.marginFit * 100}
                status={validation.marginFit > 0.8 ? 'success' : 'normal'}
              />
            </div>

            <div>
              <Space>
                <Text strong>Occlusion Clearance: </Text>
                <Tooltip title="Assessment of occlusal clearance">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
              <Progress
                percent={validation.occlusionClearance * 100}
                status={validation.occlusionClearance > 0.8 ? 'success' : 'normal'}
              />
            </div>

            <div>
              <Space>
                <Text strong>Connector Strength: </Text>
                <Tooltip title="Assessment of connector strength for bridges">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
              <Progress
                percent={validation.connectorStrength * 100}
                status={validation.connectorStrength > 0.8 ? 'success' : 'normal'}
              />
            </div>

            {validation.warnings.length > 0 && (
              <div>
                <Text strong type="warning">Warnings:</Text>
                <List
                  dataSource={validation.warnings}
                  renderItem={(warning) => (
                    <List.Item>
                      <Text type="warning">{warning}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {validation.suggestions.length > 0 && (
              <div>
                <Text strong>Suggestions:</Text>
                <List
                  dataSource={validation.suggestions}
                  renderItem={(suggestion) => (
                    <List.Item>
                      <Text>{suggestion}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}

            <Button type="primary" onClick={onValidate}>
              Re-run Validation
            </Button>
          </>
        )}
      </Space>
    </Card>
  );
}; 