import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDoctorEncounters, useStartEncounter, useEndEncounter } from '../../services/researchService';
import {
  Card,
  List,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Slider,
  Divider,
  Badge,
  Timeline,
  message,
  Alert
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';
import { ResearchMode, ResearchEncounter } from '../../services/researchService';
import { formatDistanceToNow } from 'date-fns';

const { Title, Text } = Typography;
const { Option } = Select;

const DoctorPortal: React.FC = () => {
  const { user } = useAuth();
  const [selectedEncounter, setSelectedEncounter] = useState<ResearchEncounter | null>(null);
  const [isSubmitDiagnosisModalVisible, setIsSubmitDiagnosisModalVisible] = useState(false);

  // Fetch data
  const { data: encounters, isLoading: encountersLoading } = useDoctorEncounters(user?.id || '');
  
  // Mutations
  const startEncounter = useStartEncounter();
  const endEncounter = useEndEncounter();

  const handleStartEncounter = async (values: any) => {
    try {
      await startEncounter.mutateAsync({
        patient_id: values.patient_id,
        mode: values.mode,
      });
      message.success('Encounter started successfully');
    } catch (error) {
      message.error('Failed to start encounter');
    }
  };

  const handleSubmitDiagnosis = async (values: any) => {
    try {
      // TODO: Implement diagnosis submission
      message.success('Diagnosis submitted successfully');
      setIsSubmitDiagnosisModalVisible(false);
    } catch (error) {
      message.error('Failed to submit diagnosis');
    }
  };

  const handleEndEncounter = async (encounter_id: string) => {
    Modal.confirm({
      title: 'End Encounter',
      content: 'Did the patient accept the treatment plan?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await endEncounter.mutateAsync({
            encounter_id,
            patient_acceptance: true,
          });
          message.success('Encounter ended successfully');
        } catch (error) {
          message.error('Failed to end encounter');
        }
      },
      onCancel: async () => {
        try {
          await endEncounter.mutateAsync({
            encounter_id,
            patient_acceptance: false,
          });
          message.success('Encounter ended successfully');
        } catch (error) {
          message.error('Failed to end encounter');
        }
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>Research Portal</Title>
          <Text type="secondary">
            Manage your assigned research cases and encounters
          </Text>
        </Col>
      </Row>

      <Divider />

      {/* Assigned Cases */}
      <Card
        title="Assigned Cases"
        extra={
          <Button
            type="primary"
            onClick={() => setIsSubmitDiagnosisModalVisible(true)}
          >
            Start New Case
          </Button>
        }
      >
        <List
          loading={encountersLoading}
          dataSource={encounters}
          renderItem={(encounter: ResearchEncounter) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  onClick={() => setSelectedEncounter(encounter)}
                >
                  View Details
                </Button>,
                !encounter.end_time && (
                  <Button
                    type="primary"
                    onClick={() => handleEndEncounter(encounter.encounter_id)}
                  >
                    End Case
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={<UserOutlined />}
                title={`Patient ID: ${encounter.patient_id}`}
                description={
                  <Space>
                    <Tag color={encounter.mode === ResearchMode.CLINICAL ? 'blue' : 'green'}>
                      {encounter.mode.charAt(0).toUpperCase() + encounter.mode.slice(1)}
                    </Tag>
                    <Text type="secondary">
                      Started {formatDistanceToNow(new Date(encounter.start_time), { addSuffix: true })}
                    </Text>
                    {!encounter.end_time ? (
                      <Badge status="processing" text="In Progress" />
                    ) : (
                      <Badge status="success" text="Completed" />
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Submit Diagnosis Modal */}
      <Modal
        title="Submit Diagnosis"
        visible={isSubmitDiagnosisModalVisible}
        onCancel={() => setIsSubmitDiagnosisModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleSubmitDiagnosis}>
          <Form.Item
            name="patient_id"
            label="Patient ID"
            rules={[{ required: true, message: 'Please input patient ID!' }]}
          >
            <Input />
          </Form.Item>
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
            name="confidence"
            label="Confidence Level"
            rules={[{ required: true, message: 'Please select confidence level!' }]}
          >
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit Diagnosis
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Case Details Modal */}
      <Modal
        title="Case Details"
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
                <Tag color="blue">Suggested: {selectedEncounter.procedures_suggested}</Tag>
                <Tag color="green">Accepted: {selectedEncounter.procedures_accepted}</Tag>
                <Tag color="orange">Modified: {selectedEncounter.procedures_modified}</Tag>
                <Tag color="red">Rejected: {selectedEncounter.procedures_rejected}</Tag>
              </Space>
            </Timeline.Item>
            {selectedEncounter.ai_suggestions.map((suggestion, index) => (
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
                    {formatDistanceToNow(new Date(suggestion.timestamp), { addSuffix: true })}
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

export default DoctorPortal; 