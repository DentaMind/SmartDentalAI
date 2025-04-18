import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Space, Tag, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

interface FeedbackItem {
  id: number;
  practiceId: number;
  doctorId: number;
  patientId: number;
  formId: number;
  originalAiResult: any;
  overrideData: any;
  overrideType: string;
  overrideReason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const AIFeedbackAdmin: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ai-feedback/pending');
      setFeedback(response.data);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      message.error('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      setLoading(true);
      await axios.post(`/api/ai-feedback/${id}/approve`);
      message.success('Feedback approved successfully');
      fetchFeedback();
    } catch (error) {
      console.error('Failed to approve feedback:', error);
      message.error('Failed to approve feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setLoading(true);
      await axios.post(`/api/ai-feedback/${id}/reject`);
      message.success('Feedback rejected successfully');
      fetchFeedback();
    } catch (error) {
      console.error('Failed to reject feedback:', error);
      message.error('Failed to reject feedback');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Override Type',
      dataIndex: 'overrideType',
      key: 'overrideType',
      render: (type: string) => (
        <Tag color={type === 'risk_level' ? 'red' : type === 'symptoms' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'pending' ? 'orange' : status === 'approved' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: FeedbackItem) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(record.id)}
            disabled={record.status !== 'pending'}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleReject(record.id)}
            disabled={record.status !== 'pending'}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={4}>AI Feedback Management</Title>
      <Table
        columns={columns}
        dataSource={feedback}
        rowKey="id"
        loading={loading}
        expandable={{
          expandedRowRender: (record) => (
            <div>
              <p><strong>Original AI Result:</strong> {JSON.stringify(record.originalAiResult)}</p>
              <p><strong>Override Data:</strong> {JSON.stringify(record.overrideData)}</p>
              <p><strong>Reason:</strong> {record.overrideReason}</p>
            </div>
          ),
        }}
      />
    </Card>
  );
}; 