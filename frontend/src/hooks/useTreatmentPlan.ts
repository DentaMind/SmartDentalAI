import useSWR, { mutate } from 'swr';
import type {
    TreatmentPlan,
    TreatmentProcedure,
    TreatmentPlanSummary,
    CreateTreatmentPlanRequest,
    AddProcedureRequest,
    TreatmentStatus
} from '@/types/treatment-plan';

const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch treatment plan data');
    }
    return response.json();
};

export function useTreatmentPlan(planId?: string) {
    const { data: plan, error: planError, isLoading: planLoading } = useSWR<TreatmentPlan>(
        planId ? `/api/treatment-plans/${planId}` : null,
        fetcher
    );

    const { data: summary, error: summaryError, isLoading: summaryLoading } = useSWR<TreatmentPlanSummary>(
        planId ? `/api/treatment-plans/${planId}/summary` : null,
        fetcher
    );

    const createPlan = async (request: CreateTreatmentPlanRequest): Promise<TreatmentPlan> => {
        const response = await fetch('/api/treatment-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error('Failed to create treatment plan');
        }

        const newPlan = await response.json();
        await mutate(`/api/patients/${request.patient_id}/treatment-plans`);
        return newPlan;
    };

    const addProcedure = async (procedure: AddProcedureRequest): Promise<TreatmentProcedure> => {
        if (!planId) throw new Error('No plan ID provided');

        const response = await fetch(`/api/treatment-plans/${planId}/procedures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(procedure)
        });

        if (!response.ok) {
            throw new Error('Failed to add procedure');
        }

        const newProcedure = await response.json();
        await mutate(`/api/treatment-plans/${planId}`);
        await mutate(`/api/treatment-plans/${planId}/summary`);
        return newProcedure;
    };

    const updateProcedureStatus = async (
        procedureId: string,
        status: TreatmentStatus,
        completedDate?: string,
        providerId?: string
    ): Promise<TreatmentProcedure> => {
        if (!planId) throw new Error('No plan ID provided');

        const response = await fetch(
            `/api/treatment-plans/${planId}/procedures/${procedureId}/status`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    completed_date: completedDate,
                    provider_id: providerId
                })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update procedure status');
        }

        const updatedProcedure = await response.json();
        await mutate(`/api/treatment-plans/${planId}`);
        await mutate(`/api/treatment-plans/${planId}/summary`);
        return updatedProcedure;
    };

    const signConsent = async (signedBy: string): Promise<TreatmentPlan> => {
        if (!planId) throw new Error('No plan ID provided');

        const response = await fetch(`/api/treatment-plans/${planId}/consent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signed_by: signedBy })
        });

        if (!response.ok) {
            throw new Error('Failed to sign consent');
        }

        const updatedPlan = await response.json();
        await mutate(`/api/treatment-plans/${planId}`);
        return updatedPlan;
    };

    return {
        plan,
        summary,
        isLoading: planLoading || summaryLoading,
        isError: planError || summaryError,
        createPlan,
        addProcedure,
        updateProcedureStatus,
        signConsent
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