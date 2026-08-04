import { HttpStatus } from "@nestjs/common";

export class ProductNotFoundError extends Error {
  readonly code = 'PRODUCT_NOT_FOUND';
  readonly status = HttpStatus.NOT_FOUND;
  constructor(id: string) {
    super(`Product with id ${id} not found`);
    this.name = ProductNotFoundError.name;
  }
}

export class ProductReferenceNotFoundError extends Error {
  readonly code = 'PRODUCT_REFERENCE_NOT_FOUND';
  readonly status = HttpStatus.NOT_FOUND;
  constructor() {
    super('Brand or category does not exist');
    this.name = ProductReferenceNotFoundError.name;
  }
}
