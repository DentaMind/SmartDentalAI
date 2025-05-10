# Patient Notification System Examples

This document provides practical examples of how to integrate and use the patient notification system in various parts of the DentaMind application.

## Frontend Integration Examples

### Enhancing Patient Dashboard with Notifications

Here's an example of how to integrate the notification center into a patient dashboard header:

```tsx
// Modified PatientDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle
} from '../../components/layout/Layout';
import { PatientNotificationCenter } from '../../components/patient/PatientNotificationCenter';

const PatientDashboard: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  
  // ... existing component code ...
  
  return (
    <Layout>
      <LayoutHeader>
        <div className="flex justify-between items-center w-full">
          <LayoutTitle>
            Patient Dashboard: {patient.first_name} {patient.last_name}
          </LayoutTitle>
          
          {/* Add notification center to header */}
          <div className="flex items-center space-x-4">
            <PatientNotificationCenter patientId={patientId as string} />
            <UserMenu patient={patient} />
          </div>
        </div>
      </LayoutHeader>
      
      {/* Rest of dashboard content */}
      <LayoutContent>
        {/* ... */}
      </LayoutContent>
    </Layout>
  );
};

export default PatientDashboard;
```

### Creating a Notifications Page for Patients

```tsx
// pages/patient/NotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Layout, 
  LayoutHeader, 
  LayoutTitle, 
  LayoutContent 
} from '../../components/layout/Layout';
import { usePatientNotifications } from '../../hooks/usePatientNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Bell, Calendar, Pill, FileText, Check } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    refreshNotifications 
  } = usePatientNotifications(patientId as string);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'prescription_ready':
        return <Pill className="h-5 w-5 text-indigo-500" />;
      case 'lab_result_ready':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Notifications</LayoutTitle>
      </LayoutHeader>
      
      <LayoutContent>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Notifications</CardTitle>
            {notifications.length > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </CardHeader>
          
          <CardContent>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-muted-foreground mt-2">
                  You don't have any notifications at the moment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.action_url) {
                        window.location.href = notification.action_url;
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                        {notification.metadata?.timestamp && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(notification.metadata.timestamp), 'MMMM d, yyyy • h:mm a')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
};

export default NotificationsPage;
```

## Backend Integration Examples

### Sending Automatic Appointment Reminders

This example shows how to create an appointment reminder notification when a new appointment is scheduled:

```python
# services/appointment_service.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.appointment import Appointment
from ..services.patient_notification_service import (
    patient_notification_service,
    AppointmentReminderPayload,
    PatientNotificationPriority
)

async def create_appointment(db: Session, appointment_data):
    """Create a new appointment and send a notification to the patient"""
    
    # Create appointment in database
    new_appointment = Appointment(**appointment_data)
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    # Send confirmation notification
    await send_appointment_confirmation(db, new_appointment)
    
    # Schedule reminder notification
    await schedule_appointment_reminder(db, new_appointment)
    
    return new_appointment

async def send_appointment_confirmation(db: Session, appointment):
    """Send an appointment confirmation notification"""
    
    # Get patient and provider information
    patient = appointment.patient
    provider = appointment.provider
    
    # Create notification payload
    payload = AppointmentReminderPayload(
        title="Appointment Confirmed",
        message=f"Your appointment with Dr. {provider.last_name} has been scheduled for {appointment.start_time.strftime('%A, %B %d at %I:%M %p')}",
        priority=PatientNotificationPriority.MEDIUM,
        appointment_id=appointment.id,
        appointment_date=appointment.start_time,
        provider_name=f"{provider.first_name} {provider.last_name}",
        action_url=f"/patient/appointments/{appointment.id}"
    )
    
    # Create notification
    await patient_notification_service.create_notification(
        db=db,
        patient_id=patient.id,
        notification_type="appointment_confirmed",
        payload=payload
    )

async def schedule_appointment_reminder(db: Session, appointment):
    """Schedule an appointment reminder for 24 hours before the appointment"""
    
    # This would typically be handled by a background task scheduler
    # For example, using Celery or APScheduler
    
    # For demonstration, we'll just create a function that would be called by the scheduler
    reminder_time = appointment.start_time - timedelta(hours=24)
    
    # In a real implementation, you would schedule this task to run at reminder_time
    # Here's what that task would do:
    
    # Get patient and provider information
    patient = appointment.patient
    provider = appointment.provider
    
    # Create notification payload
    payload = AppointmentReminderPayload(
        title="Appointment Reminder",
        message=f"Reminder: You have an appointment with Dr. {provider.last_name} tomorrow at {appointment.start_time.strftime('%I:%M %p')}",
        priority=PatientNotificationPriority.HIGH,
        appointment_id=appointment.id,
        appointment_date=appointment.start_time,
        provider_name=f"{provider.first_name} {provider.last_name}",
        action_url=f"/patient/appointments/{appointment.id}"
    )
    
    # Create notification
    await patient_notification_service.create_notification(
        db=db,
        patient_id=patient.id,
        notification_type="appointment_reminder",
        payload=payload
    )
```

### Sending Prescription Ready Notifications

This example shows how to notify a patient when their prescription is ready:

```python
# services/prescription_service.py
from sqlalchemy.orm import Session
from ..models.prescription import Prescription
from ..services.patient_notification_service import (
    patient_notification_service,
    NotificationPayload,
    PatientNotificationPriority
)

async def mark_prescription_ready(db: Session, prescription_id: str):
    """Mark a prescription as ready and notify the patient"""
    
    # Update prescription status
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    prescription.status = "ready"
    prescription.ready_date = datetime.now()
    db.commit()
    db.refresh(prescription)
    
    # Get patient information
    patient = prescription.patient
    
    # Create notification payload
    payload = NotificationPayload(
        title="Prescription Ready",
        message=f"Your prescription for {prescription.medication_name} is ready for pickup",
        priority=PatientNotificationPriority.HIGH,
        action_url=f"/patient/prescriptions/{prescription.id}",
        metadata={
            "prescription_id": prescription.id,
            "medication_name": prescription.medication_name,
            "ready_date": prescription.ready_date.isoformat(),
            "pharmacy_name": prescription.pharmacy_name,
            "pharmacy_address": prescription.pharmacy_address
        }
    )
    
    # Create notification
    await patient_notification_service.create_notification(
        db=db,
        patient_id=patient.id,
        notification_type="prescription_ready",
        payload=payload
    )
    
    return prescription
```

## Testing Examples

### Testing Notifications Using the Test Endpoint

The notification system includes a test endpoint that can be used during development to verify that notifications are working properly:

```bash
# Using curl to create a test notification
curl -X POST http://localhost:8000/api/patient-notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "appointment_reminder",
    "title": "Test Appointment Reminder",
    "message": "This is a test appointment reminder notification.",
    "priority": "medium",
    "action_url": "/patient/appointments/test-123",
    "metadata": {
      "appointment_id": "test-123",
      "appointment_date": "2023-06-15T14:30:00Z",
      "provider_name": "Dr. Test Doctor"
    }
  }'
```

### Testing WebSocket Connections

You can test WebSocket connections using browser tools or WebSocket client libraries:

```javascript
// Using browser WebSocket
const socket = new WebSocket(`ws://localhost:8000/api/patient-notifications/ws/patient-123`);

socket.onopen = (event) => {
  console.log('WebSocket connection established');
};

socket.onmessage = (event) => {
  console.log('Received notification:', JSON.parse(event.data));
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

socket.onclose = (event) => {
  console.log('WebSocket connection closed:', event.code, event.reason);
};
``` 