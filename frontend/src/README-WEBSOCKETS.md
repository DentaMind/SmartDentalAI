# WebSocket Integration Guide for DentaMind

This document explains how to use the WebSocket functionality in the DentaMind frontend.

## Overview

The WebSocket implementation provides real-time communication features including:

1. **Real-time notifications** - For appointments, patient arrivals, and system alerts
2. **Chat functionality** - For staff-to-staff communication
3. **Live updates** - For data that changes frequently

## Getting Started

### 1. Core WebSocket Hook

The base WebSocket functionality is provided by the `useWebSocket` hook in `src/hooks/useWebSocket.ts`. This hook handles:

- Connection establishment and authentication
- Automatic reconnection
- Message parsing
- Connection status tracking

### 2. Specialized Hooks

We provide specialized hooks built on top of the base hook:

- `useNotifications` - For receiving and managing real-time notifications
- `useChat` - For chat room functionality

## Integration Examples

### Adding Notifications to Any Component

```tsx
import { useNotifications } from '@/hooks/useNotifications';

const MyComponent = () => {
  const { notifications, unreadCount } = useNotifications();
  
  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      <ul>
        {notifications.map(notification => (
          <li key={notification.id}>{notification.title}</li>
        ))}
      </ul>
    </div>
  );
};
```

### Using the NotificationCenter Component

The `NotificationCenter` component provides a complete UI for notifications:

```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

const MyLayout = () => {
  return (
    <div className="flex justify-between items-center p-4 border-b">
      <h1>My App</h1>
      <NotificationCenter />
    </div>
  );
};
```

### Creating a Chat Room

Use the `ChatRoom` component for a complete chat UI:

```tsx
import { ChatRoom } from '@/components/chat/ChatRoom';

const DoctorDashboard = () => {
  return (
    <div className="p-4">
      <h1>Doctor Dashboard</h1>
      <ChatRoom 
        roomId="doctor-123"
        title="Doctor's Chat"
        description="Communication with staff"
      />
    </div>
  );
};
```

### Adding Staff Chat Functionality

Use the `StaffChat` component to add a floating chat interface:

```tsx
import { StaffChat } from '@/components/chat/StaffChat';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Your app content */}
      <StaffChat />
    </div>
  );
};
```

## Custom WebSocket Integration

For advanced usage, you can use the base hook directly:

```tsx
import { useWebSocket } from '@/hooks/useWebSocket';

const RealTimeData = () => {
  const { status, lastMessage, sendMessage } = useWebSocket('ws/custom-endpoint');
  
  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      console.log('New message:', lastMessage);
    }
  }, [lastMessage]);
  
  // Send a message
  const handleAction = () => {
    sendMessage({ type: 'request_data', id: '12345' });
  };
  
  return (
    <div>
      <p>Connection status: {status}</p>
      <button onClick={handleAction}>Request Data</button>
    </div>
  );
};
```

## Troubleshooting

### Connection Issues

1. Make sure the backend WebSocket service is running
2. Check that authentication is set up correctly
3. Verify the WebSocket URL is correct for your environment

### Performance Considerations

1. Limit the number of active WebSocket connections
2. Use the same WebSocket connection for multiple features when possible
3. Properly clean up connections when components unmount

## Security Notes

1. All WebSocket connections are authenticated using the same JWT token as the REST API
2. Messages are validated on the server before being broadcast
3. Rate limiting is applied to prevent abuse

## Best Practices

1. Always check the connection status before attempting to send messages
2. Handle reconnection scenarios gracefully in the UI
3. Provide fallback mechanisms when WebSocket is not available
4. Log connection issues for debugging 