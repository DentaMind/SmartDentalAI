import { SymptomPrediction } from "@shared/schema";

// Specialized domain insights
export interface DomainInsight {
  findings: string[];
  recommendations: string[];
  confidenceLevel: number;
}

interface PerioInsight extends DomainInsight {
  pocketDepths?: number[];
  boneLoss?: string;
  mobilityGrades?: Record<string, number>;
}

interface EndoInsight extends DomainInsight {
  pulpStatus?: string;
  periapicalStatus?: string;
  vitalityTestResults?: Record<string, string>;
}

interface RestorativeInsight extends DomainInsight {
  cariesExtent?: string;
  structuralDamage?: string;
  restorationNeeds?: string[];
}

interface ProsthoInsight extends DomainInsight {
  occlusionStatus?: string;
  prostheticOptions?: string[];
  materialRecommendations?: string[];
}

interface SurgicalInsight extends DomainInsight {
  extractionDifficulty?: string;
  healingRisk?: string;
  surgicalApproach?: string;
}

interface ImagingInsight extends DomainInsight {
  radiographicFindings: string[];
  anatomicalStructures: string[];
  pathologyDetected: boolean;
}

interface MedicalInsight extends DomainInsight {
  contraindications: string[];
  systemicConditions: string[];
  medicationInteractions: string[];
}

// Process symptoms through specialized dental domains
export function processThroughDomains(
  symptoms: string,
  patientHistory?: string,
  xrayImages?: string[]
): Record<string, DomainInsight> {
  const domains: Record<string, DomainInsight> = {};

  // Process through Periodontal AI
  if (symptoms.toLowerCase().includes("bleeding gums") || 
      symptoms.toLowerCase().includes("gum recession") ||
      symptoms.toLowerCase().includes("loose teeth")) {
    domains.periodontics = {
      findings: [
        "Possible periodontal involvement",
        "Signs of gingival inflammation",
        symptoms.toLowerCase().includes("loose teeth") ? "Potential advanced periodontitis" : "Early-stage periodontal disease"
      ],
      recommendations: [
        "Complete periodontal charting",
        "Evaluate for bone loss radiographically",
        "Consider scaling and root planing",
        "Assess mobility and furcation involvement"
      ],
      confidenceLevel: 0.85
    };
  }

  // Process through Endodontic AI
  if (symptoms.toLowerCase().includes("throbbing") || 
      symptoms.toLowerCase().includes("severe pain") ||
      symptoms.toLowerCase().includes("sensitivity to hot")) {
    domains.endodontics = {
      findings: [
        "Possible pulpal involvement",
        "Signs of irreversible pulpitis",
        symptoms.toLowerCase().includes("swelling") ? "Potential periapical abscess" : "Pulpal inflammation"
      ],
      recommendations: [
        "Pulp vitality testing",
        "Periapical radiograph",
        "Consider endodontic treatment",
        "Evaluate for cracked tooth syndrome"
      ],
      confidenceLevel: 0.9
    };
  }

  // Process through Restorative AI
  if (symptoms.toLowerCase().includes("cavity") || 
      symptoms.toLowerCase().includes("broken tooth") ||
      symptoms.toLowerCase().includes("sensitivity to cold")) {
    domains.restorative = {
      findings: [
        "Possible carious lesion",
        "Potential restoration failure",
        symptoms.toLowerCase().includes("broken") ? "Fractured tooth structure" : "Enamel or dentin sensitivity"
      ],
      recommendations: [
        "Evaluate extent of caries or fracture",
        "Consider restoration options",
        "Assess occlusal factors",
        "Check adjacent teeth for secondary caries"
      ],
      confidenceLevel: 0.8
    };
  }

  // Process through Prosthodontic AI
  if (symptoms.toLowerCase().includes("missing tooth") || 
      symptoms.toLowerCase().includes("loose denture") ||
      symptoms.toLowerCase().includes("broken crown")) {
    domains.prosthodontics = {
      findings: [
        "Prosthetic-related issue",
        symptoms.toLowerCase().includes("loose") ? "Poor retention or fit" : "Prosthetic failure",
        "Possible occlusal disharmony"
      ],
      recommendations: [
        "Evaluate current prosthetics",
        "Consider replacement or repair",
        "Assess occlusal relationships",
        "Check abutment integrity"
      ],
      confidenceLevel: 0.75
    };
  }

  // Process through Oral Surgery AI
  if (symptoms.toLowerCase().includes("wisdom") ||
      symptoms.toLowerCase().includes("swelling") ||
      symptoms.toLowerCase().includes("jaw pain")) {
    domains.oralSurgery = {
      findings: [
        "Potential surgical case",
        symptoms.toLowerCase().includes("wisdom") ? "Wisdom tooth evaluation needed" : "Oral pathology assessment",
        "Evaluate for infection or trauma"
      ],
      recommendations: [
        "CBCT imaging recommended",
        "Assess surgical difficulty",
        "Review medical history for contraindications",
        "Consider treatment timing"
      ],
      confidenceLevel: 0.85
    };
  }

  // Process through Imaging AI (if X-rays provided)
  if (xrayImages?.length) {
    domains.imaging = {
      findings: [
        "Radiographic examination pending",
        "Will analyze bone levels and pathology",
        "Check for caries and restorations"
      ],
      recommendations: [
        "Compare with previous radiographs",
        "Consider 3D imaging if needed",
        "Document all findings"
      ],
      confidenceLevel: 0.9
    };
  }

  // Process through Medical History AI
  if (patientHistory) {
    domains.medicalHistory = {
      findings: [
        "Review of systemic conditions",
        "Medication interactions check",
        "Risk assessment needed"
      ],
      recommendations: [
        "Update medical history",
        "Consult with physician if needed",
        "Monitor vital signs during treatment"
      ],
      confidenceLevel: 0.8
    };
  }

  return domains;
}

// Enhance the prediction with domain-specific insights
export function enhancePredictionWithDomains(
  prediction: SymptomPrediction,
  domains: Record<string, DomainInsight>
): SymptomPrediction {
  const enhancedPrediction = { ...prediction };

  // Add domain insights
  enhancedPrediction.aiDomains = Object.entries(domains).reduce((acc, [domain, insight]) => {
    acc[domain as keyof typeof acc] = {
      findings: insight.findings,
      recommendations: insight.recommendations
    };
    return acc;
  }, {} as SymptomPrediction['aiDomains']);

  return enhancedPrediction;
}