import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

export interface DatabaseModuleOptions {
  database?: string;
  envPrefix?: string;
}

type PostgresDataSourceOptions = Extract<
  DataSourceOptions,
  { type: 'postgres' }
>;

export function createPostgresOptions(
  options: DatabaseModuleOptions = {},
): PostgresDataSourceOptions {
  const env = (name: string): string | undefined =>
    process.env[`${options.envPrefix ?? ''}${name}`] ?? process.env[name];

  return {
    type: 'postgres',
    host: env('DB_HOST') ?? 'localhost',
    port: Number(env('DB_PORT') ?? 5432),
    username: env('DB_USERNAME') ?? 'postgres',
    password: env('DB_PASSWORD') ?? 'postgres',
    database: env('DB_NAME') ?? options.database ?? 'postgres',
    synchronize: false,
    logging: env('DB_LOGGING') === 'true',
  };
}

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions = {}): DynamicModule {
    const typeOrmModule = TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...createPostgresOptions(options),
        autoLoadEntities: true,
      }),
    });

    return {
      module: DatabaseModule,
      imports: [typeOrmModule],
      exports: [typeOrmModule],
    };
  }
}
