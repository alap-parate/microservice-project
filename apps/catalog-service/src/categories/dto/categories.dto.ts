import { z } from 'zod';
import { SortOrder } from '@app/utils/types';

export const createCategoryDto = z.object({
  name: z
    .string()
    .min(1, { error: 'Name is required' })
    .max(100, { error: 'Name must be less than 100 characters' })
    .trim()
    .toLowerCase(),
  brandId: z.cuid2({ error: 'Invalid Brand ID' }),
});

export const updateCategoryDto = z.object({
  name: z
    .string()
    .min(1, { error: 'Name is required' })
    .max(100, { error: 'Name must be less than 100 characters' })
    .trim()
    .toLowerCase(),
});

export const deleteCategoryDto = z
  .object({
    id: z.cuid2({ error: 'Invalid Category ID' }),
  })
  .strict();

export const categorySearchFilters = z.object({
  name: z.string().optional(),
  brandId: z.cuid2({ error: 'Invalid Brand ID' }).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sort: z.enum(SortOrder).optional().default(SortOrder.ASC),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('name'),
});

export type CreateCategoryDto = z.infer<typeof createCategoryDto>;
export type UpdateCategoryDto = z.infer<typeof updateCategoryDto>;
export type DeleteCategoryDto = z.infer<typeof deleteCategoryDto>;
export type CategorySearchFilters = z.infer<typeof categorySearchFilters>;
