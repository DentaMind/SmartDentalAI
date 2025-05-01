import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CalendarClock, ZoomIn, ZoomOut, RefreshCw, Download, FileText, AlertTriangle } from 'lucide-react';

interface Finding {
  type: string;
  tooth?: string;
  surface?: string;
  severity?: string;
  confidence?: number;
  size_mm?: number;
  condition?: string;
}

interface XrayDiagnosis {
  id: string;
  timestamp: string;
  findings: {
    caries?: Finding[];
    periapical_lesions?: Finding[];
    restorations?: Finding[];
    missing_teeth?: string[];
  };
  summary: string;
}

interface XrayViewerProps {
  imageUrl: string;
  imageType: string;
  uploadTime: string;
  patientName: string;
  diagnosis?: XrayDiagnosis;
  onRunAnalysis?: () => void;
  onDownload?: () => void;
  onViewReport?: () => void;
}

export const XrayViewer: React.FC<XrayViewerProps> = ({
  imageUrl,
  imageType,
  uploadTime,
  patientName,
  diagnosis,
  onRunAnalysis,
  onDownload,
  onViewReport,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState('image');

  // Format upload date
  const formatDate = (date: string): string => {
    const uploadDate = new Date(date);
    return uploadDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format image type for display
  const formatImageType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'panoramic': 'Panoramic X-ray',
      'fmx': 'Full Mouth X-ray Series',
      'cbct': 'Cone Beam CT',
      'bitewing': 'Bitewing X-ray',
      'periapical': 'Periapical X-ray'
    };
    
    return typeMap[type.toLowerCase()] || type;
  };

  // Calculate total findings count
  const getTotalFindingsCount = (): number => {
    if (!diagnosis?.findings) return 0;
    
    const { caries = [], periapical_lesions = [], restorations = [], missing_teeth = [] } = diagnosis.findings;
    return caries.length + periapical_lesions.length + restorations.length + missing_teeth.length;
  };

  // Helper for severity color
  const getSeverityColor = (severity?: string): string => {
    if (!severity) return 'bg-gray-100 text-gray-800';
    
    const severityMap: Record<string, string> = {
      'incipient': 'bg-yellow-100 text-yellow-800',
      'mild': 'bg-yellow-100 text-yellow-800',
      'moderate': 'bg-orange-100 text-orange-800',
      'severe': 'bg-red-100 text-red-800',
      'good': 'bg-green-100 text-green-800',
      'marginal leakage': 'bg-orange-100 text-orange-800',
      'fractured': 'bg-red-100 text-red-800'
    };
    
    return severityMap[severity.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-bold">{formatImageType(imageType)}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <CalendarClock size={14} />
              <span>Uploaded: {formatDate(uploadTime)}</span>
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}>
              <ZoomOut size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}>
              <ZoomIn size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="image" className="flex-1">Image</TabsTrigger>
            <TabsTrigger 
              value="findings" 
              className="flex-1"
              disabled={!diagnosis}
            >
              Findings
              {diagnosis && (
                <Badge variant="secondary" className="ml-2">
                  {getTotalFindingsCount()}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex-1" disabled={!diagnosis}>Summary</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          <TabsContent value="image" className="mt-0">
            <div className="overflow-hidden bg-black rounded-md">
              <div
                className="flex items-center justify-center transition-transform"
                style={{
                  transform: `scale(${zoomLevel})`,
                  height: '400px',
                }}
              >
                <img
                  src={imageUrl}
                  alt={`${imageType} for ${patientName}`}
                  className="max-h-full object-contain"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="findings" className="mt-0">
            {!diagnosis ? (
              <div className="h-64 flex flex-col items-center justify-center text-center gap-4">
                <AlertTriangle size={32} className="text-amber-500" />
                <div>
                  <p className="text-lg font-semibold">No Analysis Available</p>
                  <p className="text-sm text-muted-foreground">Run an analysis to see AI-powered findings.</p>
                </div>
                <Button onClick={onRunAnalysis}>
                  <RefreshCw size={16} className="mr-2" />
                  Run Analysis
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
                {/* Caries findings */}
                {diagnosis.findings.caries && diagnosis.findings.caries.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Caries Detected</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {diagnosis.findings.caries.map((caries, index) => (
                        <div key={index} className="border rounded p-2 text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">Tooth #{caries.tooth}</span>
                            <Badge variant="outline" className={getSeverityColor(caries.severity)}>
                              {caries.severity}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Surface: {caries.surface}
                            {caries.confidence && ` • Confidence: ${Math.round(caries.confidence * 100)}%`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Periapical lesions */}
                {diagnosis.findings.periapical_lesions && diagnosis.findings.periapical_lesions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Periapical Lesions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {diagnosis.findings.periapical_lesions.map((lesion, index) => (
                        <div key={index} className="border rounded p-2 text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">Tooth #{lesion.tooth}</span>
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              {lesion.size_mm}mm
                            </Badge>
                          </div>
                          {lesion.confidence && (
                            <div className="text-xs text-muted-foreground">
                              Confidence: {Math.round(lesion.confidence * 100)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restorations */}
                {diagnosis.findings.restorations && diagnosis.findings.restorations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Existing Restorations</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {diagnosis.findings.restorations.map((restoration, index) => (
                        <div key={index} className="border rounded p-2 text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">Tooth #{restoration.tooth}</span>
                            <Badge variant="outline" className={getSeverityColor(restoration.condition)}>
                              {restoration.condition}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Type: {restoration.type} • Surface: {restoration.surface}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing teeth */}
                {diagnosis.findings.missing_teeth && diagnosis.findings.missing_teeth.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Missing Teeth</h3>
                    <div className="flex flex-wrap gap-2">
                      {diagnosis.findings.missing_teeth.map((tooth, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-100">
                          Tooth #{tooth}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* No findings case */}
                {getTotalFindingsCount() === 0 && (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">No findings detected in this image.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="summary" className="mt-0">
            {!diagnosis ? (
              <div className="h-64 flex flex-col items-center justify-center text-center gap-4">
                <AlertTriangle size={32} className="text-amber-500" />
                <div>
                  <p className="text-lg font-semibold">No Analysis Available</p>
                  <p className="text-sm text-muted-foreground">Run an analysis to generate a clinical summary.</p>
                </div>
                <Button onClick={onRunAnalysis}>
                  <RefreshCw size={16} className="mr-2" />
                  Run Analysis
                </Button>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-md h-[400px] overflow-y-auto">
                <h3 className="text-sm font-semibold mb-3">Clinical Summary</h3>
                <p className="whitespace-pre-line">{diagnosis.summary}</p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        {!diagnosis ? (
          <Button onClick={onRunAnalysis} className="flex-1">
            <RefreshCw size={16} className="mr-2" />
            Analyze Image
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onDownload}>
              <Download size={16} className="mr-2" />
              Download
            </Button>
            <Button variant="default" onClick={onViewReport}>
              <FileText size={16} className="mr-2" />
              View Full Report
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}; 