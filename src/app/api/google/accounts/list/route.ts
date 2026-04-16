import { NextRequest, NextResponse } from 'next/server';

// GET /api/google/accounts/list — List Google Ads accounts using temporary cookie token
// Used during the account linking flow to let the user pick which account to link
export async function GET(request: NextRequest) {
  const token = request.cookies.get('google_link_token')?.value
    || request.cookies.get('google_access_token')?.value;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  const mccId = process.env.GOOGLE_ADS_MCC_ID?.trim() || '';

  if (!token) {
    return NextResponse.json({ error: 'Nenhum token Google encontrado. Faça a autenticação novamente.' }, { status: 401 });
  }

  if (!developerToken) {
    return NextResponse.json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado' }, { status: 500 });
  }

  try {
    // Step 1: List all accessible customers
    const listResponse = await fetch(
      'https://googleads.googleapis.com/v23/customers:listAccessibleCustomers',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'developer-token': developerToken,
        },
      }
    );


      const listText = await listResponse.text();
      let listData: any;
      try {
        listData = JSON.parse(listText);
      } catch {
        throw new Error(`Google listCustomers retornou HTML. Status: ${listResponse.status}. Body: ${listText.substring(0, 150)}`);
      }

      if (listData.error) {
        return NextResponse.json({
          error: listData.error.message || 'Erro na API do Google Ads',
          code: listData.error.code,
        }, { status: listData.error.code || 500 });
      }

      const resourceNames: string[] = listData.resourceNames || [];

      if (resourceNames.length === 0) {
        return NextResponse.json({ accounts: [], message: 'Nenhuma conta encontrada' });
      }

      // Step 2: Get details for each customer
      const accounts: any[] = [];

      for (const resourceName of resourceNames) {
        const customerId = resourceName.replace('customers/', '');

        try {
          const detailRes = await fetch(
            `https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:search`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'developer-token': developerToken,
                'login-customer-id': mccId || customerId,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: `SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.manager, customer.status FROM customer LIMIT 1`,
              }),
            }
          );

          const detailText = await detailRes.text();
          let detailData: any;
          try {
            detailData = JSON.parse(detailText);
          } catch {
            console.error(`Google search detail HTML. Status: ${detailRes.status}`);
            detailData = { error: { message: 'Invalid JSON' } };
          }

          const customer = detailData.results?.[0]?.customer;

        if (customer) {
          accounts.push({
            id: String(customer.id),
            name: customer.descriptiveName || `Google Ads ${customerId}`,
            currency: customer.currencyCode || 'BRL',
            isManager: customer.manager === true,
            status: customer.status || 'ENABLED',
          });
        } else {
          accounts.push({
            id: customerId,
            name: `Google Ads ${customerId}`,
            currency: 'BRL',
            isManager: false,
            status: 'ENABLED',
          });
        }
      } catch {
        accounts.push({
          id: customerId,
          name: `Google Ads ${customerId}`,
          currency: 'BRL',
          isManager: false,
          status: 'ENABLED',
        });
      }
    }

    // Step 3: For manager accounts (MCC), get their child accounts
    const managerIds = accounts.filter(a => a.isManager).map(a => a.id);

    for (const managerId of managerIds) {
      try {
        const clientsRes = await fetch(
          `https://googleads.googleapis.com/v23/customers/${managerId}/googleAds:search`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'developer-token': developerToken,
              'login-customer-id': managerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code, customer_client.manager, customer_client.status FROM customer_client WHERE customer_client.manager = false ORDER BY customer_client.descriptive_name`,
            }),
          }
        );

        const clientsText = await clientsRes.text();
        let clientsData: any;
        try {
          clientsData = JSON.parse(clientsText);
        } catch {
          console.error(`Google MCC list HTML. Status: ${clientsRes.status}`);
          clientsData = { results: [] };
        }
        const results = clientsData.results || [];

        for (const result of results) {
          const client = result.customerClient;
          if (client && !accounts.find(a => a.id === String(client.id))) {
            accounts.push({
              id: String(client.id),
              name: client.descriptiveName || `Conta ${client.id}`,
              currency: client.currencyCode || 'BRL',
              isManager: false,
              status: client.status || 'ENABLED',
              managedBy: managerId,
            });
          }
        }
      } catch {
        // Skip if MCC listing fails
      }
    }

    // Sort: non-manager accounts first, then by name
    accounts.sort((a, b) => {
      if (a.isManager !== b.isManager) return a.isManager ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      accounts,
      total: accounts.length,
    });
  } catch (error: any) {
    console.error('Error listing Google accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar contas' },
      { status: 500 }
    );
  }
}
