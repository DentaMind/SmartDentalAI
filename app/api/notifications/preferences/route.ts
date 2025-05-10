import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(request: NextRequest) {
  try {
    const userId = Number(request.nextUrl.searchParams.get('userId'));
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const preferences = await storage.getNotificationPreferences(userId);
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, updates } = await request.json();
    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates are required' },
        { status: 400 }
      );
    }

    const updatedPreferences = await storage.updateNotificationPreferences(
      userId,
      updates
    );
    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
} 