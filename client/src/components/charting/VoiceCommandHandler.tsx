import React, { useEffect, useState } from 'react';
import { parseVoiceCommand, ParsedCommand } from '@/utils/voiceParser';

interface VoiceCommandHandlerProps {
  transcript: string;
  onChartMeasurement: (cmd: ParsedCommand) => void;
  onNavigateNext: () => void;
  onGoBack: () => void;
  onRepeat: () => void;
  onShowPrompt: (msg: string) => void;
  setContext: (context: string) => void;
}

const VoiceCommandHandler: React.FC<VoiceCommandHandlerProps> = ({
  transcript,
  onChartMeasurement,
  onNavigateNext,
  onGoBack,
  onRepeat,
  onShowPrompt,
  setContext,
}) => {
  const [currentCommand, setCurrentCommand] = useState<ParsedCommand | null>(null);

  useEffect(() => {
    if (!transcript) return;

    const lowerCaseTranscript = transcript.toLowerCase();

    if (lowerCaseTranscript.includes('probing')) {
      setContext('perio');
    } else if (lowerCaseTranscript.includes('crown prep')) {
      setContext('crownPrep');
    } else if (lowerCaseTranscript.includes('endo')) {
      setContext('endo');
    }

    parseVoiceCommand(transcript).then((result) => {
      if (result.error) {
        onShowPrompt(result.error);
        return;
      }

      setCurrentCommand(result);

      switch (result.command) {
        case 'chart':
          onChartMeasurement(result);
          break;
        case 'next':
          onNavigateNext();
          break;
        case 'back':
          onGoBack();
          break;
        case 'repeat':
          onRepeat();
          break;
        default:
          onShowPrompt('Unrecognized command.');
      }
    });
  }, [transcript, onChartMeasurement, onNavigateNext, onGoBack, onRepeat, onShowPrompt, setContext]);

  const renderOverlay = () => {
    if (!currentCommand || currentCommand.command !== 'chart') return null;

    return (
      <div className="absolute top-4 right-4 bg-white p-4 rounded-2xl shadow-2xl border z-50 max-w-xs">
        <div className="text-sm font-semibold">🦷 Tooth {currentCommand.tooth}, {currentCommand.surface}</div>
        {Object.entries(currentCommand.measurements || {}).map(([type, value]) => (
          <div key={type}>
            <span className="uppercase font-medium">{type}:</span>{' '}
            {Array.isArray(value) ? value.join(' ') : value}
          </div>
        ))}
        <div className="text-green-600 font-bold mt-2">✅ Recorded</div>
      </div>
    );
  };

  return <>{renderOverlay()}</>;
};

export default VoiceCommandHandler; 