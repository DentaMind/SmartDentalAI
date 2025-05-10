import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BellRing, 
  Calendar, 
  MessageSquare, 
  PieChart, 
  Zap, 
  BarChart3, 
  Users, 
  Mail, 
  Phone, 
  AtSign, 
  BarChart4, 
  PlusCircle, 
  ArrowUpRight, 
  CheckCircle,
  TrendingUp,
  ListChecks,
  Filter,
  Instagram,
  Facebook,
  Linkedin,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AIMarketingSystem() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [campaignType, setCampaignType] = useState('recall');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const { toast } = useToast();
  
  // Mock campaign performance data
  const campaignPerformance = {
    recallRate: 68,
    reactivationRate: 42,
    newPatientConversion: 24,
    caseAcceptance: 78,
    overallROI: 350 // 350%
  };
  
  // Mock campaign list
  const campaigns = [
    {
      id: '1',
      name: 'Spring Cleaning Reminder',
      type: 'Recall',
      status: 'Active',
      audience: 243,
      responses: 167,
      startDate: '2025-03-01',
      endDate: '2025-04-15'
    },
    {
      id: '2',
      name: 'Insurance Benefits Reminder',
      type: 'Treatment',
      status: 'Active',
      audience: 178,
      responses: 103,
      startDate: '2025-02-15',
      endDate: '2025-04-30'
    },
    {
      id: '3',
      name: 'Clear Aligners Promotion',
      type: 'New Patients',
      status: 'Draft',
      audience: 5000,
      responses: 0,
      startDate: '',
      endDate: ''
    },
    {
      id: '4',
      name: 'Patient Reactivation',
      type: 'Reactivation',
      status: 'Active',
      audience: 412,
      responses: 86,
      startDate: '2025-02-01',
      endDate: '2025-05-31'
    },
    {
      id: '5',
      name: 'Teeth Whitening Special',
      type: 'Promotion',
      status: 'Completed',
      audience: 350,
      responses: 215,
      startDate: '2025-01-10',
      endDate: '2025-02-15'
    }
  ];
  
  // Mock patient segments
  const patientSegments = [
    {
      id: 'all',
      name: 'All Patients',
      count: 2450
    },
    {
      id: 'due-recall',
      name: 'Due for Recall',
      count: 386
    },
    {
      id: 'inactive',
      name: 'Inactive (6+ months)',
      count: 512
    },
    {
      id: 'treatment-pending',
      name: 'Treatment Plan Pending',
      count: 178
    },
    {
      id: 'insurance-expiring',
      name: 'Insurance Benefits Expiring',
      count: 143
    },
    {
      id: 'high-value',
      name: 'High Value Patients',
      count: 86
    }
  ];
  
  // Mock ad performance data
  const adPerformance = [
    {
      platform: 'Google Ads',
      clicks: 2340,
      impressions: 45600,
      conversions: 52,
      cost: 1250,
      roi: 320
    },
    {
      platform: 'Facebook',
      clicks: 1860,
      impressions: 35800,
      conversions: 38,
      cost: 950,
      roi: 280
    },
    {
      platform: 'Instagram',
      clicks: 1450,
      impressions: 28500,
      conversions: 26,
      cost: 780,
      roi: 240
    }
  ];
  
  // Create a new campaign
  const handleCreateCampaign = () => {
    toast({
      title: "Campaign created",
      description: "Your AI-optimized campaign has been created and is ready to launch.",
      variant: "default"
    });
  };
  
  // Start a new campaign
  const handleLaunchCampaign = () => {
    toast({
      title: "Campaign launched",
      description: "Your campaign is now active and will automatically engage with patients.",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">AI Marketing Dashboard</h2>
          <p className="text-muted-foreground">
            Optimize patient retention, acquisition, and engagement with AI-driven marketing
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New AI Campaign</DialogTitle>
              <DialogDescription>
                Let AI optimize your marketing campaign for maximum engagement
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input id="campaign-name" placeholder="Enter campaign name" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="campaign-type">Campaign Type</Label>
                <Select
                  value={campaignType}
                  onValueChange={setCampaignType}
                >
                  <SelectTrigger id="campaign-type">
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recall">Patient Recall</SelectItem>
                    <SelectItem value="reactivation">Patient Reactivation</SelectItem>
                    <SelectItem value="treatment">Treatment Acceptance</SelectItem>
                    <SelectItem value="new-patients">New Patient Acquisition</SelectItem>
                    <SelectItem value="promotion">Special Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {campaignType === 'recall' && (
                <div className="p-3 border rounded-md bg-muted">
                  <p className="text-sm font-medium mb-2">Patient Recall Campaign</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Automatically send reminders to patients due for regular check-ups, 
                    cleanings, or follow-up appointments.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="recall-6month" defaultChecked />
                      <label
                        htmlFor="recall-6month"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        6-month hygiene recall
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="recall-missed" defaultChecked />
                      <label
                        htmlFor="recall-missed"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Missed appointment follow-up
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="recall-annual" />
                      <label
                        htmlFor="recall-annual"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Annual x-ray reminder
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              {campaignType === 'treatment' && (
                <div className="p-3 border rounded-md bg-muted">
                  <p className="text-sm font-medium mb-2">Treatment Acceptance Campaign</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Follow up with patients who have unscheduled treatment plans and
                    encourage them to proceed with recommended care.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="treatment-pending" defaultChecked />
                      <label
                        htmlFor="treatment-pending"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Pending treatment plans
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="treatment-insurance" defaultChecked />
                      <label
                        htmlFor="treatment-insurance"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Insurance benefits reminders
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="treatment-financing" />
                      <label
                        htmlFor="treatment-financing"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Financing options promotion
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="target-audience">Target Audience</Label>
                <Select
                  value={selectedSegment}
                  onValueChange={setSelectedSegment}
                >
                  <SelectTrigger id="target-audience">
                    <SelectValue placeholder="Select audience segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientSegments.map(segment => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="delivery-method">Delivery Method</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge className="cursor-pointer bg-primary text-primary-foreground">Email</Badge>
                  <Badge className="cursor-pointer bg-primary text-primary-foreground">SMS</Badge>
                  <Badge className="cursor-pointer bg-muted text-muted-foreground">Phone Call</Badge>
                  <Badge className="cursor-pointer bg-muted text-muted-foreground">Direct Mail</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  AI will optimize delivery based on patient preferences and response rates
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="schedule">Campaign Schedule</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs mb-1">Start Date</p>
                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <p className="text-xs mb-1">End Date</p>
                    <Input type="date" />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline">Save as Draft</Button>
              <Button onClick={handleCreateCampaign}>
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-auto md:inline-flex">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <BellRing className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <PieChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="automations">
            <Zap className="h-4 w-4 mr-2" />
            Automations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Patient Recall Rate</CardTitle>
                  <Badge 
                    className="bg-green-50 text-green-700 border-green-200 flex items-center"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 space-y-4">
                  <p className="text-3xl font-bold">{campaignPerformance.recallRate}%</p>
                  <Progress value={campaignPerformance.recallRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Percentage of patients who scheduled their recall appointment
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Case Acceptance</CardTitle>
                  <Badge 
                    className="bg-green-50 text-green-700 border-green-200 flex items-center"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 space-y-4">
                  <p className="text-3xl font-bold">{campaignPerformance.caseAcceptance}%</p>
                  <Progress value={campaignPerformance.caseAcceptance} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Percentage of treatment plans accepted after AI follow-up
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Marketing ROI</CardTitle>
                  <Badge 
                    className="bg-green-50 text-green-700 border-green-200 flex items-center"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 space-y-4">
                  <p className="text-3xl font-bold">{campaignPerformance.overallROI}%</p>
                  <Progress value={Math.min(campaignPerformance.overallROI / 5, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Return on investment for all marketing activities
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>
                  Performance metrics for all active campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">Campaign performance graph would appear here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Impact</CardTitle>
                <CardDescription>
                  Revenue attributed to marketing efforts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm">Recall Appointments</div>
                      <div className="text-sm font-medium">$28,450</div>
                    </div>
                    <Progress value={58} className="h-1" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm">Treatment Acceptance</div>
                      <div className="text-sm font-medium">$42,875</div>
                    </div>
                    <Progress value={87} className="h-1" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm">New Patients</div>
                      <div className="text-sm font-medium">$36,120</div>
                    </div>
                    <Progress value={74} className="h-1" />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="font-medium">Total Revenue Impact</div>
                    <div className="font-bold">$107,445</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Ad Performance</CardTitle>
                <CardDescription>
                  Results from digital advertising campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Conversions</TableHead>
                      <TableHead>Spend</TableHead>
                      <TableHead>ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adPerformance.map((ad) => (
                      <TableRow key={ad.platform}>
                        <TableCell className="font-medium">{ad.platform}</TableCell>
                        <TableCell>{ad.clicks.toLocaleString()}</TableCell>
                        <TableCell>{ad.conversions}</TableCell>
                        <TableCell>${ad.cost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {ad.roi}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>
                  Smart suggestions to optimize marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2 bg-muted/30 p-3 rounded-md">
                    <div className="flex-shrink-0 mt-0.5 text-amber-500">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Increase email frequency for recall patients</p>
                      <p className="text-xs text-muted-foreground">
                        Testing shows 3 reminders increase response rate by 24%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 bg-muted/30 p-3 rounded-md">
                    <div className="flex-shrink-0 mt-0.5 text-amber-500">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Optimize Google Ads targeting</p>
                      <p className="text-xs text-muted-foreground">
                        Adjust demographic targeting to focus on 30-45 age group
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 bg-muted/30 p-3 rounded-md">
                    <div className="flex-shrink-0 mt-0.5 text-amber-500">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Add SMS reminder for insurance benefits</p>
                      <p className="text-xs text-muted-foreground">
                        End-of-year benefits expiring for 143 patients
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Apply All Recommendations
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Filter:</Label>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search campaigns..." 
                className="pl-8 max-w-xs"
              />
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.type}</TableCell>
                      <TableCell>{campaign.audience.toLocaleString()}</TableCell>
                      <TableCell>
                        {campaign.status !== 'Draft' ? (
                          <div>
                            <span className="font-medium">{campaign.responses.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({Math.round((campaign.responses / campaign.audience) * 100)}%)
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            campaign.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                            campaign.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-muted text-muted-foreground'
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.status !== 'Draft' ? (
                          <div className="text-xs">
                            <div>{new Date(campaign.startDate).toLocaleDateString()} -</div>
                            <div>{new Date(campaign.endDate).toLocaleDateString()}</div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {campaign.status === 'Draft' && (
                            <Button size="sm" onClick={handleLaunchCampaign}>Launch</Button>
                          )}
                          {campaign.status === 'Active' && (
                            <Button size="sm" variant="outline">Pause</Button>
                          )}
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Target Audiences</CardTitle>
                <CardDescription>
                  Patient segments for targeted campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientSegments.map(segment => (
                    <div key={segment.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{segment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {segment.id === 'due-recall' && 'Patients due for hygiene appointment'}
                          {segment.id === 'inactive' && 'No visits in the last 6+ months'}
                          {segment.id === 'treatment-pending' && 'Proposed treatment not scheduled'}
                          {segment.id === 'insurance-expiring' && 'Benefits expiring within 60 days'}
                          {segment.id === 'high-value' && 'Patients with treatment over $1,000'}
                          {segment.id === 'all' && 'Total patient database'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-medium">{segment.count.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">patients</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Target
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Campaign Templates</CardTitle>
                <CardDescription>
                  Pre-built templates for common marketing campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-muted/30 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Patient Recall</div>
                      <Badge variant="outline">High Performance</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Multi-channel campaign to bring patients back for routine visits
                    </p>
                    <Button size="sm" variant="outline">Use Template</Button>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Insurance Benefits Reminder</div>
                      <Badge variant="outline">High ROI</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Reminds patients to use their insurance before year-end
                    </p>
                    <Button size="sm" variant="outline">Use Template</Button>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">New Patient Special</div>
                      <Badge variant="outline">Growth</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Promotional campaign to attract new patients
                    </p>
                    <Button size="sm" variant="outline">Use Template</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Patient Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 space-y-2">
                  <p className="text-3xl font-bold">87%</p>
                  <p className="text-sm text-green-600 font-medium">↑ 3.5% vs. Last Year</p>
                  <p className="text-xs text-muted-foreground">
                    Percentage of active patients retained over 12 months
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">New Patient Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 space-y-2">
                  <p className="text-3xl font-bold">152</p>
                  <p className="text-sm text-green-600 font-medium">↑ 12.8% vs. Last Quarter</p>
                  <p className="text-xs text-muted-foreground">
                    New patients acquired in the last 90 days
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Marketing Spend per Patient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 space-y-2">
                  <p className="text-3xl font-bold">$38.75</p>
                  <p className="text-sm text-green-600 font-medium">↓ 8.2% vs. Last Quarter</p>
                  <p className="text-xs text-muted-foreground">
                    Average marketing cost per active patient
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>
                Effectiveness of different communication channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Email</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm font-medium">32.8%</span>
                        <span className="text-xs ml-1 text-muted-foreground">open rate</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">12.4%</span>
                        <span className="text-xs ml-1 text-muted-foreground">click rate</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">8.6%</span>
                        <span className="text-xs ml-1 text-muted-foreground">conversion</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={32.8} className="h-1" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-green-500" />
                      <span>SMS</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm font-medium">98.5%</span>
                        <span className="text-xs ml-1 text-muted-foreground">delivery</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">42.2%</span>
                        <span className="text-xs ml-1 text-muted-foreground">response</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">18.3%</span>
                        <span className="text-xs ml-1 text-muted-foreground">conversion</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={42.2} className="h-1" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <AtSign className="h-4 w-4 mr-2 text-purple-500" />
                      <span>Social Media</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm font-medium">12,450</span>
                        <span className="text-xs ml-1 text-muted-foreground">reach</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">3.8%</span>
                        <span className="text-xs ml-1 text-muted-foreground">engagement</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">2.4%</span>
                        <span className="text-xs ml-1 text-muted-foreground">conversion</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={24} className="h-1" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
                <CardDescription>
                  Patient age and gender distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">Demographics chart would appear here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Procedure Revenue</CardTitle>
                <CardDescription>
                  Revenue by procedure type from marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">Revenue chart would appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="automations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search automations..." 
                className="pl-8 max-w-xs"
              />
            </div>
            
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Automations</CardTitle>
              <CardDescription>
                AI-powered automated marketing sequences
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Automation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Appointment Reminder</TableCell>
                    <TableCell>Recall</TableCell>
                    <TableCell>7 days before appointment</TableCell>
                    <TableCell>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">92.4%</span>
                        <Progress value={92.4} className="h-2 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Treatment Follow-up</TableCell>
                    <TableCell>Treatment</TableCell>
                    <TableCell>3 days after proposal</TableCell>
                    <TableCell>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">78.3%</span>
                        <Progress value={78.3} className="h-2 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">New Patient Welcome</TableCell>
                    <TableCell>Onboarding</TableCell>
                    <TableCell>New patient creation</TableCell>
                    <TableCell>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">97.1%</span>
                        <Progress value={97.1} className="h-2 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Insurance Expiration</TableCell>
                    <TableCell>Insurance</TableCell>
                    <TableCell>60 days before year-end</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                        Paused
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">82.5%</span>
                        <Progress value={82.5} className="h-2 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Birthday Greeting</TableCell>
                    <TableCell>Engagement</TableCell>
                    <TableCell>On patient birthday</TableCell>
                    <TableCell>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">89.7%</span>
                        <Progress value={89.7} className="h-2 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Automation</CardTitle>
                <CardDescription>
                  AI-powered social media posting and engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center">
                      <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="font-medium">Facebook</span>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center">
                      <Instagram className="h-5 w-5 mr-2 text-pink-600" />
                      <span className="font-medium">Instagram</span>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center">
                      <Linkedin className="h-5 w-5 mr-2 text-blue-800" />
                      <span className="font-medium">LinkedIn</span>
                    </div>
                    <Button size="sm" variant="outline">Connect</Button>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Auto-Posting Schedule</div>
                      <Badge>Active</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Educational Content</span>
                        <span>Tuesdays, 10:00 AM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Patient Testimonials</span>
                        <span>Thursdays, 2:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Promotional Posts</span>
                        <span>Saturdays, 9:00 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Library</CardTitle>
                <CardDescription>
                  AI-managed content for marketing campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/30 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Email Templates</div>
                      <Badge variant="outline">12 Templates</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Pre-designed templates for email campaigns
                    </p>
                    <Button size="sm" variant="outline">Manage</Button>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Social Media Content</div>
                      <Badge variant="outline">36 Posts</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Ready-to-use social media posts and graphics
                    </p>
                    <Button size="sm" variant="outline">Manage</Button>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Patient Educational Content</div>
                      <Badge variant="outline">24 Articles</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Educational content for patient education
                    </p>
                    <Button size="sm" variant="outline">Manage</Button>
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