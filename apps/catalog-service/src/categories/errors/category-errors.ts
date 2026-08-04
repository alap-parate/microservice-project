import { HttpStatus } from "@nestjs/common";

export class CategoryAlreadyExistsError extends Error {
  readonly code = 'CATEGORY_ALREADY_EXISTS';
  readonly status = HttpStatus.CONFLICT;
  constructor(name: string, brandId: string) {
    super(`Category ${name} already exists for brand ${brandId}`);
    this.name = CategoryAlreadyExistsError.name;
  }
}

export class CategoryNotFoundError extends Error {
  readonly code = 'CATEGORY_NOT_FOUND';
  readonly status = HttpStatus.NOT_FOUND;
  constructor(id: string) {
    super(`Category with id ${id} not found`);
    this.name = CategoryNotFoundError.name;
  }
}

export class CategoryInUseError extends Error {
  readonly code = 'CATEGORY_IN_USE';
  readonly status = HttpStatus.CONFLICT;
  constructor(id: string) {
    super(`Category with id ${id} is in use`);
    this.name = CategoryInUseError.name;
  }
}

export class ParentBrandNotFoundError extends Error {
  readonly code = 'PARENT_BRAND_NOT_FOUND';
  readonly status = HttpStatus.NOT_FOUND;
  constructor(brandId: string) {
    super(`Brand with id ${brandId} not found`);
    this.name = ParentBrandNotFoundError.name;
  }
}
