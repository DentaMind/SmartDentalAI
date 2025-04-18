import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CrownBridgeSettings, Tooth } from '../../../server/types/crown-bridge';

interface CrownBridgePreviewProps {
  preparationScan: THREE.BufferGeometry;
  opposingScan: THREE.BufferGeometry;
  settings: CrownBridgeSettings;
  adjacentTeeth: Tooth[];
}

const PreviewScene: React.FC<CrownBridgePreviewProps> = ({
  preparationScan,
  opposingScan,
  settings,
  adjacentTeeth
}) => {
  const { scene } = useThree();
  const designRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!preparationScan || !opposingScan) return;

    // Clear previous design
    if (designRef.current) {
      scene.remove(designRef.current);
    }

    // Create preparation mesh
    const preparationMesh = new THREE.Mesh(
      preparationScan,
      new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
    );

    // Create opposing mesh
    const opposingMesh = new THREE.Mesh(
      opposingScan,
      new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
    );

    // Create design group
    const designGroup = new THREE.Group();
    designGroup.add(preparationMesh);
    designGroup.add(opposingMesh);

    // Add adjacent teeth
    adjacentTeeth.forEach(tooth => {
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
      
      designGroup.add(toothMesh);
    });

    // Apply settings
    if (settings.designType === 'bridge') {
      // Add bridge connectors
      // This would be implemented based on specific requirements
    }

    scene.add(designGroup);
    designRef.current = designGroup;

    return () => {
      if (designRef.current) {
        scene.remove(designRef.current);
      }
    };
  }, [preparationScan, opposingScan, settings, adjacentTeeth, scene]);

  useFrame(() => {
    // Update design based on settings changes
    if (designRef.current) {
      // Apply any dynamic updates here
    }
  });

  return null;
};

export const CrownBridgePreview: React.FC<CrownBridgePreviewProps> = (props) => {
  return (
    <div className="crown-bridge-preview" style={{ height: '400px', width: '100%' }}>
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