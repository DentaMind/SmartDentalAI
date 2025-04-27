import { useEvents, EventMetadata } from './useEvents';

export const useInsuranceEvents = () => {
  const { collectEvent } = useEvents();

  const collectPreAuthSubmitted = async (
    patientId: number,
    preAuthId: number,
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('insurance.preauth.submitted', {
      patientId,
      preAuthId,
      ...metadata
    }, metadata);
  };

  const collectPreAuthDecision = async (
    patientId: number,
    preAuthId: number,
    decision: 'approved' | 'denied' | 'partial',
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('insurance.preauth.decision', {
      patientId,
      preAuthId,
      decision
    }, metadata);
  };

  const collectClaimSubmitted = async (
    patientId: number,
    claimId: number,
    procedureCodes: string[],
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('insurance.claim.submitted', {
      patientId,
      claimId,
      procedureCodes
    }, metadata);
  };

  const collectClaimAdjudicated = async (
    patientId: number,
    claimId: number,
    decision: {
      status: 'paid' | 'denied' | 'partial',
      amount: number,
      reason?: string
    },
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('insurance.claim.adjudicated', {
      patientId,
      claimId,
      ...decision
    }, metadata);
  };

  const collectEligibilityChecked = async (
    patientId: number,
    insuranceId: number,
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('insurance.eligibility.checked', {
      patientId,
      insuranceId
    }, metadata);
  };

  const collectBenefitsVerified = async (
    patientId: number,
    insuranceId: number,
    benefits: {
      annual_max: number,
      remaining: number,
      preventive_remaining: number,
      ortho_lifetime: number,
      ortho_remaining: number
    },
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('insurance.benefits.verified', {
      patientId,
      insuranceId,
      benefits
    }, metadata);
  };

  return {
    collectPreAuthSubmitted,
    collectPreAuthDecision,
    collectClaimSubmitted,
    collectClaimAdjudicated,
    collectEligibilityChecked,
    collectBenefitsVerified
  };
}; 