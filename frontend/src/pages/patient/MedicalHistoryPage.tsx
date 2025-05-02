import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb, Spin, Alert, Card, Tabs, Tag, Space } from 'antd';
import { MedicineBoxOutlined, HeartOutlined, AlertOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useMedicalHistory } from '../../hooks/useMedicalHistory';
import MedicalHistoryForm from '../../components/patient/MedicalHistoryForm';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const MedicalHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('form');
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  // Use our custom hook for medical history data and operations
  const { 
    loading, 
    error, 
    medicalProfile,
    alerts,
    fetchMedicalProfile,
    saveMedicalHistory,
    saveAllergies,
    saveMedications
  } = useMedicalHistory({ patientId });
  
  const handleFormSubmit = async (formData: any) => {
    try {
      // Update medical history
      if (formData.medical_history) {
        await saveMedicalHistory(formData.medical_history);
      }
      
      // Update allergies if provided
      if (formData.allergies && formData.allergies.length > 0) {
        await saveAllergies(formData.allergies);
      }
      
      // Update medications if provided
      if (formData.medications && formData.medications.length > 0) {
        await saveMedications(formData.medications);
      }
      
      // Navigate to summary tab
      setActiveTab('summary');
    } catch (err) {
      console.error('Error saving medical history:', err);
    }
  };
  
  const handleBackToPatient = () => {
    navigate(`/patients/${patientId}`);
  };
  
  if (loading && !medicalProfile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" tip="Loading patient data..." />
      </div>
    );
  }
  
  const patientData = medicalProfile?.patient;
  const patientFullName = patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Patient';
  
  return (
    <div className="patient-medical-history-page">
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a onClick={handleBackToPatient}>Patients</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <a onClick={handleBackToPatient}>{patientFullName}</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Medical History</Breadcrumb.Item>
      </Breadcrumb>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <HeartOutlined style={{ marginRight: 8 }} />
          Medical History
        </Title>
        <div>
          <Text>Patient: </Text>
          <Text strong>{patientFullName}</Text>
          {patientData?.date_of_birth && (
            <Text type="secondary" style={{ marginLeft: 8 }}>
              DOB: {new Date(patientData.date_of_birth).toLocaleDateString()}
            </Text>
          )}
        </div>
      </div>
      
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
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        style={{ marginBottom: 16 }}
      >
        <TabPane 
          tab={
            <span>
              <HeartOutlined />
              Medical History Form
            </span>
          } 
          key="form"
        >
          <MedicalHistoryForm 
            patientId={patientId}
            initialData={medicalProfile}
            onSubmit={handleFormSubmit}
            mode="edit"
          />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <InfoCircleOutlined />
              Summary
            </span>
          } 
          key="summary"
          disabled={!medicalProfile}
        >
          <MedicalSummary patientData={medicalProfile} />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <AlertOutlined />
              Alerts & Considerations
            </span>
          } 
          key="alerts"
          disabled={!medicalProfile}
        >
          <MedicalAlerts alerts={alerts} />
        </TabPane>
      </Tabs>
    </div>
  );
};

// Helper component for medical summary tab
const MedicalSummary: React.FC<{ patientData: any }> = ({ patientData }) => {
  if (!patientData) return null;
  
  const medicalHistory = patientData.medical_history || {};
  const conditions = medicalHistory.conditions || [];
  const allergies = patientData.allergies || [];
  const medications = patientData.medications || [];
  
  const getMedicalStatusItems = () => {
    const items = [];
    
    if (medicalHistory.has_heart_disease) 
      items.push({ label: 'Heart Disease', color: 'red' });
    if (medicalHistory.has_diabetes) 
      items.push({ label: 'Diabetes', color: 'orange' });
    if (medicalHistory.has_hypertension) 
      items.push({ label: 'Hypertension', color: 'orange' });
    if (medicalHistory.has_respiratory_disease) 
      items.push({ label: 'Respiratory Disease', color: 'blue' });
    if (medicalHistory.has_bleeding_disorder) 
      items.push({ label: 'Bleeding Disorder', color: 'red' });
    if (medicalHistory.current_smoker) 
      items.push({ label: 'Smoker', color: 'volcano' });
    if (medicalHistory.pregnant) 
      items.push({ label: 'Pregnant', color: 'purple' });
    
    return items;
  };
  
  return (
    <div className="medical-summary">
      <Card title="Medical Status" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          {getMedicalStatusItems().length > 0 ? (
            <Space wrap>
              {getMedicalStatusItems().map((item, index) => (
                <Tag key={index} color={item.color}>{item.label}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">No significant medical conditions reported</Text>
          )}
        </div>
        
        {medicalHistory.notes && (
          <div>
            <Text strong>Notes:</Text>
            <p>{medicalHistory.notes}</p>
          </div>
        )}
      </Card>
      
      <Card title="Medical Conditions" style={{ marginBottom: 16 }}>
        {conditions.length > 0 ? (
          <div className="conditions-list">
            {conditions.map((condition: any, index: number) => (
              <Card 
                key={index} 
                size="small" 
                title={condition.name}
                style={{ marginBottom: 8 }}
                extra={
                  <Tag color={condition.is_controlled ? 'green' : 'orange'}>
                    {condition.is_controlled ? 'Controlled' : 'Not Controlled'}
                  </Tag>
                }
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    {condition.icd_code && <p><Text strong>ICD Code:</Text> {condition.icd_code}</p>}
                    {condition.severity && <p><Text strong>Severity:</Text> {condition.severity}</p>}
                  </div>
                  <div>
                    {condition.diagnosis_date && <p><Text strong>Diagnosed:</Text> {new Date(condition.diagnosis_date).toLocaleDateString()}</p>}
                    {condition.last_episode && <p><Text strong>Last Episode:</Text> {new Date(condition.last_episode).toLocaleDateString()}</p>}
                  </div>
                </div>
                
                {condition.dental_considerations && condition.dental_considerations.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Dental Considerations:</Text>
                    <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                      {condition.dental_considerations.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {condition.notes && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Notes:</Text>
                    <p>{condition.notes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Text type="secondary">No specific medical conditions recorded</Text>
        )}
      </Card>
      
      <Card title="Allergies" style={{ marginBottom: 16 }}>
        {allergies.length > 0 ? (
          <div className="allergies-list">
            {allergies.map((allergy: any, index: number) => (
              <Card 
                key={index} 
                size="small" 
                title={allergy.allergen}
                style={{ marginBottom: 8 }}
                extra={
                  <Tag color={allergy.severity === 'severe' ? 'red' : allergy.severity === 'moderate' ? 'orange' : 'green'}>
                    {allergy.severity}
                  </Tag>
                }
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p><Text strong>Type:</Text> {allergy.type.replace('_', ' ')}</p>
                  <p><Text strong>Reaction:</Text> {allergy.reaction}</p>
                </div>
                
                {allergy.notes && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Notes:</Text>
                    <p>{allergy.notes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Text type="secondary">No allergies recorded</Text>
        )}
      </Card>
      
      <Card title="Medications" style={{ marginBottom: 16 }}>
        {medications.length > 0 ? (
          <div className="medications-list">
            {medications.map((medication: any, index: number) => (
              <Card 
                key={index} 
                size="small" 
                title={medication.name}
                style={{ marginBottom: 8 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    {medication.dosage && <p><Text strong>Dosage:</Text> {medication.dosage}</p>}
                    {medication.frequency && <p><Text strong>Frequency:</Text> {medication.frequency}</p>}
                  </div>
                  <div>
                    {medication.type && <p><Text strong>Type:</Text> {medication.type.replace('_', ' ')}</p>}
                    {medication.reason && <p><Text strong>Reason:</Text> {medication.reason}</p>}
                  </div>
                </div>
                
                {medication.dental_considerations && medication.dental_considerations.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Dental Considerations:</Text>
                    <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                      {medication.dental_considerations.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {medication.notes && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Notes:</Text>
                    <p>{medication.notes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Text type="secondary">No medications recorded</Text>
        )}
      </Card>
    </div>
  );
};

// Helper component for alerts tab
const MedicalAlerts: React.FC<{ alerts: any[] }> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <Alert 
        message="No Alerts" 
        description="No medical alerts have been identified for this patient." 
        type="info" 
        showIcon 
      />
    );
  }
  
  const getAlertType = (type: string, severity: string) => {
    if (severity === 'high') return 'error';
    if (severity === 'medium') return 'warning';
    return 'info';
  };
  
  return (
    <div className="medical-alerts">
      <Title level={4}>Medical Alerts & Considerations</Title>
      <div className="alerts-list">
        {alerts.map((alert, index) => (
          <Alert
            key={index}
            message={alert.description}
            description={
              <div>
                {alert.considerations && <p><Text strong>Considerations:</Text> {alert.considerations}</p>}
                {alert.reaction && <p><Text strong>Reaction:</Text> {alert.reaction}</p>}
              </div>
            }
            type={getAlertType(alert.type, alert.severity)}
            showIcon
            style={{ marginBottom: 12 }}
          />
        ))}
      </div>
    </div>
  );
};

export default MedicalHistoryPage; 