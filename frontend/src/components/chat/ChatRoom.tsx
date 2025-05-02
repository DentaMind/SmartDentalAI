import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Send, Info, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatRoomProps {
  roomId: string;
  title?: string;
  description?: string;
  minimizable?: boolean;
  onClose?: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'floating';
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  roomId,
  title = 'Chat',
  description,
  minimizable = true,
  onClose,
  className,
  position = 'bottom-right'
}) => {
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [participants, setParticipants] = useState<number>(1);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    connectionStatus, 
    isConnected, 
    isJoined 
  } = useChat(roomId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current && !isMinimized) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  // Focus the input field when the chat is first opened or unminimized
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // Simulated participant counting - in a real app this would come from the server
  useEffect(() => {
    if (isConnected && isJoined) {
      // This is a simplified simulation - in a real app, you'd get this from the server
      const simulatedCount = Math.floor(Math.random() * 5) + 1;
      setParticipants(simulatedCount);
    } else {
      setParticipants(1);
    }
  }, [isConnected, isJoined]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim() && isConnected) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'floating': ''
  };

  if (isMinimized) {
    return (
      <div 
        className={cn(
          "fixed z-50 flex items-center bg-primary text-primary-foreground shadow-md rounded-full cursor-pointer p-3",
          positionClasses[position],
          className
        )}
        onClick={() => setIsMinimized(false)}
      >
        <Users className="h-5 w-5 mr-2" />
        <span className="font-medium">{title}</span>
        <span className="ml-2 bg-primary-foreground text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs">
          {participants}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex flex-col border rounded-md shadow-md bg-background overflow-hidden",
        position !== 'floating' && 'fixed z-50',
        positionClasses[position],
        "w-80 h-96",
        className
      )}
    >
      {/* Chat Header */}
      <div className="p-3 border-b bg-muted flex items-center justify-between">
        <div className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-muted-foreground" />
          <div>
            <h3 className="font-medium text-sm">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {participants > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full mr-1">
              {participants}
            </span>
          )}
          {minimizable && (
            <button 
              className="text-muted-foreground hover:text-foreground p-1 rounded-sm"
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
          {onClose && (
            <button 
              className="text-muted-foreground hover:text-foreground p-1 rounded-sm"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Connection Status */}
      {connectionStatus !== 'open' && (
        <div className={cn(
          "px-3 py-1 text-xs text-white flex items-center",
          connectionStatus === 'connecting' ? "bg-amber-500" : "bg-red-500"
        )}>
          <Info className="h-3 w-3 mr-1" />
          {connectionStatus === 'connecting' 
            ? 'Connecting to chat...' 
            : 'Disconnected from chat'}
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 bg-background"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm text-center px-6">
              No messages yet in this room. Be the first to say hello!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id}
              className={cn(
                "flex flex-col max-w-[80%] rounded-lg p-2.5",
                message.isCurrentUser 
                  ? "bg-primary text-primary-foreground ml-auto" 
                  : "bg-muted"
              )}
            >
              {!message.isCurrentUser && (
                <span className="text-xs font-medium mb-1 text-muted-foreground">
                  {message.userName || `User ${message.userId.substring(0, 5)}`}
                </span>
              )}
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              <span className={cn(
                "text-xs mt-1 self-end",
                message.isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {format(new Date(message.timestamp), 'h:mm a')}
              </span>
            </div>
          ))
        )}
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t p-3 bg-background">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!isConnected || !input.trim()}
            className={cn(
              "p-2 rounded-md",
              isConnected && input.trim() 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}; 