import React from 'react';
import {
  ToggleButtonGroup,
  ToggleButton,
  useTheme
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface AlertSeverityFilterProps {
  value: 'low' | 'medium' | 'high';
  onChange: (value: 'low' | 'medium' | 'high') => void;
}

export const AlertSeverityFilter: React.FC<AlertSeverityFilterProps> = ({
  value,
  onChange
}) => {
  const theme = useTheme();

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: 'low' | 'medium' | 'high' | null
  ) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      size="small"
      aria-label="alert severity filter"
    >
      <ToggleButton
        value="high"
        aria-label="high severity"
        sx={{
          '&.Mui-selected': {
            color: theme.palette.error.main,
            borderColor: theme.palette.error.main,
            backgroundColor: theme.palette.error.light + '20',
            '&:hover': {
              backgroundColor: theme.palette.error.light + '30'
            }
          }
        }}
      >
        <ErrorIcon sx={{ mr: 0.5 }} />
        High
      </ToggleButton>
      <ToggleButton
        value="medium"
        aria-label="medium severity"
        sx={{
          '&.Mui-selected': {
            color: theme.palette.warning.main,
            borderColor: theme.palette.warning.main,
            backgroundColor: theme.palette.warning.light + '20',
            '&:hover': {
              backgroundColor: theme.palette.warning.light + '30'
            }
          }
        }}
      >
        <WarningIcon sx={{ mr: 0.5 }} />
        Medium
      </ToggleButton>
      <ToggleButton
        value="low"
        aria-label="low severity"
        sx={{
          '&.Mui-selected': {
            color: theme.palette.info.main,
            borderColor: theme.palette.info.main,
            backgroundColor: theme.palette.info.light + '20',
            '&:hover': {
              backgroundColor: theme.palette.info.light + '30'
            }
          }
        }}
      >
        <InfoIcon sx={{ mr: 0.5 }} />
        Low
      </ToggleButton>
    </ToggleButtonGroup>
  );
}; 