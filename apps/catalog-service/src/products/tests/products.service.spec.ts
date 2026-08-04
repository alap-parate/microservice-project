import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client.js';
import { Decimal } from '@prisma/client/runtime/client.js';

import { ProductsService } from '../services/products.service';
import { Product, PrismaClient } from '../../../prisma/generated';
import { PinoLogger } from 'nestjs-pino';
import {
  ProductNotFoundError,
  ProductReferenceNotFoundError,
} from '../errors/product-errors';
import { ProductSearchFilters } from '../dto/products.dto';
import { SortOrder } from '@app/utils/types';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };
  let logger: jest.Mocked<PinoLogger>;

  const brandId = '62009639-741c-47e6-932c-248fe8ba7950';
  const categoryId = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
  const productId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaClient,
          useValue: {
            product: {
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

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaClient);
    logger = module.get(PinoLogger);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const data = {
        title: 'Galaxy S24',
        description: 'Flagship phone',
        price: 799.99,
        brandId,
        categoryId,
      };

      const createdProduct = {
        id: productId,
        ...data,
        price: new Decimal(data.price),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      prisma.product.create.mockResolvedValue(createdProduct);

      const result = await service.create(data);

      expect(prisma.product.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(createdProduct);
    });

    it('should throw ProductReferenceNotFoundError if brand or category is missing', async () => {
      const data = {
        title: 'Galaxy S24',
        description: 'Flagship phone',
        price: 799.99,
        brandId,
        categoryId,
      };

      prisma.product.create.mockRejectedValue(
        new PrismaClientKnownRequestError('Foreign key constraint failed', {
          code: 'P2003',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(data)).rejects.toThrow(
        new ProductReferenceNotFoundError(),
      );
    });

    it('should log and throw error for unexpected repository errors', async () => {
      const data = {
        title: 'Galaxy S24',
        description: 'Flagship phone',
        price: 799.99,
        brandId,
        categoryId,
      };
      const databaseError = new Error('Database connection failed');
      prisma.product.create.mockRejectedValue(databaseError);

      await expect(service.create(data)).rejects.toThrow(databaseError);
      expect(logger.error).toHaveBeenCalledWith(
        { err: databaseError },
        'Failed to create product, Galaxy S24',
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const existing = {
        id: productId,
        title: 'Galaxy S24',
        description: 'Flagship phone',
        price: new Decimal(799.99),
        brandId,
        categoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      const updateData = { title: 'Galaxy S25', price: 899.99 };
      const updated = {
        ...existing,
        title: updateData.title,
        price: new Decimal(updateData.price),
        updatedAt: new Date(),
      } as Product;

      prisma.product.findUnique.mockResolvedValue(existing);
      prisma.product.update.mockResolvedValue(updated);

      const result = await service.update(productId, updateData);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: updateData,
      });
      expect(result).toEqual(updated);
    });

    it('should throw ProductNotFoundError if product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.update(productId, { title: 'Updated' }),
      ).rejects.toThrow(new ProductNotFoundError(productId));
    });

    it('should throw ProductReferenceNotFoundError if brand or category is invalid', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: productId,
        title: 'Galaxy S24',
      } as Product);
      prisma.product.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Foreign key constraint failed', {
          code: 'P2003',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.update(productId, { brandId: 'invalid-but-mock' }),
      ).rejects.toThrow(new ProductReferenceNotFoundError());
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      prisma.product.delete.mockResolvedValue({
        id: productId,
      } as Product);

      await expect(service.delete(productId)).resolves.toBeUndefined();
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });

    it('should throw ProductNotFoundError if product is not found', async () => {
      prisma.product.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Record to delete does not exist', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(service.delete(productId)).rejects.toThrow(
        new ProductNotFoundError(productId),
      );
    });
  });

  describe('findById', () => {
    it('should find a product by id', async () => {
      const product = {
        id: productId,
        title: 'Galaxy S24',
        brandId,
        categoryId,
      } as Product;
      prisma.product.findUnique.mockResolvedValue(product);

      await expect(service.findById(productId)).resolves.toEqual(product);
    });

    it('should throw ProductNotFoundError if product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findById(productId)).rejects.toThrow(
        new ProductNotFoundError(productId),
      );
    });
  });

  describe('filter', () => {
    it('should filter products with all filters', async () => {
      const filters = {
        title: 'Galaxy',
        brandId,
        categoryId,
        page: 2,
        limit: 10,
        sort: SortOrder.ASC,
        sortBy: 'title',
      } satisfies ProductSearchFilters;

      const products = [
        {
          id: productId,
          title: 'Galaxy S24',
          brandId,
          categoryId,
        },
      ] as Product[];

      prisma.product.findMany.mockResolvedValue(products);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.filter(filters);

      expect(result).toEqual({ products, total: 1 });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          title: { contains: 'Galaxy', mode: 'insensitive' },
          brandId,
          categoryId,
        },
        skip: 10,
        take: 10,
        orderBy: { title: SortOrder.ASC },
      });
    });

    it('should return empty array if no products are found', async () => {
      const filters = {
        page: 1,
        limit: 10,
        sort: SortOrder.ASC,
        sortBy: 'createdAt',
      } satisfies ProductSearchFilters;

      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const result = await service.filter(filters);

      expect(result).toEqual({ products: [], total: 0 });
    });
  });
});
