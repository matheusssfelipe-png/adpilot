import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || '';

  const oauthClientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!oauthClientId) {
    return NextResponse.json(
      { error: 'GOOGLE_ADS_CLIENT_ID não configurado no .env.local' },
      { status: 500 }
    );
  }

  const scopes = [
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  // Pass clientId in state so callback knows which client to link to
  const state = clientId ? `google_oauth_${clientId}` : 'google_oauth';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${oauthClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(authUrl);
}
