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
import { z } from "zod";
import { storage } from "../storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Data validation schemas
const paymentSchema = z.object({
  patientId: z.number(),
  amount: z.number().positive(),
  date: z.string().optional(),
  method: z.enum(["credit", "debit", "cash", "insurance", "other"]),
  description: z.string().optional(),
  insuranceClaim: z.boolean().default(false)
});

const insuranceClaimSchema = z.object({
  patientId: z.number(),
  procedureCodes: z.array(z.string()),
  diagnosisCodes: z.array(z.string()),
  providerId: z.string(),
  serviceDate: z.string(),
  totalAmount: z.number().positive(),
  attachments: z.array(z.string()).optional()
});

class FinancialService {
  async processPayment(paymentData: unknown) {
    try {
      const validatedData = paymentSchema.parse(paymentData);
      
      // Check if patient exists
      const patient = await storage.getPatient(validatedData.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }
      
      // Set date to now if not provided
      if (!validatedData.date) {
        validatedData.date = new Date().toISOString();
      }
      
      // Store payment in database
      const payment = await storage.createPayment({
        ...validatedData,
        status: "completed",
        createdAt: new Date().toISOString()
      });
      
      // If it's an insurance claim, process it
      if (validatedData.insuranceClaim) {
        // This would involve creating a claim record
        // Implementation depends on storage methods
      }
      
      return payment;
    } catch (error) {
      console.error("Payment processing error:", error);
      throw error;
    }
  }
  
  async submitInsuranceClaim(claimData: unknown) {
    try {
      const validatedData = insuranceClaimSchema.parse(claimData);
      
      // Check if patient exists
      const patient = await storage.getPatient(validatedData.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }
      
      // In a real system, this would communicate with insurance APIs
      // For now, we'll store the claim and simulate processing
      
      const claim = await storage.createInsuranceClaim({
        ...validatedData,
        status: "submitted",
        submissionDate: new Date().toISOString(),
        claimNumber: `CLAIM-${Date.now()}`
      });
      
      return claim;
    } catch (error) {
      console.error("Insurance claim submission error:", error);
      throw error;
    }
  }
  
  async getFinancialSummary(startDate: Date, endDate: Date) {
    try {
      // Validate date range
      if (startDate >= endDate) {
        throw new Error("Start date must be before end date");
      }
      
      // Get all payments in date range
      const payments = await storage.getPaymentsByDateRange(startDate, endDate);
      
      // Get all insurance claims in date range
      const claims = await storage.getInsuranceClaimsByDateRange(startDate, endDate);
      
      // Calculate summaries
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const pendingClaims = claims.filter(claim => claim.status === "submitted").length;
      const approvedClaims = claims.filter(claim => claim.status === "approved").length;
      const deniedClaims = claims.filter(claim => claim.status === "denied").length;
      
      // Group by payment method
      const revenueByMethod = payments.reduce((acc, payment) => {
        const method = payment.method;
        acc[method] = (acc[method] || 0) + payment.amount;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        totalRevenue,
        claims: {
          total: claims.length,
          pending: pendingClaims,
          approved: approvedClaims,
          denied: deniedClaims,
          submissionRate: claims.length > 0 ? (approvedClaims / claims.length) : 0
        },
        revenueByMethod,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      };
    } catch (error) {
      console.error("Financial summary error:", error);
      throw error;
    }
  }
  
  async generateTaxReport(year: number) {
    try {
      // Validate year
      const currentYear = new Date().getFullYear();
      if (year > currentYear) {
        throw new Error("Cannot generate tax report for future years");
      }
      
      const startDate = new Date(`${year}-01-01T00:00:00Z`);
      const endDate = new Date(`${year}-12-31T23:59:59Z`);
      
      // Get all financial transactions for the year
      const payments = await storage.getPaymentsByDateRange(startDate, endDate);
      const claims = await storage.getInsuranceClaimsByDateRange(startDate, endDate);
      
      // Calculate tax-relevant information
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const insuranceRevenue = payments
        .filter(payment => payment.method === "insurance")
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      // Generate financial report with AI assistance
      const reportData = {
        year,
        totalRevenue,
        insuranceRevenue,
        nonInsuranceRevenue: totalRevenue - insuranceRevenue,
        transactionCount: payments.length,
        claimsProcessed: claims.length,
        quarterlyBreakdown: this.calculateQuarterlyBreakdown(payments, year)
      };
      
      // Use AI to generate insights
      const insights = await this.generateFinancialInsights(reportData);
      
      return {
        ...reportData,
        insights
      };
    } catch (error) {
      console.error("Tax report generation error:", error);
      throw error;
    }
  }
  
  private calculateQuarterlyBreakdown(payments: any[], year: number) {
    const quarters = [
      { start: new Date(`${year}-01-01`), end: new Date(`${year}-03-31`), revenue: 0 },
      { start: new Date(`${year}-04-01`), end: new Date(`${year}-06-30`), revenue: 0 },
      { start: new Date(`${year}-07-01`), end: new Date(`${year}-09-30`), revenue: 0 },
      { start: new Date(`${year}-10-01`), end: new Date(`${year}-12-31`), revenue: 0 }
    ];
    
    payments.forEach(payment => {
      const paymentDate = new Date(payment.date);
      for (let i = 0; i < quarters.length; i++) {
        if (paymentDate >= quarters[i].start && paymentDate <= quarters[i].end) {
          quarters[i].revenue += payment.amount;
          break;
        }
      }
    });
    
    return quarters.map((q, i) => ({
      quarter: i + 1,
      revenue: q.revenue
    }));
  }
  
  private async generateFinancialInsights(reportData: any) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a dental practice financial analyst. Analyze the financial data and provide actionable insights for tax planning and practice management."
          },
          {
            role: "user",
            content: JSON.stringify(reportData)
          }
        ],
        response_format: { type: "json_object" }
      });
      
      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("AI insights generation error:", error);
      return {
        summary: "Unable to generate AI insights at this time",
        recommendations: ["Review quarterly revenue data", "Consult with financial advisor"]
      };
    }
  }
}

export const financialService = new FinancialService();
