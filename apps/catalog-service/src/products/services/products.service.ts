import { Injectable } from '@nestjs/common';
import { Prisma, Product, PrismaClient, Brand, Category } from '../../../prisma/generated';
import {
  CreateProductDto,
  ProductSearchFilters,
  UpdateProductDto,
} from '../dto/products.dto';
import {
  isForeignKeyViolation,
  isRecordNotFound,
} from '@app/utils/exceptions';
import { PinoLogger } from '@app/logger';
import {
  ProductNotFoundError,
  ProductReferenceNotFoundError,
} from '../errors/product-errors';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProductsService.name);
  }

  async create(product: CreateProductDto): Promise<Product> {
    try {
      return await this.prisma.product.create({
        data: product,
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ProductReferenceNotFoundError();
      }
      this.logger.error(
        { err: error as Error },
        `Failed to create product, ${product.title}`,
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new ProductNotFoundError(id);
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ProductReferenceNotFoundError();
      }
      this.logger.error(
        { err: error as Error },
        `Failed to update product, ${id}`,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new ProductNotFoundError(id);
      }
      this.logger.error(
        { err: error as Error },
        `Failed to delete product, ${id}`,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<Pick<Product, "id" | "title" | "description" | "price"> & { brand: Pick<Brand, "id" | "name">; category: Pick<Category, "id" | "name"> }> {
    const product = await this.prisma.product.findUnique(
      { 
        where: { id },
        select: {
          id: true,
          title: true,
          price: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          brand: {
            select: {
              id: true,
              name: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    if (!product) {
      throw new ProductNotFoundError(id);
    }

    return product;
  }

  async filter(
    filters: ProductSearchFilters,
  ): Promise<{ products: Product[]; total: number }> {
    const {
      title,
      brandId,
      categoryId,
      page = 1,
      limit = 10,
      sort = 'asc',
      sortBy = 'createdAt',
    } = filters;

    const where: Prisma.ProductWhereInput = {
      ...(title ? { title: { contains: title, mode: 'insensitive' } } : {}),
      ...(brandId ? { brandId } : {}),
      ...(categoryId ? { categoryId } : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sort },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total };
  }
}
