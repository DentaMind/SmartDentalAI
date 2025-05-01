import React, { useState, useEffect, useRef } from 'react';
import { ImagingAPI } from '../../lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Slider,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/components';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  Maximize, 
  Download, 
  Info, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface EnhancedXrayViewerProps {
  imageId: string;
  patientId?: string;
  showControls?: boolean;
  showDiagnosis?: boolean;
  onDiagnosisClick?: (diagnosisId: string) => void;
}

interface ImageData {
  id: string;
  patient_id: string;
  filename: string;
  path: string;
  image_type: string;
  upload_time: string;
  notes?: string;
}

interface DiagnosisData {
  id: string;
  patient_id: string;
  image_id: string;
  timestamp: string;
  findings: {
    caries?: Array<{
      tooth: string;
      surface: string;
      severity: string;
      confidence?: number;
    }>;
    periapical_lesions?: Array<{
      tooth: string;
      size_mm: number;
      confidence?: number;
    }>;
    restorations?: Array<{
      tooth: string;
      surfaces: string;
      type: string;
      condition: string;
    }>;
    missing_teeth?: string[];
  };
  summary: string;
}

export const EnhancedXrayViewer: React.FC<EnhancedXrayViewerProps> = ({
  imageId,
  patientId,
  showControls = true,
  showDiagnosis = true,
  onDiagnosisClick
}) => {
  // State for image and diagnosis data
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Image manipulation state
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeTooth, setActiveTooth] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('original');
  
  // Canvas reference for drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Fetch image and diagnosis data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch image data
        const image = await ImagingAPI.getImage(imageId);
        setImageData(image);
        
        // Fetch diagnosis data
        try {
          const diagnosis = await ImagingAPI.getImageDiagnosis(imageId);
          setDiagnosisData(diagnosis);
        } catch (diagErr) {
          console.warn('No diagnosis available for this image');
          // Not setting an error since diagnosis is optional
        }
      } catch (err) {
        console.error('Error fetching image data:', err);
        setError('Failed to load image. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [imageId]);
  
  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };
  
  // Handle rotation clockwise
  const handleRotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360);
  };
  
  // Handle rotation counter-clockwise
  const handleRotateCounterClockwise = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };
  
  // Handle reset transformations
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };
  
  // Handle download image
  const handleDownload = () => {
    if (!imageData) return;
    
    // In a real app, this would trigger a download of the actual image file
    const link = document.createElement('a');
    link.download = imageData.filename;
    link.href = imageData.path; // This would be a valid URL in a real app
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle full-screen view
  const handleFullScreen = () => {
    const image = imageRef.current;
    if (!image) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      image.requestFullscreen();
    }
  };
  
  // Handle tooth click
  const handleToothClick = (toothNumber: string) => {
    setActiveTooth(prev => prev === toothNumber ? null : toothNumber);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading image...</p>
        </div>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }
  
  // If no image data, show empty state
  if (!imageData) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <Info className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="mt-4 text-gray-600">No image data available</p>
        </div>
      </Card>
    );
  }
  
  // Get the severity color for caries findings
  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'severe': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'incipient': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{imageData.image_type.toUpperCase()} Image</CardTitle>
            <CardDescription>
              Uploaded on {new Date(imageData.upload_time).toLocaleDateString()}
            </CardDescription>
          </div>
          {showControls && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Download Image"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFullScreen}
                title="Fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="original">Original</TabsTrigger>
            <TabsTrigger value="annotated">AI Annotated</TabsTrigger>
            {diagnosisData?.findings?.caries && diagnosisData.findings.caries.length > 0 && (
              <TabsTrigger value="caries">Caries ({diagnosisData.findings.caries.length})</TabsTrigger>
            )}
            {diagnosisData?.findings?.periapical_lesions && diagnosisData.findings.periapical_lesions.length > 0 && (
              <TabsTrigger value="lesions">Lesions ({diagnosisData.findings.periapical_lesions.length})</TabsTrigger>
            )}
          </TabsList>
          
          <div className="relative">
            <div 
              className="relative overflow-hidden border rounded-lg"
              style={{
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                ref={imageRef}
                src={`/sample-xrays/sample_molar.jpg`} // In a real app, this would use the actual image path
                alt={imageData.filename}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                className="pointer-events-none"
              />
              
              {activeTab === 'annotated' && diagnosisData && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* In a real app, this would display AI annotations on top of the image */}
                  {/* Placeholder for illustration */}
                  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {diagnosisData.findings.caries?.map((caries, index) => (
                      <circle
                        key={`caries-${index}`}
                        cx="50%"
                        cy="50%"
                        r="20"
                        fill="rgba(255, 0, 0, 0.3)"
                        stroke="red"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>
              )}
            </div>
            
            {showControls && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-white bg-opacity-75 backdrop-blur-sm p-2 rounded-full shadow">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <div className="w-24">
                  <Slider
                    value={[zoom]}
                    min={50}
                    max={200}
                    step={5}
                    onValueChange={(value) => setZoom(value[0])}
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-gray-300" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateCounterClockwise}
                  title="Rotate Counter-Clockwise"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateClockwise}
                  title="Rotate Clockwise"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-gray-300" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  title="Reset"
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
      
      {showDiagnosis && diagnosisData && (
        <CardFooter className="flex flex-col items-start">
          <div className="w-full">
            <h3 className="text-lg font-medium mb-2">AI Diagnosis</h3>
            <p className="text-gray-700 mb-4">{diagnosisData.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {diagnosisData.findings.caries && diagnosisData.findings.caries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-500">Caries Detected</h4>
                  <div className="space-y-1">
                    {diagnosisData.findings.caries.map((caries, index) => (
                      <div 
                        key={`caries-${index}`}
                        className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleToothClick(caries.tooth)}
                      >
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <span>Tooth #{caries.tooth} ({caries.surface})</span>
                        </div>
                        <Badge className={getSeverityColor(caries.severity)}>
                          {caries.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {diagnosisData.findings.periapical_lesions && diagnosisData.findings.periapical_lesions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-500">Periapical Lesions</h4>
                  <div className="space-y-1">
                    {diagnosisData.findings.periapical_lesions.map((lesion, index) => (
                      <div 
                        key={`lesion-${index}`}
                        className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleToothClick(lesion.tooth)}
                      >
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                          <span>Tooth #{lesion.tooth}</span>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">
                          {lesion.size_mm} mm
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {diagnosisData.findings.restorations && diagnosisData.findings.restorations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-500">Existing Restorations</h4>
                  <div className="space-y-1">
                    {diagnosisData.findings.restorations.map((restoration, index) => (
                      <div 
                        key={`restoration-${index}`}
                        className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleToothClick(restoration.tooth)}
                      >
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                          <span>Tooth #{restoration.tooth} ({restoration.surfaces})</span>
                        </div>
                        <div className="flex items-center">
                          <Badge className="bg-blue-100 text-blue-800 mr-1">
                            {restoration.type}
                          </Badge>
                          <Badge className={
                            restoration.condition === 'good' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }>
                            {restoration.condition}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Analyzed on {new Date(diagnosisData.timestamp).toLocaleString()}
              </div>
              
              {onDiagnosisClick && (
                <Button 
                  variant="link" 
                  onClick={() => onDiagnosisClick(diagnosisData.id)}
                >
                  View detailed report
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}; 