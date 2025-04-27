import { useEventCollector } from './useEventCollector';

interface ExportEventMetadata {
  patientId?: number;
  userId?: number;
  originalValue?: any;
  newValue?: any;
  reason?: string;
  source?: 'user' | 'system' | 'ai';
  exportId?: number;
  exportType?: string;
  fileFormat?: string;
  fileSize?: number;
  recordTypes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  recipientInfo?: {
    name: string;
    organization?: string;
    email?: string;
  };
}

export function useExportEvents() {
  const { collectEvent } = useEventCollector();

  const collectDataExport = (
    userId: number,
    patientId: number,
    exportType: string,
    metadata: ExportEventMetadata = {}
  ) => {
    return collectEvent('data_export', {
      user_id: userId,
      patient_id: patientId,
      export_type: exportType,
      ...metadata
    });
  };

  const collectDataExportRequested = (
    userId: number,
    patientId: number,
    exportType: string,
    reason: string,
    metadata: ExportEventMetadata = {}
  ) => {
    return collectEvent('data_export_requested', {
      user_id: userId,
      patient_id: patientId,
      export_type: exportType,
      request_reason: reason,
      ...metadata
    });
  };

  const collectDataExportCompleted = (
    userId: number,
    patientId: number,
    exportId: number,
    metadata: ExportEventMetadata = {}
  ) => {
    return collectEvent('data_export_completed', {
      user_id: userId,
      patient_id: patientId,
      export_id: exportId,
      ...metadata
    });
  };

  const collectDataExportFailed = (
    userId: number,
    patientId: number,
    exportId: number,
    reason: string,
    metadata: ExportEventMetadata = {}
  ) => {
    return collectEvent('data_export_failed', {
      user_id: userId,
      patient_id: patientId,
      export_id: exportId,
      failure_reason: reason,
      ...metadata
    });
  };

  const collectDataExportDownloaded = (
    userId: number,
    patientId: number,
    exportId: number,
    metadata: ExportEventMetadata = {}
  ) => {
    return collectEvent('data_export_downloaded', {
      user_id: userId,
      patient_id: patientId,
      export_id: exportId,
      ...metadata
    });
  };

  const collectDataExportShared = (
    userId: number,
    patientId: number,
    exportId: number,
    recipientInfo: ExportEventMetadata['recipientInfo'],
    metadata: ExportEventMetadata = {}
  ) => {
    return collectEvent('data_export_shared', {
      user_id: userId,
      patient_id: patientId,
      export_id: exportId,
      recipient_info: recipientInfo,
      ...metadata
    });
  };

  return {
    collectDataExport,
    collectDataExportRequested,
    collectDataExportCompleted,
    collectDataExportFailed,
    collectDataExportDownloaded,
    collectDataExportShared
  };
} 