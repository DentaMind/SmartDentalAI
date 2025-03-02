
import { storage } from "../storage";
import { 
  InsertPayment, 
  InsertFinancialTransaction,
  InsertInsuranceClaim,
  Payment,
  FinancialTransaction,
  InsuranceClaim
} from "@shared/schema";
import { z } from "zod";

// Validation schemas
const paymentSchema = z.object({
  patientId: z.number(),
  amount: z.number().positive(),
  treatmentPlanId: z.number().optional(),
  method: z.string(),
  description: z.string().optional()
});

const insuranceClaimSchema = z.object({
  patientId: z.number(),
  treatmentPlanId: z.number(),
  insuranceProvider: z.string(),
  procedures: z.array(z.object({
    code: z.string(),
    fee: z.number().positive()
  }))
});

const financialDateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date().refine(date => date > new Date(0), {
    message: "End date must be valid"
  })
});

// Insurance provider details
const insuranceProviders = {
  delta: {
    name: "Delta Dental",
    coverageRates: {
      preventive: 1.0,
      basic: 0.8,
      major: 0.5,
      orthodontic: 0.5,
    },
    annualMax: 2000,
  },
  aetna: {
    name: "Aetna",
    coverageRates: {
      preventive: 1.0,
      basic: 0.8,
      major: 0.5,
      orthodontic: 0.5,
    },
    annualMax: 1500,
  },
  cigna: {
    name: "Cigna",
    coverageRates: {
      preventive: 1.0,
      basic: 0.8,
      major: 0.5,
      orthodontic: 0.5,
    },
    annualMax: 1800,
  },
  metlife: {
    name: "MetLife",
    coverageRates: {
      preventive: 1.0,
      basic: 0.8,
      major: 0.5,
      orthodontic: 0.5,
    },
    annualMax: 1750,
  },
  united: {
    name: "United Healthcare",
    coverageRates: {
      preventive: 1.0,
      basic: 0.7,
      major: 0.4,
      orthodontic: 0.5,
    },
    annualMax: 1500,
  }
};

// Mapping procedure code ranges to categories
const procedureCategories: Record<string, string> = {
  "D0100-D0999": "preventive", // Diagnostic
  "D1000-D1999": "preventive", // Preventive
  "D2000-D2999": "basic",      // Restorative
  "D3000-D3999": "major",      // Endodontics
  "D4000-D4999": "major",      // Periodontics
  "D5000-D5999": "major",      // Prosthodontics (removable)
  "D6000-D6999": "major",      // Implant Services
  "D7000-D7999": "basic",      // Oral Surgery
  "D8000-D8999": "orthodontic", // Orthodontics
  "D9000-D9999": "basic",      // Adjunctive Services
};

export class FinancialService {
  async processPayment(paymentData: z.infer<typeof paymentSchema>) {
    try {
      // Validate payment data
      const validatedData = paymentSchema.parse(paymentData);
      
      // Create a new payment record
      const payment = await storage.createPayment({
        patientId: validatedData.patientId,
        amount: validatedData.amount,
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
  
  // Add support for generating monthly financial statement reports
  async generateMonthlyStatement(patientId: number, month: number, year: number) {
    try {
      // Generate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      
      // Get all transactions for this patient in date range
      const transactions = await storage.getFinancialTransactionsInDateRange(startDate, endDate);
      const patientTransactions = transactions.filter(t => t.patientId === patientId);
      
      // Get treatment plans and procedures in this period
      const treatmentPlans = await storage.getPatientTreatmentPlans(patientId);
      const relevantPlans = treatmentPlans.filter(plan => {
        const planDate = new Date(plan.createdAt);
        return planDate >= startDate && planDate <= endDate;
      });
      
      // Calculate totals
      const totalCharges = patientTransactions
        .filter(t => t.type === "payment" || t.type === "insurance_payment")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const insurancePayments = patientTransactions
        .filter(t => t.type === "insurance_payment" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const patientPayments = patientTransactions
        .filter(t => t.type === "payment")
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate balance
      const previousBalance = await this.getPatientBalanceBefore(patientId, startDate);
      const currentBalance = previousBalance + totalCharges - patientPayments - insurancePayments;
      
      return {
        patientId,
        period: {
          month,
          year,
          startDate,
          endDate,
        },
        previousBalance,
        charges: totalCharges,
        insurancePayments,
        patientPayments,
        currentBalance,
        transactions: patientTransactions,
        treatmentPlans: relevantPlans,
      };
    } catch (error) {
      console.error("Monthly statement error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate monthly statement");
    }
  }
  
  private async getPatientBalanceBefore(patientId: number, date: Date) {
    // Get all transactions for this patient before date
    const transactions = await storage.getFinancialTransactionsInDateRange(
      new Date(0), // Beginning of time
      date
    );
    
    const patientTransactions = transactions.filter(t => t.patientId === patientId);
    
    // Calculate balance
    const charges = patientTransactions
      .filter(t => t.type === "payment" || t.type === "insurance_payment")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const payments = patientTransactions
      .filter(t => t.type === "payment" || t.type === "insurance_payment")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return charges - payments;
  }
  
  // Export financial data for accounting systems
  async exportFinancialData(startDate: Date, endDate: Date, format: 'csv' | 'json' | 'excel' = 'json') {
    try {
      // Get transactions in date range
      const transactions = await storage.getFinancialTransactionsInDateRange(startDate, endDate);
      
      // Format data based on requested format
      switch (format) {
        case 'csv':
          return this.formatTransactionsAsCsv(transactions);
        case 'excel':
          return this.formatTransactionsForExcel(transactions);
        case 'json':
        default:
          return JSON.stringify(transactions);
      }
    } catch (error) {
      console.error("Financial data export error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to export financial data");
    }
  }
  
  private formatTransactionsAsCsv(transactions: FinancialTransaction[]) {
    // Convert transactions to CSV format
    const headers = "id,patientId,type,amount,date,method,status,description,fiscalYear,fiscalQuarter\n";
    
    const rows = transactions.map(t => {
      return `${t.id},${t.patientId},${t.type},${t.amount},${t.date},${t.method},${t.status},${t.description},${t.fiscalYear},${t.fiscalQuarter}`;
    }).join("\n");
    
    return headers + rows;
  }
  
  private formatTransactionsForExcel(transactions: FinancialTransaction[]) {
    // This would normally use a library like xlsx
    // For now, just return JSON that could be converted to Excel
    return JSON.stringify(transactions);
  }
}

export const financialService = new FinancialService();
