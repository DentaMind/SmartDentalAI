import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTreatment } from '../../contexts/TreatmentContext';

// This component is a placeholder for the purchased periodontal chart UI
// It will be replaced with the actual integration when the UI is purchased
const PerioChart = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { authAxios } = useAuth();
  const { connectPerioData } = useTreatment();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  useEffect(() => {
    if (!patientId) {
      // If no patientId in URL, we need to select a patient first
      setLoading(false);
      return;
    }
    
    // Fetch patient data
    const fetchPatient = async () => {
      try {
        const response = await authAxios.get(`/patients/${patientId}`);
        setPatient(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch patient:', err);
        setError('Failed to load patient data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchPatient();
  }, [patientId, authAxios]);
  
  const handlePatientSelect = () => {
    // In a real implementation, this would open a patient search modal
    // For now, we'll just navigate to a dummy patient
    navigate('/perio-chart/12345');
  };
  
  const handleSaveChart = () => {
    // This would save the periodontal chart data to the backend
    alert('Periodontal chart saved successfully!');
  };
  
  const handleCompareWithPrevious = () => {
    // This would open a comparison view with previous perio charts
    alert('Comparison feature will be implemented with the purchased UI');
  };
  
  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };
  
  if (loading) {
    return (
      <div className="col-lg-12">
        <div className="card">
          <div className="card-header">
            <strong className="card-title">Periodontal Chart</strong>
          </div>
          <div className="card-body">
            <p>Loading periodontal chart...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="col-lg-12">
        <div className="card">
          <div className="card-header">
            <strong className="card-title">Periodontal Chart</strong>
          </div>
          <div className="card-body">
            <div className="alert alert-danger">{error}</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="col-lg-12">
      <div className="card">
        <div className="card-header">
          <strong className="card-title">
            Periodontal Chart {patient && `- ${patient.first_name} ${patient.last_name}`}
          </strong>
          <div className="float-right">
            {patient ? (
              <>
                <button className="btn btn-primary btn-sm mr-2" onClick={handleSaveChart}>
                  <i className="fa fa-save"></i> Save Chart
                </button>
                <button className="btn btn-info btn-sm" onClick={handleCompareWithPrevious}>
                  <i className="fa fa-exchange"></i> Compare with Previous
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handlePatientSelect}>
                <i className="fa fa-user"></i> Select Patient
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          {!patient ? (
            <div className="alert alert-info">
              Please select a patient to view or create a periodontal chart.
            </div>
          ) : (
            <>
              {/* Chart Controls */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="chartDate">Chart Date</label>
                    <input 
                      type="date" 
                      id="chartDate" 
                      className="form-control"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={handleDateChange}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="chartType">Chart Type</label>
                    <select id="chartType" className="form-control">
                      <option value="complete">Complete Exam</option>
                      <option value="partial">Partial Exam</option>
                      <option value="follow-up">Follow-up</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="examinedBy">Examined By</label>
                    <select id="examinedBy" className="form-control">
                      <option value="dr1">Dr. Smith</option>
                      <option value="dr2">Dr. Johnson</option>
                      <option value="hygienist1">Jane (Hygienist)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Placeholder for Purchased Perio Chart UI */}
              <div className="perio-chart-placeholder border p-4 text-center">
                <h3 className="mb-4">Periodontal Chart</h3>
                <p className="mb-4">
                  This is a placeholder for the purchased periodontal chart UI. 
                  In the actual implementation, the UI will be integrated here.
                </p>
                <div className="row">
                  <div className="col-md-12 text-center mb-4">
                    <div className="d-inline-block p-3 bg-light border">
                      <strong>Universal Numbering System (1-32)</strong>
                      <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                        <div className="mb-2">
                          <span className="mr-1">Maxillary: </span>
                          <span className="border px-1 mx-1">1</span>
                          <span className="border px-1 mx-1">2</span>
                          <span className="border px-1 mx-1">3</span>
                          <span className="border px-1 mx-1">4</span>
                          <span className="border px-1 mx-1">...</span>
                          <span className="border px-1 mx-1">13</span>
                          <span className="border px-1 mx-1">14</span>
                          <span className="border px-1 mx-1">15</span>
                          <span className="border px-1 mx-1">16</span>
                        </div>
                        <div>
                          <span className="mr-1">Mandibular: </span>
                          <span className="border px-1 mx-1">32</span>
                          <span className="border px-1 mx-1">31</span>
                          <span className="border px-1 mx-1">30</span>
                          <span className="border px-1 mx-1">29</span>
                          <span className="border px-1 mx-1">...</span>
                          <span className="border px-1 mx-1">20</span>
                          <span className="border px-1 mx-1">19</span>
                          <span className="border px-1 mx-1">18</span>
                          <span className="border px-1 mx-1">17</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <strong>Probing Depths</strong>
                      </div>
                      <div className="card-body">
                        <p>Record probing depths for each tooth at 6 sites:</p>
                        <ul className="text-left">
                          <li>Mesial, Middle, Distal on Buccal/Facial</li>
                          <li>Mesial, Middle, Distal on Lingual/Palatal</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <strong>Clinical Indicators</strong>
                      </div>
                      <div className="card-body">
                        <p>Record for each relevant site:</p>
                        <ul className="text-left">
                          <li>Bleeding on Probing (BOP)</li>
                          <li>Plaque</li>
                          <li>Recession</li>
                          <li>Mobility (0-3)</li>
                          <li>Furcation (I, II, III)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Statistics Summary (would be auto-calculated in real implementation) */}
              <div className="row mt-4">
                <div className="col-md-12">
                  <div className="card">
                    <div className="card-header">
                      <strong>Summary Statistics</strong>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-3">
                          <div className="stat-card p-2 border text-center">
                            <h5>Bleeding Index</h5>
                            <h3 className="text-danger">---%</h3>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="stat-card p-2 border text-center">
                            <h5>Plaque Index</h5>
                            <h3 className="text-warning">---%</h3>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="stat-card p-2 border text-center">
                            <h5>Avg. Pocket Depth</h5>
                            <h3 className="text-primary">--- mm</h3>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="stat-card p-2 border text-center">
                            <h5>Sites > 4mm</h5>
                            <h3 className="text-info">---</h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerioChart; 