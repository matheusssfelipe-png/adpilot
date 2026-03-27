import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=google_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=no_code`);
  }

  try {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Google token error:', tokenData.error);
      return NextResponse.redirect(`${appUrl}/dashboard/settings?error=token_failed`);
    }

    // In a real app, save tokens to database and fetch Google Ads accounts
    return NextResponse.redirect(`${appUrl}/dashboard/settings?success=google`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=google_failed`);
  }
}
