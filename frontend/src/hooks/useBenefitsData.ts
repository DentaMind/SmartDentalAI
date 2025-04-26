import { useState, useEffect } from 'react';
import type { BenefitsData } from '@/types/treatment-plan';

export const useBenefitsData = (patientId: string) => {
    const [benefitsData, setBenefitsData] = useState<BenefitsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchBenefitsData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/patients/${patientId}/benefits`);
                if (!response.ok) {
                    throw new Error('Failed to fetch benefits data');
                }
                const data = await response.json();
                setBenefitsData(data);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        if (patientId) {
            fetchBenefitsData();
        }
    }, [patientId]);

    const refreshBenefitsData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/patients/${patientId}/benefits`);
            if (!response.ok) {
                throw new Error('Failed to fetch benefits data');
            }
            const data = await response.json();
            setBenefitsData(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return {
        benefitsData,
        loading,
        error,
        refreshBenefitsData
    };
}; 