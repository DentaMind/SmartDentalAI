import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FMXLayout, { XRaySlot } from '@/components/xray/fmx-layout';
import XRayAIAnalyzer from '@/components/xray/xray-ai-analyzer';
import { XRayComparison } from '@/components/xray/xray-comparison';
import { Patient } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Brain, ChevronLeft, History, FileSearch, Grid3X3 } from 'lucide-react';

interface XRayFMXPageProps {}

const XRayFMXPage: React.FC<XRayFMXPageProps> = () => {
  const { patientId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedXRay, setSelectedXRay] = useState<XRaySlot | null>(null);
  const [selectedForAI, setSelectedForAI] = useState<XRaySlot | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<{
    beforeXRay: XRaySlot;
    afterXRay: XRaySlot;
  } | null>(null);
  const [activeTab, setActiveTab] = useState('fmx');

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['/api/patients', patientId],
    enabled: !!patientId
  });

  // Fetch patient X-rays
  const { data: xrays = [], isLoading: xraysLoading } = useQuery<XRaySlot[]>({
    queryKey: ['/api/patients', patientId, 'xrays'],
    enabled: !!patientId
  });

  // Mutation for updating X-ray data (after AI analysis)
  const updateXRayMutation = useMutation({
    mutationFn: async (data: { xrayId: string, findings: any }) => {
      return apiRequest({
        url: `/api/xrays/${data.xrayId}`,
        method: 'PATCH',
        body: {
          aiAnalyzed: true,
          aiFindings: data.findings
        }
      });
    },
    onSuccess: () => {
      // Invalidate and refetch X-rays query
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'xrays'] });
      
      toast({
        title: "X-ray updated",
        description: "AI analysis results have been saved to the patient record.",
      });
    }
  });

  // Handle selecting an X-ray
  const handleXRaySelected = (xray: XRaySlot) => {
    setSelectedXRay(xray);
  };

  // Handle AI analysis completion
  const handleAnalysisCompleted = (xrayId: string, findings: any) => {
    // In a real implementation, we would send the findings to the server
    updateXRayMutation.mutate({
      xrayId,
      findings: findings.detections.map((d: any) => d.description)
    });
  };

  // Handle comparison selection
  const handleCompareXRays = (before: XRaySlot, after: XRaySlot) => {
    setSelectedForComparison({
      beforeXRay: before,
      afterXRay: after
    });
  };

  // If we have no patient ID, show a message
  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No Patient Selected</h2>
          <p className="text-muted-foreground">Please select a patient to view their X-rays.</p>
          <Button variant="default" className="mt-4">
            View Patients
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (patientLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  // Function to simulate test X-ray data
  // In a real implementation, this would come from the API
  const getTestXRayData = (): XRaySlot[] => {
    return [
      {
        id: '1',
        position: 'MAX-RM',
        region: 'posterior',
        arch: 'maxillary',
        side: 'right',
        teeth: [1, 2, 3],
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/dentalmind-images.appspot.com/o/samples%2Fxray-molar-1.jpg?alt=media',
        date: '2025-02-15',
        aiAnalyzed: true,
        aiFindings: ['Moderate distal caries on tooth #2', 'Adequate restoration margins on tooth #3']
      },
      {
        id: '2',
        position: 'MAX-LC',
        region: 'anterior',
        arch: 'maxillary',
        side: 'left',
        teeth: [9, 10, 11],
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/dentalmind-images.appspot.com/o/samples%2Fxray-anterior-1.jpg?alt=media',
        date: '2025-02-15'
      },
      {
        id: '3',
        position: 'BW-R',
        region: 'bitewing',
        arch: 'both',
        side: 'right',
        teeth: [2, 3, 4, 5, 18, 19, 20, 21],
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/dentalmind-images.appspot.com/o/samples%2Fxray-bitewing-1.jpg?alt=media',
        date: '2025-03-01'
      },
      {
        id: '4',
        position: 'BW-L',
        region: 'bitewing',
        arch: 'both',
        side: 'left',
        teeth: [12, 13, 14, 15, 28, 29, 30, 31],
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/dentalmind-images.appspot.com/o/samples%2Fxray-bitewing-2.jpg?alt=media',
        date: '2025-03-01',
        aiAnalyzed: true,
        aiFindings: ['Interproximal caries between #14 and #15', 'Moderate bone loss in posterior region']
      },
      {
        id: '5',
        position: 'MAND-RM',
        region: 'posterior',
        arch: 'mandibular',
        side: 'right',
        teeth: [17, 18, 19],
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/dentalmind-images.appspot.com/o/samples%2Fxray-molar-2.jpg?alt=media',
        date: '2025-02-15'
      },
      // Previous X-rays (older dates)
      {
        id: '6',
        position: 'BW-R',
        region: 'bitewing',
        arch: 'both',
        side: 'right',
        teeth: [2, 3, 4, 5, 18, 19, 20, 21],
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/dentalmind-images.appspot.com/o/samples%2Fxray-bitewing-3.jpg?alt=media',
        date: '2024-09-10'
      }
    ];
  };

  // Use real data if available, otherwise use test data
  const patientXRays = xrays.length > 0 ? xrays : getTestXRayData();
  
  // Extract patient name, checking for the correct type
  const patientName = patient ? 
    `${(patient as Patient).firstName || ''} ${(patient as Patient).lastName || ''}`.trim() || "Patient" : 
    "Patient";

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" className="mr-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{patientName}'s Dental X-rays</h1>
          <p className="text-sm text-muted-foreground">
            Manage and analyze dental radiographs
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="fmx" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            FMX Layout
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            X-ray History
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <FileSearch className="h-4 w-4" />
            Search by Tooth
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fmx" className="pt-2">
          <FMXLayout
            patientId={patientId}
            patientName={patientName}
            xrays={patientXRays}
            onXRaySelected={handleXRaySelected}
            onAIAnalysis={(xrayId) => {
              const xray = patientXRays.find(x => x.id === xrayId);
              if (xray) {
                setSelectedForAI(xray);
              }
            }}
            lastUpdated={patientXRays.length > 0 ? 
              new Date(Math.max(...patientXRays.map(x => new Date(x.date || '').getTime()))).toISOString() : 
              undefined
            }
          />
        </TabsContent>
        
        <TabsContent value="analysis" className="pt-2">
          <div className="grid grid-cols-2 gap-4">
            {patientXRays
              .filter(x => x.aiAnalyzed)
              .map(xray => (
                <div 
                  key={xray.id}
                  className="border rounded-md overflow-hidden hover:border-primary cursor-pointer transition-colors"
                  onClick={() => handleXRaySelected(xray)}
                >
                  <div className="h-48 bg-black relative">
                    <img 
                      src={xray.imageUrl} 
                      alt={`${xray.position} X-ray`} 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-6 w-6 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForAI(xray);
                        }}
                      >
                        <Brain className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">{xray.position}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(xray.date || '').toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(xray.aiFindings || []).length > 0 ? (
                        <ul className="space-y-0.5">
                          {xray.aiFindings!.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No AI findings available</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {patientXRays.filter(x => x.aiAnalyzed).length === 0 && (
              <div className="col-span-2 p-6 text-center text-muted-foreground">
                No X-rays have been analyzed with AI yet. 
                Select an X-ray and click the AI analysis button to get started.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="pt-2">
          <div className="space-y-4">
            {/* Group X-rays by date */}
            {Array.from(
              new Set(patientXRays.map(x => x.date))
            ).sort((a, b) => new Date(b || '').getTime() - new Date(a || '').getTime())
              .map(date => (
                <div key={date} className="border rounded-md overflow-hidden">
                  <div className="bg-muted/50 p-3 font-medium">
                    {new Date(date || '').toLocaleDateString()}
                  </div>
                  <div className="p-3 grid grid-cols-4 gap-3">
                    {patientXRays.filter(x => x.date === date).map(xray => (
                      <div 
                        key={xray.id}
                        className="border rounded-md overflow-hidden hover:border-primary cursor-pointer transition-colors"
                        onClick={() => handleXRaySelected(xray)}
                      >
                        <div className="h-32 bg-black relative">
                          <img 
                            src={xray.imageUrl} 
                            alt={`${xray.position} X-ray`} 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute top-2 right-2">
                            {xray.aiAnalyzed && (
                              <div className="bg-primary/90 text-white rounded-full p-1 h-5 w-5 flex items-center justify-center">
                                <Brain className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-2">
                          <div className="text-sm font-medium">{xray.position}</div>
                          <div className="text-xs text-muted-foreground">
                            Teeth: {xray.teeth.map(t => `#${t}`).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        </TabsContent>
        
        <TabsContent value="search" className="pt-2">
          <div className="space-y-4">
            <div className="grid grid-cols-8 gap-2">
              {/* Interactive tooth selector */}
              {Array.from({ length: 32 }, (_, i) => i + 1).map(toothNumber => (
                <Button 
                  key={toothNumber}
                  variant="outline"
                  className="h-12 text-sm"
                  onClick={() => setActiveTab('fmx')}
                >
                  #{toothNumber}
                </Button>
              ))}
            </div>
            
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-medium mb-4">Compare X-rays</h3>
              
              {/* Show pairs of X-rays that can be compared */}
              {patientXRays.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {patientXRays
                    .filter(x1 => 
                      patientXRays.some(x2 => 
                        x1.id !== x2.id && 
                        x1.position === x2.position && 
                        new Date(x1.date || '') < new Date(x2.date || '')
                      )
                    )
                    .map(beforeXRay => {
                      const afterXRay = patientXRays.find(x => 
                        x.id !== beforeXRay.id && 
                        x.position === beforeXRay.position && 
                        new Date(x.date || '') > new Date(beforeXRay.date || '')
                      );
                      
                      if (!afterXRay) return null;
                      
                      return (
                        <div key={`${beforeXRay.id}-${afterXRay.id}`} className="border rounded-md overflow-hidden">
                          <div className="p-3 bg-muted/50 font-medium">
                            {beforeXRay.position} Comparison
                          </div>
                          <div className="grid grid-cols-2 gap-2 p-3">
                            <div>
                              <div className="h-32 bg-black">
                                <img 
                                  src={beforeXRay.imageUrl} 
                                  alt={`Before X-ray`} 
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="text-xs text-center text-muted-foreground mt-1">
                                {new Date(beforeXRay.date || '').toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <div className="h-32 bg-black">
                                <img 
                                  src={afterXRay.imageUrl} 
                                  alt={`After X-ray`} 
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="text-xs text-center text-muted-foreground mt-1">
                                {new Date(afterXRay.date || '').toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end p-3 pt-0">
                            <Button 
                              size="sm" 
                              onClick={() => handleCompareXRays(beforeXRay, afterXRay)}
                            >
                              Compare
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
              
              {patientXRays.filter(x1 => 
                patientXRays.some(x2 => 
                  x1.id !== x2.id && 
                  x1.position === x2.position
                )
              ).length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  No comparable X-rays found. You need at least two X-rays of the same position taken at different times.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* X-ray Viewer Dialog */}
      {selectedXRay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedXRay.position} X-ray</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedXRay(null)}>
                &times;
              </Button>
            </div>
            
            <div className="bg-black rounded-md overflow-hidden mb-4">
              <img 
                src={selectedXRay.imageUrl} 
                alt={`${selectedXRay.position} X-ray`} 
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Date: {new Date(selectedXRay.date || '').toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Teeth: {selectedXRay.teeth.map(t => `#${t}`).join(', ')}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!selectedXRay.aiAnalyzed && (
                    <Button onClick={() => {
                      setSelectedXRay(null);
                      setSelectedForAI(selectedXRay);
                    }}>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedXRay(null)}>
                    Close
                  </Button>
                </div>
              </div>
              
              {selectedXRay.aiAnalyzed && selectedXRay.aiFindings && (
                <div className="border rounded-md p-3 bg-muted/30">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    AI Analysis Results
                  </h3>
                  <ul className="space-y-1">
                    {selectedXRay.aiFindings.map((finding, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Dialog */}
      {selectedForAI && (
        <XRayAIAnalyzer
          xray={selectedForAI}
          patientId={patientId}
          previousXRays={patientXRays.filter(x => 
            x.id !== selectedForAI.id && 
            x.position === selectedForAI.position &&
            new Date(x.date || '') < new Date(selectedForAI.date || '')
          )}
          analysisCompleted={handleAnalysisCompleted}
          onClose={() => setSelectedForAI(null)}
        />
      )}

      {/* X-ray Comparison Dialog */}
      {selectedForComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedForComparison.beforeXRay.position} Comparison</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedForComparison(null)}>
                &times;
              </Button>
            </div>
            
            <XRayComparison
              beforeXray={{
                id: selectedForComparison.beforeXRay.id,
                imageUrl: selectedForComparison.beforeXRay.imageUrl!,
                type: selectedForComparison.beforeXRay.position,
                date: selectedForComparison.beforeXRay.date!,
                provider: 'Dr. Smith',
                aiAnalyzed: selectedForComparison.beforeXRay.aiAnalyzed || false,
                aiFindings: selectedForComparison.beforeXRay.aiFindings || []
              }}
              afterXray={{
                id: selectedForComparison.afterXRay.id,
                imageUrl: selectedForComparison.afterXRay.imageUrl!,
                type: selectedForComparison.afterXRay.position,
                date: selectedForComparison.afterXRay.date!,
                provider: 'Dr. Smith',
                aiAnalyzed: selectedForComparison.afterXRay.aiAnalyzed || false,
                aiFindings: selectedForComparison.afterXRay.aiFindings || []
              }}
              patientName={patientName}
              onClose={() => setSelectedForComparison(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default XRayFMXPage;