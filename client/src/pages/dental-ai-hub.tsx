import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Wand2, 
  Beaker, 
  BookOpen, 
  FileText, 
  Camera, 
  Sparkles, 
  Calendar, 
  Microscope,
  FileCheck, 
  Layers, 
  MoveRight,
  MessageSquare,
  CreditCard,
  BellRing,
  UserPlus,
  Settings,
  Globe,
  Edit
} from 'lucide-react';

// Import components
import { AdvancedXRayAnalyzer } from '@/components/ai/advanced-xray-analyzer';
import { AITreatmentPlanner } from '@/components/treatment/ai-treatment-planner';
import { PatientEducation } from '@/components/education/patient-education';
import { VoiceDictation } from '@/components/dictation/voice-dictation';
import { PaymentProcessing } from '@/components/financial/payment-processing';
import { AIMarketingSystem } from '@/components/marketing/ai-marketing-system';
import { MultilingualReferralSettings } from '@/components/settings/multilingual-referral-settings';
import { MultilingualPatientCommunication } from '@/components/communication/multilingual-patient-communication';

export default function DentalAIHub() {
  const [activeTab, setActiveTab] = useState('overview');

  // Define AI features for the hub
  const aiFeatures = [
    {
      id: 'xray-analysis',
      name: 'X-Ray Analysis',
      description: 'AI-powered radiographic image analysis for enhanced diagnostics',
      icon: <Camera className="h-8 w-8 text-blue-500" />,
      badge: 'Active',
      badgeClass: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'treatment-planning',
      name: 'Treatment Planning',
      description: 'Generate comprehensive AI-driven treatment plans with financial estimates',
      icon: <Wand2 className="h-8 w-8 text-purple-500" />,
      badge: 'Active',
      badgeClass: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'patient-education',
      name: 'Patient Education',
      description: 'AI-curated educational resources for patient comprehension',
      icon: <BookOpen className="h-8 w-8 text-amber-500" />,
      badge: 'Active',
      badgeClass: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'voice-dictation',
      name: 'Voice Dictation',
      description: 'AI-powered real-time transcription of clinical notes and SOAP format',
      icon: <MessageSquare className="h-8 w-8 text-cyan-500" />,
      badge: 'Active',
      badgeClass: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'payment-processing',
      name: 'Payment Processing',
      description: 'Integrated payment and insurance claim processing',
      icon: <CreditCard className="h-8 w-8 text-emerald-500" />,
      badge: 'Active',
      badgeClass: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'marketing',
      name: 'AI Marketing',
      description: 'AI-driven marketing system for patient retention and engagement',
      icon: <BellRing className="h-8 w-8 text-orange-500" />,
      badge: 'Active',
      badgeClass: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'multilingual',
      name: 'Multilingual Communication',
      description: 'Communicate with patients in their preferred language with AI translation',
      icon: <Globe className="h-8 w-8 text-blue-600" />,
      badge: 'Active',
      badgeClass: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'referrals',
      name: 'Referral Management',
      description: 'Advanced referral tracking and management',
      icon: <UserPlus className="h-8 w-8 text-indigo-500" />,
      badge: 'Active',
      badgeClass: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'perio-charting',
      name: 'Periodontal Charting',
      description: 'Automated periodontal assessments with AI-guided diagnosis',
      icon: <Layers className="h-8 w-8 text-red-500" />,
      badge: 'Coming Soon',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'intraoral-imaging',
      name: 'Intraoral Imaging',
      description: 'AI analysis of intraoral photos for lesion and pathology detection',
      icon: <Microscope className="h-8 w-8 text-green-500" />,
      badge: 'Coming Soon',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
    }
  ];

  // Display different components based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'xray-analysis':
        return <AdvancedXRayAnalyzer />;
      case 'treatment-planning':
        return <AITreatmentPlanner />;
      case 'patient-education':
        return <PatientEducation />;
      case 'voice-dictation':
        return <VoiceDictation />;
      case 'payment-processing':
        return <PaymentProcessing />;
      case 'marketing':
        return <AIMarketingSystem />;
      case 'multilingual':
        return <MultilingualPatientCommunication />;
      case 'referrals':
        return <MultilingualReferralSettings />;
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiFeatures.map(feature => (
                <Card 
                  key={feature.id} 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setActiveTab(feature.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                      </div>
                      <Badge className={feature.badgeClass}>
                        {feature.badge}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                    <div className="flex justify-end mt-4">
                      <Button variant="ghost" size="sm" className="flex items-center">
                        Open
                        <MoveRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-amber-500" />
                  DentaMind AI Capabilities
                </CardTitle>
                <CardDescription>
                  Powered by state-of-the-art AI technology to enhance your dental practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg mt-1">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Multi-Domain Neural Networks</h3>
                      <p className="text-sm text-muted-foreground">
                        DentaMind system uses specialized neural networks for each dental domain: 
                        periodontics, endodontics, prosthodontics, oral surgery, and orthodontics. 
                        This ensures highly accurate and domain-specific insights.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg mt-1">
                      <Beaker className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Continuous Learning System</h3>
                      <p className="text-sm text-muted-foreground">
                        Our AI continuously improves by learning from your practice patterns and 
                        outcomes, becoming more personalized and accurate with each use, while always 
                        maintaining HIPAA compliance.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg mt-1">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Workflow Optimization</h3>
                      <p className="text-sm text-muted-foreground">
                        Our AI doesn't just analyze data—it enhances your entire workflow. From automatically 
                        generating clinical notes to optimizing treatment sequencing and scheduling, DentaMind 
                        helps you focus more on patient care.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Feature coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DentaMind AI Hub</h1>
        <p className="text-muted-foreground">
          Advanced AI-powered tools to enhance dental practice management
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex overflow-auto pb-2">
          <TabsList className="h-10">
            <TabsTrigger value="overview" className="px-4">
              <Brain className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="xray-analysis" className="px-4">
              <Camera className="h-4 w-4 mr-2" />
              X-Ray Analysis
            </TabsTrigger>
            <TabsTrigger value="treatment-planning" className="px-4">
              <Wand2 className="h-4 w-4 mr-2" />
              Treatment Planning
            </TabsTrigger>
            <TabsTrigger value="patient-education" className="px-4">
              <BookOpen className="h-4 w-4 mr-2" />
              Patient Education
            </TabsTrigger>
            <TabsTrigger value="voice-dictation" className="px-4">
              <MessageSquare className="h-4 w-4 mr-2" />
              Voice Dictation
            </TabsTrigger>
            <TabsTrigger value="payment-processing" className="px-4">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Processing
            </TabsTrigger>
            <TabsTrigger value="marketing" className="px-4">
              <BellRing className="h-4 w-4 mr-2" />
              Marketing
            </TabsTrigger>
            <TabsTrigger value="multilingual" className="px-4">
              <Globe className="h-4 w-4 mr-2" />
              Multilingual
            </TabsTrigger>
            <TabsTrigger value="referrals" className="px-4">
              <UserPlus className="h-4 w-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="perio-charting" className="px-4">
              <Layers className="h-4 w-4 mr-2" />
              Perio Charting
            </TabsTrigger>
            <TabsTrigger value="intraoral-imaging" className="px-4">
              <Microscope className="h-4 w-4 mr-2" />
              Intraoral Imaging
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}