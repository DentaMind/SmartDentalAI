import React, { useState } from 'react';
import { useDentaScopeSocket } from '@/hooks/useDentaScopeSocket';
import VoiceCommandHandler from '@/components/charting/VoiceCommandHandler';
import AROverlay from '@/components/AROverlay';
import vitalsAnalyzer from '@/utils/vitalsAnalyzer';

const DentaScopeInterface = () => {
  const { transcript, context, vitals } = useDentaScopeSocket('ws://localhost:8080');
  const [currentContext, setCurrentContext] = useState('idle');
  const alert = vitalsAnalyzer(vitals || {});

  return (
    <>
      <VoiceCommandHandler
        transcript={transcript || ''}
        onChartMeasurement={(cmd) => console.log('Chart Measurement:', cmd)}
        onNavigateNext={() => console.log('Navigate to next tooth')}
        onGoBack={() => console.log('Go back to previous tooth')}
        onRepeat={() => console.log('Repeat last command')}
        onShowPrompt={(msg) => console.log('Prompt:', msg)}
        setContext={setCurrentContext}
      />
      <AROverlay context={currentContext} vitals={vitals} alert={alert} />
    </>
  );
};

export default DentaScopeInterface; 