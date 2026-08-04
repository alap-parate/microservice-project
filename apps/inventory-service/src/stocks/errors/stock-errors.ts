import { HttpStatus } from '@nestjs/common';

export class StockAlreadyExistsError extends Error {
  readonly code = 'STOCK_ALREADY_EXISTS';
  readonly status = HttpStatus.CONFLICT;

  constructor(productId: string) {
    super(`Stock for product ${productId} already exists`);
    this.name = StockAlreadyExistsError.name;
  }
}

export class StockNotFoundError extends Error {
  readonly code = 'STOCK_NOT_FOUND';
  readonly status = HttpStatus.NOT_FOUND;

  constructor(id: string) {
    super(`Stock with id ${id} not found`);
    this.name = StockNotFoundError.name;
  }
}

export class InsufficientStockError extends Error {
  readonly code = 'INSUFFICIENT_STOCK';
  readonly status = HttpStatus.CONFLICT;

  constructor(id: string) {
    super(`Insufficient stock for id ${id}`);
    this.name = InsufficientStockError.name;
  }
}
