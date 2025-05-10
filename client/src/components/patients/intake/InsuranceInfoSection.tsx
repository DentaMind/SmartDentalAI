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
  FormControlLabel,
  Switch,
  Typography,
  Divider
} from '@mui/material';

interface InsuranceInfoSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const InsuranceInfoSection: React.FC<InsuranceInfoSectionProps> = ({
  formData,
  onChange,
  errors
}) => {
  const { mode } = useBrand();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };
  
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('hasInsurance', e.target.checked);
  };
  
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    onChange(name, value);
  };
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Insurance Information</h2>
      <p className="mb-6 text-[var(--color-text-secondary)]">
        Please provide details about your dental insurance, if applicable.
      </p>
      
      <FormControlLabel
        control={
          <Switch
            checked={formData.hasInsurance}
            onChange={handleSwitchChange}
            name="hasInsurance"
            color="primary"
          />
        }
        label="I have dental insurance"
        sx={{ mb: 3 }}
      />
      
      {formData.hasInsurance && (
        <Grid container spacing={3}>
          {/* Insurance Provider */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              id="insuranceProvider"
              name="insuranceProvider"
              label="Insurance Provider"
              value={formData.insuranceProvider}
              onChange={handleInputChange}
              error={!!errors.insuranceProvider}
              helperText={errors.insuranceProvider}
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
          
          {/* Insurance Member ID */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              id="insuranceMemberId"
              name="insuranceMemberId"
              label="Member ID"
              value={formData.insuranceMemberId}
              onChange={handleInputChange}
              error={!!errors.insuranceMemberId}
              helperText={errors.insuranceMemberId}
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
          
          {/* Group Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="insuranceGroupNumber"
              name="insuranceGroupNumber"
              label="Group Number"
              value={formData.insuranceGroupNumber}
              onChange={handleInputChange}
              error={!!errors.insuranceGroupNumber}
              helperText={errors.insuranceGroupNumber}
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
          
          {/* Insurance Plan Type */}
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              error={!!errors.insurancePlanType}
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
              <InputLabel id="insurancePlanType-label">Plan Type</InputLabel>
              <Select
                labelId="insurancePlanType-label"
                id="insurancePlanType"
                name="insurancePlanType"
                value={formData.insurancePlanType}
                label="Plan Type"
                onChange={handleSelectChange}
              >
                <MenuItem value="PPO">PPO (Preferred Provider Organization)</MenuItem>
                <MenuItem value="HMO">HMO (Health Maintenance Organization)</MenuItem>
                <MenuItem value="EPO">EPO (Exclusive Provider Organization)</MenuItem>
                <MenuItem value="DHMO">DHMO (Dental Health Maintenance Organization)</MenuItem>
                <MenuItem value="indemnity">Indemnity Plan</MenuItem>
                <MenuItem value="discount">Discount Plan</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
              {errors.insurancePlanType && <FormHelperText>{errors.insurancePlanType}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Primary Insured Information
            </Typography>
          </Grid>
          
          {/* Primary Insured Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="primaryInsuredName"
              name="primaryInsuredName"
              label="Primary Insured Name"
              value={formData.primaryInsuredName}
              onChange={handleInputChange}
              error={!!errors.primaryInsuredName}
              helperText={errors.primaryInsuredName || "Leave blank if you are the primary insured"}
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
          
          {/* Relationship to Primary */}
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              error={!!errors.relationshipToPrimary}
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
              <InputLabel id="relationshipToPrimary-label">Relationship to Primary</InputLabel>
              <Select
                labelId="relationshipToPrimary-label"
                id="relationshipToPrimary"
                name="relationshipToPrimary"
                value={formData.relationshipToPrimary}
                label="Relationship to Primary"
                onChange={handleSelectChange}
              >
                <MenuItem value="self">Self</MenuItem>
                <MenuItem value="spouse">Spouse</MenuItem>
                <MenuItem value="child">Child</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
              {errors.relationshipToPrimary && <FormHelperText>{errors.relationshipToPrimary}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
      )}
      
      {!formData.hasInsurance && (
        <Typography 
          variant="body1" 
          className="mt-4 p-4 rounded-md bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]"
        >
          Please note that without insurance, you will be responsible for the full cost of dental services. 
          Our office staff will discuss payment options with you during your visit.
        </Typography>
      )}
    </div>
  );
};

export default InsuranceInfoSection; 