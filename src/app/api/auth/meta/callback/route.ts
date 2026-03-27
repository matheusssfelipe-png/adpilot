import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=meta_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=no_code`);
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
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

    // In a real app, save tokens to database here
    // For now, redirect with success
    return NextResponse.redirect(`${appUrl}/dashboard/settings?success=meta&accounts=${accountsData.data?.length || 0}`);
  } catch (error: any) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=meta_failed`);
  }
}
