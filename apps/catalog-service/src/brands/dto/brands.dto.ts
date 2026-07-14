import { z } from "zod";
import { SortOrder } from "@app/utils/types";

export const createBrandDto = z.object({
    name: z.string().min(1, {error: 'Name is required'}).max(100, {error: 'Name must be less than 100 characters'}).trim().toLowerCase(),
});

export const updateBrandDto = z.object({
    name: z.string().min(1, {error: 'Name is required'}).max(100, {error: 'Name must be less than 100 characters'}).trim().toLowerCase(),
});

export const deleteBrandDto = z.object({
    id: z.uuid({error: 'Invalid Brand ID'}),
}).strict();

export const brandSearchFilters = z.object({
    name: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    sort: z.enum(SortOrder).optional().default(SortOrder.ASC),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('name'),
})

export type CreateBrandDto = z.infer<typeof createBrandDto>;
export type UpdateBrandDto = z.infer<typeof updateBrandDto>;
export type DeleteBrandDto = z.infer<typeof deleteBrandDto>;
export type BrandSearchFilters = z.infer<typeof brandSearchFilters>;