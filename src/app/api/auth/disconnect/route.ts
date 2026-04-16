import { NextRequest, NextResponse } from 'next/server';

// Disconnect a platform by clearing its cookies
export async function POST(request: NextRequest) {
  try {
    const { platform } = await request.json();
    const response = NextResponse.json({ success: true });

    if (platform === 'meta') {
      response.cookies.set('meta_access_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    } else if (platform === 'google') {
      response.cookies.set('google_access_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      response.cookies.set('google_refresh_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
