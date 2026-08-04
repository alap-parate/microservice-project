---
name: Fix Prisma adapter
overview: Prisma 7 rejects the old `datasources` constructor option. Wire catalog (and inventory) PrismaService through `@prisma/adapter-pg` using your existing `createDatabaseUrl` connection string so Nest can boot.
todos:
  - id: install-adapter
    content: Add @prisma/adapter-pg dependency
    status: completed
  - id: fix-catalog-prisma
    content: Update catalog PrismaService to use PrismaPg adapter
    status: completed
  - id: fix-inventory-prisma
    content: Update inventory PrismaService the same way
    status: completed
  - id: verify-boot
    content: Confirm catalog starts without constructor validation error
    status: completed
isProject: false
---

# Fix PrismaService for Prisma 7 (adapter)

## Problem

Catalog fails at boot with:

```text
PrismaClientConstructorValidationError: Unknown property datasources provided to PrismaClient constructor.
```

Prisma **7** no longer accepts `datasources` on `PrismaClient`. It requires a **driver adapter** (or Accelerate). Your service uses the old constructor:

```11:20:apps/catalog-service/src/database/prisma.service.ts
    super({
      datasources: {
        db: {
          url: createDatabaseUrl({
            database: 'catalog',
            envPrefix: 'CATALOG_',
          }),
        },
      },
    } as ConstructorParameters<typeof PrismaClient>[0]);
```

`pg` is already a dependency; only `@prisma/adapter-pg` is missing.

## Fix

1. **Install** `@prisma/adapter-pg` (match Prisma `7.9.x`).

2. **Update** [apps/catalog-service/src/database/prisma.service.ts](apps/catalog-service/src/database/prisma.service.ts):

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { createDatabaseUrl } from '@app/database';
import { PrismaClient } from '../../prisma/generated';

// in constructor:
const connectionString = createDatabaseUrl({
  database: 'catalog',
  envPrefix: 'CATALOG_',
});
const adapter = new PrismaPg({ connectionString });
super({ adapter });
```

Keep `$connect` / `$disconnect` and Nest lifecycle hooks unchanged.

3. **Same change** for [apps/inventory-service/src/database/prisma.service.ts](apps/inventory-service/src/database/prisma.service.ts) (inventory/envPrefix + its generated client path) so it does not hit the same crash later.

4. **Verify:** restart `pnpm start:catalog:dev` — boot past Prisma DI (no constructor validation error). Unit tests already mock `PrismaClient` and should stay green.

## Note (migrate P1002)

Separate from this crash: `pnpm prisma:catalog:migrate` timed out on Postgres advisory lock, often from a stuck prior migrate (or long-held session). After the app boots cleanly, if migrate still locks, check for leftover migrate processes and free the lock, then re-run migrate. Not part of the PrismaService constructor fix.
