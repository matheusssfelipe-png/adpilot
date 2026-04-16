import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adsetId = searchParams.get('adsetId');
  const datePreset = searchParams.get('datePreset') || 'last_30d';
  const since = searchParams.get('since');
  const until = searchParams.get('until');

  const token = request.cookies.get('meta_access_token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!adsetId) {
    return NextResponse.json(
      { error: 'adsetId is required' },
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
    const insightsParam = since && until
      ? `insights.time_range({"since":"${since}","until":"${until}"})`
      : `insights.date_preset(${datePreset})`;

    const url = `https://graph.facebook.com/v21.0/${adsetId}/ads?fields=id,name,status,${insightsParam}{spend,impressions,clicks,cpc,ctr,conversions,actions,action_values,purchase_roas}&limit=100&access_token=${token}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('Meta ads error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const ads = (data.data || []).map((ad: any) => {
      const insights = ad.insights?.data?.[0] || {};
      const spend = parseFloat(insights.spend || '0');
      const impressions = parseInt(insights.impressions || '0');
      const clicks = parseInt(insights.clicks || '0');
      const ctr = parseFloat(insights.ctr || '0');
      const cpc = parseFloat(insights.cpc || '0');
      
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
        id: ad.id,
        name: ad.name,
        status: ad.status,
        adsetId,
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        conversions,
        leads,
        cpl,
        roas,
      };
    });

    return NextResponse.json({ success: true, ads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
