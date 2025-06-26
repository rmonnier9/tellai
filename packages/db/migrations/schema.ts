import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  index,
  uniqueIndex,
  vector,
  boolean,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const prismaMigrations = pgTable('_prisma_migrations', {
  id: varchar({ length: 36 }).primaryKey().notNull(),
  checksum: varchar({ length: 64 }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
  migrationName: varchar('migration_name', { length: 255 }).notNull(),
  logs: text(),
  rolledBackAt: timestamp('rolled_back_at', {
    withTimezone: true,
    mode: 'string',
  }),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  appliedStepsCount: integer('applied_steps_count').default(0).notNull(),
});

export const waitlist = pgTable(
  'waitlist',
  {
    email: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    embedding: vector({ dimensions: 1024 }),
  },
  (table) => [
    index('embedding_idx').using(
      'hnsw',
      table.embedding.asc().nullsLast().op('vector_cosine_ops')
    ),
    uniqueIndex('waitlist_email_key').using(
      'btree',
      table.email.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const verification = pgTable('verification', {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }),
  updatedAt: timestamp({ precision: 3, mode: 'string' }),
});

export const user = pgTable(
  'user',
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().notNull(),
    image: text(),
    createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  (table) => [
    uniqueIndex('user_email_key').using(
      'btree',
      table.email.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const session = pgTable(
  'session',
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    token: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text().notNull(),
    activeOrganizationId: text(),
  },
  (table) => [
    uniqueIndex('session_token_key').using(
      'btree',
      table.token.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'session_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

export const account = pgTable(
  'account',
  {
    id: text().primaryKey().notNull(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
    refreshTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'account_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

export const organization = pgTable(
  'organization',
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    slug: text(),
    logo: text(),
    createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    metadata: text(),
  },
  (table) => [
    uniqueIndex('organization_slug_key').using(
      'btree',
      table.slug.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const member = pgTable(
  'member',
  {
    id: text().primaryKey().notNull(),
    organizationId: text().notNull(),
    userId: text().notNull(),
    role: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'member_organizationId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'member_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

export const invitation = pgTable(
  'invitation',
  {
    id: text().primaryKey().notNull(),
    organizationId: text().notNull(),
    email: text().notNull(),
    role: text(),
    status: text().notNull(),
    expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    inviterId: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'invitation_organizationId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [user.id],
      name: 'invitation_inviterId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);
