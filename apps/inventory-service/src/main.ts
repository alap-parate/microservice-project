import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@app/logger';
import { InventoryServiceModule } from './inventory-service.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';

// Nest does not load app .env automatically; monorepo starts from repo root.
loadEnv({ path: path.resolve(process.cwd(), 'apps/inventory-service/.env') });

async function bootstrap() {
  const app = await NestFactory.create(InventoryServiceModule, {
    bufferLogs: true,
  });
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);
  logger.log(`Inventory service listening on port ${port}`);
}

void bootstrap();
