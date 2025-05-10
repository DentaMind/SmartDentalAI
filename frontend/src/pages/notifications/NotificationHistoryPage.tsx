import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Select,
  DatePicker,
  Typography,
  Button,
  Badge,
  Tooltip,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../types/notifications';
import { formatDistanceToNow } from 'date-fns';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const NotificationHistoryPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [grouped, setGrouped] = useState(false);

  const { getNotificationHistory } = useNotifications();

  const { data: notifications, isLoading } = useQuery(
    ['notificationHistory', typeFilter, priorityFilter, dateRange],
    () => getNotificationHistory({
      type: typeFilter,
      priority: priorityFilter,
      startDate: dateRange?.[0],
      endDate: dateRange?.[1],
    })
  );

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: NotificationType) => (
        <Tag color={getNotificationColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: NotificationPriority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </Tooltip>
      ),
    },
  ];

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CLAIM_SUBMITTED:
        return 'blue';
      case NotificationType.CLAIM_DENIED:
        return 'red';
      case NotificationType.PAYMENT_RECEIVED:
        return 'green';
      case NotificationType.APPEAL_SUBMITTED:
        return 'orange';
      case NotificationType.SYSTEM_ALERT:
        return 'purple';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.LOW:
        return 'gray';
      case NotificationPriority.MEDIUM:
        return 'blue';
      case NotificationPriority.HIGH:
        return 'orange';
      case NotificationPriority.CRITICAL:
        return 'red';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Notification History</Title>
        
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="Filter by Type"
            style={{ width: 200 }}
            allowClear
            onChange={setTypeFilter}
            options={Object.values(NotificationType).map(type => ({
              label: type.replace('_', ' ').toUpperCase(),
              value: type,
            }))}
          />
          
          <Select
            placeholder="Filter by Priority"
            style={{ width: 200 }}
            allowClear
            onChange={setPriorityFilter}
            options={Object.values(NotificationPriority).map(priority => ({
              label: priority.toUpperCase(),
              value: priority,
            }))}
          />
          
          <RangePicker
            onChange={(dates) => setDateRange(dates as [Date, Date])}
            style={{ width: 300 }}
          />
          
          <Button
            type={grouped ? 'primary' : 'default'}
            onClick={() => setGrouped(!grouped)}
          >
            {grouped ? 'Ungroup' : 'Group by Type'}
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={notifications}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} notifications`,
          }}
        />
      </Card>
    </div>
  );
};

export default NotificationHistoryPage; 