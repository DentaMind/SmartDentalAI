import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CrownBridgeSettings, Tooth } from '../../../server/types/crown-bridge';

interface PreviewSceneProps {
  preparationScan: THREE.BufferGeometry;
  opposingScan: THREE.BufferGeometry;
  settings: CrownBridgeSettings;
  adjacentTeeth: Tooth[];
}

const PreviewScene: React.FC<PreviewSceneProps> = ({
  preparationScan,
  opposingScan,
  settings,
  adjacentTeeth
}) => {
  const { scene } = useThree();
  const preparationRef = useRef<THREE.Mesh>(null);
  const opposingRef = useRef<THREE.Mesh>(null);
  const designRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    // Clear existing meshes
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Add preparation scan
    if (preparationScan) {
      const preparationMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5
      });
      const preparationMesh = new THREE.Mesh(preparationScan, preparationMaterial);
      preparationRef.current = preparationMesh;
      scene.add(preparationMesh);
    }

    // Add opposing scan
    if (opposingScan) {
      const opposingMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3
      });
      const opposingMesh = new THREE.Mesh(opposingScan, opposingMaterial);
      opposingRef.current = opposingMesh;
      scene.add(opposingMesh);
    }

    // Add adjacent teeth
    adjacentTeeth.forEach((tooth, index) => {
      const toothGeometry = new THREE.BoxGeometry(
        tooth.width,
        tooth.height,
        tooth.depth
      );
      const toothMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
      });
      const toothMesh = new THREE.Mesh(toothGeometry, toothMaterial);
      toothMesh.position.set(...tooth.position);
      toothMesh.rotation.set(...tooth.rotation);
      scene.add(toothMesh);
    });

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    return () => {
      scene.remove(ambientLight);
      scene.remove(pointLight);
    };
  }, [preparationScan, opposingScan, adjacentTeeth, scene]);

  useFrame(() => {
    // Update design based on settings
    if (designRef.current) {
      // Apply design changes based on settings
      // This is where you'd update the design mesh based on the current settings
    }
  });

  return null;
};

interface CrownBridgePreviewProps {
  preparationScan: THREE.BufferGeometry;
  opposingScan: THREE.BufferGeometry;
  settings: CrownBridgeSettings;
  adjacentTeeth: Tooth[];
}

export const CrownBridgePreview: React.FC<CrownBridgePreviewProps> = ({
  preparationScan,
  opposingScan,
  settings,
  adjacentTeeth
}) => {
  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <PreviewScene
          preparationScan={preparationScan}
          opposingScan={opposingScan}
          settings={settings}
          adjacentTeeth={adjacentTeeth}
        />
        <OrbitControls />
      </Canvas>
    </div>
  );
}; 