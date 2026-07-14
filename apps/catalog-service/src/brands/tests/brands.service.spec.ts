import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';

import { BrandsService } from '../services/brands.service';
import { BrandEntity } from '../entities/brand.entity';

describe('BrandsService', () => {
  let service: BrandsService;
  let repository: jest.Mocked<Repository<BrandEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getRepositoryToken(BrandEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            getManyAndCount: jest.fn(),
            createQueryBuilder: jest.fn(),
            andWhere: jest.fn(),
            skip: jest.fn(),
            take: jest.fn(),
            orderBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    repository = module.get(getRepositoryToken(BrandEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    (it('should create a brand', async () => {
      const data = {
        name: 'Samsung',
      };

      const createdBrand = {
        id: '62009639-741c-47e6-932c-248fe8ba7950',
        name: 'Samsung',
      } as BrandEntity;

      repository.create.mockReturnValue(createdBrand);
      repository.save.mockResolvedValue(createdBrand as BrandEntity);

      const result = await service.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(repository.save).toHaveBeenCalledWith(createdBrand);
      expect(result).toEqual(createdBrand);
    }),
      it('should throw an error if brand name is already taken', async () => {
        const data = {
          name: 'Samsung',
        };
      
        const newBrand = {
          name: 'Samsung',
        } as BrandEntity;
      
        const driverError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          },
        );
      
        const uniqueConstraintError = new QueryFailedError(
          'INSERT INTO brands ...',
          [],
          driverError,
        );
      
        repository.create.mockReturnValue(newBrand);
        repository.save.mockRejectedValue(uniqueConstraintError);
      
        await expect(service.create(data)).rejects.toThrow(
          new ConflictException('Brand name already taken'),
        );
      
        expect(repository.create).toHaveBeenCalledWith(data);
        expect(repository.save).toHaveBeenCalledWith(newBrand);
      }));
  });
});
