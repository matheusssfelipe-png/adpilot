import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appId = process.env.META_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/meta/callback`;

  if (!appId) {
    return NextResponse.json(
      { error: 'META_APP_ID não configurado no .env.local' },
      { status: 500 }
    );
  }

  const scopes = [
    'ads_read',
    'ads_management',
    'business_management',
    'pages_read_engagement',
  ].join(',');

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=meta_oauth`;

  return NextResponse.redirect(authUrl);
}
