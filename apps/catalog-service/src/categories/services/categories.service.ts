import { Injectable } from '@nestjs/common';
import { Prisma, Category, PrismaClient } from '../../../prisma/generated';
import { CategorySearchFilters } from '../dto/categories.dto';
import {
  isForeignKeyViolation,
  isRecordNotFound,
  isUniqueConstraintViolation,
} from '@app/utils/exceptions';
import { PinoLogger } from '@app/logger';
import {
  CategoryAlreadyExistsError,
  CategoryInUseError,
  CategoryNotFoundError,
  ParentBrandNotFoundError,
} from '../errors/category-errors';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CategoriesService.name);
  }

  async create(category: { name: string; brandId: string }): Promise<Category> {
    try {
      return await this.prisma.category.create({
        data: category,
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new CategoryAlreadyExistsError(category.name, category.brandId);
      }
      if (isForeignKeyViolation(error)) {
        throw new ParentBrandNotFoundError(category.brandId);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to create category, ${category.name}`,
      );
      throw error;
    }
  }

  async update(id: string, categoryName: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new CategoryNotFoundError(id);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: { name: categoryName },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new CategoryAlreadyExistsError(categoryName, category.brandId);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to update category, ${id}`,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new CategoryNotFoundError(id);
      }
      if (isForeignKeyViolation(error)) {
        throw new CategoryInUseError(id);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to delete category, ${id}`,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique(
      { 
        where: { id },
         include: {
          brand: true
         }
      },
    );
    if (!category) {
      throw new CategoryNotFoundError(id);
    }

    return category;
  }

  async filter(
    filters: CategorySearchFilters,
  ): Promise<{ categories: Category[]; total: number }> {
    const {
      name,
      brandId,
      page = 1,
      limit = 10,
      sort = 'asc',
      sortBy = 'createdAt',
    } = filters;

    const where: Prisma.CategoryWhereInput = {
      ...(name ? { name: { contains: name, mode: 'insensitive' } } : {}),
      ...(brandId ? { brandId } : {}),
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sort },
      }),
      this.prisma.category.count({ where }),
    ]);

    return { categories, total };
  }
}
