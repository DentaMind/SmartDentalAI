import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Printer, Download, Mail, Clock, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types for post-operative instructions
interface PostOpInstruction {
  id: string;
  procedureId: number;
  procedureName: string;
  appointmentDate: string;
  doctorName: string;
  procedureType: string;
  generalInstructions: string;
  specificInstructions: string[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    purpose: string;
    duration: string;
    specialInstructions?: string;
  }[];
  restrictions: string[];
  followUpRequired: boolean;
  followUpTimeline?: string;
  followUpDetails?: string;
  emergencyContact: string;
  dateCreated: string;
  lastViewed?: string;
}

interface PostOpInstructionsProps {
  patientId: number;
  patientName: string;
}

export function PostOpInstructions({ patientId, patientName }: PostOpInstructionsProps) {
  // Fetch post-operative instructions for this patient
  const { data: instructions, isLoading, error } = useQuery({
    queryKey: ['/api/patients', patientId, 'post-op-instructions'],
    queryFn: () => apiRequest<PostOpInstruction[]>(`/api/patients/${patientId}/post-op-instructions`),
    // Enable stale time and cache time to prevent unnecessary refreshes
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Don't refetch on window focus for patient care instructions that rarely change
    refetchOnWindowFocus: false,
  });

  // Mark an instruction as read
  const markAsRead = async (instructionId: string) => {
    try {
      await apiRequest(`/api/patients/${patientId}/post-op-instructions/${instructionId}/read`, {
        method: 'POST'
      });
      toast({
        title: "Instructions marked as read",
        description: "Your doctor has been notified that you've read these instructions.",
      });
    } catch (error) {
      console.error("Failed to mark instructions as read", error);
      toast({
        title: "Error",
        description: "Could not mark instructions as read. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Print instructions
  const printInstructions = (instruction: PostOpInstruction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }

    // Create a styled document for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>Post-Operative Instructions - ${instruction.procedureName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1, h2, h3 {
              color: #3366CC; /* DentaMind brand blue */
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .clinic-name {
              font-size: 24px;
              font-weight: bold;
            }
            .section {
              margin-bottom: 25px;
            }
            .footer {
              margin-top: 50px;
              font-size: 14px;
              color: #6b7280;
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            ul {
              padding-left: 20px;
            }
            .medication {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 10px;
            }
            .emergency {
              background-color: #fee2e2;
              padding: 15px;
              border-radius: 5px;
              margin-top: 30px;
            }
            @media print {
              body {
                padding: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">DentaMind Dental Clinic</div>
            <div>Post-Operative Instructions</div>
          </div>
          
          <div class="section">
            <h2>Procedure: ${instruction.procedureName}</h2>
            <p>Date: ${new Date(instruction.appointmentDate).toLocaleDateString()}</p>
            <p>Doctor: ${instruction.doctorName}</p>
          </div>
          
          <div class="section">
            <h3>General Instructions</h3>
            <p>${instruction.generalInstructions}</p>
          </div>
          
          <div class="section">
            <h3>Specific Instructions</h3>
            <ul>
              ${instruction.specificInstructions.map(inst => `<li>${inst}</li>`).join('')}
            </ul>
          </div>
          
          <div class="section">
            <h3>Medications</h3>
            ${instruction.medications.map(med => `
              <div class="medication">
                <strong>${med.name}</strong> - ${med.dosage}<br>
                Take: ${med.frequency}<br>
                Purpose: ${med.purpose}<br>
                Duration: ${med.duration}
                ${med.specialInstructions ? `<br>Note: ${med.specialInstructions}` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <h3>Restrictions</h3>
            <ul>
              ${instruction.restrictions.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
          
          ${instruction.followUpRequired ? `
            <div class="section">
              <h3>Follow Up</h3>
              <p>${instruction.followUpTimeline}</p>
              <p>${instruction.followUpDetails || ''}</p>
            </div>
          ` : ''}
          
          <div class="emergency">
            <h3>Emergency Contact</h3>
            <p>${instruction.emergencyContact}</p>
          </div>
          
          <div class="footer">
            <p>These instructions were provided by DentaMind Dental Clinic.</p>
            <p>If you have any questions, please contact your doctor or the clinic.</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after a slight delay to ensure content is rendered
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Email instructions to the patient
  const emailInstructions = async (instructionId: string) => {
    try {
      await apiRequest(`/api/patients/${patientId}/post-op-instructions/${instructionId}/email`, {
        method: 'POST'
      });
      toast({
        title: "Instructions emailed",
        description: "The post-operative instructions have been sent to your email.",
      });
    } catch (error) {
      console.error("Failed to email instructions", error);
      toast({
        title: "Error",
        description: "Could not email instructions. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !instructions) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">
          An error occurred while loading post-operative instructions.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (instructions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <div className="bg-opacity-10 bg-[var(--dentamind-blue)] text-[var(--dentamind-blue)] p-3 rounded-full mb-4">
          <Clock className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium">No Post-Operative Instructions</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          You don't have any post-operative instructions yet. After a procedure, your dentist 
          will provide detailed instructions that will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Post-Operative Instructions</h2>
          <p className="text-muted-foreground">
            Important care instructions following your dental procedures
          </p>
        </div>
      </div>

      <Tabs defaultValue={instructions[0].id} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap border-b bg-transparent p-0">
          {instructions.map(instruction => (
            <TabsTrigger 
              key={instruction.id}
              value={instruction.id}
              className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2 data-[state=active]:shadow-none"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{instruction.procedureName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(instruction.appointmentDate).toLocaleDateString()}
                </span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {instructions.map(instruction => (
          <TabsContent key={instruction.id} value={instruction.id} className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{instruction.procedureName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{new Date(instruction.appointmentDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Dr. {instruction.doctorName}</span>
                    
                    {instruction.lastViewed && (
                      <>
                        <span>•</span>
                        <div className="flex items-center text-[var(--dentamind-green)]">
                          <Check className="h-3 w-3 mr-1" />
                          <span>Read on {new Date(instruction.lastViewed).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-[var(--dentamind-blue)] text-[var(--dentamind-blue)] hover:bg-[var(--dentamind-blue)] hover:text-white"
                    onClick={() => printInstructions(instruction)}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-[var(--dentamind-blue)] text-[var(--dentamind-blue)] hover:bg-[var(--dentamind-blue)] hover:text-white"
                    onClick={() => emailInstructions(instruction.id)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">General Instructions</h3>
                      <p className="text-[15px] text-muted-foreground">
                        {instruction.generalInstructions}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Specific Instructions</h3>
                      <ul className="list-disc pl-5 space-y-1 text-[15px] text-muted-foreground">
                        {instruction.specificInstructions.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Medications</h3>
                      <div className="space-y-3">
                        {instruction.medications.map((med, index) => (
                          <div 
                            key={index} 
                            className="bg-muted/50 p-3 rounded-md border border-[var(--dentamind-blue)] border-opacity-10"
                          >
                            <div className="flex justify-between">
                              <h4 className="font-medium">{med.name}</h4>
                              <Badge variant="outline">{med.dosage}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Take: </span>
                                <span>{med.frequency}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Purpose: </span>
                                <span>{med.purpose}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duration: </span>
                                <span>{med.duration}</span>
                              </div>
                              {med.specialInstructions && (
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">Special: </span>
                                  <span>{med.specialInstructions}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Restrictions</h3>
                      <ul className="list-disc pl-5 space-y-1 text-[15px] text-muted-foreground">
                        {instruction.restrictions.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {instruction.followUpRequired && (
                      <>
                        <Separator />
                        
                        <div>
                          <h3 className="font-medium text-lg mb-2">Follow-Up</h3>
                          <div className="bg-opacity-10 bg-[var(--dentamind-blue)] border border-opacity-20 border-[var(--dentamind-blue)] p-4 rounded-md">
                            <p className="font-medium text-[var(--dentamind-blue)]">
                              {instruction.followUpTimeline}
                            </p>
                            {instruction.followUpDetails && (
                              <p className="mt-2 text-[var(--dentamind-blue)] text-opacity-80">
                                {instruction.followUpDetails}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Emergency Contact</h3>
                      <div className="bg-opacity-10 bg-[var(--dentamind-orange)] border border-opacity-20 border-[var(--dentamind-orange)] p-4 rounded-md">
                        <p className="text-[var(--dentamind-orange)] font-medium">
                          {instruction.emergencyContact}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-center">
                      {!instruction.lastViewed && (
                        <Button 
                          onClick={() => markAsRead(instruction.id)}
                          className="bg-[var(--dentamind-blue)] hover:bg-[var(--dentamind-blue-dark)]"
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default PostOpInstructions;