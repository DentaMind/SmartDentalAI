/**
 * Realtime AI Monitor Component
 * 
 * This component demonstrates the WebSocket integration by displaying
 * real-time AI analysis status updates and system metrics.
 */

import React, { useState, useEffect } from 'react';
import useWebSocket, { useWebSocketMessage } from '../../hooks/useWebSocket';
import { 
  AiAnalysisStatusMessage, 
  SystemStatusMessage,
  isMessageType 
} from '../../types/websocket-contracts';

interface AIAnalysisStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  patientId?: string;
  imageType?: string;
  resultUrl?: string;
  error?: string;
}

interface SystemStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastUpdated: Date;
  details?: string;
  affectedFeatures?: string[];
}

/**
 * AI Monitor component that displays real-time updates on AI processing
 */
export function RealtimeAIMonitor() {
  // State for tracking analyses
  const [analyses, setAnalyses] = useState<Record<string, AIAnalysisStatus>>({});
  const [systemStatuses, setSystemStatuses] = useState<Record<string, SystemStatus>>({});
  
  // Use the WebSocket hook
  const { 
    status, 
    sendMessage, 
    connect, 
    disconnect, 
    isConnected 
  } = useWebSocket({
    autoConnect: true,
    debug: true,
    onOpen: () => {
      console.log('Connected to AI monitoring service');
      // Subscribe to AI analysis updates
      sendMessage({
        type: 'subscribe_ai_analysis',
        analysis_ids: ['all'] as any // Special value to subscribe to all analyses
      });
    }
  });
  
  // Handle AI analysis status messages
  useWebSocketMessage('ai_analysis_status', (message: AiAnalysisStatusMessage) => {
    setAnalyses(prev => {
      // Create or update the analysis entry
      return {
        ...prev,
        [message.analysis_id]: {
          id: message.analysis_id,
          status: message.status,
          progress: message.progress || 0,
          startTime: prev[message.analysis_id]?.startTime || new Date(),
          patientId: message.patient_id,
          imageType: message.image_type,
          resultUrl: message.result_url,
          error: message.error
        }
      };
    });
  });
  
  // Handle system status messages
  useWebSocketMessage('system_status', (message: SystemStatusMessage) => {
    setSystemStatuses(prev => {
      return {
        ...prev,
        [message.service]: {
          service: message.service,
          status: message.status,
          lastUpdated: new Date(),
          details: message.details,
          affectedFeatures: message.affected_features
        }
      };
    });
  });
  
  // Filter completed and failed analyses older than 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      setAnalyses(prev => {
        const newAnalyses = { ...prev };
        
        // Remove old completed or failed analyses
        Object.entries(prev).forEach(([id, analysis]) => {
          if (
            (analysis.status === 'completed' || analysis.status === 'failed') &&
            analysis.startTime < fiveMinutesAgo
          ) {
            delete newAnalyses[id];
          }
        });
        
        return newAnalyses;
      });
    }, 60 * 1000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Count analyses by status
  const analysisStats = Object.values(analyses).reduce(
    (acc, analysis) => {
      acc[analysis.status]++;
      return acc;
    },
    { queued: 0, processing: 0, completed: 0, failed: 0 }
  );
  
  // Manually reconnect if disconnected
  const handleReconnect = () => {
    connect();
  };
  
  // Get the overall system status
  const overallSystemStatus = Object.values(systemStatuses).some(s => s.status === 'down')
    ? 'down'
    : Object.values(systemStatuses).some(s => s.status === 'degraded')
      ? 'degraded'
      : 'healthy';
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Realtime AI Monitoring Dashboard</h1>
      
      {/* Connection status */}
      <div className="mb-6 p-4 rounded-md bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-semibold">
              {status === 'connecting' ? 'Connecting...' : 
                status === 'open' ? 'Connected' : 
                status === 'error' ? 'Connection Error' : 
                'Disconnected'}
            </span>
          </div>
          
          {!isConnected && (
            <button 
              onClick={handleReconnect}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
      
      {/* System status section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="border rounded-md shadow-sm">
          <div className="border-b px-4 py-2 font-semibold bg-gray-50">
            System Status
          </div>
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className={`w-4 h-4 rounded-full mr-2 ${
                overallSystemStatus === 'healthy' ? 'bg-green-500' : 
                overallSystemStatus === 'degraded' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></div>
              <span className="font-medium">
                {overallSystemStatus === 'healthy' ? 'All Systems Operational' : 
                overallSystemStatus === 'degraded' ? 'Degraded Performance' : 
                'System Outage'}
              </span>
            </div>
            
            <div className="space-y-2">
              {Object.values(systemStatuses).length === 0 ? (
                <p className="text-gray-500 italic">No system status data available</p>
              ) : (
                Object.values(systemStatuses).map(service => (
                  <div key={service.service} className="flex justify-between items-center">
                    <span className="font-medium">{service.service}</span>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        service.status === 'healthy' ? 'bg-green-500' : 
                        service.status === 'degraded' ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}></div>
                      <span className="text-sm">
                        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Analysis summary */}
        <div className="border rounded-md shadow-sm">
          <div className="border-b px-4 py-2 font-semibold bg-gray-50">
            Analysis Summary
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-2 bg-indigo-50 rounded">
                <div className="text-lg font-semibold">{analysisStats.queued}</div>
                <div className="text-xs text-gray-600">Queued</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="text-lg font-semibold">{analysisStats.processing}</div>
                <div className="text-xs text-gray-600">Processing</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-semibold">{analysisStats.completed}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="text-lg font-semibold">{analysisStats.failed}</div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* List of active analyses */}
      <div className="border rounded-md shadow-sm">
        <div className="border-b px-4 py-2 font-semibold bg-gray-50">
          Active Analyses
        </div>
        <div className="overflow-hidden">
          {Object.values(analyses).length === 0 ? (
            <div className="p-4 text-gray-500 italic">No active analyses</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.values(analyses)
                    .sort((a, b) => {
                      // Sort by status (processing first, then queued, then completed, then failed)
                      const statusOrder = { processing: 0, queued: 1, completed: 2, failed: 3 };
                      return (
                        statusOrder[a.status] - statusOrder[b.status] ||
                        // Then by start time (newest first)
                        b.startTime.getTime() - a.startTime.getTime()
                      );
                    })
                    .map(analysis => (
                      <tr key={analysis.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {analysis.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                            analysis.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            analysis.status === 'queued' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {analysis.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="relative w-full h-2 bg-gray-200 rounded">
                            <div 
                              className={`absolute top-0 left-0 h-2 rounded ${
                                analysis.status === 'completed' ? 'bg-green-500' :
                                analysis.status === 'failed' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${analysis.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-center mt-1">
                            {analysis.progress}%
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {analysis.patientId ? analysis.patientId.substring(0, 8) : 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {analysis.imageType || 'Unknown'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {analysis.startTime.toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions and testing */}
      <div className="mt-6 border rounded-md shadow-sm">
        <div className="border-b px-4 py-2 font-semibold bg-gray-50">
          Test Actions
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                // Simulate a ping message
                sendMessage({
                  type: 'ping',
                  client_timestamp: new Date().toISOString()
                });
              }}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Ping Server
            </button>
            
            <button
              onClick={() => disconnect()}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Disconnect
            </button>
            
            <button
              onClick={() => {
                // Request fresh system status
                sendMessage({
                  type: 'request_system_status'
                } as any);
              }}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealtimeAIMonitor; 