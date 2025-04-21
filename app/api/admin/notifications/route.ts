import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(request: NextRequest) {
  try {
    const userId = Number(request.nextUrl.searchParams.get('userId'));
    const type = request.nextUrl.searchParams.get('type');
    const includeRead = request.nextUrl.searchParams.get('includeRead') === 'true';

    const notifications = await storage.getNotifications(userId, {
      includeRead,
      ...(type && { type })
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const success = await storage.deleteNotification(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, message, metadata } = await request.json();
    if (!userId || !type || !message) {
      return NextResponse.json(
        { error: 'User ID, type, and message are required' },
        { status: 400 }
      );
    }

    const notification = await storage.notify(userId, type, message, metadata);
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
} 