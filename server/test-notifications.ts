import { MemStorage } from './storage.ts';
import { Notification } from '../shared/schema.ts';

const storage = new MemStorage();

async function testNotifications() {
  try {
    console.log('Testing notification system...\n');

    // Test 1: Create a notification
    console.log('Test 1: Creating a notification');
    const notification = await storage.notify(
      1, // userId
      'appointment_reminder',
      'You have an appointment tomorrow at 2:00 PM',
      {
        appointmentId: 123,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    );
    console.log('Created notification:', notification, '\n');

    // Test 2: Get notifications for user
    console.log('Test 2: Getting notifications for user');
    const notifications = await storage.getNotifications(1, { includeRead: true });
    console.log('User notifications:', notifications, '\n');

    // Test 3: Get unread notification count
    console.log('Test 3: Getting unread notification count');
    const unreadCount = await storage.getUnreadNotificationCount(1);
    console.log('Unread notifications count:', unreadCount, '\n');

    // Test 4: Mark notification as read
    console.log('Test 4: Marking notification as read');
    const updatedNotification = await storage.markNotificationRead(notification.id);
    console.log('Marked notification as read:', updatedNotification, '\n');

    // Test 5: Get unread notifications
    console.log('Test 5: Getting unread notifications');
    const unreadNotifications = await storage.getUnreadNotifications(1);
    console.log('Unread notifications:', unreadNotifications, '\n');

    // Test 6: Create multiple notifications
    console.log('Test 6: Creating multiple notifications');
    await storage.notify(1, 'lab_results', 'Your lab results are ready');
    await storage.notify(1, 'prescription', 'Your prescription has been sent to the pharmacy');
    const allNotifications = await storage.getNotifications(1, { includeRead: true });
    console.log('All notifications after adding more:', allNotifications, '\n');

    // Test 7: Mark all notifications as read
    console.log('Test 7: Marking all notifications as read');
    const markedCount = await storage.markAllNotificationsAsRead(1);
    console.log('Number of notifications marked as read:', markedCount);
    const remainingUnread = await storage.getUnreadNotifications(1);
    console.log('Remaining unread notifications:', remainingUnread, '\n');

    // Test 8: Delete notification
    console.log('Test 8: Deleting a notification');
    const deleted = await storage.deleteNotification(notification.id);
    console.log('Notification deleted:', deleted);
    const remainingNotifications = await storage.getNotifications(1, { includeRead: true });
    console.log('Remaining notifications:', remainingNotifications, '\n');

    console.log('All tests completed successfully!');

  } catch (error) {
    console.error('Error testing notifications:', error);
  }
}

testNotifications(); 