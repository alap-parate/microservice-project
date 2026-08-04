import { Module } from '@nestjs/common';
import { LoggerModule } from '@app/logger';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { PrismaModule } from './database/prisma.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    BrandsModule,
    CategoriesModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [],
})
export class CatalogServiceModule {}
