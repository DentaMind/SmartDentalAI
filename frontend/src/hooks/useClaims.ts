import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface GenerateClaimRequest {
    treatment_plan_id: string;
    insurance_provider_id: string;
    notes?: string;
}

interface Claim {
    id: string;
    treatment_plan_id: string;
    insurance_provider_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    notes?: string;
}

export const useClaims = () => {
    const queryClient = useQueryClient();

    const generateClaim = useMutation({
        mutationFn: async (request: GenerateClaimRequest) => {
            const response = await axios.post('/api/claims/from-treatment-plan', request);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['claims'] });
            queryClient.invalidateQueries({ queryKey: ['treatmentPlans'] });
        }
    });

    return {
        generateClaim: generateClaim.mutateAsync
    };
}; 