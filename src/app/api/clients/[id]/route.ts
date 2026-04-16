import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { clients, clientAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/clients/[id] — Get single client with accounts
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const accounts = await db.select({
      id: clientAccounts.id,
      clientId: clientAccounts.clientId,
      platform: clientAccounts.platform,
      accountId: clientAccounts.accountId,
      accountName: clientAccounts.accountName,
      currency: clientAccounts.currency,
      status: clientAccounts.status,
      mccId: clientAccounts.mccId,
      lastSyncedAt: clientAccounts.lastSyncedAt,
      createdAt: clientAccounts.createdAt,
    }).from(clientAccounts).where(eq(clientAccounts.clientId, id));

    return NextResponse.json({ success: true, client: { ...client, accounts } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/clients/[id] — Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, notes, avatarColor } = body;

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (name) {
      updates.name = name.trim();
      updates.slug = name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (notes !== undefined) updates.notes = notes;
    if (avatarColor) updates.avatarColor = avatarColor;

    const [updated] = await db.update(clients)
      .set(updates)
      .where(eq(clients.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients/[id] — Delete client (cascades to accounts)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db.delete(clients)
      .where(eq(clients.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
