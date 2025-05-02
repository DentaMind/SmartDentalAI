import React, { useState } from 'react';
import { ChatRoom } from './ChatRoom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatRoom {
  id: string;
  title: string;
  description?: string;
}

const defaultRooms: ChatRoom[] = [
  { 
    id: 'reception', 
    title: 'Reception',
    description: 'Front desk communications'
  },
  { 
    id: 'clinical', 
    title: 'Clinical Staff',
    description: 'Dentists and hygienists'
  },
  { 
    id: 'admin', 
    title: 'Admin',
    description: 'Practice administrators'
  }
];

interface StaffChatProps {
  className?: string;
}

export const StaffChat: React.FC<StaffChatProps> = ({ className }) => {
  const [openChats, setOpenChats] = useState<ChatRoom[]>([]);
  const [showRoomSelector, setShowRoomSelector] = useState(false);

  const joinRoom = (room: ChatRoom) => {
    // Don't add if already open
    if (openChats.find(chat => chat.id === room.id)) {
      setShowRoomSelector(false);
      return;
    }
    
    // Add the room to open chats
    setOpenChats(prev => [...prev, room]);
    setShowRoomSelector(false);
  };

  const closeRoom = (roomId: string) => {
    setOpenChats(prev => prev.filter(chat => chat.id !== roomId));
  };

  // Calculate positions for multiple open chat windows
  const getPositionStyle = (index: number) => {
    const right = 16 + (index * 20); // Offset each chat window
    return { right: `${right}px` };
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-40 flex flex-col items-end", className)}>
      {/* Room selector dropdown */}
      {showRoomSelector && (
        <div className="bg-card border rounded-md shadow-md p-2 mb-3 min-w-[200px]">
          <div className="flex justify-between items-center mb-2 pb-1 border-b">
            <h3 className="text-sm font-medium">Join Chat Room</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowRoomSelector(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {defaultRooms.map(room => (
              <button
                key={room.id}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-muted",
                  openChats.some(chat => chat.id === room.id) && "text-muted-foreground"
                )}
                onClick={() => joinRoom(room)}
                disabled={openChats.some(chat => chat.id === room.id)}
              >
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <div>
                    <div className="text-sm font-medium">{room.title}</div>
                    {room.description && (
                      <div className="text-xs text-muted-foreground">{room.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Open chat windows */}
      {openChats.map((room, index) => (
        <div 
          key={room.id} 
          className="mb-3"
          style={getPositionStyle(index)}
        >
          <ChatRoom 
            roomId={room.id}
            title={room.title}
            description={room.description}
            onClose={() => closeRoom(room.id)}
            position="floating"
            className="w-72 h-80"
          />
        </div>
      ))}

      {/* Toggle chat button */}
      <Button
        className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg"
        onClick={() => setShowRoomSelector(!showRoomSelector)}
      >
        {showRoomSelector ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </Button>
    </div>
  );
}; 