import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFormattedDate } from '@/lib/notes';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  // Add other patient properties as needed
}

interface Note {
  id: number;
  content: string;
  createdAt: string;
  category: string;
  doctorId: number;
  // Add other note properties as needed
}

interface PatientContextType {
  patient: Patient | null;
  notes: Note[];
  loading: boolean;
  error: string | null;
  addNote: (content: string, category?: string) => Promise<void>;
  updatePatientNotes: (content: string) => void;
  refreshNotes: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{
  patientId: number;
  children: React.ReactNode;
}> = ({ patientId, children }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Format note content with date
  const formatNoteContent = (content: string): string => {
    return `[${getFormattedDate()}] ${content}`;
  };

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient data');
        }
        
        const data = await response.json();
        setPatient(data);
        
        // Fetch notes after patient is loaded
        await fetchNotes();
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient data');
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId, toast]);

  // Fetch patient notes
  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/notes`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient notes');
      }
      
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load patient notes');
      toast({
        title: "Error",
        description: "Failed to load patient notes",
        variant: "destructive",
      });
    }
  };

  // Add a new note
  const addNote = async (content: string, category = 'general') => {
    try {
      const formattedContent = formatNoteContent(content);
      
      const response = await fetch(`/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formattedContent,
          category,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add note');
      }
      
      const data = await response.json();
      
      // Update notes in state
      setNotes(prevNotes => [data.note, ...prevNotes]);
      
      toast({
        title: "Note added",
        description: "Patient note has been added successfully",
      });
    } catch (err) {
      console.error('Error adding note:', err);
      toast({
        title: "Error",
        description: "Failed to add patient note",
        variant: "destructive",
      });
    }
  };

  // Update patient notes (used for integrating with charts)
  const updatePatientNotes = (content: string) => {
    // Add the note (could be batched or debounced in a real implementation)
    addNote(content, 'chart_update');
  };

  // Refresh notes data
  const refreshNotes = async () => {
    setLoading(true);
    await fetchNotes();
    setLoading(false);
  };

  return (
    <PatientContext.Provider
      value={{
        patient,
        notes,
        loading,
        error,
        addNote,
        updatePatientNotes,
        refreshNotes,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

// Custom hook to use the patient context
export const usePatientContext = () => {
  const context = useContext(PatientContext);
  
  if (context === undefined) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  
  return context;
};