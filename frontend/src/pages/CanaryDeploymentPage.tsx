import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Modal, Form, Input, InputNumber, Select, Tag, message, Typography, Progress, Tooltip, Tabs } from 'antd';
import { Line } from '@ant-design/plots';
import { canaryService, CanaryStatus, CanaryConfig } from '../services/canaryService';
import { formatDistanceToNow } from 'date-fns';

const { Title } = Typography;
const { TabPane } = Tabs;

const CanaryDeploymentPage: React.FC = () => {
  const [canaries, setCanaries] = useState<CanaryStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCanaries();
    const interval = setInterval(fetchCanaries, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCanaries = async () => {
    try {
      setLoading(true);
      const data = await canaryService.getCanaries();
      setCanaries(data);
    } catch (error) {
      message.error('Failed to fetch canary deployments');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCanary = async (values: CanaryConfig) => {
    if (!selectedVersion) return;
    
    try {
      await canaryService.startCanary(selectedVersion, values);
      message.success('Canary deployment started successfully');
      setModalVisible(false);
      form.resetFields();
      fetchCanaries();
    } catch (error) {
      message.error('Failed to start canary deployment');
    }
  };

  const handlePromoteCanary = async (version: string) => {
    try {
      await canaryService.promoteCanary(version);
      message.success('Canary deployment promoted successfully');
      fetchCanaries();
    } catch (error) {
      message.error('Failed to promote canary deployment');
    }
  };

  const handleRollbackCanary = async (version: string) => {
    try {
      await canaryService.rollbackCanary(version, 'Manual rollback requested');
      message.success('Canary deployment rolled back successfully');
      fetchCanaries();
    } catch (error) {
      message.error('Failed to rollback canary deployment');
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
        const colors = {
          CANARY: 'orange',
          FULL: 'green',
          ROLLED_BACK: 'red',
          FAILED: 'red',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true }),
    },
    {
      title: 'Traffic',
      key: 'traffic',
      render: (_: any, record: CanaryStatus) => (
        <Progress
          percent={record.config.traffic_percentage}
          size="small"
          status={record.status === 'CANARY' ? 'active' : 'normal'}
        />
      ),
    },
    {
      title: 'Metrics',
      key: 'metrics',
      render: (_: any, record: CanaryStatus) => {
        if (!record.latest_metrics) return null;
        
        return (
          <Space direction="vertical" size="small">
            {Object.entries(record.latest_metrics.model_metrics).map(([key, value]) => (
              <div key={key}>
                <Tooltip title={`${key}: ${value.toFixed(2)}`}>
                  <Progress
                    percent={value * 100}
                    size="small"
                    status={value >= record.config.success_threshold ? 'success' : 'exception'}
                  />
                </Tooltip>
              </div>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CanaryStatus) => (
        <Space>
          {record.status === 'CANARY' && (
            <>
              <Button type="primary" onClick={() => handlePromoteCanary(record.version)}>
                Promote
              </Button>
              <Button danger onClick={() => handleRollbackCanary(record.version)}>
                Rollback
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const renderMetricsChart = (canary: CanaryStatus) => {
    if (!canary.latest_metrics) return null;
    
    const data = Object.entries(canary.latest_metrics.model_metrics).map(([key, value]) => ({
      metric: key,
      value: value * 100,
      threshold: canary.config.success_threshold * 100,
    }));
    
    return (
      <Line
        data={data}
        xField="metric"
        yField="value"
        seriesField="type"
        yAxis={{
          label: {
            formatter: (v) => `${v}%`,
          },
        }}
        annotations={[
          {
            type: 'line',
            start: ['min', canary.config.success_threshold * 100],
            end: ['max', canary.config.success_threshold * 100],
            style: {
              stroke: 'red',
              lineDash: [4, 4],
            },
            text: {
              content: 'Threshold',
              position: 'end',
              style: {
                fill: 'red',
              },
            },
          },
        ]}
      />
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Canary Deployments</Title>
      
      <Card>
        <Button
          type="primary"
          onClick={() => setModalVisible(true)}
          style={{ marginBottom: 16 }}
        >
          Start New Canary
        </Button>
        
        <Table
          columns={columns}
          dataSource={canaries}
          loading={loading}
          rowKey="version"
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '16px' }}>
                <Title level={5}>Metrics History</Title>
                {renderMetricsChart(record)}
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="Start Canary Deployment"
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStartCanary}
        >
          <Form.Item
            name="traffic_percentage"
            label="Traffic Percentage"
            rules={[{ required: true, message: 'Please input traffic percentage!' }]}
          >
            <InputNumber min={1} max={100} />
          </Form.Item>
          
          <Form.Item
            name="duration_minutes"
            label="Duration (minutes)"
            rules={[{ required: true, message: 'Please input duration!' }]}
          >
            <InputNumber min={1} />
          </Form.Item>
          
          <Form.Item
            name="success_threshold"
            label="Success Threshold"
            rules={[{ required: true, message: 'Please input success threshold!' }]}
          >
            <InputNumber min={0} max={1} step={0.01} />
          </Form.Item>
          
          <Form.Item
            name="metrics_to_monitor"
            label="Metrics to Monitor"
            rules={[{ required: true, message: 'Please select metrics!' }]}
          >
            <Select mode="multiple">
              <Select.Option value="accuracy">Accuracy</Select.Option>
              <Select.Option value="precision">Precision</Select.Option>
              <Select.Option value="recall">Recall</Select.Option>
              <Select.Option value="f1_score">F1 Score</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="max_error_rate"
            label="Max Error Rate"
            rules={[{ required: true, message: 'Please input max error rate!' }]}
          >
            <InputNumber min={0} max={1} step={0.01} />
          </Form.Item>
          
          <Form.Item
            name="min_requests"
            label="Minimum Requests"
            rules={[{ required: true, message: 'Please input minimum requests!' }]}
          >
            <InputNumber min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CanaryDeploymentPage; 