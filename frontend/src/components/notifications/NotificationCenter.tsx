import React, { useState } from 'react';
import {
  Badge,
  Dropdown,
  Menu,
  Space,
  Tag,
  Typography,
  Button,
  Modal,
  Switch,
  Select,
  Divider,
} from 'antd';
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../types/notifications';
import { formatDistanceToNow } from 'date-fns';
import './NotificationCenter.css';

const { Text } = Typography;

const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    settings,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    updateSettings,
    getNotifications,
  } = useNotifications();

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | null>(null);
  const [grouped, setGrouped] = useState(false);

  const filteredNotifications = getNotifications({
    type: typeFilter,
    priority: priorityFilter,
    grouped,
  });

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

  const renderNotificationItem = (notification: any) => (
    <Menu.Item key={notification.id} className="notification-item">
      <Space direction="vertical" size={4}>
        <Space>
          <Tag color={getNotificationColor(notification.type)}>
            {notification.type.replace('_', ' ').toUpperCase()}
          </Tag>
          {!notification.read && <Badge status="processing" />}
        </Space>
        <Text strong>{notification.title}</Text>
        <Text type="secondary">{notification.message}</Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </Text>
        <Space>
          {!notification.read && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => markAsRead(notification.id)}
            >
              Mark as read
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => dismissNotification(notification.id)}
          >
            Dismiss
          </Button>
        </Space>
      </Space>
    </Menu.Item>
  );

  const renderGroupedNotifications = (group: any) => (
    <Menu.ItemGroup key={group.id} title={
      <Space>
        <Tag color={getNotificationColor(group.type)}>
          {group.type.replace('_', ' ').toUpperCase()}
        </Tag>
        <Badge count={group.count} />
      </Space>
    }>
      {group.notifications.map(renderNotificationItem)}
    </Menu.ItemGroup>
  );

  const menu = (
    <Menu>
      <Menu.Item key="header" className="notification-header">
        <Space>
          <Text strong>Notifications</Text>
          {unreadCount > 0 && (
            <Button type="link" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Space>
      </Menu.Item>
      
      <Divider style={{ margin: '8px 0' }} />
      
      <Menu.Item key="filters" className="notification-filters">
        <Space>
          <Select
            placeholder="Filter by Type"
            style={{ width: 150 }}
            allowClear
            onChange={setTypeFilter}
            options={Object.values(NotificationType).map(type => ({
              label: type.replace('_', ' ').toUpperCase(),
              value: type,
            }))}
          />
          <Select
            placeholder="Filter by Priority"
            style={{ width: 150 }}
            allowClear
            onChange={setPriorityFilter}
            options={Object.values(NotificationPriority).map(priority => ({
              label: priority.toUpperCase(),
              value: priority,
            }))}
          />
          <Button
            type={grouped ? 'primary' : 'default'}
            onClick={() => setGrouped(!grouped)}
            icon={<FilterOutlined />}
          >
            {grouped ? 'Ungroup' : 'Group'}
          </Button>
        </Space>
      </Menu.Item>
      
      <Divider style={{ margin: '8px 0' }} />
      
      {filteredNotifications.length === 0 ? (
        <Menu.Item key="empty" disabled>
          No notifications
        </Menu.Item>
      ) : grouped ? (
        filteredNotifications.map(renderGroupedNotifications)
      ) : (
        filteredNotifications.map(renderNotificationItem)
      )}
      
      <Divider style={{ margin: '8px 0' }} />
      
      <Menu.Item key="settings" onClick={() => setSettingsModalVisible(true)}>
        Notification Settings
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Dropdown
        overlay={menu}
        trigger={['click']}
        placement="bottomRight"
        overlayClassName="notification-dropdown"
      >
        <Badge count={unreadCount} offset={[-5, 5]}>
          <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
        </Badge>
      </Dropdown>

      <Modal
        title="Notification Settings"
        visible={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Desktop Notifications</Text>
            <Switch
              checked={settings.desktopNotifications}
              onChange={(checked) =>
                updateSettings({ ...settings, desktopNotifications: checked })
              }
            />
          </div>
          <div>
            <Text strong>Email Notifications</Text>
            <Switch
              checked={settings.emailNotifications}
              onChange={(checked) =>
                updateSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default NotificationCenter; 