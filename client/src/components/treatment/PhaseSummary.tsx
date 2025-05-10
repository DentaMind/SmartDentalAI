import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Badge, 
  useTheme 
} from '@mui/material';
import {
  Error as UrgentIcon,
  Filter1 as Phase1Icon,
  Filter2 as Phase2Icon,
  Loop as MaintenanceIcon
} from '@mui/icons-material';

import { PlanPhase } from '../../types/treatment-plan';

interface PhaseSummaryProps {
  phase: PlanPhase;
  count: number;
  selected: boolean;
  onClick: () => void;
}

export const PhaseSummary: React.FC<PhaseSummaryProps> = ({
  phase,
  count,
  selected,
  onClick
}) => {
  const theme = useTheme();
  
  // Phase display information
  const phaseInfo: Record<PlanPhase, {
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
  }> = {
    urgent: {
      label: 'Urgent',
      icon: <UrgentIcon />,
      color: theme.palette.error.main,
      description: 'Immediate treatment needed'
    },
    phase_1: {
      label: 'Phase 1',
      icon: <Phase1Icon />,
      color: theme.palette.primary.main,
      description: 'Initial treatment'
    },
    phase_2: {
      label: 'Phase 2',
      icon: <Phase2Icon />,
      color: theme.palette.secondary.main,
      description: 'Secondary treatment'
    },
    maintenance: {
      label: 'Maintenance',
      icon: <MaintenanceIcon />,
      color: theme.palette.success.main,
      description: 'Ongoing care'
    }
  };
  
  const info = phaseInfo[phase];
  
  return (
    <Paper
      elevation={selected ? 3 : 1}
      sx={{
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: selected ? `2px solid ${info.color}` : '2px solid transparent',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
      onClick={onClick}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Box 
            sx={{ 
              color: info.color,
              mr: 1,
              display: 'flex'
            }}
          >
            {info.icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={selected ? 'bold' : 'normal'}>
            {info.label}
          </Typography>
        </Box>
        
        <Badge
          badgeContent={count}
          color={selected ? 'primary' : 'default'}
          showZero
        />
      </Box>
      
      <Typography variant="caption" color="textSecondary" display="block" mt={1}>
        {info.description}
      </Typography>
    </Paper>
  );
}; 