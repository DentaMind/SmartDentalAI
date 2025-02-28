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
