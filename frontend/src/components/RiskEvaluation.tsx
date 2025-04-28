import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Card, Form, Input, Select, Space, Typography, Alert, Badge, Tag, Row, Col, Statistic, Divider, Modal, message } from 'antd';
import { evaluateRisk, saveRiskEvaluation, getPatientRiskHistory } from '../api/risk';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, ClockCircleOutlined, SaveOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface MedicalHistoryForm {
  patient_id: string;
  conditions: Array<{
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  medications: Array<{
    name: string;
    drug_class: string;
  }>;
  bloodwork: Array<{
    test_name: string;
    value: number;
    unit: string;
  }>;
  dental_history: {
    last_cleaning: string;
    last_xrays: string;
    previous_treatments: string[];
  };
}

interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high';
  asa_classification: string;
  risk_factors: string[];
  medication_interactions: string[];
  bloodwork_concerns: string[];
  epinephrine_risk: 'green' | 'yellow' | 'red';
  requires_medical_clearance: boolean;
  treatment_modifications: string[];
  recommendations: string[];
  concerns: string[];
}

interface Patient {
  id: string;
  name: string;
}

const RiskEvaluation: React.FC = () => {
  const [form] = Form.useForm();
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [riskHistory, setRiskHistory] = useState<SavedRiskEvaluation[]>([]);

  useEffect(() => {
    // TODO: Replace with actual patient fetch
    setPatients([
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ]);
  }, []);

  const onFinish = async (values: MedicalHistoryForm) => {
    setLoading(true);
    setError(null);
    try {
      const response = await evaluateRisk(values);
      setRiskAssessment(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPatient || !riskAssessment) {
      message.error('Please select a patient and complete a risk evaluation first');
      return;
    }

    try {
      await saveRiskEvaluation(selectedPatient, form.getFieldsValue(), riskAssessment);
      message.success('Risk evaluation saved successfully');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to save risk evaluation');
    }
  };

  const handleShowHistory = async () => {
    if (!selectedPatient) {
      message.error('Please select a patient first');
      return;
    }

    try {
      const history = await getPatientRiskHistory(selectedPatient);
      setRiskHistory(history);
      setShowHistory(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to fetch risk history');
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getEpinephrineIcon = (risk: string) => {
    switch (risk) {
      case 'green': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'yellow': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'red': return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>Risk Evaluation</Title>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            conditions: [{}],
            medications: [{}],
            bloodwork: [{}],
            dental_history: {
              previous_treatments: []
            }
          }}
        >
          <Form.Item
            label="Select Patient"
            name="patient_id"
            rules={[{ required: true, message: 'Please select a patient!' }]}
          >
            <Select
              placeholder="Select a patient"
              onChange={(value) => setSelectedPatient(value)}
              options={patients.map(p => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>

          <Title level={4}>Medical Conditions</Title>
          <Form.List name="conditions">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      name={[field.name, 'name']}
                      rules={[{ required: true, message: 'Missing condition name' }]}
                    >
                      <Input placeholder="Condition name" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'severity']}
                      rules={[{ required: true, message: 'Missing severity' }]}
                    >
                      <Select placeholder="Severity">
                        <Option value="mild">Mild</Option>
                        <Option value="moderate">Moderate</Option>
                        <Option value="severe">Severe</Option>
                      </Select>
                    </Form.Item>
                    <Button type="link" onClick={() => remove(field.name)}>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    Add Condition
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Title level={4}>Medications</Title>
          <Form.List name="medications">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      name={[field.name, 'name']}
                      rules={[{ required: true, message: 'Missing medication name' }]}
                    >
                      <Input placeholder="Medication name" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'drug_class']}
                      rules={[{ required: true, message: 'Missing drug class' }]}
                    >
                      <Input placeholder="Drug class" />
                    </Form.Item>
                    <Button type="link" onClick={() => remove(field.name)}>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    Add Medication
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Title level={4}>Bloodwork</Title>
          <Form.List name="bloodwork">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      name={[field.name, 'test_name']}
                      rules={[{ required: true, message: 'Missing test name' }]}
                    >
                      <Input placeholder="Test name" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'value']}
                      rules={[{ required: true, message: 'Missing value' }]}
                    >
                      <Input type="number" placeholder="Value" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'unit']}
                      rules={[{ required: true, message: 'Missing unit' }]}
                    >
                      <Input placeholder="Unit" />
                    </Form.Item>
                    <Button type="link" onClick={() => remove(field.name)}>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    Add Bloodwork
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Title level={4}>Dental History</Title>
          <Form.Item
            label="Last Cleaning"
            name={['dental_history', 'last_cleaning']}
            rules={[{ required: true, message: 'Please input last cleaning date!' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            label="Last X-Rays"
            name={['dental_history', 'last_xrays']}
            rules={[{ required: true, message: 'Please input last x-rays date!' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.List name={['dental_history', 'previous_treatments']}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      rules={[{ required: true, message: 'Missing treatment' }]}
                    >
                      <Input placeholder="Previous treatment" />
                    </Form.Item>
                    <Button type="link" onClick={() => remove(field.name)}>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    Add Previous Treatment
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Evaluate Risk
              </Button>
              {riskAssessment && (
                <>
                  <Button 
                    type="default" 
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    disabled={!selectedPatient}
                  >
                    Save Evaluation
                  </Button>
                  <Button 
                    type="default" 
                    icon={<HistoryOutlined />}
                    onClick={handleShowHistory}
                    disabled={!selectedPatient}
                  >
                    View History
                  </Button>
                </>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {riskAssessment && (
        <Card style={{ marginTop: 16 }}>
          <Title level={3}>Risk Assessment Results</Title>
          
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Overall Risk Level"
                  value={riskAssessment.risk_level.toUpperCase()}
                  valueStyle={{ color: getRiskColor(riskAssessment.risk_level) }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="ASA Classification"
                  value={riskAssessment.asa_classification}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Epinephrine Safety"
                  value={riskAssessment.epinephrine_risk.toUpperCase()}
                  prefix={getEpinephrineIcon(riskAssessment.epinephrine_risk)}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Risk Factors" size="small">
                {riskAssessment.risk_factors.map((factor, index) => (
                  <Tag key={index} color="red" style={{ marginBottom: 8 }}>
                    {factor}
                  </Tag>
                ))}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Medication Interactions" size="small">
                {riskAssessment.medication_interactions.map((interaction, index) => (
                  <Tag key={index} color="orange" style={{ marginBottom: 8 }}>
                    {interaction}
                  </Tag>
                ))}
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Bloodwork Concerns" size="small">
                {riskAssessment.bloodwork_concerns.map((concern, index) => (
                  <Tag key={index} color="blue" style={{ marginBottom: 8 }}>
                    {concern}
                  </Tag>
                ))}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Treatment Modifications" size="small">
                {riskAssessment.treatment_modifications.map((modification, index) => (
                  <Tag key={index} color="green" style={{ marginBottom: 8 }}>
                    {modification}
                  </Tag>
                ))}
              </Card>
            </Col>
          </Row>

          <Divider />

          {riskAssessment.requires_medical_clearance && (
            <Alert
              message="Medical Clearance Required"
              description="This patient requires medical clearance before proceeding with treatment."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Card title="Recommendations" size="small">
            {riskAssessment.recommendations.map((recommendation, index) => (
              <p key={index} style={{ marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                {recommendation}
              </p>
            ))}
          </Card>

          {riskAssessment.concerns.length > 0 && (
            <Card title="Additional Concerns" size="small" style={{ marginTop: 16 }}>
              {riskAssessment.concerns.map((concern, index) => (
                <p key={index} style={{ marginBottom: 8 }}>
                  <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                  {concern}
                </p>
              ))}
            </Card>
          )}
        </Card>
      )}

      <Modal
        title="Risk Evaluation History"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={null}
        width={800}
      >
        {riskHistory.map((record) => (
          <Card key={record.id} style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text strong>Date: </Text>
                <Text>{new Date(record.evaluation_date).toLocaleDateString()}</Text>
              </Col>
              <Col span={8}>
                <Statistic
                  title="Risk Level"
                  value={record.risk_assessment.risk_level.toUpperCase()}
                  valueStyle={{ color: getRiskColor(record.risk_assessment.risk_level) }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="ASA Classification"
                  value={record.risk_assessment.asa_classification}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Epinephrine Safety"
                  value={record.risk_assessment.epinephrine_risk.toUpperCase()}
                  prefix={getEpinephrineIcon(record.risk_assessment.epinephrine_risk)}
                />
              </Col>
            </Row>
          </Card>
        ))}
      </Modal>
    </div>
  );
};

export default RiskEvaluation; 