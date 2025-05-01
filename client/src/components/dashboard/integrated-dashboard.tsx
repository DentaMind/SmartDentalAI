import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PatientAPI, ImagingAPI } from '../../lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Badge,
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/components';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Image, 
  AlertCircle,
  Bell,
  Settings,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Type definitions
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  type: string;
  status: string;
  notes?: string;
}

interface ImageRecord {
  id: string;
  patient_id: string;
  filename: string;
  image_type: string;
  upload_time: string;
}

interface DiagnosisRecord {
  id: string;
  patient_id: string;
  image_id: string;
  timestamp: string;
  summary: string;
}

// Main dashboard component
export const IntegratedDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recentImages, setRecentImages] = useState<ImageRecord[]>([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch patients
        const patientsData = await PatientAPI.getAllPatients();
        setPatients(patientsData);
        
        // Fetch today's appointments
        // In a real app, you would filter by date on the server
        const allAppointments = await Promise.all(
          patientsData.slice(0, 3).map(patient => 
            PatientAPI.getPatientAppointments(patient.id)
          )
        );
        setAppointments(allAppointments.flat());
        
        // Fetch recent images
        const imagesData = await Promise.all(
          patientsData.slice(0, 3).map(patient => 
            ImagingAPI.getPatientImages(patient.id)
          )
        );
        setRecentImages(imagesData.flat().slice(0, 5));
        
        // Fetch recent diagnoses
        const diagnosesData = await Promise.all(
          patientsData.slice(0, 3).map(patient => 
            ImagingAPI.getPatientDiagnoses(patient.id)
          )
        );
        setRecentDiagnoses(diagnosesData.flat().slice(0, 5));
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Find patient name by ID
  const getPatientName = (patientId: string): string => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
  };
  
  // Format appointment time
  const formatAppointmentTime = (date: string, time: string): string => {
    return `${date} at ${time}`;
  };
  
  // Get appointment badge color based on status
  const getAppointmentStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="md:hidden mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">DentaMind Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-500" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 rounded-full">
                    <div className="flex items-center justify-center h-full w-full bg-blue-100 text-blue-800 font-semibold">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/logout')}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b">
          <div className="px-4 py-3 space-y-1">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/patients')}>
              <User className="mr-2 h-4 w-4" /> Patients
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/appointments')}>
              <Calendar className="mr-2 h-4 w-4" /> Appointments
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/imaging')}>
              <Image className="mr-2 h-4 w-4" /> Imaging
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name || 'Doctor'}</h2>
            <p className="mt-1 text-gray-500">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button onClick={() => navigate('/patients/new')}>
              New Patient
            </Button>
            <Button variant="outline" onClick={() => navigate('/appointments/new')}>
              New Appointment
            </Button>
          </div>
        </div>
        
        {/* Dashboard content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Appointments section */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Today's Appointments</CardTitle>
              <CardDescription>
                You have {appointments.length} appointments today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                    >
                      <div className="mr-4 mt-1">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{getPatientName(appointment.patient_id)}</h4>
                          <Badge className={getAppointmentStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatAppointmentTime(appointment.date, appointment.time)} • {appointment.duration_minutes} min
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{appointment.type}</p>
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">{appointment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No appointments scheduled for today</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/appointments/new')}
                  >
                    Schedule Appointment
                  </Button>
                </div>
              )}
              <div className="mt-4 text-right">
                <Button variant="link" onClick={() => navigate('/appointments')}>
                  View all appointments
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Patients quick access */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>
                Quick access to patient records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patients.length > 0 ? (
                <div className="space-y-4">
                  {patients.slice(0, 5).map((patient) => (
                    <div 
                      key={patient.id} 
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <Avatar className="h-10 w-10 rounded-full mr-3">
                        <div className="flex items-center justify-center h-full w-full bg-blue-100 text-blue-800 font-semibold">
                          {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                        </div>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{patient.first_name} {patient.last_name}</h4>
                        <p className="text-xs text-gray-500">{patient.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No patients in the system</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/patients/new')}
                  >
                    Add Patient
                  </Button>
                </div>
              )}
              <div className="mt-4 text-right">
                <Button variant="link" onClick={() => navigate('/patients')}>
                  View all patients
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent imaging section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Imaging</CardTitle>
              <CardDescription>
                Latest dental images and diagnoses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentImages.length > 0 ? (
                <div className="space-y-4">
                  {recentImages.slice(0, 3).map((image) => (
                    <div 
                      key={image.id} 
                      className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/imaging/${image.id}`)}
                    >
                      <div className="mr-3 mt-1">
                        <Image className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{getPatientName(image.patient_id)}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {image.image_type.toUpperCase()} • {new Date(image.upload_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No recent images</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/imaging/upload')}
                  >
                    Upload Image
                  </Button>
                </div>
              )}
              <div className="mt-4 text-right">
                <Button variant="link" onClick={() => navigate('/imaging')}>
                  View all images
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent diagnoses section */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Diagnoses</CardTitle>
              <CardDescription>
                Latest AI-powered dental diagnoses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentDiagnoses.length > 0 ? (
                <div className="space-y-4">
                  {recentDiagnoses.map((diagnosis) => (
                    <div 
                      key={diagnosis.id} 
                      className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/diagnoses/${diagnosis.id}`)}
                    >
                      <div className="mr-4 mt-1">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{getPatientName(diagnosis.patient_id)}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(diagnosis.timestamp).toLocaleDateString()} • 
                          {new Date(diagnosis.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">{diagnosis.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No recent diagnoses</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/imaging/upload')}
                  >
                    Upload & Analyze
                  </Button>
                </div>
              )}
              <div className="mt-4 text-right">
                <Button variant="link" onClick={() => navigate('/diagnoses')}>
                  View all diagnoses
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}; 