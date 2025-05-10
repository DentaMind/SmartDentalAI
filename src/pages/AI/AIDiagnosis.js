import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTreatment } from '../../contexts/TreatmentContext';

// This component is a placeholder for the AI Diagnosis and Treatment Suggestions feature
const AIDiagnosis = ({ suggestions = false }) => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { authAxios } = useAuth();
  const { getAITreatmentSuggestions } = useTreatment();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagnosisResults, setDiagnosisResults] = useState(null);
  const [patient, setPatient] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedImage(file);
    setSelectedImageUrl(URL.createObjectURL(file));
  };
  
  const handlePatientSelect = () => {
    // In a real implementation, this would open a patient search modal
    // For now, we'll just navigate to a dummy patient
    navigate(suggestions ? '/ai/treatment-suggestions/12345' : '/ai/diagnosis/12345');
  };
  
  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      alert('Please select an image to analyze');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call to analyze the image
      // In a real implementation, this would be an actual API call to your backend
      setTimeout(() => {
        // Mock response for demo purposes
        const mockDiagnosisResults = {
          confidence: 0.89,
          findings: [
            {
              description: 'Potential caries detected on tooth #14 (distal surface)',
              confidence: 0.92,
              severity: 'Moderate',
              recommendations: [
                'Radiographic evaluation',
                'Consider restoration if confirmed'
              ]
            },
            {
              description: 'Early stage periodontal disease detected',
              confidence: 0.87,
              severity: 'Mild',
              recommendations: [
                'Scaling and root planing',
                'Improve oral hygiene'
              ]
            }
          ],
          suggestedTreatments: [
            {
              cdt_code: 'D2150',
              description: 'Amalgam restoration - two surfaces',
              teeth: [14],
              confidence: 0.89
            },
            {
              cdt_code: 'D4341',
              description: 'Periodontal scaling and root planing - four or more teeth per quadrant',
              quadrants: ['UR'],
              confidence: 0.85
            },
            {
              cdt_code: 'D1110',
              description: 'Prophylaxis - adult',
              confidence: 0.95
            }
          ],
          evidenceLinks: [
            'https://pubmed.ncbi.nlm.nih.gov/12345678/',
            'https://pubmed.ncbi.nlm.nih.gov/87654321/'
          ]
        };
        
        setDiagnosisResults(mockDiagnosisResults);
        setLoading(false);
      }, 2000); // Simulate 2 second API call
    } catch (err) {
      console.error('Failed to analyze image:', err);
      setError('Failed to analyze image. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleGenerateTreatmentPlan = () => {
    navigate(`/patients/12345/treatment-plans/new`, { 
      state: { aiSuggestions: diagnosisResults.suggestedTreatments } 
    });
  };
  
  // UI for the main page
  return (
    <div className="col-lg-12">
      <div className="card">
        <div className="card-header">
          <strong className="card-title">
            {suggestions ? 'AI Treatment Suggestions' : 'AI Diagnosis'}
          </strong>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-12">
              {patientId ? (
                <div className="alert alert-info">
                  <strong>Patient:</strong> {patient ? `${patient.first_name} ${patient.last_name}` : `ID: ${patientId}`}
                </div>
              ) : (
                <div className="alert alert-warning">
                  <strong>No patient selected.</strong> Please select a patient to continue.
                  <button 
                    className="btn btn-primary btn-sm ml-3" 
                    onClick={handlePatientSelect}
                  >
                    <i className="fa fa-user"></i> Select Patient
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <strong>{suggestions ? 'Upload X-ray for Analysis' : 'Upload Image for Diagnosis'}</strong>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label htmlFor="imageUpload">
                      {suggestions 
                        ? 'Select an X-ray or intraoral photo to analyze' 
                        : 'Select an image to diagnose (X-ray, intraoral photo, etc.)'}
                    </label>
                    <input 
                      type="file" 
                      className="form-control-file" 
                      id="imageUpload" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                    />
                  </div>
                  
                  {selectedImageUrl && (
                    <div className="mt-3 text-center">
                      <img 
                        src={selectedImageUrl} 
                        alt="Selected for analysis" 
                        className="img-fluid"
                        style={{ maxHeight: '250px' }}
                      />
                    </div>
                  )}
                  
                  <div className="text-center mt-3">
                    <button 
                      className="btn btn-primary" 
                      onClick={handleAnalyzeImage}
                      disabled={!selectedImage || loading}
                    >
                      {loading ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i>
                          &nbsp;Analyzing...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-search"></i>
                          &nbsp;{suggestions ? 'Get Treatment Suggestions' : 'Analyze Image'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              {error ? (
                <div className="alert alert-danger">{error}</div>
              ) : diagnosisResults ? (
                <div className="card">
                  <div className="card-header">
                    <strong>
                      {suggestions ? 'AI Treatment Suggestions' : 'Diagnosis Results'}
                      &nbsp;
                      <small className="text-muted">
                        (Confidence: {(diagnosisResults.confidence * 100).toFixed(0)}%)
                      </small>
                    </strong>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <h5>Findings:</h5>
                      <ul className="list-group mb-3">
                        {diagnosisResults.findings.map((finding, index) => (
                          <li key={index} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{finding.description}</strong>
                              <span className="badge badge-primary">
                                {(finding.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className={`badge badge-${getSeverityBadge(finding.severity)}`}>
                                {finding.severity}
                              </span>
                            </div>
                            <div className="mt-2">
                              <strong>Recommendations:</strong>
                              <ul>
                                {finding.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {suggestions && (
                      <div>
                        <h5>Suggested Treatments:</h5>
                        <ul className="list-group mb-3">
                          {diagnosisResults.suggestedTreatments.map((treatment, index) => (
                            <li key={index} className="list-group-item">
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>{treatment.description}</strong>
                                <span className="badge badge-info">
                                  {treatment.cdt_code}
                                </span>
                              </div>
                              {treatment.teeth && (
                                <div className="mt-1">
                                  <small>Teeth: {treatment.teeth.join(', ')}</small>
                                </div>
                              )}
                              {treatment.quadrants && (
                                <div className="mt-1">
                                  <small>Quadrants: {treatment.quadrants.join(', ')}</small>
                                </div>
                              )}
                              <div className="mt-1">
                                <small>Confidence: {(treatment.confidence * 100).toFixed(0)}%</small>
                              </div>
                            </li>
                          ))}
                        </ul>
                        
                        <button 
                          className="btn btn-success btn-block" 
                          onClick={handleGenerateTreatmentPlan}
                        >
                          <i className="fa fa-file-text-o"></i>
                          &nbsp;Generate Treatment Plan
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <h5>Evidence & References:</h5>
                      <ul>
                        {diagnosisResults.evidenceLinks.map((link, index) => (
                          <li key={index}>
                            <a href={link} target="_blank" rel="noopener noreferrer">
                              PubMed Reference #{index + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="card-header">
                    <strong>AI Analysis Results</strong>
                  </div>
                  <div className="card-body text-center p-5">
                    <i className="fa fa-chart-bar fa-4x text-muted mb-3"></i>
                    <p className="lead">
                      {suggestions 
                        ? 'Upload an X-ray to get AI-powered treatment suggestions' 
                        : 'Upload an image to receive AI-powered diagnosis'}
                    </p>
                    <p className="text-muted">
                      {suggestions 
                        ? 'Our AI will analyze the image and suggest appropriate treatment options based on clinical evidence.' 
                        : 'Our AI will analyze the image and provide a detailed diagnosis with confidence scores.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine badge color based on severity
const getSeverityBadge = (severity) => {
  switch (severity.toLowerCase()) {
    case 'severe':
      return 'danger';
    case 'moderate':
      return 'warning';
    case 'mild':
      return 'info';
    default:
      return 'secondary';
  }
};

export default AIDiagnosis; 