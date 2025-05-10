import { useState, useEffect, useCallback } from 'react';
import { treatmentPlanApi, TreatmentPlan, TreatmentPlanCreate, TreatmentPlanUpdate, TreatmentProcedureCreate, TreatmentProcedureUpdate, TreatmentPlanSummary } from '../api/treatmentPlan';

export function useTreatmentPlan(planId?: string) {
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [summary, setSummary] = useState<TreatmentPlanSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch treatment plan data
  const fetchPlan = useCallback(async () => {
    if (!planId) return;
    
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    
    try {
      const planData = await treatmentPlanApi.getTreatmentPlan(planId);
      setPlan(planData);
      
      // Fetch summary
      const summaryData = await treatmentPlanApi.getTreatmentPlanSummary(planId);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching treatment plan:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch treatment plan');
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  // Create a new treatment plan
  const createPlan = async (data: TreatmentPlanCreate) => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const newPlan = await treatmentPlanApi.createTreatmentPlan(data);
      setPlan(newPlan);
      return newPlan;
    } catch (error) {
      console.error('Error creating treatment plan:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create treatment plan');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a treatment plan
  const updatePlan = async (planId: string, data: TreatmentPlanUpdate) => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const updatedPlan = await treatmentPlanApi.updateTreatmentPlan(planId, data);
      setPlan(updatedPlan);
      return updatedPlan;
    } catch (error) {
      console.error('Error updating treatment plan:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update treatment plan');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Approve a treatment plan
  const approvePlan = async (planId: string, notes?: string) => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const approvedPlan = await treatmentPlanApi.approveTreatmentPlan(planId, notes);
      setPlan(approvedPlan);
      return approvedPlan;
    } catch (error) {
      console.error('Error approving treatment plan:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to approve treatment plan');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign consent for a treatment plan
  const signConsent = async (signedBy: string) => {
    if (!planId) return;
    
    setIsLoading(true);
    setIsError(false);
    
    try {
      const updatedPlan = await treatmentPlanApi.signConsent(planId, signedBy);
      setPlan(updatedPlan);
      return updatedPlan;
    } catch (error) {
      console.error('Error signing consent:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to sign consent');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Complete a treatment plan
  const completePlan = async (notes?: string) => {
    if (!planId) return;
    
    setIsLoading(true);
    setIsError(false);
    
    try {
      const completedPlan = await treatmentPlanApi.completeTreatmentPlan(planId, notes);
      setPlan(completedPlan);
      return completedPlan;
    } catch (error) {
      console.error('Error completing treatment plan:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to complete treatment plan');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a procedure to a treatment plan
  const addProcedure = async (data: Omit<TreatmentProcedureCreate, 'treatment_plan_id'>) => {
    if (!planId) return;
    
    setIsLoading(true);
    setIsError(false);
    
    try {
      const procedureData = {
        ...data,
        treatment_plan_id: planId
      };
      
      const newProcedure = await treatmentPlanApi.addProcedure(procedureData as TreatmentProcedureCreate);
      
      // Refresh the plan to get the updated procedures list
      await fetchPlan();
      
      return newProcedure;
    } catch (error) {
      console.error('Error adding procedure:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add procedure');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a procedure
  const updateProcedure = async (procedureId: string, data: TreatmentProcedureUpdate) => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const updatedProcedure = await treatmentPlanApi.updateProcedure(procedureId, data);
      
      // Refresh the plan to get the updated procedures list
      await fetchPlan();
      
      return updatedProcedure;
    } catch (error) {
      console.error('Error updating procedure:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update procedure');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a procedure
  const deleteProcedure = async (procedureId: string) => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      await treatmentPlanApi.deleteProcedure(procedureId);
      
      // Refresh the plan to get the updated procedures list
      await fetchPlan();
      
      return true;
    } catch (error) {
      console.error('Error deleting procedure:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete procedure');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update procedure status
  const updateProcedureStatus = async (procedureId: string, status: string) => {
    return updateProcedure(procedureId, { status });
  };

  // AI-suggest a treatment plan
  const suggestTreatmentPlan = async (patientId: string, diagnosisId?: string) => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const suggestion = await treatmentPlanApi.suggestTreatmentPlan(patientId, diagnosisId);
      return suggestion;
    } catch (error) {
      console.error('Error getting treatment suggestion:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to get treatment suggestion');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch plan on initial load if planId is provided
  useEffect(() => {
    if (planId) {
      fetchPlan();
    }
  }, [planId, fetchPlan]);

  return {
    plan,
    summary,
    isLoading,
    isError,
    errorMessage,
    fetchPlan,
    createPlan,
    updatePlan,
    approvePlan,
    signConsent,
    completePlan,
    addProcedure,
    updateProcedure,
    deleteProcedure,
    updateProcedureStatus,
    suggestTreatmentPlan
  };
}

export function usePatientTreatmentPlans(patientId?: string) {
    const { data: plans, error, isLoading } = useSWR<TreatmentPlan[]>(
        patientId ? `/api/patients/${patientId}/treatment-plans` : null,
        fetcher
    );

    return {
        plans,
        isLoading,
        isError: error
    };
} 