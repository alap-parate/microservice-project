import { HttpStatus } from "@nestjs/common";

export class BrandAlreadyExistsError extends Error {
  readonly code = 'BRAND_ALREADY_EXISTS';
  readonly status = HttpStatus.CONFLICT;
  constructor(name: string) {
    super(`Brand ${name} already exists`);
    this.name = BrandAlreadyExistsError.name;
  }
}

export class BrandNotFoundError extends Error {
  readonly code = 'BRAND_NOT_FOUND';
  readonly status = HttpStatus.NOT_FOUND;
  constructor(id: string) {
    super(`Brand with id ${id} not found`);
    this.name = BrandNotFoundError.name;
  }
}

export class BrandInUseError extends Error {
  readonly code = 'BRAND_IN_USE';
  readonly status = HttpStatus.CONFLICT;
  constructor(id: string) {
    super(`Brand with id ${id} is in use`);
    this.name = BrandInUseError.name;
  }
}
