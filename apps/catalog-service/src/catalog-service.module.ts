import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';

@Module({
  imports: [
    DatabaseModule.forRoot({
      database: 'catalog',
      envPrefix: 'CATALOG_',
    }),
    LoggerModule,
  ],
  controllers: [],
  providers: [],
})
export class CatalogServiceModule {}
