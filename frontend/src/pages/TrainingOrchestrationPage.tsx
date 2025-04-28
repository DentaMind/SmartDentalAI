import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  message,
  Switch,
  Typography,
  Tabs,
  Progress,
  Tooltip,
  Alert,
} from 'antd';
import { trainingService, TrainingSchedule, TrainingScheduleRequest, TrainingJob, ModelVersion } from '../services/trainingService';
import { PlusOutlined, DeleteOutlined, PlayCircleOutlined, StopOutlined, HistoryOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { formatDistanceToNow } from 'date-fns';

const { Title } = Typography;
const { TabPane } = Tabs;

const TrainingOrchestrationPage: React.FC = () => {
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [activeJobs, setActiveJobs] = useState<TrainingJob[]>([]);
  const [jobHistory, setJobHistory] = useState<TrainingJob[]>([]);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesData, activeJobsData, historyData, versionsData] = await Promise.all([
        trainingService.getSchedules(),
        trainingService.getActiveJobs(),
        trainingService.getJobHistory(),
        trainingService.getVersions()
      ]);
      setSchedules(schedulesData);
      setActiveJobs(activeJobsData);
      setJobHistory(historyData);
      setVersions(versionsData);
    } catch (error) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async (values: TrainingScheduleRequest) => {
    try {
      await trainingService.addSchedule(values);
      message.success('Schedule added successfully');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Failed to add schedule');
    }
  };

  const handleToggleSchedule = async (name: string) => {
    try {
      await trainingService.toggleSchedule(name);
      message.success('Schedule toggled successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to toggle schedule');
    }
  };

  const handleDeleteSchedule = async (name: string) => {
    try {
      await trainingService.deleteSchedule(name);
      message.success('Schedule deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete schedule');
    }
  };

  const handleTriggerSchedule = async (name: string) => {
    try {
      await trainingService.triggerSchedule(name);
      message.success('Schedule triggered successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to trigger schedule');
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await trainingService.cancelJob(jobId);
      message.success('Job cancelled successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to cancel job');
    }
  };

  const handleRollbackVersion = async (version: string) => {
    try {
      await trainingService.rollbackVersion(version, 'Manual rollback requested');
      message.success('Version rolled back successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to rollback version');
    }
  };

  const scheduleColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={
          priority === 'URGENT' ? 'red' :
          priority === 'HIGH' ? 'orange' :
          priority === 'MEDIUM' ? 'blue' : 'green'
        }>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Next Run',
      dataIndex: 'next_run',
      key: 'next_run',
    },
    {
      title: 'Last Run',
      dataIndex: 'last_run',
      key: 'last_run',
    },
    {
      title: 'Interval (days)',
      dataIndex: 'interval_days',
      key: 'interval_days',
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: TrainingSchedule) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleSchedule(record.name)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TrainingSchedule) => (
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleTriggerSchedule(record.name)}
          >
            Trigger
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSchedule(record.name)}
          />
        </Space>
      ),
    },
  ];

  const activeJobColumns = [
    {
      title: 'Schedule',
      dataIndex: 'schedule_name',
      key: 'schedule_name',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={
          priority === 'URGENT' ? 'red' :
          priority === 'HIGH' ? 'orange' :
          priority === 'MEDIUM' ? 'blue' : 'green'
        }>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'RUNNING' ? 'blue' :
          status === 'PENDING' ? 'orange' : 'green'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Resource Usage',
      key: 'resource_usage',
      render: (_: any, record: TrainingJob) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Tooltip title={`CPU: ${record.resource_usage.cpu_percent}%`}>
            <Progress percent={record.resource_usage.cpu_percent} size="small" />
          </Tooltip>
          <Tooltip title={`Memory: ${record.resource_usage.memory_percent}%`}>
            <Progress percent={record.resource_usage.memory_percent} size="small" />
          </Tooltip>
          <Tooltip title={`GPU: ${record.resource_usage.gpu_memory_percent}%`}>
            <Progress percent={record.resource_usage.gpu_memory_percent} size="small" />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TrainingJob) => (
        <Button
          danger
          icon={<StopOutlined />}
          onClick={() => handleCancelJob(record.schedule_name)}
        >
          Cancel
        </Button>
      ),
    },
  ];

  const jobHistoryColumns = [
    {
      title: 'Schedule',
      dataIndex: 'schedule_name',
      key: 'schedule_name',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={
          priority === 'URGENT' ? 'red' :
          priority === 'HIGH' ? 'orange' :
          priority === 'MEDIUM' ? 'blue' : 'green'
        }>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'COMPLETED' ? 'green' :
          status === 'FAILED' ? 'red' :
          status === 'CANCELLED' ? 'orange' : 'blue'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Metrics',
      key: 'metrics',
      render: (_: any, record: TrainingJob) => (
        <Space direction="vertical">
          {Object.entries(record.metrics).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {value.toFixed(3)}
            </div>
          ))}
        </Space>
      ),
    },
  ];

  const versionColumns = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Status',
      dataIndex: 'deployment_status',
      key: 'deployment_status',
      render: (status: string) => {
        const colors = {
          DEPLOYED: 'green',
          PENDING: 'orange',
          FAILED: 'red',
          ROLLED_BACK: 'red',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true }),
    },
    {
      title: 'Deployed',
      dataIndex: 'deployed_at',
      key: 'deployed_at',
      render: (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true }),
    },
    {
      title: 'Metrics',
      key: 'metrics',
      render: (_: any, record: ModelVersion) => (
        <Space direction="vertical" size="small">
          {Object.entries(record.metrics).map(([key, value]) => (
            <div key={key}>{key}: {value.toFixed(2)}</div>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ModelVersion) => (
        <Button danger onClick={() => handleRollbackVersion(record.version)}>Rollback</Button>
      ),
    },
  ];

  const renderPerformanceChart = (schedule: TrainingSchedule) => {
    if (!schedule.performance_history || schedule.performance_history.length === 0) {
      return <Alert message="No performance data available" type="info" />;
    }

    const data = schedule.performance_history.map(entry => ({
      timestamp: new Date(entry.timestamp).getTime(),
      ...entry.metrics
    }));

    return (
      <Line
        data={data}
        xField="timestamp"
        yField="accuracy"
        seriesField="type"
        xAxis={{
          type: 'time',
          label: {
            formatter: (v) => new Date(v).toLocaleDateString()
          }
        }}
        yAxis={{
          label: {
            formatter: (v) => `${(v * 100).toFixed(1)}%`
          }
        }}
        tooltip={{
          formatter: (datum) => {
            return {
              name: 'Accuracy',
              value: `${(datum.accuracy * 100).toFixed(1)}%`
            };
          }
        }}
      />
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Tabs defaultActiveKey="schedules">
        <TabPane tab="Training Schedules" key="schedules">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Title level={4}>Training Schedules</Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                Add Schedule
              </Button>
            </div>

            <Table
              columns={scheduleColumns}
              dataSource={schedules}
              loading={loading}
              rowKey="name"
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px' }}>
                    <Title level={5}>Performance History</Title>
                    {renderPerformanceChart(record)}
                  </div>
                )
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Active Jobs" key="active">
          <Card>
            <Title level={4}>Active Training Jobs</Title>
            <Table
              columns={activeJobColumns}
              dataSource={activeJobs}
              loading={loading}
              rowKey="schedule_name"
            />
          </Card>
        </TabPane>

        <TabPane tab="Job History" key="history">
          <Card>
            <Title level={4}>Training Job History</Title>
            <Table
              columns={jobHistoryColumns}
              dataSource={jobHistory}
              loading={loading}
              rowKey="start_time"
            />
          </Card>
        </TabPane>

        <TabPane tab="Model Versions" key="versions">
          <Card>
            <Table
              columns={versionColumns}
              dataSource={versions}
              loading={loading}
              rowKey="version"
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="Add Training Schedule"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddSchedule}
        >
          <Form.Item
            name="name"
            label="Schedule Name"
            rules={[{ required: true, message: 'Please input schedule name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority!' }]}
          >
            <Select>
              <Select.Option value="URGENT">Urgent</Select.Option>
              <Select.Option value="HIGH">High</Select.Option>
              <Select.Option value="MEDIUM">Medium</Select.Option>
              <Select.Option value="LOW">Low</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="interval_days"
            label="Interval (days)"
            rules={[{ required: true, message: 'Please input interval!' }]}
          >
            <InputNumber min={1} />
          </Form.Item>

          <Form.Item
            name="resource_allocation"
            label="Resource Allocation"
          >
            <Form.List name="resource_allocation">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'resource']}
                        rules={[{ required: true, message: 'Missing resource name' }]}
                      >
                        <Select style={{ width: 120 }}>
                          <Select.Option value="cpu_cores">CPU Cores</Select.Option>
                          <Select.Option value="memory_gb">Memory (GB)</Select.Option>
                          <Select.Option value="gpu_memory_gb">GPU Memory (GB)</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'value']}
                        rules={[{ required: true, message: 'Missing value' }]}
                      >
                        <InputNumber min={1} placeholder="Value" />
                      </Form.Item>
                      <Button onClick={() => remove(field.name)}>Remove</Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    Add Resource
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item
            name="metrics_threshold"
            label="Metrics Threshold"
            rules={[{ required: true, message: 'Please input metrics threshold!' }]}
          >
            <Form.List name="metrics_threshold">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'metric']}
                        rules={[{ required: true, message: 'Missing metric name' }]}
                      >
                        <Input placeholder="Metric name" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'value']}
                        rules={[{ required: true, message: 'Missing threshold value' }]}
                      >
                        <InputNumber min={0} max={1} step={0.01} placeholder="Threshold" />
                      </Form.Item>
                      <Button onClick={() => remove(field.name)}>Remove</Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    Add Metric Threshold
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TrainingOrchestrationPage; 