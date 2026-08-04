---
name: Categories catalog plan
overview: "Add a naive Categories resource to catalog-service modeled on brands: clean the existing Prisma Category model, migrate the table, wire Nest Prisma, and ship service/DTO/errors/tests without controllers or products yet."
todos:
  - id: fix-schema
    content: Clean Category schema (relation name, map typo, drop incomplete Product); regenerate client
    status: completed
  - id: migrate
    content: Add categories migration FK + unique (brandId, name)
    status: completed
  - id: prisma-module
    content: Add catalog PrismaService/PrismaModule and provide PrismaClient for Nest DI
    status: completed
  - id: categories-feature
    content: Add categories DTO, errors, service, module mirroring brands
    status: completed
  - id: wire-module
    content: Register PrismaModule, BrandsModule, CategoriesModule in CatalogServiceModule
    status: completed
  - id: tests
    content: Add categories.service.spec.ts matching brands coverage
    status: completed
isProject: false
---

# Categories for catalog-service

## Context

- Brands are already a **service-layer** feature only: Zod DTOs, domain errors, Prisma CRUD, unit tests — no HTTP/RPC controllers yet.
- [schema.prisma](apps/catalog-service/prisma/schema.prisma) already drafts `Category` (name + `brandId`, unique `[brandId, name]`), but needs cleanup before implement/migrate.
- [CatalogServiceModule](apps/catalog-service/src/catalog-service.module.ts) does not register `BrandsModule` or any Prisma provider yet; brands inject `PrismaClient` directly.
- Inventory already has the Nest Prisma pattern to copy: [prisma.service.ts](apps/inventory-service/src/database/prisma.service.ts) + [prisma.module.ts](apps/inventory-service/src/database/prisma.module.ts).

**Default choices (keep it naive):** categories belong to a brand; no nested trees; no Products CRUD yet (leave Product for later); no controllers; mirror brands CRUD + filters.

## 1. Fix Prisma schema (categories only)

In [apps/catalog-service/prisma/schema.prisma](apps/catalog-service/prisma/schema.prisma):

- Rename `Brand.products Category[]` → `categories Category[]`.
- Fix table map typo `@@map("categoies")` → `@@map("categories")`.
- Remove the incomplete `Product` model for now (it lacks reverse relations and will fail `prisma generate`). Re-add when you do products.
- Keep: `Category` with `name`, `brandId` → `Brand`, `@@unique([brandId, name])`, timestamps, `onDelete: Restrict` (or match brands delete-in-use story).

Regenerate client via existing `pnpm prisma:catalog:generate`.

## 2. Migration

Init migration only has `brands` ([20260722120000_init](apps/catalog-service/prisma/migrations/20260722120000_init/migration.sql)). Add a second migration that creates `categories`:

- columns: `id`, `name`, `createdAt`, `updatedAt`, `brandId`
- FK to `brands(id)` with `ON DELETE RESTRICT`
- unique index on `(brandId, name)`

Use `pnpm prisma:catalog:migrate` (already wired in root [package.json](package.json)).

## 3. Catalog Prisma wiring

Add the same thin Nest wrapper inventory uses:

- `apps/catalog-service/src/database/prisma.service.ts` — extends `PrismaClient` from `../../prisma/generated`, URL via `createDatabaseUrl({ database: 'catalog', envPrefix: 'CATALOG_' })`, `$connect` / `$disconnect`.
- `apps/catalog-service/src/database/prisma.module.ts` — `@Global()` module exporting that service.

Register `PrismaModule` in [catalog-service.module.ts](apps/catalog-service/src/catalog-service.module.ts). Prefer injecting **`PrismaService`** in new code (and optionally align brands later); for minimal churn, provide `PrismaClient` as the same instance so existing `BrandsService` keeps working, or inject `PrismaService` where brands already type-inject `PrismaClient` if the subclass is accepted — Nest token must match; simplest: `providers: [{ provide: PrismaClient, useExisting: PrismaService }]` or inject `PrismaService` in both services.

Also register **`BrandsModule` + `CategoriesModule`** so the app graph is real, not orphaned providers.

## 4. Categories feature (mirror brands)

New folder under `apps/catalog-service/src/categories/`:

| Piece | Role |
|--------|------|
| `dto/categories.dto.ts` | Zod: create (`name` + `brandId`), update (`name`), delete (`id`), filters (`name?`, `brandId?`, page/limit/sort/sortBy) |
| `errors/category-errors.ts` | `CategoryAlreadyExistsError`, `CategoryNotFoundError`, `CategoryInUseError` (FK when products exist later) |
| `services/categories.service.ts` | `create`, `update`, `delete`, `findById`, `filter` |
| `categories.module.ts` | providers/exports |
| `tests/categories.service.spec.ts` | same mock-Prisma style as brands |

**Service behavior (aligned with [brands.service.ts](apps/catalog-service/src/brands/services/brands.service.ts)):**

- **create:** `prisma.category.create({ data: { name, brandId } })`; map unique → `CategoryAlreadyExistsError`; map FK (`P2003`) → brand missing (new small error e.g. `BrandNotFoundError` re-export/use from brands or `ParentBrandNotFoundError` on category); log and rethrow other errors.
- **update:** load by id or `CategoryNotFoundError`; update name; unique → already exists.
- **delete:** delete by id; `P2025` → not found; FK violation → in use.
- **filter:** optional `name` contains (insensitive) + optional `brandId` exact; pagination/`orderBy` like brands.

No controller/message patterns yet — same as brands.

## 5. Tests

Mirror [brands.service.spec.ts](apps/catalog-service/src/brands/tests/brands.service.spec.ts): mock `prisma.category.*`, cover happy paths + already exists / not found / FK / filter by `brandId`.

## Implementation order

```mermaid
flowchart LR
  schema[Fix schema] --> gen[prisma generate]
  gen --> migrate[migrate categories]
  migrate --> prismaNest[PrismaModule]
  prismaNest --> cats[Categories service module]
  cats --> wire[Wire CatalogServiceModule]
  wire --> tests[Unit tests]
```

## Out of scope (intentional)

- Products module
- HTTP/RPC exposure
- Cross-service calls
- Soft deletes, nested categories, auth
