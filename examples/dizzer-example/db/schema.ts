import { bigserial, boolean, pgTable, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: text('email').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});
