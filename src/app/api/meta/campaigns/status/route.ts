import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { campaignId, status, token } = await request.json();

    if (!campaignId || !status || !token) {
      return NextResponse.json(
        { error: 'campaignId, status and token are required' },
        { status: 400 }
      );
    }

    if (!['ACTIVE', 'PAUSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE or PAUSED' },
        { status: 400 }
      );
    }

    // Update campaign status on Meta Graph API
    const url = `https://graph.facebook.com/v21.0/${campaignId}`;
    
    // We send form data or JSON
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: status,
        access_token: token,
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error('Meta update campaign error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: campaignId, status: status });
  } catch (error: any) {
    console.error('Failed to update campaign status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
