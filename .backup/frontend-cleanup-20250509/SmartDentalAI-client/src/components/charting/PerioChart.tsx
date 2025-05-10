import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// This will be implemented later, for now we'll use a placeholder
const generatePerioNote = async (chartData: any): Promise<string> => {
  return `Generated perio note for data: ${Object.keys(chartData).length} teeth measured.`;
};

interface PerioChartProps {
  patientId: number;
  onPerioDataSubmit?: (data: any) => void;
}

const toothOrder = [
  ...Array.from({ length: 16 }, (_, i) => 18 - i), // Upper Right to Upper Left
  ...Array.from({ length: 16 }, (_, i) => i + 31).reverse(), // Lower Left to Lower Right
];

const positions = ['DB', 'B', 'MB', 'DL', 'L', 'ML'];

export default function PerioChart({ patientId, onPerioDataSubmit }: PerioChartProps) {
  const [chartData, setChartData] = useState<Record<number, Record<string, string>>>({});
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (tooth: number, pos: string, value: string) => {
    setChartData((prev) => ({
      ...prev,
      [tooth]: {
        ...prev[tooth],
        [pos]: value,
      },
    }));
  };

  const handleGenerateNote = async () => {
    setIsLoading(true);
    const generatedNote = await generatePerioNote(chartData);
    setNote(generatedNote);
    setIsLoading(false);
    
    if (onPerioDataSubmit) {
      onPerioDataSubmit({
        chartData,
        note: generatedNote
      });
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Perio Charting - Patient #{patientId}</h2>
      <div className="overflow-auto">
        <table className="table-auto border text-sm">
          <thead>
            <tr>
              <th>Tooth</th>
              {positions.map((p) => (
                <th key={p}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {toothOrder.map((tooth) => (
              <tr key={tooth} className="border">
                <td className="font-bold text-center">{tooth}</td>
                {positions.map((pos) => (
                  <td key={pos}>
                    <Input
                      type="number"
                      className="w-14"
                      value={chartData[tooth]?.[pos] || ''}
                      onChange={(e) => handleChange(tooth, pos, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Button onClick={handleGenerateNote} disabled={isLoading}>
          {isLoading ? 'Generating Notes...' : 'Generate Notes from Chart'}
        </Button>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-4 w-full h-40"
          placeholder="Perio notes will appear here after generation..."
        />
      </div>
    </div>
  );
}