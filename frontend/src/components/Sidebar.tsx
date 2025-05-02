import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  FileTextOutlined,
  SafetyOutlined,
  DashboardOutlined,
  DesktopOutlined,
  BarChartOutlined,
  LineChartOutlined,
  RobotOutlined,
  ControlOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  InsuranceOutlined,
  SettingOutlined,
  ApiOutlined,
  TeamOutlined,
  CalendarOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    },
    {
      key: '/patients',
      icon: <UserOutlined />,
      label: 'Patients'
    },
    {
      key: '/risk-evaluation',
      icon: <LineChartOutlined />,
      label: 'Risk Evaluation'
    },
    {
      key: '/system-health',
      icon: <DesktopOutlined />,
      label: 'System Health'
    },
    {
      key: '/metrics-analysis',
      icon: <BarChartOutlined />,
      label: 'Metrics Analysis'
    },
    {
      key: '/ai-ops',
      icon: <RobotOutlined />,
      label: 'AI Ops Dashboard'
    },
    {
      key: '/training-orchestration',
      icon: <ControlOutlined />,
      label: 'Training Orchestration'
    },
    {
      key: '/canary-deployment',
      icon: <ExperimentOutlined />,
      label: 'Canary Deployment'
    },
    {
      key: '/treatment-plans',
      icon: <FileTextOutlined />,
      label: 'Treatment Plans'
    },
    {
      key: '/financial-arrangements',
      icon: <DollarOutlined />,
      label: 'Financial Arrangements'
    },
    {
      key: '/claims',
      icon: <InsuranceOutlined />,
      label: 'Insurance Claims'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings'
    }
  ];
  
  // Add admin-only items
  if (user?.role === 'admin') {
    menuItems.push({
      key: '/admin/audit-logs',
      icon: <AuditOutlined />,
      label: 'Audit Logs'
    });
    
    menuItems.push({
      key: '/admin/websocket-analytics',
      icon: <ApiOutlined />,
      label: 'WebSocket Analytics'
    });
    
    menuItems.push({
      key: '/admin/ai-diagnostics-analytics',
      icon: <ExperimentOutlined />,
      label: 'AI Diagnostics'
    });
  }

  return (
    <Sider
      width={200}
      theme="light"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
      }}
    >
      <div style={{ height: 32, margin: 16, background: 'rgba(0, 0, 0, 0.05)' }} />
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: '90%', borderRight: 0 }}
        onClick={({ key }) => navigate(key)}
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar; 