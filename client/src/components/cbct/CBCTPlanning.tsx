import React, { useState } from 'react';
import { Tabs, message } from 'antd';
import { CBCTViewer } from './CBCTViewer';
import { NerveTracer } from './NerveTracer';
import { ImplantPlanner } from './ImplantPlanner';
import './CBCTPlanning.css';

interface CBCTPlanningProps {
  dicomUrl: string;
  onPlanSave?: (plan: any) => void;
}

export const CBCTPlanning: React.FC<CBCTPlanningProps> = ({
  dicomUrl,
  onPlanSave
}) => {
  const [nervePoints, setNervePoints] = useState<number[][]>([]);
  const [implants, setImplants] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('viewer');

  const handleNerveTraceComplete = (points: number[][]) => {
    setNervePoints(points);
    message.success('Nerve canal traced');
  };

  const handleImplantPlace = (implant: any) => {
    setImplants([...implants, implant]);
  };

  const handleError = (error: Error) => {
    message.error(error.message);
  };

  const handleSave = () => {
    const plan = {
      nervePoints,
      implants,
      timestamp: new Date().toISOString()
    };
    onPlanSave?.(plan);
    message.success('Treatment plan saved');
  };

  const items = [
    {
      key: 'viewer',
      label: 'Viewer',
      children: (
        <CBCTViewer
          dicomUrl={dicomUrl}
          onError={handleError}
        />
      )
    },
    {
      key: 'nerve',
      label: 'Nerve Tracing',
      children: (
        <>
          <CBCTViewer
            dicomUrl={dicomUrl}
            onError={handleError}
          />
          <NerveTracer
            viewportId="CBCTViewport"
            onTraceComplete={handleNerveTraceComplete}
            onError={handleError}
          />
        </>
      )
    },
    {
      key: 'implant',
      label: 'Implant Planning',
      children: (
        <>
          <CBCTViewer
            dicomUrl={dicomUrl}
            onError={handleError}
          />
          <NerveTracer
            viewportId="CBCTViewport"
            nervePoints={nervePoints}
            onError={handleError}
          />
          <ImplantPlanner
            viewportId="CBCTViewport"
            nervePoints={nervePoints}
            onImplantPlace={handleImplantPlace}
            onError={handleError}
          />
        </>
      )
    }
  ];

  return (
    <div className="cbct-planning">
      <div className="cbct-planning-header">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
        />
      </div>
      <div className="cbct-planning-content">
        {items.find(item => item.key === activeTab)?.children}
      </div>
      <div className="cbct-planning-footer">
        <button
          className="save-plan-button"
          onClick={handleSave}
          disabled={implants.length === 0}
        >
          Save Treatment Plan
        </button>
      </div>
    </div>
  );
}; 