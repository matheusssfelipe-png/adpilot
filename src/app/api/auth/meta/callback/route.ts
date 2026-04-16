import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=meta_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=no_code`);
  }

  try {
    const appId = process.env.META_APP_ID?.trim();
    const appSecret = process.env.META_APP_SECRET?.trim();
    const redirectUri = `${appUrl}/api/auth/meta/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Meta token error:', tokenData.error);
      return NextResponse.redirect(`${appUrl}/dashboard/settings?error=token_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get user's ad accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status,currency,business_name&access_token=${accessToken}`
    );

    const accountsData = await accountsResponse.json();

    // Store token in HttpOnly cookie instead of exposing in URL
    const redirectUrl = new URL(`${appUrl}/dashboard/settings?success=meta&accounts=${accountsData.data?.length || 0}`);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('meta_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 60, // 60 days
    });
    return response;
  } catch (error: any) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=meta_failed`);
  }
}
