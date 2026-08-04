import { z } from 'zod';
import { SortOrder } from '@app/utils/types';

export const createProductDto = z.object({
  title: z
    .string()
    .min(1, { error: 'Title is required' })
    .max(255, { error: 'Title must be less than 255 characters' })
    .trim(),
  description: z
    .string()
    .min(1, { error: 'Description is required' })
    .max(5000, { error: 'Description must be less than 5000 characters' })
    .trim(),
  price: z
    .number({ error: 'Price must be a number' })
    .nonnegative({ error: 'Price must be zero or greater' })
    .finite({ error: 'Price must be a finite number' }),
  brandId: z.cuid2({ error: 'Invalid Brand ID' }),
  categoryId: z.cuid2({ error: 'Invalid Category ID' }),
});

export const updateProductDto = z
  .object({
    title: z
      .string()
      .min(1, { error: 'Title is required' })
      .max(255, { error: 'Title must be less than 255 characters' })
      .trim()
      .optional(),
    description: z
      .string()
      .min(1, { error: 'Description is required' })
      .max(5000, { error: 'Description must be less than 5000 characters' })
      .trim()
      .optional(),
    price: z
      .number({ error: 'Price must be a number' })
      .nonnegative({ error: 'Price must be zero or greater' })
      .finite({ error: 'Price must be a finite number' })
      .optional(),
    brandId: z.cuid2({ error: 'Invalid Brand ID' }).optional(),
    categoryId: z.cuid2({ error: 'Invalid Category ID' }).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.price !== undefined ||
      data.brandId !== undefined ||
      data.categoryId !== undefined,
    { error: 'At least one field is required' },
  );

export const deleteProductDto = z
  .object({
    id: z.cuid2({ error: 'Invalid Product ID' }),
  })
  .strict();

export const productSearchFilters = z.object({
  title: z.string().optional(),
  brandId: z.cuid2({ error: 'Invalid Brand ID' }).optional(),
  categoryId: z.cuid2({ error: 'Invalid Category ID' }).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sort: z.enum(SortOrder).optional().default(SortOrder.ASC),
  sortBy: z
    .enum(['title', 'price', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
});

export type CreateProductDto = z.infer<typeof createProductDto>;
export type UpdateProductDto = z.infer<typeof updateProductDto>;
export type DeleteProductDto = z.infer<typeof deleteProductDto>;
export type ProductSearchFilters = z.infer<typeof productSearchFilters>;
