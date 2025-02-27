
import { SymptomPrediction } from "@shared/schema";

// Domain-specific AI insights
export interface DomainInsight {
  findings: string[];
  recommendations: string[];
  confidenceLevel: number;
}

// Process symptoms through specialized dental domains
export function processThroughDomains(symptoms: string, patientHistory?: string): Record<string, DomainInsight> {
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
        "Consider scaling and root planing"
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
        "Consider endodontic treatment"
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
        "Assess occlusal factors"
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
        "Assess occlusal relationships"
      ],
      confidenceLevel: 0.75
    };
  }
  
  return domains;
}

// Enhance the prediction with domain-specific insights
export function enhancePredictionWithDomains(prediction: SymptomPrediction, domains: Record<string, DomainInsight>): SymptomPrediction {
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
