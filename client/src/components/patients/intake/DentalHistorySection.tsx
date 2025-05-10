import React from 'react';
import { useBrand } from '../../ui/BrandProvider';

// Material UI components for form inputs
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Grid,
  RadioGroup,
  Radio,
  FormControlLabel,
  Typography
} from '@mui/material';

// Date picker component
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

interface DentalHistorySectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const DentalHistorySection: React.FC<DentalHistorySectionProps> = ({
  formData,
  onChange,
  errors
}) => {
  const { mode } = useBrand();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };
  
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    onChange(name, value);
  };
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Dental History</h2>
      <p className="mb-6 text-[var(--color-text-secondary)]">
        Please provide information about your dental history to help us better understand your needs.
      </p>
      
      <Grid container spacing={3}>
        {/* Last Dental Visit */}
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="When was your last dental visit?"
              value={formData.lastDentalVisit}
              onChange={(date) => onChange('lastDentalVisit', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.lastDentalVisit,
                  helperText: errors.lastDentalVisit,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                    },
                    '& .MuiInputBase-input': {
                      color: 'var(--color-text-primary)',
                    },
                  }
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        {/* Reason for Visit */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="reasonForVisit"
            name="reasonForVisit"
            label="What is the reason for your dental visit today?"
            value={formData.reasonForVisit}
            onChange={handleInputChange}
            error={!!errors.reasonForVisit}
            helperText={errors.reasonForVisit}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                },
              },
              '& .MuiInputLabel-root': {
                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
              },
              '& .MuiInputBase-input': {
                color: 'var(--color-text-primary)',
              },
            }}
          />
        </Grid>
        
        {/* Brushing Frequency */}
        <Grid item xs={12} sm={6}>
          <FormControl 
            fullWidth
            error={!!errors.brushingFrequency}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                },
              },
              '& .MuiInputLabel-root': {
                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
              },
              '& .MuiSelect-select': {
                color: 'var(--color-text-primary)',
              },
            }}
          >
            <InputLabel id="brushingFrequency-label">How often do you brush your teeth?</InputLabel>
            <Select
              labelId="brushingFrequency-label"
              id="brushingFrequency"
              name="brushingFrequency"
              value={formData.brushingFrequency}
              label="How often do you brush your teeth?"
              onChange={handleSelectChange}
            >
              <MenuItem value="three_or_more_daily">Three or more times a day</MenuItem>
              <MenuItem value="twice_daily">Twice a day</MenuItem>
              <MenuItem value="once_daily">Once a day</MenuItem>
              <MenuItem value="few_times_a_week">A few times a week</MenuItem>
              <MenuItem value="less_frequently">Less frequently</MenuItem>
            </Select>
            {errors.brushingFrequency && <FormHelperText>{errors.brushingFrequency}</FormHelperText>}
          </FormControl>
        </Grid>
        
        {/* Flossing Frequency */}
        <Grid item xs={12} sm={6}>
          <FormControl 
            fullWidth
            error={!!errors.flossingFrequency}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                },
              },
              '& .MuiInputLabel-root': {
                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
              },
              '& .MuiSelect-select': {
                color: 'var(--color-text-primary)',
              },
            }}
          >
            <InputLabel id="flossingFrequency-label">How often do you floss?</InputLabel>
            <Select
              labelId="flossingFrequency-label"
              id="flossingFrequency"
              name="flossingFrequency"
              value={formData.flossingFrequency}
              label="How often do you floss?"
              onChange={handleSelectChange}
            >
              <MenuItem value="multiple_daily">Multiple times a day</MenuItem>
              <MenuItem value="daily">Once a day</MenuItem>
              <MenuItem value="few_times_a_week">A few times a week</MenuItem>
              <MenuItem value="weekly">Once a week</MenuItem>
              <MenuItem value="occasionally">Occasionally</MenuItem>
              <MenuItem value="rarely">Rarely or never</MenuItem>
            </Select>
            {errors.flossingFrequency && <FormHelperText>{errors.flossingFrequency}</FormHelperText>}
          </FormControl>
        </Grid>
        
        {/* Previous Dental Work */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            id="previousDentalWork"
            name="previousDentalWork"
            label="Please describe any previous dental work (fillings, crowns, root canals, etc.)"
            value={formData.previousDentalWork}
            onChange={handleInputChange}
            error={!!errors.previousDentalWork}
            helperText={errors.previousDentalWork}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                },
              },
              '& .MuiInputLabel-root': {
                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
              },
              '& .MuiInputBase-input': {
                color: 'var(--color-text-primary)',
              },
            }}
          />
        </Grid>
        
        {/* Current Dental Concerns */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            id="currentDentalConcerns"
            name="currentDentalConcerns"
            label="Do you have any current dental concerns or pain?"
            value={formData.currentDentalConcerns}
            onChange={handleInputChange}
            error={!!errors.currentDentalConcerns}
            helperText={errors.currentDentalConcerns}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                },
              },
              '& .MuiInputLabel-root': {
                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
              },
              '& .MuiInputBase-input': {
                color: 'var(--color-text-primary)',
              },
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default DentalHistorySection; 