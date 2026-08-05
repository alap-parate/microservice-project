import { z } from 'zod';
import { SortOrder } from '@app/utils/types';

export const createStockDto = z.object({
  productId: z.string().min(1, { error: 'Product ID is required' }).trim(),
  quantity: z
    .number({ error: 'Quantity must be a number' })
    .int({ error: 'Quantity must be an integer' })
    .nonnegative({ error: 'Quantity must be zero or greater' }),
});

export const updateStockDto = z.object({
  quantity: z
    .number({ error: 'Quantity must be a number' })
    .int({ error: 'Quantity must be an integer' })
    .nonnegative({ error: 'Quantity must be zero or greater' }),
});

export const adjustStockDto = z.object({
  delta: z
    .number({ error: 'Delta must be a number' })
    .int({ error: 'Delta must be an integer' }),
});

export const stockIdParam = z
  .object({
    id: z.string().min(1, { error: 'Stock ID is required' }),
  })
  .strict();

export const productIdParam = z
  .object({
    productId: z.string().min(1, { error: 'Product ID is required' }),
  })
  .strict();

export const stockSearchFilters = z.object({
  productId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sort: z.enum(SortOrder).optional().default(SortOrder.ASC),
  sortBy: z
    .enum(['quantity', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
});

export type CreateStockDto = z.infer<typeof createStockDto>;
export type UpdateStockDto = z.infer<typeof updateStockDto>;
export type AdjustStockDto = z.infer<typeof adjustStockDto>;
export type StockIdParam = z.infer<typeof stockIdParam>;
export type ProductIdParam = z.infer<typeof productIdParam>;
export type StockSearchFilters = z.infer<typeof stockSearchFilters>;
