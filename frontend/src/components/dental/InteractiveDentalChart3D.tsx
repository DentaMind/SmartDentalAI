import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ToothStatus, RestorationType } from '../../../backend/api/models/restorative_chart';
import { Button, Tooltip } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Tooth3D } from './Tooth3D';
import { useDentalChart } from '../../hooks/useDentalChart';
import { useAIDiagnosis } from '../../hooks/useAIDiagnosis';
import { DiagnosticPanel } from '../diagnosis/DiagnosticPanel';
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ToothData {
  number: string;
  status: ToothStatus;
  position: [number, number, number];
  restoration?: RestorationType;
  surfaces?: string[];
  highlight?: boolean;
  aiFindings?: any[];
}

interface InteractiveDentalChart3DProps {
  patientId: string;
  onToothSelect?: (toothNumber: string) => void;
  readOnly?: boolean;
}

const ADULT_TEETH_POSITIONS = {
  // Upper right quadrant (1-8)
  '1': [3.5, 0.5, 0],
  '2': [2.5, 0.5, 0],
  '3': [1.5, 0.5, 0],
  '4': [0.5, 0.5, 0],
  '5': [-0.5, 0.5, 0],
  '6': [-1.5, 0.5, 0],
  '7': [-2.5, 0.5, 0],
  '8': [-3.5, 0.5, 0],
  
  // Upper left quadrant (9-16)
  '9': [-3.5, 0.5, 0],
  '10': [-2.5, 0.5, 0],
  '11': [-1.5, 0.5, 0],
  '12': [-0.5, 0.5, 0],
  '13': [0.5, 0.5, 0],
  '14': [1.5, 0.5, 0],
  '15': [2.5, 0.5, 0],
  '16': [3.5, 0.5, 0],
  
  // Lower left quadrant (17-24)
  '17': [3.5, -0.5, 0],
  '18': [2.5, -0.5, 0],
  '19': [1.5, -0.5, 0],
  '20': [0.5, -0.5, 0],
  '21': [-0.5, -0.5, 0],
  '22': [-1.5, -0.5, 0],
  '23': [-2.5, -0.5, 0],
  '24': [-3.5, -0.5, 0],
  
  // Lower right quadrant (25-32)
  '25': [-3.5, -0.5, 0],
  '26': [-2.5, -0.5, 0],
  '27': [-1.5, -0.5, 0],
  '28': [-0.5, -0.5, 0],
  '29': [0.5, -0.5, 0],
  '30': [1.5, -0.5, 0],
  '31': [2.5, -0.5, 0],
  '32': [3.5, -0.5, 0],
};

const DentalScene = ({ 
  teeth, 
  onToothClick, 
  activeToothNumber,
  readOnly
}: { 
  teeth: ToothData[]; 
  onToothClick: (toothNumber: string) => void;
  activeToothNumber?: string;
  readOnly?: boolean;
}) => {
  const { scene, camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (camera && groupRef.current) {
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  useFrame(() => {
    if (groupRef.current) {
      // Optional animations can be added here
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Teeth models */}
      {teeth.map((tooth) => (
        <Tooth3D
          key={tooth.number}
          toothNumber={tooth.number}
          position={tooth.position}
          status={tooth.status}
          restoration={tooth.restoration}
          surfaces={tooth.surfaces}
          isActive={activeToothNumber === tooth.number}
          highlight={tooth.highlight}
          onClick={() => !readOnly && onToothClick(tooth.number)}
          findings={tooth.aiFindings}
        />
      ))}
      
      {/* Dental arch guide */}
      <mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.05, 16, 100, Math.PI]} />
        <meshStandardMaterial color="#888888" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, -1, -0.1]} rotation={[Math.PI / 2, 0, Math.PI]}>
        <torusGeometry args={[4, 0.05, 16, 100, Math.PI]} />
        <meshStandardMaterial color="#888888" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export const InteractiveDentalChart3D: React.FC<InteractiveDentalChart3DProps> = ({
  patientId,
  onToothSelect,
  readOnly = false
}) => {
  const [activeToothNumber, setActiveToothNumber] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'3d' | 'chart'>('3d');
  const [cameraPosition, setCameraPosition] = useState([0, 0, 10]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  const { toothChart, loadChart, updateToothStatus, updateRestoration } = useDentalChart(patientId);
  const { aiDiagnosis, getAIDiagnosis, diagnosisLoading } = useAIDiagnosis();
  
  const [teeth, setTeeth] = useState<ToothData[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadChart();
      await getAIDiagnosis(patientId);
      setLoading(false);
    };
    
    loadData();
  }, [patientId]);
  
  useEffect(() => {
    if (toothChart) {
      // Transform chart data to 3D model data
      const teethData: ToothData[] = Object.keys(ADULT_TEETH_POSITIONS).map(toothNumber => {
        const chartTooth = toothChart.find(t => t.tooth_number === toothNumber);
        const aiFindings = aiDiagnosis?.findings?.filter(f => 
          f.tooth === toothNumber
        );
        
        return {
          number: toothNumber,
          status: chartTooth?.status || ToothStatus.PRESENT,
          position: ADULT_TEETH_POSITIONS[toothNumber as keyof typeof ADULT_TEETH_POSITIONS],
          restoration: chartTooth?.current_restoration?.restoration_type,
          surfaces: chartTooth?.current_restoration?.surfaces,
          highlight: aiFindings && aiFindings.length > 0,
          aiFindings
        };
      });
      
      setTeeth(teethData);
    }
  }, [toothChart, aiDiagnosis]);
  
  const handleToothClick = (toothNumber: string) => {
    setActiveToothNumber(toothNumber);
    if (onToothSelect) {
      onToothSelect(toothNumber);
    }
  };
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2.5));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const handleRotate = () => {
    setRotation(prev => prev + 90);
  };
  
  const getActiveTooth = () => {
    return teeth.find(t => t.number === activeToothNumber);
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6 h-[500px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading dental chart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>3D Dental Chart</span>
          <div className="flex space-x-2">
            <Tooltip>
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip>
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip>
              <Button variant="outline" size="icon" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full">
          <Canvas
            style={{ 
              height: '100%', 
              width: '100%',
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
          >
            <PerspectiveCamera makeDefault position={cameraPosition} />
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
            />
            <DentalScene 
              teeth={teeth} 
              onToothClick={handleToothClick}
              activeToothNumber={activeToothNumber}
              readOnly={readOnly}
            />
          </Canvas>
        </div>
        
        {activeToothNumber && (
          <div className="mt-4">
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Tooth Information</TabsTrigger>
                <TabsTrigger value="ai">AI Diagnosis</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="p-4 border rounded-md">
                <h3 className="text-lg font-medium">Tooth #{activeToothNumber}</h3>
                <p>Status: {getActiveTooth()?.status}</p>
                {getActiveTooth()?.restoration && (
                  <>
                    <p>Restoration: {getActiveTooth()?.restoration}</p>
                    <p>Surfaces: {getActiveTooth()?.surfaces?.join(', ')}</p>
                  </>
                )}
              </TabsContent>
              <TabsContent value="ai" className="p-4 border rounded-md">
                <DiagnosticPanel 
                  toothNumber={activeToothNumber}
                  findings={getActiveTooth()?.aiFindings || []}
                  loading={diagnosisLoading}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 