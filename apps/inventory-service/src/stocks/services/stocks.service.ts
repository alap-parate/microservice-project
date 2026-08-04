import { Injectable } from '@nestjs/common';
import { Prisma, Stock, PrismaClient } from '../../../prisma/generated';
import type {
  CreateStockDto,
  StockSearchFilters,
} from '../dto/stocks.dto';
import {
  isRecordNotFound,
  isUniqueConstraintViolation,
} from '@app/utils/exceptions';
import { PinoLogger } from '@app/logger';
import {
  InsufficientStockError,
  StockAlreadyExistsError,
  StockNotFoundError,
} from '../errors/stock-errors';

@Injectable()
export class StocksService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StocksService.name);
  }

  async create(data: CreateStockDto): Promise<Stock> {
    try {
      return await this.prisma.stock.create({ data });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new StockAlreadyExistsError(data.productId);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to create stock for product ${data.productId}`,
      );
      throw error;
    }
  }

  async update(id: string, quantity: number): Promise<Stock> {
    try {
      return await this.prisma.stock.update({
        where: { id },
        data: { quantity },
      });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new StockNotFoundError(id);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to update stock ${id}`,
      );
      throw error;
    }
  }

  async adjust(id: string, delta: number): Promise<Stock> {
    const stock = await this.findById(id);
    const nextQuantity = stock.quantity + delta;
    if (nextQuantity < 0) {
      throw new InsufficientStockError(id);
    }

    try {
      return await this.prisma.stock.update({
        where: { id },
        data: { quantity: nextQuantity },
      });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new StockNotFoundError(id);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to adjust stock ${id}`,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<Stock> {
    const stock = await this.prisma.stock.findUnique({ where: { id } });
    if (!stock) {
      throw new StockNotFoundError(id);
    }
    return stock;
  }

  async findByProductId(productId: string): Promise<Stock> {
    const stock = await this.prisma.stock.findUnique({
      where: { productId },
    });
    if (!stock) {
      throw new StockNotFoundError(productId);
    }
    return stock;
  }

  async filter(
    filters: StockSearchFilters,
  ): Promise<{ stocks: Stock[]; total: number }> {
    const {
      productId,
      page = 1,
      limit = 10,
      sort = 'asc',
      sortBy = 'createdAt',
    } = filters;

    const where: Prisma.StockWhereInput = {
      ...(productId ? { productId } : {}),
    };

    const [stocks, total] = await Promise.all([
      this.prisma.stock.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sort },
      }),
      this.prisma.stock.count({ where }),
    ]);

    return { stocks, total };
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.stock.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new StockNotFoundError(id);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to delete stock ${id}`,
      );
      throw error;
    }
  }
}
