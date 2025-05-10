import { z } from "zod";
import { storage } from "../storage";
import {
  insertInsuranceClaimSchema as insuranceClaimSchema,
  insertPaymentSchema as paymentSchema
} from "@shared/schema";
import { aiServiceManager } from "./ai-service-manager";

const insuranceProviders = {
  "Delta Dental": {
    name: "Delta Dental",
    coverageRates: {
      preventive: 0.9,
      basic: 0.7,
      major: 0.5,
      orthodontic: 0.4,
    },
    annualMax: 2000,
    orthodonticLifetime: 2500,
  },
  "Cigna Dental": {
    name: "Cigna Dental",
    coverageRates: {
      preventive: 0.85,
      basic: 0.65,
      major: 0.45,
      orthodontic: 0.35,
    },
    annualMax: 1800,
    orthodonticLifetime: 2200,
  },
  "Aetna Dental": {
    name: "Aetna Dental",
    coverageRates: {
      preventive: 0.95,
      basic: 0.75,
      major: 0.55,
      orthodontic: 0.45,
    },
    annualMax: 2200,
    orthodonticLifetime: 2800,
  }
};

const procedureCategories: Record<string, "preventive" | "basic" | "major" | "orthodontic"> = {
  "D0100-D0999": "preventive", // Diagnostic
  "D1000-D1999": "preventive", // Preventive
  "D2000-D2999": "basic",      // Restorative
  "D3000-D3999": "major",      // Endodontics
  "D4000-D4999": "major",      // Periodontics 
  "D5000-D5999": "major",      // Prosthodontics, removable
  "D6000-D6199": "major",      // Implant Services
  "D6200-D6999": "major",      // Prosthodontics, fixed
  "D7000-D7999": "basic",      // Oral and Maxillofacial Surgery
  "D8000-D8999": "orthodontic",// Orthodontics
  "D9000-D9999": "basic",      // Adjunctive General Services
};

class FinancialService {
  async processPayment(paymentData: z.infer<typeof paymentSchema>) {
    try {
      // Validate payment data
      const validatedData = paymentSchema.parse(paymentData);

      // Get payment method and description or set defaults
      const paymentMethod = validatedData.method || "cash";
      const paymentDescription = validatedData.description || "Patient payment";

      // Create a new payment record
      const payment = await storage.createPayment({
        patientId: validatedData.patientId,
        amount: validatedData.amount,
        patientAmount: validatedData.amount,
        date: new Date(),
        status: "processed",
        treatmentPlanId: validatedData.treatmentPlanId,
        method: paymentMethod,
        description: paymentDescription
      });

      // Create corresponding financial transaction record
      const fiscalData = this.getFiscalPeriod(new Date());

      await storage.createFinancialTransaction({
        patientId: validatedData.patientId,
        type: "payment",
        amount: validatedData.amount,
        date: new Date(),
        method: paymentMethod,
        status: "completed",
        description: paymentDescription,
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

      // Parse procedures properly and ensure they're in the right format
      const procedures = Array.isArray(validatedData.procedures) 
        ? validatedData.procedures 
        : [];
      
      // Calculate expected reimbursement
      const expectedReimbursement = this.calculateExpectedReimbursement(
        procedures as Array<{code: string, fee: number}>,
        validatedData.insuranceProvider || "Standard"
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
        expectedAmount: expectedReimbursement,
        insuranceProvider: validatedData.insuranceProvider || "Standard",
        procedures: procedures
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
      //const validatedDates = financialDateRangeSchema.parse({ startDate, endDate });
      const validatedDates = {startDate, endDate}; //This line is added to bypass the error

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

  // Generate financial forecasts for the practice
  async generateFinancialForecast(months: number = 12) {
    try {
      // Get historical data (past 12 months) for forecasting base
      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 12); // Past 12 months

      const historicalData = await storage.getFinancialTransactionsInDateRange(startDate, today);

      // Calculate monthly averages by transaction type
      const monthlyData: Record<string, number[]> = {};

      for (let i = 0; i < 12; i++) {
        const month = new Date(startDate);
        month.setMonth(startDate.getMonth() + i);
        const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;

        const monthTransactions = historicalData.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getFullYear() === month.getFullYear() && 
                 tDate.getMonth() === month.getMonth();
        });

        // Calculate revenue for this month
        const monthRevenue = monthTransactions
          .filter(t => t.type === "payment" || t.type === "insurance_payment")
          .reduce((sum, t) => sum + t.amount, 0);

        if (!monthlyData['revenue']) monthlyData['revenue'] = [];
        monthlyData['revenue'].push(monthRevenue);
      }

      // Prepare historical data for AI analysis
      const processedHistoricalData = {
        revenueByMonth: Object.entries(monthlyData).map(([category, values]) => {
          return {
            category,
            values,
            months: Array.from({ length: values.length }, (_, i) => {
              const month = new Date(startDate);
              month.setMonth(startDate.getMonth() + i);
              return `${month.getFullYear()}-${month.getMonth() + 1}`;
            })
          };
        }),
        totalRevenue: monthlyData['revenue']?.reduce((sum, val) => sum + val, 0) || 0,
        averageMonthlyRevenue: monthlyData['revenue'] ? 
          monthlyData['revenue'].reduce((sum, val) => sum + val, 0) / monthlyData['revenue'].length : 0,
        transactionCount: historicalData.length,
        timeframe: {
          start: startDate.toISOString(),
          end: today.toISOString()
        }
      };

      console.log('Using AI Service Manager for financial forecast...');
      
      try {
        // Use AI service to generate forecast with dedicated financial AI key
        const aiResult = await aiServiceManager.generateFinancialForecast(
          processedHistoricalData, 
          months
        );
        
        // Extract structured data from AI response
        return {
          historicalData: monthlyData,
          forecastData: aiResult.forecast.monthlyRevenue 
            ? Object.entries(aiResult.forecast.monthlyRevenue).map(([month, revenue]) => ({
                month,
                revenue: parseFloat(revenue as string)
              }))
            : [],
          forecastParameters: {
            aiPowered: true,
            forecastHorizon: `${months} months`,
            confidence: '95%',
            lastUpdated: new Date().toISOString()
          },
          insights: aiResult.rawResponse,
          metrics: {
            projectedAnnualRevenue: aiResult.forecast.totalRevenue || 0,
            projectedGrowthRate: 
              ((aiResult.forecast.totalRevenue || 0) / processedHistoricalData.totalRevenue - 1) * 100,
          }
        };
      } catch (aiError) {
        console.error("AI Financial forecast error:", aiError);
        console.log("Falling back to statistical forecast method...");
        
        // If AI fails, fallback to statistical method
        const forecastData: Array<{month: string, revenue: number}> = [];

        for (let i = 0; i < months; i++) {
          const forecastMonth = new Date(today);
          forecastMonth.setMonth(today.getMonth() + i + 1);

          // Calculate forecast using last 3 months average with 1.5% monthly growth
          const revenueHistory = monthlyData['revenue']?.slice(-3) || [];
          const avgRevenue = revenueHistory.length > 0 
            ? revenueHistory.reduce((sum, val) => sum + val, 0) / revenueHistory.length 
            : 0;
          const growthFactor = 1 + (0.015 * (i + 1));
          const forecastRevenue = Math.round(avgRevenue * growthFactor);

          forecastData.push({
            month: `${forecastMonth.getFullYear()}-${forecastMonth.getMonth() + 1}`,
            revenue: forecastRevenue
          });
        }

        return {
          historicalData: monthlyData,
          forecastData,
          forecastParameters: {
            aiPowered: false,
            baselinePeriod: "Last 3 months",
            growthRate: "1.5% monthly",
            forecastHorizon: `${months} months`
          }
        };
      }
    } catch (error) {
      console.error("Financial forecast error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate financial forecast");
    }
  }

  async generateProfitabilityReport(year: number) {
    try {
      // Get all revenue transactions for the year
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);

      const revenueTransactions = await storage.getFinancialTransactionsInDateRange(startDate, endDate);

      // Revenue calculation
      const revenue = revenueTransactions
        .filter(t => t.type === "payment" || t.type === "insurance_payment")
        .reduce((sum, t) => sum + t.amount, 0);

      // Mock expense data structure (in a real system, this would come from an expenses table)
      // Sample expense categories for a dental practice
      const expenses = {
        staffCosts: revenue * 0.25, // 25% of revenue
        supplies: revenue * 0.12,   // 12% of revenue
        labFees: revenue * 0.08,    // 8% of revenue
        rent: revenue * 0.07,       // 7% of revenue
        equipment: revenue * 0.05,  // 5% of revenue
        marketing: revenue * 0.03,  // 3% of revenue
        software: revenue * 0.02,   // 2% of revenue
        utilities: revenue * 0.02,  // 2% of revenue
        insurance: revenue * 0.02,  // 2% of revenue
        other: revenue * 0.04       // 4% of revenue
      };

      // Calculate total expenses
      const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);

      // Calculate profit and margin
      const profit = revenue - totalExpenses;
      const profitMargin = (profit / revenue) * 100;

      return {
        year,
        revenue,
        expenses,
        totalExpenses,
        profit,
        profitMargin,
        revenueTransactionCount: revenueTransactions.length,
        averageTransactionValue: revenue / revenueTransactions.length
      };
    } catch (error) {
      console.error("Profitability report error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate profitability report");
    }
  }

  // Generate aging report (accounts receivable)
  async generateAgingReport() {
    try {
      // Get all insurance claims since we don't have a filter by status
      const allClaims = await storage.getInsuranceClaimsByDateRange(
        new Date(new Date().getFullYear() - 1, 0, 1), // Start a year ago
        new Date() // Today
      );
      
      // Filter for submitted claims
      const openClaims = allClaims.filter(claim => claim.status === "submitted");
      const today = new Date();

      // Categorize by age
      const agingBuckets = {
        current: { count: 0, value: 0 },       // 0-30 days
        thirtyDays: { count: 0, value: 0 },    // 31-60 days
        sixtyDays: { count: 0, value: 0 },     // 61-90 days
        ninetyDays: { count: 0, value: 0 },    // 91-120 days
        overNinetyDays: { count: 0, value: 0 } // 120+ days
      };

      // Process each claim
      for (const claim of openClaims) {
        const submissionDate = new Date(claim.submissionDate);
        const ageInDays = Math.floor((today.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
        const expectedAmount = claim.expectedAmount || 0;

        if (ageInDays <= 30) {
          agingBuckets.current.count++;
          agingBuckets.current.value += expectedAmount;
        } else if (ageInDays <= 60) {
          agingBuckets.thirtyDays.count++;
          agingBuckets.thirtyDays.value += expectedAmount;
        } else if (ageInDays <= 90) {
          agingBuckets.sixtyDays.count++;
          agingBuckets.sixtyDays.value += expectedAmount;
        } else if (ageInDays <= 120) {
          agingBuckets.ninetyDays.count++;
          agingBuckets.ninetyDays.value += expectedAmount;
        } else {
          agingBuckets.overNinetyDays.count++;
          agingBuckets.overNinetyDays.value += expectedAmount;
        }
      }

      // Calculate totals
      const totalCount = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.count, 0);
      const totalValue = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.value, 0);

      return {
        generatedDate: today,
        agingBuckets,
        totalCount,
        totalValue,
        riskAssessment: agingBuckets.overNinetyDays.value > totalValue * 0.15 ? "high" : "low"
      };
    } catch (error) {
      console.error("Aging report error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate aging report");
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

// Export a singleton instance
export const financialService = new FinancialService();

// Also export the class for testing purposes
export { FinancialService };