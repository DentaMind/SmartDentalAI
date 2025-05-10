import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  Radio
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

interface IntakeFormProps {
  onSubmit: (formData: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

const IntakeForm: React.FC<IntakeFormProps> = ({ 
  onSubmit, 
  initialData = {}, 
  isLoading = false 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    dateOfBirth: initialData.dateOfBirth || null,
    gender: initialData.gender || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zipCode || '',
    
    // Insurance Information
    hasInsurance: initialData.hasInsurance !== undefined ? initialData.hasInsurance : true,
    insuranceProvider: initialData.insuranceProvider || '',
    insuranceMemberId: initialData.insuranceMemberId || '',
    insuranceGroupNumber: initialData.insuranceGroupNumber || '',
    insurancePlanType: initialData.insurancePlanType || '',
    primaryInsuredName: initialData.primaryInsuredName || '',
    relationshipToPrimary: initialData.relationshipToPrimary || 'self',
    
    // Medical History
    allergies: initialData.allergies || '',
    medications: initialData.medications || '',
    medicalConditions: initialData.medicalConditions || '',
    previousDentalWork: initialData.previousDentalWork || '',
    
    // Dental History
    lastDentalVisit: initialData.lastDentalVisit || null,
    currentDentalConcerns: initialData.currentDentalConcerns || '',
    
    // Emergency Contact
    emergencyContactName: initialData.emergencyContactName || '',
    emergencyContactPhone: initialData.emergencyContactPhone || '',
    emergencyContactRelationship: initialData.emergencyContactRelationship || '',
    
    // Consent
    consentToTreatment: initialData.consentToTreatment || false,
    consentToShareInformation: initialData.consentToShareInformation || false,
    acknowledgePrivacyPolicy: initialData.acknowledgePrivacyPolicy || false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const steps = [
    'Personal Information',
    'Insurance Details',
    'Medical History',
    'Dental History',
    'Consent Forms'
  ];
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSelectChange = (event: any) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleDateChange = (name: string, date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate based on current step
    switch (step) {
      case 0: // Personal Information
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^[\d\s()+\-\.]+$/.test(formData.phone)) {
          newErrors.phone = 'Invalid phone format';
        }
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
        break;
        
      case 1: // Insurance Information
        if (formData.hasInsurance) {
          if (!formData.insuranceProvider.trim()) newErrors.insuranceProvider = 'Insurance provider is required';
          if (!formData.insuranceMemberId.trim()) newErrors.insuranceMemberId = 'Member ID is required';
          if (!formData.primaryInsuredName.trim()) newErrors.primaryInsuredName = 'Primary insured name is required';
        }
        break;
        
      case 2: // Medical History
        // No required fields, but could add validation logic if needed
        break;
        
      case 3: // Dental History
        // No required fields, but could add validation logic if needed
        break;
        
      case 4: // Consent Forms
        if (!formData.consentToTreatment) newErrors.consentToTreatment = 'Consent to treatment is required';
        if (!formData.acknowledgePrivacyPolicy) newErrors.acknowledgePrivacyPolicy = 'You must acknowledge the privacy policy';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateStep(activeStep)) {
      return;
    }
    
    setSubmitError(null);
    
    try {
      await onSubmit(formData);
      // Success handling will be done by parent component
    } catch (error) {
      console.error('Error submitting intake form:', error);
      setSubmitError('There was an error submitting the form. Please try again.');
    }
  };
  
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(date) => handleDateChange('dateOfBirth', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.dateOfBirth,
                      helperText: errors.dateOfBirth
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.gender}>
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
                  <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                </Select>
                {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="phone"
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="address"
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                required
                fullWidth
                id="city"
                name="city"
                label="City"
                value={formData.city}
                onChange={handleChange}
                error={!!errors.city}
                helperText={errors.city}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                required
                fullWidth
                id="state"
                name="state"
                label="State"
                value={formData.state}
                onChange={handleChange}
                error={!!errors.state}
                helperText={errors.state}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                required
                fullWidth
                id="zipCode"
                name="zipCode"
                label="ZIP Code"
                value={formData.zipCode}
                onChange={handleChange}
                error={!!errors.zipCode}
                helperText={errors.zipCode}
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="hasInsurance"
                    checked={formData.hasInsurance}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="I have dental insurance"
              />
            </Grid>
            
            {formData.hasInsurance && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="insuranceProvider"
                    name="insuranceProvider"
                    label="Insurance Provider"
                    value={formData.insuranceProvider}
                    onChange={handleChange}
                    error={!!errors.insuranceProvider}
                    helperText={errors.insuranceProvider}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="insuranceMemberId"
                    name="insuranceMemberId"
                    label="Member ID"
                    value={formData.insuranceMemberId}
                    onChange={handleChange}
                    error={!!errors.insuranceMemberId}
                    helperText={errors.insuranceMemberId}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="insuranceGroupNumber"
                    name="insuranceGroupNumber"
                    label="Group Number"
                    value={formData.insuranceGroupNumber}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="insurance-plan-type-label">Plan Type</InputLabel>
                    <Select
                      labelId="insurance-plan-type-label"
                      id="insurancePlanType"
                      name="insurancePlanType"
                      value={formData.insurancePlanType}
                      label="Plan Type"
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="ppo">PPO</MenuItem>
                      <MenuItem value="hmo">HMO</MenuItem>
                      <MenuItem value="epo">EPO</MenuItem>
                      <MenuItem value="indemnity">Indemnity</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="primaryInsuredName"
                    name="primaryInsuredName"
                    label="Primary Insured Name"
                    value={formData.primaryInsuredName}
                    onChange={handleChange}
                    error={!!errors.primaryInsuredName}
                    helperText={errors.primaryInsuredName}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="relationship-to-primary-label">Relationship to Primary</InputLabel>
                    <Select
                      labelId="relationship-to-primary-label"
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
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        );
        
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="allergies"
                name="allergies"
                label="Allergies"
                multiline
                rows={3}
                placeholder="Please list any allergies you have (medications, latex, etc.)"
                value={formData.allergies}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="medications"
                name="medications"
                label="Current Medications"
                multiline
                rows={3}
                placeholder="Please list all medications you are currently taking"
                value={formData.medications}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="medicalConditions"
                name="medicalConditions"
                label="Medical Conditions"
                multiline
                rows={3}
                placeholder="Please list any medical conditions you have been diagnosed with"
                value={formData.medicalConditions}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
        
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Last Dental Visit"
                  value={formData.lastDentalVisit}
                  onChange={(date) => handleDateChange('lastDentalVisit', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="previousDentalWork"
                name="previousDentalWork"
                label="Previous Dental Work"
                multiline
                rows={3}
                placeholder="Please describe any previous dental work you've had (fillings, crowns, root canals, etc.)"
                value={formData.previousDentalWork}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="currentDentalConcerns"
                name="currentDentalConcerns"
                label="Current Dental Concerns"
                multiline
                rows={3}
                placeholder="Please describe any current dental concerns or issues you're experiencing"
                value={formData.currentDentalConcerns}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom mt={2}>
                Emergency Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="emergencyContactName"
                name="emergencyContactName"
                label="Emergency Contact Name"
                value={formData.emergencyContactName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                label="Emergency Contact Phone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="emergencyContactRelationship"
                name="emergencyContactRelationship"
                label="Relationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
        
      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Consent Forms
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please review and acknowledge the following consent forms.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: '200px', overflow: 'auto' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Consent to Treatment
                </Typography>
                <Typography variant="body2">
                  I hereby consent to dental treatment, including examination, X-rays, cleaning, and other dental procedures deemed necessary by the dental professional. I understand that dental procedures involve risks, and I have the right to ask questions about my treatment. I understand that my dental records may be used for educational purposes while maintaining my privacy.
                </Typography>
              </Paper>
              <FormControlLabel
                control={
                  <Checkbox
                    name="consentToTreatment"
                    checked={formData.consentToTreatment}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="I consent to treatment"
              />
              {errors.consentToTreatment && (
                <FormHelperText error>{errors.consentToTreatment}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: '200px', overflow: 'auto' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Information Sharing Consent
                </Typography>
                <Typography variant="body2">
                  I authorize the dental practice to share my dental information with my insurance provider for billing purposes, and with my other healthcare providers as needed for coordinated care. This may include dental records, diagnoses, treatment plans, and billing information.
                </Typography>
              </Paper>
              <FormControlLabel
                control={
                  <Checkbox
                    name="consentToShareInformation"
                    checked={formData.consentToShareInformation}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="I consent to information sharing"
              />
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: '200px', overflow: 'auto' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Privacy Policy Acknowledgment
                </Typography>
                <Typography variant="body2">
                  I acknowledge that I have received and reviewed a copy of this dental practice's Notice of Privacy Practices, which explains how my personal health information will be used and disclosed. I understand my rights regarding my protected health information.
                </Typography>
              </Paper>
              <FormControlLabel
                control={
                  <Checkbox
                    name="acknowledgePrivacyPolicy"
                    checked={formData.acknowledgePrivacyPolicy}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="I acknowledge the privacy policy"
              />
              {errors.acknowledgePrivacyPolicy && (
                <FormHelperText error>{errors.acknowledgePrivacyPolicy}</FormHelperText>
              )}
            </Grid>
          </Grid>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        {renderStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </form>
    </Box>
  );
};

export default IntakeForm; 