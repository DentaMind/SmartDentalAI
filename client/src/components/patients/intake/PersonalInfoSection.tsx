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
  Grid
} from '@mui/material';

// Date picker component
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

interface PersonalInfoSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
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
      <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
      <p className="mb-6 text-[var(--color-text-secondary)]">
        Please provide your basic personal information. Fields marked with * are required.
      </p>
      
      <Grid container spacing={3}>
        {/* First Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            id="firstName"
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
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
        
        {/* Last Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            id="lastName"
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
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
        
        {/* Date of Birth */}
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date of Birth *"
              value={formData.dateOfBirth}
              onChange={(date) => onChange('dateOfBirth', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.dateOfBirth,
                  helperText: errors.dateOfBirth,
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
        
        {/* Gender */}
        <Grid item xs={12} sm={6}>
          <FormControl 
            fullWidth
            error={!!errors.gender}
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
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={formData.gender}
              label="Gender"
              onChange={handleSelectChange}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
              <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
            </Select>
            {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
          </FormControl>
        </Grid>
        
        {/* Email */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            id="email"
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={!!errors.email}
            helperText={errors.email}
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
        
        {/* Phone */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="phone"
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleInputChange}
            error={!!errors.phone}
            helperText={errors.phone}
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
        
        {/* Address */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="address"
            name="address"
            label="Street Address"
            value={formData.address}
            onChange={handleInputChange}
            error={!!errors.address}
            helperText={errors.address}
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
        
        {/* City */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="city"
            name="city"
            label="City"
            value={formData.city}
            onChange={handleInputChange}
            error={!!errors.city}
            helperText={errors.city}
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
        
        {/* State */}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            id="state"
            name="state"
            label="State"
            value={formData.state}
            onChange={handleInputChange}
            error={!!errors.state}
            helperText={errors.state}
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
        
        {/* ZIP Code */}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            id="zipCode"
            name="zipCode"
            label="ZIP Code"
            value={formData.zipCode}
            onChange={handleInputChange}
            error={!!errors.zipCode}
            helperText={errors.zipCode}
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
        
        {/* Emergency Contact Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="emergencyContactName"
            name="emergencyContactName"
            label="Emergency Contact Name"
            value={formData.emergencyContactName}
            onChange={handleInputChange}
            error={!!errors.emergencyContactName}
            helperText={errors.emergencyContactName}
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
        
        {/* Emergency Contact Phone */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="emergencyContactPhone"
            name="emergencyContactPhone"
            label="Emergency Contact Phone"
            value={formData.emergencyContactPhone}
            onChange={handleInputChange}
            error={!!errors.emergencyContactPhone}
            helperText={errors.emergencyContactPhone}
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

export default PersonalInfoSection; 