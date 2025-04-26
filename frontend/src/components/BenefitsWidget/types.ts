export interface Benefit {
  type: string;
  used: number;
  remaining: number;
  total: number;
  nextRenewal: string;
}

export interface Coverage {
  cdtCode: string;
  description: string;
  coveragePercent: number;
  requiresPreAuth: boolean;
  warnings: string[];
}

export interface BenefitsWidgetProps {
  patientId: string;
  onPreAuthRequired?: (cdtCodes: string[]) => void;
  className?: string;
} 