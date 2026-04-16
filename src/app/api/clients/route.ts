import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { clients, clientAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/clients — List all clients with their accounts
export async function GET() {
  try {
    const allClients = await db.select().from(clients).orderBy(clients.name);
    const allAccounts = await db.select({
      id: clientAccounts.id,
      clientId: clientAccounts.clientId,
      platform: clientAccounts.platform,
      accountId: clientAccounts.accountId,
      accountName: clientAccounts.accountName,
      currency: clientAccounts.currency,
      status: clientAccounts.status,
      lastSyncedAt: clientAccounts.lastSyncedAt,
      createdAt: clientAccounts.createdAt,
    }).from(clientAccounts);

    // Group accounts by client
    const clientsWithAccounts = allClients.map(client => ({
      ...client,
      accounts: allAccounts.filter(a => a.clientId === client.id),
    }));

    return NextResponse.json({ success: true, clients: clientsWithAccounts });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients — Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, notes, avatarColor } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const [newClient] = await db.insert(clients).values({
      name: name.trim(),
      slug,
      notes: notes || null,
      avatarColor: avatarColor || '#6366f1',
    }).returning();

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    if (error.message?.includes('unique')) {
      return NextResponse.json({ error: 'Já existe um cliente com esse nome' }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}
