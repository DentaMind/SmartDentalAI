import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
  Assessment as AuditIcon,
  Speed as SpeedIcon,
  Psychology as AiIcon,
  BiotechOutlined as BrainIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/user';
import { 
  User, 
  Calendar, 
  FileText, 
  DollarSign, 
  Settings,
  Users,
  Activity,
  Brain,
  Home
} from 'lucide-react';

const Navigation: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
    },
    {
      text: 'Patients',
      icon: <PeopleIcon />,
      path: '/patients',
    },
    {
      text: 'Appointments',
      icon: <CalendarIcon />,
      path: '/appointments',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  // Add audit logs menu item for admin users
  if (user?.role === UserRole.ADMIN) {
    menuItems.push({
      text: 'Audit Logs',
      icon: <AuditIcon />,
      path: '/audit-logs',
    });
    menuItems.push({
      text: 'WebSocket Analytics',
      icon: <SpeedIcon />,
      path: '/admin/websocket-analytics',
    });
    menuItems.push({
      text: 'AI Diagnostics Analytics',
      icon: <AiIcon />,
      path: '/admin/ai-diagnostics-analytics',
    });
    menuItems.push({
      text: 'AI Model Training',
      icon: <BrainIcon />,
      path: '/admin/ai-model-training',
    });
  }

  menuItems.push({
    text: 'AI Diagnostics',
    icon: <AiIcon />,
    path: '/ai-diagnostics',
  });

  menuItems.push({
    text: 'AI Treatment Suggestions',
    icon: <LightbulbIcon />,
    path: '/ai-treatment-suggestions',
  });

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={true}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Typography variant="h6">SmartDentalAI</Typography>
      </Box>
      <Divider />
      <List>
        <li>
          <Link
            to="/"
            className={`flex items-center p-2 rounded-md transition-colors ${
              isActive('/') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Home className="h-5 w-5" />
            {!isMobile && <span className="ml-3">Dashboard</span>}
          </Link>
        </li>
        <li>
          <Link
            to="/patients"
            className={`flex items-center p-2 rounded-md transition-colors ${
              isActive('/patients') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Users className="h-5 w-5" />
            {!isMobile && <span className="ml-3">Patients</span>}
          </Link>
        </li>
        <li>
          <Link
            to="/schedule"
            className={`flex items-center p-2 rounded-md transition-colors ${
              isActive('/schedule') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Calendar className="h-5 w-5" />
            {!isMobile && <span className="ml-3">Schedule</span>}
          </Link>
        </li>
        <li>
          <Link
            to="/treatments"
            className={`flex items-center p-2 rounded-md transition-colors ${
              isActive('/treatments') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <FileText className="h-5 w-5" />
            {!isMobile && <span className="ml-3">Treatments</span>}
          </Link>
        </li>
        <li>
          <Link
            to="/finances"
            className={`flex items-center p-2 rounded-md transition-colors ${
              isActive('/finances') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <DollarSign className="h-5 w-5" />
            {!isMobile && <span className="ml-3">Finances</span>}
          </Link>
        </li>
        {menuItems.map((item) => (
          <ListItem
            button
            component={Link}
            to={item.path}
            key={item.text}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.light,
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === item.path
                  ? theme.palette.primary.main
                  : theme.palette.text.primary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <li>
          <Link
            to="/ai-diagnostics"
            className={`flex items-center p-2 rounded-md transition-colors ${
              isActive('/ai-diagnostics') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Activity className="h-5 w-5" />
            {!isMobile && <span className="ml-3">AI Diagnostics</span>}
          </Link>
        </li>
        <li>
          <Link
            to="/ai-training"
            className={`flex items-center p-2 rounded-md transition-colors ${
              isActive('/ai-training') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Brain className="h-5 w-5" />
            {!isMobile && <span className="ml-3">AI Training</span>}
          </Link>
        </li>
      </List>
      <Divider />
      <List>
        <li>
          <Link
            to="/settings"
            className={`flex items-center p-2 rounded-md transition-colors ${
              isActive('/settings') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Settings className="h-5 w-5" />
            {!isMobile && <span className="ml-3">Settings</span>}
          </Link>
        </li>
        <li>
          <Link
            to="/profile"
            className={`flex items-center p-2 rounded-md transition-colors ${
              isActive('/profile') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <User className="h-5 w-5" />
            {!isMobile && <span className="ml-3">Profile</span>}
          </Link>
        </li>
      </List>
    </Drawer>
  );
};

export default Navigation; 