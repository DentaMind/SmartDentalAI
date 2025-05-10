
import { PatientMedicalHistory } from "@shared/schema";

interface MedicalRiskFactor {
  condition: string;
  severity: "low" | "medium" | "high";
  dentalImplications: string[];
  treatmentModifications: string[];
  references: string[];
}

interface MedicationInteraction {
  medication: string;
  interactsWith: string[];
  implications: string[];
  recommendations: string[];
}

export interface MedicalAnalysisResult {
  riskFactors: MedicalRiskFactor[];
  medicationInteractions: MedicationInteraction[];
  treatmentContraindications: string[];
  recommendedPrecautions: string[];
  overallRiskLevel: "low" | "moderate" | "high";
}

/**
 * Analyzes patient medical history to identify potential risks and contraindications
 * for dental treatment
 */
export async function analyzeMedicalHistory(
  medicalHistory: PatientMedicalHistory
): Promise<MedicalAnalysisResult> {
  // Default empty analysis
  const analysis: MedicalAnalysisResult = {
    riskFactors: [],
    medicationInteractions: [],
    treatmentContraindications: [],
    recommendedPrecautions: [],
    overallRiskLevel: "low"
  };

  // Process systemic conditions
  if (medicalHistory.systemicConditions) {
    for (const condition of medicalHistory.systemicConditions) {
      if (condition.toLowerCase().includes("diabetes")) {
        analysis.riskFactors.push({
          condition: "Diabetes",
          severity: "medium",
          dentalImplications: [
            "Increased risk of periodontal disease",
            "Delayed wound healing",
            "Increased risk of infection"
          ],
          treatmentModifications: [
            "Ensure blood glucose is controlled before invasive procedures",
            "Consider antibiotic prophylaxis",
            "Schedule shorter morning appointments"
          ],
          references: ["ADA Guidelines 2023"]
        });
      }
      
      if (condition.toLowerCase().includes("hypertension")) {
        analysis.riskFactors.push({
          condition: "Hypertension",
          severity: "medium",
          dentalImplications: [
            "Risk of hypertensive crisis during treatment",
            "Potential interaction with vasoconstrictors in anesthetics"
          ],
          treatmentModifications: [
            "Monitor blood pressure before treatment",
            "Consider limiting epinephrine use",
            "Stress reduction protocols"
          ],
          references: ["AHA/ADA Joint Guidelines 2022"]
        });
      }
    }
  }

  // Process medications
  if (medicalHistory.medications) {
    for (const medication of medicalHistory.medications) {
      if (medication.toLowerCase().includes("warfarin") || 
          medication.toLowerCase().includes("coumadin")) {
        analysis.medicationInteractions.push({
          medication: "Anticoagulant therapy",
          interactsWith: ["Invasive dental procedures", "NSAIDs", "Some antibiotics"],
          implications: [
            "Increased bleeding risk during surgical procedures",
            "Potential for excessive postoperative bleeding"
          ],
          recommendations: [
            "Check INR prior to invasive procedures",
            "Consider hemostatic measures",
            "Avoid NSAID pain medications"
          ]
        });
        
        analysis.recommendedPrecautions.push(
          "Consult with patient's physician before invasive procedures",
          "Consider local hemostatic agents during surgery"
        );
      }
      
      if (medication.toLowerCase().includes("bisphosphonate")) {
        analysis.medicationInteractions.push({
          medication: "Bisphosphonate therapy",
          interactsWith: ["Extractions", "Implant placement", "Periodontal surgery"],
          implications: [
            "Risk of medication-related osteonecrosis of the jaw (MRONJ)",
            "Impaired bone healing"
          ],
          recommendations: [
            "Consider conservative alternatives to extractions",
            "Evaluate duration and type of bisphosphonate therapy",
            "Thorough informed consent for surgical procedures"
          ]
        });
        
        analysis.treatmentContraindications.push(
          "Elective dentoalveolar surgery may be contraindicated depending on medication duration"
        );
      }
    }
  }

  // Determine overall risk level
  if (analysis.treatmentContraindications.length > 0) {
    analysis.overallRiskLevel = "high";
  } else if (analysis.medicationInteractions.length > 0 || analysis.riskFactors.length > 0) {
    analysis.overallRiskLevel = "moderate";
  }

  return analysis;
}
