import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ToothStatus, RestorationType } from '../../../backend/api/models/restorative_chart';
import { AlertCircle } from 'lucide-react';

interface Tooth3DProps {
  toothNumber: string;
  position: [number, number, number];
  status: ToothStatus;
  restoration?: RestorationType;
  surfaces?: string[];
  isActive?: boolean;
  highlight?: boolean;
  onClick?: () => void;
  findings?: any[];
}

// Surface positions relative to tooth center
const SURFACE_POSITIONS = {
  'M': [0.25, 0, 0], // Mesial
  'O': [0, 0, 0.25], // Occlusal
  'D': [-0.25, 0, 0], // Distal
  'B': [0, 0, -0.25], // Buccal
  'L': [0, 0.25, 0], // Lingual
  'F': [0, -0.25, 0], // Facial
  'I': [0, 0.25, 0], // Incisal
};

export const Tooth3D: React.FC<Tooth3DProps> = ({
  toothNumber,
  position,
  status,
  restoration,
  surfaces = [],
  isActive = false,
  highlight = false,
  onClick,
  findings = []
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const hasFindings = findings && findings.length > 0;
  
  // Calculate tooth material based on status
  const toothMaterial = useMemo(() => {
    let color;
    let opacity = 1;
    
    switch (status) {
      case ToothStatus.MISSING:
      case ToothStatus.EXTRACTED:
        color = new THREE.Color(0xcccccc);
        opacity = 0.3;
        break;
      case ToothStatus.IMPACTED:
        color = new THREE.Color(0x888888);
        opacity = 0.5;
        break;
      case ToothStatus.PLANNED_EXTRACTION:
        color = new THREE.Color(0xff9999);
        break;
      case ToothStatus.PLANNED_IMPLANT:
        color = new THREE.Color(0x99ccff);
        break;
      default:
        color = new THREE.Color(0xffffff);
    }
    
    return new THREE.MeshStandardMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      roughness: 0.3,
      metalness: 0.1,
    });
  }, [status]);
  
  // Calculate restoration material
  const restorationMaterial = useMemo(() => {
    if (!restoration) return null;
    
    let color;
    
    switch (restoration) {
      case RestorationType.AMALGAM:
        color = new THREE.Color(0x888888);
        break;
      case RestorationType.COMPOSITE:
        color = new THREE.Color(0xf0f0e0);
        break;
      case RestorationType.CROWN_PFM:
        color = new THREE.Color(0xd4af37);
        break;
      case RestorationType.CROWN_ZIRCONIA:
        color = new THREE.Color(0xeeeeee);
        break;
      case RestorationType.CROWN_EMAX:
        color = new THREE.Color(0xdddddd);
        break;
      case RestorationType.VENEER:
        color = new THREE.Color(0xf5f5f5);
        break;
      case RestorationType.IMPLANT:
        color = new THREE.Color(0xc0c0c0);
        break;
      default:
        color = new THREE.Color(0xf8f8f8);
    }
    
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.2,
      metalness: restoration === RestorationType.AMALGAM ? 0.8 : 0.2,
    });
  }, [restoration]);
  
  // Animation for hover/active state
  useFrame(() => {
    if (groupRef.current) {
      const scale = isActive 
        ? 1.2 
        : hovered 
          ? 1.1 
          : 1;
          
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      
      if (highlight || hasFindings) {
        // Pulse animation for highlighted teeth
        const pulse = Math.sin(Date.now() * 0.003) * 0.05 + 1;
        groupRef.current.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 0.1);
      }
    }
  });
  
  // Create a tooth shape
  const toothGeometry = useMemo(() => {
    // Generate different geometries based on tooth type (front, premolar, molar)
    const toothNum = parseInt(toothNumber);
    
    if (toothNum >= 1 && toothNum <= 3 || toothNum >= 14 && toothNum <= 16 || 
        toothNum >= 17 && toothNum <= 19 || toothNum >= 30 && toothNum <= 32) {
      // Molars - bulkier
      return new THREE.BoxGeometry(0.6, 0.6, 0.6);
    } else if (toothNum >= 4 && toothNum <= 5 || toothNum >= 12 && toothNum <= 13 || 
              toothNum >= 20 && toothNum <= 21 || toothNum >= 28 && toothNum <= 29) {
      // Premolars - medium
      return new THREE.BoxGeometry(0.5, 0.6, 0.5);
    } else {
      // Anterior teeth - taller and thinner
      return new THREE.BoxGeometry(0.4, 0.7, 0.4);
    }
  }, [toothNumber]);
  
  // Root geometry
  const rootGeometry = useMemo(() => {
    // Different root structures based on tooth type
    const toothNum = parseInt(toothNumber);
    
    if (toothNum >= 1 && toothNum <= 3 || toothNum >= 14 && toothNum <= 16 || 
        toothNum >= 17 && toothNum <= 19 || toothNum >= 30 && toothNum <= 32) {
      // Molars - 3 roots
      return new THREE.CylinderGeometry(0.1, 0.05, 0.7, 8);
    } else if (toothNum >= 4 && toothNum <= 5 || toothNum >= 12 && toothNum <= 13 || 
              toothNum >= 20 && toothNum <= 21 || toothNum >= 28 && toothNum <= 29) {
      // Premolars - 2 roots
      return new THREE.CylinderGeometry(0.1, 0.05, 0.8, 8);
    } else {
      // Anterior teeth - single root
      return new THREE.CylinderGeometry(0.1, 0.05, 1, 8);
    }
  }, [toothNumber]);
  
  // Combine all elements
  return (
    <group 
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Tooth number label */}
      <Html position={[0, -0.8, 0]} center>
        <div style={{ 
          color: isActive ? '#3b82f6' : '#888888',
          fontSize: '10px', 
          fontWeight: isActive ? 'bold' : 'normal',
          padding: '2px',
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: '4px'
        }}>
          {toothNumber}
        </div>
      </Html>
      
      {/* AI findings indicator */}
      {hasFindings && (
        <Html position={[0.3, 0.3, 0]} center>
          <div style={{
            color: '#ef4444',
            backgroundColor: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={12} />
          </div>
        </Html>
      )}
      
      {/* Main tooth crown */}
      <mesh 
        geometry={toothGeometry} 
        material={toothMaterial}
        visible={status !== ToothStatus.MISSING && status !== ToothStatus.EXTRACTED}
      />
      
      {/* Roots */}
      {status !== ToothStatus.MISSING && status !== ToothStatus.EXTRACTED && (
        <>
          {/* Center root for all teeth */}
          <mesh 
            geometry={rootGeometry}
            material={toothMaterial}
            position={[0, -0.7, 0]}
          />
          
          {/* Additional roots for molars */}
          {(toothNumber === '1' || toothNumber === '2' || toothNumber === '3' || 
            toothNumber === '14' || toothNumber === '15' || toothNumber === '16' ||
            toothNumber === '17' || toothNumber === '18' || toothNumber === '19' ||
            toothNumber === '30' || toothNumber === '31' || toothNumber === '32') && (
            <>
              <mesh
                geometry={rootGeometry}
                material={toothMaterial}
                position={[0.2, -0.7, 0.2]}
                scale={[0.7, 0.9, 0.7]}
              />
              <mesh
                geometry={rootGeometry}
                material={toothMaterial}
                position={[-0.2, -0.7, 0.2]}
                scale={[0.7, 0.85, 0.7]}
              />
            </>
          )}
        </>
      )}
      
      {/* Restorations - only show if tooth is present */}
      {status === ToothStatus.PRESENT && restoration && restorationMaterial && (
        <>
          {surfaces.length > 0 ? (
            // Place restoration on specific surfaces
            surfaces.map((surface, index) => (
              <mesh
                key={`${toothNumber}-${surface}-${index}`}
                position={SURFACE_POSITIONS[surface as keyof typeof SURFACE_POSITIONS] || [0, 0, 0]}
                material={restorationMaterial}
              >
                <boxGeometry args={[0.3, 0.3, 0.3]} />
              </mesh>
            ))
          ) : (
            // Full-coverage restoration (crown, veneer, etc.)
            <mesh
              material={restorationMaterial}
              scale={[1.05, 1.05, 1.05]}
            >
              <boxGeometry args={[0.6, 0.6, 0.6]} />
            </mesh>
          )}
        </>
      )}
      
      {/* Highlight outline for active tooth */}
      {isActive && (
        <mesh scale={[1.1, 1.1, 1.1]}>
          <boxGeometry args={[0.65, 0.7, 0.65]} />
          <meshBasicMaterial color="#3b82f6" wireframe={true} />
        </mesh>
      )}
    </group>
  );
}; 