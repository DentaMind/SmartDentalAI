import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { HelpCircle, X, MinusCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

interface AiAssistantProps {
  contextType?: 'patient' | 'staff' | 'provider';
  initialSuggestions?: string[];
}

// Sample assistant responses
const assistantResponses = {
  patient: {
    requestAppointment: "To request an appointment, go to the Appointments tab and click on 'Request New Appointment'. You'll need to provide your preferred dates and details about the visit.",
    insuranceVerification: "Your insurance will be verified when you request an appointment. Make sure your insurance information is up to date in your profile settings.",
    viewRecords: "You can view your dental records, including x-rays and treatment history, in the Records section under your patient profile.",
    paymentOptions: "We offer various payment options including credit card, bank transfer, and payment plans for larger procedures. You can manage your payment preferences in the Billing section.",
    contactStaff: "You can message our staff directly through the Messages tab in the navigation menu. Messages are typically answered within 1 business day.",
  },
  staff: {
    managePatients: "To add a new patient, go to the Patients section and click 'Add Patient'. You'll need their basic information, contact details, and insurance information.",
    scheduleAppointment: "In the Calendar view, you can click on any open time slot to schedule a new appointment. Make sure to verify the patient's insurance before confirming.",
    processPayment: "Process patient payments in the Billing section. Select the patient, enter the amount, and choose the payment method. All transactions are securely recorded.",
    insuranceClaim: "To submit an insurance claim, go to the Insurance section, select the patient and procedure, then click 'Submit Claim'. The system will automatically prepare the necessary documentation.",
    timeClockSystem: "Use the Time Clock tab to clock in at the beginning of your shift and clock out when you leave. Make sure to select the correct location when clocking in.",
  },
  provider: {
    reviewCases: "Review upcoming patient cases in the Dashboard. Click on a patient's name to see their complete dental history, including previous treatments and x-rays.",
    updateTreatmentPlan: "Modify a patient's treatment plan in their profile under the Treatment Plans tab. You can add procedures, update costs, and set priorities.",
    aiDiagnostics: "For AI assistance with diagnostics, upload patient x-rays or images to the AI Analysis tool in the Diagnostics section.",
    manageSchedule: "Manage your availability in the Calendar Settings. You can set regular hours, block off time for specific procedures, or mark days as unavailable.",
    performProcedures: "Record procedure details in the patient's chart immediately after completion. This information will automatically update their treatment plan and billing.",
  }
};

export function AIAssistant({ contextType = 'patient', initialSuggestions = [] }: AiAssistantProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState("");
  const [conversation, setConversation] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);

  // Create initial greeting based on time of day and user
  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = "Good ";
    if (hour < 12) greeting += "morning";
    else if (hour < 18) greeting += "afternoon";
    else greeting += "evening";
    
    if (user) {
      greeting += `, ${user.firstName}! I'm your dental AI assistant. How can I help you today?`;
    } else {
      greeting += "! I'm your dental AI assistant. How can I help you today?";
    }

    setConversation([{role: 'assistant', content: greeting}]);
    
    // Set default suggestions based on context
    if (initialSuggestions.length === 0) {
      if (contextType === 'patient') {
        setSuggestions([
          "How do I request an appointment?",
          "How does insurance verification work?",
          "How can I view my dental records?",
        ]);
      } else if (contextType === 'staff') {
        setSuggestions([
          "How do I add a new patient?",
          "How do I process a payment?",
          "How do I use the time clock system?",
        ]);
      } else {
        setSuggestions([
          "How do I review patient cases?",
          "How do I update a treatment plan?",
          "How do I use the AI diagnostics?",
        ]);
      }
    }
  }, [user, contextType, initialSuggestions]);

  const handleSendMessage = () => {
    if (!query.trim()) return;
    
    // Add user message to conversation
    setConversation(prev => [...prev, {role: 'user', content: query}]);
    
    // Generate a response based on the query
    setTimeout(() => {
      let response = "I'm sorry, I don't have specific information about that. Please contact our office for more details.";
      
      // Simple keyword matching for demo purposes
      const lowerQuery = query.toLowerCase();
      if (contextType === 'patient') {
        if (lowerQuery.includes('appointment')) {
          response = assistantResponses.patient.requestAppointment;
        } else if (lowerQuery.includes('insurance')) {
          response = assistantResponses.patient.insuranceVerification;
        } else if (lowerQuery.includes('record') || lowerQuery.includes('history')) {
          response = assistantResponses.patient.viewRecords;
        } else if (lowerQuery.includes('pay') || lowerQuery.includes('bill')) {
          response = assistantResponses.patient.paymentOptions;
        } else if (lowerQuery.includes('contact') || lowerQuery.includes('message')) {
          response = assistantResponses.patient.contactStaff;
        }
      } else if (contextType === 'staff') {
        if (lowerQuery.includes('patient') && (lowerQuery.includes('add') || lowerQuery.includes('new'))) {
          response = assistantResponses.staff.managePatients;
        } else if (lowerQuery.includes('appointment') || lowerQuery.includes('schedule')) {
          response = assistantResponses.staff.scheduleAppointment;
        } else if (lowerQuery.includes('payment') || lowerQuery.includes('bill')) {
          response = assistantResponses.staff.processPayment;
        } else if (lowerQuery.includes('insurance') || lowerQuery.includes('claim')) {
          response = assistantResponses.staff.insuranceClaim;
        } else if (lowerQuery.includes('clock') || lowerQuery.includes('time')) {
          response = assistantResponses.staff.timeClockSystem;
        }
      } else {
        if (lowerQuery.includes('case') || lowerQuery.includes('review')) {
          response = assistantResponses.provider.reviewCases;
        } else if (lowerQuery.includes('treatment') || lowerQuery.includes('plan')) {
          response = assistantResponses.provider.updateTreatmentPlan;
        } else if (lowerQuery.includes('ai') || lowerQuery.includes('diagnos')) {
          response = assistantResponses.provider.aiDiagnostics;
        } else if (lowerQuery.includes('schedule') || lowerQuery.includes('availab')) {
          response = assistantResponses.provider.manageSchedule;
        } else if (lowerQuery.includes('procedure') || lowerQuery.includes('record')) {
          response = assistantResponses.provider.performProcedures;
        }
      }
      
      // Add assistant response to conversation
      setConversation(prev => [...prev, {role: 'assistant', content: response}]);
    }, 800);
    
    setQuery("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setConversation(prev => [...prev, {role: 'user', content: suggestion}]);
    
    // Generate a response based on the suggestion
    setTimeout(() => {
      let response = "I don't have an answer for that specific question yet.";
      
      if (suggestion === "How do I request an appointment?") {
        response = assistantResponses.patient.requestAppointment;
      } else if (suggestion === "How does insurance verification work?") {
        response = assistantResponses.patient.insuranceVerification;
      } else if (suggestion === "How can I view my dental records?") {
        response = assistantResponses.patient.viewRecords;
      } else if (suggestion === "How do I add a new patient?") {
        response = assistantResponses.staff.managePatients;
      } else if (suggestion === "How do I process a payment?") {
        response = assistantResponses.staff.processPayment;
      } else if (suggestion === "How do I use the time clock system?") {
        response = assistantResponses.staff.timeClockSystem;
      } else if (suggestion === "How do I review patient cases?") {
        response = assistantResponses.provider.reviewCases;
      } else if (suggestion === "How do I update a treatment plan?") {
        response = assistantResponses.provider.updateTreatmentPlan;
      } else if (suggestion === "How do I use the AI diagnostics?") {
        response = assistantResponses.provider.aiDiagnostics;
      }
      
      setConversation(prev => [...prev, {role: 'assistant', content: response}]);
    }, 800);
    
    setQuery("");
    
    // Update suggestions based on the context
    if (contextType === 'patient') {
      setSuggestions([
        "How do I pay my bill?",
        "How can I message the staff?",
        "What should I do before my appointment?",
      ]);
    } else if (contextType === 'staff') {
      setSuggestions([
        "How do I submit an insurance claim?",
        "How do I schedule an appointment?",
        "How do I reset a patient's password?",
      ]);
    } else {
      setSuggestions([
        "How do I manage my schedule?",
        "How do I record procedure details?",
        "How do I view patient insurance information?",
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex justify-end"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="rounded-full w-14 h-14 flex items-center justify-center bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Sparkles className="h-6 w-6 text-white" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={`w-80 shadow-lg ${isMinimized ? 'h-auto' : 'h-[32rem]'}`}>
              <CardHeader className="bg-primary text-white p-3 flex flex-row items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="font-medium">Dental AI Assistant</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-white hover:bg-primary-foreground/20"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <ChevronUp className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-white hover:bg-primary-foreground/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {!isMinimized && (
                <>
                  <CardContent className="p-3 max-h-[21rem] overflow-y-auto flex flex-col space-y-3">
                    {conversation.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] p-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <div className="p-3 border-t">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Textarea 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask a question..."
                        className="resize-none h-9 min-h-[2.25rem] py-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        className="px-3"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}