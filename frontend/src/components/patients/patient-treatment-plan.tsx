import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTreatmentEvents } from "@/hooks/useTreatmentEvents";
// ... existing imports ...

export function PatientTreatmentPlan({ patientId }: PatientTreatmentPlanProps) {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  
  const {
    collectTreatmentPlanCreated,
    collectTreatmentPlanModified,
    collectTreatmentStepCompleted,
    collectTreatmentStepScheduled,
    collectTreatmentStepCancelled,
    collectProcedureModified,
    collectAIRecommendationAccepted,
    collectAIRecommendationRejected
  } = useTreatmentEvents();

  // ... existing code ...

  const handleCreatePlan = async (planData: any) => {
    try {
      const response = await apiRequest("POST", `/api/patients/${patientId}/treatment-plans`, planData);
      const newPlan = await response.json();
      
      // Collect event
      await collectTreatmentPlanCreated(newPlan.id, {
        source: planData.aiGenerated ? 'ai' : 'user'
      });
      
      setShowNewPlanDialog(false);
      queryClient.invalidateQueries(["/api/treatment-plans", patientId]);
    } catch (error) {
      console.error("Failed to create treatment plan:", error);
    }
  };

  const handleModifyPlan = async (planId: number, modifications: any) => {
    try {
      const response = await apiRequest("PATCH", `/api/treatment-plans/${planId}`, modifications);
      const updatedPlan = await response.json();
      
      // Collect event
      await collectTreatmentPlanModified(planId, {
        original_value: selectedPlan,
        new_value: updatedPlan,
        source: 'user'
      });
      
      setSelectedPlan(updatedPlan);
      queryClient.invalidateQueries(["/api/treatment-plans", patientId]);
    } catch (error) {
      console.error("Failed to modify treatment plan:", error);
    }
  };

  const handleCompleteStep = async (planId: number, stepId: number) => {
    try {
      const response = await apiRequest("POST", `/api/treatment-steps/${stepId}/complete`);
      const updatedStep = await response.json();
      
      // Collect event
      await collectTreatmentStepCompleted(planId, stepId, {
        source: 'user'
      });
      
      queryClient.invalidateQueries(["/api/treatment-plans", patientId]);
    } catch (error) {
      console.error("Failed to complete treatment step:", error);
    }
  };

  const handleScheduleStep = async (planId: number, stepId: number, date: string) => {
    try {
      const response = await apiRequest("POST", `/api/treatment-steps/${stepId}/schedule`, { date });
      const updatedStep = await response.json();
      
      // Collect event
      await collectTreatmentStepScheduled(planId, stepId, date, {
        source: 'user'
      });
      
      queryClient.invalidateQueries(["/api/treatment-plans", patientId]);
    } catch (error) {
      console.error("Failed to schedule treatment step:", error);
    }
  };

  const handleCancelStep = async (planId: number, stepId: number, reason: string) => {
    try {
      const response = await apiRequest("POST", `/api/treatment-steps/${stepId}/cancel`, { reason });
      const updatedStep = await response.json();
      
      // Collect event
      await collectTreatmentStepCancelled(planId, stepId, reason, {
        source: 'user'
      });
      
      queryClient.invalidateQueries(["/api/treatment-plans", patientId]);
    } catch (error) {
      console.error("Failed to cancel treatment step:", error);
    }
  };

  const handleModifyProcedure = async (
    planId: number,
    stepId: number,
    procedureId: number,
    modifications: any
  ) => {
    try {
      const originalProcedure = selectedPlan?.steps.find(s => s.id === stepId)?.procedure;
      const response = await apiRequest("PATCH", `/api/procedures/${procedureId}`, modifications);
      const updatedProcedure = await response.json();
      
      // Collect event
      await collectProcedureModified(
        planId,
        stepId,
        procedureId,
        originalProcedure,
        updatedProcedure,
        { source: 'user' }
      );
      
      queryClient.invalidateQueries(["/api/treatment-plans", patientId]);
    } catch (error) {
      console.error("Failed to modify procedure:", error);
    }
  };

  const handleAcceptAIRecommendation = async (planId: number, recommendationType: string) => {
    try {
      // Collect event
      await collectAIRecommendationAccepted(planId, recommendationType, {
        source: 'user'
      });
    } catch (error) {
      console.error("Failed to log AI recommendation acceptance:", error);
    }
  };

  const handleRejectAIRecommendation = async (
    planId: number,
    recommendationType: string,
    reason: string
  ) => {
    try {
      // Collect event
      await collectAIRecommendationRejected(planId, recommendationType, reason, {
        source: 'user'
      });
    } catch (error) {
      console.error("Failed to log AI recommendation rejection:", error);
    }
  };

  // ... rest of the component code ...

  return (
    <div className="treatment-plan-container">
      <div className="treatment-plan-header">
        <h2>Treatment Plans</h2>
        <button
          className="btn-primary"
          onClick={() => setShowNewPlanDialog(true)}
        >
          Create New Plan
        </button>
      </div>
      
      <div className="tabs">
        <button
          className={activeTab === "active" ? "tab-active" : ""}
          onClick={() => setActiveTab("active")}
        >
          Active Plans
        </button>
        <button
          className={activeTab === "completed" ? "tab-active" : ""}
          onClick={() => setActiveTab("completed")}
        >
          Completed Plans
        </button>
        <button
          className={activeTab === "all" ? "tab-active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All Plans
        </button>
      </div>
      
      {/* Plan list section would go here */}
      
      {/* New plan dialog would go here */}
    </div>
  );
} 