import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const datePreset = searchParams.get('datePreset') || 'last_30d';
  const since = searchParams.get('since');
  const until = searchParams.get('until');

  // Token from cookie (secure) or Authorization header as fallback
  const token = request.cookies.get('meta_access_token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!accountId) {
    return NextResponse.json(
      { error: 'accountId is required' },
      { status: 400 }
    );
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Not authenticated with Meta' },
      { status: 401 }
    );
  }

  try {
    // Build insights parameter — use time_range for custom dates, date_preset for presets
    const insightsParam = since && until
      ? `insights.time_range({"since":"${since}","until":"${until}"})`
      : `insights.date_preset(${datePreset})`;

    const campaignsUrl = `https://graph.facebook.com/v21.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,${insightsParam}{spend,impressions,clicks,cpc,ctr,conversions,actions,action_values,cost_per_action_type,purchase_roas}&limit=100&access_token=${token}`;
    
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
      let leads = 0;

      if (insights.actions) {
        const convAction = insights.actions.find(
          (a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' || 
                       a.action_type === 'purchase' ||
                       a.action_type === 'complete_registration'
        );
        conversions = convAction ? parseInt(convAction.value || '0') : 0;

        const leadAction = insights.actions.find(
          (a: any) => a.action_type === 'lead' || 
                      a.action_type === 'offsite_conversion.fb_pixel_lead' ||
                      a.action_type === 'onsite_conversion.lead_grouped'
        );
        leads = leadAction ? parseInt(leadAction.value || '0') : 0;
      }

      // Use purchase_roas from API if available, otherwise calculate from action_values
      let roas = 0;
      if (insights.purchase_roas) {
        const roasEntry = insights.purchase_roas.find((r: any) => r.action_type === 'omni_purchase');
        roas = roasEntry ? parseFloat(roasEntry.value || '0') : 0;
      } else if (insights.action_values) {
        const purchaseValue = insights.action_values.find(
          (a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        roas = purchaseValue && spend > 0 ? parseFloat(purchaseValue.value || '0') / spend : 0;
      }
      const cpl = leads > 0 ? spend / leads : 0;

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
        leads,
        cpl,
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
