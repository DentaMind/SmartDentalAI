import React, { useState, useEffect } from 'react';
import { PatientAPI } from '../../lib/api';
import { useParams } from 'react-router-dom';
import { ToothDiagram } from './tooth-illustrations';

// Define types for our API data
interface Restoration {
  id: string;
  tooth_number: string;
  restoration_type: string;
  surfaces: string[];
  procedure_date: string;
  provider_id?: string;
  condition: string;
  notes?: string;
  is_current: boolean;
}

interface ToothData {
  id: string;
  patient_id: string;
  tooth_number: string;
  status: string;
  notes?: string;
  current_restoration_id?: string;
  current_restoration?: Restoration;
  last_updated: string;
}

interface DentalChartData {
  patient_id: string;
  teeth: Record<string, ToothData>;
}

// Mapping of tooth status to colors
const statusColors = {
  present: '#FFFFFF',
  missing: '#EEEEEE',
  extracted: '#DDDDDD',
  impacted: '#FFD700',
  planned_extraction: '#FFA07A',
  planned_implant: '#ADD8E6',
};

// Mapping of restoration types to colors
const restorationColors = {
  composite: '#A9DFBF',
  amalgam: '#808B96',
  crown_pfm: '#F1C40F',
  crown_zirconia: '#F4F6F7',
  crown_emax: '#FAD7A0',
  veneer: '#E8DAEF',
  inlay: '#A9CCE3',
  onlay: '#A9CCE3',
  bridge_pontic: '#85C1E9',
  bridge_retainer: '#85C1E9',
  post_core: '#D2B4DE',
  implant: '#D2B4DE',
  implant_crown: '#F1C40F',
  denture: '#F5CBA7',
  root_canal: '#EC7063',
  sealant: '#AED6F1',
};

// Surface mapping for various visualization modes
const surfaceMapping = {
  M: 'Mesial',
  O: 'Occlusal',
  D: 'Distal',
  B: 'Buccal',
  L: 'Lingual',
  F: 'Facial',
  I: 'Incisal',
};

// Component for displaying tooth legend
const ToothLegend: React.FC = () => (
  <div className="bg-white p-4 rounded shadow-md">
    <h3 className="text-lg font-semibold mb-2">Status Legend</h3>
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(statusColors).map(([status, color]) => (
        <div key={status} className="flex items-center">
          <div 
            className="w-4 h-4 mr-2 rounded" 
            style={{ backgroundColor: color, border: '1px solid #ccc' }}
          />
          <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
        </div>
      ))}
    </div>
    
    <h3 className="text-lg font-semibold mt-4 mb-2">Restoration Legend</h3>
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(restorationColors).map(([type, color]) => (
        <div key={type} className="flex items-center">
          <div 
            className="w-4 h-4 mr-2 rounded" 
            style={{ backgroundColor: color, border: '1px solid #ccc' }}
          />
          <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
        </div>
      ))}
    </div>
  </div>
);

// Component for a single tooth in the restorative chart
const ToothComponent: React.FC<{
  toothNumber: string;
  toothData: ToothData;
  onToothClick: (toothNumber: string) => void;
}> = ({ toothNumber, toothData, onToothClick }) => {
  const statusColor = statusColors[toothData.status] || statusColors.present;
  const restorationColor = toothData.current_restoration 
    ? restorationColors[toothData.current_restoration.restoration_type] 
    : null;
  
  // Determine which surfaces to highlight based on restoration data
  const getSurfaceHighlights = () => {
    if (!toothData.current_restoration || !toothData.current_restoration.surfaces) return {};
    
    return toothData.current_restoration.surfaces.reduce((acc, surface) => {
      acc[surface] = restorationColor;
      return acc;
    }, {});
  };
  
  return (
    <div 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => onToothClick(toothNumber)}
    >
      <div className="text-center font-semibold text-sm mb-1">{toothNumber}</div>
      <ToothDiagram 
        toothNumber={parseInt(toothNumber)} 
        backgroundColor={statusColor}
        surfaceHighlights={getSurfaceHighlights()}
        width={60} 
        height={80} 
      />
    </div>
  );
};

// Main Restorative Chart Component
const RestorativeChartEnhanced: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [chartData, setChartData] = useState<DentalChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  
  // Fetch patient chart data
  useEffect(() => {
    if (!patientId) return;
    
    const fetchChartData = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call to the restorative chart endpoint
        // For now, mocking data based on the models we created
        const response = await PatientAPI.getPatient(patientId);
        
        // Mock dental chart data for demonstration
        const mockTeeth = {};
        for (let i = 1; i <= 32; i++) {
          const toothNumber = i.toString();
          mockTeeth[toothNumber] = {
            id: `tooth-${i}`,
            patient_id: patientId,
            tooth_number: toothNumber,
            status: i % 10 === 0 ? 'missing' : 'present',
            last_updated: new Date().toISOString(),
            current_restoration: i % 7 === 0 ? {
              id: `rest-${i}`,
              tooth_number: toothNumber,
              restoration_type: i % 4 === 0 ? 'composite' : 'amalgam',
              surfaces: ['O', 'M'],
              procedure_date: '2023-01-15T00:00:00Z',
              condition: 'good',
              is_current: true
            } : undefined
          };
        }
        
        setChartData({
          patient_id: patientId,
          teeth: mockTeeth
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dental chart:', err);
        setError('Failed to load dental chart data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, [patientId]);

  // Handle tooth click
  const handleToothClick = (toothNumber: string) => {
    setSelectedTooth(toothNumber);
    
    // In a real app, this would open a modal or panel with tooth details
    console.log('Tooth selected:', toothNumber);
  };

  // Show loading state
  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  // Show error state  
  if (error) {
    return <div className="text-red-500 p-4 bg-red-50 rounded">
      <p>{error}</p>
      <button 
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>;
  }

  // Show dental chart
  if (!chartData) {
    return <div>No chart data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Dental Chart</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left panel - Tooth Legend */}
        <div className="lg:col-span-1">
          <ToothLegend />
          
          {/* Selected tooth details */}
          {selectedTooth && chartData.teeth[selectedTooth] && (
            <div className="mt-6 bg-blue-50 p-4 rounded shadow-md">
              <h3 className="text-xl font-semibold mb-3">Tooth #{selectedTooth}</h3>
              <p><strong>Status:</strong> {chartData.teeth[selectedTooth].status}</p>
              {chartData.teeth[selectedTooth].current_restoration && (
                <>
                  <p className="mt-2"><strong>Current Restoration:</strong></p>
                  <p>Type: {chartData.teeth[selectedTooth].current_restoration.restoration_type}</p>
                  <p>Surfaces: {chartData.teeth[selectedTooth].current_restoration.surfaces?.join(', ')}</p>
                  <p>Date: {new Date(chartData.teeth[selectedTooth].current_restoration.procedure_date).toLocaleDateString()}</p>
                  <p>Condition: {chartData.teeth[selectedTooth].current_restoration.condition}</p>
                </>
              )}
              {chartData.teeth[selectedTooth].notes && (
                <p className="mt-2"><strong>Notes:</strong> {chartData.teeth[selectedTooth].notes}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Right panel - Dental Chart */}
        <div className="lg:col-span-2">
          {/* Upper teeth (1-16) */}
          <div className="mb-8">
            <div className="text-center font-semibold mb-2">Upper Teeth</div>
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 16 }, (_, i) => (i + 1).toString()).map(toothNumber => (
                <ToothComponent 
                  key={toothNumber}
                  toothNumber={toothNumber}
                  toothData={chartData.teeth[toothNumber] || {
                    id: '',
                    patient_id: patientId,
                    tooth_number: toothNumber,
                    status: 'present',
                    last_updated: new Date().toISOString()
                  }}
                  onToothClick={handleToothClick}
                />
              ))}
            </div>
          </div>
          
          {/* Lower teeth (17-32) */}
          <div>
            <div className="text-center font-semibold mb-2">Lower Teeth</div>
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 16 }, (_, i) => (i + 17).toString()).map(toothNumber => (
                <ToothComponent 
                  key={toothNumber}
                  toothNumber={toothNumber}
                  toothData={chartData.teeth[toothNumber] || {
                    id: '',
                    patient_id: patientId,
                    tooth_number: toothNumber,
                    status: 'present',
                    last_updated: new Date().toISOString()
                  }}
                  onToothClick={handleToothClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestorativeChartEnhanced; 