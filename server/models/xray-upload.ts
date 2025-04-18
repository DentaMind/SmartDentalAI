import mongoose, { Schema, Document } from 'mongoose';
import { AuditLogService } from '../services/audit-log';

export interface IXrayUpload extends Document {
  patientId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  thumbnailPath?: string;
  aiFlags?: {
    hasAnomalies: boolean;
    confidence: number;
    findings: string[];
  };
  metadata: {
    uploadDate: Date;
    uploadedBy: mongoose.Types.ObjectId;
    deviceInfo?: string;
    location?: string;
    notes?: string;
  };
  status: 'pending' | 'processed' | 'failed';
  error?: string;
}

const XrayUploadSchema: Schema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/png', 'image/dicom']
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  thumbnailPath: {
    type: String
  },
  aiFlags: {
    hasAnomalies: Boolean,
    confidence: Number,
    findings: [String]
  },
  metadata: {
    uploadDate: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deviceInfo: String,
    location: String,
    notes: String
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  error: String
}, {
  timestamps: true
});

// Add audit logging middleware
XrayUploadSchema.post('save', async function(doc) {
  await AuditLogService.logAction({
    userId: doc.metadata.uploadedBy,
    action: 'xray_upload',
    entityType: 'XrayUpload',
    entityId: doc._id,
    metadata: {
      patientId: doc.patientId,
      filename: doc.filename,
      status: doc.status
    }
  });
});

export const XrayUpload = mongoose.model<IXrayUpload>('XrayUpload', XrayUploadSchema); 