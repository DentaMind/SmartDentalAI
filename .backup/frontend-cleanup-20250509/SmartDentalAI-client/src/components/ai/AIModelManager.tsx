import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  message,
  Modal,
} from 'antd';
import { SyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface ModelVersion {
  version: string;
  status: 'training' | 'ready' | 'deployed' | 'archived';
  training_data: {
    feedbackIds: number[];
    metrics: {
      accuracy: number;
      precision: number;
      recall: number;
    };
  };
  deployed_at?: string;
  deployed_by?: number;
  created_at: string;
  updated_at: string;
}

export const AIModelManager: React.FC = () => {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai-model/versions');
      const data = await res.json();
      setVersions(data.versions);
      setCurrentVersion(data.currentVersion);
    } catch (err) {
      console.error(err);
      message.error('Failed to load model versions');
    } finally {
      setLoading(false);
    }
  };

  const triggerTraining = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai-model/train', { method: 'POST' });
      const data = await res.json();
      message.success(data.message);
      fetchVersions();
    } catch {
      message.error('Training failed');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeploy = (version: string) => {
    Modal.confirm({
      title: `Deploy version ${version}?`,
      icon: <ExclamationCircleOutlined />,
      content: 'This will make the version live across all AI systems.',
      okText: 'Deploy',
      cancelText: 'Cancel',
      onOk: () => handleDeploy(version),
    });
  };

  const handleDeploy = async (version: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-model/deploy/${version}`, {
        method: 'POST',
      });
      const data = await res.json();
      message.success(data.message);
      fetchVersions();
    } catch {
      message.error('Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  return (
    <Card
      title={<Title level={4}>AI Model Version Manager</Title>}
      extra={
        <Button
          type="primary"
          icon={<SyncOutlined />}
          loading={loading}
          onClick={triggerTraining}
        >
          Train New Version
        </Button>
      }
    >
      <Table<ModelVersion>
        rowKey="version"
        loading={loading}
        dataSource={versions}
        pagination={{ pageSize: 5 }}
        columns={[
          {
            title: 'Version',
            dataIndex: 'version',
            key: 'version',
            render: (v: string) =>
              v === currentVersion ? (
                <Tag color="green">{v} (Live)</Tag>
              ) : (
                <Tag>{v}</Tag>
              ),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
              const color =
                status === 'deployed'
                  ? 'green'
                  : status === 'ready'
                  ? 'blue'
                  : status === 'training'
                  ? 'orange'
                  : 'default';
              return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
          },
          {
            title: 'Samples',
            render: (_, r) => r.training_data?.feedbackIds?.length ?? 0,
          },
          {
            title: 'Accuracy',
            render: (_, r) =>
              `${(r.training_data?.metrics?.accuracy * 100).toFixed(1)}%`,
          },
          {
            title: 'Precision',
            render: (_, r) =>
              `${(r.training_data?.metrics?.precision * 100).toFixed(1)}%`,
          },
          {
            title: 'Recall',
            render: (_, r) =>
              `${(r.training_data?.metrics?.recall * 100).toFixed(1)}%`,
          },
          {
            title: 'Created',
            dataIndex: 'created_at',
            render: (d: string) => new Date(d).toLocaleString(),
          },
          {
            title: 'Actions',
            render: (_, r) =>
              r.status === 'ready' && r.version !== currentVersion ? (
                <Button type="primary" onClick={() => confirmDeploy(r.version)}>
                  Deploy
                </Button>
              ) : null,
          },
        ]}
      />
    </Card>
  );
}; 