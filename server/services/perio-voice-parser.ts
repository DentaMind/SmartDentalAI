import { PerioVoiceCommand } from '@shared/schema';
import { toothNumberSchema } from '@shared/tooth-mapping';

export class PerioVoiceParser {
  private static readonly MEASUREMENT_PATTERN = /tooth\s+(\d+)\s+(?:(\w+)\s+)?(\d+)(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(bleeding|suppuration))?/i;
  private static readonly NAVIGATION_PATTERN = /(next|back|clear|repeat)\s+(?:tooth|last)?/i;
  private static readonly RECESSION_PATTERN = /tooth\s+(\d+)\s+recession\s+(\d+)(?:\s+(\d+))?(?:\s+(\d+))?/i;
  private static readonly MOBILITY_PATTERN = /tooth\s+(\d+)\s+mobility\s+(\d+)/i;
  private static readonly FURCATION_PATTERN = /tooth\s+(\d+)\s+furcation\s+(buccal|lingual|mesial|distal)\s+(\d+)/i;

  static parseCommand(text: string): PerioVoiceCommand | null {
    // Try to match measurement pattern first
    const measurementMatch = text.match(this.MEASUREMENT_PATTERN);
    if (measurementMatch) {
      const [, toothNumber, surface, pd1, pd2, pd3, flags] = measurementMatch;
      
      // Validate tooth number
      const toothNum = parseInt(toothNumber);
      if (!this.isValidToothNumber(toothNum)) {
        return null;
      }

      // Determine surface
      const surfaceType = surface ? this.parseSurface(surface) : 'buccal';
      
      // Parse measurements
      const measurements = [pd1, pd2, pd3]
        .filter(Boolean)
        .map(pd => parseInt(pd))
        .filter(pd => this.isValidProbingDepth(pd));

      // Create command
      return {
        type: 'measurement',
        toothNumber: toothNum,
        surface: surfaceType,
        measurements,
        flags: flags ? [flags.toLowerCase()] : []
      };
    }

    // Try to match recession pattern
    const recessionMatch = text.match(this.RECESSION_PATTERN);
    if (recessionMatch) {
      const [, toothNumber, , rec1, rec2, rec3] = recessionMatch;
      const toothNum = parseInt(toothNumber);
      if (!this.isValidToothNumber(toothNum)) return null;

      const values = [rec1, rec2, rec3]
        .filter(Boolean)
        .map(rec => parseInt(rec))
        .filter(rec => this.isValidRecession(rec));

      return {
        type: 'recession',
        toothNumber: toothNum,
        values
      };
    }

    // Try to match mobility pattern
    const mobilityMatch = text.match(this.MOBILITY_PATTERN);
    if (mobilityMatch) {
      const [, toothNumber, , grade] = mobilityMatch;
      const toothNum = parseInt(toothNumber);
      const mobilityGrade = parseInt(grade);
      
      if (!this.isValidToothNumber(toothNum) || !this.isValidMobilityGrade(mobilityGrade)) {
        return null;
      }

      return {
        type: 'mobility',
        toothNumber: toothNum,
        grade: mobilityGrade as 0 | 1 | 2 | 3
      };
    }

    // Try to match furcation pattern
    const furcationMatch = text.match(this.FURCATION_PATTERN);
    if (furcationMatch) {
      const [, toothNumber, location, grade] = furcationMatch;
      const toothNum = parseInt(toothNumber);
      const furcationGrade = parseInt(grade);
      
      if (!this.isValidToothNumber(toothNum) || !this.isValidFurcationGrade(furcationGrade)) {
        return null;
      }

      return {
        type: 'furcation',
        toothNumber: toothNum,
        location: location.toLowerCase() as 'buccal' | 'lingual' | 'mesial' | 'distal',
        grade: furcationGrade as 0 | 1 | 2 | 3
      };
    }

    // Try to match navigation pattern
    const navigationMatch = text.match(this.NAVIGATION_PATTERN);
    if (navigationMatch) {
      const [, action] = navigationMatch;
      return {
        type: 'navigation',
        action: action.toLowerCase() as 'next' | 'back' | 'clear' | 'repeat'
      };
    }

    return null;
  }

  private static isValidToothNumber(toothNumber: number): boolean {
    return toothNumber >= 1 && toothNumber <= 32;
  }

  private static isValidProbingDepth(depth: number): boolean {
    return depth >= 0 && depth <= 10;
  }

  private static isValidRecession(rec: number): boolean {
    return rec >= 0 && rec <= 10;
  }

  private static isValidMobilityGrade(grade: number): boolean {
    return grade >= 0 && grade <= 3;
  }

  private static isValidFurcationGrade(grade: number): boolean {
    return grade >= 0 && grade <= 3;
  }

  private static parseSurface(surface: string): 'buccal' | 'lingual' {
    const normalized = surface.toLowerCase();
    if (normalized.includes('ling')) return 'lingual';
    return 'buccal';
  }

  static generateExampleCommands(): string[] {
    return [
      "Tooth 14 MB 3",
      "Tooth 30 lingual 4 4 5",
      "Tooth 3 buccal 2 3 2 bleeding",
      "Tooth 14 recession 1 2 1",
      "Tooth 18 mobility 2",
      "Tooth 2 furcation buccal 2",
      "Next tooth",
      "Back",
      "Clear last",
      "Repeat"
    ];
  }
} 