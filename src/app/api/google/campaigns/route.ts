import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { clientAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/db/crypto';

// Google Ads API base URL
const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v18';

// GET /api/google/campaigns?clientAccountId=xxx&since=2026-04-01&until=2026-04-16
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientAccountId = searchParams.get('clientAccountId');
  const since = searchParams.get('since');
  const until = searchParams.get('until');
  const datePreset = searchParams.get('datePreset') || 'LAST_30_DAYS';
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();

  if (!clientAccountId) {
    return NextResponse.json({ error: 'clientAccountId is required' }, { status: 400 });
  }

  if (!developerToken) {
    return NextResponse.json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN not configured' }, { status: 500 });
  }

  try {
    // Get account with decrypted tokens from DB
    const [account] = await db.select().from(clientAccounts)
      .where(eq(clientAccounts.id, clientAccountId));

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const accessToken = account.accessToken ? await decrypt(account.accessToken) : null;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token for this account' }, { status: 401 });
    }

    const customerId = account.accountId.replace(/-/g, ''); // Remove dashes from CID
    const mccId = account.mccId?.replace(/-/g, '') || customerId;

    // Build date clause
    let dateClause = '';
    if (since && until) {
      dateClause = `AND segments.date BETWEEN '${since}' AND '${until}'`;
    } else {
      // Map our presets to Google Ads presets
      const presetMap: Record<string, string> = {
        'today': 'TODAY',
        'yesterday': 'YESTERDAY',
        'last_7d': 'LAST_7_DAYS',
        'last_14d': 'LAST_14_DAYS',
        'last_30d': 'LAST_30_DAYS',
        'last_90d': 'LAST_90_DAYS',
        'this_month': 'THIS_MONTH',
        'last_month': 'LAST_MONTH',
      };
      const googlePreset = presetMap[datePreset] || 'LAST_30_DAYS';
      dateClause = `AND segments.date DURING ${googlePreset}`;
    }

    // GAQL query for campaigns with metrics
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.campaign_budget,
        campaign_budget.amount_micros,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ${dateClause}
      ORDER BY metrics.cost_micros DESC
    `;

    const response = await fetch(
      `${GOOGLE_ADS_API}/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'login-customer-id': mccId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Google Ads campaigns error:', data.error);

      // Check if token expired
      if (data.error.code === 401) {
        // Try to refresh token
        const refreshed = await refreshGoogleToken(account);
        if (refreshed) {
          // Retry with new token
          return GET(request);
        }
        return NextResponse.json({ error: 'Token expired. Please re-authenticate.' }, { status: 401 });
      }

      return NextResponse.json({
        error: data.error.message || 'Google Ads API error',
        code: data.error.code,
      }, { status: data.error.code || 500 });
    }

    // Parse results
    const campaigns = (data.results || []).map((result: any) => {
      const camp = result.campaign || {};
      const metrics = result.metrics || {};
      const budget = result.campaignBudget || {};

      const spend = (parseInt(metrics.costMicros || '0') / 1_000_000);
      const conversions = parseFloat(metrics.conversions || '0');
      const conversionsValue = parseFloat(metrics.conversionsValue || '0');
      const roas = spend > 0 && conversionsValue > 0 ? conversionsValue / spend : 0;

      return {
        id: camp.id?.toString() || '',
        name: camp.name || 'Sem nome',
        status: camp.status || 'UNKNOWN',
        objective: camp.advertisingChannelType || 'UNKNOWN',
        platform: 'google',
        accountId: customerId,
        budget: parseInt(budget.amountMicros || '0') / 1_000_000,
        spend,
        impressions: parseInt(metrics.impressions || '0'),
        clicks: parseInt(metrics.clicks || '0'),
        ctr: parseFloat(metrics.ctr || '0') * 100, // Google returns as decimal
        cpc: parseInt(metrics.averageCpc || '0') / 1_000_000,
        conversions,
        leads: 0, // Google doesn't separate leads like Meta
        cpl: 0,
        roas,
        costPerConversion: parseInt(metrics.costPerConversion || '0') / 1_000_000,
        conversionsValue,
      };
    });

    return NextResponse.json({
      success: true,
      campaigns,
      total: campaigns.length,
    });
  } catch (error: any) {
    console.error('Google campaigns fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// Refresh Google access token using refresh token
async function refreshGoogleToken(account: any): Promise<boolean> {
  try {
    if (!account.refreshToken) return false;

    const refreshToken = await decrypt(account.refreshToken);
    if (!refreshToken) return false;

    const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) return false;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      // Update in DB
      const { encrypt } = await import('@/lib/db/crypto');
      const encryptedToken = await encrypt(tokenData.access_token);

      await db.update(clientAccounts)
        .set({
          accessToken: encryptedToken,
          tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
        })
        .where(eq(clientAccounts.id, account.id));

      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to refresh Google token:', e);
    return false;
  }
}
