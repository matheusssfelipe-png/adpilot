import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { clientAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/db/crypto';

const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v23';

// POST /api/google/campaigns/mutate
// Body: { clientAccountId, operations: [{ type, campaignId, ... }] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientAccountId, operations } = body;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();

    if (!clientAccountId || !operations?.length) {
      return NextResponse.json(
        { error: 'clientAccountId and operations are required' },
        { status: 400 }
      );
    }

    if (!developerToken) {
      return NextResponse.json({ error: 'Developer token not configured' }, { status: 500 });
    }

    // Get account
    const [account] = await db.select().from(clientAccounts)
      .where(eq(clientAccounts.id, clientAccountId));

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const accessToken = account.accessToken ? await decrypt(account.accessToken) : null;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const customerId = account.accountId.replace(/-/g, '');
    const mccId = account.mccId?.replace(/-/g, '') || customerId;
    const results: any[] = [];

    for (const op of operations) {
      try {
        let result;

        switch (op.type) {
          case 'UPDATE_STATUS': {
            result = await mutateCampaignStatus(
              accessToken, developerToken, customerId, mccId,
              op.campaignId, op.status
            );
            break;
          }
          case 'UPDATE_BUDGET': {
            result = await mutateCampaignBudget(
              accessToken, developerToken, customerId, mccId,
              op.budgetResourceName, op.amountMicros
            );
            break;
          }
          default:
            result = { error: `Unknown operation type: ${op.type}` };
        }

        results.push({ operation: op.type, campaignId: op.campaignId, ...result });
      } catch (e: any) {
        results.push({ operation: op.type, campaignId: op.campaignId, error: e.message });
      }
    }

    const allSuccess = results.every(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      results,
    });
  } catch (error: any) {
    console.error('Google Ads mutate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Pause or enable a campaign
async function mutateCampaignStatus(
  accessToken: string, developerToken: string,
  customerId: string, mccId: string,
  campaignId: string, status: 'ENABLED' | 'PAUSED'
) {
  const response = await fetch(
    `${GOOGLE_ADS_API}/customers/${customerId}/campaigns:mutate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': mccId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operations: [{
          updateMask: 'status',
          update: {
            resourceName: `customers/${customerId}/campaigns/${campaignId}`,
            status,
          },
        }],
      }),
    }
  );

  const data = await response.json();
  if (data.error) {
    return { success: false, error: data.error.message };
  }
  return { success: true, message: `Campaign ${status === 'PAUSED' ? 'paused' : 'enabled'}` };
}

// Update campaign budget
async function mutateCampaignBudget(
  accessToken: string, developerToken: string,
  customerId: string, mccId: string,
  budgetResourceName: string, amountMicros: string
) {
  const response = await fetch(
    `${GOOGLE_ADS_API}/customers/${customerId}/campaignBudgets:mutate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': mccId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operations: [{
          updateMask: 'amountMicros',
          update: {
            resourceName: budgetResourceName,
            amountMicros,
          },
        }],
      }),
    }
  );

  const data = await response.json();
  if (data.error) {
    return { success: false, error: data.error.message };
  }
  return { success: true, message: 'Budget updated' };
}
