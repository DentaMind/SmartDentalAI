import { useEvents, EventMetadata } from './useEvents';

export const useLedgerEvents = () => {
  const { collectEvent } = useEvents();

  const collectLedgerAdjustment = async (
    ledgerId: number,
    amount: number,
    metadata: Partial<EventMetadata> & {
      type: 'credit' | 'debit';
      reason: string;
      patientId: number;
    }
  ) => {
    await collectEvent('ledger.adjustment', {
      ledgerId,
      amount,
      type: metadata.type,
      reason: metadata.reason,
      patientId: metadata.patientId
    }, metadata);
  };

  const collectLedgerRefund = async (
    ledgerId: number,
    amount: number,
    metadata: Partial<EventMetadata> & {
      reason: string;
      patientId: number;
    }
  ) => {
    await collectEvent('ledger.refund', {
      ledgerId,
      amount,
      reason: metadata.reason,
      patientId: metadata.patientId
    }, metadata);
  };

  const collectLedgerWriteoff = async (
    ledgerId: number,
    amount: number,
    metadata: Partial<EventMetadata> & {
      reason: string;
      patientId: number;
    }
  ) => {
    await collectEvent('ledger.writeoff', {
      ledgerId,
      amount,
      reason: metadata.reason,
      patientId: metadata.patientId
    }, metadata);
  };

  const collectPaymentReceived = async (
    ledgerId: number,
    amount: number,
    metadata: Partial<EventMetadata> & {
      method: 'cash' | 'card' | 'check' | 'other';
      patientId: number;
      paymentId: number;
    }
  ) => {
    await collectEvent('ledger.payment.received', {
      ledgerId,
      amount,
      method: metadata.method,
      patientId: metadata.patientId,
      paymentId: metadata.paymentId
    }, metadata);
  };

  const collectPaymentRefunded = async (
    ledgerId: number,
    paymentId: number,
    amount: number,
    metadata: Partial<EventMetadata> & {
      reason: string;
      patientId: number;
    }
  ) => {
    await collectEvent('ledger.payment.refunded', {
      ledgerId,
      paymentId,
      amount,
      reason: metadata.reason,
      patientId: metadata.patientId
    }, metadata);
  };

  const collectInsurancePaymentReceived = async (
    ledgerId: number,
    amount: number,
    metadata: Partial<EventMetadata> & {
      insuranceId: number;
      claimId: number;
      patientId: number;
      paymentId: number;
    }
  ) => {
    await collectEvent('ledger.insurance.payment', {
      ledgerId,
      amount,
      insuranceId: metadata.insuranceId,
      claimId: metadata.claimId,
      patientId: metadata.patientId,
      paymentId: metadata.paymentId
    }, metadata);
  };

  return {
    collectLedgerAdjustment,
    collectLedgerRefund,
    collectLedgerWriteoff,
    collectPaymentReceived,
    collectPaymentRefunded,
    collectInsurancePaymentReceived
  };
}; 