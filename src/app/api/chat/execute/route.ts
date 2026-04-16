import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { clientAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/db/crypto';

// POST /api/chat/execute — Central action router for Jarvis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientAccountId, action } = body;

    if (!clientAccountId || !action) {
      return NextResponse.json(
        { error: 'clientAccountId and action are required' },
        { status: 400 }
      );
    }

    const { type, platform, campaignId, campaignName, params } = action;

    // Route to correct API based on platform and action type
    let result;

    if (platform === 'google') {
      result = await executeGoogleAction(clientAccountId, type, campaignId, params);
    } else if (platform === 'meta') {
      result = await executeMetaAction(clientAccountId, type, campaignId, params, request);
    } else {
      return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      campaignName,
      actionType: type,
      error: result.error,
    });
  } catch (error: any) {
    console.error('Chat execute error:', error);
    return NextResponse.json(
      { error: error.message || 'Action execution failed' },
      { status: 500 }
    );
  }
}

async function executeGoogleAction(
  clientAccountId: string,
  type: string,
  campaignId: string,
  params: any
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  switch (type) {
    case 'PAUSE_CAMPAIGN':
    case 'ACTIVATE_CAMPAIGN': {
      const status = type === 'PAUSE_CAMPAIGN' ? 'PAUSED' : 'ENABLED';
      const res = await fetch(`${baseUrl}/api/google/campaigns/mutate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientAccountId,
          operations: [{ type: 'UPDATE_STATUS', campaignId, status }],
        }),
      });
      const data = await res.json();
      return {
        success: data.success,
        message: data.success
          ? `✅ Campanha ${status === 'PAUSED' ? 'pausada' : 'ativada'} com sucesso!`
          : `❌ Erro: ${data.results?.[0]?.error || 'Falha ao executar'}`,
        error: data.results?.[0]?.error,
      };
    }

    case 'UPDATE_CAMPAIGN_BUDGET': {
      const amountMicros = String(Math.round((params?.budget || 0) * 1_000_000));
      const res = await fetch(`${baseUrl}/api/google/campaigns/mutate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientAccountId,
          operations: [{
            type: 'UPDATE_BUDGET',
            campaignId,
            budgetResourceName: params?.budgetResourceName,
            amountMicros,
          }],
        }),
      });
      const data = await res.json();
      return {
        success: data.success,
        message: data.success
          ? `✅ Orçamento atualizado para R$ ${params?.budget?.toFixed(2)}!`
          : `❌ Erro: ${data.results?.[0]?.error || 'Falha ao atualizar budget'}`,
        error: data.results?.[0]?.error,
      };
    }

    default:
      return { success: false, message: `Ação não suportada: ${type}`, error: 'Unsupported action' };
  }
}

async function executeMetaAction(
  clientAccountId: string,
  type: string,
  campaignId: string,
  params: any,
  originalRequest: NextRequest
) {
  // Get token from DB
  const [account] = await db.select().from(clientAccounts)
    .where(eq(clientAccounts.id, clientAccountId));

  if (!account?.accessToken) {
    return { success: false, message: 'Token Meta não encontrado', error: 'No token' };
  }

  const token = await decrypt(account.accessToken);
  const baseUrl = 'https://graph.facebook.com/v21.0';

  switch (type) {
    case 'PAUSE_CAMPAIGN':
    case 'ACTIVATE_CAMPAIGN': {
      const status = type === 'PAUSE_CAMPAIGN' ? 'PAUSED' : 'ACTIVE';
      const res = await fetch(`${baseUrl}/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, access_token: token }),
      });
      const data = await res.json();
      return {
        success: !data.error,
        message: !data.error
          ? `✅ Campanha ${status === 'PAUSED' ? 'pausada' : 'ativada'} com sucesso!`
          : `❌ Erro: ${data.error.message}`,
        error: data.error?.message,
      };
    }

    case 'UPDATE_CAMPAIGN_BUDGET': {
      const budgetCents = Math.round((params?.budget || 0) * 100);
      const res = await fetch(`${baseUrl}/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_budget: budgetCents,
          access_token: token,
        }),
      });
      const data = await res.json();
      return {
        success: !data.error,
        message: !data.error
          ? `✅ Orçamento atualizado para R$ ${params?.budget?.toFixed(2)}!`
          : `❌ Erro: ${data.error.message}`,
        error: data.error?.message,
      };
    }

    default:
      return { success: false, message: `Ação Meta não suportada: ${type}`, error: 'Unsupported' };
  }
}
