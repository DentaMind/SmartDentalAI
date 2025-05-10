import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Switch,
  Space,
  Typography,
  Alert,
  Divider,
  Button,
  Modal,
  Form,
  Select,
  message,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType, NotificationChannel } from '../../types/notifications';
import { UserRole } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const NotificationPreferencesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');
  const [globalSettingsModalVisible, setGlobalSettingsModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const {
    getNotificationPreferences,
    updateNotificationPreferences,
    getGlobalSettings,
    updateGlobalSettings,
  } = useNotifications();

  const { data: preferences, isLoading: preferencesLoading } = useQuery(
    ['notificationPreferences', user?.id],
    () => getNotificationPreferences(user?.id)
  );

  const { data: globalSettings, isLoading: globalSettingsLoading } = useQuery(
    ['globalNotificationSettings'],
    getGlobalSettings,
    {
      enabled: user?.role === UserRole.ADMIN,
    }
  );

  const updatePreferencesMutation = useMutation(
    (newPreferences: any) => updateNotificationPreferences(user?.id, newPreferences),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notificationPreferences']);
        message.success('Preferences updated successfully');
      },
      onError: (error: any) => {
        message.error(`Failed to update preferences: ${error.message}`);
      },
    }
  );

  const updateGlobalSettingsMutation = useMutation(
    (newSettings: any) => updateGlobalSettings(newSettings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['globalNotificationSettings']);
        message.success('Global settings updated successfully');
      },
      onError: (error: any) => {
        message.error(`Failed to update global settings: ${error.message}`);
      },
    }
  );

  const handlePreferenceChange = (type: NotificationType, field: string, value: boolean) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences.preferences };
    if (!updatedPreferences[type]) {
      updatedPreferences[type] = { enabled: true, channels: {} };
    }

    if (field === 'enabled') {
      updatedPreferences[type].enabled = value;
    } else {
      updatedPreferences[type].channels[field] = value;
    }

    updatePreferencesMutation.mutate(updatedPreferences);
  };

  const handleGlobalSettingsUpdate = (role: UserRole, type: NotificationType, value: boolean) => {
    if (!globalSettings) return;

    const updatedDefaults = { ...globalSettings.role_defaults };
    if (!updatedDefaults[role]) {
      updatedDefaults[role] = {};
    }
    if (!updatedDefaults[role][type]) {
      updatedDefaults[role][type] = { enabled: true, channels: {} };
    }

    updatedDefaults[role][type].enabled = value;
    updateGlobalSettingsMutation.mutate({ role_defaults: updatedDefaults });
  };

  const renderPreferenceRow = (type: NotificationType, preference: any, isLocked: boolean = false) => {
    const channels = Object.values(NotificationChannel);
    return (
      <div key={type} style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Switch
              checked={preference?.enabled}
              onChange={(checked) => handlePreferenceChange(type, 'enabled', checked)}
              disabled={isLocked}
            />
            <Text strong>{type.replace('_', ' ').toUpperCase()}</Text>
            {isLocked && <Text type="secondary">(Locked by admin)</Text>}
          </Space>
          {preference?.enabled && (
            <Space style={{ marginLeft: 24 }}>
              {channels.map((channel) => (
                <Switch
                  key={channel}
                  checked={preference?.channels?.[channel]}
                  onChange={(checked) => handlePreferenceChange(type, channel, checked)}
                  disabled={isLocked}
                >
                  {channel.replace('_', ' ').toUpperCase()}
                </Switch>
              ))}
            </Space>
          )}
        </Space>
      </div>
    );
  };

  const renderPersonalPreferences = () => (
    <Card>
      <Title level={3}>Personal Notification Preferences</Title>
      {!preferences?.can_customize && (
        <Alert
          message="Your role does not have permission to customize notification preferences"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {Object.entries(preferences?.preferences || {}).map(([type, preference]) => (
        renderPreferenceRow(
          type as NotificationType,
          preference,
          !preferences?.can_customize
        )
      ))}
    </Card>
  );

  const renderGlobalSettings = () => (
    <Card>
      <Title level={3}>Global Notification Settings</Title>
      <Alert
        message="Changes to global settings will affect all users of the selected role"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Space direction="vertical" style={{ width: '100%' }}>
        <Select
          placeholder="Select Role"
          style={{ width: 200 }}
          onChange={setSelectedRole}
          options={Object.values(UserRole).map(role => ({
            label: role.toUpperCase(),
            value: role,
          }))}
        />
        {selectedRole && globalSettings?.role_defaults[selectedRole] && (
          <>
            <Divider />
            {Object.entries(globalSettings.role_defaults[selectedRole]).map(([type, preference]) => (
              renderPreferenceRow(type as NotificationType, preference)
            ))}
          </>
        )}
      </Space>
    </Card>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Personal Preferences" key="personal">
          {renderPersonalPreferences()}
        </TabPane>
        {user?.role === UserRole.ADMIN && (
          <TabPane tab="Global Settings" key="global">
            {renderGlobalSettings()}
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default NotificationPreferencesPage; 