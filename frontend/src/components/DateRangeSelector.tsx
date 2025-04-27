import React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  TextField,
  Popover,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleQuickSelect = (days: number) => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days));
    onChange({ start, end });
    handleClose();
  };

  const handleStartChange = (date: Date | null) => {
    if (date) {
      onChange({
        start: startOfDay(date),
        end: value.end
      });
    }
  };

  const handleEndChange = (date: Date | null) => {
    if (date) {
      onChange({
        start: value.start,
        end: endOfDay(date)
      });
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        size="small"
      >
        {format(value.start, 'MMM d, yyyy')} - {format(value.end, 'MMM d, yyyy')}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2 }}>
          <ButtonGroup
            variant="outlined"
            size="small"
            sx={{ display: 'flex', mb: 2 }}
          >
            <Button onClick={() => handleQuickSelect(7)}>7D</Button>
            <Button onClick={() => handleQuickSelect(14)}>14D</Button>
            <Button onClick={() => handleQuickSelect(30)}>30D</Button>
            <Button onClick={() => handleQuickSelect(90)}>90D</Button>
          </ButtonGroup>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker
              label="Start Date"
              value={value.start}
              onChange={handleStartChange}
              maxDate={value.end}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: 150 }
                }
              }}
            />
            <DatePicker
              label="End Date"
              value={value.end}
              onChange={handleEndChange}
              minDate={value.start}
              maxDate={new Date()}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: 150 }
                }
              }}
            />
          </Box>
        </Box>
      </Popover>
    </>
  );
}; 