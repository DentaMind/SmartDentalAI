import React from 'react';
import { Card, Typography } from 'antd';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const { Title } = Typography;

interface ScanPreviewProps {
  title: string;
  geometry: THREE.BufferGeometry;
}

const PreviewScene: React.FC<{ geometry: THREE.BufferGeometry }> = ({ geometry }) => {
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#00ff00"
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const ScanPreview: React.FC<ScanPreviewProps> = ({ title, geometry }) => {
  return (
    <Card>
      <Title level={5}>{title}</Title>
      <div style={{ height: '300px', position: 'relative' }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <PreviewScene geometry={geometry} />
          <OrbitControls />
        </Canvas>
      </div>
    </Card>
  );
}; 