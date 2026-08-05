import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client.js';

import { CategoriesService } from '../services/categories.service';
import { Category, PrismaClient } from '../../../prisma/generated';
import { PinoLogger } from 'nestjs-pino';
import {
  CategoryAlreadyExistsError,
  CategoryInUseError,
  CategoryNotFoundError,
  ParentBrandNotFoundError,
} from '../errors/category-errors';
import { CategorySearchFilters } from '../dto/categories.dto';
import { SortOrder } from '@app/utils/types';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };
  let logger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaClient,
          useValue: {
            category: {
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

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get(PrismaClient);
    logger = module.get(PinoLogger);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const data = {
        name: 'phones',
        brandId: '62009639-741c-47e6-932c-248fe8ba7950',
      };

      const createdCategory = {
        id: '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c',
        name: 'phones',
        brandId: data.brandId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Category;

      prisma.category.create.mockResolvedValue(createdCategory);

      const result = await service.create(data);

      expect(prisma.category.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(createdCategory);
    });

    it('should throw CategoryAlreadyExistsError if category name is already taken for brand', async () => {
      const data = {
        name: 'phones',
        brandId: '62009639-741c-47e6-932c-248fe8ba7950',
      };

      const uniqueConstraintError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: 'test',
        },
      );

      prisma.category.create.mockRejectedValue(uniqueConstraintError);

      await expect(service.create(data)).rejects.toThrow(
        new CategoryAlreadyExistsError(data.name, data.brandId),
      );

      expect(prisma.category.create).toHaveBeenCalledWith({ data });
    });

    it('should throw ParentBrandNotFoundError if brand does not exist', async () => {
      const data = {
        name: 'phones',
        brandId: '62009639-741c-47e6-932c-248fe8ba7950',
      };

      prisma.category.create.mockRejectedValue(
        new PrismaClientKnownRequestError('Foreign key constraint failed', {
          code: 'P2003',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(data)).rejects.toThrow(
        new ParentBrandNotFoundError(data.brandId),
      );
    });

    it('should log and throw error for unexpected repository errors', async () => {
      const data = {
        name: 'phones',
        brandId: '62009639-741c-47e6-932c-248fe8ba7950',
      };

      const databaseError = new Error('Database connection failed');

      prisma.category.create.mockRejectedValue(databaseError);

      await expect(service.create(data)).rejects.toThrow(databaseError);

      expect(prisma.category.create).toHaveBeenCalledWith({ data });
      expect(logger.error).toHaveBeenCalledWith(
        { err: databaseError },
        'Failed to create category, phones',
      );
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      const brandId = '62009639-741c-47e6-932c-248fe8ba7950';
      const categoryName = 'laptops';

      const existingCategory = {
        id,
        name: 'phones',
        brandId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Category;

      const updatedCategory = {
        id,
        name: categoryName,
        brandId,
        createdAt: existingCategory.createdAt,
        updatedAt: new Date(),
      } as Category;

      prisma.category.findUnique.mockResolvedValue(existingCategory);
      prisma.category.update.mockResolvedValue(updatedCategory);

      const result = await service.update(id, categoryName);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: categoryName },
      });
      expect(result).toEqual(updatedCategory);
    });

    it('should throw CategoryNotFoundError if category is not found', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      const categoryName = 'phones';

      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.update(id, categoryName)).rejects.toThrow(
        new CategoryNotFoundError(id),
      );
      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw CategoryAlreadyExistsError if category name is already taken', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      const brandId = '62009639-741c-47e6-932c-248fe8ba7950';
      const categoryName = 'phones';

      prisma.category.findUnique.mockResolvedValue({
        id,
        name: 'laptops',
        brandId,
      } as Category);
      prisma.category.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.update(id, categoryName)).rejects.toThrow(
        new CategoryAlreadyExistsError(categoryName, brandId),
      );

      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: categoryName },
      });
    });

    it('should log and throw error for unexpected repository errors', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      const brandId = '62009639-741c-47e6-932c-248fe8ba7950';
      const categoryName = 'phones';
      const databaseError = new Error('Database connection failed');

      prisma.category.findUnique.mockResolvedValue({
        id,
        name: categoryName,
        brandId,
      } as Category);
      prisma.category.update.mockRejectedValue(databaseError);

      await expect(service.update(id, categoryName)).rejects.toThrow(
        databaseError,
      );

      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: categoryName },
      });
    });

    it('should throw repository error if findUnique fails', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      const categoryName = 'phones';
      const databaseError = new Error('Database connection failed');

      prisma.category.findUnique.mockRejectedValue(databaseError);

      await expect(service.update(id, categoryName)).rejects.toThrow(
        databaseError,
      );

      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id } });
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      prisma.category.delete.mockResolvedValue({
        id,
        name: 'phones',
        brandId: '62009639-741c-47e6-932c-248fe8ba7950',
      } as Category);
      await expect(service.delete(id)).resolves.toBeUndefined();
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw CategoryNotFoundError if category is not found', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      prisma.category.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Record to delete does not exist', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );
      await expect(service.delete(id)).rejects.toThrow(
        new CategoryNotFoundError(id),
      );
    });

    it('should log and throw error for unexpected repository errors', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      const databaseError = new Error('Database connection failed');
      prisma.category.delete.mockRejectedValue(databaseError);
      await expect(service.delete(id)).rejects.toThrow(databaseError);
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw CategoryInUseError if category is in use', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      prisma.category.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Foreign key constraint failed', {
          code: 'P2003',
          clientVersion: 'test',
        }),
      );
      await expect(service.delete(id)).rejects.toThrow(
        new CategoryInUseError(id),
      );
    });
  });

  describe('findById', () => {
    it('should find a category by id', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      const category = {
        id,
        name: 'phones',
        brand: {
          id: '62009639-741c-47e6-932c-248fe8ba7950',
          name: 'Apple',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      prisma.category.findUnique.mockResolvedValue(category);
      await expect(service.findById(id)).resolves.toEqual(category);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id }, include: { brand: true } });
    });

    it('should throw CategoryNotFoundError if category is not found', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findById(id)).rejects.toThrow(
        new CategoryNotFoundError(id),
      );
      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id }, include: { brand: true } });
    });

    it('should throw repository error if findUnique fails', async () => {
      const id = '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c';
      const databaseError = new Error('Database connection failed');
      prisma.category.findUnique.mockRejectedValue(databaseError);
      await expect(service.findById(id)).rejects.toThrow(databaseError);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id }, include: { brand: true } });
    });
  });

  describe('filter', () => {
    it('should filter categories with all filters', async () => {
      const brandId = '62009639-741c-47e6-932c-248fe8ba7950';
      const filters = {
        name: 'phones',
        brandId,
        page: 5,
        limit: 25,
        sort: SortOrder.ASC,
        sortBy: 'name',
      } satisfies CategorySearchFilters;

      const categories = [
        {
          id: '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c',
          name: 'phones',
          brandId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as Category[];

      prisma.category.findMany.mockResolvedValue(categories);
      prisma.category.count.mockResolvedValue(1);

      const result = await service.filter(filters);

      expect(result).toEqual({ categories, total: 1 });
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'phones', mode: 'insensitive' },
          brandId,
        },
        skip: 100,
        take: 25,
        orderBy: { name: SortOrder.ASC },
      });
      expect(prisma.category.count).toHaveBeenCalledWith({
        where: {
          name: { contains: 'phones', mode: 'insensitive' },
          brandId,
        },
      });
    });

    it('should filter by brandId only', async () => {
      const brandId = '62009639-741c-47e6-932c-248fe8ba7950';
      const filters = {
        brandId,
        page: 1,
        limit: 10,
        sort: SortOrder.ASC,
        sortBy: 'name',
      } satisfies CategorySearchFilters;

      const categories = [
        {
          id: '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c',
          name: 'phones',
          brandId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as Category[];

      prisma.category.findMany.mockResolvedValue(categories);
      prisma.category.count.mockResolvedValue(1);

      const result = await service.filter(filters);

      expect(result).toEqual({ categories, total: 1 });
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { brandId },
        skip: 0,
        take: 10,
        orderBy: { name: SortOrder.ASC },
      });
      expect(prisma.category.count).toHaveBeenCalledWith({
        where: { brandId },
      });
    });

    it('should filter categories if no filters are provided', async () => {
      const filters = {
        page: 5,
        limit: 25,
        sort: SortOrder.ASC,
        sortBy: 'name',
      } satisfies CategorySearchFilters;

      const categories = [
        {
          id: '7f1c2b6a-3d4e-4f5a-9b8c-1d2e3f4a5b6c',
          name: 'phones',
          brandId: '62009639-741c-47e6-932c-248fe8ba7950',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as Category[];

      prisma.category.findMany.mockResolvedValue(categories);
      prisma.category.count.mockResolvedValue(1);

      const result = await service.filter(filters);

      expect(result).toEqual({ categories, total: 1 });
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 100,
        take: 25,
        orderBy: { name: SortOrder.ASC },
      });
      expect(prisma.category.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should return empty array if no categories are found', async () => {
      const filters = {
        name: 'unknown',
        page: 1,
        limit: 10,
        sort: SortOrder.ASC,
        sortBy: 'name',
      } satisfies CategorySearchFilters;

      prisma.category.findMany.mockResolvedValue([]);
      prisma.category.count.mockResolvedValue(0);

      const result = await service.filter(filters);

      expect(result).toEqual({ categories: [], total: 0 });
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'unknown', mode: 'insensitive' } },
        skip: 0,
        take: 10,
        orderBy: { name: SortOrder.ASC },
      });
    });

    it('should throw error for unexpected repository errors', async () => {
      const filters = {
        page: 5,
        limit: 25,
        sort: SortOrder.ASC,
        sortBy: 'name',
      } satisfies CategorySearchFilters;

      const databaseError = new Error('Database connection failed');
      prisma.category.findMany.mockRejectedValue(databaseError);
      await expect(service.filter(filters)).rejects.toThrow(databaseError);
      expect(prisma.category.findMany).toHaveBeenCalled();
    });
  });
});
