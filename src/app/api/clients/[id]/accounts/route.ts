import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { clientAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/db/crypto';

// POST /api/clients/[id]/accounts — Link an ad account to a client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();
    const {
      platform,
      accountId,
      accountName,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      mccId,
      currency,
    } = body;

    if (!platform || !accountId || !accountName) {
      return NextResponse.json(
        { error: 'platform, accountId e accountName são obrigatórios' },
        { status: 400 }
      );
    }

    // Encrypt tokens before storing
    const encryptedAccess = accessToken ? await encrypt(accessToken) : null;
    const encryptedRefresh = refreshToken ? await encrypt(refreshToken) : null;

    const [account] = await db.insert(clientAccounts).values({
      clientId,
      platform,
      accountId,
      accountName,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
      mccId: mccId || null,
      currency: currency || 'BRL',
      status: 'active',
    }).returning();

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        clientId: account.clientId,
        platform: account.platform,
        accountId: account.accountId,
        accountName: account.accountName,
        currency: account.currency,
        status: account.status,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error linking account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link account' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/accounts — Remove an account link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const accountDbId = searchParams.get('accountDbId');

    if (!accountDbId) {
      return NextResponse.json({ error: 'accountDbId é obrigatório' }, { status: 400 });
    }

    const [deleted] = await db.delete(clientAccounts)
      .where(and(
        eq(clientAccounts.id, accountDbId),
        eq(clientAccounts.clientId, clientId)
      ))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/clients/[id]/accounts — Get decrypted tokens for a client's account (internal use)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    let query = db.select().from(clientAccounts)
      .where(eq(clientAccounts.clientId, clientId));

    const accounts = await query;
    const filtered = platform
      ? accounts.filter(a => a.platform === platform)
      : accounts;

    // Decrypt tokens for API use
    const decrypted = await Promise.all(filtered.map(async (acc) => ({
      ...acc,
      accessToken: acc.accessToken ? await decrypt(acc.accessToken) : null,
      refreshToken: acc.refreshToken ? await decrypt(acc.refreshToken) : null,
    })));

    return NextResponse.json({ success: true, accounts: decrypted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
