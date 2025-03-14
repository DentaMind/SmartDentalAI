import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Image as ImageIcon,
  Upload,
  FileText,
  Calendar as CalendarIcon,
  Info,
  Trash2,
  RotateCw,
  Maximize,
  ZoomIn,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Camera,
  Save,
  FileDigit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LegalDisclaimer } from '../treatments/legal-disclaimer';

interface XRayDocument {
  id: string;
  filename: string;
  type: 'xray' | 'scan';
  captureDate: Date;
  imageUrl: string;
  description?: string;
  capturedBy?: string;
  tags?: string[];
  aiAnalysis?: {
    completed: boolean;
    findings?: string[];
    recommendations?: string[];
  };
  lastAccessed?: Date;
}

interface XRayScannerProps {
  patientId: number;
  patientName: string;
  doctorName: string;
  providerId: number;
  onSaveXRay?: (xrayData: Omit<XRayDocument, 'id'>) => Promise<void>;
  onViewXRay?: (id: string) => void;
  existingXRays?: XRayDocument[];
  existingScans?: XRayDocument[];
}

export function XRayScanner({
  patientId,
  patientName,
  doctorName,
  providerId,
  onSaveXRay,
  onViewXRay,
  existingXRays = [],
  existingScans = []
}: XRayScannerProps) {
  const [activeTab, setActiveTab] = useState<'xray' | 'scan'>('xray');
  const [uploading, setUploading] = useState(false);
  const [captureDate, setCaptureDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // View settings
  const [viewSettings, setViewSettings] = useState({
    zoom: 1,
    rotation: 0,
    showMeasurements: true,
    showAnnotations: true,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview URL for the image
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    setUploading(true);
    
    try {
      // In a real implementation, you would upload the file to your server
      // and then save the metadata
      const imageUrl = previewUrl || ''; // This would come from your upload response
      
      const newXRayData: Omit<XRayDocument, 'id'> = {
        filename: selectedFile.name,
        type: activeTab,
        captureDate,
        imageUrl,
        description,
        capturedBy: doctorName,
        tags: [],
        aiAnalysis: {
          completed: false
        },
        lastAccessed: new Date()
      };
      
      if (onSaveXRay) {
        await onSaveXRay(newXRayData);
      }
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      setCaptureDate(new Date());
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };
  
  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
  };
  
  const sortedByDate = (docs: XRayDocument[]) => {
    return [...docs].sort((a, b) => b.captureDate.getTime() - a.captureDate.getTime());
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab === 'xray' ? (
              <FileDigit className="h-5 w-5" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            {activeTab === 'xray' ? 'X-Ray Library' : 'Intraoral Scanner'} 
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            Patient: {patientName}
          </div>
        </CardTitle>
        <CardDescription>
          {activeTab === 'xray' 
            ? 'View, organize, and analyze patient X-rays with timestamps for accurate tracking'
            : 'Access and analyze intraoral scans with timestamp tracking capability'}
        </CardDescription>
        <Tabs defaultValue="xray" onValueChange={(value) => setActiveTab(value as 'xray' | 'scan')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="xray">X-Rays</TabsTrigger>
            <TabsTrigger value="scan">Intraoral Scans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="xray" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">X-Ray Upload</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload X-Ray
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted p-2 flex justify-between items-center">
                      <div className="text-sm font-medium">Preview</div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" 
                          onClick={() => setViewSettings({...viewSettings, zoom: viewSettings.zoom + 0.1})}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => setViewSettings({...viewSettings, rotation: viewSettings.rotation + 90})}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative bg-black flex items-center justify-center h-[300px]">
                      <img 
                        src={previewUrl} 
                        alt="X-Ray Preview" 
                        className="max-h-full max-w-full object-contain"
                        style={{
                          transform: `scale(${viewSettings.zoom}) rotate(${viewSettings.rotation}deg)`,
                          transition: 'transform 0.2s ease'
                        }}
                      />
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="capture-date">Capture Date</Label>
                        <div className="relative">
                          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {captureDate ? format(captureDate, 'PPP') : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={captureDate}
                                onSelect={(date) => {
                                  if (date) {
                                    setCaptureDate(date);
                                    setIsCalendarOpen(false);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="file-name">File Name</Label>
                        <Input
                          id="file-name"
                          value={selectedFile?.name || ''}
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Add a description for this X-ray..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex space-x-2 justify-end">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploading}>
                        {uploading ? 'Saving...' : 'Save X-Ray'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-8 text-center">
                  <div className="mx-auto flex flex-col items-center justify-center space-y-2">
                    <div className="rounded-full bg-muted p-3">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No X-Ray Selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Click the "Upload X-Ray" button to select and upload an X-ray file
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select X-Ray File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="scan" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Intraoral Scan Upload</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Scan
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.stl,.obj,.ply"
                  className="hidden"
                />
              </div>
              
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted p-2 flex justify-between items-center">
                      <div className="text-sm font-medium">Preview</div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" 
                          onClick={() => setViewSettings({...viewSettings, zoom: viewSettings.zoom + 0.1})}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => setViewSettings({...viewSettings, rotation: viewSettings.rotation + 90})}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative bg-black flex items-center justify-center h-[300px]">
                      <img 
                        src={previewUrl} 
                        alt="Scan Preview" 
                        className="max-h-full max-w-full object-contain"
                        style={{
                          transform: `scale(${viewSettings.zoom}) rotate(${viewSettings.rotation}deg)`,
                          transition: 'transform 0.2s ease'
                        }}
                      />
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="capture-date">Capture Date</Label>
                        <div className="relative">
                          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {captureDate ? format(captureDate, 'PPP') : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={captureDate}
                                onSelect={(date) => {
                                  if (date) {
                                    setCaptureDate(date);
                                    setIsCalendarOpen(false);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="file-name">File Name</Label>
                        <Input
                          id="file-name"
                          value={selectedFile?.name || ''}
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Add a description for this scan..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex space-x-2 justify-end">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploading}>
                        {uploading ? 'Saving...' : 'Save Scan'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-8 text-center">
                  <div className="mx-auto flex flex-col items-center justify-center space-y-2">
                    <div className="rounded-full bg-muted p-3">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No Scan Selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Click the "Upload Scan" button to select and upload an intraoral scan file
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select Scan File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {activeTab === 'xray' ? 'X-Ray History' : 'Scan History'}
            </h3>
            <div className="text-sm text-muted-foreground">
              {activeTab === 'xray' ? existingXRays.length : existingScans.length} items
            </div>
          </div>
          
          <ScrollArea className="h-[350px] w-full rounded-md border">
            {activeTab === 'xray' && existingXRays.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No X-rays found for this patient
              </div>
            ) : activeTab === 'scan' && existingScans.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No scans found for this patient
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {sortedByDate(activeTab === 'xray' ? existingXRays : existingScans).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    onClick={() => onViewXRay && onViewXRay(doc.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-muted w-12 h-12 rounded-md flex items-center justify-center">
                        {doc.type === 'xray' ? (
                          <FileDigit className="h-6 w-6 text-primary" />
                        ) : (
                          <Camera className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.captureDate), 'PPP')}
                          {doc.lastAccessed && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              • Last viewed: {format(new Date(doc.lastAccessed), 'PPP')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.aiAnalysis?.completed && (
                        <div className="flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          AI Analyzed
                        </div>
                      )}
                      <Button variant="ghost" size="icon" onClick={(e) => {
                        e.stopPropagation();
                        // View action
                        onViewXRay && onViewXRay(doc.id);
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
      
      <CardFooter className="border-t flex flex-col pt-5">
        <LegalDisclaimer 
          providerName={doctorName}
          patientName={patientName}
          variant="compact"
          generateDate={new Date()}
        />
      </CardFooter>
    </Card>
  );
}