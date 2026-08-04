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
  BrandSearchFilters,
  CreateBrandDto,
  DeleteBrandDto,
  UpdateBrandDto,
  UpdateBrandParamsDto,
} from '../dto/brands.dto';
import {
  brandSearchFilters,
  createBrandDto,
  deleteBrandDto,
  updateBrandDto,
  updateBrandParamsDto,
} from '../dto/brands.dto';
import { BrandsService } from '../services/brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(createBrandDto)) body: CreateBrandDto,
  ) {
    return this.brandsService.create(body);
  }

  @Get()
  async filter(
    @Query(new ZodValidationPipe(brandSearchFilters))
    filters: BrandSearchFilters,
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { brands, total } = await this.brandsService.filter({
      ...filters,
      page,
      limit,
    });
    return { items: brands, total, page, limit };
  }

  @Get(':id')
  findById(
    @Param(new ZodValidationPipe(deleteBrandDto)) params: DeleteBrandDto,
  ) {
    return this.brandsService.findById(params.id);
  }

  @Patch(':id')
  update(
    @Param(new ZodValidationPipe(updateBrandParamsDto)) params: UpdateBrandParamsDto,
    @Body(new ZodValidationPipe(updateBrandDto)) body: UpdateBrandDto,
  ) {
    return this.brandsService.update(params.id, body.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param(new ZodValidationPipe(deleteBrandDto)) params: DeleteBrandDto,
  ) {
    await this.brandsService.delete(params.id);
    return null;
  }
}
