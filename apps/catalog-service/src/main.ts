import { NestFactory } from '@nestjs/core';
import { Logger } from '@app/logger';
import { CatalogServiceModule } from './catalog-service.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(CatalogServiceModule, {
    bufferLogs: true,
  });
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`Catalog service listening on port ${port}`);
}

void bootstrap();
