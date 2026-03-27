import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const token = searchParams.get('token');

  if (!accountId || !token) {
    return NextResponse.json(
      { error: 'accountId and token are required' },
      { status: 400 }
    );
  }

  try {
    // Fetch campaigns with insights for this ad account
    const campaignsUrl = `https://graph.facebook.com/v21.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,insights{spend,impressions,clicks,cpc,ctr,conversions,actions,cost_per_action_type}&limit=100&access_token=${token}`;
    
    const res = await fetch(campaignsUrl);
    const data = await res.json();

    if (data.error) {
      console.error('Meta campaigns error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const campaigns = (data.data || []).map((camp: any) => {
      const insights = camp.insights?.data?.[0] || {};
      const spend = parseFloat(insights.spend || '0');
      const impressions = parseInt(insights.impressions || '0');
      const clicks = parseInt(insights.clicks || '0');
      const ctr = parseFloat(insights.ctr || '0');
      const cpc = parseFloat(insights.cpc || '0');
      
      // Extract conversions from actions
      let conversions = 0;
      if (insights.actions) {
        const convAction = insights.actions.find(
          (a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' || 
                       a.action_type === 'purchase' ||
                       a.action_type === 'lead' ||
                       a.action_type === 'complete_registration'
        );
        conversions = convAction ? parseInt(convAction.value || '0') : 0;
      }

      const roas = spend > 0 && conversions > 0 ? (conversions * 50) / spend : 0; // Rough estimate

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status, // ACTIVE, PAUSED, DELETED, ARCHIVED
        objective: camp.objective || 'UNKNOWN',
        platform: 'meta',
        accountId: accountId,
        budget: parseFloat(camp.daily_budget || camp.lifetime_budget || '0') / 100, // Meta returns in cents
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        conversions,
        roas,
        startDate: camp.start_time,
        stopDate: camp.stop_time,
      };
    });

    return NextResponse.json({
      success: true,
      campaigns,
      total: campaigns.length,
    });
  } catch (error: any) {
    console.error('Meta campaigns fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
