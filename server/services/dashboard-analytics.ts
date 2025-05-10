import { storage } from "../storage";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.FINANCIAL_AI_KEY || "",
});

interface AnalyticsData {
  patientInsights: PatientInsights;
  clinicPerformance: ClinicPerformance;
  financialOverview: FinancialOverview;
  aiActivityMetrics: AIActivityMetrics;
}

interface PatientInsights {
  totalPatients: number;
  newPatientsThisMonth: number;
  patientRetentionRate: number;
  demographicBreakdown: {
    ageGroups: Record<string, number>;
    gender: Record<string, number>;
  };
  commonConditions: { condition: string; count: number }[];
}

interface ClinicPerformance {
  appointmentsCompleted: number;
  cancelationRate: number;
  averageTreatmentTime: number;
  providerUtilization: Record<string, number>;
  procedureFrequency: { procedure: string; count: number }[];
}

interface FinancialOverview {
  revenueThisMonth: number;
  revenueGrowth: number;
  outstandingClaims: number;
  claimApprovalRate: number;
  averagePaymentTime: number;
  revenueBySources: Record<string, number>;
}

interface AIActivityMetrics {
  totalAIAnalyses: number;
  diagnosisAccuracy: number;
  xrayAnalysesCompleted: number;
  treatmentPlanGenerations: number;
  aiInsightUtilization: number;
  timeToTreatmentReduction: number;
}

class DashboardAnalyticsService {
  async generateDashboardData(startDate: Date, endDate: Date): Promise<AnalyticsData> {
    try {
      // Get all required data for the time period
      const patients = await this.getPatientData(startDate, endDate);
      const appointments = await this.getAppointmentData(startDate, endDate);
      const payments = await this.getFinancialData(startDate, endDate);
      const aiActivity = await this.getAIActivityData(startDate, endDate);
      
      // Process into dashboard format
      return {
        patientInsights: this.processPatientInsights(patients, startDate, endDate),
        clinicPerformance: this.processClinicPerformance(appointments, startDate, endDate),
        financialOverview: this.processFinancialOverview(payments, startDate, endDate),
        aiActivityMetrics: this.processAIActivityMetrics(aiActivity, startDate, endDate)
      };
    } catch (error) {
      console.error("Dashboard analytics generation error:", error);
      throw new Error("Failed to generate dashboard analytics");
    }
  }
  
  async generateSmartInsights(dashboardData: AnalyticsData): Promise<string[]> {
    try {
      // Use AI to generate insights from the dashboard data
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a dental practice analytics expert. Analyze the dashboard data and provide 5 actionable insights for practice improvement."
          },
          {
            role: "user",
            content: JSON.stringify(dashboardData)
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const parsedResponse = JSON.parse(response.choices[0].message.content || "{}");
      return parsedResponse.insights || [];
    } catch (error) {
      console.error("Smart insights generation error:", error);
      return [
        "Unable to generate AI insights at this time",
        "Review patient demographics to identify potential market segments",
        "Analyze procedure frequency to optimize inventory and training"
      ];
    }
  }
  
  async getPeriodontalHealthTrends(months: number = 6): Promise<any> {
    try {
      // In a real implementation, this would query actual patient data
      // For now, we'll return mock data
      
      const today = new Date();
      const monthlyData = [];
      
      for (let i = 0; i < months; i++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        
        monthlyData.push({
          month: monthDate.toISOString().slice(0, 7),
          healthyCount: Math.floor(Math.random() * 80) + 120,
          gingivitisCount: Math.floor(Math.random() * 40) + 60,
          periodontitisCount: Math.floor(Math.random() * 20) + 20,
          improvementRate: Math.random() * 0.3 + 0.5
        });
      }
      
      return {
        trends: monthlyData.reverse(),
        overallImprovement: Math.random() * 0.2 + 0.1
      };
    } catch (error) {
      console.error("Periodontal trends error:", error);
      throw new Error("Failed to generate periodontal health trends");
    }
  }
  
  async getAIImpactMetrics(): Promise<any> {
    try {
      // In a real implementation, this would compare pre-AI and post-AI metrics
      // For now, we'll return mock data
      
      return {
        diagnosisAccuracyImprovement: Math.random() * 0.15 + 0.1,
        treatmentTimeReduction: Math.random() * 10 + 15,
        patientSatisfactionIncrease: Math.random() * 0.2 + 0.1,
        revenueImpact: Math.random() * 20000 + 10000,
        conditionsByAccuracy: [
          { condition: "Caries", accuracyBeforeAI: 0.75, accuracyWithAI: 0.92 },
          { condition: "Periodontal Disease", accuracyBeforeAI: 0.7, accuracyWithAI: 0.88 },
          { condition: "Endodontic Issues", accuracyBeforeAI: 0.65, accuracyWithAI: 0.85 },
          { condition: "TMJ Disorders", accuracyBeforeAI: 0.6, accuracyWithAI: 0.82 }
        ]
      };
    } catch (error) {
      console.error("AI impact metrics error:", error);
      throw new Error("Failed to generate AI impact metrics");
    }
  }
  
  // Helper methods for fetching and processing data
  private async getPatientData(startDate: Date, endDate: Date) {
    // In a real implementation, this would query the database
    // For now, return mock data
    return {
      allPatients: Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        createdAt: new Date(
          startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        ).toISOString(),
        age: Math.floor(Math.random() * 70) + 10,
        gender: Math.random() > 0.5 ? "male" : "female",
        conditions: ["caries", "gingivitis", "sensitivity"].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1)
      }))
    };
  }
  
  private async getAppointmentData(startDate: Date, endDate: Date) {
    // Mock appointment data
    return {
      appointments: Array.from({ length: 300 }, (_, i) => ({
        id: i + 1,
        date: new Date(
          startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        ).toISOString(),
        status: Math.random() > 0.2 ? "completed" : (Math.random() > 0.5 ? "cancelled" : "no-show"),
        duration: Math.floor(Math.random() * 30) + 30,
        providerId: Math.floor(Math.random() * 5) + 1,
        procedure: ["checkup", "cleaning", "filling", "root canal", "extraction"][Math.floor(Math.random() * 5)]
      }))
    };
  }
  
  private async getFinancialData(startDate: Date, endDate: Date) {
    // Mock financial data
    return {
      payments: Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        date: new Date(
          startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        ).toISOString(),
        amount: Math.floor(Math.random() * 900) + 100,
        method: ["credit", "debit", "cash", "insurance"][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.1 ? "completed" : "pending"
      })),
      claims: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        submissionDate: new Date(
          startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        ).toISOString(),
        amount: Math.floor(Math.random() * 900) + 100,
        status: Math.random() > 0.2 ? "approved" : (Math.random() > 0.5 ? "pending" : "denied")
      }))
    };
  }
  
  private async getAIActivityData(startDate: Date, endDate: Date) {
    // Mock AI activity data
    return {
      analyses: Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        date: new Date(
          startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        ).toISOString(),
        type: ["diagnosis", "xray-analysis", "treatment-plan", "perio-analysis"][Math.floor(Math.random() * 4)],
        accurate: Math.random() > 0.15,
        processingTime: Math.floor(Math.random() * 5) + 1
      }))
    };
  }
  
  private processPatientInsights(data: any, startDate: Date, endDate: Date): PatientInsights {
    const totalPatients = data.allPatients.length;
    
    const newPatientsThisMonth = data.allPatients.filter(p => {
      const createdAt = new Date(p.createdAt);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return createdAt >= oneMonthAgo;
    }).length;
    
    // Calculate age groups
    const ageGroups = {
      "0-18": 0,
      "19-35": 0,
      "36-50": 0,
      "51-65": 0,
      "65+": 0
    };
    
    data.allPatients.forEach(p => {
      if (p.age <= 18) ageGroups["0-18"]++;
      else if (p.age <= 35) ageGroups["19-35"]++;
      else if (p.age <= 50) ageGroups["36-50"]++;
      else if (p.age <= 65) ageGroups["51-65"]++;
      else ageGroups["65+"]++;
    });
    
    // Calculate gender distribution
    const gender = {
      male: data.allPatients.filter(p => p.gender === "male").length,
      female: data.allPatients.filter(p => p.gender === "female").length,
      other: data.allPatients.filter(p => p.gender === "other").length
    };
    
    // Calculate common conditions
    const conditionCounts = {};
    data.allPatients.forEach(p => {
      p.conditions.forEach(c => {
        conditionCounts[c] = (conditionCounts[c] || 0) + 1;
      });
    });
    
    const commonConditions = Object.entries(conditionCounts)
      .map(([condition, count]) => ({ condition, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalPatients,
      newPatientsThisMonth,
      patientRetentionRate: 0.85, // Mock retention rate
      demographicBreakdown: {
        ageGroups,
        gender
      },
      commonConditions
    };
  }
  
  private processClinicPerformance(data: any, startDate: Date, endDate: Date): ClinicPerformance {
    const appointmentsCompleted = data.appointments.filter(a => a.status === "completed").length;
    const cancelationRate = data.appointments.filter(a => a.status === "cancelled" || a.status === "no-show").length / data.appointments.length;
    
    const completedAppointments = data.appointments.filter(a => a.status === "completed");
    const averageTreatmentTime = completedAppointments.reduce((sum, a) => sum + a.duration, 0) / (completedAppointments.length || 1);
    
    // Calculate provider utilization
    const providerAppointments = {};
    data.appointments.forEach(a => {
      providerAppointments[a.providerId] = (providerAppointments[a.providerId] || 0) + 1;
    });
    
    const providerUtilization = {};
    Object.entries(providerAppointments).forEach(([providerId, count]) => {
      providerUtilization[`Provider ${providerId}`] = count as number;
    });
    
    // Calculate procedure frequency
    const procedureCounts = {};
    data.appointments.forEach(a => {
      procedureCounts[a.procedure] = (procedureCounts[a.procedure] || 0) + 1;
    });
    
    const procedureFrequency = Object.entries(procedureCounts)
      .map(([procedure, count]) => ({ procedure, count: count as number }))
      .sort((a, b) => b.count - a.count);
    
    return {
      appointmentsCompleted,
      cancelationRate,
      averageTreatmentTime,
      providerUtilization,
      procedureFrequency
    };
  }
  
  private processFinancialOverview(data: any, startDate: Date, endDate: Date): FinancialOverview {
    const completedPayments = data.payments.filter(p => p.status === "completed");
    const revenueThisMonth = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Mock revenue growth
    const revenueGrowth = 0.12;
    
    const outstandingClaims = data.claims.filter(c => c.status === "pending").length;
    const claimApprovalRate = data.claims.filter(c => c.status === "approved").length / data.claims.length;
    
    // Mock average payment time
    const averagePaymentTime = 21.5;
    
    // Calculate revenue by sources
    const revenueBySources = {};
    completedPayments.forEach(p => {
      revenueBySources[p.method] = (revenueBySources[p.method] || 0) + p.amount;
    });
    
    return {
      revenueThisMonth,
      revenueGrowth,
      outstandingClaims,
      claimApprovalRate,
      averagePaymentTime,
      revenueBySources
    };
  }
  
  private processAIActivityMetrics(data: any, startDate: Date, endDate: Date): AIActivityMetrics {
    const totalAIAnalyses = data.analyses.length;
    const diagnosisAccuracy = data.analyses.filter(a => a.accurate).length / totalAIAnalyses;
    
    const xrayAnalysesCompleted = data.analyses.filter(a => a.type === "xray-analysis").length;
    const treatmentPlanGenerations = data.analyses.filter(a => a.type === "treatment-plan").length;
    
    // Mock metrics
    const aiInsightUtilization = 0.75;
    const timeToTreatmentReduction = 22.5;
    
    return {
      totalAIAnalyses,
      diagnosisAccuracy,
      xrayAnalysesCompleted,
      treatmentPlanGenerations,
      aiInsightUtilization,
      timeToTreatmentReduction
    };
  }
}

export const dashboardAnalytics = new DashboardAnalyticsService();
