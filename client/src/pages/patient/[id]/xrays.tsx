import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/use-auth';
import { usePatient } from '../../../hooks/use-patient';
import { useXrays } from '../../../hooks/use-xrays';
import { FMXLayout } from '../../../components/xray/FMXLayout';
import { XrayViewer } from '../../../components/xray/XrayViewer';
import { Xray } from '@shared/schema';

export default function PatientXraysPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { patient, isLoading: isLoadingPatient } = usePatient(Number(id));
  const { xrays, isLoading: isLoadingXrays } = useXrays(Number(id));
  const [selectedXray, setSelectedXray] = useState<Xray | null>(null);
  const [showFMXLayout, setShowFMXLayout] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  if (isLoadingPatient || isLoadingXrays) {
    return <div>Loading...</div>;
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  const handleXrayUploaded = (position: string) => {
    // Refresh X-rays list
    router.reload();
  };

  const handleXrayClick = (xray: Xray) => {
    setSelectedXray(xray);
    setShowFMXLayout(false);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">X-ray History</h2>
        <div className="space-y-2">
          {xrays?.map((xray) => (
            <div
              key={xray.id}
              className={`p-2 rounded cursor-pointer ${
                selectedXray?.id === xray.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleXrayClick(xray)}
            >
              <div className="text-sm font-medium">{xray.type}</div>
              <div className="text-xs text-gray-500">
                {new Date(xray.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        <button
          className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          onClick={() => setShowFMXLayout(true)}
        >
          New FMX Series
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {showFMXLayout ? (
          <div>
            <h1 className="text-2xl font-bold mb-6">Full Mouth X-ray Series</h1>
            <FMXLayout
              patientId={patient.id}
              onXrayUploaded={handleXrayUploaded}
            />
          </div>
        ) : selectedXray ? (
          <div>
            <h1 className="text-2xl font-bold mb-6">
              {selectedXray.type} - {new Date(selectedXray.createdAt).toLocaleDateString()}
            </h1>
            <XrayViewer xray={selectedXray} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select an X-ray to view or start a new FMX series
          </div>
        )}
      </div>
    </div>
  );
} 