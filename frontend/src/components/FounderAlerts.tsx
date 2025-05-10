import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Alert, Spin, Modal, message } from 'antd';
import { getFounderAlerts, acknowledgeAlert, resolveAlert } from '../api/founder';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const FounderAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getFounderAlerts();
        setAlerts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
        return <ExclamationCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const getAlertStatus = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="red">Active</Tag>;
      case 'acknowledged':
        return <Tag color="orange">Acknowledged</Tag>;
      case 'resolved':
        return <Tag color="green">Resolved</Tag>;
      default:
        return null;
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      message.success('Alert acknowledged');
      const updatedAlerts = alerts.map(alert =>
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
      );
      setAlerts(updatedAlerts);
    } catch (err) {
      message.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      message.success('Alert resolved');
      const updatedAlerts = alerts.map(alert =>
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      );
      setAlerts(updatedAlerts);
    } catch (err) {
      message.error('Failed to resolve alert');
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getAlertIcon(type),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => <Tag>{source}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getAlertStatus(status),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setSelectedAlert(record);
              setModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'active' && (
            <Button
              type="link"
              onClick={() => handleAcknowledge(record.id)}
            >
              Acknowledge
            </Button>
          )}
          {record.status === 'acknowledged' && (
            <Button
              type="link"
              onClick={() => handleResolve(record.id)}
            >
              Resolve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <Spin size="large" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert message="Error" description={error} type="error" showIcon />
      </Card>
    );
  }

  return (
    <Card title="Founder Alerts">
      <Table
        columns={columns}
        dataSource={alerts}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Alert Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {selectedAlert && (
          <div>
            <p><strong>Title:</strong> {selectedAlert.title}</p>
            <p><strong>Message:</strong> {selectedAlert.message}</p>
            <p><strong>Type:</strong> {selectedAlert.type}</p>
            <p><strong>Source:</strong> {selectedAlert.source}</p>
            <p><strong>Status:</strong> {getAlertStatus(selectedAlert.status)}</p>
            <p><strong>Timestamp:</strong> {new Date(selectedAlert.timestamp).toLocaleString()}</p>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default FounderAlerts; 