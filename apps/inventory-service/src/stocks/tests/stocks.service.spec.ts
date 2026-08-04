import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client.js';
import { PinoLogger } from 'nestjs-pino';
import { Stock, PrismaClient } from '../../../prisma/generated';
import { StocksService } from '../services/stocks.service';
import {
  InsufficientStockError,
  StockAlreadyExistsError,
  StockNotFoundError,
} from '../errors/stock-errors';
import { SortOrder } from '@app/utils/types';
import type { StockSearchFilters } from '../dto/stocks.dto';

describe('StocksService', () => {
  let service: StocksService;
  let prisma: {
    stock: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };
  let logger: jest.Mocked<PinoLogger>;

  const stockId = 'stock-1';
  const productId = 'product-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        {
          provide: PrismaClient,
          useValue: {
            stock: {
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: PinoLogger,
          useValue: {
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            setContext: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(StocksService);
    prisma = module.get(PrismaClient);
    logger = module.get(PinoLogger);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create stock', async () => {
      const data = { productId, quantity: 10 };
      const created = {
        id: stockId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Stock;
      prisma.stock.create.mockResolvedValue(created);

      await expect(service.create(data)).resolves.toEqual(created);
      expect(prisma.stock.create).toHaveBeenCalledWith({ data });
    });

    it('should throw StockAlreadyExistsError on unique violation', async () => {
      prisma.stock.create.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.create({ productId, quantity: 1 }),
      ).rejects.toThrow(new StockAlreadyExistsError(productId));
    });
  });

  describe('update', () => {
    it('should update quantity', async () => {
      const updated = {
        id: stockId,
        productId,
        quantity: 20,
      } as Stock;
      prisma.stock.update.mockResolvedValue(updated);

      await expect(service.update(stockId, 20)).resolves.toEqual(updated);
    });

    it('should throw StockNotFoundError when missing', async () => {
      prisma.stock.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(service.update(stockId, 5)).rejects.toThrow(
        new StockNotFoundError(stockId),
      );
    });
  });

  describe('adjust', () => {
    it('should increase quantity', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        id: stockId,
        productId,
        quantity: 5,
      } as Stock);
      const adjusted = {
        id: stockId,
        productId,
        quantity: 8,
      } as Stock;
      prisma.stock.update.mockResolvedValue(adjusted);

      await expect(service.adjust(stockId, 3)).resolves.toEqual(adjusted);
      expect(prisma.stock.update).toHaveBeenCalledWith({
        where: { id: stockId },
        data: { quantity: 8 },
      });
    });

    it('should throw InsufficientStockError when result would be negative', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        id: stockId,
        productId,
        quantity: 2,
      } as Stock);

      await expect(service.adjust(stockId, -5)).rejects.toThrow(
        new InsufficientStockError(stockId),
      );
      expect(prisma.stock.update).not.toHaveBeenCalled();
    });
  });

  describe('findById / findByProductId', () => {
    it('should find by id', async () => {
      const stock = { id: stockId, productId, quantity: 1 } as Stock;
      prisma.stock.findUnique.mockResolvedValue(stock);
      await expect(service.findById(stockId)).resolves.toEqual(stock);
    });

    it('should find by productId', async () => {
      const stock = { id: stockId, productId, quantity: 1 } as Stock;
      prisma.stock.findUnique.mockResolvedValue(stock);
      await expect(service.findByProductId(productId)).resolves.toEqual(
        stock,
      );
      expect(prisma.stock.findUnique).toHaveBeenCalledWith({
        where: { productId },
      });
    });

    it('should throw when not found by productId', async () => {
      prisma.stock.findUnique.mockResolvedValue(null);
      await expect(service.findByProductId(productId)).rejects.toThrow(
        new StockNotFoundError(productId),
      );
    });
  });

  describe('filter', () => {
    it('should filter with productId', async () => {
      const filters = {
        productId,
        page: 1,
        limit: 10,
        sort: SortOrder.ASC,
        sortBy: 'createdAt',
      } satisfies StockSearchFilters;
      const stocks = [{ id: stockId, productId, quantity: 1 }] as Stock[];
      prisma.stock.findMany.mockResolvedValue(stocks);
      prisma.stock.count.mockResolvedValue(1);

      const result = await service.filter(filters);
      expect(result).toEqual({ stocks, total: 1 });
      expect(prisma.stock.findMany).toHaveBeenCalledWith({
        where: { productId },
        skip: 0,
        take: 10,
        orderBy: { createdAt: SortOrder.ASC },
      });
    });
  });

  describe('delete', () => {
    it('should delete stock', async () => {
      prisma.stock.delete.mockResolvedValue({ id: stockId } as Stock);
      await expect(service.delete(stockId)).resolves.toBeUndefined();
    });

    it('should throw when missing', async () => {
      prisma.stock.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );
      await expect(service.delete(stockId)).rejects.toThrow(
        new StockNotFoundError(stockId),
      );
    });

    it('should log unexpected errors', async () => {
      const databaseError = new Error('db down');
      prisma.stock.delete.mockRejectedValue(databaseError);
      await expect(service.delete(stockId)).rejects.toThrow(databaseError);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
