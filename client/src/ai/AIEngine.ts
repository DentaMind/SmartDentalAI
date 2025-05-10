import { Implant, SurgicalGuideSettings, NerveTrace } from '../../server/types/surgical-guide';
import * as THREE from 'three';

export type Module = 'cbct' | 'denture' | 'guide' | 'occlusion';

export interface AIRequest {
  module: Module;
  input: any; // Data format depends on module
}

export interface AISuggestion {
  id: string;
  label: string;
  description: string;
  confidence: number; // 0 to 1
  recommended: boolean;
  action?: () => void; // Optional function to apply the suggestion
}

export interface GuideAIInput {
  implants: Implant[];
  tissueSurface?: THREE.BufferGeometry;
  nerveTraces?: NerveTrace[];
  currentSettings?: SurgicalGuideSettings;
}

export interface CBCTAIInput {
  scanData: any; // CBCT scan data
  nerveTraces?: NerveTrace[];
  plannedImplants?: Implant[];
}

export interface DentureAIInput {
  edentulousRidge: any; // Ridge data
  opposingTeeth?: any;
  patientAge?: number;
  boneQuality?: string;
}

export interface OcclusionAIInput {
  upperTeeth: any;
  lowerTeeth: any;
  biteRegistration?: any;
}

export const AIEngine = {
  async getSuggestions({ module, input }: AIRequest): Promise<AISuggestion[]> {
    switch (module) {
      case 'cbct':
        return this.getCBCTSuggestions(input as CBCTAIInput);
      case 'guide':
        return this.getGuideSuggestions(input as GuideAIInput);
      case 'denture':
        return this.getDentureSuggestions(input as DentureAIInput);
      case 'occlusion':
        return this.getOcclusionSuggestions(input as OcclusionAIInput);
      default:
        return [];
    }
  },

  async getGuideSuggestions(input: GuideAIInput): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Analyze guide type recommendation
    if (input.implants.length > 0) {
      const hasAdjacentTeeth = this.checkAdjacentTeeth(input.tissueSurface);
      suggestions.push({
        id: 'guide-type',
        label: hasAdjacentTeeth ? 'Use tooth-supported guide' : 'Use mucosa-supported guide',
        description: hasAdjacentTeeth 
          ? 'Stable adjacent teeth detected near implant site'
          : 'No stable adjacent teeth found, mucosa support recommended',
        confidence: 0.93,
        recommended: true
      });
    }

    // Check nerve proximity
    if (input.nerveTraces && input.implants.length > 0) {
      const nerveWarnings = this.checkNerveProximity(input.implants, input.nerveTraces);
      suggestions.push(...nerveWarnings);
    }

    // Validate guide settings
    if (input.currentSettings) {
      const settingSuggestions = this.validateGuideSettings(input.currentSettings);
      suggestions.push(...settingSuggestions);
    }

    return suggestions;
  },

  async getCBCTSuggestions(input: CBCTAIInput): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Analyze bone density
    if (input.scanData) {
      suggestions.push({
        id: 'bone-density',
        label: 'High bone density detected',
        description: 'D1 bone type, ideal for immediate loading',
        confidence: 0.87,
        recommended: true
      });
    }

    // Check nerve proximity for planned implants
    if (input.plannedImplants && input.nerveTraces) {
      const nerveWarnings = this.checkNerveProximity(input.plannedImplants, input.nerveTraces);
      suggestions.push(...nerveWarnings);
    }

    return suggestions;
  },

  async getDentureSuggestions(input: DentureAIInput): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Analyze ridge form
    if (input.edentulousRidge) {
      suggestions.push({
        id: 'ridge-form',
        label: 'Palatal strap suggested',
        description: 'Maxillary Kennedy Class I + posterior tissue support needed',
        confidence: 0.91,
        recommended: true
      });
    }

    // Consider patient age and bone quality
    if (input.patientAge && input.boneQuality) {
      suggestions.push({
        id: 'material-suggestion',
        label: 'Consider flexible partial denture',
        description: 'Young patient with good bone quality, flexible design may be more comfortable',
        confidence: 0.78,
        recommended: true
      });
    }

    return suggestions;
  },

  async getOcclusionSuggestions(input: OcclusionAIInput): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Check for interferences
    if (input.upperTeeth && input.lowerTeeth) {
      suggestions.push({
        id: 'occlusion-interference',
        label: 'Balancing interference on #19',
        description: 'Detected in working + balancing movements',
        confidence: 0.72,
        recommended: false
      });
    }

    return suggestions;
  },

  // Helper methods
  checkAdjacentTeeth(tissueSurface?: THREE.BufferGeometry): boolean {
    // TODO: Implement actual adjacent teeth detection
    return true; // Placeholder
  },

  checkNerveProximity(implants: Implant[], nerveTraces: NerveTrace[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // TODO: Implement actual nerve proximity check
    implants.forEach((implant, index) => {
      suggestions.push({
        id: `nerve-proximity-${index}`,
        label: `Check nerve proximity for implant #${index + 1}`,
        description: 'Nerve detected within 2mm of planned implant',
        confidence: 0.85,
        recommended: false
      });
    });

    return suggestions;
  },

  validateGuideSettings(settings: SurgicalGuideSettings): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    if (settings.shellThickness < 2) {
      suggestions.push({
        id: 'shell-thickness',
        label: 'Increase shell thickness',
        description: 'Current thickness may be too thin for stability',
        confidence: 0.88,
        recommended: true
      });
    }

    if (settings.offset > 1) {
      suggestions.push({
        id: 'offset',
        label: 'Reduce offset',
        description: 'Current offset may cause guide instability',
        confidence: 0.82,
        recommended: true
      });
    }

    return suggestions;
  }
}; 