export interface DatabaseUrlOptions {
  database?: string;
  envPrefix?: string;
}

export function createDatabaseUrl(options: DatabaseUrlOptions = {}): string {
  const env = (name: string): string | undefined =>
    process.env[`${options.envPrefix ?? ''}${name}`] ?? process.env[name];

  const host = env('DB_HOST') ?? 'localhost';
  const port = env('DB_PORT') ?? '5432';
  const username = encodeURIComponent(env('DB_USERNAME') ?? 'postgres');
  const password = encodeURIComponent(env('DB_PASSWORD') ?? 'postgres');
  const database = env('DB_NAME') ?? options.database ?? 'postgres';

  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
}
