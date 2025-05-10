import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { DentureSettings, Tooth } from '../../../server/types/denture';

interface DenturePreviewProps {
  archScan: THREE.BufferGeometry;
  settings: DentureSettings;
  remainingTeeth: Tooth[];
}

const PreviewScene: React.FC<DenturePreviewProps> = ({
  archScan,
  settings,
  remainingTeeth
}) => {
  const { scene } = useThree();
  const dentureRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!archScan) return;

    // Clear previous denture
    if (dentureRef.current) {
      scene.remove(dentureRef.current);
    }

    // Create denture base
    const dentureBase = new THREE.Mesh(
      archScan,
      new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
    );

    // Create denture group
    const dentureGroup = new THREE.Group();
    dentureGroup.add(dentureBase);

    // Add remaining teeth
    remainingTeeth.forEach(tooth => {
      const toothGeometry = new THREE.BoxGeometry(
        tooth.width,
        tooth.height,
        tooth.depth
      );
      
      const toothMesh = new THREE.Mesh(
        toothGeometry,
        new THREE.MeshPhongMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.8
        })
      );

      toothMesh.position.set(...tooth.position);
      toothMesh.rotation.set(...tooth.rotation);
      
      dentureGroup.add(toothMesh);
    });

    // Apply settings
    if (settings.palateShape === 'horseshoe') {
      // Modify base geometry for horseshoe shape
      // This would be implemented based on specific requirements
    }

    scene.add(dentureGroup);
    dentureRef.current = dentureGroup;

    return () => {
      if (dentureRef.current) {
        scene.remove(dentureRef.current);
      }
    };
  }, [archScan, settings, remainingTeeth, scene]);

  useFrame(() => {
    // Update denture based on settings changes
    if (dentureRef.current) {
      // Apply any dynamic updates here
    }
  });

  return null;
};

export const DenturePreview: React.FC<DenturePreviewProps> = (props) => {
  return (
    <div className="denture-preview" style={{ height: '400px', width: '100%' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 100]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        <PreviewScene {...props} />
      </Canvas>
    </div>
  );
}; 