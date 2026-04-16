import { pgTable, uuid, text, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';

// ============================
// Tabela: clients
// ============================
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  avatarColor: varchar('avatar_color', { length: 7 }).default('#6366f1'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================
// Tabela: client_accounts
// ============================
export const clientAccounts = pgTable('client_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 10 }).notNull(), // 'google' | 'meta'
  accountId: varchar('account_id', { length: 100 }).notNull(), // Google CID or Meta act_xxx
  accountName: varchar('account_name', { length: 255 }).notNull(),
  accessToken: text('access_token'), // encrypted
  refreshToken: text('refresh_token'), // encrypted (Google uses this)
  tokenExpiresAt: timestamp('token_expires_at'),
  mccId: varchar('mcc_id', { length: 20 }), // Google: login-customer-id
  currency: varchar('currency', { length: 10 }).default('BRL'),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active | expired | error
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================
// Types inferred from schema
// ============================
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ClientAccount = typeof clientAccounts.$inferSelect;
export type NewClientAccount = typeof clientAccounts.$inferInsert;
