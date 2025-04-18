import React from 'react';
import { Card, Button, Progress, Typography, Space, List } from 'antd';
import { DentureValidation } from '../../../../server/types/denture';

const { Title, Text } = Typography;

interface ValidationStepProps {
  validation: DentureValidation | null;
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
              <Text strong>Retention Score: </Text>
              <Progress
                percent={validation.retentionScore * 100}
                status={validation.retentionScore > 0.8 ? 'success' : 'normal'}
              />
            </div>

            <div>
              <Text strong>Occlusal Clearance: </Text>
              <Progress
                percent={validation.occlusalClearance * 100}
                status={validation.occlusalClearance > 0.8 ? 'success' : 'normal'}
              />
            </div>

            <div>
              <Text strong>Tissue Adaptation: </Text>
              <Progress
                percent={validation.tissueAdaptation * 100}
                status={validation.tissueAdaptation > 0.8 ? 'success' : 'normal'}
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