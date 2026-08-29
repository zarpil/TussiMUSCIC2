import { NextRequest, NextResponse } from 'next/server';
import { getSiteSettings, saveSiteSettings } from '../../../../lib/settings';
import fs from 'fs';

export const dynamic = 'force-dynamic';

let API_URL = process.env.INTERNAL_API_URL || 'http://bot:3001';
const isDocker = fs.existsSync('/.dockerenv');
if (!isDocker && API_URL.includes('host.docker.internal')) {
  API_URL = API_URL.replace('host.docker.internal', 'localhost');
}

// GET - Anyone can fetch settings
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

// POST - Only authenticated admins can save settings
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('session_id');
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized: No session cookie' }, { status: 401 });
  }

  try {
    // 1. Get session from backend API
    const sessionResponse = await fetch(`${API_URL}/api/auth/session/${sessionCookie.value}`, {
      cache: 'no-store',
      headers: { 'Connection': 'close' },
      signal: AbortSignal.timeout(5000)
    });
    if (!sessionResponse.ok) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
    }
    const userData = await sessionResponse.json();

    // 2. Check if user is admin
    const adminResponse = await fetch(`${API_URL}/api/admin/check/${userData.id}`, {
      cache: 'no-store',
      headers: { 'Connection': 'close' },
      signal: AbortSignal.timeout(5000)
    });
    if (!adminResponse.ok) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }
    const adminData = await adminResponse.json();
    if (!adminData.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 3. Save settings
    const body = await request.json();
    const success = await saveSiteSettings(body);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to save settings to database' }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
