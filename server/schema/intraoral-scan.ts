import { z } from 'zod';

export const IntraoralScanFormat = z.enum(['STL', 'PLY', 'OBJ', 'DCM']);
export type IntraoralScanFormat = z.infer<typeof IntraoralScanFormat>;

export const TransformMatrix = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }),
  rotation: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }),
  scale: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  })
});

export const IntraoralScan = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  xrayId: z.string().optional(), // Optional link to specific X-ray
  fileUrl: z.string(),
  format: IntraoralScanFormat,
  transform: TransformMatrix.optional(), // Store user's alignment settings
  opacity: z.number().min(0).max(1).default(0.6),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.object({
    originalFileName: z.string(),
    fileSize: z.number(),
    scanDate: z.date().optional(),
    scannerType: z.string().optional(),
    notes: z.string().optional()
  }).optional()
});

export type IntraoralScan = z.infer<typeof IntraoralScan>;

// For creating a new scan
export const CreateIntraoralScan = IntraoralScan.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// For updating an existing scan
export const UpdateIntraoralScan = CreateIntraoralScan.partial(); 