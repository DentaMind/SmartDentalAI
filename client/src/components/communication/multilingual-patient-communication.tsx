import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Languages, 
  MessageSquare, 
  Globe, 
  Headphones, 
  Mail,
  Phone,
  Send,
  Plus,
  History,
  UserRound,
  Copy,
  Check,
  ClipboardList,
  Search,
  FileText,
  Upload,
  HelpCircle,
  Edit,
  Star
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define types
interface Language {
  code: string;
  name: string;
  active: boolean;
  translationProgress: number;
  autoTranslate: boolean;
  nativeName: string;
}

interface PatientMessageTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  language: string;
  lastUsed?: string;
}

interface Patient {
  id: string;
  name: string;
  preferredLanguage: string;
  lastVisit: string;
  upcomingAppointment?: string;
  phoneNumber: string;
  email: string;
}

interface ChatMessage {
  id: string;
  sender: 'practice' | 'patient';
  content: string;
  timestamp: string;
  translated: boolean;
  originalLanguage?: string;
  originalContent?: string;
}

interface ConversationHistory {
  id: string;
  patientId: string;
  patientName: string;
  language: string;
  lastMessageTimestamp: string;
  lastMessage: string;
  unread: boolean;
}

export function MultilingualPatientCommunication() {
  const [activeTab, setActiveTab] = useState('messages');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedMessageTemplateId, setSelectedMessageTemplateId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [isAutoTranslateEnabled, setIsAutoTranslateEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTemplate, setNewTemplate] = useState<Partial<PatientMessageTemplate>>({
    name: '',
    category: 'appointment',
    content: '',
    language: 'en'
  });
  
  // State for currently selected conversation
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Mock supported languages
  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', active: true, translationProgress: 100, autoTranslate: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', active: true, translationProgress: 98, autoTranslate: true },
    { code: 'fr', name: 'French', nativeName: 'Français', active: true, translationProgress: 92, autoTranslate: true },
    { code: 'zh', name: 'Chinese', nativeName: '中文', active: true, translationProgress: 88, autoTranslate: true },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', active: true, translationProgress: 84, autoTranslate: true },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', active: true, translationProgress: 82, autoTranslate: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', active: true, translationProgress: 86, autoTranslate: true },
    { code: 'ko', name: 'Korean', nativeName: '한국어', active: true, translationProgress: 80, autoTranslate: true },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', active: false, translationProgress: 75, autoTranslate: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', active: false, translationProgress: 90, autoTranslate: true },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', active: false, translationProgress: 88, autoTranslate: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', active: false, translationProgress: 86, autoTranslate: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', active: false, translationProgress: 82, autoTranslate: true }
  ];
  
  // Mock message templates
  const messageTemplates: PatientMessageTemplate[] = [
    {
      id: '1',
      name: 'Appointment Reminder',
      category: 'appointment',
      content: 'Dear [PATIENT_NAME], this is a reminder about your upcoming dental appointment at [PRACTICE_NAME] on [APPOINTMENT_DATE] at [APPOINTMENT_TIME]. Please arrive 15 minutes early to complete any necessary paperwork. If you need to reschedule, please call us at [PRACTICE_PHONE].',
      language: 'en',
      lastUsed: '2025-03-05'
    },
    {
      id: '2',
      name: 'Appointment Confirmation',
      category: 'appointment',
      content: 'Dear [PATIENT_NAME], your appointment at [PRACTICE_NAME] has been confirmed for [APPOINTMENT_DATE] at [APPOINTMENT_TIME]. We look forward to seeing you!',
      language: 'en',
      lastUsed: '2025-03-02'
    },
    {
      id: '3',
      name: 'Recordatorio de Cita',
      category: 'appointment',
      content: 'Estimado/a [PATIENT_NAME], este es un recordatorio de su próxima cita dental en [PRACTICE_NAME] el [APPOINTMENT_DATE] a las [APPOINTMENT_TIME]. Por favor llegue 15 minutos antes para completar cualquier documentación necesaria. Si necesita reprogramar, llámenos al [PRACTICE_PHONE].',
      language: 'es',
      lastUsed: '2025-02-28'
    },
    {
      id: '4',
      name: 'Post-Treatment Care',
      category: 'care',
      content: 'Dear [PATIENT_NAME], thank you for visiting [PRACTICE_NAME] today. Here are your post-treatment care instructions: [CARE_INSTRUCTIONS]. If you experience any unusual symptoms or have questions, please contact our office at [PRACTICE_PHONE].',
      language: 'en',
      lastUsed: '2025-03-10'
    },
    {
      id: '5',
      name: 'Prescription Instructions',
      category: 'medication',
      content: 'Dear [PATIENT_NAME], your prescription for [MEDICATION_NAME] has been sent to your pharmacy. Please take [DOSAGE] [FREQUENCY] as directed for [DURATION]. If you experience any side effects, please contact our office immediately.',
      language: 'en'
    }
  ];
  
  // Mock patients
  const patients: Patient[] = [
    {
      id: '1',
      name: 'Maria Rodriguez',
      preferredLanguage: 'es',
      lastVisit: '2025-03-01',
      upcomingAppointment: '2025-03-20',
      phoneNumber: '(555) 123-4567',
      email: 'maria.rodriguez@example.com'
    },
    {
      id: '2',
      name: 'Wei Zhang',
      preferredLanguage: 'zh',
      lastVisit: '2025-02-15',
      upcomingAppointment: '2025-03-18',
      phoneNumber: '(555) 987-6543',
      email: 'wei.zhang@example.com'
    },
    {
      id: '3',
      name: 'Ahmed Al-Farsi',
      preferredLanguage: 'ar',
      lastVisit: '2025-03-05',
      phoneNumber: '(555) 456-7890',
      email: 'ahmed.alfarsi@example.com'
    },
    {
      id: '4',
      name: 'Sophia Nguyen',
      preferredLanguage: 'vi',
      lastVisit: '2025-02-28',
      upcomingAppointment: '2025-03-25',
      phoneNumber: '(555) 234-5678',
      email: 'sophia.nguyen@example.com'
    },
    {
      id: '5',
      name: 'John Smith',
      preferredLanguage: 'en',
      lastVisit: '2025-03-08',
      upcomingAppointment: '2025-03-22',
      phoneNumber: '(555) 345-6789',
      email: 'john.smith@example.com'
    }
  ];
  
  // Mock conversation history
  const conversationHistory: ConversationHistory[] = [
    {
      id: '1',
      patientId: '1',
      patientName: 'Maria Rodriguez',
      language: 'es',
      lastMessageTimestamp: '2025-03-12 10:30 AM',
      lastMessage: 'Gracias, estaré allí.',
      unread: false
    },
    {
      id: '2',
      patientId: '2',
      patientName: 'Wei Zhang',
      language: 'zh',
      lastMessageTimestamp: '2025-03-11 02:15 PM',
      lastMessage: '谢谢，我会按时到达。',
      unread: true
    },
    {
      id: '3',
      patientId: '4',
      patientName: 'Sophia Nguyen',
      language: 'vi',
      lastMessageTimestamp: '2025-03-10 11:45 AM',
      lastMessage: 'Tôi cần đổi lịch hẹn.',
      unread: true
    },
    {
      id: '4',
      patientId: '5',
      patientName: 'John Smith',
      language: 'en',
      lastMessageTimestamp: '2025-03-09 09:20 AM',
      lastMessage: 'Thanks for the reminder.',
      unread: false
    }
  ];
  
  // Mock chat messages for a selected conversation
  const chatMessages: Record<string, ChatMessage[]> = {
    '1': [
      {
        id: '1-1',
        sender: 'practice',
        content: 'Hello Maria, this is a reminder about your upcoming dental appointment on March 20th at 2:00 PM.',
        timestamp: '2025-03-11 09:15 AM',
        translated: true,
        originalLanguage: 'en',
        originalContent: 'Hello Maria, this is a reminder about your upcoming dental appointment on March 20th at 2:00 PM.'
      },
      {
        id: '1-2',
        sender: 'patient',
        content: 'Gracias por el recordatorio. ¿Necesito traer algo?',
        timestamp: '2025-03-11 10:30 AM',
        translated: true,
        originalLanguage: 'es',
        originalContent: 'Gracias por el recordatorio. ¿Necesito traer algo?'
      },
      {
        id: '1-3',
        sender: 'practice',
        content: 'Please bring your insurance card and a list of any medications you are currently taking.',
        timestamp: '2025-03-11 11:45 AM',
        translated: true,
        originalLanguage: 'en',
        originalContent: 'Please bring your insurance card and a list of any medications you are currently taking.'
      },
      {
        id: '1-4',
        sender: 'patient',
        content: 'Gracias, estaré allí.',
        timestamp: '2025-03-12 10:30 AM',
        translated: true,
        originalLanguage: 'es',
        originalContent: 'Gracias, estaré allí.'
      }
    ],
    '2': [
      {
        id: '2-1',
        sender: 'practice',
        content: 'Hello Wei, this is a reminder about your upcoming dental appointment on March 18th at 10:00 AM.',
        timestamp: '2025-03-10 09:15 AM',
        translated: true,
        originalLanguage: 'en',
        originalContent: 'Hello Wei, this is a reminder about your upcoming dental appointment on March 18th at 10:00 AM.'
      },
      {
        id: '2-2',
        sender: 'patient',
        content: '谢谢，我会按时到达。',
        timestamp: '2025-03-11 02:15 PM',
        translated: true,
        originalLanguage: 'zh',
        originalContent: '谢谢，我会按时到达。'
      }
    ],
    '3': [
      {
        id: '3-1',
        sender: 'practice',
        content: 'Hello Sophia, this is a reminder about your upcoming dental appointment on March 25th at 3:30 PM.',
        timestamp: '2025-03-10 09:15 AM',
        translated: true,
        originalLanguage: 'en',
        originalContent: 'Hello Sophia, this is a reminder about your upcoming dental appointment on March 25th at 3:30 PM.'
      },
      {
        id: '3-2',
        sender: 'patient',
        content: 'Tôi cần đổi lịch hẹn.',
        timestamp: '2025-03-10 11:45 AM',
        translated: true,
        originalLanguage: 'vi',
        originalContent: 'Tôi cần đổi lịch hẹn.'
      }
    ],
    '4': [
      {
        id: '4-1',
        sender: 'practice',
        content: 'Hello John, this is a reminder about your upcoming dental appointment on March 22nd at 11:00 AM.',
        timestamp: '2025-03-09 09:00 AM',
        translated: false
      },
      {
        id: '4-2',
        sender: 'patient',
        content: 'Thanks for the reminder.',
        timestamp: '2025-03-09 09:20 AM',
        translated: false
      }
    ]
  };
  
  // Get patient by ID
  const getPatient = (id: string): Patient | undefined => {
    return patients.find(patient => patient.id === id);
  };
  
  // Get selected patient
  const getSelectedPatient = (): Patient | undefined => {
    return selectedPatientId ? getPatient(selectedPatientId) : undefined;
  };
  
  // Get message template by ID
  const getMessageTemplate = (id: string): PatientMessageTemplate | undefined => {
    return messageTemplates.find(template => template.id === id);
  };
  
  // Get selected message template
  const getSelectedMessageTemplate = (): PatientMessageTemplate | undefined => {
    return selectedMessageTemplateId ? getMessageTemplate(selectedMessageTemplateId) : undefined;
  };
  
  // Get language name by code
  const getLanguageName = (code: string): string => {
    const language = languages.find(lang => lang.code === code);
    return language ? language.name : code;
  };
  
  // Get language flag emoji by code
  const getLanguageFlag = (code: string): string => {
    const flagEmojis: Record<string, string> = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ru': '🇷🇺',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
      'vi': '🇻🇳',
      'th': '🇹🇭',
      'uk': '🇺🇦',
      'tl': '🇵🇭'
    };

    return flagEmojis[code] || '🌐';
  };
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!currentMessage.trim() || !selectedConversationId) return;
    
    // In a real implementation, this would connect to a backend API to send and translate the message
    setIsTranslating(true);
    
    // Simulate the process of translation
    setTimeout(() => {
      setIsTranslating(false);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent and automatically translated.",
        variant: "default",
      });
      
      // Clear the input
      setCurrentMessage('');
    }, 1500);
  };
  
  // Handle adding a new message template
  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real implementation, this would send the template to a backend API
    toast({
      title: "Template added",
      description: `${newTemplate.name} template has been created.`,
      variant: "default",
    });
    
    // Reset the form and close the dialog
    setNewTemplate({
      name: '',
      category: 'appointment',
      content: '',
      language: 'en'
    });
    setIsAddTemplateOpen(false);
  };
  
  // Handle copying a message to clipboard
  const handleCopyMessageTemplate = (template: PatientMessageTemplate) => {
    // In a real implementation, this would copy the text to the clipboard
    navigator.clipboard.writeText(template.content).then(() => {
      toast({
        title: "Template copied",
        description: "The message template has been copied to clipboard.",
        variant: "default",
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Failed to copy the template to clipboard.",
        variant: "destructive",
      });
    });
  };
  
  // Function to translate text
  const translateText = (text: string, targetLanguage: string) => {
    // This is a placeholder. In a real application, 
    // this would call a translation API service.
    setIsTranslating(true);
    
    setTimeout(() => {
      setIsTranslating(false);
      
      toast({
        title: "Translation complete",
        description: `Text has been translated to ${getLanguageName(targetLanguage)}.`,
        variant: "default",
      });
    }, 1500);
    
    return text;
  };
  
  // Filter patients by search term
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getLanguageName(patient.preferredLanguage).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter message templates by search term
  const filteredTemplates = messageTemplates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getLanguageName(template.language).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get messages for selected conversation
  const getConversationMessages = (conversationId: string): ChatMessage[] => {
    return chatMessages[conversationId] || [];
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Multilingual Patient Communication</h2>
          <p className="text-muted-foreground">
            Communicate with patients in their preferred language
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-translate"
              checked={isAutoTranslateEnabled}
              onCheckedChange={setIsAutoTranslateEnabled}
            />
            <Label htmlFor="auto-translate" className="text-sm">Auto-Translate</Label>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Automatically translate messages to and from the patient's preferred language.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="templates">
            <ClipboardList className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="patients">
            <UserRound className="h-4 w-4 mr-2" />
            Patients
          </TabsTrigger>
          <TabsTrigger value="languages">
            <Globe className="h-4 w-4 mr-2" />
            Languages
          </TabsTrigger>
        </TabsList>
        
        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="flex h-[600px] border rounded-md overflow-hidden">
            {/* Conversation List */}
            <div className="w-1/3 border-r flex flex-col">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search conversations..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                {conversationHistory.map(conversation => (
                  <div 
                    key={conversation.id}
                    className={`
                      flex flex-col p-3 border-b cursor-pointer hover:bg-muted/50
                      ${selectedConversationId === conversation.id ? 'bg-muted' : ''}
                    `}
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium flex items-center">
                        {conversation.patientName}
                        {conversation.unread && (
                          <Badge className="ml-2 bg-blue-500 text-white h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getLanguageFlag(conversation.language)} {getLanguageName(conversation.language)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 truncate">
                      {conversation.lastMessage}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {conversation.lastMessageTimestamp}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
            
            {/* Chat Area */}
            <div className="w-2/3 flex flex-col">
              {selectedConversationId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 border-b flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {conversationHistory.find(c => c.id === selectedConversationId)?.patientName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        {(() => {
                          const langCode = conversationHistory.find(c => c.id === selectedConversationId)?.language || 'en';
                          return (
                            <>
                              {getLanguageFlag(langCode)} {getLanguageName(langCode)}
                              <span className="mx-1">•</span>
                              <span>
                                {isAutoTranslateEnabled ? 'Auto-translating' : 'Manual translation'}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Template" />
                        </SelectTrigger>
                        <SelectContent>
                          {messageTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Chat Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {getConversationMessages(selectedConversationId).map(message => {
                        const isPatient = message.sender === 'patient';
                        return (
                          <div 
                            key={message.id} 
                            className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}
                          >
                            <div 
                              className={`
                                max-w-[70%] rounded-lg p-3
                                ${isPatient ? 'bg-muted' : 'bg-primary text-primary-foreground'}
                              `}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div className="text-xs mt-1 opacity-70 flex justify-between items-center">
                                <span>{message.timestamp}</span>
                                {message.translated && (
                                  <Tooltip>
                                    <TooltipTrigger className="ml-2">
                                      <Languages className="h-3 w-3" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Translated from {getLanguageName(message.originalLanguage || '')}</p>
                                      <p className="mt-1 font-mono text-xs">{message.originalContent}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <div className="p-3 border-t">
                    {isTranslating ? (
                      <div className="flex flex-col space-y-2">
                        <div className="text-xs text-muted-foreground">Translating message...</div>
                        <Progress value={45} className="h-1" />
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Textarea 
                          placeholder="Type your message..." 
                          className="min-h-[60px]"
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                        />
                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="icon" 
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Conversation Selected</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Select a conversation from the list or start a new one
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Communication Statistics</CardTitle>
              <CardDescription>
                Overview of multilingual patient communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-lg font-medium">Messages by Language</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Spanish (es)</span>
                        <span>42%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "42%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Chinese (zh)</span>
                        <span>28%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "28%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>English (en)</span>
                        <span>18%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "18%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-lg font-medium">Response Times</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-md p-3 text-center">
                      <div className="text-2xl font-bold">15m</div>
                      <div className="text-sm text-muted-foreground">Avg. Response</div>
                    </div>
                    <div className="border rounded-md p-3 text-center">
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-sm text-muted-foreground">Same-Day</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-lg font-medium">Message Volume</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-md p-3 text-center">
                      <div className="text-2xl font-bold">156</div>
                      <div className="text-sm text-muted-foreground">This Week</div>
                    </div>
                    <div className="border rounded-md p-3 text-center">
                      <div className="text-2xl font-bold">+12%</div>
                      <div className="text-sm text-muted-foreground">vs Last Week</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search templates..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Message Template</DialogTitle>
                  <DialogDescription>
                    Create a new message template for patient communications
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="template-name">Template Name *</Label>
                      <Input
                        id="template-name"
                        placeholder="e.g., Appointment Reminder"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={newTemplate.category}
                        onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}
                      >
                        <SelectTrigger id="category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">Appointment</SelectItem>
                          <SelectItem value="care">Post-Treatment Care</SelectItem>
                          <SelectItem value="medication">Medication</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="recall">Recall</SelectItem>
                          <SelectItem value="education">Patient Education</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="language">Language *</Label>
                    <Select
                      value={newTemplate.language}
                      onValueChange={(value) => setNewTemplate({...newTemplate, language: value})}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.filter(l => l.active).map(language => (
                          <SelectItem key={language.code} value={language.code}>
                            {getLanguageFlag(language.code)} {language.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="content">Message Content *</Label>
                    <Textarea
                      id="content"
                      rows={8}
                      placeholder="Dear [PATIENT_NAME],
We are confirming your appointment at [PRACTICE_NAME] on [APPOINTMENT_DATE] at [APPOINTMENT_TIME].
Please contact us at [PRACTICE_PHONE] if you need to reschedule.
Thank you!"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                    />
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Available Variables</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <Badge variant="outline">[PATIENT_NAME]</Badge>
                      <Badge variant="outline">[PRACTICE_NAME]</Badge>
                      <Badge variant="outline">[APPOINTMENT_DATE]</Badge>
                      <Badge variant="outline">[APPOINTMENT_TIME]</Badge>
                      <Badge variant="outline">[PRACTICE_PHONE]</Badge>
                      <Badge variant="outline">[DOCTOR_NAME]</Badge>
                      <Badge variant="outline">[MEDICATION_NAME]</Badge>
                      <Badge variant="outline">[DOSAGE]</Badge>
                      <Badge variant="outline">[FREQUENCY]</Badge>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddTemplateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTemplate}>
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Message Templates</CardTitle>
                  <CardDescription>
                    Select a template to view or edit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredTemplates.map(template => (
                    <div 
                      key={template.id}
                      className={`
                        flex justify-between items-center p-3 rounded-md cursor-pointer hover:bg-muted
                        ${selectedMessageTemplateId === template.id ? 'bg-muted' : ''}
                      `}
                      onClick={() => setSelectedMessageTemplateId(template.id)}
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <span className="mx-1">•</span>
                          <span className="flex items-center">
                            {getLanguageFlag(template.language)}
                            <span className="ml-1">{getLanguageName(template.language)}</span>
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyMessageTemplate(template);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              {selectedMessageTemplateId ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{getSelectedMessageTemplate()?.name}</CardTitle>
                        <CardDescription>
                          {getSelectedMessageTemplate()?.category} • 
                          <span className="ml-1 flex items-center inline-flex">
                            {getLanguageFlag(getSelectedMessageTemplate()?.language || 'en')}
                            <span className="ml-1">{getLanguageName(getSelectedMessageTemplate()?.language || 'en')}</span>
                          </span>
                        </CardDescription>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-md bg-muted/30 whitespace-pre-line">
                        {getSelectedMessageTemplate()?.content}
                      </div>
                      
                      {getSelectedMessageTemplate()?.language !== 'en' && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">English Version</h4>
                          <div className="p-4 border rounded-md bg-muted/30 whitespace-pre-line">
                            {/* This would be the English version in a real implementation */}
                            Dear [PATIENT_NAME],
                            
                            This is a confirmation of your appointment at [PRACTICE_NAME] on [APPOINTMENT_DATE] at [APPOINTMENT_TIME].
                            
                            Please let us know if you need to reschedule by calling [PRACTICE_PHONE].
                            
                            Thank you,
                            Dr. [DOCTOR_NAME]
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {getSelectedMessageTemplate()?.lastUsed ? 
                            `Last used: ${getSelectedMessageTemplate()?.lastUsed}` : 
                            'Never used'
                          }
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Languages className="h-4 w-4 mr-2" />
                            Translate
                          </Button>
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Select a Template</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a template from the library to view or edit
                    </p>
                    <Button variant="outline" onClick={() => setIsAddTemplateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Template
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search patients..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Patient Language Preferences</CardTitle>
              <CardDescription>
                Manage patient communication and language settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Preferred Language</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Upcoming Appointment</TableHead>
                    <TableHead>Contact Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map(patient => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getLanguageFlag(patient.preferredLanguage)}
                          <span className="ml-2">{getLanguageName(patient.preferredLanguage)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{patient.lastVisit}</TableCell>
                      <TableCell>{patient.upcomingAppointment || 'None scheduled'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Badge variant="outline" className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                          <Badge variant="outline" className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            SMS
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Language Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spanish (es)</span>
                    <span>32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>English (en)</span>
                    <span>28%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Chinese (zh)</span>
                    <span>18%</span>
                  </div>
                  <Progress value={18} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Vietnamese (vi)</span>
                    <span>12%</span>
                  </div>
                  <Progress value={12} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Arabic (ar)</span>
                    <span>10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Communication Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Email</span>
                    </div>
                    <span>48%</span>
                  </div>
                  <Progress value={48} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-green-500" />
                      <span>SMS</span>
                    </div>
                    <span>36%</span>
                  </div>
                  <Progress value={36} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-purple-500" />
                      <span>Portal Message</span>
                    </div>
                    <span>16%</span>
                  </div>
                  <Progress value={16} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Response Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-md">
                    <div className="text-2xl font-bold">78%</div>
                    <div className="text-xs text-muted-foreground">Overall</div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-md">
                    <div className="text-2xl font-bold">92%</div>
                    <div className="text-xs text-muted-foreground">Native Lang.</div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">By Language</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Spanish (es)</span>
                      <span>86%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>English (en)</span>
                      <span>93%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Chinese (zh)</span>
                      <span>78%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Translation Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">Messages Translated</div>
                  <div className="font-medium text-sm">1,256</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Last 30 days</div>
                  <div className="text-xs text-green-600">+12.5%</div>
                </div>
                
                <div className="pt-4">
                  <div className="text-sm font-medium mb-2">Translation Quality</div>
                  <div className="flex items-center">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Star key={rating} 
                          className={`h-4 w-4 ${rating <= 4 ? 'text-amber-500 fill-amber-500' : 'text-muted'}`} 
                        />
                      ))}
                    </div>
                    <div className="ml-2 text-sm">4.0/5.0</div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <div className="text-sm font-medium mb-2">AI Translation Usage</div>
                  <Progress value={68} className="h-2" />
                  <div className="flex justify-between text-xs mt-1">
                    <span>68% of all communication</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Languages Tab */}
        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Language Support Settings</CardTitle>
              <CardDescription>
                Manage languages and translation options for patient communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead>Native Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Translation Progress</TableHead>
                    <TableHead>Auto-Translate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {languages.map(language => (
                    <TableRow key={language.code}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getLanguageFlag(language.code)}
                          <span className="ml-2">{language.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{language.nativeName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={language.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-muted'}
                        >
                          {language.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={language.translationProgress} className="h-2 w-24" />
                          <span className="text-sm">{language.translationProgress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={language.autoTranslate}
                          onCheckedChange={() => {
                            // In a real implementation, this would update the language settings
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button
                onClick={() => {
                  toast({
                    title: "Language settings saved",
                    description: "Your language preferences have been updated.",
                    variant: "default",
                  });
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Save Language Settings
              </Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Translation Services</CardTitle>
                <CardDescription>
                  AI-powered translation service configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Translation API</div>
                    <div className="text-sm text-muted-foreground">
                      Configure the AI translation service
                    </div>
                  </div>
                  <Select defaultValue="advanced-ai">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advanced-ai">Advanced AI (GPT-4)</SelectItem>
                      <SelectItem value="standard-ai">Standard AI</SelectItem>
                      <SelectItem value="google">Google Translate</SelectItem>
                      <SelectItem value="microsoft">Microsoft Translator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-Translation</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically translate patient communications
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Translation Memory</div>
                    <div className="text-sm text-muted-foreground">
                      Save and reuse previous translations
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Terminology Consistency</div>
                    <div className="text-sm text-muted-foreground">
                      Maintain consistent dental terminology across languages
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Quality Threshold</div>
                    <div className="text-sm text-muted-foreground">
                      Minimum translation confidence score
                    </div>
                  </div>
                  <Select defaultValue="high">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (95%+)</SelectItem>
                      <SelectItem value="medium">Medium (85%+)</SelectItem>
                      <SelectItem value="low">Low (75%+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Translation Statistics</CardTitle>
                <CardDescription>
                  Usage metrics for multilingual communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Translations This Month</div>
                    <div className="text-2xl font-bold mt-1">2,547</div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Languages Used</div>
                    <div className="text-2xl font-bold mt-1">8</div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Avg. Translation Time</div>
                    <div className="text-2xl font-bold mt-1">1.2s</div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Translation Accuracy</div>
                    <div className="text-2xl font-bold mt-1">96.8%</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm font-medium">Most Translated Languages</div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <div className="flex items-center">
                        {getLanguageFlag('es')} <span className="ml-2">Spanish (es)</span>
                      </div>
                      <span>38%</span>
                    </div>
                    <Progress value={38} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <div className="flex items-center">
                        {getLanguageFlag('zh')} <span className="ml-2">Chinese (zh)</span>
                      </div>
                      <span>24%</span>
                    </div>
                    <Progress value={24} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <div className="flex items-center">
                        {getLanguageFlag('vi')} <span className="ml-2">Vietnamese (vi)</span>
                      </div>
                      <span>18%</span>
                    </div>
                    <Progress value={18} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}