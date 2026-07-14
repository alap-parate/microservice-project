import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { createPostgresOptions } from '../../../../packages/database/src';

export default new DataSource({
  ...createPostgresOptions({
    database: 'catalog',
    envPrefix: 'CATALOG_',
  }),
  entities: [join(__dirname, '../**/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
});
