import React, { useState } from 'react';
import { Upload, Button, message, Card, Typography, Space, Progress, Row, Col } from 'antd';
import { UploadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

const { Title, Text } = Typography;

interface ScanUploaderProps {
  onPreparationScanUpload: (geometry: THREE.BufferGeometry) => void;
  onOpposingScanUpload: (geometry: THREE.BufferGeometry) => void;
  onAdjacentTeethUpload: (teeth: any[]) => void;
}

const PreviewScene: React.FC<{ geometry: THREE.BufferGeometry | null }> = ({ geometry }) => {
  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#00ff00" transparent opacity={0.5} />
    </mesh>
  );
};

export const ScanUploader: React.FC<ScanUploaderProps> = ({
  onPreparationScanUpload,
  onOpposingScanUpload,
  onAdjacentTeethUpload
}) => {
  const [loading, setLoading] = useState(false);
  const [preparationPreview, setPreparationPreview] = useState<THREE.BufferGeometry | null>(null);
  const [opposingPreview, setOpposingPreview] = useState<THREE.BufferGeometry | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const loadGeometry = async (file: File): Promise<THREE.BufferGeometry> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const loader = new (() => {
      switch (extension) {
        case 'stl': return new STLLoader();
        case 'obj': return new OBJLoader();
        case 'gltf':
        case 'glb': return new GLTFLoader();
        default: throw new Error('Unsupported file format');
      }
    })();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress((event.loaded / event.total) * 100);
        }
      };
      reader.onload = async (event) => {
        try {
          let geometry: THREE.BufferGeometry;
          if (extension === 'stl') {
            geometry = (loader as STLLoader).parse(event.target?.result as ArrayBuffer);
          } else if (extension === 'obj') {
            const object = (loader as OBJLoader).parse(event.target?.result as string);
            geometry = object.children[0].geometry;
          } else {
            const gltf = await (loader as GLTFLoader).parseAsync(event.target?.result as ArrayBuffer);
            geometry = gltf.scene.children[0].geometry;
          }
          resolve(geometry);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (extension === 'obj') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleFileUpload = async (file: File, type: 'preparation' | 'opposing' | 'adjacent') => {
    try {
      setLoading(true);
      setUploadProgress(0);

      if (type === 'adjacent') {
        const teethData = await new Promise<any[]>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target?.result as string);
              resolve(data);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });
        onAdjacentTeethUpload(teethData);
      } else {
        const geometry = await loadGeometry(file);
        if (type === 'preparation') {
          setPreparationPreview(geometry);
          onPreparationScanUpload(geometry);
        } else {
          setOpposingPreview(geometry);
          onOpposingScanUpload(geometry);
        }
      }

      message.success(`${type} scan uploaded successfully`);
    } catch (error) {
      message.error(`Failed to upload ${type} scan: ${(error as Error).message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const uploadProps = (type: 'preparation' | 'opposing' | 'adjacent') => ({
    accept: type === 'adjacent' ? '.json' : '.stl,.obj,.gltf,.glb',
    showUploadList: false,
    beforeUpload: (file: File) => {
      handleFileUpload(file, type);
      return false;
    }
  });

  return (
    <Card>
      <Title level={4}>Upload Scans</Title>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Upload {...uploadProps('preparation')}>
                <Button icon={<UploadOutlined />} loading={loading}>
                  Upload Preparation Scan
                </Button>
              </Upload>
              {preparationPreview && (
                <div style={{ height: '200px', position: 'relative' }}>
                  <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <PreviewScene geometry={preparationPreview} />
                    <OrbitControls />
                  </Canvas>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setPreparationPreview(null);
                      onPreparationScanUpload(new THREE.BoxGeometry(1, 1, 1));
                    }}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </div>
              )}
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Upload {...uploadProps('opposing')}>
                <Button icon={<UploadOutlined />} loading={loading}>
                  Upload Opposing Scan
                </Button>
              </Upload>
              {opposingPreview && (
                <div style={{ height: '200px', position: 'relative' }}>
                  <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <PreviewScene geometry={opposingPreview} />
                    <OrbitControls />
                  </Canvas>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setOpposingPreview(null);
                      onOpposingScanUpload(new THREE.BoxGeometry(1, 1, 1));
                    }}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </div>
              )}
            </Space>
          </Col>
        </Row>

        <Upload {...uploadProps('adjacent')}>
          <Button icon={<UploadOutlined />} loading={loading}>
            Upload Adjacent Teeth Data (JSON)
          </Button>
        </Upload>

        {uploadProgress > 0 && (
          <Progress percent={uploadProgress} status="active" />
        )}

        <Text type="secondary">
          Supported formats: STL, OBJ, GLTF, GLB for scans; JSON for adjacent teeth data
        </Text>
      </Space>
    </Card>
  );
}; 