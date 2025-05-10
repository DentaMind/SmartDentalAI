import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import ProviderList from '../components/ProviderList';
import AppointmentSlotList from '../components/AppointmentSlotList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`calendar-tabpanel-${index}`}
      aria-labelledby={`calendar-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CalendarPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="calendar tabs"
        >
          <Tab label="Providers" />
          <Tab label="Appointment Slots" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <ProviderList />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <AppointmentSlotList />
      </TabPanel>
    </Box>
  );
};

export default CalendarPage; 