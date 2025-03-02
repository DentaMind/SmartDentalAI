
import { storage } from "../storage";
import { z } from "zod";

// Notification schemas
const notificationSchema = z.object({
  userId: z.number().optional(),
  type: z.enum([
    "appointment_reminder", 
    "appointment_confirmation", 
    "lab_status_update", 
    "treatment_completion", 
    "payment_received", 
    "insurance_update",
    "system_alert",
    "clinical_alert",
    "message",
    "task_assignment"
  ]),
  title: z.string(),
  message: z.string(),
  data: z.record(z.string(), z.any()).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  channel: z.array(z.enum(["email", "sms", "in_app", "push"])),
  scheduledFor: z.date().optional(),
});

const userPreferencesSchema = z.object({
  userId: z.number(),
  channels: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(true),
    in_app: z.boolean().default(true),
    push: z.boolean().default(true),
  }),
  preferences: z.object({
    appointment_reminder: z.object({
      enabled: z.boolean().default(true),
      advanceTime: z.number().default(24), // hours
      channels: z.array(z.enum(["email", "sms", "in_app", "push"])).default(["email", "sms"]),
    }),
    // Similar structure for other notification types
  }).optional(),
  do_not_disturb: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().default("22:00"),
    endTime: z.string().default("07:00"),
    allowUrgent: z.boolean().default(true),
  }).optional(),
});

class NotificationService {
  private activeConnections: Map<number, any[]> = new Map();
  
  // In-memory notification storage for demo purposes
  // In a real system, these would be stored in the database
  private notifications: any[] = [];
  private userPreferences: Map<number, any> = new Map();
  
  async sendNotification(notificationData: z.infer<typeof notificationSchema>) {
    try {
      // Validate notification data
      const validData = notificationSchema.parse(notificationData);
      
      // Generate notification ID
      const notificationId = this.generateNotificationId();
      
      // Create notification object
      const notification = {
        id: notificationId,
        ...validData,
        createdAt: new Date(),
        status: "pending"
      };
      
      // Store notification
      this.notifications.push(notification);
      
      // If scheduled for future, queue it
      if (validData.scheduledFor && validData.scheduledFor > new Date()) {
        this.scheduleNotification(notification);
        return { 
          id: notificationId, 
          status: "scheduled", 
          scheduledFor: validData.scheduledFor 
        };
      }
      
      // Otherwise, send immediately
      if (validData.userId) {
        // Check user preferences
        const userPrefs = await this.getUserPreferences(validData.userId);
        const channels = this.determineChannels(validData, userPrefs);
        
        if (channels.length === 0) {
          return { 
            id: notificationId, 
            status: "skipped", 
            reason: "user_preferences" 
          };
        }
        
        // Send through each channel
        for (const channel of channels) {
          await this.sendThroughChannel(notification, channel);
        }
        
        // Update notification status
        notification.status = "sent";
        notification.sentAt = new Date();
        
        // Add to connected clients if applicable
        this.notifyConnectedClients(validData.userId, notification);
        
        return { 
          id: notificationId, 
          status: "sent", 
          channels, 
          sentAt: new Date() 
        };
      } else {
        // Broadcast notification (e.g., system alerts)
        await this.broadcastNotification(notification);
        
        // Update notification status
        notification.status = "broadcast";
        notification.sentAt = new Date();
        
        return { 
          id: notificationId, 
          status: "broadcast", 
          sentAt: new Date() 
        };
      }
    } catch (error) {
      console.error("Notification send error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to send notification");
    }
  }
  
  async createAppointmentReminders(days: number = 1) {
    try {
      // Get appointments within the next specified days
      const now = new Date();
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      
      // Get all appointments between now and target date
      // This would normally query the database
      const upcomingAppointments = [];
      
      // Create reminders for each appointment
      for (const appointment of upcomingAppointments) {
        await this.sendNotification({
          userId: appointment.patientId,
          type: "appointment_reminder",
          title: "Upcoming Appointment Reminder",
          message: `You have an appointment scheduled on ${new Date(appointment.date).toLocaleDateString()} at ${new Date(appointment.date).toLocaleTimeString()}.`,
          data: { appointmentId: appointment.id },
          priority: "normal",
          channel: ["email", "sms", "in_app"]
        });
      }
      
      return { 
        status: "completed", 
        appointmentsProcessed: upcomingAppointments.length 
      };
    } catch (error) {
      console.error("Appointment reminders error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to create appointment reminders");
    }
  }
  
  async getUserNotifications(userId: number, options: { unreadOnly?: boolean, limit?: number } = {}) {
    try {
      // Get notifications for user
      const userNotifications = this.notifications.filter(n => 
        n.userId === userId && 
        (options.unreadOnly ? !n.readAt : true)
      );
      
      // Sort by created date (most recent first)
      userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Apply limit if specified
      const limit = options.limit || 50;
      const limitedNotifications = userNotifications.slice(0, limit);
      
      return {
        notifications: limitedNotifications,
        unreadCount: userNotifications.filter(n => !n.readAt).length,
        totalCount: userNotifications.length
      };
    } catch (error) {
      console.error("Get user notifications error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to get user notifications");
    }
  }
  
  async markNotificationRead(notificationId: string, userId: number) {
    try {
      // Find notification
      const notification = this.notifications.find(n => n.id === notificationId && n.userId === userId);
      
      if (!notification) {
        throw new Error("Notification not found");
      }
      
      // Mark as read
      notification.readAt = new Date();
      
      return { 
        id: notificationId, 
        status: "read", 
        readAt: notification.readAt 
      };
    } catch (error) {
      console.error("Mark notification read error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to mark notification as read");
    }
  }
  
  async updateUserPreferences(preferences: z.infer<typeof userPreferencesSchema>) {
    try {
      // Validate preferences
      const validPrefs = userPreferencesSchema.parse(preferences);
      
      // Update user preferences
      this.userPreferences.set(validPrefs.userId, validPrefs);
      
      return { 
        userId: validPrefs.userId, 
        status: "updated",
        preferences: validPrefs
      };
    } catch (error) {
      console.error("Update user preferences error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to update user preferences");
    }
  }
  
  async getUserPreferences(userId: number) {
    try {
      // Get user preferences
      let prefs = this.userPreferences.get(userId);
      
      // If no preferences found, create default
      if (!prefs) {
        prefs = userPreferencesSchema.parse({ userId });
        this.userPreferences.set(userId, prefs);
      }
      
      return prefs;
    } catch (error) {
      console.error("Get user preferences error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to get user preferences");
    }
  }
  
  // Client connection management for real-time notifications
  registerConnection(userId: number, connection: any) {
    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, []);
    }
    
    this.activeConnections.get(userId)?.push(connection);
    console.log(`User ${userId} connected. Total connections: ${this.activeConnections.get(userId)?.length}`);
  }
  
  removeConnection(userId: number, connection: any) {
    if (this.activeConnections.has(userId)) {
      const connections = this.activeConnections.get(userId) || [];
      const index = connections.indexOf(connection);
      
      if (index !== -1) {
        connections.splice(index, 1);
        console.log(`User ${userId} disconnected. Remaining connections: ${connections.length}`);
        
        // Clean up if no more connections
        if (connections.length === 0) {
          this.activeConnections.delete(userId);
        }
      }
    }
  }
  
  // Private helper methods
  private generateNotificationId() {
    return `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  
  private scheduleNotification(notification: any) {
    const now = new Date();
    const scheduledTime = notification.scheduledFor;
    const delay = scheduledTime.getTime() - now.getTime();
    
    // Schedule notification for later
    setTimeout(() => {
      this.sendNotification({
        ...notification,
        scheduledFor: undefined // Remove scheduling to send immediately
      });
    }, delay);
  }
  
  private determineChannels(notification: any, userPreferences: any) {
    // Start with notification's requested channels
    let channels = [...notification.channel];
    
    // Filter based on user preferences
    channels = channels.filter(channel => {
      // Check if this channel is enabled by user
      if (!userPreferences.channels[channel]) {
        return false;
      }
      
      // Check do not disturb settings
      if (userPreferences.do_not_disturb?.enabled) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const startTime = userPreferences.do_not_disturb.startTime;
        const endTime = userPreferences.do_not_disturb.endTime;
        
        // Check if current time is within do not disturb window
        const isDuringDND = this.isTimeBetween(currentTime, startTime, endTime);
        
        if (isDuringDND) {
          // Allow only if notification is urgent and user allows urgent during DND
          if (!(notification.priority === "urgent" && userPreferences.do_not_disturb.allowUrgent)) {
            return false;
          }
        }
      }
      
      // Check notification type preferences if available
      if (userPreferences.preferences && userPreferences.preferences[notification.type]) {
        const typePref = userPreferences.preferences[notification.type];
        
        // Check if this type is enabled
        if (!typePref.enabled) {
          return false;
        }
        
        // Check if this channel is preferred for this notification type
        if (typePref.channels && !typePref.channels.includes(channel)) {
          return false;
        }
      }
      
      return true;
    });
    
    return channels;
  }
  
  private async sendThroughChannel(notification: any, channel: string) {
    // In a real system, these would integrate with external services
    switch (channel) {
      case "email":
        console.log(`Sending email notification to user ${notification.userId}: ${notification.title}`);
        break;
      case "sms":
        console.log(`Sending SMS notification to user ${notification.userId}: ${notification.title}`);
        break;
      case "push":
        console.log(`Sending push notification to user ${notification.userId}: ${notification.title}`);
        break;
      case "in_app":
        // Handled by notifyConnectedClients
        break;
    }
  }
  
  private notifyConnectedClients(userId: number, notification: any) {
    const connections = this.activeConnections.get(userId) || [];
    
    for (const connection of connections) {
      // Send in-app notification
      if (connection.send) {
        connection.send(JSON.stringify({
          type: "notification",
          data: notification
        }));
      }
    }
  }
  
  private async broadcastNotification(notification: any) {
    console.log(`Broadcasting notification: ${notification.title}`);
    
    // Broadcast to all connected clients
    for (const [userId, connections] of this.activeConnections.entries()) {
      for (const connection of connections) {
        if (connection.send) {
          connection.send(JSON.stringify({
            type: "broadcast",
            data: notification
          }));
        }
      }
    }
  }
  
  private isTimeBetween(time: string, start: string, end: string) {
    // Convert times to minutes since midnight
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    
    // Handle overnight periods
    if (startMinutes > endMinutes) {
      return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
    } else {
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    }
  }
  
  private timeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export const notificationService = new NotificationService();
