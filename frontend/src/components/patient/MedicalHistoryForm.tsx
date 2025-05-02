import React, { useState, useEffect } from 'react';
import { 
  Form,
  Input,
  Select,
  Button,
  Checkbox,
  Switch,
  DatePicker,
  Divider,
  Typography,
  Card,
  Space,
  Tooltip,
  message,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  MinusCircleOutlined, 
  InfoCircleOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
  HeartOutlined 
} from '@ant-design/icons';
import { useMedicalHistory } from '../../hooks/useMedicalHistory';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Types
interface MedicalCondition {
  name: string;
  icd_code?: string;
  severity?: string;
  is_controlled?: boolean;
  last_episode?: string;
  diagnosis_date?: string;
  notes?: string;
  dental_considerations?: string[];
}

interface Allergy {
  allergen: string;
  type: string;
  reaction: string;
  severity?: string;
  status?: string;
  onset_date?: string;
  notes?: string;
}

interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  prescribing_provider?: string;
  reason?: string;
  dental_considerations?: string[];
  notes?: string;
}

interface MedicalHistory {
  has_heart_disease: boolean;
  has_diabetes: boolean;
  has_hypertension: boolean;
  has_respiratory_disease: boolean;
  has_bleeding_disorder: boolean;
  current_smoker: boolean;
  pregnant: boolean;
  notes?: string;
  conditions: MedicalCondition[];
}

interface MedicalHistoryFormProps {
  patientId?: string;
  initialData?: any;
  onSubmit?: (formData: any) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit' | 'view';
}

const MedicalHistoryForm: React.FC<MedicalHistoryFormProps> = ({
  patientId,
  initialData,
  onSubmit,
  onCancel,
  mode = 'create'
}) => {
  const [form] = Form.useForm();
  const [medicationCount, setMedicationCount] = useState(0);
  const [allergyCount, setAllergyCount] = useState(0);
  const [conditionCount, setConditionCount] = useState(0);
  const [showPregnancy, setShowPregnancy] = useState(false);
  
  // Use our custom hook for medical history operations
  const { 
    loading, 
    error, 
    medicationAlerts,
    checkMedicationForAllergies,
    clearMedicationAlert,
    saveMedicalHistory,
    saveAllergies,
    saveMedications
  } = useMedicalHistory({ patientId });
  
  useEffect(() => {
    // Pre-fill form if initialData is provided
    if (initialData) {
      form.setFieldsValue({
        medical_history: initialData.medical_history || {
          has_heart_disease: false,
          has_diabetes: false,
          has_hypertension: false,
          has_respiratory_disease: false,
          has_bleeding_disorder: false,
          current_smoker: false,
          pregnant: false,
          conditions: []
        },
        allergies: initialData.allergies || [],
        medications: initialData.medications || []
      });
      
      // Set counters for dynamic fields
      setMedicationCount(initialData.medications?.length || 0);
      setAllergyCount(initialData.allergies?.length || 0);
      setConditionCount(initialData.medical_history?.conditions?.length || 0);
      
      // Set gender-specific fields
      if (initialData.gender === 'female') {
        setShowPregnancy(true);
      }
    }
  }, [initialData, form]);
  
  const handleSubmit = async (values: any) => {
    try {
      if (onSubmit) {
        onSubmit(values);
      } else if (patientId) {
        // If no onSubmit callback and patientId exists, submit directly using our hook
        if (mode === 'create') {
          // This would typically use a separate registration API
          message.info('Registration would be handled by a dedicated API endpoint');
        } else {
          // Update existing medical history
          if (values.medical_history) {
            await saveMedicalHistory(values.medical_history);
          }
          
          // Update allergies
          if (values.allergies && values.allergies.length > 0) {
            await saveAllergies(values.allergies);
          }
          
          // Update medications
          if (values.medications && values.medications.length > 0) {
            await saveMedications(values.medications);
          }
          
          message.success('Medical history updated successfully');
        }
      }
    } catch (error) {
      console.error('Error saving medical history:', error);
      message.error('Failed to save medical history');
    }
  };
  
  const handleMedicationChange = (medicationName: string, index: number) => {
    // Use our hook to check for allergies
    if (patientId && medicationName && medicationName.length >= 3) {
      checkMedicationForAllergies(medicationName, index);
    }
  };
  
  // Render helper functions
  const renderDentalConsiderationsField = (field: any, index: number, type: 'condition' | 'medication') => (
    <Form.List name={[field.name, 'dental_considerations']} initialValue={[]}>
      {(consideration_fields, { add: addConsideration, remove: removeConsideration }) => (
        <div style={{ marginBottom: 16 }}>
          <div>
            <Text strong>Dental Considerations</Text>
            <Button
              type="link"
              onClick={() => addConsideration()}
              icon={<PlusOutlined />}
              style={{ marginLeft: 8 }}
            >
              Add
            </Button>
          </div>
          {consideration_fields.map((consideration_field) => (
            <div key={consideration_field.key} style={{ display: 'flex', marginBottom: 8 }}>
              <Form.Item
                {...consideration_field}
                noStyle
              >
                <Input placeholder="E.g., Risk of excessive bleeding" style={{ width: '95%' }} />
              </Form.Item>
              <Button
                type="text"
                onClick={() => removeConsideration(consideration_field.name)}
                icon={<MinusCircleOutlined />}
                style={{ marginLeft: 8 }}
              />
            </div>
          ))}
        </div>
      )}
    </Form.List>
  );
  
  const isReadOnly = mode === 'view';
  
  // Main form render
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      disabled={isReadOnly}
    >
      {/* Show error if any */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}
      
      {/* Common Medical Conditions Section */}
      <Card 
        title={
          <Space>
            <HeartOutlined />
            <span>Common Medical Conditions</span>
          </Space>
        } 
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          name={['medical_history', 'has_heart_disease']}
          valuePropName="checked"
          initialValue={false}
        >
          <Checkbox>
            <Space>
              Heart Disease
              <Tooltip title="Including coronary artery disease, heart attack, heart failure, arrhythmias, etc.">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Checkbox>
        </Form.Item>
        
        <Form.Item
          name={['medical_history', 'has_diabetes']}
          valuePropName="checked"
          initialValue={false}
        >
          <Checkbox>
            <Space>
              Diabetes
              <Tooltip title="Type 1 or Type 2 diabetes mellitus">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Checkbox>
        </Form.Item>
        
        <Form.Item
          name={['medical_history', 'has_hypertension']}
          valuePropName="checked"
          initialValue={false}
        >
          <Checkbox>
            <Space>
              Hypertension (High Blood Pressure)
              <Tooltip title="Blood pressure consistently above 140/90 mmHg">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Checkbox>
        </Form.Item>
        
        <Form.Item
          name={['medical_history', 'has_respiratory_disease']}
          valuePropName="checked"
          initialValue={false}
        >
          <Checkbox>
            <Space>
              Respiratory Disease
              <Tooltip title="Including asthma, COPD, chronic bronchitis, emphysema, etc.">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Checkbox>
        </Form.Item>
        
        <Form.Item
          name={['medical_history', 'has_bleeding_disorder']}
          valuePropName="checked"
          initialValue={false}
        >
          <Checkbox>
            <Space>
              Bleeding Disorder
              <Tooltip title="Conditions affecting blood clotting, including hemophilia, von Willebrand disease, or use of anticoagulants">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Checkbox>
        </Form.Item>
        
        <Form.Item
          name={['medical_history', 'current_smoker']}
          valuePropName="checked"
          initialValue={false}
        >
          <Checkbox>
            <Space>
              Current Smoker
              <Tooltip title="Currently uses tobacco products">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Checkbox>
        </Form.Item>
        
        {showPregnancy && (
          <Form.Item
            name={['medical_history', 'pregnant']}
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>
              <Space>
                Currently Pregnant
                <Tooltip title="Special precautions may be needed for dental treatment">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            </Checkbox>
          </Form.Item>
        )}
        
        <Form.Item
          name={['medical_history', 'notes']}
          label="Additional Notes"
        >
          <TextArea rows={3} placeholder="Any additional information regarding the patient's medical history" />
        </Form.Item>
      </Card>
      
      {/* Medical Conditions Section */}
      <Card 
        title={
          <Space>
            <MedicineBoxOutlined />
            <span>Specific Medical Conditions</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form.List name={['medical_history', 'conditions']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Card 
                  key={field.key} 
                  size="small" 
                  style={{ marginBottom: 16 }}
                  title={`Condition #${index + 1}`}
                  extra={
                    <Button
                      type="text"
                      onClick={() => {
                        remove(field.name);
                        setConditionCount(prevCount => Math.max(0, prevCount - 1));
                      }}
                      icon={<MinusCircleOutlined />}
                      disabled={isReadOnly}
                    />
                  }
                >
                  <Form.Item
                    label="Condition Name"
                    name={[field.name, 'name']}
                    rules={[{ required: true, message: 'Please enter the condition name' }]}
                  >
                    <Input placeholder="E.g., Type 2 Diabetes, Asthma, etc." />
                  </Form.Item>
                  
                  <Form.Item
                    label="ICD Code (if known)"
                    name={[field.name, 'icd_code']}
                  >
                    <Input placeholder="E.g., E11.9" />
                  </Form.Item>
                  
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Form.Item
                      label="Severity"
                      name={[field.name, 'severity']}
                      style={{ width: '50%' }}
                    >
                      <Select placeholder="Select severity">
                        <Option value="mild">Mild</Option>
                        <Option value="moderate">Moderate</Option>
                        <Option value="severe">Severe</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      label="Is Controlled?"
                      name={[field.name, 'is_controlled']}
                      valuePropName="checked"
                      style={{ width: '50%' }}
                    >
                      <Switch />
                    </Form.Item>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Form.Item
                      label="Diagnosis Date"
                      name={[field.name, 'diagnosis_date']}
                      style={{ width: '50%' }}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="Last Episode/Flare-up"
                      name={[field.name, 'last_episode']}
                      style={{ width: '50%' }}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </div>
                  
                  <Form.Item
                    label="Notes"
                    name={[field.name, 'notes']}
                  >
                    <TextArea rows={2} placeholder="Additional details about this condition" />
                  </Form.Item>
                  
                  {renderDentalConsiderationsField(field, index, 'condition')}
                </Card>
              ))}
              
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                    setConditionCount(prevCount => prevCount + 1);
                  }}
                  icon={<PlusOutlined />}
                  block
                  disabled={isReadOnly}
                >
                  Add Medical Condition
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>
      
      {/* Allergies Section */}
      <Card 
        title={
          <Space>
            <AlertOutlined />
            <span>Allergies</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form.List name="allergies">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Card 
                  key={field.key} 
                  size="small" 
                  style={{ marginBottom: 16 }}
                  title={`Allergy #${index + 1}`}
                  extra={
                    <Button
                      type="text"
                      onClick={() => {
                        remove(field.name);
                        setAllergyCount(prevCount => Math.max(0, prevCount - 1));
                      }}
                      icon={<MinusCircleOutlined />}
                      disabled={isReadOnly}
                    />
                  }
                >
                  <Form.Item
                    label="Allergen"
                    name={[field.name, 'allergen']}
                    rules={[{ required: true, message: 'Please enter the allergen' }]}
                  >
                    <Input placeholder="E.g., Penicillin, Latex, Peanuts, etc." />
                  </Form.Item>
                  
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Form.Item
                      label="Type"
                      name={[field.name, 'type']}
                      style={{ width: '50%' }}
                      initialValue="MEDICATION"
                    >
                      <Select placeholder="Select type">
                        <Option value="MEDICATION">Medication</Option>
                        <Option value="FOOD">Food</Option>
                        <Option value="ENVIRONMENTAL">Environmental</Option>
                        <Option value="LATEX">Latex</Option>
                        <Option value="CONTRAST">Contrast</Option>
                        <Option value="OTHER">Other</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      label="Reaction"
                      name={[field.name, 'reaction']}
                      style={{ width: '50%' }}
                      initialValue="UNKNOWN"
                    >
                      <Select placeholder="Select reaction">
                        <Option value="ANAPHYLAXIS">Anaphylaxis</Option>
                        <Option value="RASH">Rash</Option>
                        <Option value="HIVES">Hives</Option>
                        <Option value="SWELLING">Swelling</Option>
                        <Option value="RESPIRATORY">Respiratory</Option>
                        <Option value="GI">GI Issues</Option>
                        <Option value="UNKNOWN">Unknown</Option>
                        <Option value="OTHER">Other</Option>
                      </Select>
                    </Form.Item>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Form.Item
                      label="Severity"
                      name={[field.name, 'severity']}
                      style={{ width: '50%' }}
                      initialValue="moderate"
                    >
                      <Select placeholder="Select severity">
                        <Option value="mild">Mild</Option>
                        <Option value="moderate">Moderate</Option>
                        <Option value="severe">Severe</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      label="Status"
                      name={[field.name, 'status']}
                      style={{ width: '50%' }}
                      initialValue="ACTIVE"
                    >
                      <Select placeholder="Select status">
                        <Option value="ACTIVE">Active</Option>
                        <Option value="INACTIVE">Inactive</Option>
                        <Option value="RESOLVED">Resolved</Option>
                      </Select>
                    </Form.Item>
                  </div>
                  
                  <Form.Item
                    label="Onset Date"
                    name={[field.name, 'onset_date']}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <Form.Item
                    label="Notes"
                    name={[field.name, 'notes']}
                  >
                    <TextArea rows={2} placeholder="Additional details about this allergy" />
                  </Form.Item>
                </Card>
              ))}
              
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                    setAllergyCount(prevCount => prevCount + 1);
                  }}
                  icon={<PlusOutlined />}
                  block
                  disabled={isReadOnly}
                >
                  Add Allergy
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>
      
      {/* Medications Section */}
      <Card 
        title={
          <Space>
            <MedicineBoxOutlined />
            <span>Medications</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {/* Show medication allergy alerts */}
        {medicationAlerts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {medicationAlerts.map((alert, idx) => (
              <Alert
                key={idx}
                message="Medication Allergy Detected"
                description={
                  <div>
                    <p><strong>Medication:</strong> {alert.medicationName}</p>
                    <p><strong>Patient is allergic to:</strong> {alert.allergen}</p>
                    <p><strong>Reaction:</strong> {alert.reaction}</p>
                    <p><strong>Severity:</strong> {alert.severity}</p>
                    {alert.note && <p><strong>Note:</strong> {alert.note}</p>}
                  </div>
                }
                type="error"
                showIcon
                closable
                onClose={() => clearMedicationAlert(alert.index)}
                style={{ marginBottom: 10 }}
              />
            ))}
          </div>
        )}
        
        <Form.List name="medications">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Card 
                  key={field.key} 
                  size="small" 
                  style={{ marginBottom: 16 }}
                  title={`Medication #${index + 1}`}
                  extra={
                    <Button
                      type="text"
                      onClick={() => {
                        remove(field.name);
                        setMedicationCount(prevCount => Math.max(0, prevCount - 1));
                      }}
                      icon={<MinusCircleOutlined />}
                      disabled={isReadOnly}
                    />
                  }
                >
                  <Form.Item
                    label="Medication Name"
                    name={[field.name, 'name']}
                    rules={[{ required: true, message: 'Please enter the medication name' }]}
                  >
                    <Input 
                      placeholder="E.g., Metformin, Lisinopril, etc." 
                      onChange={(e) => handleMedicationChange(e.target.value, index)}
                    />
                  </Form.Item>
                  
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Form.Item
                      label="Dosage"
                      name={[field.name, 'dosage']}
                      style={{ width: '50%' }}
                    >
                      <Input placeholder="E.g., 500mg" />
                    </Form.Item>
                    
                    <Form.Item
                      label="Frequency"
                      name={[field.name, 'frequency']}
                      style={{ width: '50%' }}
                    >
                      <Input placeholder="E.g., twice daily" />
                    </Form.Item>
                  </div>
                  
                  <Form.Item
                    label="Type"
                    name={[field.name, 'type']}
                    initialValue="PRESCRIPTION"
                  >
                    <Select placeholder="Select type">
                      <Option value="PRESCRIPTION">Prescription</Option>
                      <Option value="OTC">Over-the-Counter</Option>
                      <Option value="HERBAL">Herbal</Option>
                      <Option value="SUPPLEMENT">Supplement</Option>
                      <Option value="OTHER">Other</Option>
                    </Select>
                  </Form.Item>
                  
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Form.Item
                      label="Start Date"
                      name={[field.name, 'start_date']}
                      style={{ width: '50%' }}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="End Date (if applicable)"
                      name={[field.name, 'end_date']}
                      style={{ width: '50%' }}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </div>
                  
                  <Form.Item
                    label="Prescribing Provider"
                    name={[field.name, 'prescribing_provider']}
                  >
                    <Input placeholder="E.g., Dr. Smith" />
                  </Form.Item>
                  
                  <Form.Item
                    label="Reason for Medication"
                    name={[field.name, 'reason']}
                  >
                    <Input placeholder="E.g., Diabetes management" />
                  </Form.Item>
                  
                  <Form.Item
                    label="Notes"
                    name={[field.name, 'notes']}
                  >
                    <TextArea rows={2} placeholder="Additional details about this medication" />
                  </Form.Item>
                  
                  {renderDentalConsiderationsField(field, index, 'medication')}
                </Card>
              ))}
              
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                    setMedicationCount(prevCount => prevCount + 1);
                  }}
                  icon={<PlusOutlined />}
                  block
                  disabled={isReadOnly}
                >
                  Add Medication
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>
      
      {/* Form Actions */}
      {!isReadOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {onCancel && (
            <Button onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Medical History
          </Button>
        </div>
      )}
    </Form>
  );
};

export default MedicalHistoryForm; 