import React, { useState } from 'react';
import { useBrand } from '../ui/BrandProvider';
import BrandButton from '../ui/BrandButton';
import BrandCard from '../ui/BrandCard';
import BrandedSpinner from '../ui/BrandedSpinner';

// Form sections
import PersonalInfoSection from './intake/PersonalInfoSection';
import InsuranceInfoSection from './intake/InsuranceInfoSection';
import MedicalHistorySection from './intake/MedicalHistorySection';
import DentalHistorySection from './intake/DentalHistorySection';
import ConsentSection from './intake/ConsentSection';

interface BrandedIntakeFormProps {
  onSubmit: (formData: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

/**
 * A multi-step patient intake form using branded UI components
 */
const BrandedIntakeForm: React.FC<BrandedIntakeFormProps> = ({
  onSubmit,
  initialData = {},
  isLoading = false
}) => {
  const { colors, typography, mode } = useBrand();
  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Define form steps
  const steps = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'insurance', label: 'Insurance Information' },
    { id: 'medical', label: 'Medical History' },
    { id: 'dental', label: 'Dental History' },
    { id: 'consent', label: 'Consent & Agreements' }
  ];
  
  // Form data state
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
    hasDiabetes: initialData.hasDiabetes || false,
    hasHeartDisease: initialData.hasHeartDisease || false,
    hasHighBloodPressure: initialData.hasHighBloodPressure || false,
    hasAsthma: initialData.hasAsthma || false,
    isSmoker: initialData.isSmoker || false,
    isPregnant: initialData.isPregnant || false,
    
    // Dental History
    lastDentalVisit: initialData.lastDentalVisit || null,
    reasonForVisit: initialData.reasonForVisit || '',
    previousDentalWork: initialData.previousDentalWork || '',
    currentDentalConcerns: initialData.currentDentalConcerns || '',
    brushingFrequency: initialData.brushingFrequency || 'twice_daily',
    flossingFrequency: initialData.flossingFrequency || 'daily',
    
    // Emergency Contact
    emergencyContactName: initialData.emergencyContactName || '',
    emergencyContactPhone: initialData.emergencyContactPhone || '',
    emergencyContactRelationship: initialData.emergencyContactRelationship || '',
    
    // Consent
    consentToTreatment: initialData.consentToTreatment || false,
    consentToShareInformation: initialData.consentToShareInformation || false,
    financialAgreement: initialData.financialAgreement || false,
  });
  
  // Field validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };
  
  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    switch (step) {
      case 0: // Personal Information
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'First name is required';
          isValid = false;
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'Last name is required';
          isValid = false;
        }
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of birth is required';
          isValid = false;
        }
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
          isValid = false;
        }
        break;
        
      case 1: // Insurance Information
        if (formData.hasInsurance) {
          if (!formData.insuranceProvider.trim()) {
            newErrors.insuranceProvider = 'Insurance provider is required';
            isValid = false;
          }
          if (!formData.insuranceMemberId.trim()) {
            newErrors.insuranceMemberId = 'Member ID is required';
            isValid = false;
          }
        }
        break;
        
      case 4: // Consent
        if (!formData.consentToTreatment) {
          newErrors.consentToTreatment = 'Consent to treatment is required';
          isValid = false;
        }
        if (!formData.financialAgreement) {
          newErrors.financialAgreement = 'Financial agreement is required';
          isValid = false;
        }
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Navigate to next step
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  // Navigate to previous step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate final step
    if (!validateStep(activeStep)) {
      return;
    }
    
    try {
      setFormError(null);
      
      // Format data for API
      const submissionData = {
        patient: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender || 'unknown',
          email: formData.email,
          phone: formData.phone,
          address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`.trim(),
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone
        },
        medical_history: {
          has_heart_disease: formData.hasHeartDisease,
          has_diabetes: formData.hasDiabetes,
          has_hypertension: formData.hasHighBloodPressure,
          has_respiratory_disease: formData.hasAsthma,
          current_smoker: formData.isSmoker,
          pregnant: formData.isPregnant,
          notes: formData.medicalConditions
        },
        insurance: {
          provider: formData.insuranceProvider,
          id: formData.insuranceMemberId,
          group: formData.insuranceGroupNumber,
          type: formData.insurancePlanType
        },
        dental_history: {
          last_visit: formData.lastDentalVisit,
          reason_for_visit: formData.reasonForVisit,
          current_concerns: formData.currentDentalConcerns,
          previous_work: formData.previousDentalWork,
          hygiene: {
            brushing: formData.brushingFrequency,
            flossing: formData.flossingFrequency
          }
        },
        consents: {
          treatment: formData.consentToTreatment,
          information_sharing: formData.consentToShareInformation,
          financial: formData.financialAgreement
        }
      };
      
      await onSubmit(submissionData);
    } catch (err) {
      console.error('Error submitting form:', err);
      setFormError('An error occurred while submitting the form. Please try again.');
    }
  };
  
  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PersonalInfoSection 
            formData={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 1:
        return (
          <InsuranceInfoSection 
            formData={formData}
            onChange={handleChange} 
            errors={errors}
          />
        );
      case 2:
        return (
          <MedicalHistorySection 
            formData={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 3:
        return (
          <DentalHistorySection 
            formData={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 4:
        return (
          <ConsentSection 
            formData={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex flex-col items-center ${index <= activeStep ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}
              style={{ width: `${100 / steps.length}%` }}
            >
              <div 
                className={`h-8 w-8 flex items-center justify-center rounded-full mb-2 ${
                  index < activeStep 
                    ? 'bg-[var(--color-primary)] text-black' 
                    : index === activeStep 
                      ? 'border-2 border-[var(--color-primary)] text-[var(--color-primary)]' 
                      : 'border-2 border-[var(--color-text-muted)] text-[var(--color-text-muted)]'
                }`}
              >
                {index < activeStep ? '✓' : index + 1}
              </div>
              <span className="text-xs sm:text-sm text-center">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div 
            className="absolute top-0 h-1 bg-[var(--color-text-muted)]" 
            style={{ width: '100%' }}
          />
          <div 
            className="absolute top-0 h-1 bg-[var(--color-primary)]" 
            style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Form Error */}
      {formError && (
        <div className="mb-4 p-3 bg-[var(--color-error)] bg-opacity-10 text-[var(--color-error)] rounded-md">
          {formError}
        </div>
      )}
      
      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <BrandCard variant="elevated" className="mb-6">
          {renderStepContent(activeStep)}
        </BrandCard>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <BrandButton 
            type="button" 
            variant="outline" 
            onClick={handleBack}
            disabled={activeStep === 0 || isLoading}
          >
            Back
          </BrandButton>
          
          {activeStep < steps.length - 1 ? (
            <BrandButton 
              type="button" 
              variant="primary" 
              onClick={handleNext}
              disabled={isLoading}
            >
              Next
            </BrandButton>
          ) : (
            <BrandButton 
              type="submit" 
              variant="primary" 
              loading={isLoading}
              disabled={isLoading}
            >
              Submit
            </BrandButton>
          )}
        </div>
      </form>
    </div>
  );
};

export default BrandedIntakeForm; 