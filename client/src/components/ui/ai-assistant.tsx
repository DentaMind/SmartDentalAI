import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient"; 
import { Bot, ChevronDown, ChevronUp, Sparkles, X, Send, Lightbulb, Wand2 } from "lucide-react";

interface AiAssistantProps {
  contextType?: 'patient' | 'staff' | 'provider';
  initialSuggestions?: string[];
}

export function AIAssistant({ contextType = 'patient', initialSuggestions = [] }: AiAssistantProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [firstExpand, setFirstExpand] = useState(true);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Generate greeting on first expand
  useEffect(() => {
    if (isExpanded && firstExpand && messages.length === 0) {
      setFirstExpand(false);
      generateInitialGreeting();
    }
  }, [isExpanded, firstExpand, messages]);

  // Get dynamic greeting based on user role
  const generateInitialGreeting = () => {
    let greeting = "";
    let name = user?.firstName || "there";
    
    switch(contextType) {
      case 'patient':
        greeting = `Hi ${name}! I'm your dental care assistant. I can help you navigate your care plan, explain procedures, or schedule appointments. How can I assist you today?`;
        break;
      case 'staff':
        greeting = `Hello ${name}! I'm your practice assistant. I can help with scheduling, patient records, insurance verification, or system navigation. What do you need help with?`;
        break;
      case 'provider':
        greeting = `Welcome, Dr. ${name}! I'm your clinical assistant. I can help with treatment planning, diagnostic suggestions, or practice management. What would you like assistance with?`;
        break;
      default:
        greeting = `Hello ${name}! I'm your DentaMind assistant. How can I help you today?`;
    }
    
    setIsTyping(true);
    simulateTyping(greeting, 'assistant');
  };

  // Simulate typing effect
  const simulateTyping = (text: string, role: 'user' | 'assistant') => {
    setIsTyping(true);
    
    // Add message with typing effect
    setTimeout(() => {
      setMessages(prev => [...prev, { role, content: text }]);
      setIsTyping(false);
      
      // Generate suggestions after assistant responds
      if (role === 'assistant') {
        generateSuggestions();
      }
    }, 500 + Math.min(text.length * 10, 1500)); // Typing speed based on message length
  };

  // Generate contextual suggestions
  const generateSuggestions = () => {
    // If initialSuggestions were provided and this is first response, use those
    if (initialSuggestions.length > 0 && messages.length <= 1) {
      setSuggestions(initialSuggestions);
      return;
    }
    
    // Otherwise generate contextual suggestions based on conversation
    const contextualSuggestions: Record<string, string[]> = {
      patient: [
        "How do I book an appointment?",
        "Can you explain my treatment plan?",
        "What should I do after my procedure?",
        "How can I update my insurance?",
      ],
      staff: [
        "How do I check in a patient?",
        "How can I verify insurance coverage?",
        "Where do I find patient records?",
        "How do I use the time clock?",
      ],
      provider: [
        "How do I access patient history?",
        "Can you show me recent imaging studies?",
        "How do I create a treatment plan?",
        "Where are the practice analytics?"
      ]
    };
    
    // Get suggestions based on context type
    const defaultSuggestions = contextualSuggestions[contextType] || contextualSuggestions.patient;
    
    // Randomize which suggestions to show
    const shuffled = [...defaultSuggestions].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 3));
  };

  // Handle user sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Use AI to generate response
    try {
      setIsTyping(true);
      
      // In a real implementation, this would be an API call to our AI service
      // For now we'll simulate a response
      const aiResponse = await simulateAIResponse(userMessage);
      
      simulateTyping(aiResponse, 'assistant');
    } catch (error) {
      setIsTyping(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to get a response. Please try again.",
      });
    }
  };

  // Simulate AI response (in a real app, this would call to an AI API)
  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Simplified simulation of AI response based on context and user message
    const lowerCaseMessage = userMessage.toLowerCase();
    
    // Context-aware responses
    if (lowerCaseMessage.includes('appointment')) {
      return "To schedule an appointment, you can use the Appointments tab in the navigation menu. From there, you can see available slots and select a time that works for you. Would you like me to walk you through the process?";
    } else if (lowerCaseMessage.includes('treatment') || lowerCaseMessage.includes('procedure')) {
      return "Your treatment plan details can be found in the Treatment Plans section. It includes procedure information, estimated costs, and timeline. I can help explain specific procedures if you'd like more information.";
    } else if (lowerCaseMessage.includes('insurance')) {
      return "Insurance information can be updated in your profile settings. We currently have your insurance provider on file. Would you like to verify your coverage for a specific procedure?";
    } else if (lowerCaseMessage.includes('clock in') || lowerCaseMessage.includes('time clock')) {
      return "The time clock feature is available in the Time Clock section. You can clock in/out, view your hours, and see reports. Let me know if you need help with specific features!";
    } else if (lowerCaseMessage.includes('plan') && contextType === 'provider') {
      return "You can create a comprehensive treatment plan using our AI-assisted planning tool. Go to the patient's record, select 'Create Treatment Plan', and you'll be guided through the process with intelligent suggestions based on the patient's history and diagnostic information.";
    }
    
    // Generic responses based on context type
    if (contextType === 'patient') {
      return "I understand you're asking about your dental care. The DentaMind platform gives you access to all your records, upcoming appointments, and treatment plans. Is there a specific part of your care you'd like help with?";
    } else if (contextType === 'staff') {
      return "As a staff member, you have access to patient management, appointment scheduling, and billing functions. I can help you navigate any of these areas more effectively. What specifically are you working on today?";
    } else {
      return "As a provider, you have access to our complete suite of AI-powered diagnostic and treatment planning tools. I can help you leverage these features to improve patient outcomes. Would you like me to explain a specific feature in more detail?";
    }
  };

  // Handle clicking a suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSendMessage();
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Minimized version */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Button
              onClick={() => setIsExpanded(true)}
              className="rounded-full w-14 h-14 shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90"
            >
              <Bot className="h-7 w-7 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded chat window */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 w-80 md:w-96 h-[520px] bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden border border-border"
          >
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between bg-primary text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <h3 className="font-medium">DentaMind AI Assistant</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => setIsExpanded(false)}
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => {
                    setMessages([]);
                    setFirstExpand(true);
                    setIsExpanded(false);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-2 max-w-[90%]",
                    message.role === "user" ? "ml-auto" : "mr-auto"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "py-2 px-3 rounded-lg",
                      message.role === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-white border rounded-tl-none"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <div className="text-gray-600 text-sm font-medium">
                        {user?.firstName?.charAt(0) || "U"}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 max-w-[90%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="py-3 px-4 rounded-lg bg-white border rounded-tl-none flex items-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !isTyping && (
              <div className="p-2 pt-0 grid grid-cols-1 gap-2 bg-gray-50 border-t">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start text-sm whitespace-normal h-auto py-1.5 px-3 text-left"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Lightbulb className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-primary" />
                    <span className="truncate">{suggestion}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="flex-shrink-0 bg-primary text-white hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}