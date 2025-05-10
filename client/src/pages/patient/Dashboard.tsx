import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle
} from '../../components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { PatientSummaryCard } from '../../components/patient/PatientSummaryCard';
import { PerioWidget } from '../../components/perio/PerioWidget';
import { XrayViewer } from '../../components/imaging/XrayViewer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { PatientAPI, ImagingAPI } from '../../lib/api';
import { Loader2, Plus, RefreshCw, Calendar, FileText, BarChart3, ShieldAlert } from 'lucide-react';

const MOCK_PERIO_DATA = {
  examDate: "2023-05-15T09:30:00",
  teeth: [
    {
      tooth_number: "16",
      pocket_depths: {
        MB: 3,
        B: 2,
        DB: 3,
        ML: 4,
        L: 3,
        DL: 4
      },
      recession: {
        MB: 0,
        B: 0,
        DB: 0,
        ML: 1,
        L: 1,
        DL: 2
      },
      mobility: 1,
      furcation: {
        B: 2,
        ML: 1,
        DL: 0
      },
      bleeding: {
        MB: true,
        B: false,
        DB: true,
        ML: true,
        L: true,
        DL: true
      }
    },
    {
      tooth_number: "3",
      pocket_depths: {
        MB: 6,
        B: 5,
        DB: 4,
        ML: 5,
        L: 3,
        DL: 3
      },
      bleeding: {
        MB: true,
        B: true,
        DB: true,
        ML: true,
        L: false,
        DL: false
      }
    }
  ],
  notes: "Initial exam. Moderate periodontitis, Class II, Stage 2."
};

const PatientDashboard: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  
  useEffect(() => {
    // Load patient data and related information
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        
        if (!patientId) {
          console.error('No patient ID provided');
          setLoading(false);
          return;
        }
        
        // Fetch patient details
        const patientData = await PatientAPI.getPatient(patientId);
        setPatient(patientData);
        
        // Fetch patient appointments
        const appointmentsData = await PatientAPI.getPatientAppointments(patientId);
        setAppointments(appointmentsData);
        
        // Fetch patient images
        const imagesData = await ImagingAPI.getPatientImages(patientId);
        setImages(imagesData);
        
        // Set the most recent image as selected if available
        if (imagesData.length > 0) {
          const mostRecent = imagesData.sort((a, b) => 
            new Date(b.upload_time).getTime() - new Date(a.upload_time).getTime()
          )[0];
          setSelectedImage(mostRecent);
        }
        
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId]);
  
  const handleRunAnalysis = async () => {
    if (!selectedImage) return;
    
    try {
      const diagnosis = await ImagingAPI.getImageDiagnosis(selectedImage.id);
      // Update the selected image with the diagnosis
      setSelectedImage({
        ...selectedImage,
        diagnosis
      });
    } catch (error) {
      console.error('Error running analysis:', error);
    }
  };
  
  const handleScheduleAppointment = () => {
    navigate(`/scheduler?patient=${patientId}`);
  };
  
  const handleViewFullPerioChart = () => {
    navigate(`/patient/${patientId}/perio-chart`);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading patient data...</span>
        </div>
      </Layout>
    );
  }
  
  if (!patient) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Patient not found</h2>
          <p className="text-muted-foreground mb-6">
            The patient you're looking for doesn't exist or you don't have permission to view their records.
          </p>
          <Button onClick={() => navigate('/patients')}>
            Back to Patient List
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>
          Patient Dashboard: {patient.first_name} {patient.last_name}
        </LayoutTitle>
      </LayoutHeader>
      
      <LayoutContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="imaging">Imaging</TabsTrigger>
            <TabsTrigger value="perio">Periodontal</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <PatientSummaryCard 
                  patient={patient} 
                  onViewDetails={() => navigate(`/patient/${patientId}/profile`)}
                  onScheduleAppointment={handleScheduleAppointment}
                />
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointments.length === 0 ? (
                      <div className="text-center p-4">
                        <p className="text-muted-foreground">No upcoming appointments</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={handleScheduleAppointment}
                        >
                          <Calendar size={16} className="mr-2" />
                          Schedule Appointment
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {appointments.map((appointment) => (
                          <div 
                            key={appointment.id} 
                            className="p-3 border rounded-md flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium">{appointment.date} • {appointment.time}</div>
                              <div className="text-sm text-muted-foreground">{appointment.type}</div>
                            </div>
                            <Badge variant={
                              appointment.status === 'confirmed' ? 'default' : 
                              appointment.status === 'pending' ? 'outline' : 'secondary'
                            }>
                              {appointment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2 space-y-6">
                <PerioWidget 
                  examDate={MOCK_PERIO_DATA.examDate}
                  teeth={MOCK_PERIO_DATA.teeth}
                  notes={MOCK_PERIO_DATA.notes}
                  onViewFullChart={handleViewFullPerioChart}
                />
                
                {selectedImage ? (
                  <XrayViewer 
                    imageUrl={`/attached_assets/xrays/${patientId}/${selectedImage.filename}`}
                    imageType={selectedImage.image_type}
                    uploadTime={selectedImage.upload_time}
                    patientName={`${patient.first_name} ${patient.last_name}`}
                    diagnosis={selectedImage.diagnosis}
                    onRunAnalysis={handleRunAnalysis}
                    onDownload={() => window.open(`/attached_assets/xrays/${patientId}/${selectedImage.filename}`, '_blank')}
                    onViewReport={() => navigate(`/patient/${patientId}/imaging/${selectedImage.id}/report`)}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Imaging</CardTitle>
                      <CardDescription>No images available for this patient</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center p-8">
                      <Button onClick={() => navigate(`/patient/${patientId}/imaging/upload`)}>
                        <Plus size={16} className="mr-2" />
                        Upload New Image
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Assessment</CardTitle>
                    <CardDescription>Patient risk factors and ASA classification</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Medical Risk:</span>{" "}
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                          Moderate Risk
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">ASA Class:</span> II
                      </div>
                    </div>
                    <Button variant="outline">
                      <BarChart3 size={16} className="mr-2" />
                      View Assessment
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="imaging" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Image Library</CardTitle>
                    <CardDescription>{images.length} images total</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[600px] overflow-y-auto">
                      {images.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-muted-foreground mb-4">No images available</p>
                          <Button variant="outline" onClick={() => navigate(`/patient/${patientId}/imaging/upload`)}>
                            <Plus size={16} className="mr-2" />
                            Upload Image
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {images.map((image) => (
                            <div 
                              key={image.id}
                              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedImage?.id === image.id ? 'bg-gray-50 border-l-4 border-primary' : ''}`}
                              onClick={() => setSelectedImage(image)}
                            >
                              <div className="font-medium">{image.image_type.toUpperCase()}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(image.upload_time).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-3">
                {selectedImage ? (
                  <XrayViewer 
                    imageUrl={`/attached_assets/xrays/${patientId}/${selectedImage.filename}`}
                    imageType={selectedImage.image_type}
                    uploadTime={selectedImage.upload_time}
                    patientName={`${patient.first_name} ${patient.last_name}`}
                    diagnosis={selectedImage.diagnosis}
                    onRunAnalysis={handleRunAnalysis}
                    onDownload={() => window.open(`/attached_assets/xrays/${patientId}/${selectedImage.filename}`, '_blank')}
                    onViewReport={() => navigate(`/patient/${patientId}/imaging/${selectedImage.id}/report`)}
                  />
                ) : (
                  <Card className="h-[600px] flex items-center justify-center">
                    <div className="text-center p-6">
                      <p className="text-lg font-medium mb-2">No image selected</p>
                      <p className="text-muted-foreground mb-6">Select an image from the library or upload a new one</p>
                      <Button onClick={() => navigate(`/patient/${patientId}/imaging/upload`)}>
                        <Plus size={16} className="mr-2" />
                        Upload New Image
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="perio" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Periodontal Charting</CardTitle>
                <CardDescription>
                  Comprehensive periodontal assessment and tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-12">
                  <p className="text-lg font-medium mb-2">Full Perio Charting Coming Soon</p>
                  <p className="text-muted-foreground mb-6">The complete perio charting interface is under development</p>
                  <Button>
                    <FileText size={16} className="mr-2" />
                    View Current Perio Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="treatment" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Plans</CardTitle>
                <CardDescription>
                  Active and completed treatment plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-12">
                  <p className="text-lg font-medium mb-2">Treatment Planning Coming Soon</p>
                  <p className="text-muted-foreground mb-6">The complete treatment planning interface is under development</p>
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Create New Treatment Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </LayoutContent>
    </Layout>
  );
};

export default PatientDashboard; 