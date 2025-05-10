import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Tag, Space, Input } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { AIModelService } from '@/services/ai-model';

interface ModelVersion {
  version: string;
  status: 'ready' | 'deployed' | 'archived';
  accuracy: number;
  trainedAt: string;
  deployedAt?: string;
  deployedBy?: string;
}

export const AIModelManager: React.FC = () => {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai-model/versions');
      const data = await res.json();
      setVersions(data);
    } catch (error) {
      message.error('Failed to fetch model versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const confirmDeploy = (version: string) => {
    let reason = '';
    Modal.confirm({
      title: `Deploy ${version}?`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>This will make this model version live and archive the current one.</p>
          <Input.TextArea
            placeholder="Reason for deployment (optional)"
            onChange={(e) => (reason = e.target.value)}
            rows={3}
          />
        </div>
      ),
      okText: 'Deploy',
      cancelText: 'Cancel',
      onOk: () => handleDeploy(version, reason),
    });
  };

  const confirmRollback = (version: string) => {
    let reason = '';
    Modal.confirm({
      title: `Rollback to ${version}?`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>This will replace the current live model with this archived version.</p>
          <Input.TextArea
            placeholder="Reason for rollback (optional)"
            onChange={(e) => (reason = e.target.value)}
            rows={3}
          />
        </div>
      ),
      okText: 'Rollback',
      cancelText: 'Cancel',
      onOk: () => handleRollback(version, reason),
    });
  };

  const handleDeploy = async (version: string, notes?: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-model/deploy/${version}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      message.success(data.message);
      fetchVersions();
    } catch (error) {
      message.error('Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (version: string, notes?: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-model/rollback/${version}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      message.success(data.message);
      fetchVersions();
    } catch (error) {
      message.error('Rollback failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'deployed' ? 'green' : status === 'ready' ? 'blue' : 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Accuracy',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (accuracy: number) => `${(accuracy * 100).toFixed(2)}%`,
    },
    {
      title: 'Trained At',
      dataIndex: 'trainedAt',
      key: 'trainedAt',
    },
    {
      title: 'Deployed At',
      dataIndex: 'deployedAt',
      key: 'deployedAt',
    },
    {
      title: 'Deployed By',
      dataIndex: 'deployedBy',
      key: 'deployedBy',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ModelVersion) => (
        <Space>
          {record.status === 'ready' && (
            <Button type="primary" onClick={() => confirmDeploy(record.version)}>
              Promote
            </Button>
          )}
          {record.status === 'archived' && (
            <Button danger onClick={() => confirmRollback(record.version)}>
              Rollback
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={versions}
        rowKey="version"
        loading={loading}
        pagination={false}
      />
    </div>
  );
}; 