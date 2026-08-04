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
  AdjustStockDto,
  CreateStockDto,
  ProductIdParam,
  StockIdParam,
  StockSearchFilters,
  UpdateStockDto,
} from '../dto/stocks.dto';
import {
  adjustStockDto,
  createStockDto,
  productIdParam,
  stockIdParam,
  stockSearchFilters,
  updateStockDto,
} from '../dto/stocks.dto';
import { StocksService } from '../services/stocks.service';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(createStockDto)) body: CreateStockDto,
  ) {
    return this.stocksService.create(body);
  }

  @Get()
  async filter(
    @Query(new ZodValidationPipe(stockSearchFilters))
    filters: StockSearchFilters,
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { stocks, total } = await this.stocksService.filter({
      ...filters,
      page,
      limit,
    });
    return { items: stocks, total, page, limit };
  }

  @Get('product/:productId')
  findByProductId(
    @Param(new ZodValidationPipe(productIdParam)) params: ProductIdParam,
  ) {
    return this.stocksService.findByProductId(params.productId);
  }

  @Get(':id')
  findById(
    @Param(new ZodValidationPipe(stockIdParam)) params: StockIdParam,
  ) {
    return this.stocksService.findById(params.id);
  }

  @Patch(':id')
  update(
    @Param(new ZodValidationPipe(stockIdParam)) params: StockIdParam,
    @Body(new ZodValidationPipe(updateStockDto)) body: UpdateStockDto,
  ) {
    return this.stocksService.update(params.id, body.quantity);
  }

  @Post(':id/adjust')
  adjust(
    @Param(new ZodValidationPipe(stockIdParam)) params: StockIdParam,
    @Body(new ZodValidationPipe(adjustStockDto)) body: AdjustStockDto,
  ) {
    return this.stocksService.adjust(params.id, body.delta);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param(new ZodValidationPipe(stockIdParam)) params: StockIdParam,
  ) {
    await this.stocksService.delete(params.id);
    return null;
  }
}
