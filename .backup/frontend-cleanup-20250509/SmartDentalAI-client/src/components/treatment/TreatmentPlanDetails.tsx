import React, { useEffect, useState } from 'react';
import { Card, Typography, Tabs, Space, Spin } from 'antd';
import { TriageSummary } from '../patient/TriageSummary';
import axios from 'axios';

const { Title } = Typography;
const { TabPane } = Tabs;

interface TreatmentPlanDetailsProps {
  patientId: number;
  treatmentPlanId: number;
}

export const TreatmentPlanDetails: React.FC<TreatmentPlanDetailsProps> = ({
  patientId,
  treatmentPlanId,
}) => {
  const [loading, setLoading] = useState(true);
  const [triageResults, setTriageResults] = useState([]);
  const [treatmentPlan, setTreatmentPlan] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch triage results
        const triageResponse = await axios.get(`/api/ai-triage/patient/${patientId}`);
        setTriageResults(triageResponse.data);

        // Fetch treatment plan details
        const planResponse = await axios.get(`/api/treatment-plans/${treatmentPlanId}`);
        setTreatmentPlan(planResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, treatmentPlanId]);

  if (loading) {
    return (
      <Card>
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Spin size="large" />
        </Space>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={3}>Treatment Plan Details</Title>
      <Tabs defaultActiveKey="progress">
        <TabPane tab="Treatment Progress" key="progress">
          <TriageSummary triageResults={triageResults} />
        </TabPane>
        
        <TabPane tab="Plan Details" key="details">
          {treatmentPlan && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={4}>{treatmentPlan.planName}</Title>
              {/* Add treatment plan details here */}
            </Space>
          )}
        </TabPane>

        <TabPane tab="Recommendations" key="recommendations">
          {treatmentPlan?.aiRecommendations && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={4}>AI Recommendations</Title>
              {/* Add AI recommendations here */}
            </Space>
          )}
        </TabPane>
      </Tabs>
    </Card>
  );
}; 