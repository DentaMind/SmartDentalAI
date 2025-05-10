import React from 'react';

const getColorForConfidence = (confidence) => {
  if (confidence > 0.85) return 'bg-green-100';
  if (confidence > 0.65) return 'bg-yellow-100';
  return 'bg-red-100';
};

const DiagnosticCard = ({ findings, explanation }) => {
  if (!findings.length) {
    return (
      <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 text-sm">
        <h3 className="font-semibold text-gray-800 mb-2">AI Diagnosis</h3>
        <p className="text-gray-500">No findings detected by AI.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 text-sm">
      <h3 className="font-semibold text-gray-800 mb-2">AI Diagnosis</h3>
      <ul className="space-y-2">
        {findings.map((finding, index) => (
          <li key={index} className={`p-2 rounded-lg border border-gray-100 ${getColorForConfidence(finding.confidence)}`}>
            <div><strong>Location:</strong> {finding.location}</div>
            <div><strong>Confidence:</strong> {(finding.confidence * 100).toFixed(1)}%</div>
            <div><strong>Suggestion:</strong> {finding.suggestion}</div>
          </li>
        ))}
      </ul>
      {explanation && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h4 className="font-semibold text-gray-800">Clinical Explanation</h4>
          <p className="text-gray-700">{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default DiagnosticCard; 