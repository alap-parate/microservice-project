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
  CategorySearchFilters,
  CreateCategoryDto,
  DeleteCategoryDto,
  UpdateCategoryDto,
} from '../dto/categories.dto';
import {
  categorySearchFilters,
  createCategoryDto,
  deleteCategoryDto,
  updateCategoryDto,
} from '../dto/categories.dto';
import { CategoriesService } from '../services/categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(createCategoryDto)) body: CreateCategoryDto,
  ) {
    return this.categoriesService.create(body);
  }

  @Get()
  async filter(
    @Query(new ZodValidationPipe(categorySearchFilters))
    filters: CategorySearchFilters,
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { categories, total } = await this.categoriesService.filter({
      ...filters,
      page,
      limit,
    });
    return { items: categories, total, page, limit };
  }

  @Get(':id')
  findById(
    @Param(new ZodValidationPipe(deleteCategoryDto))
    params: DeleteCategoryDto,
  ) {
    return this.categoriesService.findById(params.id);
  }

  @Patch(':id')
  update(
    @Param(new ZodValidationPipe(deleteCategoryDto))
    params: DeleteCategoryDto,
    @Body(new ZodValidationPipe(updateCategoryDto)) body: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(params.id, body.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param(new ZodValidationPipe(deleteCategoryDto))
    params: DeleteCategoryDto,
  ) {
    await this.categoriesService.delete(params.id);
    return null;
  }
}
