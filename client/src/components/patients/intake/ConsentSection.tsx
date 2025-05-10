import React from 'react';
import { useBrand } from '../../ui/BrandProvider';

// Material UI components for form inputs
import {
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Paper,
  Grid,
  Divider
} from '@mui/material';

interface ConsentSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const ConsentSection: React.FC<ConsentSectionProps> = ({
  formData,
  onChange,
  errors
}) => {
  const { mode } = useBrand();
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange(name, checked);
  };
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Consent & Agreements</h2>
      <p className="mb-6 text-[var(--color-text-secondary)]">
        Please read and check the boxes to indicate your consent to the following statements.
      </p>
      
      {/* Treatment Consent */}
      <Paper 
        elevation={0} 
        className="mb-6 p-4"
        sx={{ 
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '8px'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
          Consent to Treatment
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          I authorize the dentist and any other qualified auxiliaries or medical professionals to perform diagnostic
          procedures and treatment as may be necessary for proper dental care. I understand that dental treatment
          involves risks and that no guarantee can be made about the results of the treatment.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.consentToTreatment}
              onChange={handleCheckboxChange}
              name="consentToTreatment"
              color="primary"
              required
            />
          }
          label={
            <Typography variant="body2" fontWeight="medium">
              I consent to dental treatment and understand the risks involved
            </Typography>
          }
        />
        {errors.consentToTreatment && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            {errors.consentToTreatment}
          </Typography>
        )}
      </Paper>
      
      {/* Information Sharing Consent */}
      <Paper 
        elevation={0} 
        className="mb-6 p-4"
        sx={{ 
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '8px'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
          Consent to Share Information
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          I authorize the practice to share my health information with other healthcare providers involved in my care, 
          my insurance companies for payment purposes, and as required by law. I understand that the practice will 
          protect my information according to privacy regulations (HIPAA).
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.consentToShareInformation}
              onChange={handleCheckboxChange}
              name="consentToShareInformation"
              color="primary"
            />
          }
          label={
            <Typography variant="body2" fontWeight="medium">
              I consent to sharing my information as described above
            </Typography>
          }
        />
      </Paper>
      
      {/* Financial Agreement */}
      <Paper 
        elevation={0} 
        className="mb-6 p-4"
        sx={{ 
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '8px'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
          Financial Agreement
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          I understand that I am financially responsible for all charges whether or not they are covered by insurance.
          I authorize the practice to release any information required to secure payment from my insurance carrier and
          authorize payment directly to the practice. I understand that it is my responsibility to inform the office of
          any changes in my insurance coverage.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.financialAgreement}
              onChange={handleCheckboxChange}
              name="financialAgreement"
              color="primary"
              required
            />
          }
          label={
            <Typography variant="body2" fontWeight="medium">
              I agree to the financial terms described above
            </Typography>
          }
        />
        {errors.financialAgreement && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            {errors.financialAgreement}
          </Typography>
        )}
      </Paper>
      
      <Divider sx={{ my: 4 }} />
      
      <Box>
        <Typography variant="body2" className="mb-2" sx={{ fontWeight: 'medium' }}>
          Electronic Signature Consent
        </Typography>
        <Typography variant="body2" className="mb-4">
          By checking the above boxes and submitting this form, I acknowledge that I am providing my electronic
          signature, which has the same legal effect as a handwritten signature. I confirm that all information 
          provided is accurate to the best of my knowledge.
        </Typography>
        
        <Typography variant="body2" className="p-4 bg-[var(--color-primary-transparent)] rounded-md" sx={{ color: 'var(--color-text-primary)' }}>
          <strong>Note:</strong> You can review and modify your information at any time by contacting our office.
          If you have any questions about this form, please contact us before submitting.
        </Typography>
      </Box>
    </div>
  );
};

export default ConsentSection; 