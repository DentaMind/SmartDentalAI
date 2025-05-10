import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  patientAPI, 
  imagingAPI, 
  diagnosisAPI, 
  treatmentAPI,
  prescriptionsAPI,
  perioAPI,
  riskAPI
} from '../lib/api';

const PatientPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [images, setImages] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [perioCharts, setPerioCharts] = useState([]);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch patient details - using getSamplePatients as fallback for now
        const patientsResponse = await patientAPI.getSamplePatients();
        const patientData = patientsResponse.data.find(p => p.id.toString() === id.toString());
        
        if (!patientData) {
          setError('Patient not found');
          setLoading(false);
          return;
        }
        
        setPatient(patientData);
        
        // Fetch related data in parallel
        const fetchTasks = [
          imagingAPI.getImageHistory(id).then(res => setImages(res.data)).catch(() => setImages([])),
          diagnosisAPI.getDiagnosisHistory(id).then(res => setDiagnoses(res.data.diagnoses || [])).catch(() => setDiagnoses([])),
          treatmentAPI.getTreatmentPlans(id).then(res => setTreatmentPlans(res.data.treatment_plans || [])).catch(() => setTreatmentPlans([])),
          prescriptionsAPI.getPrescriptions(id).then(res => setPrescriptions(res.data.prescriptions || [])).catch(() => setPrescriptions([])),
          perioAPI.getPerioCharts(id).then(res => setPerioCharts(res.data || [])).catch(() => setPerioCharts([])),
          riskAPI.getRiskHistory(id).then(res => setRiskAssessments(res.data || [])).catch(() => setRiskAssessments([]))
        ];
        
        await Promise.allSettled(fetchTasks);
        
        setError(null);
      } catch (err) {
        console.error('Error loading patient data:', err);
        setError('Failed to load patient data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [id, navigate]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'images':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">X-Ray Images</h3>
            {images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map(image => (
                  <div key={image.id} className="border rounded-md p-4">
                    <h4 className="font-medium">{image.image_type}</h4>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(image.upload_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {image.analyzed ? 'Analyzed' : 'Pending Analysis'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No images available</p>
            )}
          </div>
        );
        
      case 'diagnoses':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Diagnosis History</h3>
            {diagnoses.length > 0 ? (
              <div className="space-y-4">
                {diagnoses.map(diagnosis => (
                  <div key={diagnosis.id} className="border rounded-md p-4">
                    <h4 className="font-medium">
                      {new Date(diagnosis.date).toLocaleDateString()} - {diagnosis.xray_type}
                    </h4>
                    <p className="text-sm text-gray-600 mt-2">
                      {diagnosis.summary}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No diagnoses available</p>
            )}
          </div>
        );
        
      case 'treatments':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Treatment Plans</h3>
            {treatmentPlans.length > 0 ? (
              <div className="space-y-4">
                {treatmentPlans.map(plan => (
                  <div key={plan.id} className="border rounded-md p-4">
                    <h4 className="font-medium">{plan.name}</h4>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(plan.created_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {plan.status}
                    </p>
                    <div className="mt-2">
                      <h5 className="text-sm font-medium">Treatments:</h5>
                      <ul className="list-disc pl-5 mt-1">
                        {plan.treatments.map(treatment => (
                          <li key={treatment.id} className="text-sm">
                            Tooth {treatment.tooth}: {treatment.procedure} ({treatment.status})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No treatment plans available</p>
            )}
          </div>
        );
      
      case 'prescriptions':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Prescriptions</h3>
            {prescriptions.length > 0 ? (
              <div className="space-y-4">
                {prescriptions.map(rx => (
                  <div key={rx.id} className="border rounded-md p-4">
                    <h4 className="font-medium">{rx.medication}</h4>
                    <p className="text-sm text-gray-600">
                      {rx.dosage}, {rx.frequency}, {rx.duration}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(rx.prescription_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Doctor: {rx.prescribing_doctor}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Reason: {rx.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No prescriptions available</p>
            )}
          </div>
        );
        
      default:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Patient Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Info Card */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold mb-3">Patient Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {patient?.name}</p>
                  <p><span className="font-medium">Email:</span> {patient?.email}</p>
                  <p><span className="font-medium">Phone:</span> {patient?.phone}</p>
                </div>
              </div>
              
              {/* Stats Card */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold mb-3">Patient Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-md">
                    <p className="text-2xl font-bold text-blue-700">{images.length}</p>
                    <p className="text-sm text-gray-600">X-rays</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <p className="text-2xl font-bold text-green-700">{diagnoses.length}</p>
                    <p className="text-sm text-gray-600">Diagnoses</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-md">
                    <p className="text-2xl font-bold text-purple-700">{treatmentPlans.length}</p>
                    <p className="text-sm text-gray-600">Treatment Plans</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-md">
                    <p className="text-2xl font-bold text-yellow-700">{prescriptions.length}</p>
                    <p className="text-sm text-gray-600">Prescriptions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading patient data...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{patient?.name}</h1>
        <p className="text-gray-600">
          Patient ID: {patient?.id}
        </p>
      </header>
      
      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'images', 'diagnoses', 'treatments', 'prescriptions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="py-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PatientPage; 