import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTreatment, TreatmentStatuses } from '../../contexts/TreatmentContext';

// Placeholder for when we integrate the purchased UI
// This would be replaced with actual table components from the purchased UI
const TreatmentPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  
  const { authAxios } = useAuth();
  const navigate = useNavigate();
  const { calculateTreatmentTotals } = useTreatment();
  
  useEffect(() => {
    const fetchTreatmentPlans = async () => {
      try {
        // This would be replaced with actual API calls when integrated
        const response = await authAxios.get('/treatment-plans');
        setPlans(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch treatment plans:', err);
        setError('Failed to load treatment plans. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchTreatmentPlans();
  }, [authAxios]);
  
  const filteredPlans = statusFilter
    ? plans.filter(plan => plan.status === statusFilter)
    : plans;
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  const createNewPlan = () => {
    navigate('/treatment-plans/new');
  };
  
  if (loading) {
    return (
      <div className="col-lg-12">
        <div className="card">
          <div className="card-header">
            <strong className="card-title">Treatment Plans</strong>
          </div>
          <div className="card-body">
            <p>Loading treatment plans...</p>
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
            <strong className="card-title">Treatment Plans</strong>
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
          <strong className="card-title">Treatment Plans</strong>
          <div className="float-right">
            <button className="btn btn-primary btn-sm" onClick={createNewPlan}>
              <i className="fa fa-plus"></i> New Treatment Plan
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <div className="form-group">
                <label htmlFor="statusFilter">Filter by Status</label>
                <select 
                  id="statusFilter" 
                  className="form-control"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="">All Statuses</option>
                  {Object.values(TreatmentStatuses).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {filteredPlans.length === 0 ? (
            <div className="alert alert-info">
              No treatment plans found. Click "New Treatment Plan" to create one.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Title</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th>Total Cost</th>
                    <th>Doctor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map(plan => {
                    const { totalCost } = calculateTreatmentTotals(plan);
                    
                    return (
                      <tr key={plan.id}>
                        <td>{plan.id.substring(0, 8)}...</td>
                        <td>
                          <Link to={`/patients/${plan.patient_id}`}>
                            {plan.patient_name || 'Unknown Patient'}
                          </Link>
                        </td>
                        <td>{plan.title}</td>
                        <td>{new Date(plan.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge badge-${getStatusBadgeColor(plan.status)}`}>
                            {plan.status}
                          </span>
                        </td>
                        <td>${totalCost.toFixed(2)}</td>
                        <td>{plan.doctor_name || 'Unknown Doctor'}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <Link 
                              to={`/patients/${plan.patient_id}/treatment-plans/${plan.id}`} 
                              className="btn btn-info btn-sm"
                            >
                              <i className="fa fa-eye"></i> View
                            </Link>
                            <button className="btn btn-danger btn-sm">
                              <i className="fa fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to determine badge color based on status
const getStatusBadgeColor = (status) => {
  switch (status) {
    case TreatmentStatuses.PROPOSED:
      return 'info';
    case TreatmentStatuses.ACCEPTED:
      return 'primary';
    case TreatmentStatuses.IN_PROGRESS:
      return 'warning';
    case TreatmentStatuses.COMPLETED:
      return 'success';
    case TreatmentStatuses.CANCELED:
      return 'danger';
    default:
      return 'secondary';
  }
};

export default TreatmentPlans; 