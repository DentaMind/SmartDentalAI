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
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <Sider width={200}>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
        onClick={({ key }) => navigate(key)}
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar; 