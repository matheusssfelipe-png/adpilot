import { db } from './src/lib/db/db';
import { clientAccounts } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from './src/lib/db/crypto';

async function test() {
  const accountId = 'a3c5b205-88c9-4881-b5f6-74621a3cd3f7'; 
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();

  // Get account
  const [account] = await db.select().from(clientAccounts).where(eq(clientAccounts.id, accountId));
  if (!account) {
    console.log("Account not found");
    return;
  }

  console.log("Account:", account);

  const accessToken = account.accessToken ? await decrypt(account.accessToken) : null;
  console.log("Access token prefix:", accessToken?.substring(0, 10));

  const customerId = account.accountId.replace(/-/g, '');
  const mccId = account.mccId?.replace(/-/g, '') || customerId;

  console.log("customerId:", customerId);
  console.log("mccId:", mccId);

  const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status
      FROM campaign
      LIMIT 1
  `;

  // Try 1: MCC ID
  const res1 = await fetch(
    `https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken || '',
        'login-customer-id': mccId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  console.log("Res1 status:", res1.status);
  console.log("Res1 data:", JSON.stringify(await res1.json(), null, 2));

  // Try 2: Customer ID
  const res2 = await fetch(
    `https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken || '',
        'login-customer-id': customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  console.log("Res2 status:", res2.status);
  console.log("Res2 data:", JSON.stringify(await res2.json(), null, 2));

  // Try 3: No header
  const res3 = await fetch(
    `https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  console.log("Res3 status:", res3.status);
  console.log("Res3 data:", JSON.stringify(await res3.json(), null, 2));
}

test().catch(console.error);
