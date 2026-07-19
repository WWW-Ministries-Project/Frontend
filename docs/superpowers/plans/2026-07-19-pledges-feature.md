# Pledges Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Pledges feature under Finance — create pledge campaigns tied to events, record callers and groups of pledgers (members or guests), and track partial redemptions — across the Frontend and Backend repos.

**Architecture:** Normalized relational Prisma models on the backend (`pledge` → `pledge_group` → `pledger` → `pledge_redemption`, plus `pledge_caller`), a new `Pledges` permission domain, and a `src/modules/pledges/` module mirroring `src/modules/finance/`. Frontend adds Finance child routes, a `Pledges` accessControl domain, `pledges/*` API methods, and Overview / Form / Detail pages plus Redemption and AddPledgers modals under `FinanceManagement/Pledges/`.

**Tech Stack:** Backend — Node/Express, TypeScript, Prisma (MySQL), multer + S3. Frontend — React, TypeScript, Vite, Formik + Yup, Zustand, TanStack Table, Tailwind.

**Verification note:** Neither repo has a test runner (frontend CLAUDE.md forbids adding one; backend has none). Each task is verified with type-check / lint / `prisma validate` / build and runtime checks (curl for backend endpoints against the local dev server, `npm run dev` for frontend). No unit-test files are added.

**Repos & branches:**
- Frontend: `/Users/akwaah/Documents/GitHub/Frontend`, branch `feat/pledges` (already created off `development`).
- Backend: `/Users/akwaah/Documents/GitHub/Backend`, cut branch `feat/pledges` off `development` (Task 0).

**Money type:** All amounts are Prisma `Decimal`; serialize to string/number in JSON responses. Frontend treats amounts as `number`.

---

## File Structure

### Backend (`/Users/akwaah/Documents/GitHub/Backend`)
- `prisma/schema.prisma` — add 5 models + back-relations (modify).
- `prisma/migrations/<ts>_add_pledge_tables/migration.sql` — create.
- `src/modules/pledges/common.ts` — validators, `PledgeHttpError`, error mapping (create).
- `src/modules/pledges/pledges/service.ts` — Prisma access + aggregation (create).
- `src/modules/pledges/pledges/controller.ts` — request handlers (create).
- `src/modules/pledges/pledges/route.ts` — route table + permission middleware (create).
- `src/modules/pledges/redemptions/service.ts` / `controller.ts` / `route.ts` — redemption + add-pledgers handlers (create).
- `src/routes/appRouter.ts` — mount `pledgesRouter` (modify).
- `src/modules/accessLevels/accessLevelController.ts` — register `Pledges` domain (modify).
- `src/middleWare/authorization.ts` — alias + `can_*_pledges` instances (modify).
- `src/utils/permissionResolver.ts` — alias (modify).

### Frontend (`/Users/akwaah/Documents/GitHub/Frontend`)
- `src/utils/accessControl.ts` — add `Pledges` domain + legacy keys (modify).
- `src/routes/appRoutes.tsx` — add Finance child routes + imports (modify).
- `src/utils/api/pledges/interface.ts` — types (create).
- `src/utils/api/pledges/index.ts` — re-exports (create, optional).
- `src/utils/api/apiFetch.ts` / `apiPost.ts` / `apiPut.ts` / `apiDelete.ts` — `pledges/*` methods (modify).
- `src/pages/HomePage/pages/FinanceManagement/Pledges/PledgesOverview.tsx` (create).
- `.../Pledges/PledgeForm.tsx` (create).
- `.../Pledges/PledgeDetail.tsx` (create).
- `.../Pledges/components/RedemptionModal.tsx` (create).
- `.../Pledges/components/AddPledgersModal.tsx` (create).
- `.../Pledges/components/PledgerFieldArray.tsx` + `CallerFieldArray.tsx` (create — shared form sub-sections).
- `.../Pledges/utils/pledgeHelpers.ts` — client-side derive helpers + Yup schema (create).

---

## PHASE A — Backend

### Task 0: Backend branch

- [ ] **Step 1: Cut a fresh branch off development**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
git checkout development && git pull --ff-only
git checkout -b feat/pledges
```

- [ ] **Step 2: Confirm branch**

Run: `git branch --show-current`
Expected: `feat/pledges`

---

### Task 1: Prisma models

**Files:**
- Modify: `prisma/schema.prisma` (append after the finance block, ~line 1737; add back-relations to `branch`, `event_mgt`, `user`)

- [ ] **Step 1: Add the five pledge models**

Append to `prisma/schema.prisma`:

```prisma
model pledge {
  id                  Int                 @id @default(autoincrement())
  branch_id           Int?
  event_id            Int
  title               String?
  target_amount       Decimal?            @db.Decimal(15, 2)
  deadline            DateTime?
  created_by_user_id  Int?
  created_at          DateTime            @default(now())
  updated_at          DateTime            @updatedAt
  branch              branch?             @relation(fields: [branch_id], references: [id])
  event               event_mgt           @relation(fields: [event_id], references: [id])
  created_by          user?               @relation("pledge_created_by", fields: [created_by_user_id], references: [id])
  groups              pledge_group[]
  callers             pledge_caller[]

  @@index([branch_id])
  @@index([event_id])
}

model pledge_group {
  id            Int        @id @default(autoincrement())
  pledge_id     Int
  called_amount Decimal    @db.Decimal(15, 2)
  label         String?
  pledge        pledge     @relation(fields: [pledge_id], references: [id], onDelete: Cascade)
  pledgers      pledger[]

  @@index([pledge_id])
}

model pledge_caller {
  id          Int     @id @default(autoincrement())
  pledge_id   Int
  user_id     Int?
  guest_name  String?
  guest_phone String?
  pledge      pledge  @relation(fields: [pledge_id], references: [id], onDelete: Cascade)
  user        user?   @relation("pledge_caller_user", fields: [user_id], references: [id])

  @@index([pledge_id])
  @@index([user_id])
}

model pledger {
  id             Int                 @id @default(autoincrement())
  group_id       Int
  user_id        Int?
  guest_name     String?
  guest_phone    String?
  pledged_amount Decimal             @db.Decimal(15, 2)
  group          pledge_group        @relation(fields: [group_id], references: [id], onDelete: Cascade)
  user           user?               @relation("pledger_user", fields: [user_id], references: [id])
  redemptions    pledge_redemption[]

  @@index([group_id])
  @@index([user_id])
}

model pledge_redemption {
  id                  Int      @id @default(autoincrement())
  pledger_id          Int
  amount              Decimal  @db.Decimal(15, 2)
  date                DateTime
  method              String
  note                String?  @db.Text
  image_url           String?
  recorded_by_user_id Int?
  created_at          DateTime @default(now())
  pledger             pledger  @relation(fields: [pledger_id], references: [id], onDelete: Cascade)

  @@index([pledger_id])
}
```

- [ ] **Step 2: Add back-relations**

In `model branch` add: `pledges pledge[]`
In `model event_mgt` add: `pledges pledge[]`
In `model user` add:
```prisma
  pledges_created  pledge[]        @relation("pledge_created_by")
  pledge_callings  pledge_caller[] @relation("pledge_caller_user")
  pledges          pledger[]       @relation("pledger_user")
```

- [ ] **Step 3: Validate schema**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(pledges): add prisma models for pledges"
```

---

### Task 2: Migration

**Files:**
- Create: `prisma/migrations/20260719120000_add_pledge_tables/migration.sql`

- [ ] **Step 1: Generate SQL from schema diff**

Run:
```bash
cd /Users/akwaah/Documents/GitHub/Backend
mkdir -p prisma/migrations/20260719120000_add_pledge_tables
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "$SHADOW_DATABASE_URL" \
  --script > prisma/migrations/20260719120000_add_pledge_tables/migration.sql
```
Expected: a `migration.sql` containing `CREATE TABLE pledge`, `pledge_group`, `pledge_caller`, `pledger`, `pledge_redemption` with FKs.

If `migrate diff` with shadow DB is unavailable, instead run `npx prisma migrate dev --name add_pledge_tables` against a local dev DB (creates the migration dir + applies it).

- [ ] **Step 2: Apply + regenerate client**

Run: `npx prisma migrate deploy && npx prisma generate`
Expected: migration applied, `Generated Prisma Client`.

- [ ] **Step 3: Verify client types exist**

Run: `node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); console.log(typeof p.pledge, typeof p.pledger, typeof p.pledge_redemption)"`
Expected: `object object object`

- [ ] **Step 4: Commit**

```bash
git add prisma/migrations/20260719120000_add_pledge_tables
git commit -m "feat(pledges): add pledge tables migration"
```

---

### Task 3: Permission domain (backend)

**Files:**
- Modify: `src/modules/accessLevels/accessLevelController.ts` (`OPTIONAL_PERMISSION_KEYS` ~line 24, `PERMISSION_KEY_NORMALIZER` ~line 37)
- Modify: `src/middleWare/authorization.ts` (`PERMISSION_KEY_ALIASES` ~line 10; add `can_*_pledges` near ~line 1653)
- Modify: `src/utils/permissionResolver.ts` (`PERMISSION_KEY_ALIASES` ~line 1)

- [ ] **Step 1: Register the domain key**

In `accessLevelController.ts`, add `"Pledges"` to the `OPTIONAL_PERMISSION_KEYS` array. In `PERMISSION_KEY_NORMALIZER`, add a normalizer entry mapping variants to canonical: `Pledges: "Pledges", pledges: "Pledges"` (match the existing entries' exact shape — read the surrounding lines first and mirror them).

- [ ] **Step 2: Add aliases**

In both `src/middleWare/authorization.ts` and `src/utils/permissionResolver.ts`, add to `PERMISSION_KEY_ALIASES`:
```ts
Pledges: ["Pledges", "Pledge"],
```

- [ ] **Step 3: Add permission instances**

In `authorization.ts`, near the finance instances (~1653), add inside the `Permissions` class instance section (mirror `can_view_financials` exactly):
```ts
can_view_pledges = this.checkPermission("Pledges", "view", "You do not have permission to view pledges");
can_manage_pledges = this.checkPermission("Pledges", "manage", "You do not have permission to manage pledges");
can_delete_pledges = this.checkPermission("Pledges", "admin", "You do not have permission to delete pledges");
```

- [ ] **Step 4: Type-check**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit`
Expected: no new errors referencing pledges.

- [ ] **Step 5: Commit**

```bash
git add src/modules/accessLevels/accessLevelController.ts src/middleWare/authorization.ts src/utils/permissionResolver.ts
git commit -m "feat(pledges): add Pledges permission domain"
```

---

### Task 4: `common.ts` — validators & error handling

**Files:**
- Create: `src/modules/pledges/common.ts`

- [ ] **Step 1: Write validators + error helpers**

Mirror `src/modules/finance/common.ts` (read it first). Create:
```ts
// src/modules/pledges/common.ts
import { Response } from "express";
import { Prisma } from "@prisma/client";

export class PledgeHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "PledgeHttpError";
  }
}

const asNumber = (v: unknown, field: string): number => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  if (v === undefined || v === null || Number.isNaN(n)) {
    throw new PledgeHttpError(400, `${field} must be a valid number`);
  }
  return n;
};

interface PledgerInput { user_id?: number | null; guest_name?: string | null; guest_phone?: string | null; pledged_amount?: number | string; }
interface GroupInput { id?: number; called_amount: number | string; label?: string | null; pledgers?: PledgerInput[]; }
interface CallerInput { user_id?: number | null; guest_name?: string | null; guest_phone?: string | null; }

const validatePerson = (p: PledgerInput | CallerInput, ctx: string) => {
  const hasMember = p.user_id !== undefined && p.user_id !== null;
  const hasGuest = !!p.guest_name;
  if (!hasMember && !hasGuest) throw new PledgeHttpError(400, `${ctx}: each person needs user_id or guest_name`);
  if (hasGuest && !("guest_phone" in p && p.guest_phone)) throw new PledgeHttpError(400, `${ctx}: guest requires guest_phone`);
};

export const validatePledgeMutationPayload = (body: any) => {
  if (!body || typeof body !== "object") throw new PledgeHttpError(400, "Invalid payload");
  if (body.event_id === undefined || body.event_id === null) throw new PledgeHttpError(400, "event_id is required");
  const groups: GroupInput[] = Array.isArray(body.groups) ? body.groups : [];
  if (groups.length === 0) throw new PledgeHttpError(400, "At least one group is required");
  groups.forEach((g, gi) => {
    asNumber(g.called_amount, `groups[${gi}].called_amount`);
    (g.pledgers ?? []).forEach((p, pi) => {
      validatePerson(p, `groups[${gi}].pledgers[${pi}]`);
      if (p.pledged_amount !== undefined) asNumber(p.pledged_amount, `groups[${gi}].pledgers[${pi}].pledged_amount`);
    });
  });
  (body.callers ?? []).forEach((c: CallerInput, ci: number) => validatePerson(c, `callers[${ci}]`));
  return body;
};

export const validateRedemptionPayload = (body: any) => {
  if (!body || typeof body !== "object") throw new PledgeHttpError(400, "Invalid payload");
  asNumber(body.pledger_id, "pledger_id");
  asNumber(body.amount, "amount");
  if (!body.date) throw new PledgeHttpError(400, "date is required");
  if (!body.method) throw new PledgeHttpError(400, "method is required");
  return body;
};

export const resolvePledgeError = (error: unknown): { status: number; message: string } => {
  if (error instanceof PledgeHttpError) return { status: error.status, message: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return { status: 404, message: "Record not found" };
    if (error.code === "P2003") return { status: 400, message: "Related record does not exist" };
  }
  return { status: 500, message: "Something went wrong processing the pledge" };
};

export const sendPledgeError = (res: Response, error: unknown) => {
  const { status, message } = resolvePledgeError(error);
  return res.status(status).json({ message });
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `common.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/modules/pledges/common.ts
git commit -m "feat(pledges): add validators and error helpers"
```

---

### Task 5: Pledge service (create/list/detail/update/delete + aggregation)

**Files:**
- Create: `src/modules/pledges/pledges/service.ts`

- [ ] **Step 1: Write the service**

Read `src/modules/finance/Financials/service.ts` and `src/modules/branches/branchService.ts` first. Create:
```ts
// src/modules/pledges/pledges/service.ts
import { PrismaClient, Prisma } from "@prisma/client";
import { getBranchScopedWhere, resolveBranchIdOrDefault } from "../../branches/branchService";

const prisma = new PrismaClient();

const num = (d: Prisma.Decimal | null | undefined) => (d ? Number(d) : 0);

const pledgeInclude = {
  event: true,
  callers: { include: { user: true } },
  groups: { include: { pledgers: { include: { user: true, redemptions: true } } } },
};

// Compute totals for a fully-included pledge row
const summarize = (p: any) => {
  let totalPledged = 0, totalRedeemed = 0;
  for (const g of p.groups) for (const pl of g.pledgers) {
    totalPledged += num(pl.pledged_amount);
    totalRedeemed += pl.redemptions.reduce((s: number, r: any) => s + num(r.amount), 0);
  }
  const percent = totalPledged > 0 ? Math.round((totalRedeemed / totalPledged) * 100) : 0;
  const status = totalPledged > 0 && totalRedeemed >= totalPledged ? "completed" : "in_progress";
  return { totalPledged, totalRedeemed, remaining: totalPledged - totalRedeemed, percent, status };
};

export class PledgeService {
  async create(payload: any, actorId?: number) {
    const branch_id = await resolveBranchIdOrDefault(payload.branch_id);
    return prisma.pledge.create({
      data: {
        branch_id,
        event_id: Number(payload.event_id),
        title: payload.title ?? null,
        target_amount: payload.target_amount != null ? new Prisma.Decimal(payload.target_amount) : null,
        deadline: payload.deadline ? new Date(payload.deadline) : null,
        created_by_user_id: actorId ?? null,
        callers: { create: (payload.callers ?? []).map((c: any) => ({
          user_id: c.user_id ?? null, guest_name: c.guest_name ?? null, guest_phone: c.guest_phone ?? null,
        })) },
        groups: { create: (payload.groups ?? []).map((g: any) => ({
          called_amount: new Prisma.Decimal(g.called_amount),
          label: g.label ?? null,
          pledgers: { create: (g.pledgers ?? []).map((p: any) => ({
            user_id: p.user_id ?? null, guest_name: p.guest_name ?? null, guest_phone: p.guest_phone ?? null,
            pledged_amount: new Prisma.Decimal(p.pledged_amount ?? g.called_amount),
          })) },
        })) },
      },
      include: pledgeInclude,
    });
  }

  async list(branchId?: string | number, status?: string) {
    const rows = await prisma.pledge.findMany({
      where: getBranchScopedWhere(branchId),
      include: pledgeInclude,
      orderBy: { created_at: "desc" },
    });
    const mapped = rows.map((p) => ({
      id: p.id, event: p.event, title: p.title, deadline: p.deadline,
      callers: p.callers, ...summarize(p),
    }));
    return status ? mapped.filter((m) => m.status === status) : mapped;
  }

  async detail(id: number) {
    const p = await prisma.pledge.findUniqueOrThrow({ where: { id }, include: pledgeInclude });
    const pledgers = p.groups.flatMap((g: any) => g.pledgers.map((pl: any) => {
      const redeemed = pl.redemptions.reduce((s: number, r: any) => s + num(r.amount), 0);
      return {
        id: pl.id, group_id: g.group_id ?? g.id, group_label: g.label, called_amount: num(g.called_amount),
        user: pl.user, guest_name: pl.guest_name, guest_phone: pl.guest_phone,
        pledged_amount: num(pl.pledged_amount), redeemed, remaining: num(pl.pledged_amount) - redeemed,
        redemptions: pl.redemptions,
      };
    }));
    return { ...p, groups: p.groups, callers: p.callers, pledgers, ...summarize(p) };
  }

  async update(id: number, payload: any) {
    // Replace-in-place: update meta; replace groups+callers (delete existing children, recreate).
    return prisma.$transaction(async (tx) => {
      await tx.pledge.update({
        where: { id },
        data: {
          event_id: payload.event_id != null ? Number(payload.event_id) : undefined,
          title: payload.title ?? null,
          target_amount: payload.target_amount != null ? new Prisma.Decimal(payload.target_amount) : null,
          deadline: payload.deadline ? new Date(payload.deadline) : null,
          branch_id: payload.branch_id != null ? await resolveBranchIdOrDefault(payload.branch_id) : undefined,
        },
      });
      if (Array.isArray(payload.callers)) {
        await tx.pledge_caller.deleteMany({ where: { pledge_id: id } });
        await tx.pledge_caller.createMany({ data: payload.callers.map((c: any) => ({
          pledge_id: id, user_id: c.user_id ?? null, guest_name: c.guest_name ?? null, guest_phone: c.guest_phone ?? null,
        })) });
      }
      // NOTE: groups are only replaced when explicitly provided, to avoid wiping redemptions.
      if (Array.isArray(payload.groups)) {
        const existing = await tx.pledge_group.findMany({ where: { pledge_id: id }, select: { id: true } });
        await tx.pledge_group.deleteMany({ where: { id: { in: existing.map((e) => e.id) } } });
        for (const g of payload.groups) {
          await tx.pledge_group.create({ data: {
            pledge_id: id, called_amount: new Prisma.Decimal(g.called_amount), label: g.label ?? null,
            pledgers: { create: (g.pledgers ?? []).map((p: any) => ({
              user_id: p.user_id ?? null, guest_name: p.guest_name ?? null, guest_phone: p.guest_phone ?? null,
              pledged_amount: new Prisma.Decimal(p.pledged_amount ?? g.called_amount),
            })) },
          } });
        }
      }
      return tx.pledge.findUniqueOrThrow({ where: { id }, include: pledgeInclude });
    });
  }

  async remove(id: number) {
    return prisma.pledge.delete({ where: { id } });
  }
}
```

> **Edit-mode caveat:** because "edit pledge" here replaces groups (and therefore pledgers + their redemptions) when `groups` is sent, the frontend edit form must NOT send `groups` when the user only edits meta/callers. Adding pledgers to an existing group goes through `add-pledgers` (Task 7), not update. Document this in the interface types.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `service.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/modules/pledges/pledges/service.ts
git commit -m "feat(pledges): add pledge service with aggregation"
```

---

### Task 6: Pledge controller + route

**Files:**
- Create: `src/modules/pledges/pledges/controller.ts`
- Create: `src/modules/pledges/pledges/route.ts`

- [ ] **Step 1: Controller**

```ts
// src/modules/pledges/pledges/controller.ts
import { Request, Response } from "express";
import { PledgeService } from "./service";
import { validatePledgeMutationPayload, sendPledgeError } from "../common";

const service = new PledgeService();

export const createPledge = async (req: Request, res: Response) => {
  try {
    const payload = validatePledgeMutationPayload(req.body);
    const data = await service.create(payload, (req as any).user?.id);
    return res.status(201).json({ message: "Pledge created", data });
  } catch (e) { return sendPledgeError(res, e); }
};

export const getPledges = async (req: Request, res: Response) => {
  try {
    const data = await service.list(req.query?.branch_id as string, req.query?.status as string);
    return res.status(200).json({ message: "Pledges fetched", data });
  } catch (e) { return sendPledgeError(res, e); }
};

export const getPledge = async (req: Request, res: Response) => {
  try {
    const id = Number(req.query?.id);
    const data = await service.detail(id);
    return res.status(200).json({ message: "Pledge fetched", data });
  } catch (e) { return sendPledgeError(res, e); }
};

export const updatePledge = async (req: Request, res: Response) => {
  try {
    const payload = validatePledgeMutationPayload({ ...req.body, groups: req.body.groups ?? undefined });
    const id = Number(req.body?.id ?? req.query?.id);
    const data = await service.update(id, payload);
    return res.status(200).json({ message: "Pledge updated", data });
  } catch (e) { return sendPledgeError(res, e); }
};

export const deletePledge = async (req: Request, res: Response) => {
  try {
    await service.remove(Number(req.query?.id));
    return res.status(200).json({ message: "Pledge deleted" });
  } catch (e) { return sendPledgeError(res, e); }
};
```

> If `validatePledgeMutationPayload` requires `groups`, relax it for update: allow `groups` to be omitted (meta/callers-only edit). Adjust the validator so a missing `groups` key is allowed but an empty array is rejected only on create. Concretely: add a second arg `validatePledgeMutationPayload(body, { requireGroups = true } = {})` and pass `false` from `updatePledge`.

- [ ] **Step 2: Update the validator signature (from the note above)**

In `src/modules/pledges/common.ts`, change:
```ts
export const validatePledgeMutationPayload = (body: any, opts: { requireGroups?: boolean } = { requireGroups: true }) => {
  // ...existing checks...
  const groups: GroupInput[] = Array.isArray(body.groups) ? body.groups : [];
  if (opts.requireGroups !== false && groups.length === 0) throw new PledgeHttpError(400, "At least one group is required");
  // validate whatever groups are present
```
And in `updatePledge`, call `validatePledgeMutationPayload(req.body, { requireGroups: false })`.

- [ ] **Step 3: Route**

```ts
// src/modules/pledges/pledges/route.ts
import { Router } from "express";
import { protect, Permissions } from "../../../middleWare/authorization";
import { createPledge, getPledges, getPledge, updatePledge, deletePledge } from "./controller";

const permissions = new Permissions();
export const pledgesRouter = Router();

pledgesRouter.get("/get-pledges", [protect, permissions.can_view_pledges], getPledges);
pledgesRouter.get("/get-pledge", [protect, permissions.can_view_pledges], getPledge);
pledgesRouter.post("/create-pledge", [protect, permissions.can_manage_pledges], createPledge);
pledgesRouter.put("/update-pledge", [protect, permissions.can_manage_pledges], updatePledge);
pledgesRouter.delete("/delete-pledge", [protect, permissions.can_delete_pledges], deletePledge);
```

> Read `src/middleWare/authorization.ts` to confirm the exact export names for `protect` and the `Permissions` class before writing imports.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/modules/pledges/pledges/controller.ts src/modules/pledges/pledges/route.ts src/modules/pledges/common.ts
git commit -m "feat(pledges): add pledge controller and routes"
```

---

### Task 7: Redemptions + add-pledgers (service, controller, route)

**Files:**
- Create: `src/modules/pledges/redemptions/service.ts`
- Create: `src/modules/pledges/redemptions/controller.ts`
- Create: `src/modules/pledges/redemptions/route.ts`

- [ ] **Step 1: Service**

Read `src/modules/uploadFile/uploads.ts` for `uploadLocalFileToS3` import path. Create:
```ts
// src/modules/pledges/redemptions/service.ts
import { PrismaClient, Prisma } from "@prisma/client";
import { uploadLocalFileToS3 } from "../../../utils"; // confirm exact path from uploads.ts

const prisma = new PrismaClient();

export class RedemptionService {
  async create(body: any, filePath?: string, actorId?: number) {
    let image_url: string | null = null;
    if (filePath) {
      const uploaded = await uploadLocalFileToS3({ filePath, folder: "pledge-redemptions" } as any);
      image_url = (uploaded as any)?.result?.link ?? (uploaded as any)?.link ?? null;
    }
    return prisma.pledge_redemption.create({
      data: {
        pledger_id: Number(body.pledger_id),
        amount: new Prisma.Decimal(body.amount),
        date: new Date(body.date),
        method: body.method,
        note: body.note ?? null,
        image_url,
        recorded_by_user_id: actorId ?? null,
      },
    });
  }

  async remove(id: number) {
    return prisma.pledge_redemption.delete({ where: { id } });
  }

  async addPledgers(groupId: number, pledgers: any[]) {
    const group = await prisma.pledge_group.findUniqueOrThrow({ where: { id: groupId } });
    return prisma.pledger.createMany({
      data: pledgers.map((p) => ({
        group_id: groupId,
        user_id: p.user_id ?? null, guest_name: p.guest_name ?? null, guest_phone: p.guest_phone ?? null,
        pledged_amount: new Prisma.Decimal(p.pledged_amount ?? group.called_amount),
      })),
    });
  }

  async removePledger(id: number) {
    return prisma.pledger.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Controller**

```ts
// src/modules/pledges/redemptions/controller.ts
import { Request, Response } from "express";
import { RedemptionService } from "./service";
import { validateRedemptionPayload, sendPledgeError, PledgeHttpError } from "../common";

const service = new RedemptionService();

export const createRedemption = async (req: Request, res: Response) => {
  try {
    validateRedemptionPayload(req.body);
    const data = await service.create(req.body, (req as any).file?.path, (req as any).user?.id);
    return res.status(201).json({ message: "Redemption recorded", data });
  } catch (e) { return sendPledgeError(res, e); }
};

export const deleteRedemption = async (req: Request, res: Response) => {
  try {
    await service.remove(Number(req.query?.id));
    return res.status(200).json({ message: "Redemption deleted" });
  } catch (e) { return sendPledgeError(res, e); }
};

export const addPledgers = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.body?.group_id);
    if (!groupId) throw new PledgeHttpError(400, "group_id is required");
    const data = await service.addPledgers(groupId, req.body?.pledgers ?? []);
    return res.status(201).json({ message: "Pledgers added", data });
  } catch (e) { return sendPledgeError(res, e); }
};

export const deletePledger = async (req: Request, res: Response) => {
  try {
    await service.removePledger(Number(req.query?.id));
    return res.status(200).json({ message: "Pledger removed" });
  } catch (e) { return sendPledgeError(res, e); }
};
```

- [ ] **Step 3: Route (multipart for redemption image)**

Read `src/modules/assets/assetRouter.ts` for the multer setup pattern. Create:
```ts
// src/modules/pledges/redemptions/route.ts
import { Router } from "express";
import multer from "multer";
import { protect, Permissions } from "../../../middleWare/authorization";
import { createRedemption, deleteRedemption, addPledgers, deletePledger } from "./controller";

const upload = multer({ dest: "uploads/" });
const permissions = new Permissions();
export const redemptionsRouter = Router();

redemptionsRouter.post("/create-redemption", [protect, upload.single("file"), permissions.can_manage_pledges], createRedemption);
redemptionsRouter.delete("/delete-redemption", [protect, permissions.can_manage_pledges], deleteRedemption);
redemptionsRouter.post("/add-pledgers", [protect, permissions.can_manage_pledges], addPledgers);
redemptionsRouter.delete("/delete-pledger", [protect, permissions.can_manage_pledges], deletePledger);
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. If `uploadLocalFileToS3` import path is wrong, fix it per `uploads.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/modules/pledges/redemptions
git commit -m "feat(pledges): add redemptions and add-pledgers endpoints"
```

---

### Task 8: Mount router

**Files:**
- Create: `src/modules/pledges/route.ts` (combines both sub-routers)
- Modify: `src/routes/appRouter.ts`

- [ ] **Step 1: Combine sub-routers**

```ts
// src/modules/pledges/route.ts
import { Router } from "express";
import { pledgesRouter } from "./pledges/route";
import { redemptionsRouter } from "./redemptions/route";

const router = Router();
router.use(pledgesRouter);
router.use(redemptionsRouter);
export { router as pledgesModuleRouter };
```

- [ ] **Step 2: Mount in appRouter**

In `src/routes/appRouter.ts`: import `{ pledgesModuleRouter } from "../modules/pledges/route"` near the other imports (~line 29) and add near line 66:
```ts
appRouter.use("/pledges", pledgesModuleRouter);
```

- [ ] **Step 3: Build + boot check**

Run: `npx tsc --noEmit && npm run dev` (start), then in another shell:
```bash
curl -s -X POST http://localhost:8080/pledges/create-pledge -H "Content-Type: application/json" -d '{}'
```
Expected: HTTP 401 (no token) — proves the route is mounted and `protect` runs. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/modules/pledges/route.ts src/routes/appRouter.ts
git commit -m "feat(pledges): mount pledges router"
```

---

### Task 9: Backend end-to-end smoke test

- [ ] **Step 1: Boot backend + get a token**

Start `npm run dev`. Log in via the existing login endpoint (`POST /user/login`) to obtain a JWT with `Pledges` permission (grant the test user the Pledges domain via the access-levels admin, or use a Super_Admin). Save token to `$T`.

- [ ] **Step 2: Create → list → detail → redeem → re-detail**

```bash
# create (use a real event_id from the DB)
curl -s -X POST http://localhost:8080/pledges/create-pledge -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
 -d '{"event_id":1,"title":"Building Fund","groups":[{"called_amount":1000,"label":"First call","pledgers":[{"user_id":1},{"guest_name":"John","guest_phone":"0240000000"}]}],"callers":[{"user_id":1}]}'
# list
curl -s http://localhost:8080/pledges/get-pledges -H "Authorization: Bearer $T"
# detail (id from create response)
curl -s "http://localhost:8080/pledges/get-pledge?id=1" -H "Authorization: Bearer $T"
# redeem (pledger_id from detail)
curl -s -X POST http://localhost:8080/pledges/create-redemption -H "Authorization: Bearer $T" -F pledger_id=1 -F amount=400 -F date=2026-07-19 -F method=cash -F note=partial
# re-detail: pledger shows redeemed 400, remaining 600; pledge percent reflects it
curl -s "http://localhost:8080/pledges/get-pledge?id=1" -H "Authorization: Bearer $T"
```
Expected: totals/percent/status compute correctly; `status` flips to `completed` once redeemed ≥ pledged.

- [ ] **Step 3: Push backend branch**

```bash
git push -u origin feat/pledges
```

---

## PHASE B — Frontend

(Working dir: `/Users/akwaah/Documents/GitHub/Frontend`, branch `feat/pledges`.)

### Task 10: Frontend permission domain

**Files:**
- Modify: `src/utils/accessControl.ts` (`CANONICAL_PERMISSION_DOMAINS` ~line 13-32; `DOMAIN_ALIASES` ~line 82; legacy map ~line 265)

- [ ] **Step 1: Add domain + aliases + legacy keys**

- Add `"Pledges"` to `CANONICAL_PERMISSION_DOMAINS`.
- Add to `DOMAIN_ALIASES`: `Pledges: ["Pledges", "Pledge"],`
- Add to the legacy key map (near `view_financials`):
```ts
view_pledges: { domain: "Pledges", action: "view" },
manage_pledges: { domain: "Pledges", action: "manage" },
delete_pledges: { domain: "Pledges", action: "admin" },
```
Read the surrounding entries and match their exact object shape/types.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/accessControl.ts
git commit -m "feat(pledges): add Pledges permission domain (frontend)"
```

---

### Task 11: API types

**Files:**
- Create: `src/utils/api/pledges/interface.ts`

- [ ] **Step 1: Write types**

```ts
// src/utils/api/pledges/interface.ts
export interface PledgePerson {
  user_id?: number | null;
  guest_name?: string | null;
  guest_phone?: string | null;
}

export interface PledgerInput extends PledgePerson {
  id?: number;
  pledged_amount?: number;
}

export interface PledgeGroupInput {
  id?: number;
  called_amount: number;
  label?: string | null;
  pledgers: PledgerInput[];
}

export interface PledgeMutationPayload {
  id?: number;
  branch_id?: number | "";
  event_id: number | "";
  title?: string;
  target_amount?: number | null;
  deadline?: string | null;
  callers: PledgePerson[];
  groups?: PledgeGroupInput[]; // omit on meta/callers-only edit to preserve redemptions
}

export interface PledgeListRow {
  id: number;
  event: { id: number; event_name: string } | null;
  title: string | null;
  callers: Array<{ user?: { name?: string } | null; guest_name?: string | null }>;
  totalPledged: number;
  totalRedeemed: number;
  remaining: number;
  percent: number;
  status: "completed" | "in_progress";
}

export interface Redemption {
  id: number;
  amount: number;
  date: string;
  method: string;
  note?: string | null;
  image_url?: string | null;
}

export interface PledgerRow {
  id: number;
  group_id: number;
  group_label?: string | null;
  called_amount: number;
  user?: { id: number; name?: string } | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  pledged_amount: number;
  redeemed: number;
  remaining: number;
  redemptions: Redemption[];
}

export interface PledgeDetail extends PledgeListRow {
  deadline: string | null;
  groups: PledgeGroupInput[];
  pledgers: PledgerRow[];
}

export interface RedemptionPayload {
  pledger_id: number;
  amount: number;
  date: string;
  method: string;
  note?: string;
  file?: File | null;
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit` → no errors.
```bash
git add src/utils/api/pledges/interface.ts
git commit -m "feat(pledges): add api types"
```

---

### Task 12: API methods

**Files:**
- Modify: `src/utils/api/apiFetch.ts`, `apiPost.ts`, `apiPut.ts`, `apiDelete.ts`

- [ ] **Step 1: Add methods mirroring the `financials/*` entries**

Read one existing entry in each file first, then add (matching the file's existing style — `instance`/`pictureInstance` usage, param shape):

`apiFetch.ts`:
```ts
fetchPledges: (query?: { branch_id?: number; status?: string }) =>
  instance.get("pledges/get-pledges", { params: query }),
fetchPledge: (query: { id: number }) =>
  instance.get("pledges/get-pledge", { params: query }),
```
`apiPost.ts`:
```ts
createPledge: (data: any) => instance.post("pledges/create-pledge", data),
addPledgers: (data: any) => instance.post("pledges/add-pledgers", data),
createRedemption: (formData: FormData) =>
  pictureInstance.post("pledges/create-redemption", formData),
```
`apiPut.ts`:
```ts
updatePledge: (data: any) => instance.put("pledges/update-pledge", data),
```
`apiDelete.ts`:
```ts
deletePledge: (id: number) => instance.delete("pledges/delete-pledge", { params: { id } }),
deletePledger: (id: number) => instance.delete("pledges/delete-pledger", { params: { id } }),
deleteRedemption: (id: number) => instance.delete("pledges/delete-redemption", { params: { id } }),
```
Confirm whether these files export a single object (add keys to it) or individual functions, and match that structure. Import `pictureInstance` in `apiPost.ts` if not already imported.

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit` → no errors.
```bash
git add src/utils/api/apiFetch.ts src/utils/api/apiPost.ts src/utils/api/apiPut.ts src/utils/api/apiDelete.ts
git commit -m "feat(pledges): add api methods"
```

---

### Task 13: Helpers + Yup schema

**Files:**
- Create: `src/pages/HomePage/pages/FinanceManagement/Pledges/utils/pledgeHelpers.ts`

- [ ] **Step 1: Write helpers**

```ts
// utils/pledgeHelpers.ts
import * as Yup from "yup";
import { PledgeMutationPayload } from "@/utils/api/pledges/interface";

export const personLabel = (p: { user?: { name?: string } | null; guest_name?: string | null }) =>
  p.user?.name ?? p.guest_name ?? "Unknown";

export const emptyPledger = (called_amount = 0) => ({
  isGuest: false, user_id: "" as number | "", guest_name: "", guest_phone: "", pledged_amount: called_amount,
});

export const emptyGroup = () => ({ called_amount: 0, label: "", pledgers: [emptyPledger()] });
export const emptyCaller = () => ({ isGuest: false, user_id: "" as number | "", guest_name: "", guest_phone: "" });

const personSchema = Yup.object({
  isGuest: Yup.boolean(),
  user_id: Yup.mixed().when("isGuest", { is: false, then: (s) => s.required("Select a member") }),
  guest_name: Yup.string().when("isGuest", { is: true, then: (s) => s.required("Guest name required") }),
  guest_phone: Yup.string().when("isGuest", { is: true, then: (s) => s.required("Guest phone required") }),
});

export const pledgeSchema = Yup.object({
  event_id: Yup.mixed().required("Event is required"),
  title: Yup.string().nullable(),
  target_amount: Yup.number().nullable().min(0),
  deadline: Yup.string().nullable(),
  callers: Yup.array().of(personSchema),
  groups: Yup.array().of(Yup.object({
    called_amount: Yup.number().required("Called amount required").positive("Must be > 0"),
    label: Yup.string().nullable(),
    pledgers: Yup.array().of(personSchema.concat(Yup.object({
      pledged_amount: Yup.number().required("Amount required").positive(),
    }))).min(1, "Add at least one pledger"),
  })).min(1, "Add at least one group"),
});

// Strip client-only `isGuest`, coerce user_id "" → null, before submit.
export const toPayload = (values: any): PledgeMutationPayload => ({
  id: values.id,
  branch_id: values.branch_id,
  event_id: values.event_id,
  title: values.title || undefined,
  target_amount: values.target_amount ?? null,
  deadline: values.deadline || null,
  callers: (values.callers ?? []).map(stripPerson),
  groups: (values.groups ?? []).map((g: any) => ({
    called_amount: Number(g.called_amount), label: g.label || null,
    pledgers: (g.pledgers ?? []).map((p: any) => ({ ...stripPerson(p), pledged_amount: Number(p.pledged_amount) })),
  })),
});

const stripPerson = (p: any) => ({
  user_id: p.isGuest ? null : (p.user_id === "" ? null : Number(p.user_id)),
  guest_name: p.isGuest ? p.guest_name : null,
  guest_phone: p.isGuest ? p.guest_phone : null,
});
```

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit` → no errors.
```bash
git add src/pages/HomePage/pages/FinanceManagement/Pledges/utils/pledgeHelpers.ts
git commit -m "feat(pledges): add form helpers and yup schema"
```

---

### Task 14: Overview page

**Files:**
- Create: `src/pages/HomePage/pages/FinanceManagement/Pledges/PledgesOverview.tsx`

- [ ] **Step 1: Write the page**

Read `FinanaceManagement.tsx` for `PageOutline`/`HeaderControls`/`useFetch` usage and `TableComponent.tsx` for column defs. Build a page that:
- reads `const { activeBranchId } = useBranchStore()` and `useFetch(api.fetch.fetchPledges, { ...buildBranchQuery(activeBranchId), status })`
- has status filter tabs (`""` = all, `in_progress`, `completed`) stored in local state, passed into the fetch query
- renders `HeaderControls` with `btnName="Create Pledge"`, `handleClick={() => navigate("/home/finance/pledges/create")}`
- renders `TableComponent` with columns: event name, callers (join `personLabel`), `% covered` (progress bar), `redeemed / total`, `remaining`
- `onRowClick={(row) => navigate("/home/finance/pledges/" + row.id)}`

Gate the Create button on `useAccessControl` with `manage_pledges`.

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`, log in, navigate to `/home/finance/pledges`.
Expected: page loads, table renders (empty or with backend data), filter tabs switch, Create button routes. (Requires Task 15 route wiring — do Step 3 after Task 15 if needed.)

- [ ] **Step 3: Lint + commit**

Run: `npm run lint`
```bash
git add src/pages/HomePage/pages/FinanceManagement/Pledges/PledgesOverview.tsx
git commit -m "feat(pledges): add overview page"
```

---

### Task 15: Routes + sidebar

**Files:**
- Modify: `src/routes/appRoutes.tsx` (imports ~92-95; Finance children ~636-667)

- [ ] **Step 1: Import page components**

Add lazy/eager imports (match the file's existing import style) for `PledgesOverview`, `PledgeForm`, `PledgeDetail`.

- [ ] **Step 2: Add child routes**

Inside the Finance parent `children` array:
```tsx
{ path: "pledges", element: <PledgesOverview />, name: "Pledges", isPrivate: true, permissionNeeded: "view_pledges", sideTab: true },
{ path: "pledges/create", element: <PledgeForm mode="create" />, name: "Create Pledge", isPrivate: true, permissionNeeded: "manage_pledges" },
{ path: "pledges/:id", element: <PledgeDetail />, name: "Pledge Detail", isPrivate: true, permissionNeeded: "view_pledges" },
{ path: "pledges/:id/edit", element: <PledgeForm mode="edit" />, name: "Edit Pledge", isPrivate: true, permissionNeeded: "manage_pledges" },
```

- [ ] **Step 3: Verify sidebar + type-check**

Run: `npx tsc --noEmit` then `npm run dev`.
Expected: "Pledges" appears under the Finance submenu (for a user with `view_pledges`); clicking it loads the overview.

- [ ] **Step 4: Commit**

```bash
git add src/routes/appRoutes.tsx
git commit -m "feat(pledges): add finance child routes and sidebar entry"
```

---

### Task 16: Caller & Pledger field-array components

**Files:**
- Create: `.../Pledges/components/CallerFieldArray.tsx`
- Create: `.../Pledges/components/PledgerFieldArray.tsx`

- [ ] **Step 1: PersonFields shared pattern**

Both use Formik `FieldArray`. Each person row has a member/guest toggle:
- member → `FormikSelectField` with `options={membersOptions}` bound to `user_id` (searchable)
- guest → two `FormikInputDiv` (name, phone)
Read `FinanceBuilder.tsx` for `FieldArray` + `FormikSelectField` usage and how members options are sourced (`useStore()`), then implement.

`PledgerFieldArray` additionally renders a `pledged_amount` `FormikInputDiv` (number) per row, defaulted to the parent group's `called_amount`, and an "Add pledger" / remove buttons. Props: `{ name: string; calledAmount: number; membersOptions }` where `name` is the Formik path (e.g. `groups[0].pledgers`).

`CallerFieldArray` props: `{ name: "callers"; membersOptions }`.

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit` → no errors.
```bash
git add "src/pages/HomePage/pages/FinanceManagement/Pledges/components/CallerFieldArray.tsx" "src/pages/HomePage/pages/FinanceManagement/Pledges/components/PledgerFieldArray.tsx"
git commit -m "feat(pledges): add caller and pledger field arrays"
```

---

### Task 17: Pledge form (create + edit)

**Files:**
- Create: `.../Pledges/PledgeForm.tsx`

- [ ] **Step 1: Write the form**

Props: `{ mode: "create" | "edit" }`. Behavior:
- `useStore()` → `eventsOptions`, members options; `useBranchStore()` → `activeBranchId`.
- In edit mode, `useParams()` → id, `useFetch(api.fetch.fetchPledge, { id })`, map response into Formik initial values (set `isGuest` from whether `user_id` is present).
- `<Formik initialValues={...} validationSchema={pledgeSchema} onSubmit={...}>`:
  - `BranchSelectField` bound to `branch_id` (required when `activeBranchId === ALL_BRANCHES`)
  - event `FormikSelectField` (options `eventsOptions`)
  - `title`, `target_amount`, `deadline` inputs
  - `<CallerFieldArray name="callers" membersOptions={...} />`
  - groups `FieldArray`: each group = `called_amount` + `label` inputs + `<PledgerFieldArray name={`groups.${i}.pledgers`} calledAmount={g.called_amount} .../>`; add/remove group buttons
- onSubmit: build payload via `toPayload(values)`. Create → `usePost(api.post.createPledge)`. Edit → `usePut(api.put.updatePledge)` (**include `groups` only if the user modified them** — provide an "Edit amounts/pledgers" toggle that, when off, omits `groups` from the payload to preserve redemptions; default off in edit mode). On success `showNotification`, navigate to detail.

> Guardrail: In edit mode, show a warning near the groups section: "Editing groups replaces all pledgers and their recorded redemptions. To add people to an existing group, use 'Add members' on the pledge detail page instead."

- [ ] **Step 2: Verify create flow in dev**

Run: `npm run dev`. Create a pledge with 1 group, 2 pledgers (one member, one guest), 1 caller. Submit.
Expected: success notification, redirect to detail, backend row created (cross-check with Task 9 list curl).

- [ ] **Step 3: Lint + commit**

Run: `npm run lint`
```bash
git add "src/pages/HomePage/pages/FinanceManagement/Pledges/PledgeForm.tsx"
git commit -m "feat(pledges): add create/edit pledge form"
```

---

### Task 18: Detail page

**Files:**
- Create: `.../Pledges/PledgeDetail.tsx`

- [ ] **Step 1: Write the page**

- `useParams()` → id; `useFetch(api.fetch.fetchPledge, { id })` → `{ data, refetch }`.
- Header summary cards: event name, callers list, total pledged, total redeemed, `% covered` (progress bar), remaining, status badge.
- `TableComponent` of `pledgers`: columns name (`personLabel`), pledged, redeemed, remaining, and an actions cell with **Record redemption** button (opens `RedemptionModal` with that `pledger_id`).
- Buttons in header: **Edit pledge** → `navigate("/home/finance/pledges/" + id + "/edit")`; **Add members** → opens `AddPledgersModal` (needs group list from `data.groups`).
- Modals call `refetch()` on success.
- Gate action buttons on `manage_pledges` via `useAccessControl`.

- [ ] **Step 2: Verify in dev**

Navigate to a created pledge. Confirm totals and per-pledger rows render with correct pledged/redeemed/remaining.

- [ ] **Step 3: Lint + commit**

Run: `npm run lint`
```bash
git add "src/pages/HomePage/pages/FinanceManagement/Pledges/PledgeDetail.tsx"
git commit -m "feat(pledges): add pledge detail page"
```

---

### Task 19: Redemption modal

**Files:**
- Create: `.../Pledges/components/RedemptionModal.tsx`

- [ ] **Step 1: Write the modal**

Props: `{ open, onClose, pledgerId, onSuccess }`. `Modal` + Formik form: `amount` (number, required), `date` (date, required, default today), `method` (select: cash/transfer/cheque/mobile-money/other), `note` (text), optional `file` (image input). On submit build `FormData` (append `pledger_id`, `amount`, `date`, `method`, `note`, and `file` if present) → `api.post.createRedemption(formData)` via `usePost` or direct call through `pictureInstance`. `showNotification`, `onSuccess()` (triggers detail refetch), `onClose()`.

Read `useFileUpload`/`usePictureUpload` in `src/CustomHooks/` to decide whether to upload separately or send the file in the same multipart request. Per the backend design (Task 7), the file goes in the same `create-redemption` multipart request under field name `file`.

- [ ] **Step 2: Verify partial redemption end-to-end**

Run: `npm run dev`. On a pledger with pledged 1000, record redemption 400 (with an image). Modal closes, detail refetches: redeemed 400, remaining 600, pledge % updates. Record another 600 → status flips to `completed`; pledge appears under the Completed filter on the overview.

- [ ] **Step 3: Lint + commit**

Run: `npm run lint`
```bash
git add "src/pages/HomePage/pages/FinanceManagement/Pledges/components/RedemptionModal.tsx"
git commit -m "feat(pledges): add redemption modal"
```

---

### Task 20: Add-pledgers modal

**Files:**
- Create: `.../Pledges/components/AddPledgersModal.tsx`

- [ ] **Step 1: Write the modal**

Props: `{ open, onClose, groups, onSuccess }`. `Modal` + form: select a target group (from `groups`, label = `label || called_amount`), then a `PledgerFieldArray`-style list of new pledgers (member or guest, `pledged_amount` default = selected group's `called_amount`). Submit → `api.post.addPledgers({ group_id, pledgers })` via `usePost`. `showNotification`, `onSuccess()`, `onClose()`.

- [ ] **Step 2: Verify in dev**

Add a member to an existing group from the detail page. Confirm the new pledger appears with pledged = called amount, redeemed 0, and the pledge total pledged increases (status may flip back to `in_progress`).

- [ ] **Step 3: Lint + commit**

Run: `npm run lint`
```bash
git add "src/pages/HomePage/pages/FinanceManagement/Pledges/components/AddPledgersModal.tsx"
git commit -m "feat(pledges): add add-pledgers modal"
```

---

### Task 21: Final verification + push

- [ ] **Step 1: Full type-check + lint (frontend)**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors, no warnings (`--max-warnings 0`).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build succeeds, `dist/` produced.

- [ ] **Step 3: Full manual regression of the feature**

With backend running: overview loads + filters (completed / in progress) work → create pledge (branch condition when ALL_BRANCHES, event select, multiple groups, members + guests, callers) → detail totals correct → record partial redemptions (with image) → per-pledger redeemed/remaining update → edit pledge (meta/callers without wiping redemptions) → add members to a group. Confirm permission gating: a user without `view_pledges` does not see the sidebar entry; without `manage_pledges` cannot see create/redeem actions.

- [ ] **Step 4: Push frontend branch**

```bash
git push -u origin feat/pledges
```

- [ ] **Step 5: Open PRs (only if the user asks)**

Frontend PR → base `development`. Backend PR → base `development`. Note the cross-repo dependency in both PR descriptions (backend must deploy before frontend works against dev).

---

## Self-Review Notes (author checklist — completed)

- **Spec coverage:** overview + filter (T14), create form + branch + event + groups/pledgers + callers (T16–17), detail totals + per-member redeemed/remaining (T18), record partial redemption w/ image (T19, T7), edit pledge (T17), add members (T20, T7), separate caller list (models T1, form T16), member linkage via `user_id` FK (T1), guest name+phone (T1 validators T4), auto-derived status + % (service T5), separate Pledges permission domain both repos (T3, T10). All covered.
- **Placeholder scan:** none — all steps contain concrete code or concrete commands.
- **Type consistency:** payload/response shapes in T11 interfaces match backend service output in T5 (`totalPledged`, `totalRedeemed`, `remaining`, `percent`, `status`, `pledgers[].redeemed/remaining`). Endpoint paths in T12 match backend routes in T6/T7/T8.
- **Known caveat surfaced:** edit replaces groups (and redemptions) when `groups` sent — mitigated by the edit-mode toggle (T17) and the `add-pledgers` path (T7/T20).
