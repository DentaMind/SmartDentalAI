import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  X as XRayIcon, 
  Upload, 
  Search, 
  Zap, 
  Wand2, 
  PlusCircle, 
  Image,
  GitCompareArrows, 
  FileText, 
  FileX2, 
  ZoomIn, 
  SquarePen, 
  Trash2,
  Share2,
  Info,
  AlertTriangle
} from 'lucide-react';

// Types for the X-ray data
export interface XRay {
  id?: number;
  patientId: number;
  doctorId: number;
  date: Date;
  type: string;
  imageUrl: string;
  notes: string | null;
  aiAnalysis: Record<string, any> | null;
  analysisDate: Date | null;
  pathologyDetected: boolean | null;
  comparisonResult: Record<string, any> | null;
}

// Schema for form validation
const xrayUploadSchema = z.object({
  type: z.string().min(1, "X-ray type is required"),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

// Types of dental X-rays
const xrayTypes = [
  { value: 'periapical', label: 'Periapical' },
  { value: 'bitewing', label: 'Bitewing' },
  { value: 'panoramic', label: 'Panoramic' },
  { value: 'cbct', label: 'CBCT (3D)' },
  { value: 'occlusal', label: 'Occlusal' },
  { value: 'cephalometric', label: 'Cephalometric' },
  { value: 'full_mouth', label: 'Full Mouth Series' },
];

// Enhanced AI analysis for demonstration purposes with more comprehensive data
const generateAIAnalysisForXrayType = (xrayType: string, date: Date = new Date()): Record<string, any> => {
  // Common dental findings categories by x-ray type
  const findings = {
    // Findings specific to different x-ray types
    periapical: [
      {
        region: "Tooth #19",
        description: "Periapical radiolucency detected, suggesting possible infection",
        confidence: 0.89,
        boundingBox: { x: 120, y: 200, width: 40, height: 30 },
        severity: "moderate",
        type: "endodontic"
      },
      {
        region: "Root of tooth #19",
        description: "Possible root fracture detected",
        confidence: 0.72,
        boundingBox: { x: 130, y: 230, width: 20, height: 25 },
        severity: "severe",
        type: "endodontic"
      }
    ],
    bitewing: [
      {
        region: "Tooth #30-31 interproximal",
        description: "Interproximal caries detected",
        confidence: 0.91,
        boundingBox: { x: 150, y: 180, width: 15, height: 10 },
        severity: "moderate",
        type: "caries"
      },
      {
        region: "Alveolar crest between #18-19",
        description: "Early horizontal bone loss observed",
        confidence: 0.85,
        boundingBox: { x: 200, y: 210, width: 30, height: 20 },
        severity: "mild",
        type: "periodontal"
      }
    ],
    panoramic: [
      {
        region: "Right mandibular condyle",
        description: "Flattening of condylar head observed",
        confidence: 0.87,
        boundingBox: { x: 80, y: 100, width: 40, height: 35 },
        severity: "moderate",
        type: "tmj"
      },
      {
        region: "Left maxillary sinus",
        description: "Mucosal thickening detected",
        confidence: 0.82,
        boundingBox: { x: 350, y: 120, width: 60, height: 45 },
        severity: "mild",
        type: "pathology"
      },
      {
        region: "Tooth #17",
        description: "Impacted third molar with mesial angulation",
        confidence: 0.94,
        boundingBox: { x: 410, y: 200, width: 35, height: 30 },
        severity: "moderate",
        type: "surgical"
      }
    ],
    cbct: [
      {
        region: "Left maxillary posterior region",
        description: "Periapical radiolucency associated with tooth #14",
        confidence: 0.93,
        boundingBox: { x: 300, y: 150, width: 25, height: 25 },
        severity: "moderate",
        type: "endodontic"
      },
      {
        region: "Right mandibular canal",
        description: "Close proximity of third molar roots to inferior alveolar nerve",
        confidence: 0.96,
        boundingBox: { x: 120, y: 220, width: 45, height: 25 },
        severity: "moderate",
        type: "surgical"
      },
      {
        region: "Maxillary right second premolar",
        description: "Additional palatal root detected",
        confidence: 0.89,
        boundingBox: { x: 180, y: 130, width: 20, height: 35 },
        severity: "informational",
        type: "anatomical"
      }
    ],
    cephalometric: [
      {
        region: "Mandibular symphysis",
        description: "Class II skeletal pattern with mandibular retrusion",
        confidence: 0.91,
        boundingBox: { x: 200, y: 250, width: 30, height: 40 },
        severity: "moderate",
        type: "orthodontic"
      },
      {
        region: "Soft tissue profile",
        description: "Convex profile with reduced lower facial height",
        confidence: 0.88,
        boundingBox: { x: 100, y: 150, width: 50, height: 150 },
        severity: "mild",
        type: "orthodontic"
      }
    ],
    occlusal: [
      {
        region: "Maxillary anterior region",
        description: "Supernumerary tooth detected palatal to #9",
        confidence: 0.86,
        boundingBox: { x: 220, y: 180, width: 15, height: 15 },
        severity: "mild",
        type: "developmental"
      }
    ],
    full_mouth: [
      {
        region: "Multiple posterior regions",
        description: "Generalized horizontal bone loss of 3-4mm",
        confidence: 0.92,
        boundingBox: { x: 150, y: 200, width: 300, height: 100 },
        severity: "moderate",
        type: "periodontal"
      },
      {
        region: "Tooth #3, #14, #19, #30",
        description: "Multiple carious lesions detected",
        confidence: 0.90,
        boundingBox: { x: 200, y: 250, width: 200, height: 50 },
        severity: "moderate",
        type: "caries"
      }
    ]
  };
  
  // Select findings based on x-ray type, or use periapical as default
  const selectedFindings = findings[xrayType as keyof typeof findings] || findings.periapical;
  
  // Add common general findings with a 30% probability
  if (Math.random() > 0.7) {
    selectedFindings.push({
      region: "General observation",
      description: "Overall good bone quality and density",
      confidence: 0.95,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 }, // General observation doesn't have a specific area
      severity: "informational",
      type: "general"
    });
  }
  
  // Generate recommendations based on findings
  const recommendations = selectedFindings.map(finding => {
    switch (finding.type) {
      case 'endodontic':
        return `Endodontic evaluation recommended for ${finding.region}`;
      case 'periodontal':
        return `Periodontal treatment indicated for ${finding.region}`;
      case 'caries':
        return `Restorative treatment needed for ${finding.region}`;
      case 'surgical':
        return `Surgical consultation recommended for ${finding.region}`;
      case 'orthodontic':
        return `Orthodontic assessment recommended`;
      case 'tmj':
        return `TMJ evaluation suggested`;
      case 'pathology':
        return `Further evaluation of ${finding.region} pathology recommended`;
      default:
        return `Monitor ${finding.region} at next appointment`;
    }
  });
  
  // Generate automated measurements based on x-ray type
  let automatedMeasurements: Record<string, number> = {};
  
  if (xrayType === 'periapical' || xrayType === 'bitewing') {
    automatedMeasurements = {
      "boneHeight_19_distal": 2.3,
      "boneHeight_19_mesial": 2.1,
      "cariesDepth_30": 3.7
    };
  } else if (xrayType === 'panoramic') {
    automatedMeasurements = {
      "condylarHeight_right": 15.4,
      "condylarHeight_left": 15.1,
      "ramusHeight_right": 52.3,
      "ramusHeight_left": 51.8
    };
  } else if (xrayType === 'cephalometric') {
    automatedMeasurements = {
      "sna_angle": 82.3,
      "snb_angle": 78.1,
      "anb_angle": 4.2,
      "frankfort_mandibular_angle": 25.6
    };
  } else if (xrayType === 'cbct') {
    automatedMeasurements = {
      "bone_width_site_19": 8.2,
      "bone_height_site_19": 11.5,
      "distance_to_nerve_19": 3.7,
      "sinus_floor_distance_3": 5.2
    };
  }
  
  // Generate comparison with previous analysis if available (50% chance)
  let comparisonWithPrevious = null;
  if (Math.random() > 0.5) {
    const sixMonthsAgo = new Date(date);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    comparisonWithPrevious = {
      previousImageDate: sixMonthsAgo.toISOString().split('T')[0],
      changes: [
        "New periapical lesion on tooth #19 - increased by 2.3mm since previous X-ray",
        "Bone loss increased by 0.8mm in quadrant 2",
        "No progression of carious lesion on tooth #30"
      ],
      progression: Math.random() > 0.6 ? "worsened" : Math.random() > 0.5 ? "stable" : "improved",
      notes: "Regular monitoring recommended. Compare again in 6 months."
    };
  }
  
  // Create complete analysis object
  return {
    findings: selectedFindings,
    recommendations: recommendations,
    overallAssessment: selectedFindings.length > 2 
      ? "Multiple findings detected. Comprehensive treatment plan recommended."
      : selectedFindings.length > 0 
        ? "Localized findings detected. Specific treatment indicated."
        : "No significant pathology detected. Routine monitoring recommended.",
    automatedMeasurements: automatedMeasurements,
    comparisonWithPrevious: comparisonWithPrevious,
    aiModel: "DentalVisionAI v2.3",
    analysisDate: new Date().toISOString(),
    confidenceScore: 0.88 + (Math.random() * 0.1),
    threeDimensionalInsights: xrayType === 'cbct' ? {
      volumetricAnalysis: "Normal bone density and trabecular pattern",
      structuralRelationships: "No abnormal proximity to vital structures",
      nervesAndVessels: "Inferior alveolar nerve located 3.7mm from roots of tooth #19"
    } : undefined
  };
};

// Component for uploading, viewing, and analyzing X-rays
const AdvancedXRayAnalyzer: React.FC<{
  patientId: number;
  doctorId: number;
  onXRayAdded?: (xray: XRay) => void;
}> = ({ patientId, doctorId, onXRayAdded }) => {
  // State management
  const [selectedTab, setSelectedTab] = useState<string>('gallery');
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [selectedXRay, setSelectedXRay] = useState<XRay | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedComparisonXRay, setSelectedComparisonXRay] = useState<XRay | null>(null);
  const queryClient = useQueryClient();
  
  // Form for uploading new X-rays
  const form = useForm<z.infer<typeof xrayUploadSchema>>({
    resolver: zodResolver(xrayUploadSchema),
    defaultValues: {
      type: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    },
  });
  
  // Query to fetch existing X-rays
  const { data: xrays, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/xrays`],
    queryFn: async () => await apiRequest<XRay[]>(`/api/patients/${patientId}/xrays`),
  });
  
  // Mutation to add a new X-ray
  const addXRayMutation = useMutation({
    mutationFn: async (data: XRay) => {
      return await apiRequest<XRay>(`/api/patients/${patientId}/xrays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/xrays`] });
      toast({
        title: 'X-ray added',
        description: 'The X-ray has been successfully uploaded.',
      });
      if (onXRayAdded) {
        onXRayAdded(data);
      }
      form.reset();
      setFileSelected(false);
      setFileName('');
      setImagePreviewUrl('');
      setSelectedTab('gallery');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error adding X-ray',
        description: 'There was an error uploading the X-ray. Please try again.',
      });
      console.error('Error adding X-ray:', error);
    },
  });
  
  // Mutation to analyze an X-ray
  const analyzeXRayMutation = useMutation({
    mutationFn: async (xrayId: number) => {
      return await apiRequest<any>(`/api/patients/${patientId}/xrays/${xrayId}/analyze`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/xrays`] });
      setAnalysisResult(data);
      setIsAnalyzing(false);
      toast({
        title: 'Analysis complete',
        description: 'X-ray analysis has been completed successfully.',
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        variant: 'destructive',
        title: 'Error analyzing X-ray',
        description: 'There was an error analyzing the X-ray. Please try again.',
      });
      console.error('Error analyzing X-ray:', error);
    },
  });
  
  // Mutation to delete an X-ray
  const deleteXRayMutation = useMutation({
    mutationFn: async (xrayId: number) => {
      return await apiRequest<void>(`/api/patients/${patientId}/xrays/${xrayId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/xrays`] });
      setSelectedXRay(null);
      toast({
        title: 'X-ray deleted',
        description: 'The X-ray has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error deleting X-ray',
        description: 'There was an error deleting the X-ray. Please try again.',
      });
      console.error('Error deleting X-ray:', error);
    },
  });
  
  // Mutation to compare X-rays
  const compareXRaysMutation = useMutation({
    mutationFn: async ({ xrayId, comparisonXRayId }: { xrayId: number, comparisonXRayId: number }) => {
      return await apiRequest<any>(`/api/patients/${patientId}/xrays/${xrayId}/compare/${comparisonXRayId}`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/xrays`] });
      toast({
        title: 'Comparison complete',
        description: 'X-ray comparison has been completed successfully.',
      });
      // Update the selected X-ray with the comparison results
      if (selectedXRay && selectedXRay.id) {
        setSelectedXRay({
          ...selectedXRay,
          comparisonResult: data
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error comparing X-rays',
        description: 'There was an error comparing the X-rays. Please try again.',
      });
      console.error('Error comparing X-rays:', error);
    },
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileSelected(true);
      setFileName(files[0].name);
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFileSelected(false);
      setFileName('');
      setImagePreviewUrl('');
    }
  };
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof xrayUploadSchema>) => {
    if (!fileSelected) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select an X-ray image to upload.',
      });
      return;
    }
    
    // In a real app, you would upload the file to a server and get a URL back
    // For this example, we'll use a mock URL
    const mockImageUrl = `/uploads/xrays/${Date.now()}_${fileName}`;
    
    const xrayData: XRay = {
      patientId,
      doctorId,
      date: new Date(values.date),
      type: values.type,
      imageUrl: mockImageUrl,
      notes: values.notes || null,
      aiAnalysis: null,
      analysisDate: null,
      pathologyDetected: null,
      comparisonResult: null,
    };
    
    addXRayMutation.mutate(xrayData);
  };
  
  // Handle X-ray selection
  const handleSelectXRay = (xray: XRay) => {
    setSelectedXRay(xray);
  };
  
  // Handle X-ray analysis
  const handleAnalyzeXRay = () => {
    if (!selectedXRay || !selectedXRay.id) {
      toast({
        variant: 'destructive',
        title: 'No X-ray selected',
        description: 'Please select an X-ray to analyze.',
      });
      return;
    }
    
    setIsAnalyzing(true);
    setShowAnalysisDialog(true);
    
    // Simulate API call delay (in a real app, this would be a real API call with AI analysis)
    setTimeout(() => {
      // Generate dynamic AI analysis based on the X-ray type
      const dynamicAnalysis = generateAIAnalysisForXrayType(selectedXRay.type, selectedXRay.date);
      
      // Determine if pathology was detected based on findings
      const hasPathology = dynamicAnalysis.findings.some(
        (finding: any) => finding.severity === "moderate" || finding.severity === "severe"
      );
      
      // Update the selected X-ray with the generated analysis results
      const updatedXRay = {
        ...selectedXRay,
        aiAnalysis: dynamicAnalysis,
        analysisDate: new Date(),
        pathologyDetected: hasPathology,
      };
      
      setSelectedXRay(updatedXRay);
      setAnalysisResult(dynamicAnalysis);
      setIsAnalyzing(false);
      
      // Show appropriate toast based on analysis results
      toast({
        title: hasPathology ? 'Potential pathology detected' : 'Analysis complete',
        description: hasPathology 
          ? `The AI analysis has identified ${dynamicAnalysis.findings.length} findings that require attention.`
          : 'X-ray analysis complete. No significant pathology detected.',
        variant: hasPathology ? 'default' : 'default',
      });
      
      // In a real application, you would call the mutation here:
      // analyzeXRayMutation.mutate(selectedXRay.id);
    }, 2000);
  };
  
  // Handle X-ray comparison
  const handleCompareXRays = () => {
    if (!selectedXRay || !selectedXRay.id || !selectedComparisonXRay || !selectedComparisonXRay.id) {
      toast({
        variant: 'destructive',
        title: 'X-rays not selected',
        description: 'Please select two X-rays to compare.',
      });
      return;
    }
    
    // In a real app, you would call the API here:
    // compareXRaysMutation.mutate({
    //   xrayId: selectedXRay.id,
    //   comparisonXRayId: selectedComparisonXRay.id
    // });
    
    // For this example, we'll simulate a successful comparison
    toast({
      title: 'Comparison complete',
      description: 'X-ray comparison has been completed successfully.',
    });
    
    // Update the selected X-ray with mock comparison results
    const mockComparisonResult = {
      changes: [
        "New periapical lesion on tooth #19 - increased by 2.3mm since previous X-ray",
        "Bone loss increased by 0.8mm in quadrant 2",
        "No progression of carious lesion on tooth #30"
      ],
      progression: "worsened",
      notes: "Significant progression of periapical pathology. Urgent endodontic treatment recommended."
    };
    
    setSelectedXRay({
      ...selectedXRay,
      comparisonResult: mockComparisonResult
    });
  };
  
  // Handle X-ray deletion
  const handleDeleteXRay = () => {
    if (!selectedXRay || !selectedXRay.id) {
      toast({
        variant: 'destructive',
        title: 'No X-ray selected',
        description: 'Please select an X-ray to delete.',
      });
      return;
    }
    
    // In a real app, you would call the API here:
    // deleteXRayMutation.mutate(selectedXRay.id);
    
    // For this example, simulate a successful deletion
    setSelectedXRay(null);
    toast({
      title: 'X-ray deleted',
      description: 'The X-ray has been successfully deleted.',
    });
  };
  
  // Render X-ray gallery
  const renderGallery = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    // Use mock data for demonstration since we don't have real API data
    const mockXrays: XRay[] = [
      {
        id: 1,
        patientId,
        doctorId,
        date: new Date("2025-03-01"),
        type: "panoramic",
        imageUrl: "https://www.dentalcare.com/~/media/MDA2017US/Images/education/ce350/panoramic.ashx?bc=FFFFFF&h=400&w=900&hash=FFF8F47CF52C9C0EAFBB2B97E6635F95",
        notes: "Initial panoramic X-ray",
        aiAnalysis: null,
        analysisDate: null,
        pathologyDetected: null,
        comparisonResult: null,
      },
      {
        id: 2,
        patientId,
        doctorId,
        date: new Date("2025-02-15"),
        type: "periapical",
        imageUrl: "https://www.dentalcare.com/~/media/MDA2017US/Images/CE-courses/content-images/340/Fig7.ashx?h=200&w=400&la=en-US&hash=AF50A5B74B00176E25FC0F7FA76E09BD",
        notes: "Periapical X-ray of tooth #19",
        aiAnalysis: generateAIAnalysisForXrayType("periapical"),
        analysisDate: new Date("2025-02-15"),
        pathologyDetected: true,
        comparisonResult: null,
      },
      {
        id: 3,
        patientId,
        doctorId,
        date: new Date("2025-01-20"),
        type: "bitewing",
        imageUrl: "https://www.dentalcare.com/~/media/MDA2017US/Images/CE-courses/content-images/340/Fig3.ashx?h=200&w=400&la=en-US&hash=8DAB4BBDBC7BAF6B0DC5F87333BC05B2",
        notes: "Posterior bitewing X-rays",
        aiAnalysis: null,
        analysisDate: null,
        pathologyDetected: null,
        comparisonResult: null,
      }
    ];
    
    const displayXrays = xrays?.length ? xrays : mockXrays;
    
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <div className="text-lg font-medium">X-ray Gallery</div>
          <Button onClick={() => setSelectedTab('upload')}>
            <PlusCircle className="h-4 w-4 mr-2" /> Upload New X-ray
          </Button>
        </div>
        
        {displayXrays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayXrays.map((xray) => (
              <Card 
                key={xray.id} 
                className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${selectedXRay?.id === xray.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleSelectXRay(xray)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={xray.imageUrl} 
                    alt={`${xray.type} X-ray`} 
                    className="w-full h-full object-cover"
                  />
                  {xray.pathologyDetected && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Pathology Detected
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium capitalize">{xray.type} X-ray</div>
                      <div className="text-sm text-gray-500">{formatDate(xray.date)}</div>
                    </div>
                    {xray.aiAnalysis && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Zap className="h-3 w-3 mr-1" /> AI Analyzed
                      </Badge>
                    )}
                  </div>
                  {xray.notes && (
                    <div className="mt-1 text-sm text-gray-700 truncate">{xray.notes}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-md bg-gray-50">
            <XRayIcon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No X-rays found</h3>
            <p className="text-gray-500 mb-4">
              There are no X-rays for this patient yet.
            </p>
            <Button onClick={() => setSelectedTab('upload')}>
              <PlusCircle className="h-4 w-4 mr-2" /> Upload First X-ray
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // Render X-ray details and analysis
  const renderXRayDetail = () => {
    if (!selectedXRay) {
      return (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <XRayIcon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No X-ray selected</h3>
          <p className="text-gray-500 mb-4">
            Please select an X-ray from the gallery to view details.
          </p>
          <Button onClick={() => setSelectedTab('gallery')}>
            View X-ray Gallery
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-lg font-medium">X-ray Details</div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAnalyzeXRay}
              disabled={!!selectedXRay.aiAnalysis}
            >
              <Wand2 className="h-4 w-4 mr-1" /> Analyze
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('compare-dialog-trigger')?.click()}
            >
              <GitCompareArrows className="h-4 w-4 mr-1" /> Compare
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('export-dialog-trigger')?.click()}
            >
              <Share2 className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDeleteXRay}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="relative border rounded-md overflow-hidden">
              <img 
                src={selectedXRay.imageUrl} 
                alt={`${selectedXRay.type} X-ray`} 
                className="w-full h-auto"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/80 hover:bg-white">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/80 hover:bg-white">
                  <SquarePen className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-500">Type</div>
                  <div className="text-base capitalize">{selectedXRay.type}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-500">Date Taken</div>
                  <div className="text-base">{formatDate(selectedXRay.date)}</div>
                </div>
              </div>
              
              {selectedXRay.notes && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-500 mb-1">Notes</div>
                  <div className="text-sm">{selectedXRay.notes}</div>
                </div>
              )}
              
              {selectedXRay.aiAnalysis && selectedXRay.analysisDate && (
                <div className="p-2 bg-green-50 border border-green-100 rounded-md">
                  <div className="text-sm font-medium text-green-700 flex items-center">
                    <Zap className="h-4 w-4 mr-1" /> AI Analysis Completed
                  </div>
                  <div className="text-xs text-green-600">
                    {formatDate(selectedXRay.analysisDate)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            {selectedXRay.aiAnalysis ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-base font-medium mb-2">AI Analysis Results</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Findings</div>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedXRay.aiAnalysis.findings.map((finding: any, index: number) => (
                          <li key={index} className="text-sm">
                            <span className="font-medium">{finding.region}:</span> {finding.description} 
                            {finding.severity && (
                              <Badge 
                                variant="outline" 
                                className={`ml-2 ${
                                  finding.severity === 'severe' ? 'bg-red-50 text-red-700 border-red-200' : 
                                  finding.severity === 'moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}
                              >
                                {finding.severity}
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Recommendations</div>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedXRay.aiAnalysis.recommendations.map((recommendation: string, index: number) => (
                          <li key={index} className="text-sm">{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Overall Assessment</div>
                      <div className="text-sm">{selectedXRay.aiAnalysis.overallAssessment}</div>
                    </div>
                    
                    {selectedXRay.aiAnalysis.automatedMeasurements && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Automated Measurements</div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(selectedXRay.aiAnalysis.automatedMeasurements).map(([key, value]: [string, any]) => (
                            <div key={key} className="text-sm">
                              <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {value} mm
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedXRay.comparisonResult && (
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <h3 className="text-base font-medium mb-2 text-blue-700">Comparison Results</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-blue-700 mb-1">Changes Detected</div>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedXRay.comparisonResult.changes.map((change: string, index: number) => (
                            <li key={index} className="text-sm text-blue-800">{change}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex space-x-4">
                        <div>
                          <div className="text-sm font-medium text-blue-700 mb-1">Progression</div>
                          <Badge 
                            variant="outline" 
                            className={`${
                              selectedXRay.comparisonResult.progression === 'worsened' ? 'bg-red-50 text-red-700 border-red-200' : 
                              selectedXRay.comparisonResult.progression === 'stable' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {selectedXRay.comparisonResult.progression}
                          </Badge>
                        </div>
                      </div>
                      
                      {selectedXRay.comparisonResult.notes && (
                        <div>
                          <div className="text-sm font-medium text-blue-700 mb-1">Notes</div>
                          <div className="text-sm text-blue-800">{selectedXRay.comparisonResult.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => document.getElementById('analysis-dialog-trigger')?.click()}
                  >
                    <FileText className="h-4 w-4 mr-2" /> View Full Analysis Report
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 border-2 border-dashed rounded-md">
                <Wand2 className="h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                <p className="text-center text-gray-500">
                  Run AI analysis to automatically detect pathologies and get clinical recommendations.
                </p>
                <Button onClick={handleAnalyzeXRay}>
                  Start AI Analysis
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render X-ray upload form
  const renderUploadForm = () => {
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <div className="text-lg font-medium">Upload New X-ray</div>
          <Button variant="outline" onClick={() => setSelectedTab('gallery')}>
            Back to Gallery
          </Button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X-ray Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select X-ray type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {xrayTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Taken</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {imagePreviewUrl ? (
                <div className="space-y-4">
                  <div className="relative mx-auto max-w-md">
                    <img 
                      src={imagePreviewUrl} 
                      alt="X-ray preview" 
                      className="max-h-64 mx-auto"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-0 right-0"
                      onClick={() => {
                        setFileSelected(false);
                        setFileName('');
                        setImagePreviewUrl('');
                      }}
                    >
                      <FileX2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-green-600">
                    File selected: {fileName}
                  </div>
                </div>
              ) : (
                <>
                  <Image className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Upload X-ray Image</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <Input
                    type="file"
                    className="hidden"
                    id="xray-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("xray-upload")?.click()}
                    className="mx-auto"
                  >
                    Select File
                  </Button>
                </>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add notes about this X-ray..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSelectedTab('gallery');
                  form.reset();
                  setFileSelected(false);
                  setFileName('');
                  setImagePreviewUrl('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addXRayMutation.isPending || !fileSelected}>
                {addXRayMutation.isPending ? 'Uploading...' : 'Upload X-ray'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dental X-rays</CardTitle>
        <CardDescription>
          View, upload, and analyze dental X-rays
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="gallery">
              <Search className="h-4 w-4 mr-2" /> X-ray Gallery
            </TabsTrigger>
            <TabsTrigger value="detail" disabled={!selectedXRay}>
              <XRayIcon className="h-4 w-4 mr-2" /> X-ray Details
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" /> Upload New X-ray
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gallery" className="m-0">
            {renderGallery()}
          </TabsContent>
          
          <TabsContent value="detail" className="m-0">
            {renderXRayDetail()}
          </TabsContent>
          
          <TabsContent value="upload" className="m-0">
            {renderUploadForm()}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-sm text-gray-500 border-t pt-4">
        <div className="flex items-start space-x-2">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <p>
            X-rays are automatically analyzed using AI to detect potential pathologies and provide clinical recommendations.
            Results should always be verified by a qualified dental professional.
          </p>
        </div>
      </CardFooter>
      
      {/* Hidden dialog triggers */}
      <DialogTrigger id="analysis-dialog-trigger" className="hidden" />
      <DialogTrigger id="compare-dialog-trigger" className="hidden" />
      <DialogTrigger id="export-dialog-trigger" className="hidden" />
      
      {/* Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Analysis Results</DialogTitle>
            <DialogDescription>
              Detailed analysis of the selected X-ray
            </DialogDescription>
          </DialogHeader>
          
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-lg">Analyzing X-ray</p>
              <p className="text-sm text-gray-500">This may take a few moments...</p>
            </div>
          ) : analysisResult ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <img 
                    src={selectedXRay?.imageUrl} 
                    alt="X-ray" 
                    className="w-full h-auto rounded-md"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium">Key Findings</h3>
                    <ul className="list-disc list-inside mt-2 space-y-2">
                      {analysisResult.findings.map((finding: any, index: number) => (
                        <li key={index} className="text-sm">
                          <div className="inline-flex items-center">
                            <span className="font-medium">{finding.region}: </span>
                            <span className="ml-1">{finding.description}</span>
                            {finding.confidence && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {Math.round(finding.confidence * 100)}% confidence
                              </Badge>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium">Recommendations</h3>
                    <ul className="list-disc list-inside mt-2">
                      {analysisResult.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="text-sm">{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-base font-medium">Overall Assessment</h3>
                <p className="mt-1 text-sm">{analysisResult.overallAssessment}</p>
              </div>
              
              {analysisResult.automatedMeasurements && (
                <div className="border-t pt-4">
                  <h3 className="text-base font-medium">Automated Measurements</h3>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {Object.entries(analysisResult.automatedMeasurements).map(([key, value]: [string, any]) => (
                      <div key={key} className="p-2 bg-gray-50 rounded-md">
                        <div className="text-xs text-gray-500">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm font-medium">{value} mm</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-6">
              <p>No analysis results available</p>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowAnalysisDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdvancedXRayAnalyzer;