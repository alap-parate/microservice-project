import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client.js';

import { BrandsService } from '../services/brands.service';
import { Brand, PrismaClient } from '../../../prisma/generated';
import { PinoLogger } from 'nestjs-pino';
import {
  BrandAlreadyExistsError,
  BrandInUseError,
  BrandNotFoundError,
} from '../errors/brand-errors';
import { BrandSearchFilters } from '../dto/brands.dto';
import { SortOrder } from '@app/utils/types';

describe('BrandsService', () => {
  let service: BrandsService;
  let prisma: {
    brand: {
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
        BrandsService,
        {
          provide: PrismaClient,
          useValue: {
            brand: {
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

    service = module.get<BrandsService>(BrandsService);
    prisma = module.get(PrismaClient);
    logger = module.get(PinoLogger);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a brand', async () => {
      const data = {
        name: 'Samsung',
      };

      const createdBrand = {
        id: '62009639-741c-47e6-932c-248fe8ba7950',
        name: 'Samsung',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Brand;

      prisma.brand.create.mockResolvedValue(createdBrand);

      const result = await service.create(data);

      expect(prisma.brand.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(createdBrand);
    });

    it('should throw BrandAlreadyExistsError if brand name is already taken', async () => {
      const data = {
        name: 'Samsung',
      };

      const uniqueConstraintError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: 'test',
        },
      );

      prisma.brand.create.mockRejectedValue(uniqueConstraintError);

      await expect(service.create(data)).rejects.toThrow(
        new BrandAlreadyExistsError(data.name),
      );

      expect(prisma.brand.create).toHaveBeenCalledWith({ data });
    });

    it('should log and throw error for unexpected repository errors', async () => {
      const data = {
        name: 'Samsung',
      };

      const databaseError = new Error('Database connection failed');

      prisma.brand.create.mockRejectedValue(databaseError);

      await expect(service.create(data)).rejects.toThrow(databaseError);

      expect(prisma.brand.create).toHaveBeenCalledWith({ data });
      expect(logger.error).toHaveBeenCalledWith(
        { err: databaseError },
        'Failed to create brand, Samsung',
      );
    });
  });

  describe('updateBrand', () => {
    it('should update a brand', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      const brandName = 'Apple';

      const existingBrand = {
        id,
        name: 'Samsung',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Brand;

      const updatedBrand = {
        id,
        name: brandName,
        createdAt: existingBrand.createdAt,
        updatedAt: new Date(),
      } as Brand;

      prisma.brand.findUnique.mockResolvedValue(existingBrand);
      prisma.brand.update.mockResolvedValue(updatedBrand);

      const result = await service.update(id, brandName);

      expect(prisma.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.brand.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: brandName },
      });
      expect(result).toEqual(updatedBrand);
    });

    it('should throw BrandNotFoundError if brand is not found', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      const brandName = 'Samsung';

      prisma.brand.findUnique.mockResolvedValue(null);

      await expect(service.update(id, brandName)).rejects.toThrow(
        new BrandNotFoundError(id),
      );
      expect(prisma.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw BrandAlreadyExistsError if brand name is already taken', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      const brandName = 'Samsung';

      prisma.brand.findUnique.mockResolvedValue({
        id,
        name: 'Apple',
      } as Brand);
      prisma.brand.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.update(id, brandName)).rejects.toThrow(
        new BrandAlreadyExistsError(brandName),
      );

      expect(prisma.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.brand.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: brandName },
      });
    });

    it('should log and throw error for unexpected repository errors', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      const brandName = 'Samsung';
      const databaseError = new Error('Database connection failed');

      prisma.brand.findUnique.mockResolvedValue({
        id,
        name: brandName,
      } as Brand);
      prisma.brand.update.mockRejectedValue(databaseError);

      await expect(service.update(id, brandName)).rejects.toThrow(
        databaseError,
      );

      expect(prisma.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.brand.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: brandName },
      });
    });

    it('should throw repository error if findUnique fails', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      const brandName = 'Samsung';
      const databaseError = new Error('Database connection failed');

      prisma.brand.findUnique.mockRejectedValue(databaseError);

      await expect(service.update(id, brandName)).rejects.toThrow(
        databaseError,
      );

      expect(prisma.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
    });
  });

  describe('deleteBrand', () => {
    it('should delete a brand', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      prisma.brand.delete.mockResolvedValue({
        id,
        name: 'Samsung',
      } as Brand);
      await expect(service.delete(id)).resolves.toBeUndefined();
      expect(prisma.brand.delete).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw BrandNotFoundError if brand is not found', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      prisma.brand.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Record to delete does not exist', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );
      await expect(service.delete(id)).rejects.toThrow(
        new BrandNotFoundError(id),
      );
    });

    it('should log and throw error for unexpected repository errors', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      const databaseError = new Error('Database connection failed');
      prisma.brand.delete.mockRejectedValue(databaseError);
      await expect(service.delete(id)).rejects.toThrow(databaseError);
      expect(prisma.brand.delete).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw BrandInUseError if brand is in use', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      prisma.brand.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Foreign key constraint failed', {
          code: 'P2003',
          clientVersion: 'test',
        }),
      );
      await expect(service.delete(id)).rejects.toThrow(new BrandInUseError(id));
    });
  });

  describe('findById', () => {
    it('should find a brand by id', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      const brand = { id, name: 'Samsung' } as Brand;
      prisma.brand.findUnique.mockResolvedValue(brand);
      await expect(service.findById(id)).resolves.toEqual(brand);
      expect(prisma.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw BrandNotFoundError if brand is not found', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      prisma.brand.findUnique.mockResolvedValue(null);
      await expect(service.findById(id)).rejects.toThrow(
        new BrandNotFoundError(id),
      );
      expect(prisma.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
    });

    it('should log and throw error for unexpected repository errors', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      const databaseError = new Error('Database connection failed');
      prisma.brand.findUnique.mockRejectedValue(databaseError);
      await expect(service.findById(id)).rejects.toThrow(databaseError);
      expect(prisma.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw repository error if findUnique fails', async () => {
      const id = '62009639-741c-47e6-932c-248fe8ba7950';
      const databaseError = new Error('Database connection failed');
      prisma.brand.findUnique.mockRejectedValue(databaseError);
      await expect(service.findById(id)).rejects.toThrow(databaseError);
      expect(prisma.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
    });
  });

  describe('filter', () => {
    it('should filter brands with all filters', async () => {
      const filters = {
        name: 'Samsung',
        page: 5,
        limit: 25,
        sort: SortOrder.ASC,
        sortBy: 'name',
      } satisfies BrandSearchFilters;

      const brands = [
        {
          id: '62009639-741c-47e6-932c-248fe8ba7950',
          name: 'Samsung',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as Brand[];

      prisma.brand.findMany.mockResolvedValue(brands);
      prisma.brand.count.mockResolvedValue(1);

      const result = await service.filter(filters);

      expect(result).toEqual({ brands, total: 1 });
      expect(prisma.brand.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'Samsung', mode: 'insensitive' } },
        skip: 100,
        take: 25,
        orderBy: { name: SortOrder.ASC },
      });
      expect(prisma.brand.count).toHaveBeenCalledWith({
        where: { name: { contains: 'Samsung', mode: 'insensitive' } },
      });
    });

    it('should filter brand if no name is provided', async () => {
      const filters = {
        page: 5,
        limit: 25,
        sort: SortOrder.ASC,
        sortBy: 'name',
      } satisfies BrandSearchFilters;

      const brands = [
        {
          id: '62009639-741c-47e6-932c-248fe8ba7950',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as Brand[];

      prisma.brand.findMany.mockResolvedValue(brands);
      prisma.brand.count.mockResolvedValue(1);

      const result = await service.filter(filters);

      expect(result).toEqual({ brands, total: 1 });
      expect(prisma.brand.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 100,
        take: 25,
        orderBy: { name: SortOrder.ASC },
      });
      expect(prisma.brand.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should return empty array if no brands are found', async () => {
      const filters = {
        name: 'Syamsung',
        page: 1,
        limit: 10,
        sort: SortOrder.ASC,
        sortBy: 'name',
      } satisfies BrandSearchFilters;

      prisma.brand.findMany.mockResolvedValue([]);
      prisma.brand.count.mockResolvedValue(0);

      const result = await service.filter(filters);

      expect(result).toEqual({ brands: [], total: 0 });
      expect(prisma.brand.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'Syamsung', mode: 'insensitive' } },
        skip: 0,
        take: 10,
        orderBy: { name: SortOrder.ASC },
      });
    });

    it('should log and throw error for unexpected repository errors', async () => {
      const filters = {
        page: 5,
        limit: 25,
        sort: SortOrder.ASC,
        sortBy: 'name',
      } satisfies BrandSearchFilters;

      const databaseError = new Error('Database connection failed');
      prisma.brand.findMany.mockRejectedValue(databaseError);
      await expect(service.filter(filters)).rejects.toThrow(databaseError);
      expect(prisma.brand.findMany).toHaveBeenCalled();
    });
  });
});
