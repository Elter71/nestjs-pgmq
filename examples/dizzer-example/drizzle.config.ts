import { type Config } from 'drizzle-kit';

const url = process.env.DB_URL;
if (!url) throw new Error('DB_URL is missing');

export default {
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },

} satisfies Config;
