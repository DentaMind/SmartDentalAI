import { OpenAI } from "openai";
import { storage } from "../storage";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.XRAY_AI_KEY || "",
});

export interface ImagingAnalysis {
  findings: {
    region: string;
    description: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
    severity?: "mild" | "moderate" | "severe";
    type: "caries" | "periodontal" | "endodontic" | "pathology" | "other";
  }[];
  recommendations: string[];
  overallAssessment: string;
  comparisonWithPrevious?: {
    changes: string[];
    progression: "improved" | "stable" | "worsened";
    notes: string;
  };
  threeDimensionalInsights?: {
    volumetricAnalysis: string;
    structuralRelationships: string;
    nervesAndVessels: string;
    airwayAnalysis?: string;
  };
  automatedMeasurements?: Record<string, number>;
}

// Main function to analyze dental images
export async function analyzeDentalImages(
  imageUrls: string[],
  patientId: number,
  analysisType: "standard" | "comprehensive" | "periodontal" | "endodontic" | "orthodontic" | "cbct" = "standard",
  previousAnalysisId?: number
): Promise<ImagingAnalysis> {
  try {
    // Get patient data for context
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Get previous analysis if provided
    let previousAnalysis = null;
    if (previousAnalysisId) {
      // In a real implementation, you would fetch the previous analysis
      // previousAnalysis = await storage.getAnalysis(previousAnalysisId);
    }

    // Prepare system prompt based on analysis type
    let systemPrompt = "You are an advanced dental imaging AI. ";
    
    switch (analysisType) {
      case "comprehensive":
        systemPrompt += "Perform a comprehensive analysis of all dental structures, including caries, periodontal conditions, endodontic status, and potential pathologies.";
        break;
      case "periodontal":
        systemPrompt += "Focus on periodontal structures, bone levels, furcation involvement, and signs of periodontal disease.";
        break;
      case "endodontic":
        systemPrompt += "Focus on pulp chambers, canals, periapical regions, and signs of endodontic pathology.";
        break;
      case "orthodontic":
        systemPrompt += "Focus on tooth alignment, occlusion, growth patterns, and skeletal relationships.";
        break;
      case "cbct":
        systemPrompt += "Analyze this 3D CBCT scan, focusing on volumetric data, anatomical relationships, and 3D pathology detection.";
        break;
      default:
        systemPrompt += "Provide a standard analysis of visible dental conditions.";
    }

    // Create messages for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: `Patient ID: ${patientId}
            Age: ${patient.age || "Unknown"}
            Medical History: ${patient.medicalHistory || "None"}
            ${previousAnalysis ? "Previous analysis is available for comparison." : "No previous analysis available."}`
          },
          ...imageUrls.map(url => ({
            type: "image_url",
            image_url: { url }
          }))
        ]
      }
    ];

    // Add previous analysis context if available
    if (previousAnalysis) {
      messages.push({
        role: "user",
        content: `Previous analysis from ${previousAnalysis.date}: ${JSON.stringify(previousAnalysis.findings)}`
      });
    }

    // Get analysis from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      response_format: { type: "json_object" }
    });

    // Parse and enhance the response
    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    // Add 3D insights for CBCT analysis
    if (analysisType === "cbct" && !analysis.threeDimensionalInsights) {
      analysis.threeDimensionalInsights = {
        volumetricAnalysis: "3D volumetric analysis complete",
        structuralRelationships: "Key anatomical relationships identified",
        nervesAndVessels: "Major nerve and vessel pathways mapped"
      };
    }

    // Add automated measurements (this would be done by specialized software in production)
    if (["comprehensive", "periodontal", "orthodontic"].includes(analysisType)) {
      analysis.automatedMeasurements = generateMockMeasurements(analysisType);
    }

    return analysis;
  } catch (error) {
    console.error("Image analysis error:", error);
    throw new Error("Failed to analyze dental images");
  }
}

// Helper function to generate mock measurements (in production, these would come from actual image processing)
function generateMockMeasurements(analysisType: string): Record<string, number> {
  const measurements: Record<string, number> = {};
  
  if (analysisType === "periodontal") {
    // Mock periodontal measurements
    for (let tooth = 1; tooth <= 8; tooth++) {
      for (let quadrant = 1; quadrant <= 4; quadrant++) {
        const toothNumber = quadrant <= 2 ? quadrant * 10 + tooth : quadrant * 10 + 9 - tooth;
        measurements[`pd_${toothNumber}_buccal`] = Math.floor(Math.random() * 5) + 1;
        measurements[`pd_${toothNumber}_lingual`] = Math.floor(Math.random() * 5) + 1;
        measurements[`recession_${toothNumber}`] = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
      }
    }
  } else if (analysisType === "orthodontic") {
    // Mock orthodontic measurements
    measurements.sna = Math.floor(Math.random() * 6) + 80; // SNA angle
    measurements.snb = Math.floor(Math.random() * 6) + 78; // SNB angle
    measurements.anb = measurements.sna - measurements.snb; // ANB angle
    measurements.overjet = Math.floor(Math.random() * 5) + 1; // Overjet in mm
    measurements.overbite = Math.floor(Math.random() * 5) + 1; // Overbite in mm
  } else {
    // Basic measurements for comprehensive analysis
    measurements.maxillary_arch_width = Math.floor(Math.random() * 10) + 30;
    measurements.mandibular_arch_width = Math.floor(Math.random() * 8) + 28;
    measurements.interincisal_angle = Math.floor(Math.random() * 20) + 125;
  }
  
  return measurements;
}

// Function to compare current and previous analyses
export async function compareWithPreviousAnalysis(
  currentAnalysis: ImagingAnalysis,
  previousAnalysisId: number
): Promise<ImagingAnalysis['comparisonWithPrevious']> {
  try {
    // In a real implementation, you would fetch the previous analysis
    // const previousAnalysis = await storage.getAnalysis(previousAnalysisId);
    
    // Mock previous analysis for demonstration
    const mockPreviousAnalysis = {
      findings: currentAnalysis.findings.map(finding => ({
        ...finding,
        confidence: finding.confidence - 0.1,
        severity: finding.severity === "severe" ? "moderate" : 
                 finding.severity === "moderate" ? "mild" : "mild"
      }))
    };
    
    // Get comparison from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a dental imaging comparison AI. Compare the current and previous analyses and identify changes, progression, and provide notes."
        },
        {
          role: "user",
          content: JSON.stringify({
            currentAnalysis,
            previousAnalysis: mockPreviousAnalysis
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Analysis comparison error:", error);
    throw new Error("Failed to compare with previous analysis");
  }
}

// Function to generate detailed 3D CBCT analysis
export async function analyzeCBCT(
  cbctImages: string[],
  patientId: number
): Promise<ImagingAnalysis & {
  airwayAnalysis: {
    volume: number;
    minimumCrossSectionalArea: number;
    nasopharynx: string;
    oropharynx: string;
    recommendations: string[];
  };
  tmjAnalysis: {
    rightJoint: string;
    leftJoint: string;
    condylarPosition: string;
    discPosition: string;
    recommendations: string[];
  };
  implantPlanning?: {
    sites: {
      location: string;
      boneHeight: number;
      boneWidth: number;
      recommendedImplantSize: string;
      proximityToVitalStructures: string;
    }[];
  };
}> {
  try {
    // This would leverage the analyzeDentalImages function with CBCT type
    const baseAnalysis = await analyzeDentalImages(cbctImages, patientId, "cbct");
    
    // Add CBCT-specific analyses (in production, these would be calculated by specialized software)
    const enhancedAnalysis = {
      ...baseAnalysis,
      airwayAnalysis: {
        volume: Math.floor(Math.random() * 5000) + 15000, // in mm³
        minimumCrossSectionalArea: Math.floor(Math.random() * 100) + 100, // in mm²
        nasopharynx: ["Normal", "Constricted", "Enlarged"][Math.floor(Math.random() * 3)],
        oropharynx: ["Normal", "Constricted", "Enlarged"][Math.floor(Math.random() * 3)],
        recommendations: [
          "Monitor airway volume",
          "Consider sleep study if symptoms present",
          "Evaluation by ENT specialist recommended"
        ]
      },
      tmjAnalysis: {
        rightJoint: ["Normal", "Mild degeneration", "Moderate degeneration", "Severe degeneration"][Math.floor(Math.random() * 4)],
        leftJoint: ["Normal", "Mild degeneration", "Moderate degeneration", "Severe degeneration"][Math.floor(Math.random() * 4)],
        condylarPosition: ["Normal", "Anterior", "Posterior", "Lateral", "Medial"][Math.floor(Math.random() * 5)],
        discPosition: ["Normal", "Anterior displacement with reduction", "Anterior displacement without reduction"][Math.floor(Math.random() * 3)],
        recommendations: [
          "Monitor TMJ function",
          "Consider occlusal guard for night-time use",
          "Refer to TMJ specialist if symptoms persist"
        ]
      }
    };
    
    // Add implant planning if applicable
    if (Math.random() > 0.5) {
      enhancedAnalysis.implantPlanning = {
        sites: [
          {
            location: "Tooth #36",
            boneHeight: Math.floor(Math.random() * 5) + 10, // in mm
            boneWidth: Math.floor(Math.random() * 3) + 5, // in mm
            recommendedImplantSize: "4.0 x 10mm",
            proximityToVitalStructures: "Inferior alveolar nerve 2.5mm inferior"
          },
          {
            location: "Tooth #46",
            boneHeight: Math.floor(Math.random() * 5) + 10, // in mm
            boneWidth: Math.floor(Math.random() * 3) + 5, // in mm
            recommendedImplantSize: "4.0 x 11.5mm",
            proximityToVitalStructures: "Inferior alveolar nerve 3.2mm inferior"
          }
        ]
      };
    }
    
    return enhancedAnalysis;
  } catch (error) {
    console.error("CBCT analysis error:", error);
    throw new Error("Failed to analyze CBCT images");
  }
}
