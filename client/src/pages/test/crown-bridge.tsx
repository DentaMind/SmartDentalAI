import React, { useState } from 'react';
import { Layout, Card, Space, Typography } from 'antd';
import { CrownBridgeWorkflow } from '../../components/crown-bridge/CrownBridgeWorkflow';
import { CaseLoader } from '../../components/crown-bridge/CaseLoader';
import { CrownBridgeCase } from '../../types/crown-bridge';

const { Content } = Layout;
const { Title } = Typography;

const CrownBridgeTestPage: React.FC = () => {
  const [currentCase, setCurrentCase] = useState<CrownBridgeCase | null>(null);

  const handleCaseLoaded = (caseData: CrownBridgeCase) => {
    setCurrentCase(caseData);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Crown & Bridge Workflow Test</Title>
          
          <Card>
            <CaseLoader
              onCaseLoaded={handleCaseLoaded}
              patientId="test-patient" // Replace with actual patient ID
            />
          </Card>

          <Card>
            <CrownBridgeWorkflow
              initialCase={currentCase}
              onCaseSaved={(caseId) => {
                console.log('Case saved:', caseId);
              }}
            />
          </Card>
        </Space>
      </Content>
    </Layout>
  );
};

export default CrownBridgeTestPage; 