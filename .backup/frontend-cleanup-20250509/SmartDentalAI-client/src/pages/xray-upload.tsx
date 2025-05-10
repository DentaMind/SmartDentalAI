import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { XrayUpload } from '../components/xray/XrayUpload';
import { useAuth } from '../hooks/use-auth';
import { usePatients } from '../hooks/use-patients';

export default function XrayUploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { patients, isLoading: isLoadingPatients } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>();

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleUploadComplete = (xrayId: number) => {
    router.push(`/xrays/${xrayId}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload X-ray</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Patient
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a patient...</option>
            {patients?.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName} ({patient.dateOfBirth})
              </option>
            ))}
          </select>
        </div>

        {selectedPatientId ? (
          <XrayUpload
            patientId={selectedPatientId}
            onUploadComplete={handleUploadComplete}
          />
        ) : (
          <div className="text-center text-gray-500 py-8">
            Please select a patient to upload X-rays
          </div>
        )}
      </div>
    </div>
  );
} 