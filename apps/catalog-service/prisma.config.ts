import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { createDatabaseUrl } from '../../packages/database/src/database-url';

loadEnv({ path: path.join(__dirname, '.env') });

const url = (process.env.DATABASE_URL ??= createDatabaseUrl({
  database: 'catalog',
  envPrefix: 'CATALOG_',
}));

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: url,
  },
});
