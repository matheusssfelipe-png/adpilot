import { NextRequest, NextResponse } from 'next/server';

// Google Ads API - List accessible customer accounts
export async function GET(request: NextRequest) {
  const token = request.cookies.get('google_access_token')?.value
    || request.headers.get('x-google-token');
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();

  if (!token) {
    return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
  }

  if (!developerToken) {
    return NextResponse.json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado' }, { status: 500 });
  }

  try {
    // Step 1: List all accessible customers
    const listUrl = 'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers';
    const listResponse = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'developer-token': developerToken,
      },
    });

    const listText = await listResponse.text();
    let listData: any;
    try {
      listData = JSON.parse(listText);
    } catch {
      return NextResponse.json({
        error: 'Resposta inválida da Google Ads API',
        raw: listText.substring(0, 300),
        status: listResponse.status,
      }, { status: 502 });
    }

    if (listData.error) {
      return NextResponse.json({
        error: listData.error.message || 'Erro na API do Google Ads',
        code: listData.error.code,
        details: listData.error.details,
        devToken: developerToken ? `${developerToken.substring(0, 4)}...` : 'missing',
      }, { status: listData.error.code || 500 });
    }

    const customerResourceNames: string[] = listData.resourceNames || [];

    if (customerResourceNames.length === 0) {
      return NextResponse.json({ accounts: [], message: 'Nenhuma conta encontrada' });
    }

    // Step 2: Get basic info for each customer
    const accounts: any[] = [];

    for (const resourceName of customerResourceNames) {
      const customerId = resourceName.replace('customers/', '');

      // Add each account with basic info first
      // Try to get details but don't fail if we can't
      try {
        const queryResponse = await fetch(
          `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'developer-token': developerToken,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                SELECT
                  customer.id,
                  customer.descriptive_name,
                  customer.currency_code,
                  customer.manager,
                  customer.status
                FROM customer
                LIMIT 1
              `,
            }),
          }
        );

        const queryText = await queryResponse.text();
        let queryData: any;
        try {
          queryData = JSON.parse(queryText);
        } catch {
          // Can't parse, add with basic info
          accounts.push({
            id: customerId,
            name: `Google Ads ${customerId}`,
            currency: 'BRL',
            isManager: false,
            status: 'ENABLED',
          });
          continue;
        }

        let customer = null;
        if (Array.isArray(queryData) && queryData[0]?.results) {
          customer = queryData[0].results[0]?.customer;
        } else if (queryData?.results) {
          customer = queryData.results[0]?.customer;
        }

        if (customer) {
          accounts.push({
            id: customerId,
            name: customer.descriptiveName || `Conta ${customerId}`,
            currency: customer.currencyCode || 'BRL',
            isManager: customer.manager === true,
            status: customer.status || 'ENABLED',
          });
        } else {
          // Couldn't get details, add with basic info
          accounts.push({
            id: customerId,
            name: `Google Ads ${customerId}`,
            currency: 'BRL',
            isManager: false,
            status: 'ENABLED',
          });
        }
      } catch {
        // Failed to get details, add with basic info anyway
        accounts.push({
          id: customerId,
          name: `Google Ads ${customerId}`,
          currency: 'BRL',
          isManager: false,
          status: 'ENABLED',
        });
      }
    }

    // Step 3: For manager accounts, try to get their client accounts
    const managerIds = accounts.filter(a => a.isManager).map(a => a.id);

    for (const mccId of managerIds) {
      try {
        const clientsResponse = await fetch(
          `https://googleads.googleapis.com/v18/customers/${mccId}/googleAds:searchStream`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'developer-token': developerToken,
              'login-customer-id': mccId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                SELECT
                  customer_client.id,
                  customer_client.descriptive_name,
                  customer_client.currency_code,
                  customer_client.manager,
                  customer_client.status
                FROM customer_client
                WHERE customer_client.manager = false
                ORDER BY customer_client.descriptive_name
              `,
            }),
          }
        );

        const clientsText = await clientsResponse.text();
        let clientsData: any;
        try {
          clientsData = JSON.parse(clientsText);
        } catch {
          continue;
        }

        let results: any[] = [];
        if (Array.isArray(clientsData) && clientsData[0]?.results) {
          results = clientsData[0].results;
        } else if (clientsData?.results) {
          results = clientsData.results;
        }

        for (const result of results) {
          const client = result.customerClient;
          if (client && !accounts.find(a => a.id === String(client.id))) {
            accounts.push({
              id: String(client.id),
              name: client.descriptiveName || `Conta ${client.id}`,
              currency: client.currencyCode || 'BRL',
              isManager: false,
              status: client.status || 'ENABLED',
              managedBy: mccId,
            });
          }
        }
      } catch {
        // Skip if MCC client listing fails
      }
    }

    return NextResponse.json({
      accounts,
      totalAccessible: customerResourceNames.length,
      managersFound: managerIds.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Erro ao buscar contas do Google Ads', details: message },
      { status: 500 }
    );
  }
}
