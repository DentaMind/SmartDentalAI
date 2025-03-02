import { storage } from "../storage";
import { 
  InsertPayment, 
  InsertFinancialTransaction,
  InsertInsuranceClaim,
  Payment,
  FinancialTransaction,
  InsuranceClaim
} from "@shared/schema";

export class FinancialService {
  // Payment Processing
  async processPayment(data: InsertPayment & { createTransaction?: boolean }) {
    const payment = await storage.createPayment(data);
    
    if (data.createTransaction) {
      await storage.createFinancialTransaction({
        patientId: data.patientId,
        type: "payment",
        amount: data.amount,
        method: "credit_card", // Should come from payment data
        status: "completed",
        fiscalYear: new Date().getFullYear(),
        fiscalQuarter: Math.floor((new Date().getMonth() + 3) / 3),
        description: `Payment for treatment plan ${data.treatmentPlanId}`,
      });
    }

    return payment;
  }

  // Insurance Claim Management
  async submitInsuranceClaim(data: InsertInsuranceClaim) {
    const claim = await storage.createInsuranceClaim(data);
    
    // Create a pending transaction for expected insurance payment
    await storage.createFinancialTransaction({
      patientId: data.patientId,
      type: "insurance_payment",
      amount: 0, // Will be updated when claim is processed
      method: "insurance",
      status: "pending",
      fiscalYear: new Date().getFullYear(),
      fiscalQuarter: Math.floor((new Date().getMonth() + 3) / 3),
      description: `Insurance claim ${claim.claimNumber}`,
    });

    return claim;
  }

  // Financial Reporting
  async getFinancialSummary(startDate: Date, endDate: Date) {
    const transactions = await storage.getFinancialTransactionsByDateRange(startDate, endDate);
    const payments = await storage.getPaymentsByDateRange(startDate, endDate);
    const claims = await storage.getInsuranceClaimsByDateRange(startDate, endDate);

    return {
      totalRevenue: transactions
        .filter(t => t.type === "payment" || t.type === "insurance_payment")
        .reduce((sum, t) => sum + t.amount, 0),
      insurancePayments: payments
        .filter(p => p.insuranceAmount)
        .reduce((sum, p) => sum + (p.insuranceAmount || 0), 0),
      patientPayments: payments
        .filter(p => p.patientAmount)
        .reduce((sum, p) => sum + (p.patientAmount || 0), 0),
      pendingInsurance: claims
        .filter(c => c.status === "submitted" || c.status === "in_review")
        .reduce((sum, c) => sum + (c.approvedAmount || 0), 0),
      writeOffs: payments
        .filter(p => p.writeOffAmount)
        .reduce((sum, p) => sum + (p.writeOffAmount || 0), 0),
    };
  }

  // Tax Reporting
  async generateTaxReport(year: number) {
    const transactions = await storage.getFinancialTransactionsByYear(year);
    
    // Group by category code for tax purposes
    const categorized = transactions.reduce((acc, t) => {
      const category = t.categoryCode || 'uncategorized';
      if (!acc[category]) acc[category] = 0;
      acc[category] += t.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate quarterly totals
    const quarterlyTotals = transactions.reduce((acc, t) => {
      if (!acc[t.fiscalQuarter]) acc[t.fiscalQuarter] = 0;
      acc[t.fiscalQuarter] += t.amount;
      return acc;
    }, {} as Record<number, number>);

    return {
      year,
      categorizedTotals: categorized,
      quarterlyTotals,
      totalRevenue: transactions
        .filter(t => t.type === "payment" || t.type === "insurance_payment")
        .reduce((sum, t) => sum + t.amount, 0),
      totalAdjustments: transactions
        .filter(t => t.type === "adjustment")
        .reduce((sum, t) => sum + t.amount, 0),
    };
  }
}

export const financialService = new FinancialService();
import { storage } from "../storage";
import { financialTransactions, insuranceClaims, payments } from "@shared/schema";
import { z } from "zod";

const insuranceProviders = {
  "delta-dental": {
    name: "Delta Dental",
    coverageRates: {
      preventive: 0.9,
      basic: 0.7,
      major: 0.5,
      orthodontic: 0.4,
    },
    annualMax: 2000,
  },
  "cigna": {
    name: "Cigna Dental",
    coverageRates: {
      preventive: 1.0,
      basic: 0.8,
      major: 0.6,
      orthodontic: 0.5,
    },
    annualMax: 2500,
  },
  "aetna": {
    name: "Aetna Dental",
    coverageRates: {
      preventive: 0.95,
      basic: 0.75,
      major: 0.55,
      orthodontic: 0.45,
    },
    annualMax: 2200,
  },
  "metlife": {
    name: "MetLife Dental",
    coverageRates: {
      preventive: 0.85,
      basic: 0.65,
      major: 0.45,
      orthodontic: 0.35,
    },
    annualMax: 1800,
  },
};

// Procedure category mappings
const procedureCategories = {
  "D0100-D0999": "preventive", // Diagnostic
  "D1000-D1999": "preventive", // Preventive
  "D2000-D2999": "basic",      // Restorative
  "D3000-D3999": "major",      // Endodontics
  "D4000-D4999": "major",      // Periodontics
  "D5000-D5999": "major",      // Prosthodontics, removable
  "D6000-D6999": "major",      // Implant Services
  "D7000-D7999": "major",      // Oral and Maxillofacial Surgery
  "D8000-D8999": "orthodontic", // Orthodontics
  "D9000-D9999": "basic",      // Adjunctive General Services
};

// Payment schema
const paymentSchema = z.object({
  patientId: z.number(),
  amount: z.number().positive(),
  method: z.enum(["cash", "credit_card", "check", "insurance", "online"]),
  treatmentPlanId: z.number().optional(),
  description: z.string().optional(),
});

// Insurance claim schema
const insuranceClaimSchema = z.object({
  patientId: z.number(),
  treatmentPlanId: z.number(),
  insuranceProvider: z.string(),
  procedures: z.array(z.object({
    code: z.string(),
    description: z.string(),
    fee: z.number().positive(),
    date: z.string(),
    toothNumber: z.string().optional(),
  })),
  submissionDetails: z.object({
    providerNPI: z.string(),
    providerTIN: z.string(),
    facilityCode: z.string().optional(),
  }).optional(),
});

// Financial analysis schema
const financialDateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

class FinancialService {
  async processPayment(paymentData: z.infer<typeof paymentSchema>) {
    try {
      // Validate payment data
      const validatedData = paymentSchema.parse(paymentData);
      
      // Create a new payment record
      const payment = await storage.createPayment({
        patientId: validatedData.patientId,
        amount: validatedData.amount,
        patientAmount: validatedData.amount,
        date: new Date(),
        status: "processed",
        treatmentPlanId: validatedData.treatmentPlanId,
      });
      
      // Create corresponding financial transaction record
      const fiscalData = this.getFiscalPeriod(new Date());
      
      await storage.createFinancialTransaction({
        patientId: validatedData.patientId,
        type: "payment",
        amount: validatedData.amount,
        date: new Date(),
        method: validatedData.method as any,
        status: "completed",
        description: validatedData.description || "Patient payment",
        fiscalYear: fiscalData.fiscalYear,
        fiscalQuarter: fiscalData.fiscalQuarter,
      });
      
      return payment;
    } catch (error) {
      console.error("Payment processing error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to process payment");
    }
  }
  
  async submitInsuranceClaim(claimData: z.infer<typeof insuranceClaimSchema>) {
    try {
      // Validate claim data
      const validatedData = insuranceClaimSchema.parse(claimData);
      
      // Calculate expected reimbursement
      const expectedReimbursement = this.calculateExpectedReimbursement(
        validatedData.procedures,
        validatedData.insuranceProvider
      );
      
      // Generate claim number
      const claimNumber = `DM-${Date.now()}-${validatedData.patientId}`;
      
      // Create insurance claim record
      const claim = await storage.createInsuranceClaim({
        patientId: validatedData.patientId,
        treatmentPlanId: validatedData.treatmentPlanId,
        submissionDate: new Date(),
        status: "submitted",
        claimNumber,
        approvedAmount: 0, // Will be updated when claim is processed
      });
      
      // Mock electronic submission to insurance (in real system, this would call an API)
      // This is where you would integrate with clearinghouses like Change Healthcare, DentalXChange, etc.
      console.log(`Submitting claim ${claimNumber} to ${validatedData.insuranceProvider} electronically`);
      
      return {
        ...claim,
        expectedReimbursement,
        estimatedProcessingTime: "14-21 days"
      };
    } catch (error) {
      console.error("Insurance claim error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to submit insurance claim");
    }
  }
  
  async getFinancialSummary(startDate: Date, endDate: Date) {
    try {
      // Validate date range
      const validatedDates = financialDateRangeSchema.parse({ startDate, endDate });
      
      // Get all financial transactions in date range
      const transactions = await storage.getFinancialTransactionsInDateRange(
        validatedDates.startDate,
        validatedDates.endDate
      );
      
      // Calculate summary metrics
      const revenue = transactions
        .filter(t => t.type === "payment" || t.type === "insurance_payment")
        .reduce((sum, t) => sum + t.amount, 0);
        
      const refunds = transactions
        .filter(t => t.type === "refund")
        .reduce((sum, t) => sum + t.amount, 0);
        
      const adjustments = transactions
        .filter(t => t.type === "adjustment")
        .reduce((sum, t) => sum + t.amount, 0);
        
      const netRevenue = revenue - refunds + adjustments;
      
      // Get payment method breakdown
      const paymentMethods = {
        cash: 0,
        creditCard: 0,
        check: 0,
        insurance: 0,
        other: 0
      };
      
      transactions
        .filter(t => t.type === "payment")
        .forEach(t => {
          switch (t.method) {
            case "cash":
              paymentMethods.cash += t.amount;
              break;
            case "credit_card":
              paymentMethods.creditCard += t.amount;
              break;
            case "check":
              paymentMethods.check += t.amount;
              break;
            case "insurance":
              paymentMethods.insurance += t.amount;
              break;
            default:
              paymentMethods.other += t.amount;
          }
        });
      
      return {
        period: {
          start: validatedDates.startDate,
          end: validatedDates.endDate
        },
        revenue,
        refunds,
        adjustments,
        netRevenue,
        paymentMethods,
        transactionCount: transactions.length
      };
    } catch (error) {
      console.error("Financial summary error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate financial summary");
    }
  }
  
  async generateTaxReport(year: number) {
    try {
      // Get all financial transactions for the year
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      
      const transactions = await storage.getFinancialTransactionsInDateRange(startDate, endDate);
      
      // Calculate quarterly breakdowns
      const quarterlyRevenue = [0, 0, 0, 0];
      
      transactions.forEach(t => {
        if (t.fiscalQuarter >= 1 && t.fiscalQuarter <= 4) {
          if (t.type === "payment" || t.type === "insurance_payment") {
            quarterlyRevenue[t.fiscalQuarter - 1] += t.amount;
          }
        }
      });
      
      // Calculate by category using categoryCode
      const categorizedRevenue: Record<string, number> = {};
      
      transactions.forEach(t => {
        if (t.type === "payment" || t.type === "insurance_payment") {
          if (t.categoryCode) {
            if (!categorizedRevenue[t.categoryCode]) {
              categorizedRevenue[t.categoryCode] = 0;
            }
            categorizedRevenue[t.categoryCode] += t.amount;
          }
        }
      });
      
      return {
        year,
        totalRevenue: quarterlyRevenue.reduce((sum, q) => sum + q, 0),
        quarterlyRevenue,
        categorizedRevenue,
        transactionCount: transactions.length
      };
    } catch (error) {
      console.error("Tax report error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate tax report");
    }
  }
  
  private getFiscalPeriod(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    let fiscalQuarter = 1;
    if (month >= 4 && month <= 6) fiscalQuarter = 2;
    else if (month >= 7 && month <= 9) fiscalQuarter = 3;
    else if (month >= 10) fiscalQuarter = 4;
    
    return {
      fiscalYear: year,
      fiscalQuarter
    };
  }
  
  private calculateExpectedReimbursement(
    procedures: Array<{code: string, fee: number}>,
    insuranceProvider: string
  ) {
    // Get insurance provider details or default to standard coverage
    const provider = insuranceProviders[insuranceProvider as keyof typeof insuranceProviders] || {
      name: "Standard",
      coverageRates: {
        preventive: 0.8,
        basic: 0.6,
        major: 0.4,
        orthodontic: 0.3,
      },
      annualMax: 1500,
    };
    
    let totalReimbursement = 0;
    
    procedures.forEach(proc => {
      // Extract procedure category code range
      const codePrefix = proc.code.substring(0, 5); // e.g., "D0120"
      
      // Determine procedure category and apply appropriate coverage rate
      let category = "basic"; // Default
      
      for (const [range, cat] of Object.entries(procedureCategories)) {
        const [start, end] = range.split("-");
        if (codePrefix >= start && codePrefix <= end) {
          category = cat;
          break;
        }
      }
      
      // Calculate reimbursement for this procedure
      const coverageRate = provider.coverageRates[category as keyof typeof provider.coverageRates];
      totalReimbursement += proc.fee * coverageRate;
    });
    
    // Ensure reimbursement doesn't exceed annual maximum
    return Math.min(totalReimbursement, provider.annualMax);
  }
  
  async estimatePatientCost(treatmentPlanId: number, insuranceProviderId: string) {
    try {
      const treatmentPlan = await storage.getTreatmentPlan(treatmentPlanId);
      
      if (!treatmentPlan) {
        throw new Error("Treatment plan not found");
      }
      
      // Get procedures from treatment plan
      const procedures = treatmentPlan.procedures as any[];
      
      if (!procedures || !Array.isArray(procedures)) {
        throw new Error("Invalid procedure data in treatment plan");
      }
      
      // Calculate expected insurance coverage
      const expectedReimbursement = this.calculateExpectedReimbursement(
        procedures,
        insuranceProviderId
      );
      
      // Calculate patient responsibility
      const totalCost = treatmentPlan.cost;
      const patientResponsibility = Math.max(0, totalCost - expectedReimbursement);
      
      return {
        treatmentPlanId,
        totalCost,
        expectedInsuranceCoverage: expectedReimbursement,
        patientResponsibility,
        insuranceProvider: insuranceProviderId,
      };
    } catch (error) {
      console.error("Cost estimation error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to estimate patient cost");
    }
  }
}

export const financialService = new FinancialService();
