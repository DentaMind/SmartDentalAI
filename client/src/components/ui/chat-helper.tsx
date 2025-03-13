import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  X, 
  Send, 
  User, 
  MoveUpRight,
  Calendar,
  FileText,
  Users,
  ClipboardList,
  CreditCard,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocation } from 'wouter';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export function ChatHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your SmartDentalAI assistant. How can I help you with DentaMind today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const navigate = useNavigate();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Process the message and generate a response
    setTimeout(() => {
      const response = generateResponse(input);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If there's a navigation action, perform it
      if (response.action === 'navigate' && response.path) {
        navigate(response.path);
      }
    }, 800);
  };

  const generateResponse = (message: string): { text: string; action?: string; path?: string } => {
    const lowerMessage = message.toLowerCase();
    
    // Check for navigation intents
    if (lowerMessage.includes('patient') || lowerMessage.includes('patients')) {
      return {
        text: 'I can help you with patients. Would you like to view the patients list or add a new patient?',
        action: 'navigate',
        path: '/patients'
      };
    } else if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
      return {
        text: 'Let me take you to the appointments page where you can view or manage appointments.',
        action: 'navigate',
        path: '/appointments'
      };
    } else if (lowerMessage.includes('chart') || lowerMessage.includes('dental chart') || lowerMessage.includes('perio')) {
      return {
        text: 'The patient profile page contains the dental charts, including periodontal and restorative charts. Would you like to view a specific patient?',
        action: 'navigate',
        path: '/patients'
      };
    } else if (lowerMessage.includes('treatment') || lowerMessage.includes('plan')) {
      return {
        text: 'You can view and manage treatment plans on the treatment plans page.',
        action: 'navigate',
        path: '/treatment-plans'
      };
    } else if (lowerMessage.includes('billing') || lowerMessage.includes('payment')) {
      return {
        text: 'I can help you with billing and payments. Let me take you to the billing page.',
        action: 'navigate',
        path: '/billing'
      };
    }
    
    // Default responses if no specific intent was recognized
    const defaultResponses = [
      'I can help you navigate through DentaMind. What specific area are you interested in?',
      'Would you like assistance with patients, appointments, charts, treatments, or billing?',
      'Feel free to ask me about specific features or how to perform certain tasks in DentaMind.',
      'I can help you find information or navigate to different parts of the application. What are you looking for?'
    ];
    
    return {
      text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const QuickOptions = () => {
    const options = [
      { icon: <Users size={14} />, text: 'Patients', path: '/patients' },
      { icon: <Calendar size={14} />, text: 'Appointments', path: '/appointments' },
      { icon: <Tooth size={14} />, text: 'Dental Charts', path: '/patients' },
      { icon: <ClipboardList size={14} />, text: 'Treatment Plans', path: '/treatment-plans' },
      { icon: <CreditCard size={14} />, text: 'Billing', path: '/billing' },
      { icon: <FileText size={14} />, text: 'Reports', path: '/reports' },
    ];

    return (
      <div className="grid grid-cols-2 gap-2 mb-4">
        {options.map((option, index) => (
          <Button 
            key={index} 
            variant="outline" 
            size="sm" 
            className="justify-start text-xs h-8"
            onClick={() => {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: `Show me ${option.text}`,
                sender: 'user',
                timestamp: new Date()
              }, {
                id: (Date.now() + 1).toString(),
                text: `Taking you to ${option.text}...`,
                sender: 'assistant',
                timestamp: new Date()
              }]);
              
              setTimeout(() => {
                navigate(option.path);
              }, 500);
            }}
          >
            <span className="mr-1.5">{option.icon}</span> {option.text}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-80 shadow-lg">
          <CardHeader className="p-3 flex flex-row items-center justify-between bg-primary text-primary-foreground">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              <span className="font-medium">DentaMind Assistant</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleChat} className="h-6 w-6 rounded-full text-primary-foreground hover:bg-primary/90">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-3 pt-4">
            <QuickOptions />
            <ScrollArea className="h-60 pr-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-2 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start">
                        {message.sender === 'assistant' && (
                          <span className="mr-2 rounded-full bg-primary p-1 h-5 w-5 flex items-center justify-center">
                            <MessageSquare className="h-3 w-3 text-primary-foreground" />
                          </span>
                        )}
                        <p className="text-sm">{message.text}</p>
                        {message.sender === 'user' && (
                          <span className="ml-2 rounded-full bg-primary-foreground p-1 h-5 w-5 flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[10px] mt-1 ${
                          message.sender === 'user'
                            ? 'text-primary-foreground/70 text-right'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 pt-0">
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder="Type your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-sm"
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Button
          variant="default"
          size="icon"
          onClick={toggleChat}
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}