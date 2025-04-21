import React, { useState } from 'react';
import { Layout, Card, Space, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import { CaseLoader } from '../../components/crown-bridge/CaseLoader';
import { CrownBridgeCase } from '../../types/crown-bridge';
import { CrownBridgeWorkflow } from '../../components/crown-bridge/CrownBridgeWorkflow';

const { Content } = Layout;
const { Title } = Typography;

const PatientCases: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [currentCase, setCurrentCase] = useState<CrownBridgeCase | null>(null);

  const handleCaseLoaded = (caseData: CrownBridgeCase) => {
    setCurrentCase(caseData);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', marginLeft: '200px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Crown & Bridge Cases</Title>
          
          <Card>
            <CaseLoader
              onCaseLoaded={handleCaseLoaded}
              patientId={patientId}
            />
          </Card>

          {currentCase && (
            <Card>
              <CrownBridgeWorkflow
                initialCase={currentCase}
                onCaseSaved={(caseId) => {
                  console.log('Case saved:', caseId);
                }}
              />
            </Card>
          )}
        </Space>
      </Content>
    </Layout>
  );
};

export default PatientCases; 