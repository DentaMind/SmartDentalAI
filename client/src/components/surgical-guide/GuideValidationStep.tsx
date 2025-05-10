import React from 'react';
import { Card, Button, List, Tag, Typography, Space, Alert } from 'antd';
import { GuideValidation } from '../../../server/types/surgical-guide';
import * as THREE from 'three';

const { Title, Text } = Typography;

interface GuideValidationStepProps {
  guideGeometry: THREE.BufferGeometry | null;
  validation: GuideValidation | null;
  onValidate: () => void;
}

const GuideValidationStep: React.FC<GuideValidationStepProps> = ({
  guideGeometry,
  validation,
  onValidate
}) => {
  if (!guideGeometry) {
    return (
      <Card>
        <Alert
          message="No Guide Generated"
          description="Please generate a guide in the previous step before validating."
          type="info"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Guide Validation</Title>
          <Text type="secondary">
            Validate the guide design for safety and effectiveness.
          </Text>
        </div>

        {validation ? (
          <div>
            <Alert
              message={validation.isValid ? 'Guide Design Valid' : 'Guide Design Issues Found'}
              description={
                validation.isValid
                  ? 'The guide design meets all safety and effectiveness criteria.'
                  : 'Please review the warnings and suggestions below.'
              }
              type={validation.isValid ? 'success' : 'warning'}
              showIcon
            />

            {validation.warnings.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24 }}>Warnings</Title>
                <List
                  dataSource={validation.warnings}
                  renderItem={item => (
                    <List.Item>
                      <Tag color="red">{item}</Tag>
                    </List.Item>
                  )}
                />
              </>
            )}

            {validation.suggestions.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24 }}>Suggestions</Title>
                <List
                  dataSource={validation.suggestions}
                  renderItem={item => (
                    <List.Item>
                      <Tag color="blue">{item}</Tag>
                    </List.Item>
                  )}
                />
              </>
            )}

            {validation.collisionPoints.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24 }}>Collision Points</Title>
                <List
                  dataSource={validation.collisionPoints}
                  renderItem={point => (
                    <List.Item>
                      <Text>
                        ({point.x.toFixed(2)}, {point.y.toFixed(2)}, {point.z.toFixed(2)})
                      </Text>
                    </List.Item>
                  )}
                />
              </>
            )}

            <div style={{ marginTop: 24 }}>
              <Text strong>Safe Distance:</Text>{' '}
              <Tag color="green">{validation.safeDistance.toFixed(1)} mm</Tag>
            </div>
          </div>
        ) : (
          <Button type="primary" onClick={onValidate}>
            Validate Guide
          </Button>
        )}
      </Space>
    </Card>
  );
};

export default GuideValidationStep; 