import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useIntraoralScan } from '../../hooks/useIntraoralScan';
import { IntraoralScan } from '@shared/schema';
import { Slider, Space, Button, Tooltip } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, UndoOutlined } from '@ant-design/icons';
import './IntraoralOverlay.css';

interface IntraoralOverlayProps {
  scan: IntraoralScan;
  onTransformChange?: (transform: any) => void;
}

const Model = ({ url, opacity }: { url: string; opacity: number }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} opacity={opacity} />;
};

export const IntraoralOverlay: React.FC<IntraoralOverlayProps> = ({
  scan,
  onTransformChange
}) => {
  const {
    isVisible,
    opacity,
    transform,
    toggleVisibility,
    updateOpacity,
    updateTransform,
    resetTransform
  } = useIntraoralScan({ scan, onTransformChange });

  if (!isVisible) return null;

  return (
    <div className="intraoral-overlay">
      <div className="overlay-controls">
        <Space>
          <Tooltip title={isVisible ? "Hide Overlay" : "Show Overlay"}>
            <Button
              icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={toggleVisibility}
            />
          </Tooltip>
          <Tooltip title="Reset Position">
            <Button
              icon={<UndoOutlined />}
              onClick={resetTransform}
            />
          </Tooltip>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={opacity}
            onChange={updateOpacity}
            style={{ width: 100 }}
          />
        </Space>
      </div>
      <div className="overlay-canvas">
        <Canvas
          camera={{ position: [0, 0, 5] }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Model url={scan.fileUrl} opacity={opacity} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              onChange={(e) => {
                const { position, rotation, scale } = e.target.object;
                updateTransform({
                  position: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                  },
                  rotation: {
                    x: rotation.x,
                    y: rotation.y,
                    z: rotation.z
                  },
                  scale: {
                    x: scale.x,
                    y: scale.y,
                    z: scale.z
                  }
                });
              }}
            />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}; 