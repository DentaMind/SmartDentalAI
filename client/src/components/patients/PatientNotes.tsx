import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import AutoNotesManager from './notes/AutoNotesManager';
import { PatientNotesList } from './notes/PatientNotesList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, FileText, PenLine } from 'lucide-react';

interface PatientNotesProps {
  patientId: number;
  patientName?: string;
}

export function PatientNotes({ patientId, patientName }: PatientNotesProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('view');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger refresh of the notes list
  const handleNotePosted = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('view'); // Switch to view tab after posting
  };

  // Check if user has provider role (doctor, dentist, etc.)
  const isProvider = user?.role === 'doctor' || user?.role === 'dentist' || user?.role === 'provider';

  return (
    <Card className="min-h-[600px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Clinical Notes</CardTitle>
            <CardDescription>
              {patientName 
                ? `Notes and documentation for ${patientName}` 
                : 'Patient clinical documentation'}
            </CardDescription>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList>
            <TabsTrigger value="view">
              <FileText className="h-4 w-4 mr-2" />
              View Notes
            </TabsTrigger>
            {isProvider && (
              <TabsTrigger value="create">
                <PenLine className="h-4 w-4 mr-2" />
                Create Note
              </TabsTrigger>
            )}
            {isProvider && (
              <TabsTrigger value="ai">
                <Brain className="h-4 w-4 mr-2" />
                AI Assist
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} className="mt-6">
          <TabsContent value="view" className="mt-0">
            <PatientNotesList 
              patientId={patientId} 
              userRole={user?.role} 
              key={`notes-list-${refreshTrigger}`} // Force refresh when needed
            />
          </TabsContent>
          
          {isProvider && (
            <TabsContent value="create" className="mt-0">
              <AutoNotesManager 
                patientId={patientId} 
                providerId={user?.id}
                onNotePosted={handleNotePosted}
              />
            </TabsContent>
          )}
          
          {isProvider && (
            <TabsContent value="ai" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Assisted Documentation</CardTitle>
                  <CardDescription>
                    Generate and analyze clinical notes with AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm">
                      The DentaMind AI can analyze patient data from various sources to generate 
                      comprehensive notes, identify trends, and suggest documentation improvements.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted/50"
                        onClick={() => {
                          setActiveTab('create');
                          // Let the AutoNotesManager handle the AI generation
                        }}
                      >
                        <Brain className="h-8 w-8 mb-2 text-primary" />
                        <h3 className="font-medium">Generate SOAP Note</h3>
                        <p className="text-sm text-muted-foreground text-center mt-1">
                          Create structured SOAP-format clinical note
                        </p>
                      </button>
                      
                      <button 
                        className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted/50"
                        onClick={() => {
                          setActiveTab('create');
                          // Let the AutoNotesManager handle the AI generation
                        }}
                      >
                        <FileText className="h-8 w-8 mb-2 text-primary" />
                        <h3 className="font-medium">Comprehensive Exam</h3>
                        <p className="text-sm text-muted-foreground text-center mt-1">
                          Generate a thorough exam note with findings
                        </p>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}