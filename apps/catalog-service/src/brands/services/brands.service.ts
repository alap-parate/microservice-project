import { Injectable } from '@nestjs/common';
import { Prisma, Brand, PrismaClient } from '../../../prisma/generated';
import { BrandSearchFilters } from '../dto/brands.dto';
import {
  isForeignKeyViolation,
  isRecordNotFound,
  isUniqueConstraintViolation,
} from '@app/utils/exceptions';
import { PinoLogger } from '@app/logger';
import {
  BrandAlreadyExistsError,
  BrandInUseError,
  BrandNotFoundError,
} from '../errors/brand-errors';

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BrandsService.name);
  }

  async create(brand: { name: string }): Promise<Brand> {
    try {
      return await this.prisma.brand.create({
        data: brand,
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BrandAlreadyExistsError(brand.name);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to create brand, ${brand.name}`,
      );
      throw error;
    }
  }

  async update(id: string, brandName: string): Promise<Brand> {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new BrandNotFoundError(id);
    }

    try {
      return await this.prisma.brand.update({
        where: { id },
        data: { name: brandName },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BrandAlreadyExistsError(brandName);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to update brand, ${id}`,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.brand.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new BrandNotFoundError(id);
      }
      if (isForeignKeyViolation(error)) {
        throw new BrandInUseError(id);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to delete brand, ${id}`,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<Brand> {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new BrandNotFoundError(id);
    }

    return brand;
  }

  async filter(
    filters: BrandSearchFilters,
  ): Promise<{ brands: Brand[]; total: number }> {
    const {
      name,
      page = 1,
      limit = 10,
      sort = 'asc',
      sortBy = 'createdAt',
    } = filters;

    const where: Prisma.BrandWhereInput = name
      ? { name: { contains: name, mode: 'insensitive' } }
      : {};

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sort },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return { brands, total };
  }
}
