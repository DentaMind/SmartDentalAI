import React from 'react';
import { useBrand } from '../../ui/BrandProvider';

// Material UI components for form inputs
import {
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  FormGroup
} from '@mui/material';

interface MedicalHistorySectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const MedicalHistorySection: React.FC<MedicalHistorySectionProps> = ({
  formData,
  onChange,
  errors
}) => {
  const { mode } = useBrand();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange(name, checked);
  };
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Medical History</h2>
      <p className="mb-6 text-[var(--color-text-secondary)]">
        Please provide your medical history information to help us provide safe and effective dental care.
        This information is confidential.
      </p>
      
      <Grid container spacing={3}>
        {/* Medical Conditions */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
            Do you currently have or have you ever had any of the following conditions?
          </Typography>
          
          <FormGroup row>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasDiabetes}
                      onChange={handleCheckboxChange}
                      name="hasDiabetes"
                      color="primary"
                    />
                  }
                  label="Diabetes"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasHeartDisease}
                      onChange={handleCheckboxChange}
                      name="hasHeartDisease"
                      color="primary"
                    />
                  }
                  label="Heart Disease"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasHighBloodPressure}
                      onChange={handleCheckboxChange}
                      name="hasHighBloodPressure"
                      color="primary"
                    />
                  }
                  label="High Blood Pressure"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasAsthma}
                      onChange={handleCheckboxChange}
                      name="hasAsthma"
                      color="primary"
                    />
                  }
                  label="Asthma/Respiratory Issues"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isSmoker}
                      onChange={handleCheckboxChange}
                      name="isSmoker"
                      color="primary"
                    />
                  }
                  label="Tobacco/Nicotine Use"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isPregnant}
                      onChange={handleCheckboxChange}
                      name="isPregnant"
                      color="primary"
                    />
                  }
                  label="Pregnant or Nursing"
                />
              </Grid>
            </Grid>
          </FormGroup>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        {/* Allergies */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            id="allergies"
            name="allergies"
            label="Do you have any allergies? (medications, latex, local anesthetics, etc.)"
            value={formData.allergies}
            onChange={handleInputChange}
            error={!!errors.allergies}
            helperText={errors.allergies}
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
        
        {/* Medications */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            id="medications"
            name="medications"
            label="List any medications you are currently taking"
            value={formData.medications}
            onChange={handleInputChange}
            error={!!errors.medications}
            helperText={errors.medications}
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
        
        {/* Other Medical Conditions */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            id="medicalConditions"
            name="medicalConditions"
            label="List any other medical conditions or concerns"
            value={formData.medicalConditions}
            onChange={handleInputChange}
            error={!!errors.medicalConditions}
            helperText={errors.medicalConditions}
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
      
      <div className="mt-6 p-4 rounded-md" style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)' }}>
        <Typography variant="body2" sx={{ color: 'var(--color-text-primary)' }}>
          <strong>Medical Alert:</strong> This information is important for your dental care. Certain medical 
          conditions may affect your treatment options or require special precautions. Please consult with your 
          dentist if you have any questions or concerns.
        </Typography>
      </div>
    </div>
  );
};

export default MedicalHistorySection; 