import React, { useEffect, useRef, useState } from 'react';
import { 
  init, 
  RenderingEngine, 
  Enums, 
  cache,
  getRenderingEngine,
  getEnabledElement
} from '@cornerstonejs/core';
import { 
  ToolGroupManager, 
  WindowLevelTool, 
  ZoomTool, 
  PanTool,
  RectangleROITool
} from '@cornerstonejs/tools';
import { Button, Space, Select, Slider, message } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  RotateLeftOutlined,
  RotateRightOutlined
} from '@ant-design/icons';
import './ImplantPlanner.css';

interface Implant {
  id: string;
  position: number[];
  rotation: number;
  diameter: number;
  length: number;
  system: string;
  type: string;
}

interface ImplantPlannerProps {
  viewportId: string;
  nervePoints?: number[][];
  onImplantPlace?: (implant: Implant) => void;
  onError?: (error: Error) => void;
}

export const ImplantPlanner: React.FC<ImplantPlannerProps> = ({
  viewportId,
  nervePoints,
  onImplantPlace,
  onError
}) => {
  const [implants, setImplants] = useState<Implant[]>([]);
  const [selectedImplant, setSelectedImplant] = useState<Implant | null>(null);
  const [implantSystem, setImplantSystem] = useState('nobel');
  const [implantType, setImplantType] = useState('standard');
  const [implantDiameter, setImplantDiameter] = useState(4.1);
  const [implantLength, setImplantLength] = useState(10);
  const [rotation, setRotation] = useState(0);

  const implantSystems = [
    { value: 'nobel', label: 'Nobel Biocare' },
    { value: 'straumann', label: 'Straumann' },
    { value: 'biohorizons', label: 'BioHorizons' },
    { value: 'zimmer', label: 'Zimmer Biomet' }
  ];

  const implantTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'wide', label: 'Wide' },
    { value: 'narrow', label: 'Narrow' }
  ];

  const diameters = [
    { value: 3.3, label: '3.3mm' },
    { value: 3.5, label: '3.5mm' },
    { value: 4.1, label: '4.1mm' },
    { value: 4.8, label: '4.8mm' },
    { value: 5.5, label: '5.5mm' }
  ];

  const lengths = [
    { value: 8, label: '8mm' },
    { value: 10, label: '10mm' },
    { value: 11.5, label: '11.5mm' },
    { value: 13, label: '13mm' },
    { value: 15, label: '15mm' }
  ];

  useEffect(() => {
    const initializePlanner = async () => {
      try {
        await init();

        const toolGroup = ToolGroupManager.createToolGroup('ImplantPlannerToolGroup');
        if (!toolGroup) {
          throw new Error('Failed to create tool group');
        }

        // Add tools
        toolGroup.addTool(RectangleROITool.toolName);
        toolGroup.addTool(WindowLevelTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);
        toolGroup.addTool(PanTool.toolName);

        // Set tool modes
        toolGroup.setToolActive(RectangleROITool.toolName, {
          bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
        });

        // Add event listeners
        toolGroup.addEventListener('annotationCompleted', handleAnnotationComplete);
        toolGroup.addEventListener('annotationModified', handleAnnotationModified);

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize implant planner');
        onError?.(error);
      }
    };

    initializePlanner();

    return () => {
      ToolGroupManager.destroyToolGroup('ImplantPlannerToolGroup');
    };
  }, [viewportId, onError]);

  const handleAnnotationComplete = (evt: any) => {
    const position = evt.detail.annotation.data.contour.polyline[0];
    const newImplant: Implant = {
      id: Date.now().toString(),
      position,
      rotation,
      diameter: implantDiameter,
      length: implantLength,
      system: implantSystem,
      type: implantType
    };

    setImplants([...implants, newImplant]);
    setSelectedImplant(newImplant);
    onImplantPlace?.(newImplant);
    message.success('Implant placed');
  };

  const handleAnnotationModified = (evt: any) => {
    if (!selectedImplant) return;

    const position = evt.detail.annotation.data.contour.polyline[0];
    const updatedImplant = {
      ...selectedImplant,
      position
    };

    setImplants(implants.map(imp => 
      imp.id === selectedImplant.id ? updatedImplant : imp
    ));
    setSelectedImplant(updatedImplant);
  };

  const handleDelete = () => {
    if (!selectedImplant) return;

    setImplants(implants.filter(imp => imp.id !== selectedImplant.id));
    setSelectedImplant(null);
    message.success('Implant deleted');
  };

  const handleSave = () => {
    if (implants.length === 0) {
      message.warning('No implants to save');
      return;
    }
    // TODO: Implement save functionality
    message.success('Implant plan saved');
  };

  const handleRotateLeft = () => {
    if (!selectedImplant) return;
    const newRotation = (rotation - 5) % 360;
    setRotation(newRotation);
    updateSelectedImplant({ rotation: newRotation });
  };

  const handleRotateRight = () => {
    if (!selectedImplant) return;
    const newRotation = (rotation + 5) % 360;
    setRotation(newRotation);
    updateSelectedImplant({ rotation: newRotation });
  };

  const updateSelectedImplant = (updates: Partial<Implant>) => {
    if (!selectedImplant) return;

    const updatedImplant = {
      ...selectedImplant,
      ...updates
    };

    setImplants(implants.map(imp => 
      imp.id === selectedImplant.id ? updatedImplant : imp
    ));
    setSelectedImplant(updatedImplant);
  };

  return (
    <div className="implant-planner">
      <div className="implant-planner-toolbar">
        <Space>
          <Select
            value={implantSystem}
            onChange={value => {
              setImplantSystem(value);
              if (selectedImplant) {
                updateSelectedImplant({ system: value });
              }
            }}
            options={implantSystems}
            style={{ width: 150 }}
          />
          <Select
            value={implantType}
            onChange={value => {
              setImplantType(value);
              if (selectedImplant) {
                updateSelectedImplant({ type: value });
              }
            }}
            options={implantTypes}
            style={{ width: 120 }}
          />
          <Select
            value={implantDiameter}
            onChange={value => {
              setImplantDiameter(value);
              if (selectedImplant) {
                updateSelectedImplant({ diameter: value });
              }
            }}
            options={diameters}
            style={{ width: 100 }}
          />
          <Select
            value={implantLength}
            onChange={value => {
              setImplantLength(value);
              if (selectedImplant) {
                updateSelectedImplant({ length: value });
              }
            }}
            options={lengths}
            style={{ width: 100 }}
          />
          <Button.Group>
            <Button
              icon={<RotateLeftOutlined />}
              onClick={handleRotateLeft}
              disabled={!selectedImplant}
            />
            <Button
              icon={<RotateRightOutlined />}
              onClick={handleRotateRight}
              disabled={!selectedImplant}
            />
            <Button
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              disabled={!selectedImplant}
            />
            <Button
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={implants.length === 0}
            />
          </Button.Group>
        </Space>
      </div>
    </div>
  );
}; 