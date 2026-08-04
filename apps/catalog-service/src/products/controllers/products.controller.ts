import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodValidationPipe } from '@app/utils/pipes';
import type {
  CreateProductDto,
  DeleteProductDto,
  ProductSearchFilters,
  UpdateProductDto,
} from '../dto/products.dto';
import {
  createProductDto,
  deleteProductDto,
  productSearchFilters,
  updateProductDto,
} from '../dto/products.dto';
import { ProductsService } from '../services/products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(createProductDto)) body: CreateProductDto,
  ) {
    return this.productsService.create(body);
  }

  @Get()
  async filter(
    @Query(new ZodValidationPipe(productSearchFilters))
    filters: ProductSearchFilters,
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { products, total } = await this.productsService.filter({
      ...filters,
      page,
      limit,
    });
    return { items: products, total, page, limit };
  }

  @Get(':id')
  findById(
    @Param(new ZodValidationPipe(deleteProductDto)) params: DeleteProductDto,
  ) {
    return this.productsService.findById(params.id);
  }

  @Patch(':id')
  update(
    @Param(new ZodValidationPipe(deleteProductDto)) params: DeleteProductDto,
    @Body(new ZodValidationPipe(updateProductDto)) body: UpdateProductDto,
  ) {
    return this.productsService.update(params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param(new ZodValidationPipe(deleteProductDto)) params: DeleteProductDto,
  ) {
    await this.productsService.delete(params.id);
    return null;
  }
}
