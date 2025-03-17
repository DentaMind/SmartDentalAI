/**
 * AI Domains for DentaMind
 * 
 * This file defines the different specialized domains that the AI system
 * handles for comprehensive dental diagnosis and treatment planning.
 */

// Import the PatientMedicalHistory interface
interface PatientMedicalHistory {
  systemicConditions?: string[];
  medications?: string[];
  allergies?: string[];
  surgicalHistory?: string[];
  familyHistory?: string[];
  smoking?: boolean;
  alcohol?: boolean;
  pregnancyStatus?: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
  };
}

// AI Domain Types (the specialized areas of the AI system)
export type AIDomain = 
  'general' | // General dentistry
  'perio' |   // Periodontics
  'endo' |    // Endodontics
  'prostho' | // Prosthodontics
  'surgery' | // Oral Surgery
  'ortho' |   // Orthodontics
  'pediatric' | // Pediatric Dentistry
  'insurance'; // Insurance/Financial

// Domain-specific finding from the AI
export interface DomainFinding {
  domain: AIDomain;
  confidence: number; // 0-100
  finding: string;
  recommendations: string[];
  evidencePoints: string[];
  suggestedProcedures?: string[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  additionalTests?: string[];
  references?: string[];
}

// The multi-domain consensus result
export interface MultiDomainConsensus {
  domains: Record<AIDomain, {
    active: boolean;
    findings: DomainFinding[];
    confidence: number;
    diagnosticSummary: string;
  }>;
  overallDiagnosis: string;
  treatmentRecommendations: string[];
  conflictingOpinions?: {
    description: string;
    domains: AIDomain[];
    resolution: string;
  }[];
  consensusLevel: 'high' | 'moderate' | 'low';
}

// Sample diagnosis questions for each domain
export const domainDiagnosticQuestions: Record<AIDomain, string[]> = {
  general: [
    "What are your primary concerns today?",
    "When did you last visit a dentist?",
    "Are you experiencing any pain, and if so, where?",
    "On a scale of 1-10, how would you rate any discomfort?",
    "Is the pain constant or intermittent?",
    "Does anything trigger the pain or make it worse?",
    "Have you noticed any changes in your bite?",
    "Do you have any concerns about the appearance of your teeth?"
  ],
  perio: [
    "Have your gums ever bled when brushing or flossing?",
    "Have you noticed any gum recession?",
    "Do your gums feel tender or swollen?",
    "Have you been told you have gum disease before?",
    "Do you have any loose teeth?",
    "Have you noticed persistent bad breath?",
    "Have you had scaling and root planing (deep cleaning) before?",
    "Do you smoke or use tobacco products?"
  ],
  endo: [
    "Do you experience sensitivity to hot or cold?",
    "Does the pain linger after the stimulus is removed?",
    "Do you have pain when biting down?",
    "Have you had any root canals before?",
    "Have you noticed any swelling or bumps on your gums?",
    "Do you have pain that wakes you up at night?",
    "Have you had any trauma to your teeth recently?",
    "Does the tooth feel different than the others when you tap on it?"
  ],
  prostho: [
    "Do you have any missing teeth?",
    "Do you wear dentures or partial dentures?",
    "Are you interested in dental implants?",
    "Do you have any crowns or bridges?",
    "Do you grind or clench your teeth?",
    "Do you wear a night guard?",
    "Are you satisfied with your smile and the appearance of your teeth?",
    "Do you have difficulty chewing certain foods?"
  ],
  surgery: [
    "Do you have any wisdom teeth?",
    "Have you been told you need any extractions?",
    "Do you have any impacted teeth?",
    "Have you had any oral surgery before?",
    "Do you have anxiety about dental procedures?",
    "Do you prefer sedation for complex procedures?",
    "Do you have any medical conditions that affect healing?",
    "Are you taking blood thinners or medications that affect clotting?"
  ],
  ortho: [
    "Are you concerned about crowded or crooked teeth?",
    "Have you had orthodontic treatment before?",
    "Do you have an overbite or underbite?",
    "Do you have any spaces between your teeth?",
    "Do your teeth come together properly when you bite?",
    "Do you have any jaw pain or clicking?",
    "Have you worn braces or clear aligners before?",
    "Are you interested in orthodontic treatment?"
  ],
  pediatric: [
    "How often does your child brush their teeth?",
    "Does your child use fluoride toothpaste?",
    "Does your child suck their thumb or use a pacifier?",
    "How often does your child consume sugary snacks or drinks?",
    "Has your child had any injuries to their teeth?",
    "Are all of your child's teeth erupting normally?",
    "Does your child have any developmental or behavioral conditions?",
    "Does your child have anxiety about visiting the dentist?"
  ],
  insurance: [
    "What dental insurance do you have?",
    "Is cost a significant factor in your treatment decisions?",
    "Are you familiar with your insurance coverage and limitations?",
    "Do you have secondary insurance?",
    "Are you aware of your annual maximum benefits?",
    "Have you used any of your benefits this year?",
    "Would you like us to explain your financial options?",
    "Are you interested in financing options for treatment?"
  ]
};

// Domain experts metadata
export const domainExperts: Record<AIDomain, {
  name: string;
  title: string;
  specialty: string;
  experience: string;
  description: string;
  avatar: string;
}> = {
  general: {
    name: "Dr. Sarah Reynolds",
    title: "General Dentist",
    specialty: "Comprehensive Dentistry",
    experience: "15 years",
    description: "Comprehensive diagnostic expert with focus on whole-mouth preventive care",
    avatar: "👩‍⚕️"
  },
  perio: {
    name: "Dr. Marcus Chen",
    title: "Periodontist",
    specialty: "Periodontics",
    experience: "12 years",
    description: "Specialist in gum health, bone support, and soft tissue management",
    avatar: "👨‍⚕️"
  },
  endo: {
    name: "Dr. Alicia Patel",
    title: "Endodontist",
    specialty: "Endodontics",
    experience: "10 years",
    description: "Expert in root canal therapy and pulpal disease management",
    avatar: "👩‍⚕️"
  },
  prostho: {
    name: "Dr. Robert Wilson",
    title: "Prosthodontist",
    specialty: "Prosthodontics",
    experience: "18 years",
    description: "Specialist in crowns, bridges, dentures, and complex restorations",
    avatar: "👨‍⚕️"
  },
  surgery: {
    name: "Dr. James Thompson",
    title: "Oral Surgeon",
    specialty: "Oral & Maxillofacial Surgery",
    experience: "14 years",
    description: "Expert in extractions, implants, and oral pathology",
    avatar: "👨‍⚕️"
  },
  ortho: {
    name: "Dr. Emily Rodriguez",
    title: "Orthodontist",
    specialty: "Orthodontics",
    experience: "9 years",
    description: "Specialist in teeth alignment, bite correction, and jaw development",
    avatar: "👩‍⚕️"
  },
  pediatric: {
    name: "Dr. Michael Johnson",
    title: "Pediatric Dentist",
    specialty: "Pediatric Dentistry",
    experience: "11 years",
    description: "Expert in child-specific dental care and development",
    avatar: "👨‍⚕️"
  },
  insurance: {
    name: "Lisa Martinez",
    title: "Insurance Specialist",
    specialty: "Dental Benefits & Financing",
    experience: "16 years",
    description: "Expert in maximizing insurance benefits and treatment financing",
    avatar: "👩‍💼"
  }
};

// Domain weights for different types of patient cases
export const domainWeights: Record<string, Record<AIDomain, number>> = {
  // Standard case (balanced)
  "standard": {
    general: 1.0,
    perio: 1.0,
    endo: 1.0,
    prostho: 1.0,
    surgery: 1.0,
    ortho: 1.0,
    pediatric: 1.0,
    insurance: 1.0
  },
  // Periodontal focus
  "periodontal": {
    general: 0.8,
    perio: 1.5,
    endo: 0.8,
    prostho: 0.7,
    surgery: 0.7,
    ortho: 0.5,
    pediatric: 0.5,
    insurance: 1.0
  },
  // Restorative focus
  "restorative": {
    general: 1.0,
    perio: 0.8,
    endo: 1.2,
    prostho: 1.5,
    surgery: 0.8,
    ortho: 0.5,
    pediatric: 0.5,
    insurance: 1.0
  },
  // Surgical focus
  "surgical": {
    general: 0.8,
    perio: 0.8,
    endo: 0.8,
    prostho: 0.8,
    surgery: 1.5,
    ortho: 0.5,
    pediatric: 0.5,
    insurance: 1.0
  },
  // Pediatric focus
  "pediatric": {
    general: 1.0,
    perio: 0.6,
    endo: 0.8,
    prostho: 0.6,
    surgery: 0.8,
    ortho: 1.2,
    pediatric: 1.5,
    insurance: 0.8
  },
  // Cosmetic focus
  "cosmetic": {
    general: 0.8,
    perio: 0.8,
    endo: 0.6,
    prostho: 1.5,
    surgery: 0.7,
    ortho: 1.2,
    pediatric: 0.5,
    insurance: 1.0
  },
  // Emergency focus
  "emergency": {
    general: 1.2,
    perio: 0.8,
    endo: 1.5,
    prostho: 0.8,
    surgery: 1.2,
    ortho: 0.3,
    pediatric: 0.8,
    insurance: 0.8
  }
};

// Risk factors by domain
export const domainRiskFactors: Record<AIDomain, {factor: string, description: string}[]> = {
  general: [
    { factor: "Tobacco Use", description: "Increases risk of oral cancer, periodontal disease, and staining" },
    { factor: "Poor Oral Hygiene", description: "Increases risk of caries, gingivitis, and halitosis" },
    { factor: "Infrequent Dental Visits", description: "Delays detection of early problems, leading to more complex treatments" },
    { factor: "Acidic Diet", description: "Contributes to enamel erosion and increased caries risk" }
  ],
  perio: [
    { factor: "Diabetes", description: "Increases susceptibility to infection and impairs healing" },
    { factor: "Tobacco Use", description: "Reduces blood flow to gums and impairs healing" },
    { factor: "Genetic Predisposition", description: "Family history of periodontal disease" },
    { factor: "Pregnancy/Hormonal Changes", description: "Increases inflammatory response to plaque" }
  ],
  endo: [
    { factor: "Deep Restorations", description: "Proximity to pulp increases risk of pulpal inflammation" },
    { factor: "Recent Trauma", description: "Can cause pulpal inflammation or necrosis" },
    { factor: "Cracked Teeth", description: "Pathway for bacterial invasion of pulp" },
    { factor: "Large Decay", description: "Bacterial invasion approaching or entering pulp" }
  ],
  prostho: [
    { factor: "Bruxism", description: "Excessive wear, chipping, and fractures of teeth and restorations" },
    { factor: "Inadequate Posterior Support", description: "Leads to excessive forces on anterior teeth" },
    { factor: "Xerostomia", description: "Dry mouth increases risk of caries around restorations" },
    { factor: "Parafunctional Habits", description: "Nail biting, pen chewing can damage restorations" }
  ],
  surgery: [
    { factor: "Bleeding Disorders", description: "Increases risk of hemorrhage during and after surgery" },
    { factor: "Bisphosphonate Therapy", description: "Risk of medication-related osteonecrosis of the jaw" },
    { factor: "Immunocompromised State", description: "Increased risk of infection and impaired healing" },
    { factor: "Smoking", description: "Impairs healing and increases dry socket risk" }
  ],
  ortho: [
    { factor: "Poor Oral Hygiene", description: "Increases risk of decalcification and caries during treatment" },
    { factor: "Non-Compliance", description: "Inconsistent wear of removable appliances or elastics" },
    { factor: "Root Resorption History", description: "Increased risk of further resorption during treatment" },
    { factor: "TMJ Disorders", description: "May complicate treatment or worsen during orthodontics" }
  ],
  pediatric: [
    { factor: "Frequent Snacking", description: "Increases caries risk due to prolonged acid exposure" },
    { factor: "Bottled Water Use", description: "May lack fluoride for optimal protection" },
    { factor: "Prolonged Bottle/Sippy Cup Use", description: "Risk for early childhood caries" },
    { factor: "Special Healthcare Needs", description: "May complicate treatment delivery and home care" }
  ],
  insurance: [
    { factor: "High Deductible Plan", description: "May delay necessary treatment due to out-of-pocket costs" },
    { factor: "Annual Maximum Limits", description: "May require phasing treatment across benefit years" },
    { factor: "Missing Documentation", description: "Incomplete records may result in claim denials" },
    { factor: "Frequency Limitations", description: "Restrictions on how often certain procedures are covered" }
  ]
};

/**
 * Generate a multi-domain consensus analysis from symptoms and history
 */
export function generateMultiDomainConsensus(
  symptoms: string, 
  patientHistory?: PatientMedicalHistory
): MultiDomainConsensus {
  // In a real implementation, this would call a backend service with the AI models
  
  // Create example consensus result for demonstration
  const consensus: MultiDomainConsensus = {
    domains: {
      general: {
        active: true,
        findings: [{
          domain: 'general',
          confidence: 92,
          finding: "Moderate dental caries on tooth #30, occlusal surface",
          recommendations: [
            "Composite restoration (filling) recommended",
            "Consider fluoride treatment for prevention of future caries"
          ],
          evidencePoints: [
            "Patient reports sensitivity to cold and sweet foods",
            "Visual examination shows visible cavity",
            "Explorer detects softened enamel"
          ],
          suggestedProcedures: ["D2392 - Resin-based composite, two surfaces, posterior"],
          urgency: 'medium',
          additionalTests: ["Bite-wing radiograph to assess extent of decay"]
        }],
        confidence: 92,
        diagnosticSummary: "Patient presents with moderate decay on lower right molar requiring restoration"
      },
      perio: {
        active: true,
        findings: [{
          domain: 'perio',
          confidence: 85,
          finding: "Localized moderate periodontal disease in posterior regions",
          recommendations: [
            "Scaling and root planing for affected quadrants",
            "More frequent recall (3-month intervals)",
            "Improved interproximal cleaning technique"
          ],
          evidencePoints: [
            "4-5mm pocket depths in posterior regions",
            "Bleeding on probing in affected areas",
            "Moderate supragingival calculus",
            "Radiographic evidence of bone loss"
          ],
          suggestedProcedures: ["D4341 - Periodontal scaling and root planing, four or more teeth per quadrant"],
          urgency: 'medium',
          additionalTests: ["Full-mouth periodontal charting"]
        }],
        confidence: 85,
        diagnosticSummary: "Localized moderate periodontal disease requiring non-surgical therapy"
      },
      endo: {
        active: true,
        findings: [{
          domain: 'endo',
          confidence: 78,
          finding: "Possible pulpal involvement of tooth #19",
          recommendations: [
            "Pulp vitality testing",
            "Periapical radiograph",
            "Possible root canal therapy if pulp is non-vital"
          ],
          evidencePoints: [
            "Patient reports lingering pain to cold",
            "Pain on percussion",
            "History of deep restoration on tooth #19"
          ],
          suggestedProcedures: ["D0460 - Pulp vitality tests", "D3330 - Endodontic therapy, molar (if needed)"],
          urgency: 'medium',
          additionalTests: ["Electric pulp test", "Periapical radiograph"]
        }],
        confidence: 78,
        diagnosticSummary: "Suspected irreversible pulpitis of tooth #19 requiring further testing and possible root canal therapy"
      },
      prostho: {
        active: true,
        findings: [{
          domain: 'prostho',
          confidence: 88,
          finding: "Defective crown margin on tooth #30",
          recommendations: [
            "Crown replacement",
            "Evaluate need for build-up",
            "Temporary crown while permanent restoration is fabricated"
          ],
          evidencePoints: [
            "Visible gap at crown margin",
            "Recurrent decay detected at margin",
            "Radiograph confirms defective margin"
          ],
          suggestedProcedures: ["D2752 - Crown - porcelain fused to noble metal"],
          urgency: 'medium',
          additionalTests: []
        }],
        confidence: 88,
        diagnosticSummary: "Defective crown with recurrent decay requiring replacement"
      },
      surgery: {
        active: false,
        findings: [],
        confidence: 0,
        diagnosticSummary: "No surgical findings noted"
      },
      ortho: {
        active: false,
        findings: [],
        confidence: 0,
        diagnosticSummary: "No orthodontic findings noted"
      },
      pediatric: {
        active: false,
        findings: [],
        confidence: 0,
        diagnosticSummary: "Not applicable - adult patient"
      },
      insurance: {
        active: true,
        findings: [{
          domain: 'insurance',
          confidence: 90,
          finding: "Insurance coverage analysis for recommended procedures",
          recommendations: [
            "Submit pre-authorization for crown replacement",
            "Phase treatment across benefit years to maximize coverage",
            "Consider alternative restorative options if cost is a concern"
          ],
          evidencePoints: [
            "Patient has PPO dental insurance with 50% coverage for crowns",
            "Annual maximum of $1,500 with $800 remaining this year",
            "Waiting period satisfied for major restorative work"
          ],
          suggestedProcedures: [],
          urgency: 'low',
          additionalTests: []
        }],
        confidence: 90,
        diagnosticSummary: "Insurance benefits available but coordination needed to maximize coverage"
      }
    },
    overallDiagnosis: "Patient presents with multiple restorative and periodontal needs, including a defective crown with recurrent decay, moderate caries on tooth #30, localized moderate periodontal disease, and suspected irreversible pulpitis on tooth #19.",
    treatmentRecommendations: [
      "Priority 1: Address potential endodontic issue on tooth #19",
      "Priority 2: Replace defective crown on tooth #30",
      "Priority 3: Restore carious lesion on tooth #30",
      "Priority 4: Perform scaling and root planing for affected quadrants",
      "Priority 5: Establish 3-month periodontal maintenance schedule"
    ],
    conflictingOpinions: [
      {
        description: "Treatment sequence for tooth #30 (caries and crown)",
        domains: ['general', 'prostho'],
        resolution: "Prosthodontic recommendation takes precedence - crown replacement will address both the defective margin and the carious lesion"
      }
    ],
    consensusLevel: 'high'
  };
  
  return consensus;
}

/**
 * Generate domain-specific questions based on initial symptoms
 */
export function generateDomainQuestions(symptoms: string): Record<AIDomain, string[]> {
  // This function would typically analyze the symptoms and return
  // specific questions from each domain that would help with diagnosis
  
  // For now, we'll return a subset of the standard questions for each domain
  const result: Record<AIDomain, string[]> = {} as Record<AIDomain, string[]>;
  
  Object.keys(domainDiagnosticQuestions).forEach(domain => {
    const allQuestions = domainDiagnosticQuestions[domain as AIDomain];
    // Select 2-3 most relevant questions (would be AI-selected in a real implementation)
    result[domain as AIDomain] = allQuestions.slice(0, 3);
  });
  
  return result;
}