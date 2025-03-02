
import { storage } from "../storage";
import { z } from "zod";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

// Schemas for data validation
const paymentSchema = z.object({
  patientId: z.number(),
  amount: z.number().positive(),
  method: z.string(),
  treatmentPlanId: z.number().optional(),
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
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
});

// Mock insurance provider data - in production, this would come from a database
const insuranceProviders = {
  "Delta Dental": {
    name: "Delta Dental",
    coverageRates: {
      preventive: 1.0,  // 100% coverage
      basic: 0.8,       // 80% coverage
      major: 0.5,       // 50% coverage
      orthodontic: 0.5  // 50% coverage
    },
    annualMax: 2000,
    deductible: 50
  },
  "Cigna": {
    name: "Cigna",
    coverageRates: {
      preventive: 1.0,
      basic: 0.7,
      major: 0.4,
      orthodontic: 0.5
    },
    annualMax: 1500,
    deductible: 100
  },
  "Aetna": {
    name: "Aetna",
    coverageRates: {
      preventive: 0.9,
      basic: 0.7,
      major: 0.4,
      orthodontic: 0.4
    },
    annualMax: 1800,
    deductible: 75
  }
};

// Procedure category definitions based on CDT codes
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
  "D8000-D8999": "orthodontic", // Orthodontics
  "D9000-D9999": "basic"       // Adjunctive General Services
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
  
  async exportFinancialData(year: number, format: 'xlsx' | 'csv' = 'xlsx') {
    try {
      // Get all financial transactions for the year
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      
      const transactions = await storage.getFinancialTransactionsInDateRange(startDate, endDate);
      
      // Format transaction data
      const formattedData = transactions.map(t => ({
        id: t.id,
        date: dayjs(t.date).format('YYYY-MM-DD'),
        type: t.type,
        amount: t.amount / 100, // Assuming amounts are stored in cents
        method: t.method,
        status: t.status,
        patientId: t.patientId,
        description: t.description || '',
        categoryCode: t.categoryCode || '',
        fiscalYear: t.fiscalYear,
        fiscalQuarter: t.fiscalQuarter
      }));
      
      if (format === 'xlsx') {
        // Create an Excel workbook
        const wb = XLSX.utils.book_new();
        
        // Create worksheet from data
        const ws = XLSX.utils.json_to_sheet(formattedData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, `Financial_Data_${year}`);
        
        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        return {
          filename: `DentaMind_Financial_Export_${year}.xlsx`,
          data: buffer,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
      } else {
        // Convert to CSV
        const csvData = XLSX.utils.json_to_csv(formattedData);
        
        return {
          filename: `DentaMind_Financial_Export_${year}.csv`,
          data: Buffer.from(csvData),
          mimeType: 'text/csv'
        };
      }
    } catch (error) {
      console.error("Financial data export error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to export financial data");
    }
  }
  
  async generateFinancialForecast(months: number = 12) {
    try {
      // Get last 12 months of data for trend analysis
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);
      
      const transactions = await storage.getFinancialTransactionsInDateRange(startDate, endDate);
      
      // Group by month to establish trend
      const monthlyData: Record<string, number> = {};
      
      transactions.forEach(t => {
        if (t.type === "payment" || t.type === "insurance_payment") {
          const monthKey = dayjs(t.date).format('YYYY-MM');
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
          }
          monthlyData[monthKey] += t.amount;
        }
      });
      
      // Convert to array and sort by month
      const sortedMonthlyData = Object.entries(monthlyData)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      // Simple linear forecast (can be replaced with more sophisticated algorithms)
      const forecastData = [];
      
      // Calculate average monthly growth
      let growthRate = 0;
      
      if (sortedMonthlyData.length > 1) {
        const growthRates = [];
        for (let i = 1; i < sortedMonthlyData.length; i++) {
          const prevAmount = sortedMonthlyData[i-1].amount;
          const currentAmount = sortedMonthlyData[i].amount;
          if (prevAmount > 0) {
            growthRates.push((currentAmount - prevAmount) / prevAmount);
          }
        }
        
        // Average growth rate (with outlier protection)
        if (growthRates.length > 0) {
          growthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
          // Cap growth rate between -30% and +30% per month to avoid unrealistic forecasts
          growthRate = Math.max(-0.3, Math.min(0.3, growthRate));
        }
      }
      
      // Get last known amount
      let lastAmount = sortedMonthlyData.length > 0 
        ? sortedMonthlyData[sortedMonthlyData.length - 1].amount 
        : 0;
      
      // Generate forecast
      for (let i = 1; i <= months; i++) {
        const forecastDate = new Date();
        forecastDate.setMonth(forecastDate.getMonth() + i);
        const monthKey = dayjs(forecastDate).format('YYYY-MM');
        
        // Forecast amount using growth rate
        lastAmount = lastAmount * (1 + growthRate);
        
        forecastData.push({
          month: monthKey,
          forecastedAmount: Math.round(lastAmount),
        });
      }
      
      return {
        historicalData: sortedMonthlyData,
        forecastData: forecastData,
        growthRate: growthRate,
        confidence: "medium" // Can be improved with statistical methods
      };
    } catch (error) {
      console.error("Financial forecast error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate financial forecast");
    }
  }
  
  async analyzeProfitability(startDate: Date, endDate: Date) {
    try {
      // Validate date range
      const validatedDates = financialDateRangeSchema.parse({ startDate, endDate });
      
      // Get all financial transactions in date range
      const transactions = await storage.getFinancialTransactionsInDateRange(
        validatedDates.startDate,
        validatedDates.endDate
      );
      
      // Get patients and procedures in the date range to calculate profitability per patient
      const patients = await storage.getPatients();
      
      // Calculate revenue per patient
      const patientRevenue: Record<number, number> = {};
      
      transactions.forEach(t => {
        if (t.type === "payment" || t.type === "insurance_payment") {
          if (!patientRevenue[t.patientId]) {
            patientRevenue[t.patientId] = 0;
          }
          patientRevenue[t.patientId] += t.amount;
        }
      });
      
      // Sort patients by revenue
      const topPatientsByRevenue = Object.entries(patientRevenue)
        .map(([patientId, revenue]) => ({
          patientId: parseInt(patientId),
          revenue,
          patient: patients.find(p => p.id === parseInt(patientId))
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 20);
      
      // Calculate procedure profitability (if procedure cost data is available)
      // This would require procedure cost data that's not currently in the schema
      
      return {
        period: {
          start: validatedDates.startDate,
          end: validatedDates.endDate
        },
        topPatientsByRevenue,
        totalRevenue: Object.values(patientRevenue).reduce((sum, rev) => sum + rev, 0),
        averageRevenuePerPatient: Object.values(patientRevenue).length > 0 
          ? Object.values(patientRevenue).reduce((sum, rev) => sum + rev, 0) / Object.values(patientRevenue).length
          : 0,
      };
    } catch (error) {
      console.error("Profitability analysis error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to analyze profitability");
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
