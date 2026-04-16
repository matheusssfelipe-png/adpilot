import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state') || '';
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();

  // Extract clientId from state parameter
  const clientId = state.replace('google_oauth_', '');

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard/clients?error=google_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/clients?error=no_code`);
  }

  try {
    const clientIdOAuth = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientIdOAuth || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Google token error:', tokenData.error, tokenData.error_description);
      return NextResponse.redirect(`${appUrl}/dashboard/clients?error=token_failed`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || '';
    const expiresIn = tokenData.expires_in || 3600;

    // Generate a unique link session ID to pass tokens securely
    const linkSessionId = randomUUID();

    // Store tokens in a global cache (server-side, short-lived)
    // We use a simple in-memory approach via a cookie + server state
    // The tokens are passed back to the client page via secure cookies
    const redirectUrl = new URL(`${appUrl}/dashboard/clients`);
    redirectUrl.searchParams.set('link', 'google');
    if (clientId) redirectUrl.searchParams.set('clientId', clientId);

    const response = NextResponse.redirect(redirectUrl);

    // Set cookies with the tokens - these will be read by /api/google/accounts/list
    response.cookies.set('google_link_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    if (refreshToken) {
      response.cookies.set('google_link_refresh', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 10,
      });
    }

    response.cookies.set('google_link_expires', String(expiresIn), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,
    });

    // Also set a non-httpOnly cookie so the client JS knows tokens exist
    response.cookies.set('google_link_ready', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,
    });

    // Also keep backward-compatible cookies for existing API routes
    response.cookies.set('google_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${appUrl}/dashboard/clients?error=google_failed`);
  }
}
