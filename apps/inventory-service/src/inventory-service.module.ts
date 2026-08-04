import { Module } from '@nestjs/common';
import { LoggerModule } from '@app/logger';
import { PrismaModule } from './database/prisma.module';
import { StocksModule } from './stocks/stocks.module';

@Module({
  imports: [PrismaModule, LoggerModule, StocksModule],
  controllers: [],
  providers: [],
})
export class InventoryServiceModule {}
