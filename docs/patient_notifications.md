# Patient Notification System

The DentaMind Patient Notification System provides a complete solution for delivering timely, relevant notifications to patients across multiple channels. This documentation outlines the architecture, components, and usage of the system.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Backend Components](#backend-components)
5. [Frontend Components](#frontend-components)
6. [Usage Examples](#usage-examples)
7. [Extending the System](#extending-the-system)
8. [Best Practices](#best-practices)

## Overview

The Patient Notification System allows DentaMind to deliver notifications to patients through multiple channels (in-app, email, SMS, push) with real-time updates, preference management, and delivery tracking. It is designed to be HIPAA-compliant, scalable, and easily extensible.

## Features

- **Multi-channel delivery**: Send notifications via in-app, email, SMS, and push notifications
- **Real-time notifications**: WebSocket-based delivery for instant in-app notifications
- **Patient preferences**: Per-channel and per-notification-type preferences
- **Priority levels**: Designate notifications as low, medium, high, or urgent
- **Notification management**: Read, dismiss, and archive notifications
- **Automated scheduling**: Background tasks for scheduling notifications
- **Notification history**: Track notification delivery and status
- **HIPAA compliance**: Secure delivery and tracking for PHI

## Architecture

The notification system follows a service-oriented architecture with clear separation of concerns:

```
┌──────────────┐     ┌─────────────────┐     ┌───────────────────┐
│  Notification│     │   Notification   │     │  Delivery Channels │
│  Triggers    │────▶│     Service      │────▶│  (WebSocket/API)   │
└──────────────┘     └─────────────────┘     └───────────────────┘
                             │                          │
                             ▼                          ▼
                      ┌─────────────┐           ┌─────────────┐
                      │  Database   │           │  Frontend   │
                      │  Storage    │◀─────────▶│  Components │
                      └─────────────┘           └─────────────┘
```

## Backend Components

### Models

- **PatientNotification**: Represents a single notification instance
- **PatientNotificationPreference**: Stores patient preferences for notification delivery
- **PatientNotificationType**: Enum defining all notification types
- **PatientNotificationChannel**: Enum defining delivery channels
- **PatientNotificationPriority**: Enum defining priority levels

### Services

- **PatientNotificationService**: Core service for notification CRUD operations
- **NotificationSchedulerService**: Background service for scheduling automated notifications

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/patient-notifications` | GET | Get notifications for authenticated patient |
| `/patient-notifications/{id}/read` | POST | Mark notification as read |
| `/patient-notifications/read-all` | POST | Mark all notifications as read |
| `/patient-notifications/{id}/dismiss` | POST | Dismiss a notification |
| `/patient-notifications/preferences` | GET | Get patient notification preferences |
| `/patient-notifications/preferences/{type}` | PUT | Update notification preferences |
| `/patient-notifications/ws/{patient_id}` | WS | WebSocket connection for real-time updates |

## Frontend Components

### React Components

- **PatientNotificationCenter**: UI component for displaying notifications
- **NotificationSettingsPage**: Page for managing notification preferences

### React Hooks

- **usePatientNotifications**: Hook for managing notification state and operations

## Usage Examples

### Creating a Notification

```python
# Backend (Python)
async def send_appointment_reminder(db: Session, appointment_id: str):
    appointment = appointment_service.get_appointment(db, appointment_id)
    
    # Create reminder payload
    payload = AppointmentReminderPayload(
        title="Upcoming Appointment Reminder",
        message=f"You have an appointment on {appointment.start_time.strftime('%A, %B %d at %I:%M %p')}",
        priority=PatientNotificationPriority.MEDIUM,
        appointment_id=appointment.id,
        appointment_date=appointment.start_time,
        provider_name=f"{appointment.provider.first_name} {appointment.provider.last_name}"
    )
    
    # Send notification
    await patient_notification_service.create_appointment_reminder(
        db=db,
        patient_id=appointment.patient_id,
        payload=payload
    )
```

### Displaying Notifications (Frontend)

```tsx
// In a patient portal header component
import { PatientNotificationCenter } from './PatientNotificationCenter';

const PatientPortalHeader: React.FC<{ patientId: string }> = ({ patientId }) => {
  return (
    <header className="header">
      <div className="logo">DentaMind</div>
      <nav>{/* Navigation items */}</nav>
      <div className="actions">
        <PatientNotificationCenter patientId={patientId} />
        <UserMenu />
      </div>
    </header>
  );
};
```

### Managing Notification Preferences

```tsx
// In a settings component
import { useEffect, useState } from 'react';

const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState({});
  
  // Fetch preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      const response = await fetch('/api/patient-notifications/preferences');
      const data = await response.json();
      setPreferences(data);
    };
    
    fetchPreferences();
  }, []);
  
  // Save preferences
  const savePreferences = async (type, updates) => {
    await fetch(`/api/patient-notifications/preferences/${type}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  };
  
  return (
    // Render preference toggles
  );
};
```

## Extending the System

### Adding a New Notification Type

1. Add the new type to the `PatientNotificationType` enum
2. Implement any specialized creation methods in the `PatientNotificationService`
3. Add appropriate handling in the frontend components (icons, formatting)

### Adding a New Delivery Channel

1. Add the new channel to the `PatientNotificationChannel` enum
2. Implement the delivery method in the `PatientNotificationService`
3. Update the preference management UI to include the new channel

## Best Practices

### HIPAA Compliance

- Never include PHI details in notification titles
- Keep sensitive information behind authentication
- Use secure channels for delivering sensitive details
- Maintain comprehensive audit trails

### Performance Considerations

- Batch notification creation when possible
- Implement pagination for notification retrieval
- Use WebSockets efficiently for real-time updates
- Consider message queues for high-volume scenarios

### User Experience

- Use appropriate priority levels based on urgency
- Respect user preferences for notification delivery
- Design clear, actionable notification messages
- Provide easy ways to manage notification volume

## Migration and Database Schema

The system includes Alembic migration scripts for creating the required database tables:

- `patient_notifications`: Stores all notification instances
- `patient_notification_preferences`: Stores patient delivery preferences

Run migrations with:

```bash
alembic upgrade head
```

## Troubleshooting

### WebSocket Connection Issues

- Verify patient authentication
- Check firewall settings
- Ensure WebSocket endpoint is properly configured

### Missing Notifications

- Check patient notification preferences
- Verify notification triggers are functioning
- Confirm scheduler service is running

### Email/SMS Delivery Issues

- Verify patient contact information
- Check external service API keys and quotas
- Review email/SMS templates for formatting issues 