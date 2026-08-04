import { Module } from '@nestjs/common';
import { LoggerModule } from '@app/logger';
import { StocksController } from './controllers/stocks.controller';
import { StocksService } from './services/stocks.service';

@Module({
  imports: [LoggerModule],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}
