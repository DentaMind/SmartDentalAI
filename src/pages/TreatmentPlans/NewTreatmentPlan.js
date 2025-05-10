import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTreatment, TreatmentCategories, TreatmentStatuses } from '../../contexts/TreatmentContext';

// This is a simplified version of the TreatmentBuilder that would integrate 
// with our TreatmentBuilderContainer component from earlier
const NewTreatmentPlan = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { authAxios } = useAuth();
  const { createTreatmentPlan } = useTreatment();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // Form state for the treatment plan
  const [planData, setPlanData] = useState({
    patient_id: patientId || '',
    title: '',
    category: TreatmentCategories.MEDICAL,
    description: '',
    status: TreatmentStatuses.PROPOSED,
    total_estimated_cost: 0,
    visits: [
      {
        visit_number: 1,
        title: 'Initial Visit',
        duration: 60,
        status: 'Pending',
        procedures: []
      }
    ]
  });
  
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
    navigate('/patients/12345/treatment-plans/new');
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPlanData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleVisitChange = (index, field, value) => {
    setPlanData(prev => {
      const updatedVisits = [...prev.visits];
      updatedVisits[index] = {
        ...updatedVisits[index],
        [field]: value
      };
      return {
        ...prev,
        visits: updatedVisits
      };
    });
  };
  
  const addVisit = () => {
    setPlanData(prev => ({
      ...prev,
      visits: [
        ...prev.visits,
        {
          visit_number: prev.visits.length + 1,
          title: `Visit ${prev.visits.length + 1}`,
          duration: 60,
          status: 'Pending',
          procedures: []
        }
      ]
    }));
  };
  
  const removeVisit = (index) => {
    if (planData.visits.length <= 1) {
      alert('You must have at least one visit in the treatment plan.');
      return;
    }
    
    setPlanData(prev => {
      const updatedVisits = prev.visits.filter((_, i) => i !== index);
      // Renumber visits
      updatedVisits.forEach((visit, i) => {
        visit.visit_number = i + 1;
        visit.title = `Visit ${i + 1}`;
      });
      
      return {
        ...prev,
        visits: updatedVisits
      };
    });
  };
  
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newPlan = await createTreatmentPlan(planData);
      if (newPlan) {
        alert('Treatment plan created successfully!');
        navigate(`/patients/${patientId}/treatment-plans/${newPlan.id}`);
      }
    } catch (err) {
      console.error('Failed to create treatment plan:', err);
      setError('Failed to create treatment plan. Please try again later.');
    }
  };
  
  if (loading) {
    return (
      <div className="col-lg-12">
        <div className="card">
          <div className="card-header">
            <strong className="card-title">New Treatment Plan</strong>
          </div>
          <div className="card-body">
            <p>Loading...</p>
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
            <strong className="card-title">New Treatment Plan</strong>
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
            New Treatment Plan {patient && `- ${patient.first_name} ${patient.last_name}`}
          </strong>
        </div>
        <div className="card-body">
          {!patient ? (
            <div>
              <div className="alert alert-info">
                Please select a patient to create a treatment plan.
              </div>
              <button className="btn btn-primary" onClick={handlePatientSelect}>
                <i className="fa fa-user"></i> Select Patient
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Stepper */}
              <div className="bs-stepper">
                <div className="bs-stepper-header mb-4" role="tablist">
                  <div className={`step ${activeStep === 0 ? 'active' : ''}`}>
                    <button type="button" className="step-trigger">
                      <span className="bs-stepper-circle">1</span>
                      <span className="bs-stepper-label">Plan Information</span>
                    </button>
                  </div>
                  <div className="line"></div>
                  <div className={`step ${activeStep === 1 ? 'active' : ''}`}>
                    <button type="button" className="step-trigger">
                      <span className="bs-stepper-circle">2</span>
                      <span className="bs-stepper-label">Visit Planning</span>
                    </button>
                  </div>
                  <div className="line"></div>
                  <div className={`step ${activeStep === 2 ? 'active' : ''}`}>
                    <button type="button" className="step-trigger">
                      <span className="bs-stepper-circle">3</span>
                      <span className="bs-stepper-label">Review & Create</span>
                    </button>
                  </div>
                </div>
                
                <div className="bs-stepper-content">
                  {/* Step 1: Plan Information */}
                  {activeStep === 0 && (
                    <div id="plan-info" role="tabpanel">
                      <div className="form-group">
                        <label htmlFor="title">Treatment Plan Title</label>
                        <input
                          type="text"
                          className="form-control"
                          id="title"
                          name="title"
                          value={planData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Full Mouth Rehabilitation"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                          className="form-control"
                          id="category"
                          name="category"
                          value={planData.category}
                          onChange={handleInputChange}
                          required
                        >
                          {Object.values(TreatmentCategories).map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                          className="form-control"
                          id="description"
                          name="description"
                          value={planData.description}
                          onChange={handleInputChange}
                          rows="3"
                          placeholder="Enter a detailed description of the treatment plan"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select
                          className="form-control"
                          id="status"
                          name="status"
                          value={planData.status}
                          onChange={handleInputChange}
                          required
                        >
                          {Object.values(TreatmentStatuses).map(status => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        type="button"
                        className="btn btn-primary float-right"
                        onClick={handleNext}
                      >
                        Next <i className="fa fa-arrow-right"></i>
                      </button>
                    </div>
                  )}
                  
                  {/* Step 2: Visit Planning */}
                  {activeStep === 1 && (
                    <div id="visit-planning" role="tabpanel">
                      <h5 className="mb-3">Plan Visits</h5>
                      
                      {planData.visits.map((visit, index) => (
                        <div key={index} className="card mb-3">
                          <div className="card-header">
                            <strong>{visit.title}</strong>
                            {planData.visits.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm float-right"
                                onClick={() => removeVisit(index)}
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            )}
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-6">
                                <div className="form-group">
                                  <label htmlFor={`visit-title-${index}`}>Visit Title</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id={`visit-title-${index}`}
                                    value={visit.title}
                                    onChange={(e) => handleVisitChange(index, 'title', e.target.value)}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-group">
                                  <label htmlFor={`visit-duration-${index}`}>Duration (minutes)</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    id={`visit-duration-${index}`}
                                    value={visit.duration}
                                    onChange={(e) => handleVisitChange(index, 'duration', parseInt(e.target.value))}
                                    min="15"
                                    step="15"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="form-group">
                              <label>Procedures</label>
                              <p className="text-muted">
                                Procedures will be added in the next phase after creating the plan.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        className="btn btn-outline-primary mb-3"
                        onClick={addVisit}
                      >
                        <i className="fa fa-plus"></i> Add Another Visit
                      </button>
                      
                      <div className="d-flex justify-content-between">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleBack}
                        >
                          <i className="fa fa-arrow-left"></i> Back
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleNext}
                        >
                          Next <i className="fa fa-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 3: Review & Create */}
                  {activeStep === 2 && (
                    <div id="review-create" role="tabpanel">
                      <h5 className="mb-3">Review Treatment Plan</h5>
                      
                      <div className="card mb-3">
                        <div className="card-header">
                          <strong>Plan Summary</strong>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6">
                              <p><strong>Title:</strong> {planData.title}</p>
                              <p><strong>Category:</strong> {planData.category}</p>
                              <p><strong>Status:</strong> {planData.status}</p>
                            </div>
                            <div className="col-md-6">
                              <p><strong>Patient:</strong> {patient.first_name} {patient.last_name}</p>
                              <p><strong>Number of Visits:</strong> {planData.visits.length}</p>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-md-12">
                              <p><strong>Description:</strong></p>
                              <p>{planData.description || 'No description provided.'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="card mb-3">
                        <div className="card-header">
                          <strong>Visits</strong>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Title</th>
                                  <th>Duration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {planData.visits.map((visit, index) => (
                                  <tr key={index}>
                                    <td>{visit.visit_number}</td>
                                    <td>{visit.title}</td>
                                    <td>{visit.duration} minutes</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      
                      <div className="alert alert-info">
                        <i className="fa fa-info-circle"></i> After creating the treatment plan, you'll be able to add procedures to each visit.
                      </div>
                      
                      <div className="d-flex justify-content-between">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleBack}
                        >
                          <i className="fa fa-arrow-left"></i> Back
                        </button>
                        <button
                          type="submit"
                          className="btn btn-success"
                        >
                          <i className="fa fa-check"></i> Create Treatment Plan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewTreatmentPlan; 