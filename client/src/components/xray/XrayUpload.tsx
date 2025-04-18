import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSWRConfig } from 'swr';
import { useAuth } from '../../hooks/use-auth';
import { AuditLogService } from '../../services/audit-log';
import { XrayType, XraySource } from '@shared/schema';

interface XrayUploadProps {
  patientId?: number;
  onUploadComplete?: (xrayId: number) => void;
}

export const XrayUpload: React.FC<XrayUploadProps> = ({ patientId, onUploadComplete }) => {
  const { user } = useAuth();
  const { mutate } = useSWRConfig();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [xrayType, setXrayType] = useState<XrayType>('bitewing');
  const [source, setSource] = useState<XraySource>('sensor');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', xrayType);
    formData.append('source', source);
    if (patientId) {
      formData.append('patientId', patientId.toString());
    }

    try {
      const response = await fetch('/api/xrays/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Log the upload
      await AuditLogService.logAction({
        userId: user?.id,
        action: 'xray_upload',
        entityType: 'xray',
        entityId: data.id,
        details: {
          type: xrayType,
          source: source,
          patientId: patientId
        }
      });

      // Invalidate X-ray list cache
      mutate('/api/xrays/patient/' + patientId);
      
      if (onUploadComplete) {
        onUploadComplete(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  }, [user, xrayType, source, patientId, mutate, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.tif'],
      'application/dicom': ['.dcm'],
      'application/pdf': ['.pdf']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the X-ray here...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600">Drag & drop an X-ray here, or click to select</p>
            <p className="text-sm text-gray-500">Supports: JPG, PNG, TIFF, DICOM, PDF (max 50MB)</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="mt-4">
          <img 
            src={preview} 
            alt="X-ray preview" 
            className="max-h-64 mx-auto rounded-lg shadow-md"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">X-ray Type</label>
          <select
            value={xrayType}
            onChange={(e) => setXrayType(e.target.value as XrayType)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="bitewing">Bitewing</option>
            <option value="periapical">Periapical</option>
            <option value="panoramic">Panoramic</option>
            <option value="cbct">CBCT</option>
            <option value="endodontic">Endodontic</option>
            <option value="fmx">Full Mouth Series</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as XraySource)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="sensor">Digital Sensor</option>
            <option value="pacs">PACS System</option>
            <option value="software">Dental Software</option>
            <option value="scanner">Scanner</option>
          </select>
        </div>
      </div>

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}; 