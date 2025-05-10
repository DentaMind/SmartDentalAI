import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Types
export const ToothSurfaces = {
  MESIAL: 'M',
  OCCLUSAL: 'O',
  DISTAL: 'D',
  FACIAL: 'F',
  LINGUAL: 'L',
  BUCCAL: 'B',
  INCISAL: 'I',
};

export const TreatmentCategories = {
  MEDICAL: 'Medical',
  COSMETIC: 'Cosmetic',
  PREVENTIVE: 'Preventive',
};

export const TreatmentStatuses = {
  PROPOSED: 'Proposed',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
};

export const VisitStatuses = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
  PENDING: 'Pending',
};

// Create Treatment Context
const TreatmentContext = createContext(null);

export const TreatmentProvider = ({ children }) => {
  const { authAxios } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load TreatmentPlan from API
  const loadTreatmentPlan = async (planId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAxios.get(`/treatment-plans/${planId}`);
      const plan = response.data;
      setCurrentPlan(plan);
      
      // Set first visit as current by default if plan has visits
      if (plan.visits && plan.visits.length > 0) {
        setCurrentVisit(plan.visits[0]);
      }
      
      setLoading(false);
      return plan;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load treatment plan');
      setLoading(false);
      return null;
    }
  };

  // Create new Treatment Plan
  const createTreatmentPlan = async (planData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAxios.post('/treatment-plans', planData);
      const newPlan = response.data;
      setCurrentPlan(newPlan);
      
      if (newPlan.visits && newPlan.visits.length > 0) {
        setCurrentVisit(newPlan.visits[0]);
      }
      
      setLoading(false);
      return newPlan;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create treatment plan');
      setLoading(false);
      return null;
    }
  };

  // Update Treatment Plan
  const updateTreatmentPlan = async (planId, planData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAxios.put(`/treatment-plans/${planId}`, planData);
      const updatedPlan = response.data;
      setCurrentPlan(updatedPlan);
      
      // Update current visit if it exists in the updated plan
      if (currentVisit && updatedPlan.visits) {
        const updatedVisit = updatedPlan.visits.find(v => v.id === currentVisit.id);
        if (updatedVisit) {
          setCurrentVisit(updatedVisit);
        } else if (updatedPlan.visits.length > 0) {
          setCurrentVisit(updatedPlan.visits[0]);
        }
      }
      
      setLoading(false);
      return updatedPlan;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update treatment plan');
      setLoading(false);
      return null;
    }
  };

  // Add a procedure to the current visit
  const addProcedureToCurrentVisit = (procedure) => {
    if (!currentVisit) return;
    
    setCurrentVisit(prev => {
      if (!prev) return null;
      
      // Create a new procedures array with the new procedure
      const updatedProcedures = [...prev.procedures, procedure];
      
      const updatedVisit = {
        ...prev,
        procedures: updatedProcedures
      };
      
      // Also update the visit in the current plan
      updateVisitInPlan(updatedVisit);
      
      return updatedVisit;
    });
  };

  // Remove a procedure from the current visit
  const removeProcedureFromCurrentVisit = (procedureId) => {
    if (!currentVisit) return;
    
    setCurrentVisit(prev => {
      if (!prev) return null;
      
      const updatedProcedures = prev.procedures.filter(p => p.id !== procedureId);
      
      const updatedVisit = {
        ...prev,
        procedures: updatedProcedures
      };
      
      // Also update the visit in the current plan
      updateVisitInPlan(updatedVisit);
      
      return updatedVisit;
    });
  };

  // Update a visit in the current plan
  const updateVisitInPlan = (updatedVisit) => {
    if (!currentPlan) return;
    
    setCurrentPlan(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        visits: prev.visits.map(visit => 
          visit.id === updatedVisit.id ? updatedVisit : visit
        )
      };
    });
  };

  // Add a new visit to the treatment plan
  const addVisitToPlan = (visitData) => {
    if (!currentPlan) return;
    
    setCurrentPlan(prev => {
      if (!prev) return null;
      
      // Generate a temporary ID for the new visit
      const newVisit = {
        ...visitData,
        id: `temp-${Date.now()}`,
        visit_number: prev.visits.length + 1,
        procedures: []
      };
      
      return {
        ...prev,
        visits: [...prev.visits, newVisit]
      };
    });
  };

  // Get AI treatment suggestions for a patient
  const getAITreatmentSuggestions = async (patientId, diagnosisData) => {
    setLoading(true);
    setError(null);
    
    try {
      // This would call your AI suggestion endpoint
      const response = await authAxios.post(`/ai/treatment-suggestions`, {
        patient_id: patientId,
        diagnosis_data: diagnosisData
      });
      
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get AI treatment suggestions');
      setLoading(false);
      return null;
    }
  };

  // Calculate the total cost and insurance estimates for a treatment plan
  const calculateTreatmentTotals = (plan) => {
    if (!plan) return { totalCost: 0, insuranceEstimate: 0, patientResponsibility: 0 };
    
    let totalCost = 0;
    let insuranceEstimate = 0;
    
    // Sum up costs from all procedures
    plan.visits.forEach(visit => {
      visit.procedures.forEach(procedure => {
        totalCost += procedure.estimated_cost || 0;
        insuranceEstimate += procedure.insurance_estimate || 0;
      });
    });
    
    // Calculate patient responsibility
    const patientResponsibility = totalCost - insuranceEstimate;
    
    return {
      totalCost,
      insuranceEstimate,
      patientResponsibility
    };
  };

  // Connect to the purchased periodontal chart UI
  // This is a placeholder that would be implemented when integrating the purchased UI
  const connectPerioData = (patientId, teethData) => {
    setSelectedTeeth(teethData.map(t => t.toothNumber));
    // Additional integration code would go here
  };

  return (
    <TreatmentContext.Provider
      value={{
        currentPlan,
        setCurrentPlan,
        currentVisit,
        setCurrentVisit,
        selectedTeeth,
        setSelectedTeeth,
        loading,
        error,
        loadTreatmentPlan,
        createTreatmentPlan,
        updateTreatmentPlan,
        addProcedureToCurrentVisit,
        removeProcedureFromCurrentVisit,
        updateVisitInPlan,
        addVisitToPlan,
        getAITreatmentSuggestions,
        calculateTreatmentTotals,
        connectPerioData,
        // Constants
        ToothSurfaces,
        TreatmentCategories,
        TreatmentStatuses,
        VisitStatuses
      }}
    >
      {children}
    </TreatmentContext.Provider>
  );
};

// Custom hook to use the treatment context
export const useTreatment = () => {
  const context = useContext(TreatmentContext);
  if (!context) {
    throw new Error('useTreatment must be used within a TreatmentProvider');
  }
  return context;
}; 