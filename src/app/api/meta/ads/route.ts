import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adsetId = searchParams.get('adsetId');
  const token = searchParams.get('token');
  const datePreset = searchParams.get('datePreset') || 'last_30d';

  if (!adsetId || !token) {
    return NextResponse.json(
      { error: 'adsetId and token are required' },
      { status: 400 }
    );
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${adsetId}/ads?fields=id,name,status,insights.date_preset(${datePreset}){spend,impressions,clicks,cpc,ctr,conversions,actions}&limit=100&access_token=${token}`;
    
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

      const roas = spend > 0 && conversions > 0 ? (conversions * 50) / spend : 0;
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
