import useSWR from 'swr';

export interface LedgerEntry {
  id: string;
  cdtCode: string;
  description: string;
  dateOfService: string;
  charges: {
    amountBilled: number;
    insurancePaid: number;
    patientPaid: number;
    adjustments: number;
    remainingBalance: number;
  };
  status: 'pending' | 'submitted' | 'paid' | 'partial' | 'denied';
  insuranceClaimId?: string;
  lastSubmitted?: string;
}

export interface LedgerSummary {
  totalBilled: number;
  totalInsurancePaid: number;
  totalPatientPaid: number;
  totalAdjustments: number;
  remainingBalance: number;
  entries: LedgerEntry[];
}

const fetcher = async (url: string): Promise<LedgerSummary> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch ledger data');
  }
  return response.json();
};

export function useLedgerData(patientId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<LedgerSummary>(
    patientId ? `/api/ledger/${patientId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Refresh every 30 seconds
      shouldRetryOnError: true,
      errorRetryCount: 3,
    }
  );

  const getEntriesForCDT = (cdtCode: string): LedgerEntry[] => {
    return data?.entries.filter(entry => entry.cdtCode === cdtCode) || [];
  };

  const getSummaryForCDT = (cdtCode: string) => {
    const entries = getEntriesForCDT(cdtCode);
    return entries.reduce(
      (acc, entry) => ({
        amountBilled: acc.amountBilled + entry.charges.amountBilled,
        insurancePaid: acc.insurancePaid + entry.charges.insurancePaid,
        patientPaid: acc.patientPaid + entry.charges.patientPaid,
        adjustments: acc.adjustments + entry.charges.adjustments,
        remainingBalance: acc.remainingBalance + entry.charges.remainingBalance,
      }),
      {
        amountBilled: 0,
        insurancePaid: 0,
        patientPaid: 0,
        adjustments: 0,
        remainingBalance: 0,
      }
    );
  };

  return {
    ledgerData: data,
    isLoading,
    isError: error,
    refresh: mutate,
    getEntriesForCDT,
    getSummaryForCDT,
  };
} 