import { storage } from '@/server/storage';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = parseInt(req.nextUrl.searchParams.get('userId') || '');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const notifications = await storage.getNotifications(userId, {
    includeRead: true,
    limit: 20
  });

  return NextResponse.json({ notifications });
} 