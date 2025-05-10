import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface XrayFinding {
  toothNumber: string;
  diagnosis: string;
  confidence: number;
}

interface XrayAnalysisResponse {
  imageUrl: string;
  findings: XrayFinding[];
}

interface Props {
  patientId: number | string;
}

const XrayAnalysisViewer: React.FC<Props> = ({ patientId }) => {
  const [analysis, setAnalysis] = useState<XrayAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/ai/xray/${patientId}`);
      setAnalysis(response.data);
    } catch (err) {
      setError('Failed to load X-ray analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchAnalysis();
  }, [patientId]);

  if (loading) return <p>Loading X-ray analysis...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mt-6">
      <h2 className="text-xl font-bold mb-2">AI-Powered X-ray Analysis</h2>
      {analysis ? (
        <>
          <img
            src={analysis.imageUrl}
            alt="X-ray with AI annotations"
            className="w-full h-auto border rounded-md mb-4"
          />
          <ul className="space-y-2">
            {analysis.findings.map((finding, index) => (
              <li key={index} className="border p-2 rounded-md">
                <p><strong>Tooth:</strong> {finding.toothNumber}</p>
                <p><strong>Diagnosis:</strong> {finding.diagnosis}</p>
                <p><strong>Confidence:</strong> {Math.round(finding.confidence * 100)}%</p>
              </li>
            ))}
          </ul>
          <button
            onClick={fetchAnalysis}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Refresh Analysis
          </button>
        </>
      ) : (
        <p>No analysis available for this patient yet.</p>
      )}
    </div>
  );
};

export default XrayAnalysisViewer;