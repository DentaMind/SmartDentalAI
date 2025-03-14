import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Aperture, 
  Camera, 
  AlertCircle, 
  Info, 
  Calendar, 
  ArrowUpCircle, 
  PlusCircle, 
  CheckCircle,
  Scan,
  BadgeAlert,
  FileTerminal
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// X-ray and scan types
const XRAY_TYPES = [
  { value: 'fmx', label: 'FMX (Full Mouth Series)', description: '18 images including all periapical and bitewings' },
  { value: 'pa', label: 'Single PA (Periapical X-ray)', description: 'Focused on a single tooth or small region' },
  { value: 'bitewings', label: 'Bitewings', description: 'Left, Right, and Anterior bitewings for checking interproximal caries' },
  { value: 'upper_right', label: 'Upper Right Molar PA', description: 'Dedicated capture for posterior upper right region' },
  { value: 'lower_left', label: 'Lower Left Molar PA', description: 'Dedicated capture for posterior lower left region' },
  { value: 'panoramic', label: 'Panoramic X-Ray', description: 'Full jaw scan (requires CBCT scanner connection)' }
];

// Intraoral scan types
const SCAN_TYPES = [
  { value: 'full_arch', label: 'Full Arch Scan', description: 'Complete scan of both arches' },
  { value: 'single_arch', label: 'Single Arch Scan', description: 'Upper or lower arch only' },
  { value: 'quadrant', label: 'Quadrant Scan', description: 'Specific quadrant scan' },
  { value: 'single_tooth', label: 'Single Tooth Scan', description: 'Individual tooth for restoration' }
];

interface XRayImage {
  id: string;
  type: string;
  date: Date;
  url: string;
  findings?: string[];
  diagnosisConfidence?: number;
  provider: string;
}

interface IntraoralScan {
  id: string;
  type: string;
  date: Date;
  url: string;
  stlAvailable: boolean;
  provider: string;
}

interface XRayScannerProps {
  patientId: number;
  patientName: string;
  existingXrays?: XRayImage[];
  existingScans?: IntraoralScan[];
  onXrayCaptured?: (data: any) => void;
  onScanCaptured?: (data: any) => void;
  readOnly?: boolean;
}

export function XRayScanner({
  patientId,
  patientName,
  existingXrays = [],
  existingScans = [],
  onXrayCaptured,
  onScanCaptured,
  readOnly = false
}: XRayScannerProps) {
  const [selectedXrayType, setSelectedXrayType] = useState<string>('fmx');
  const [selectedScanType, setSelectedScanType] = useState<string>('full_arch');
  const [captureInProgress, setCaptureInProgress] = useState(false);
  const [legalDisclaimerAccepted, setLegalDisclaimerAccepted] = useState(false);
  const [showLegalDialog, setShowLegalDialog] = useState(false);
  const [captureSuccessful, setCaptureSuccessful] = useState(false);
  const [scanSuccessful, setScanSuccessful] = useState(false);
  const [imageAnalysisComplete, setImageAnalysisComplete] = useState(false);
  
  // For demonstration purposes to simulate a capture
  const simulateCapture = (type: 'xray' | 'scan') => {
    setCaptureInProgress(true);
    
    setTimeout(() => {
      setCaptureInProgress(false);
      if (type === 'xray') {
        setCaptureSuccessful(true);
        setTimeout(() => {
          setImageAnalysisComplete(true);
          
          const newXray = {
            id: `xray-${Date.now()}`,
            type: selectedXrayType,
            date: new Date(),
            url: 'https://example.com/x-ray-image.jpg',
            findings: ['Potential early caries detected on tooth #14', 'Mild bone loss observed in posterior region'],
            diagnosisConfidence: 92,
            provider: 'Dr. Smith'
          };
          
          if (onXrayCaptured) {
            onXrayCaptured(newXray);
          }
        }, 2000);
      } else {
        setScanSuccessful(true);
        setTimeout(() => {
          const newScan = {
            id: `scan-${Date.now()}`,
            type: selectedScanType,
            date: new Date(),
            url: 'https://example.com/intraoral-scan.jpg',
            stlAvailable: true,
            provider: 'Dr. Smith'
          };
          
          if (onScanCaptured) {
            onScanCaptured(newScan);
          }
        }, 1500);
      }
    }, 3000);
  };
  
  const handleXrayCapture = () => {
    if (!legalDisclaimerAccepted) {
      setShowLegalDialog(true);
      return;
    }
    simulateCapture('xray');
  };
  
  const handleScanCapture = () => {
    if (!legalDisclaimerAccepted) {
      setShowLegalDialog(true);
      return;
    }
    simulateCapture('scan');
  };
  
  const acceptLegalDisclaimer = () => {
    setLegalDisclaimerAccepted(true);
    setShowLegalDialog(false);
  };
  
  const resetCapture = () => {
    setCaptureSuccessful(false);
    setScanSuccessful(false);
    setImageAnalysisComplete(false);
  };
  
  // Render x-ray or scan depending on availability
  const renderImageGrid = (images: XRayImage[] | IntraoralScan[], type: 'xray' | 'scan') => {
    if (images.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-muted-foreground">
            {type === 'xray' ? <Aperture className="h-12 w-12" /> : <Scan className="h-12 w-12" />}
          </div>
          <p className="mt-4 text-muted-foreground">
            No {type === 'xray' ? 'X-rays' : 'intraoral scans'} available for this patient.
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {/* This would be a real image in production */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white text-opacity-70">
                {type === 'xray' ? 'X-ray Image Preview' : 'Intraoral Scan Preview'}
              </div>
              {(image as XRayImage).diagnosisConfidence && (
                <Badge className="absolute top-2 right-2 bg-primary" variant="default">
                  {(image as XRayImage).diagnosisConfidence}% AI Confidence
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium">
                    {type === 'xray' 
                      ? XRAY_TYPES.find(t => t.value === image.type)?.label || image.type
                      : SCAN_TYPES.find(t => t.value === image.type)?.label || image.type
                    }
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(image.date).toLocaleDateString()} • {image.provider}
                  </p>
                </div>
                {type === 'scan' && (image as IntraoralScan).stlAvailable && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowUpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>STL File Available for Download</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              {(image as XRayImage).findings && (image as XRayImage).findings!.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-primary">AI Findings:</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    {(image as XRayImage).findings!.map((finding, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <Dialog open={showLegalDialog} onOpenChange={setShowLegalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeAlert className="h-5 w-5 text-amber-500" />
              Legal Disclaimer and Patient Consent
            </DialogTitle>
            <DialogDescription>
              Please confirm that you have received patient consent for this imaging procedure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <Alert variant="destructive" className="bg-amber-50 text-amber-900 border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Liability Notice</AlertTitle>
              <AlertDescription className="mt-2 text-sm">
                By proceeding, you acknowledge that:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>You have explained the imaging procedure to the patient</li>
                  <li>The patient has provided informed consent</li>
                  <li>Appropriate radiation safety measures have been taken</li>
                  <li>AI analysis is supplementary to your professional judgment</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="border border-muted-foreground/20 rounded-md p-3 bg-muted/50">
              <div className="flex items-center gap-2">
                <FileTerminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Legal Protection Statement</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                While DentaMind AI provides analysis assistance, the dental professional is solely responsible 
                for diagnosis and treatment decisions. AI-generated findings are provided as a supportive tool only, 
                and do not replace professional judgment. This disclaimer will be recorded with any captured images.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLegalDialog(false)}>Cancel</Button>
            <Button onClick={acceptLegalDisclaimer}>Accept & Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue="xray">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="xray" className="flex items-center gap-2">
            <Aperture className="h-4 w-4" />
            X-Ray Imaging
          </TabsTrigger>
          <TabsTrigger value="intraoral" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Intraoral Scanner
          </TabsTrigger>
        </TabsList>
        
        {/* X-Ray Tab Content */}
        <TabsContent value="xray" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Aperture className="h-5 w-5 text-primary" />
                X-Ray Capture and Management
              </CardTitle>
              <CardDescription>
                Capture new X-rays or browse existing ones. All images are stored securely and analyzed by AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!captureSuccessful ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="w-full sm:w-64">
                      <Label htmlFor="xray-type" className="text-sm">X-Ray Type</Label>
                      <Select 
                        value={selectedXrayType} 
                        onValueChange={setSelectedXrayType}
                        disabled={captureInProgress || readOnly}
                      >
                        <SelectTrigger id="xray-type" className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {XRAY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {XRAY_TYPES.find(t => t.value === selectedXrayType)?.description}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleXrayCapture} 
                      disabled={captureInProgress || readOnly}
                      className="min-w-32"
                    >
                      {captureInProgress ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                          Capturing...
                        </>
                      ) : (
                        <>
                          <Aperture className="mr-2 h-4 w-4" />
                          Activate X-Ray Sensor
                        </>
                      )}
                    </Button>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            This will activate the X-ray sensor. Position the sensor in the patient's mouth 
                            before clicking this button, then proceed with the exposure.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {captureInProgress && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Sensor Activated</AlertTitle>
                      <AlertDescription>
                        X-ray sensor is ready. Position the device and proceed with the exposure.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-green-50 text-green-900 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>X-Ray Captured Successfully</AlertTitle>
                    <AlertDescription>
                      {imageAnalysisComplete 
                        ? 'X-ray has been analyzed and stored in the patient record.'
                        : 'X-ray image is being processed and analyzed by AI...'}
                    </AlertDescription>
                  </Alert>
                  
                  {imageAnalysisComplete && (
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                      <Button onClick={resetCapture} variant="outline">
                        Capture Another X-Ray
                      </Button>
                      <Button variant="secondary">
                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                        Download X-Ray Image
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Patient X-Ray History</h3>
                <ScrollArea className="max-h-[500px]">
                  {renderImageGrid(existingXrays, 'xray')}
                </ScrollArea>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col bg-muted/50 border-t px-6 py-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Radiation Safety Information</p>
                  <p className="mt-1">One dental X-ray exposes the patient to approximately 0.005 mSv, 
                    equivalent to about 2 hours on an airplane. All necessary precautions, including 
                    lead aprons and thyroid collars, should be used.</p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Intraoral Scanner Tab Content */}
        <TabsContent value="intraoral" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Intraoral Scanner
              </CardTitle>
              <CardDescription>
                Capture detailed 3D scans of the patient's dentition for treatment planning and analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!scanSuccessful ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="w-full sm:w-64">
                      <Label htmlFor="scan-type" className="text-sm">Scan Type</Label>
                      <Select 
                        value={selectedScanType} 
                        onValueChange={setSelectedScanType}
                        disabled={captureInProgress || readOnly}
                      >
                        <SelectTrigger id="scan-type" className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCAN_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {SCAN_TYPES.find(t => t.value === selectedScanType)?.description}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleScanCapture} 
                      disabled={captureInProgress || readOnly}
                      className="min-w-32"
                    >
                      {captureInProgress ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Scan className="mr-2 h-4 w-4" />
                          Activate Scanner
                        </>
                      )}
                    </Button>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            This will activate the intraoral scanner. Prepare the scanner
                            and follow the scanner's guidance for complete capture.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {captureInProgress && (
                    <Alert>
                      <Scan className="h-4 w-4" />
                      <AlertTitle>Scanner Activated</AlertTitle>
                      <AlertDescription>
                        Intraoral scanner is active. Follow on-screen guidance to complete the scan.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-green-50 text-green-900 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Scan Completed Successfully</AlertTitle>
                    <AlertDescription>
                      3D scan has been processed and stored in the patient record.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Button onClick={resetCapture} variant="outline">
                      Capture New Scan
                    </Button>
                    <Button variant="secondary">
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      Download STL File
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Patient Scan History</h3>
                <ScrollArea className="max-h-[500px]">
                  {renderImageGrid(existingScans, 'scan')}
                </ScrollArea>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col bg-muted/50 border-t px-6 py-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Scanner Information</p>
                  <p className="mt-1">The intraoral scanner captures detailed 3D models of the patient's 
                    dentition. These scans can be used for treatment planning, fabrication of restorations, 
                    and monitoring changes over time.</p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}