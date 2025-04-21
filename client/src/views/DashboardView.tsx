import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PatientIcon,
  Event as AppointmentIcon,
  Psychology as AIIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { BRANDING } from '../constants/branding';

interface DashboardViewProps {
  onAIAssistantOpen: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onAIAssistantOpen,
}) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const menuItems = [
    { icon: <DashboardIcon />, text: 'Dashboard', action: () => {} },
    { icon: <PatientIcon />, text: 'Patients', action: () => {} },
    { icon: <AppointmentIcon />, text: 'Appointments', action: () => {} },
    { icon: <AIIcon />, text: 'AI Assistant', action: onAIAssistantOpen },
    { icon: <SettingsIcon />, text: 'Settings', action: () => {} },
  ];

  const drawer = (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      PaperProps={{
        sx: {
          width: 240,
          backgroundColor: BRANDING.colors.background,
          borderRight: `1px solid ${BRANDING.colors.primary}22`,
        },
      }}
    >
      <Box
        sx={{
          padding: theme.spacing(2),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${BRANDING.colors.primary}22`,
        }}
      >
        <img
          src={BRANDING.logo.text}
          alt={BRANDING.name}
          style={{
            height: '32px',
            width: 'auto',
          }}
        />
      </Box>
      <List>
        {menuItems.map((item, index) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              item.action();
              setDrawerOpen(false);
            }}
            sx={{
              '&:hover': {
                backgroundColor: `${BRANDING.colors.primary}11`,
              },
            }}
          >
            <ListItemIcon sx={{ color: BRANDING.colors.primary }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                '& .MuiTypography-root': {
                  fontFamily: BRANDING.fonts.primary,
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {drawer}
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: BRANDING.colors.background,
            borderBottom: `1px solid ${BRANDING.colors.primary}22`,
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ color: BRANDING.colors.secondary }}
            >
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src={BRANDING.logo.text}
              alt={BRANDING.name}
              sx={{
                height: '32px',
                marginLeft: theme.spacing(2),
              }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<AIIcon />}
              onClick={onAIAssistantOpen}
              sx={{
                backgroundColor: BRANDING.colors.primary,
                '&:hover': {
                  backgroundColor: `${BRANDING.colors.primary}DD`,
                },
              }}
            >
              AI Assistant
            </Button>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            padding: theme.spacing(3),
            backgroundColor: `${BRANDING.colors.primary}05`,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              marginBottom: theme.spacing(3),
              fontFamily: BRANDING.fonts.secondary,
              color: BRANDING.colors.secondary,
            }}
          >
            Welcome to {BRANDING.name}
          </Typography>

          {/* Dashboard content will go here */}
          <Box
            sx={{
              display: 'grid',
              gap: theme.spacing(3),
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            }}
          >
            {/* Placeholder cards for dashboard content */}
            {Array.from({ length: 4 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  padding: theme.spacing(3),
                  backgroundColor: BRANDING.colors.background,
                  borderRadius: theme.shape.borderRadius,
                  boxShadow: `0 2px 8px ${BRANDING.colors.primary}11`,
                }}
              >
                <Typography variant="h6" sx={{ fontFamily: BRANDING.fonts.secondary }}>
                  Dashboard Card {i + 1}
                </Typography>
                <Typography variant="body2" sx={{ marginTop: 1, opacity: 0.7 }}>
                  Placeholder content for dashboard metrics and information.
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}; 