import { NextRequest, NextResponse } from 'next/server';

// Fetch real Meta ad accounts on the server side (Bug #11 fix)
export async function GET(request: NextRequest) {
  const token = request.cookies.get('meta_access_token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Not authenticated with Meta' },
      { status: 401 }
    );
  }

  try {
    let allData: any[] = [];
    let url: string | null = `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status,currency,business{id,name}&limit=100&access_token=${token}`;

    while (url) {
      const res: Response = await fetch(url);
      const data: { data?: any[]; error?: { message: string }; paging?: { next?: string } } = await res.json();

      if (data.error) {
        return NextResponse.json({ error: data.error.message }, { status: 400 });
      }

      if (data.data) {
        allData = [...allData, ...data.data];
      }
      url = data.paging?.next || null;
    }

    const accounts = allData.map((acc: any) => ({
      id: acc.id,
      name: acc.name || 'Conta sem nome',
      businessName: acc.business?.name || 'Sem Business Manager',
      businessId: acc.business?.id || 'unknown',
      currency: acc.currency || 'BRL',
      status: acc.account_status === 1 ? 'active' : 'disconnected',
    }));

    return NextResponse.json({ accounts, total: accounts.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
