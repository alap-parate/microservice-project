import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { InventoryServiceController } from './inventory-service.controller';
import { InventoryServiceService } from './inventory-service.service';

@Module({
  imports: [
    DatabaseModule.forRoot({
      database: 'inventory',
      envPrefix: 'INVENTORY_',
    }),
    LoggerModule,
  ],
  controllers: [InventoryServiceController],
  providers: [InventoryServiceService],
})
export class InventoryServiceModule {}
