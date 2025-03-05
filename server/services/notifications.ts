import { z } from "zod";
import * as crypto from "crypto";
import { securityService } from "./security";
import { storage } from "../storage";

// Notification schema
const notificationSchema = z.object({
  id: z.string().optional(),
  userId: z.number(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  link: z.string().optional(),
  read: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  data: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  expiresAt: z.date().optional()
});

class NotificationService {
  // Create a new notification
  async createNotification(notificationData: z.infer<typeof notificationSchema>) {
    try {
      // Validate the input
      const validData = notificationSchema.parse({
        ...notificationData,
        id: notificationData.id || crypto.randomUUID(),
        createdAt: notificationData.createdAt || new Date()
      });

      // Store the notification
      const notification = await storage.createNotification(validData);

      // Log notification creation
      await securityService.createAuditLog({
        userId: validData.userId,
        action: 'create_notification',
        resource: 'notifications',
        resourceId: parseInt(notification.id),
        result: 'success'
      });

      return notification;
    } catch (error) {
      console.error('Notification creation error:', error);
      throw error;
    }
  }

  // Get all notifications for a user
  async getNotifications(userId: number, options: { 
    includeRead?: boolean, 
    limit?: number,
    before?: Date
  } = {}) {
    try {
      const { includeRead = false, limit = 20, before } = options;

      // Get notifications from storage
      const notifications = await storage.getNotifications(userId, {
        includeRead,
        limit,
        before
      });

      return notifications;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  // Get unread notification count for a user
  async getUnreadCount(userId: number) {
    try {
      return await storage.getUnreadNotificationCount(userId);
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId: string, userId: number) {
    try {
      // Make sure the notification belongs to the user
      const notification = await storage.getNotificationById(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== userId) {
        // Log security concern
        await securityService.createAuditLog({
          userId,
          action: 'mark_notification_read',
          resource: 'notifications',
          resourceId: parseInt(notificationId),
          result: 'error',
          details: { reason: 'Not owner of notification' }
        });
        throw new Error('Not authorized to update this notification');
      }

      // Update the notification
      await storage.updateNotification(notificationId, { read: true });

      return { success: true };
    } catch (error) {
      console.error('Mark notification read error:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: number) {
    try {
      await storage.markAllNotificationsAsRead(userId);

      return { success: true };
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string, userId: number) {
    try {
      // Make sure the notification belongs to the user
      const notification = await storage.getNotificationById(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== userId) {
        // Log security concern
        await securityService.createAuditLog({
          userId,
          action: 'delete_notification',
          resource: 'notifications',
          resourceId: parseInt(notificationId),
          result: 'error',
          details: { reason: 'Not owner of notification' }
        });
        throw new Error('Not authorized to delete this notification');
      }

      // Delete the notification
      await storage.deleteNotification(notificationId);

      return { success: true };
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  // Get pending (unread) notifications for a user
  async getPendingNotifications(userId: number) {
    try {
      return await this.getNotifications(userId, { includeRead: false });
    } catch (error) {
      console.error('Get pending notifications error:', error);
      throw error;
    }
  }

  // Create notification for multiple users
  async createBulkNotifications(
    userIds: number[], 
    notificationTemplate: Omit<z.infer<typeof notificationSchema>, 'userId' | 'id'>
  ) {
    try {
      const notifications = [];

      for (const userId of userIds) {
        const notification = await this.createNotification({
          ...notificationTemplate,
          userId,
          read: false
        });
        notifications.push(notification);
      }

      return { count: notifications.length, notifications };
    } catch (error) {
      console.error('Create bulk notifications error:', error);
      throw error;
    }
  }

  // Send appointment reminder notifications
  async sendAppointmentReminders() {
    try {
      // Get appointments coming up in the next 24 hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await storage.getAppointmentsByDateRange(
        new Date(), 
        tomorrow
      );

      const remindersSent = [];

      for (const appointment of appointments) {
        // Create notification for the patient
        const notification = await this.createNotification({
          userId: appointment.patientId,
          type: 'appointment_reminder',
          title: 'Upcoming Appointment Reminder',
          message: `You have an appointment scheduled for ${new Date(appointment.date).toLocaleString()}`,
          priority: 'high',
          data: { appointmentId: appointment.id },
          read: false
        });

        remindersSent.push(notification);
      }

      return { count: remindersSent.length };
    } catch (error) {
      console.error('Send appointment reminders error:', error);
      throw error;
    }
  }

  // Send notifications for overdue invoices
  async sendOverdueInvoiceReminders() {
    try {
      // Get overdue invoices
      const overdueInvoices = await storage.getOverdueInvoices();

      const remindersSent = [];

      for (const invoice of overdueInvoices) {
        // Create notification for the patient
        const notification = await this.createNotification({
          userId: invoice.patientId,
          type: 'invoice_overdue',
          title: 'Overdue Payment Reminder',
          message: `Your invoice #${invoice.id} is overdue. Please make a payment at your earliest convenience.`,
          priority: 'high',
          data: { invoiceId: invoice.id, amount: invoice.amount, dueDate: invoice.dueDate },
          read: false
        });

        remindersSent.push(notification);
      }

      return { count: remindersSent.length };
    } catch (error) {
      console.error('Send overdue invoice reminders error:', error);
      throw error;
    }
  }

  // Send notifications for lab results
  async sendLabResultNotification(patientId: number, labResultId: number, doctorName: string) {
    try {
      const notification = await this.createNotification({
        userId: patientId,
        type: 'lab_result',
        title: 'New Lab Results Available',
        message: `Dr. ${doctorName} has uploaded new lab results to your patient portal.`,
        priority: 'medium',
        data: { labResultId },
        read: false
      });

      return notification;
    } catch (error) {
      console.error('Send lab result notification error:', error);
      throw error;
    }
  }

  // Send notifications to multiple roles or user groups
  async sendNotification({
    type,
    priority,
    subject,
    message,
    recipients
  }: {
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    subject: string;
    message: string;
    recipients: { roles?: string[], userIds?: number[] }
  }) {
    try {
      const { roles, userIds = [] } = recipients;
      let targetUserIds = [...userIds];

      // If roles are specified, find users with those roles
      if (roles && roles.length > 0) {
        const usersWithRoles = await storage.getUsersByRoles(roles);
        targetUserIds = [...targetUserIds, ...usersWithRoles.map(u => u.id)];
      }

      // Remove duplicates
      targetUserIds = [...new Set(targetUserIds)];

      if (targetUserIds.length === 0) {
        return { count: 0, message: "No recipients found" };
      }

      // Convert priority to our notification priority
      const notificationPriority = priority === 'critical' ? 'high' : priority;

      // Send notifications
      return await this.createBulkNotifications(
        targetUserIds,
        {
          type,
          title: subject,
          message,
          priority: notificationPriority as 'low' | 'medium' | 'high',
          data: { notificationType: type }
        }
      );
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export { notificationSchema };
export default notificationService;