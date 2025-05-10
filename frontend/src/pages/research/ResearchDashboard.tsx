import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  useResearchMetrics,
  useResearchSummaries,
  useResearchEncounters,
  useStartEncounter,
  useEndEncounter,
  useAddSuggestion,
  useUpdateSuggestion
} from '../../hooks/useResearch';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Timeline,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Typography,
  Divider,
  Badge,
  Tooltip,
  Spin
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  BarChartOutlined,
  FileTextOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { ResearchMode, ResearchMetrics, ResearchEncounter, ResearchSummary } from '../../types/research';
import { formatDistanceToNow, formatDuration } from 'date-fns';

const { Title, Text } = Typography;
const { Option } = Select;

const ResearchDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState<string>(user?.id || '');
  const [isStartEncounterModalVisible, setIsStartEncounterModalVisible] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<ResearchEncounter | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data
  const { data: metrics, isLoading: metricsLoading } = useResearchMetrics(selectedDoctor);
  const { data: summaries, isLoading: summariesLoading } = useResearchSummaries();
  const { data: encounters, isLoading: encountersLoading } = useResearchEncounters(selectedDoctor);
  
  // Mutations
  const startEncounter = useStartEncounter();
  const endEncounter = useEndEncounter();
  const addSuggestion = useAddSuggestion();
  const updateSuggestion = useUpdateSuggestion();

  // Columns for encounters table
  const encounterColumns = [
    {
      title: 'Patient ID',
      dataIndex: 'patient_id',
      key: 'patient_id',
    },
    {
      title: 'Mode',
      dataIndex: 'mode',
      key: 'mode',
      render: (mode: ResearchMode) => (
        <Tag color={mode === ResearchMode.CLINICAL ? 'blue' : 'green'}>
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (record: ResearchEncounter) => {
        const start = new Date(record.start_time);
        const end = record.end_time ? new Date(record.end_time) : new Date();
        return formatDuration(end.getTime() - start.getTime());
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: ResearchEncounter) => (
        <Tag color={record.end_time ? 'green' : 'orange'}>
          {record.end_time ? 'Completed' : 'In Progress'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: ResearchEncounter) => (
        <Space>
          <Button
            type="link"
            onClick={() => setSelectedEncounter(record)}
          >
            View Details
          </Button>
          {!record.end_time && (
            <Button
              type="primary"
              onClick={() => handleEndEncounter(record.id)}
            >
              End Encounter
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleStartEncounter = async (values: any) => {
    try {
      await startEncounter.mutateAsync({
        patient_id: values.patient_id,
        mode: values.mode,
      });
      message.success('Encounter started successfully');
      setIsStartEncounterModalVisible(false);
    } catch (error) {
      message.error('Failed to start encounter');
    }
  };

  const handleEndEncounter = async (encounterId: string) => {
    Modal.confirm({
      title: 'End Encounter',
      content: 'Did the patient accept the treatment plan?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await endEncounter.mutateAsync({
            encounterId,
            data: {
              patient_acceptance: true,
            },
          });
          message.success('Encounter ended successfully');
        } catch (error) {
          message.error('Failed to end encounter');
        }
      },
      onCancel: async () => {
        try {
          await endEncounter.mutateAsync({
            encounterId,
            data: {
              patient_acceptance: false,
            },
          });
          message.success('Encounter ended successfully');
        } catch (error) {
          message.error('Failed to end encounter');
        }
      },
    });
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>Research Dashboard</Title>
          <Text type="secondary">
            Track and analyze research encounters and metrics
          </Text>
        </Col>
      </Row>

      <Divider />

      {/* Metrics Overview */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Encounters"
              value={metrics?.total_encounters || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Case Time"
              value={metrics?.avg_encounter_duration || 0}
              suffix="minutes"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Patient Acceptance Rate"
              value={metrics?.patient_acceptance_rate || 0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Suggestion Acceptance Rate"
              value={metrics?.suggestions_accepted / metrics?.total_suggestions * 100 || 0}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Performance Scores */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Accuracy Score">
            <Progress
              percent={metrics?.avg_confidence || 0}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Efficiency Score">
            <Progress
              percent={metrics?.avg_encounter_duration ? 100 - (metrics.avg_encounter_duration / 60) : 0}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Encounters Table */}
      <Card
        title="Research Encounters"
        extra={
          <Button
            type="primary"
            onClick={() => setIsStartEncounterModalVisible(true)}
          >
            Start New Encounter
          </Button>
        }
      >
        <Table
          columns={encounterColumns}
          dataSource={encounters}
          loading={encountersLoading}
          rowKey="id"
        />
      </Card>

      {/* Start Encounter Modal */}
      <Modal
        title="Start New Research Encounter"
        visible={isStartEncounterModalVisible}
        onCancel={() => setIsStartEncounterModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleStartEncounter}>
          <Form.Item
            name="patient_id"
            label="Patient ID"
            rules={[{ required: true, message: 'Please input patient ID!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="mode"
            label="Research Mode"
            rules={[{ required: true, message: 'Please select research mode!' }]}
          >
            <Select>
              <Option value={ResearchMode.CLINICAL}>Clinical</Option>
              <Option value={ResearchMode.TRAINING}>Training</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Start Encounter
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Encounter Details Modal */}
      <Modal
        title="Encounter Details"
        visible={!!selectedEncounter}
        onCancel={() => setSelectedEncounter(null)}
        footer={null}
        width={800}
      >
        {selectedEncounter && (
          <Timeline>
            <Timeline.Item>
              <Text strong>Start Time:</Text>{' '}
              {new Date(selectedEncounter.start_time).toLocaleString()}
            </Timeline.Item>
            {selectedEncounter.end_time && (
              <Timeline.Item>
                <Text strong>End Time:</Text>{' '}
                {new Date(selectedEncounter.end_time).toLocaleString()}
              </Timeline.Item>
            )}
            <Timeline.Item>
              <Text strong>Procedures:</Text>
              <br />
              <Space>
                <Tag color="blue">Suggested: {selectedEncounter.suggestions.length}</Tag>
                <Tag color="green">Accepted: {selectedEncounter.suggestions.filter(s => s.action === 'accepted').length}</Tag>
                <Tag color="orange">Modified: {selectedEncounter.suggestions.filter(s => s.action === 'modified').length}</Tag>
                <Tag color="red">Rejected: {selectedEncounter.suggestions.filter(s => s.action === 'rejected').length}</Tag>
              </Space>
            </Timeline.Item>
            {selectedEncounter.suggestions.map((suggestion, index) => (
              <Timeline.Item key={index}>
                <Text strong>AI Suggestion:</Text>
                <br />
                <Space>
                  <Text>{suggestion.type}</Text>
                  <Tag color={
                    suggestion.action === 'accepted' ? 'green' :
                    suggestion.action === 'modified' ? 'orange' :
                    suggestion.action === 'rejected' ? 'red' : 'blue'
                  }>
                    {suggestion.action}
                  </Tag>
                  <Text type="secondary">
                    {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}
                  </Text>
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Modal>
    </div>
  );
};

export default ResearchDashboard; 