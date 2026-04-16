import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { clientAccounts } from '@/lib/db/schema';
import { encrypt } from '@/lib/db/crypto';

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
      console.error('Google token error:', tokenData.error);
      return NextResponse.redirect(`${appUrl}/dashboard/clients?error=token_failed`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || '';
    const expiresIn = tokenData.expires_in || 3600;

    // Get user's Google Ads accounts to let them pick later
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();

    if (!developerToken) {
      return NextResponse.redirect(`${appUrl}/dashboard/clients?error=no_developer_token`);
    }

    // List accessible customer accounts
    const listResponse = await fetch(
      'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
        },
      }
    );

    const listData = await listResponse.json();
    const resourceNames: string[] = listData.resourceNames || [];

    if (resourceNames.length === 0) {
      return NextResponse.redirect(`${appUrl}/dashboard/clients?error=no_google_accounts`);
    }

    // MCC ID (the one provided by user)
    const mccId = process.env.GOOGLE_ADS_MCC_ID?.trim() || '';

    // For each accessible customer, get details and save to DB
    let savedCount = 0;
    for (const resourceName of resourceNames) {
      const customerId = resourceName.replace('customers/', '');

      try {
        // Get account details
        const detailRes = await fetch(
          `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': developerToken,
              'login-customer-id': mccId || customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.manager FROM customer LIMIT 1`,
            }),
          }
        );

        const detailData = await detailRes.json();
        const customer = detailData.results?.[0]?.customer;

        // Skip manager accounts - we want regular ad accounts
        if (customer?.manager === true) continue;

        const accountName = customer?.descriptiveName || `Google Ads ${customerId}`;
        const currency = customer?.currencyCode || 'BRL';

        // Encrypt tokens
        const encryptedAccess = await encrypt(accessToken);
        const encryptedRefresh = refreshToken ? await encrypt(refreshToken) : null;

        // Save to DB linked to the client
        if (clientId) {
          await db.insert(clientAccounts).values({
            clientId,
            platform: 'google',
            accountId: customerId,
            accountName,
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            mccId: mccId || null,
            currency,
            status: 'active',
          });
          savedCount++;
        }
      } catch (e) {
        console.error(`Failed to process account ${customerId}:`, e);
      }
    }

    // Also set cookies for backward compatibility
    const redirectUrl = new URL(`${appUrl}/dashboard/clients?success=google&accounts=${savedCount}`);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('google_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });
    if (refreshToken) {
      response.cookies.set('google_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 90,
      });
    }
    return response;
  } catch (error: unknown) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${appUrl}/dashboard/clients?error=google_failed`);
  }
}
