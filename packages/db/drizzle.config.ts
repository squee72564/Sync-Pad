import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  console.error(`DATABASE_URL required, found: ${process.env.DATABASE_URL}`);
  process.exit(1);
}

export default defineConfig({
  schema: './src/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
