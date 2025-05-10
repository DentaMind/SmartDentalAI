import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  CalendarToday as CalendarIcon,
  Healing as HealingIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

const AdminNavigation: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <List component="nav" aria-label="admin navigation">
        <ListItem 
          button 
          component={RouterLink} 
          to="/admin/dashboard"
          selected={isActive('/admin/dashboard')}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        
        <ListItem 
          button 
          component={RouterLink} 
          to="/admin/patients"
          selected={isActive('/admin/patients')}
        >
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Patients" />
        </ListItem>
        
        <ListItem 
          button 
          component={RouterLink} 
          to="/admin/appointments"
          selected={isActive('/admin/appointments')}
        >
          <ListItemIcon>
            <CalendarIcon />
          </ListItemIcon>
          <ListItemText primary="Appointments" />
        </ListItem>
        
        <ListItem 
          button 
          component={RouterLink} 
          to="/admin/treatments"
          selected={isActive('/admin/treatments')}
        >
          <ListItemIcon>
            <HealingIcon />
          </ListItemIcon>
          <ListItemText primary="Treatments" />
        </ListItem>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 2, py: 1, display: 'block' }}
        >
          Administration
        </Typography>
        
        <ListItem 
          button 
          component={RouterLink} 
          to="/admin/reports"
          selected={isActive('/admin/reports')}
        >
          <ListItemIcon>
            <AnalyticsIcon />
          </ListItemIcon>
          <ListItemText primary="Reports" />
        </ListItem>
        
        <ListItem 
          button 
          component={RouterLink} 
          to="/admin/notifications"
          selected={isActive('/admin/notifications')}
        >
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText primary="Notifications" />
        </ListItem>
        
        <ListItem 
          button 
          component={RouterLink} 
          to="/admin/security"
          selected={isActive('/admin/security')}
          sx={{ 
            color: 'error.main',
            '& .MuiListItemIcon-root': { color: 'error.main' },
            bgcolor: isActive('/admin/security') ? 'error.light' : 'transparent',
            '&.Mui-selected': { bgcolor: 'error.light' },
            '&:hover': { bgcolor: 'error.50' }
          }}
        >
          <ListItemIcon>
            <SecurityIcon />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <span>Security Alerts</span>
              </Box>
            } 
          />
        </ListItem>
        
        <ListItem 
          button 
          component={RouterLink} 
          to="/admin/data"
          selected={isActive('/admin/data')}
        >
          <ListItemIcon>
            <StorageIcon />
          </ListItemIcon>
          <ListItemText primary="Data Management" />
        </ListItem>
        
        <ListItem 
          button 
          component={RouterLink} 
          to="/admin/settings"
          selected={isActive('/admin/settings')}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </Box>
  );
};

export default AdminNavigation; 