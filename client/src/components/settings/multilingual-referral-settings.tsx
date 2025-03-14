import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Users, 
  Languages, 
  UserCheck, 
  Save, 
  ArrowRight, 
  Plus, 
  ChevronDown,
  PenTool,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Textarea } from '@/components/ui/textarea';

export function MultilingualReferralSettings() {
  const [activeTab, setActiveTab] = useState('multilingual');
  const { toast } = useToast();
  
  // Multilingual settings
  const [defaultLanguage, setDefaultLanguage] = useState('english');
  const [enabledLanguages, setEnabledLanguages] = useState(['english', 'spanish']);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [voiceTranslationEnabled, setVoiceTranslationEnabled] = useState(true);
  
  // Referral settings
  const [referralProviders, setReferralProviders] = useState([
    { 
      id: '1', 
      name: 'Dr. Sarah Johnson', 
      specialty: 'Endodontist', 
      email: 'sjohnson@dentalspecialists.com',
      phone: '(555) 123-4567',
      address: '123 Specialist Way, Suite 100',
      preferred: true,
      inNetwork: true,
      notes: 'Excellent with anxious patients'
    },
    { 
      id: '2', 
      name: 'Dr. Michael Chen', 
      specialty: 'Oral Surgeon', 
      email: 'mchen@oralsurgery.com',
      phone: '(555) 987-6543',
      address: '456 Medical Plaza, Suite 200',
      preferred: true,
      inNetwork: true,
      notes: 'Available for emergency consultations'
    },
    { 
      id: '3', 
      name: 'Dr. Rebecca Williams', 
      specialty: 'Periodontist', 
      email: 'rwilliams@periodental.com',
      phone: '(555) 456-7890',
      address: '789 Gum Health Drive',
      preferred: false,
      inNetwork: false,
      notes: 'Specializes in laser periodontal therapy'
    }
  ]);
  const [newReferralOpen, setNewReferralOpen] = useState(false);
  const [newReferral, setNewReferral] = useState({
    name: '',
    specialty: 'Endodontist',
    email: '',
    phone: '',
    address: '',
    preferred: false,
    inNetwork: false,
    notes: ''
  });
  
  // Save multilingual settings
  const handleSaveLanguageSettings = () => {
    toast({
      title: "Language settings saved",
      description: `Default language set to ${defaultLanguage} with ${enabledLanguages.length} languages enabled.`,
      variant: "default"
    });
  };
  
  // Add new referral provider
  const handleAddReferral = () => {
    // Validate form
    if (!newReferral.name || !newReferral.email || !newReferral.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const newProvider = {
      ...newReferral,
      id: (referralProviders.length + 1).toString()
    };
    
    setReferralProviders([...referralProviders, newProvider]);
    setNewReferralOpen(false);
    setNewReferral({
      name: '',
      specialty: 'Endodontist',
      email: '',
      phone: '',
      address: '',
      preferred: false,
      inNetwork: false,
      notes: ''
    });
    
    toast({
      title: "Referral provider added",
      description: `${newReferral.name} has been added to your referral network.`,
      variant: "default"
    });
  };
  
  // Delete a referral provider
  const handleDeleteReferral = (id: string) => {
    setReferralProviders(referralProviders.filter(provider => provider.id !== id));
    
    toast({
      title: "Referral provider removed",
      description: "The provider has been removed from your referral network.",
      variant: "default"
    });
  };
  
  // Toggle language enabled status
  const toggleLanguage = (language: string) => {
    if (enabledLanguages.includes(language)) {
      // Don't allow removing the default language
      if (language === defaultLanguage) {
        toast({
          title: "Cannot disable default language",
          description: "Please select a new default language before disabling this one.",
          variant: "destructive"
        });
        return;
      }
      setEnabledLanguages(enabledLanguages.filter(lang => lang !== language));
    } else {
      setEnabledLanguages([...enabledLanguages, language]);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="multilingual">
            <Globe className="h-4 w-4 mr-2" />
            Multilingual System
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Users className="h-4 w-4 mr-2" />
            Referral Network
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="multilingual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Languages className="h-5 w-5 mr-2 text-primary" />
                Language Settings
              </CardTitle>
              <CardDescription>
                Configure multilingual support for patient communication and documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-language">Default Language</Label>
                <Select 
                  value={defaultLanguage} 
                  onValueChange={setDefaultLanguage}
                >
                  <SelectTrigger id="default-language">
                    <SelectValue placeholder="Select default language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="mandarin">Mandarin</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The default language will be used for all new patients unless specified otherwise.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Enabled Languages</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="english" 
                      checked={enabledLanguages.includes('english')} 
                      onCheckedChange={() => toggleLanguage('english')}
                    />
                    <Label htmlFor="english" className="font-normal cursor-pointer">English</Label>
                    {defaultLanguage === 'english' && (
                      <Badge className="ml-2 text-xs" variant="outline">Default</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="spanish" 
                      checked={enabledLanguages.includes('spanish')} 
                      onCheckedChange={() => toggleLanguage('spanish')}
                    />
                    <Label htmlFor="spanish" className="font-normal cursor-pointer">Spanish</Label>
                    {defaultLanguage === 'spanish' && (
                      <Badge className="ml-2 text-xs" variant="outline">Default</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="french" 
                      checked={enabledLanguages.includes('french')} 
                      onCheckedChange={() => toggleLanguage('french')}
                    />
                    <Label htmlFor="french" className="font-normal cursor-pointer">French</Label>
                    {defaultLanguage === 'french' && (
                      <Badge className="ml-2 text-xs" variant="outline">Default</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mandarin" 
                      checked={enabledLanguages.includes('mandarin')} 
                      onCheckedChange={() => toggleLanguage('mandarin')}
                    />
                    <Label htmlFor="mandarin" className="font-normal cursor-pointer">Mandarin</Label>
                    {defaultLanguage === 'mandarin' && (
                      <Badge className="ml-2 text-xs" variant="outline">Default</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="arabic" 
                      checked={enabledLanguages.includes('arabic')} 
                      onCheckedChange={() => toggleLanguage('arabic')}
                    />
                    <Label htmlFor="arabic" className="font-normal cursor-pointer">Arabic</Label>
                    {defaultLanguage === 'arabic' && (
                      <Badge className="ml-2 text-xs" variant="outline">Default</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="vietnamese" 
                      checked={enabledLanguages.includes('vietnamese')} 
                      onCheckedChange={() => toggleLanguage('vietnamese')}
                    />
                    <Label htmlFor="vietnamese" className="font-normal cursor-pointer">Vietnamese</Label>
                    {defaultLanguage === 'vietnamese' && (
                      <Badge className="ml-2 text-xs" variant="outline">Default</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium">AI Translation Features</h3>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="auto-translate" 
                    checked={autoTranslateEnabled} 
                    onCheckedChange={(checked) => setAutoTranslateEnabled(checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="auto-translate" className="font-medium cursor-pointer">Automatic Document Translation</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically translate treatment plans, post-op instructions, and consent forms to the patient's preferred language.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="voice-translation" 
                    checked={voiceTranslationEnabled} 
                    onCheckedChange={(checked) => setVoiceTranslationEnabled(checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="voice-translation" className="font-medium cursor-pointer">Real-Time Voice Translation</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable AI-powered real-time translation during patient conversations to facilitate communication.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveLanguageSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Language Settings
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Automated Translation Samples</CardTitle>
              <CardDescription>
                Preview how DentaMind's AI translates dental terminology correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="post-op">
                  <AccordionTrigger>
                    <span className="flex items-center">
                      <FileContent className="h-4 w-4 mr-2" />
                      Post-Operative Instructions
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <Card className="bg-primary/5">
                        <CardHeader className="py-2 px-3">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">English (Original)</div>
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 px-3">
                          <p className="text-sm">
                            Following your extraction procedure, avoid rinsing, spitting, or using a straw for 24 hours. 
                            Apply an ice pack to reduce swelling. Take prescribed pain medication as directed. 
                            If bleeding persists or pain worsens after 48 hours, please contact our office immediately.
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-2 px-3">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">Spanish (AI Translated)</div>
                            <Badge variant="outline" className="text-xs">Translated</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 px-3">
                          <p className="text-sm">
                            Después de su procedimiento de extracción, evite enjuagarse, escupir o usar una pajita durante 24 horas. 
                            Aplique una bolsa de hielo para reducir la hinchazón. Tome los medicamentos para el dolor recetados según las indicaciones. 
                            Si el sangrado persiste o el dolor empeora después de 48 horas, comuníquese con nuestra oficina de inmediato.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="consent-form">
                  <AccordionTrigger>
                    <span className="flex items-center">
                      <FileSignature className="h-4 w-4 mr-2" />
                      Consent Form
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <Card className="bg-primary/5">
                        <CardHeader className="py-2 px-3">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">English (Original)</div>
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 px-3">
                          <p className="text-sm">
                            I understand that root canal therapy is a procedure to retain a tooth which may otherwise require extraction.
                            Although root canal therapy has a high degree of success, it cannot be guaranteed. Occasionally, a tooth that
                            has had root canal therapy may require retreatment, surgery, or even extraction.
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-2 px-3">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">Mandarin (AI Translated)</div>
                            <Badge variant="outline" className="text-xs">Translated</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 px-3">
                          <p className="text-sm">
                            我了解根管治疗是一种保留可能需要拔除的牙齿的程序。尽管根管治疗有很高的成功率，但不能保证成功。
                            偶尔，已经进行过根管治疗的牙齿可能需要重新治疗、手术或甚至拔除。
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="referrals" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Referral Network</h2>
            <Dialog open={newReferralOpen} onOpenChange={setNewReferralOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Referral
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Referral Provider</DialogTitle>
                  <DialogDescription>
                    Add a new specialist to your referral network
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Provider Name *</Label>
                    <Input 
                      id="name" 
                      placeholder="Dr. John Smith"
                      value={newReferral.name}
                      onChange={(e) => setNewReferral({...newReferral, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty *</Label>
                    <Select 
                      value={newReferral.specialty}
                      onValueChange={(value) => setNewReferral({...newReferral, specialty: value})}
                    >
                      <SelectTrigger id="specialty">
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Endodontist">Endodontist</SelectItem>
                        <SelectItem value="Oral Surgeon">Oral Surgeon</SelectItem>
                        <SelectItem value="Periodontist">Periodontist</SelectItem>
                        <SelectItem value="Orthodontist">Orthodontist</SelectItem>
                        <SelectItem value="Prosthodontist">Prosthodontist</SelectItem>
                        <SelectItem value="Pediatric Dentist">Pediatric Dentist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="doctor@example.com"
                        value={newReferral.email}
                        onChange={(e) => setNewReferral({...newReferral, email: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input 
                        id="phone" 
                        placeholder="(555) 123-4567"
                        value={newReferral.phone}
                        onChange={(e) => setNewReferral({...newReferral, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Office Address</Label>
                    <Input 
                      id="address" 
                      placeholder="123 Medical Plaza, Suite 100"
                      value={newReferral.address}
                      onChange={(e) => setNewReferral({...newReferral, address: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Additional information about this provider..."
                      value={newReferral.notes}
                      onChange={(e) => setNewReferral({...newReferral, notes: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="preferred"
                        checked={newReferral.preferred}
                        onCheckedChange={(checked) => setNewReferral({...newReferral, preferred: checked as boolean})}
                      />
                      <Label htmlFor="preferred" className="font-normal cursor-pointer">
                        Preferred Provider
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inNetwork"
                        checked={newReferral.inNetwork}
                        onCheckedChange={(checked) => setNewReferral({...newReferral, inNetwork: checked as boolean})}
                      />
                      <Label htmlFor="inNetwork" className="font-normal cursor-pointer">
                        In-Network Provider
                      </Label>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewReferralOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddReferral}>Add Provider</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>{provider.specialty}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{provider.email}</div>
                          <div>{provider.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {provider.preferred && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Preferred
                            </Badge>
                          )}
                          {provider.inNetwork && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              In-Network
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteReferral(provider.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-primary" />
                AI-Assisted Referral Matching
              </CardTitle>
              <CardDescription>
                DentaMind AI automatically matches patients with the most appropriate specialists
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-md">
                <h3 className="text-sm font-medium mb-2">How AI Matching Works:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Patient's condition is analyzed to determine appropriate specialty</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Insurance coverage is checked to prioritize in-network providers</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Geographic location is considered to minimize patient travel</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Specialist expertise is matched with the specific case complexity</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox id="enable-ai-matching" defaultChecked />
                <div>
                  <Label htmlFor="enable-ai-matching" className="font-medium cursor-pointer">Enable AI-Assisted Referral Matching</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow DentaMind AI to suggest the most appropriate specialists based on the patient's condition and preferences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Custom components for the sample content
const FileContent = ({ className, ...props }: React.ComponentProps<typeof React.Component>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const FileSignature = ({ className, ...props }: React.ComponentProps<typeof React.Component>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M16 18h2" />
    <path d="M8 12h8" />
    <path d="M8 16h4" />
    <path d="M8 20c1.5-1.5 3-1.5 4-1 1.5.6 2 1.5 4 1" />
  </svg>
);