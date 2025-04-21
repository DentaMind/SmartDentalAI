import { z } from 'zod';

// Universal tooth numbering system (1-32)
export const UNIVERSAL_TOOTH_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31, 32
] as const;

// Primary tooth numbering system (A-T)
export const PRIMARY_TOOTH_NUMBERS = [
  'A', 'B', 'C', 'D', 'E',
  'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T'
] as const;

// Tooth surfaces
export const TOOTH_SURFACES = [
  'mesial',
  'distal',
  'buccal',
  'lingual',
  'occlusal',
  'incisal'
] as const;

// Perio measurement sites
export const PERIO_MEASUREMENT_SITES = [
  'mesiobuccal',
  'midbuccal',
  'distobuccal',
  'mesiolingual',
  'midlingual',
  'distolingual'
] as const;

// Tooth types
export const TOOTH_TYPES = [
  'incisor',
  'canine',
  'premolar',
  'molar'
] as const;

// Tooth arches
export const TOOTH_ARCHES = [
  'maxillary',
  'mandibular'
] as const;

// Zod schemas for validation
export const toothNumberSchema = z.union([
  z.number().min(1).max(32),
  z.enum(PRIMARY_TOOTH_NUMBERS)
]);

export const toothSurfaceSchema = z.enum(TOOTH_SURFACES);
export const perioMeasurementSiteSchema = z.enum(PERIO_MEASUREMENT_SITES);
export const toothTypeSchema = z.enum(TOOTH_TYPES);
export const toothArchSchema = z.enum(TOOTH_ARCHES);

// Type definitions
export type UniversalToothNumber = typeof UNIVERSAL_TOOTH_NUMBERS[number];
export type PrimaryToothNumber = typeof PRIMARY_TOOTH_NUMBERS[number];
export type ToothNumber = UniversalToothNumber | PrimaryToothNumber;
export type ToothSurface = typeof TOOTH_SURFACES[number];
export type PerioMeasurementSite = typeof PERIO_MEASUREMENT_SITES[number];
export type ToothType = typeof TOOTH_TYPES[number];
export type ToothArch = typeof TOOTH_ARCHES[number];

// Helper functions
export function isUniversalToothNumber(num: number): num is UniversalToothNumber {
  return UNIVERSAL_TOOTH_NUMBERS.includes(num as UniversalToothNumber);
}

export function isPrimaryToothNumber(num: string): num is PrimaryToothNumber {
  return PRIMARY_TOOTH_NUMBERS.includes(num as PrimaryToothNumber);
}

export function getToothType(toothNumber: ToothNumber): ToothType {
  if (typeof toothNumber === 'number') {
    if (toothNumber >= 1 && toothNumber <= 8) return 'incisor';
    if (toothNumber === 9 || toothNumber === 24) return 'canine';
    if (toothNumber >= 10 && toothNumber <= 13) return 'premolar';
    return 'molar';
  } else {
    if (['A', 'B', 'I', 'J'].includes(toothNumber)) return 'incisor';
    if (['C', 'H'].includes(toothNumber)) return 'canine';
    if (['D', 'E', 'F', 'G'].includes(toothNumber)) return 'molar';
    throw new Error(`Invalid primary tooth number: ${toothNumber}`);
  }
}

export function getToothArch(toothNumber: ToothNumber): ToothArch {
  if (typeof toothNumber === 'number') {
    return toothNumber <= 16 ? 'maxillary' : 'mandibular';
  } else {
    return toothNumber <= 'J' ? 'maxillary' : 'mandibular';
  }
}

// Mapping between universal and primary tooth numbers
export const UNIVERSAL_TO_PRIMARY_MAP: Record<UniversalToothNumber, PrimaryToothNumber[]> = {
  1: ['A', 'B'],
  2: ['C'],
  3: ['D', 'E'],
  4: ['F', 'G'],
  5: ['H'],
  6: ['I', 'J'],
  7: ['K', 'L'],
  8: ['M', 'N'],
  9: ['O'],
  10: ['P', 'Q'],
  11: ['R', 'S'],
  12: ['T']
} as const;

export const PRIMARY_TO_UNIVERSAL_MAP: Record<PrimaryToothNumber, UniversalToothNumber> = {
  'A': 1, 'B': 1,
  'C': 2,
  'D': 3, 'E': 3,
  'F': 4, 'G': 4,
  'H': 5,
  'I': 6, 'J': 6,
  'K': 7, 'L': 7,
  'M': 8, 'N': 8,
  'O': 9,
  'P': 10, 'Q': 10,
  'R': 11, 'S': 11,
  'T': 12
} as const; 