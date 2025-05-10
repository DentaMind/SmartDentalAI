import React from 'react';
import { Layout, Menu, Button, Space } from 'antd';
import { 
  UserOutlined, 
  FileOutlined, 
  HistoryOutlined,
  PlusOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Sider } = Layout;

interface PatientSidebarProps {
  patientId: string;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  patientId,
  collapsed,
  onCollapse
}) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'overview',
      icon: <UserOutlined />,
      label: 'Overview',
      onClick: () => navigate(`/patient/${patientId}`)
    },
    {
      key: 'records',
      icon: <FileOutlined />,
      label: 'Records',
      onClick: () => navigate(`/patient/${patientId}/records`)
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: 'History',
      onClick: () => navigate(`/patient/${patientId}/history`)
    }
  ];

  const actionButtons = [
    {
      key: 'new-case',
      icon: <PlusOutlined />,
      label: 'New Case',
      onClick: () => navigate(`/patient/${patientId}/new-case`)
    },
    {
      key: 'load-case',
      icon: <FolderOpenOutlined />,
      label: 'Load Case',
      onClick: () => navigate(`/patient/${patientId}/cases`)
    }
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={200}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0
      }}
    >
      <div style={{ padding: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {actionButtons.map(button => (
            <Button
              key={button.key}
              type="primary"
              icon={button.icon}
              onClick={button.onClick}
              style={{ width: '100%', marginBottom: '8px' }}
            >
              {!collapsed && button.label}
            </Button>
          ))}
        </Space>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        items={menuItems}
      />
    </Sider>
  );
}; 