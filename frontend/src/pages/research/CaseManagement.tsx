import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  Timeline,
  message,
  Spin,
  Tabs,
  Avatar
} from 'antd';
import {
  UserOutlined,
  RobotOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useResearchEncounters, useStartEncounter, useAddSuggestion } from '../../hooks/useResearch';
import { ResearchMode, ResearchEncounter } from '../../types/research';
import { formatDistanceToNow } from 'date-fns';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface Case {
  id: string;
  patient_id: string;
  title: string;
  description: string;
  assigned_doctor: string;
  status: 'pending' | 'in_progress' | 'completed';
  ai_analysis?: {
    diagnosis: string;
    confidence: number;
    suggestions: string[];
  };
  doctor_analysis?: {
    diagnosis: string;
    treatment_plan: string;
    notes: string;
  };
  created_at: string;
  updated_at: string;
}

const CaseManagement: React.FC = () => {
  const { user } = useAuth();
  const [isCreateCaseModalVisible, setIsCreateCaseModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [activeTab, setActiveTab] = useState('1');

  // Mock data for cases (replace with actual API calls)
  const [cases, setCases] = useState<Case[]>([
    {
      id: '1',
      patient_id: 'P001',
      title: 'Dental Caries Analysis',
      description: 'Patient with multiple caries requiring analysis',
      assigned_doctor: user?.id || '',
      status: 'in_progress',
      ai_analysis: {
        diagnosis: 'Multiple caries in molars',
        confidence: 0.85,
        suggestions: ['Root canal treatment', 'Crown placement']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  const handleCreateCase = async (values: any) => {
    try {
      const newCase: Case = {
        id: Date.now().toString(),
        patient_id: values.patient_id,
        title: values.title,
        description: values.description,
        assigned_doctor: user?.id || '',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCases([...cases, newCase]);
      message.success('Case created successfully');
      setIsCreateCaseModalVisible(false);
    } catch (error) {
      message.error('Failed to create case');
    }
  };

  const handleStartAnalysis = async (caseId: string) => {
    try {
      // Start AI analysis
      const updatedCases = cases.map(c => {
        if (c.id === caseId) {
          return {
            ...c,
            status: 'in_progress',
            ai_analysis: {
              diagnosis: 'Analyzing...',
              confidence: 0,
              suggestions: []
            }
          };
        }
        return c;
      });
      setCases(updatedCases);
      message.success('AI analysis started');
    } catch (error) {
      message.error('Failed to start analysis');
    }
  };

  const handleSubmitDoctorAnalysis = async (values: any) => {
    try {
      const updatedCases = cases.map(c => {
        if (c.id === selectedCase?.id) {
          return {
            ...c,
            doctor_analysis: {
              diagnosis: values.diagnosis,
              treatment_plan: values.treatment_plan,
              notes: values.notes
            },
            status: 'completed'
          };
        }
        return c;
      });
      setCases(updatedCases);
      message.success('Analysis submitted successfully');
      setSelectedCase(null);
    } catch (error) {
      message.error('Failed to submit analysis');
    }
  };

  const columns = [
    {
      title: 'Case ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Patient ID',
      dataIndex: 'patient_id',
      key: 'patient_id',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: Case) => (
        <Tag color={
          record.status === 'completed' ? 'green' :
          record.status === 'in_progress' ? 'blue' : 'orange'
        }>
          {record.status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Case) => (
        <Space>
          <Button
            type="link"
            onClick={() => setSelectedCase(record)}
          >
            View Details
          </Button>
          {record.status === 'pending' && (
            <Button
              type="primary"
              onClick={() => handleStartAnalysis(record.id)}
            >
              Start Analysis
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>Case Management</Title>
          <Text type="secondary">
            Create and manage cases for AI and doctor collaboration
          </Text>
        </Col>
      </Row>

      <Divider />

      <Card
        title="Cases"
        extra={
          <Button
            type="primary"
            onClick={() => setIsCreateCaseModalVisible(true)}
          >
            Create New Case
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={cases}
          rowKey="id"
        />
      </Card>

      {/* Create Case Modal */}
      <Modal
        title="Create New Case"
        visible={isCreateCaseModalVisible}
        onCancel={() => setIsCreateCaseModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleCreateCase}>
          <Form.Item
            name="patient_id"
            label="Patient ID"
            rules={[{ required: true, message: 'Please input patient ID!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="title"
            label="Case Title"
            rules={[{ required: true, message: 'Please input case title!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Case Description"
            rules={[{ required: true, message: 'Please input case description!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create Case
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Case Details Modal */}
      <Modal
        title="Case Details"
        visible={!!selectedCase}
        onCancel={() => setSelectedCase(null)}
        footer={null}
        width={800}
      >
        {selectedCase && (
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Overview" key="1">
              <Timeline>
                <Timeline.Item>
                  <Text strong>Created:</Text>{' '}
                  {formatDistanceToNow(new Date(selectedCase.created_at), { addSuffix: true })}
                </Timeline.Item>
                <Timeline.Item>
                  <Text strong>Status:</Text>{' '}
                  <Tag color={
                    selectedCase.status === 'completed' ? 'green' :
                    selectedCase.status === 'in_progress' ? 'blue' : 'orange'
                  }>
                    {selectedCase.status.replace('_', ' ').toUpperCase()}
                  </Tag>
                </Timeline.Item>
              </Timeline>
            </TabPane>

            <TabPane tab="AI Analysis" key="2">
              {selectedCase.ai_analysis ? (
                <div>
                  <Card>
                    <Text strong>AI Diagnosis:</Text>
                    <p>{selectedCase.ai_analysis.diagnosis}</p>
                    <Text strong>Confidence:</Text>
                    <p>{selectedCase.ai_analysis.confidence * 100}%</p>
                    <Text strong>Suggestions:</Text>
                    <ul>
                      {selectedCase.ai_analysis.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </Card>
                </div>
              ) : (
                <Text>AI analysis not started yet</Text>
              )}
            </TabPane>

            <TabPane tab="Doctor Analysis" key="3">
              {selectedCase.doctor_analysis ? (
                <div>
                  <Card>
                    <Text strong>Doctor's Diagnosis:</Text>
                    <p>{selectedCase.doctor_analysis.diagnosis}</p>
                    <Text strong>Treatment Plan:</Text>
                    <p>{selectedCase.doctor_analysis.treatment_plan}</p>
                    <Text strong>Notes:</Text>
                    <p>{selectedCase.doctor_analysis.notes}</p>
                  </Card>
                </div>
              ) : (
                <Form onFinish={handleSubmitDoctorAnalysis}>
                  <Form.Item
                    name="diagnosis"
                    label="Diagnosis"
                    rules={[{ required: true, message: 'Please input diagnosis!' }]}
                  >
                    <Input.TextArea rows={4} />
                  </Form.Item>
                  <Form.Item
                    name="treatment_plan"
                    label="Treatment Plan"
                    rules={[{ required: true, message: 'Please input treatment plan!' }]}
                  >
                    <Input.TextArea rows={4} />
                  </Form.Item>
                  <Form.Item
                    name="notes"
                    label="Additional Notes"
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Submit Analysis
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </TabPane>

            <TabPane tab="Collaboration" key="4">
              <Card>
                <Timeline>
                  <Timeline.Item>
                    <Space>
                      <Avatar icon={<RobotOutlined />} />
                      <Text>AI Analysis Completed</Text>
                      <Text type="secondary">
                        {formatDistanceToNow(new Date(selectedCase.updated_at), { addSuffix: true })}
                      </Text>
                    </Space>
                  </Timeline.Item>
                  {selectedCase.doctor_analysis && (
                    <Timeline.Item>
                      <Space>
                        <Avatar icon={<UserOutlined />} />
                        <Text>Doctor Analysis Submitted</Text>
                        <Text type="secondary">
                          {formatDistanceToNow(new Date(selectedCase.updated_at), { addSuffix: true })}
                        </Text>
                      </Space>
                    </Timeline.Item>
                  )}
                </Timeline>
              </Card>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default CaseManagement; 