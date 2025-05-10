import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Bot, SendHorizontal, User, X, CornerDownLeft, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define message types
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  needsReview?: boolean;
}

interface SuggestedPrompt {
  id: string;
  text: string;
  category: 'diagnosis' | 'treatment' | 'general';
}

interface ChatHelperProps {
  patientId?: number;
  patientName?: string;
  providerId?: number;
  providerName?: string;
  context?: string;
  onInsertToNotes?: (text: string) => void;
  onClose?: () => void;
  position?: 'bottom-right' | 'floating' | 'full';
  initialPrompts?: SuggestedPrompt[];
  useOpenAI?: boolean;
  apiKeyName?: string;
}

export function ChatHelper({
  patientId,
  patientName = '',
  providerId,
  providerName = '',
  context = '',
  onInsertToNotes,
  onClose,
  position = 'bottom-right',
  initialPrompts = [],
  useOpenAI = true,
  apiKeyName = 'CHAT_AI_KEY'
}: ChatHelperProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello Dr. ${providerName}! I'm your dental assistant AI. How can I help you with ${patientName || 'this patient'} today?`,
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>(initialPrompts);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(position === 'full');
  const [selectedText, setSelectedText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Default suggested prompts if none provided
  useEffect(() => {
    if (initialPrompts.length === 0 && patientName) {
      setSuggestedPrompts([
        { id: '1', text: `What are common risk factors for ${patientName}'s condition?`, category: 'diagnosis' },
        { id: '2', text: 'Can you suggest a treatment plan for periodontal disease?', category: 'treatment' },
        { id: '3', text: 'What should I document for insurance reimbursement?', category: 'general' },
      ]);
    } else {
      setSuggestedPrompts(initialPrompts);
    }
  }, [initialPrompts, patientName]);
  
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (inputValue.trim() === '') return;
    
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // In a production environment, this would call an actual API
      // with proper validation and error handling
      let responseText: string;
      
      // Simulate API call / response delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Generate AI response based on the context and question
      if (useOpenAI) {
        // This would be an actual OpenAI API call in production
        responseText = await simulateAIResponse(inputValue, {
          patientName,
          providerName,
          context,
          patientHistory: 'Sample patient history would be here in production',
        });
      } else {
        responseText = generateMockResponse(inputValue, patientName);
      }
      
      const newAIMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: responseText,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, newAIMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handlePromptClick = (promptText: string) => {
    setInputValue(promptText);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const handleInsertToNotes = (text: string) => {
    if (onInsertToNotes) {
      onInsertToNotes(text);
    }
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Function to simulate AI responses in development
  const simulateAIResponse = async (
    query: string,
    context: { patientName: string; providerName: string; context: string; patientHistory: string }
  ): Promise<string> => {
    // In production, this would make an actual API call to OpenAI or another AI service
    // with the api key from environment variables (process.env[apiKeyName])
    
    // For development purposes, generate a mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockResponse(query, context.patientName));
      }, 1000);
    });
  };
  
  // Function to generate mock responses for development
  const generateMockResponse = (query: string, patientName: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('risk factor') || lowerQuery.includes('risk assessment')) {
      return `Based on the assessment, ${patientName || 'the patient'} shows the following risk factors for periodontal disease:
- Moderate plaque accumulation
- Family history of periodontitis
- Smoking history (5 pack-years)

I recommend documenting these in the risk assessment section and scheduling more frequent recalls for periodontal maintenance.`;
    }
    
    if (lowerQuery.includes('treatment plan') || lowerQuery.includes('treatment options')) {
      return `For ${patientName || 'this patient'}'s condition, I would recommend considering:

1. Initial therapy: Scaling and root planing all quadrants
2. Re-evaluation at 4-6 weeks
3. Maintenance: 3-month recall interval initially
4. Adjunctive therapy: Consider local antimicrobial delivery in sites with PD ≥ 5mm that didn't respond to initial therapy

Does this align with your treatment approach?`;
    }
    
    if (lowerQuery.includes('document') || lowerQuery.includes('insurance') || lowerQuery.includes('reimbursement')) {
      return `For optimal insurance reimbursement, ensure you document:

1. Clinical findings (pocket depths, BOP, etc.)
2. Radiographic evidence of bone loss
3. Risk factors contributing to the condition
4. Medical necessity of the treatment
5. Treatment plan and expected outcomes

This documentation will support the medical necessity of the proposed treatment.`;
    }
    
    if (lowerQuery.includes('diagnosis') || lowerQuery.includes('condition')) {
      return `Based on the data in the chart, ${patientName || 'the patient'} presents with signs consistent with Stage II, Grade B Periodontitis (2017 Classification System).

Key findings:
- Interproximal CAL: 3-4mm
- Radiographic bone loss: 15-33%
- No tooth loss due to periodontitis
- Max PPD: 5mm
- Mostly horizontal bone loss

This should be documented with the appropriate diagnostic code for insurance purposes.`;
    }
    
    // Default response
    return `I understand you're asking about ${query.substring(0, 30)}... Let me assist with that based on ${patientName || 'the patient'}'s records.

For more specific guidance, could you provide more details about what you're looking for? I can help with treatment recommendations, documentation requirements, or clinical considerations.`;
  };
  
  const renderChatLayout = () => {
    return (
      <div className="flex flex-col h-full">
        <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            DentaMind AI Assistant
          </CardTitle>
          <div className="flex gap-2">
            {position !== 'full' && (
              <Button variant="ghost" size="icon" onClick={toggleExpand}>
                {isExpanded ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <>
            <CardContent className="p-0 flex-grow overflow-hidden">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-start gap-3 group",
                        message.role === 'user' ? "justify-end" : ""
                      )}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/20 text-primary">AI</AvatarFallback>
                          <AvatarImage src="/ai-assistant.png" />
                        </Avatar>
                      )}
                      
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 max-w-[80%] text-sm relative group",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        <div className="text-xs mt-1 opacity-60">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        
                        {message.role === 'assistant' && onInsertToNotes && (
                          <div className="absolute -right-10 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleInsertToNotes(message.content)}
                              title="Insert to notes"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {message.role === 'user' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {providerName ? providerName.charAt(0) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary">AI</AvatarFallback>
                        <AvatarImage src="/ai-assistant.png" />
                      </Avatar>
                      <div className="rounded-lg px-3 py-2 max-w-[80%] text-sm bg-muted flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            
            <CardFooter className="p-4 pt-2 border-t flex flex-col gap-3">
              {suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap gap-2 w-full">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-primary/10 transition-colors"
                      onClick={() => handlePromptClick(prompt.text)}
                    >
                      {prompt.text.length > 30 ? prompt.text.substring(0, 30) + '...' : prompt.text}
                    </button>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="flex w-full gap-2 items-end">
                <Textarea
                  ref={inputRef}
                  placeholder="Type your question here..."
                  className="flex-1 min-h-[60px] resize-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </form>
              
              <div className="text-xs text-muted-foreground w-full text-center">
                Press <kbd className="px-1 py-0.5 rounded border text-xs">Enter</kbd> to send,{' '}
                <kbd className="px-1 py-0.5 rounded border text-xs">Shift+Enter</kbd> for new line
              </div>
            </CardFooter>
          </>
        )}
      </div>
    );
  };
  
  // Render based on position
  if (position === 'full') {
    return <Card className="w-full h-full">{renderChatLayout()}</Card>;
  }
  
  if (position === 'floating') {
    return (
      <Card className={cn(
        "fixed transition-all duration-200 ease-in-out shadow-lg",
        isExpanded ? "w-[380px] h-[550px]" : "w-12 h-12",
        "right-4 bottom-4 z-50"
      )}>
        {renderChatLayout()}
      </Card>
    );
  }
  
  // Default bottom-right position
  return (
    <Card className={cn(
      "w-full transition-all duration-200 ease-in-out",
      isExpanded ? "h-[500px]" : "h-12"
    )}>
      {renderChatLayout()}
    </Card>
  );
}