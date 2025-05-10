import React from 'react';
import { PageHeader } from 'antd';
import RiskEvaluation from '../components/RiskEvaluation';

const RiskEvaluationPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Risk Evaluation"
        subTitle="Evaluate patient risk for dental procedures"
      />
      <div style={{ padding: '24px' }}>
        <RiskEvaluation />
      </div>
    </div>
  );
};

export default RiskEvaluationPage; 