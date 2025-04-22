import React, { useState } from 'react';
import { runDiagnosticModule } from '@/utils/diagnosticFramework';
import DiagnosticCard from '@/components/DiagnosticCard';
import ImageUploader from '@/components/ImageUploader';

export default function DiagnosticInterface() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleRunDiagnostics = async (image: string) => {
    setLoading(true);
    try {
      const result = await runDiagnosticModule('caries', {
        image,
        metadata: { type: 'bitewing', patientId: 'test123' },
      });
      setFindings(result?.output || []);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFindings([]);
  };

  return (
    <div className="p-6 space-y-4">
      <ImageUploader onImageUpload={handleRunDiagnostics} />
      {loading && <div className="text-gray-500">Analyzing image, please wait...</div>}
      <DiagnosticCard findings={findings} />
      <button
        onClick={handleReset}
        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
      >
        Reset
      </button>
    </div>
  );
} 