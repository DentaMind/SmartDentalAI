import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Grid,
  Paper,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListSubheader
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import { useTheme } from '../theme/ThemeContext';
import { ColorProfile, getDentalChartColors, getPerioChartColors } from '../theme/chartColors';

/**
 * Settings page component for application configuration
 */
const Settings: React.FC = () => {
  const { themeSettings, setThemeMode, setColorProfile } = useTheme();
  
  const handleThemeModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setThemeMode(event.target.value as 'light' | 'dark');
  };
  
  const handleColorProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setColorProfile(event.target.value as ColorProfile);
  };
  
  // Get colors for current theme settings
  const dentalColors = getDentalChartColors(themeSettings.mode, themeSettings.colorProfile);
  const perioColors = getPerioChartColors(themeSettings.mode, themeSettings.colorProfile);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Theme Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ mb: 3 }}>
            <List
              subheader={
                <ListSubheader component="div" sx={{ bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DarkModeIcon />
                    <Typography variant="h6">Theme Settings</Typography>
                  </Box>
                </ListSubheader>
              }
            >
              <ListItem>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Display Theme"
                  secondary="Choose between light and dark theme modes"
                />
              </ListItem>
              
              <ListItem>
                <FormControl component="fieldset" sx={{ width: '100%', ml: 6 }}>
                  <RadioGroup
                    row
                    aria-label="theme mode"
                    name="theme-mode-group"
                    value={themeSettings.mode}
                    onChange={handleThemeModeChange}
                  >
                    <FormControlLabel 
                      value="light" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LightModeIcon fontSize="small" />
                          <Typography>Light</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel 
                      value="dark" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DarkModeIcon fontSize="small" />
                          <Typography>Dark</Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </ListItem>
              
              <Divider sx={{ my: 1 }} />
              
              <ListItem>
                <ListItemIcon>
                  <ColorLensIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Chart Color Scheme"
                  secondary="Choose color scheme for dental and periodontal charts"
                />
              </ListItem>
              
              <ListItem>
                <FormControl component="fieldset" sx={{ width: '100%', ml: 6 }}>
                  <RadioGroup
                    aria-label="color profile"
                    name="color-profile-group"
                    value={themeSettings.colorProfile}
                    onChange={handleColorProfileChange}
                  >
                    <FormControlLabel 
                      value="standard" 
                      control={<Radio />} 
                      label="Standard" 
                    />
                    <FormControlLabel 
                      value="highContrast" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VisibilityIcon fontSize="small" />
                          <Typography>High Contrast</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel 
                      value="colorblind" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessibilityNewIcon fontSize="small" />
                          <Typography>Colorblind-Friendly</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel 
                      value="monochrome" 
                      control={<Radio />} 
                      label="Monochrome" 
                    />
                  </RadioGroup>
                </FormControl>
              </ListItem>
            </List>
          </Paper>
          
          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Your theme settings are saved automatically and will persist between sessions.
            </Alert>
            
            <Typography variant="caption" color="text.secondary">
              These settings affect the appearance of charts and UI elements across DentaMind.
              High contrast and colorblind-friendly modes are designed to enhance accessibility.
            </Typography>
          </Box>
        </Grid>
        
        {/* Chart Color Preview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: '100%', p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chart Color Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Preview how dental and periodontal charts will appear with your selected color scheme.
            </Typography>
            
            {/* Dental chart preview */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Dental Chart
              </Typography>
              
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: '#f5f5f5', p: 0.5, textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      14
                    </Box>
                    <Box sx={{ 
                      height: 40, 
                      bgcolor: dentalColors.filling,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  </Box>
                  <Typography variant="caption" align="center" display="block">
                    Filling
                  </Typography>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: '#f5f5f5', p: 0.5, textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      18
                    </Box>
                    <Box sx={{ 
                      height: 40, 
                      bgcolor: dentalColors.rootCanal,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  </Box>
                  <Typography variant="caption" align="center" display="block">
                    Root Canal
                  </Typography>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: '#f5f5f5', p: 0.5, textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      17
                    </Box>
                    <Box sx={{ 
                      height: 40, 
                      bgcolor: dentalColors.watch,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  </Box>
                  <Typography variant="caption" align="center" display="block">
                    Watch
                  </Typography>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: '#f5f5f5', p: 0.5, textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      30
                    </Box>
                    <Box sx={{ 
                      height: 40, 
                      bgcolor: dentalColors.missing,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        M
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" align="center" display="block">
                    Missing
                  </Typography>
                </Grid>
              </Grid>
              
              <Grid container spacing={1}>
                <Grid item xs={3}>
                  <Box sx={{ 
                    height: 30, 
                    bgcolor: dentalColors.healthy,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      Healthy
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ 
                    height: 30, 
                    bgcolor: dentalColors.warning,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      Warning
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ 
                    height: 30, 
                    bgcolor: dentalColors.urgent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      Urgent
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ 
                    height: 30, 
                    bgcolor: dentalColors.completed,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      Complete
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            
            {/* Periodontal chart preview */}
            <Box>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Periodontal Chart
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Probing Depths
              </Typography>
              
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 36, 
                    bgcolor: perioColors.normal,
                    border: '1px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2">2</Typography>
                  </Box>
                  <Typography variant="caption" align="center" display="block">
                    Healthy (1-3mm)
                  </Typography>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 36, 
                    bgcolor: perioColors.mild,
                    border: '1px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2">4</Typography>
                  </Box>
                  <Typography variant="caption" align="center" display="block">
                    Mild (4-5mm)
                  </Typography>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 36, 
                    bgcolor: perioColors.moderate,
                    border: '1px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2">6</Typography>
                  </Box>
                  <Typography variant="caption" align="center" display="block">
                    Moderate (6-7mm)
                  </Typography>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 36, 
                    bgcolor: perioColors.severe,
                    border: '1px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2">8</Typography>
                  </Box>
                  <Typography variant="caption" align="center" display="block">
                    Severe (8mm+)
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle2" gutterBottom>
                Clinical Indicators
              </Typography>
              
              <Grid container spacing={1}>
                <Grid item xs={3}>
                  <Box sx={{ 
                    height: 30, 
                    bgcolor: perioColors.bleeding,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      Bleeding
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ 
                    height: 30, 
                    bgcolor: perioColors.suppuration,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      Suppuration
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ 
                    height: 30, 
                    bgcolor: perioColors.recession,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      Recession
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={3}>
                  <Box sx={{ 
                    height: 30, 
                    bgcolor: perioColors.attachment,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      CAL
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 