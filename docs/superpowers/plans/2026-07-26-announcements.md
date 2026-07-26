# Announcements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Announcement feature under the Communication sidenav — admins create/target/publish announcements, recipients are notified via the existing in-app pipeline, members view them in a dashboard widget and a dedicated page.

**Architecture:** Backend adds an `announcement` Prisma model + `src/modules/announcements/` (route/controller/service) with audience resolution and publish fan-out through `notificationService`. Frontend adds an `Announcements` permission domain, a Communication child admin page (list + Modal Formik form), API methods, and member widget + page.

**Tech Stack:** Backend — Express 4, TypeScript, Prisma 6 (MySQL). Frontend — React + Vite + TS, Zustand, Formik/Yup, react-quill, Tailwind.

**No test runner exists in either repo** (CLAUDE.md forbids adding one). Verification per task uses `npx tsc --noEmit`, `npm run lint`, `npx prisma migrate`, and manual endpoint/UI checks. TDD is adapted to compile + lint + manual verification.

**Paths:** Frontend = `/Users/akwaah/Documents/GitHub/Frontend` (branch `feat/announcements`). Backend = `/Users/akwaah/Documents/GitHub/Backend` (cut its own branch `feat/announcements`).

---

## File Structure

**Backend (`/Users/akwaah/Documents/GitHub/Backend`)**
- Modify: `prisma/schema.prisma` — add `announcement` model + 2 enums + back-relations.
- Create: `src/modules/announcements/announcementService.ts` — audience resolution, CRUD, publish fan-out.
- Create: `src/modules/announcements/announcementController.ts` — request handlers.
- Create: `src/modules/announcements/announcementRoute.ts` — router + guards.
- Modify: `src/modules/index.ts` — export router.
- Modify: `src/routes/appRouter.ts` — mount `/announcements`.
- Modify: `src/middleWare/authorization.ts` — `Announcements` alias + 3 guards.

**Frontend (`/Users/akwaah/Documents/GitHub/Frontend`)**
- Modify: `src/utils/accessControl.ts` — add `Announcements` domain.
- Create: `src/utils/api/announcements/interfaces.ts` — types.
- Modify: `src/utils/api/apiFetch.ts`, `apiPost.ts`, `apiPut.ts`, `apiDelete.ts` — methods.
- Create: `src/pages/HomePage/pages/ChurchCommunication/AnnouncementManager.tsx` — admin list page.
- Create: `src/pages/HomePage/pages/ChurchCommunication/Components/AnnouncementForm.tsx` — modal form.
- Create: `src/pages/HomePage/pages/ChurchCommunication/Components/AnnouncementCard.tsx` — list row.
- Create: `src/pages/HomePage/pages/Announcements/MemberAnnouncementsPage.tsx` — member page.
- Create: `src/pages/HomePage/pages/Announcements/Components/AnnouncementViewModal.tsx` — shared read modal.
- Modify: `src/pages/HomePage/pages/DashBoard/Components/ChurchAnnouncements.tsx` — make widget real.
- Modify: `src/routes/appRoutes.tsx` — admin child route + member route.

---

# PHASE A — BACKEND

### Task A1: Prisma model + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add enums + model to `prisma/schema.prisma`** (append near other feature models)

```prisma
enum announcement_audience {
  ALL_MEMBERS
  MINISTRY_WORKERS
  HEADS_OF_DEPARTMENT
  SPECIFIC_DEPARTMENT
  SPECIFIC_POSITION
}

enum announcement_status {
  DRAFT
  PUBLISHED
}

model announcement {
  id            Int                   @id @default(autoincrement())
  title         String
  content       String                @db.LongText
  audience_type announcement_audience
  department_id Int?
  position_id   Int?
  status        announcement_status   @default(DRAFT)
  branch_id     Int?
  created_by    Int
  published_at  DateTime?
  created_at    DateTime              @default(now())
  updated_at    DateTime              @updatedAt

  branch     branch?     @relation(fields: [branch_id], references: [id])
  department department? @relation(fields: [department_id], references: [id])
  position   position?   @relation(fields: [position_id], references: [id])
  creator    user        @relation("announcement_creator", fields: [created_by], references: [id])
}
```

- [ ] **Step 2: Add back-relations** to existing models (add one line each):
  - `model branch { ... announcements announcement[] }`
  - `model department { ... announcements announcement[] }`
  - `model position { ... announcements announcement[] }`
  - `model user { ... announcements_created announcement[] @relation("announcement_creator") }`

- [ ] **Step 3: Create migration**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npx prisma migrate dev --name add_announcements`
Expected: migration created + applied, `npx prisma generate` runs, no error.

- [ ] **Step 4: Verify client types**

Run: `npx tsc --noEmit`
Expected: no new errors (announcement types available on `prisma`).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(announcements): add announcement model and migration"
```

---

### Task A2: Announcement service — CRUD + audience resolution

**Files:**
- Create: `src/modules/announcements/announcementService.ts`

Follow the branch-scoping pattern from `src/modules/branches/branchService.ts` (`getBranchScopedWhere`, `resolveBranchIdOrDefault`) and the notification pattern from `src/modules/notifications/notificationService.ts` (`createManyInAppNotifications`).

- [ ] **Step 1: Write the service**

```ts
import prisma from "../../Models/context";
import {
  getBranchScopedWhere,
  resolveBranchIdOrDefault,
} from "../branches/branchService";
import { notificationService } from "../notifications/notificationService";

export type AudienceType =
  | "ALL_MEMBERS"
  | "MINISTRY_WORKERS"
  | "HEADS_OF_DEPARTMENT"
  | "SPECIFIC_DEPARTMENT"
  | "SPECIFIC_POSITION";

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  audience_type: AudienceType;
  department_id?: number | null;
  position_id?: number | null;
  branch_id?: number | null;
  created_by: number;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  audience_type?: AudienceType;
  department_id?: number | null;
  position_id?: number | null;
}

function validateAudience(input: {
  audience_type: AudienceType;
  department_id?: number | null;
  position_id?: number | null;
}) {
  if (input.audience_type === "SPECIFIC_DEPARTMENT" && !input.department_id) {
    throw new Error("department_id is required for SPECIFIC_DEPARTMENT");
  }
  if (input.audience_type === "SPECIFIC_POSITION" && !input.position_id) {
    throw new Error("position_id is required for SPECIFIC_POSITION");
  }
}

async function createAnnouncement(input: CreateAnnouncementInput) {
  validateAudience(input);
  return prisma.announcement.create({
    data: {
      title: input.title,
      content: input.content,
      audience_type: input.audience_type,
      department_id: input.department_id ?? null,
      position_id: input.position_id ?? null,
      branch_id: resolveBranchIdOrDefaultSync(input.branch_id),
      created_by: input.created_by,
      status: "DRAFT",
    },
  });
}

// resolveBranchIdOrDefault is async in branchService; wrap for create
async function resolveBranchIdOrDefaultSync(value?: number | null) {
  return resolveBranchIdOrDefault(value ?? undefined);
}

async function listAnnouncements(branchId?: number, skip = 0, take = 20) {
  const where = getBranchScopedWhere(branchId);
  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: { department: true, position: true },
      orderBy: { created_at: "desc" },
      skip,
      take,
    }),
    prisma.announcement.count({ where }),
  ]);
  return { data, total };
}

async function getAnnouncement(id: number) {
  return prisma.announcement.findUnique({
    where: { id },
    include: { department: true, position: true },
  });
}

async function updateAnnouncement(id: number, input: UpdateAnnouncementInput) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new Error("Announcement not found");
  // Published: only title/content editable
  const data =
    existing.status === "PUBLISHED"
      ? { title: input.title, content: input.content }
      : input;
  if (existing.status !== "PUBLISHED") {
    validateAudience({
      audience_type: (input.audience_type ?? existing.audience_type) as AudienceType,
      department_id: input.department_id ?? existing.department_id,
      position_id: input.position_id ?? existing.position_id,
    });
  }
  return prisma.announcement.update({ where: { id }, data });
}

async function deleteAnnouncement(id: number) {
  return prisma.announcement.delete({ where: { id } });
}

async function resolveRecipients(a: {
  audience_type: AudienceType;
  department_id: number | null;
  position_id: number | null;
  branch_id: number | null;
}): Promise<number[]> {
  const branchWhere = getBranchScopedWhere(a.branch_id ?? undefined);
  switch (a.audience_type) {
    case "ALL_MEMBERS": {
      const users = await prisma.user.findMany({
        where: { ...branchWhere },
        select: { id: true },
      });
      return users.map((u) => u.id);
    }
    case "MINISTRY_WORKERS": {
      const users = await prisma.user.findMany({
        where: { ...branchWhere, is_user: true },
        select: { id: true },
      });
      return users.map((u) => u.id);
    }
    case "HEADS_OF_DEPARTMENT": {
      const depts = await prisma.department.findMany({
        where: { ...branchWhere, department_head: { not: null } },
        select: { department_head: true },
      });
      return dedupe(depts.map((d) => d.department_head!).filter(Boolean));
    }
    case "SPECIFIC_DEPARTMENT": {
      const rows = await prisma.department_positions.findMany({
        where: { department_id: a.department_id! },
        select: { user_id: true },
      });
      const direct = await prisma.user_departments.findMany({
        where: { department_id: a.department_id! },
        select: { user_id: true },
      });
      return dedupe([
        ...rows.map((r) => r.user_id),
        ...direct.map((r) => r.user_id),
      ].filter(Boolean) as number[]);
    }
    case "SPECIFIC_POSITION": {
      const users = await prisma.user.findMany({
        where: { position_id: a.position_id! },
        select: { id: true },
      });
      const rows = await prisma.department_positions.findMany({
        where: { position_id: a.position_id! },
        select: { user_id: true },
      });
      return dedupe([
        ...users.map((u) => u.id),
        ...rows.map((r) => r.user_id),
      ].filter(Boolean) as number[]);
    }
    default:
      return [];
  }
}

function dedupe(ids: number[]): number[] {
  return Array.from(new Set(ids));
}

async function publishAnnouncement(id: number) {
  const a = await prisma.announcement.findUnique({ where: { id } });
  if (!a) throw new Error("Announcement not found");
  if (a.status === "PUBLISHED") {
    const err: any = new Error("Announcement already published");
    err.statusCode = 409;
    throw err;
  }
  const published = await prisma.announcement.update({
    where: { id },
    data: { status: "PUBLISHED", published_at: new Date() },
  });
  const recipientIds = await resolveRecipients({
    audience_type: a.audience_type as AudienceType,
    department_id: a.department_id,
    position_id: a.position_id,
    branch_id: a.branch_id,
  });
  if (recipientIds.length) {
    await notificationService.createManyInAppNotifications(
      recipientIds.map((uid) => ({
        type: "ANNOUNCEMENT" as any,
        title: a.title,
        body: stripHtml(a.content).slice(0, 140),
        recipientUserId: uid,
        actorUserId: a.created_by,
        entityType: "announcement",
        entityId: a.id,
        actionUrl: "/announcements",
        priority: "MEDIUM" as any,
      }))
    );
  }
  return published;
}

// Member view: announcements published & targeting this user
async function listForUser(userId: number, skip = 0, take = 20) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      is_user: true,
      position_id: true,
      branch_id: true,
    },
  });
  if (!user) return { data: [], total: 0 };
  const deptRows = await prisma.department_positions.findMany({
    where: { user_id: userId },
    select: { department_id: true },
  });
  const userDeptRows = await prisma.user_departments.findMany({
    where: { user_id: userId },
    select: { department_id: true },
  });
  const deptIds = dedupe([
    ...deptRows.map((r) => r.department_id),
    ...userDeptRows.map((r) => r.department_id),
  ].filter(Boolean) as number[]);
  const headedDepts = await prisma.department.findMany({
    where: { department_head: userId },
    select: { id: true },
  });
  const isHead = headedDepts.length > 0;

  const orConditions: any[] = [{ audience_type: "ALL_MEMBERS" }];
  if (user.is_user) orConditions.push({ audience_type: "MINISTRY_WORKERS" });
  if (isHead) orConditions.push({ audience_type: "HEADS_OF_DEPARTMENT" });
  if (deptIds.length)
    orConditions.push({
      audience_type: "SPECIFIC_DEPARTMENT",
      department_id: { in: deptIds },
    });
  if (user.position_id)
    orConditions.push({
      audience_type: "SPECIFIC_POSITION",
      position_id: user.position_id,
    });

  const where = { status: "PUBLISHED" as const, OR: orConditions };
  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: { published_at: "desc" },
      skip,
      take,
    }),
    prisma.announcement.count({ where }),
  ]);
  return { data, total };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export const announcementService = {
  createAnnouncement,
  listAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  resolveRecipients,
  listForUser,
};
```

- [ ] **Step 2: Verify exact names** — before finalizing, confirm against the schema: `user_departments.user_id`/`department_id`, `department_positions.user_id`/`department_id`/`position_id`, `department.department_head`, `user.is_user`/`position_id`/`branch_id`. Also confirm `notificationService.createManyInAppNotifications` input field names (`recipientUserId`, `actorUserId`, `entityType`, `entityId`, `actionUrl`, `type`, `priority`) at `src/modules/notifications/notificationService.ts:76-91,1088`. Adjust the code to match actual names. Also confirm `resolveBranchIdOrDefault` signature (async vs sync) and whether the notification `type`/`priority` accept a new `ANNOUNCEMENT` value or need an enum entry — if the notification `type` is a Prisma enum, add `ANNOUNCEMENT` to it in schema + migration; otherwise pass the string.

- [ ] **Step 3: Typecheck**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit`
Expected: no errors in `announcementService.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/modules/announcements/announcementService.ts
git commit -m "feat(announcements): add service with audience resolution and publish fan-out"
```

---

### Task A3: Controller + routes + module registration + permissions

**Files:**
- Create: `src/modules/announcements/announcementController.ts`
- Create: `src/modules/announcements/announcementRoute.ts`
- Modify: `src/modules/index.ts`
- Modify: `src/routes/appRouter.ts`
- Modify: `src/middleWare/authorization.ts`

- [ ] **Step 1: Controller** — `src/modules/announcements/announcementController.ts`

```ts
import { Request, Response } from "express";
import { announcementService } from "./announcementService";

function branchIdFromReq(req: Request): number | undefined {
  const raw = req.query.branch_id;
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

export const announcementController = {
  async create(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const a = await announcementService.createAnnouncement({
      ...req.body,
      created_by: userId,
      branch_id: req.body.branch_id ?? branchIdFromReq(req),
    });
    res.status(201).json({ message: "Announcement created", data: a });
  },
  async list(req: Request, res: Response) {
    const skip = Number(req.query.skip ?? 0);
    const take = Number(req.query.take ?? 20);
    const result = await announcementService.listAnnouncements(
      branchIdFromReq(req),
      skip,
      take
    );
    res.json({ message: "Announcements", ...result });
  },
  async getOne(req: Request, res: Response) {
    const a = await announcementService.getAnnouncement(Number(req.params.id));
    if (!a) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Announcement", data: a });
  },
  async update(req: Request, res: Response) {
    const a = await announcementService.updateAnnouncement(
      Number(req.params.id),
      req.body
    );
    res.json({ message: "Announcement updated", data: a });
  },
  async remove(req: Request, res: Response) {
    await announcementService.deleteAnnouncement(Number(req.params.id));
    res.json({ message: "Announcement deleted" });
  },
  async publish(req: Request, res: Response) {
    try {
      const a = await announcementService.publishAnnouncement(
        Number(req.params.id)
      );
      res.json({ message: "Announcement published", data: a });
    } catch (e: any) {
      const code = e.statusCode ?? 400;
      res.status(code).json({ message: e.message });
    }
  },
  async mine(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const skip = Number(req.query.skip ?? 0);
    const take = Number(req.query.take ?? 20);
    const result = await announcementService.listForUser(userId, skip, take);
    res.json({ message: "My announcements", ...result });
  },
};
```

- [ ] **Step 2: Permissions** — in `src/middleWare/authorization.ts`
  - Add `Announcements` to `PERMISSION_KEY_ALIASES` (`:10-31`), following the format of siblings (e.g. `Announcements: "Announcements"`).
  - Near `:1604` (alongside `can_view_events` etc.) add:
```ts
can_view_announcements = this.checkPermission(
  "Announcements",
  "view",
  "You do not have permission to view announcements"
);
can_manage_announcements = this.checkPermission(
  "Announcements",
  "manage",
  "You do not have permission to manage announcements"
);
can_delete_announcements = this.checkPermission(
  "Announcements",
  "admin",
  "You do not have permission to delete announcements"
);
```
  (Match the exact declaration style used by the surrounding guards — arrow property vs method.)

- [ ] **Step 3: Route** — `src/modules/announcements/announcementRoute.ts`

```ts
import { Router } from "express";
import { announcementController } from "./announcementController";
import { Permissions } from "../../middleWare/authorization";

const permissions = new Permissions();
const announcementRouter = Router();

announcementRouter.get(
  "/mine",
  [permissions.protect],
  announcementController.mine
);
announcementRouter.get(
  "/",
  [permissions.protect, permissions.can_view_announcements],
  announcementController.list
);
announcementRouter.get(
  "/:id",
  [permissions.protect, permissions.can_view_announcements],
  announcementController.getOne
);
announcementRouter.post(
  "/",
  [permissions.protect, permissions.can_manage_announcements],
  announcementController.create
);
announcementRouter.put(
  "/:id",
  [permissions.protect, permissions.can_manage_announcements],
  announcementController.update
);
announcementRouter.post(
  "/:id/publish",
  [permissions.protect, permissions.can_manage_announcements],
  announcementController.publish
);
announcementRouter.delete(
  "/:id",
  [permissions.protect, permissions.can_delete_announcements],
  announcementController.remove
);

export default announcementRouter;
```
  (Confirm how `Permissions` is instantiated/exported in `authorization.ts` — a class `new Permissions()` vs a singleton — and match sibling route files like `eventRoute.ts:10-56`.)

- [ ] **Step 4: Register** — export from `src/modules/index.ts` (add `export { default as announcementRouter } from "./announcements/announcementRoute";` matching the barrel style) and mount in `src/routes/appRouter.ts` near `:53`: `appRouter.use("/announcements", announcementRouter)` with the correct import.

- [ ] **Step 5: Typecheck + build**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual smoke** (server running, admin token):

```bash
# create draft
curl -sX POST localhost:8080/announcements -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test","content":"<p>hi</p>","audience_type":"ALL_MEMBERS"}'
# publish
curl -sX POST localhost:8080/announcements/1/publish -H "Authorization: Bearer $TOKEN"
# member view
curl -s localhost:8080/announcements/mine -H "Authorization: Bearer $MEMBER_TOKEN"
```
Expected: create 201, publish 200 + notifications created, republish 409, mine returns the published item for a targeted user.

- [ ] **Step 7: Commit**

```bash
git add src/modules/announcements src/modules/index.ts src/routes/appRouter.ts src/middleWare/authorization.ts
git commit -m "feat(announcements): add controller, routes, and permission guards"
```

---

# PHASE B — FRONTEND

### Task B1: Permission domain + API types + methods

**Files:**
- Modify: `src/utils/accessControl.ts`
- Create: `src/utils/api/announcements/interfaces.ts`
- Modify: `src/utils/api/apiFetch.ts`, `apiPost.ts`, `apiPut.ts`, `apiDelete.ts`

- [ ] **Step 1: Add domain** — in `src/utils/accessControl.ts` add `"Announcements"` to `CANONICAL_PERMISSION_DOMAINS` (`:13-34`), matching surrounding entry format. This yields `view_announcements` / `manage_announcements` legacy flags.

- [ ] **Step 2: Types** — `src/utils/api/announcements/interfaces.ts`

```ts
export type AudienceType =
  | "ALL_MEMBERS"
  | "MINISTRY_WORKERS"
  | "HEADS_OF_DEPARTMENT"
  | "SPECIFIC_DEPARTMENT"
  | "SPECIFIC_POSITION";

export type AnnouncementStatus = "DRAFT" | "PUBLISHED";

export interface Announcement {
  id: number;
  title: string;
  content: string;
  audience_type: AudienceType;
  department_id: number | null;
  position_id: number | null;
  status: AnnouncementStatus;
  branch_id: number | null;
  created_by: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  department?: { id: number; name: string } | null;
  position?: { id: number; name: string } | null;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  audience_type: AudienceType;
  department_id?: number | null;
  position_id?: number | null;
}

export type UpdateAnnouncementDto = Partial<CreateAnnouncementDto>;
```

- [ ] **Step 3: API methods** — mirror `createAnnualTheme`/`fetchAnnualTheme` style.
  - `apiFetch.ts` (in `ApiCalls`, near `:685`):
```ts
fetchAnnouncements = async (query?: { branch_id?: number; skip?: number; take?: number }) =>
  this.axios.get("/announcements", { params: query });
fetchAnnouncement = async (id: number) => this.axios.get(`/announcements/${id}`);
fetchMyAnnouncements = async (query?: { skip?: number; take?: number }) =>
  this.axios.get("/announcements/mine", { params: query });
```
    (Match the exact axios accessor + return style used by the surrounding methods in the class — they may return `.then(res => res.data)` or the raw response. Copy the sibling pattern precisely.)
  - `apiPost.ts` (in `ApiCreationCalls`, near `:526`):
```ts
createAnnouncement = async (data: CreateAnnouncementDto) =>
  this.axios.post("/announcements", data);
publishAnnouncement = async (id: number) =>
  this.axios.post(`/announcements/${id}/publish`);
```
  - `apiPut.ts`:
```ts
updateAnnouncement = async (id: number, data: UpdateAnnouncementDto) =>
  this.axios.put(`/announcements/${id}`, data);
```
  - `apiDelete.ts`:
```ts
deleteAnnouncement = async (id: number) => this.axios.delete(`/announcements/${id}`);
```
  Import the DTO types where used. Confirm the axios instance property name (`this.axios` vs `instance`) from the existing methods in each file and match it.

- [ ] **Step 4: Verify**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint`
Expected: no errors/warnings.

- [ ] **Step 5: Commit**

```bash
git add src/utils/accessControl.ts src/utils/api/announcements src/utils/api/apiFetch.ts src/utils/api/apiPost.ts src/utils/api/apiPut.ts src/utils/api/apiDelete.ts
git commit -m "feat(announcements): add permission domain and api layer"
```

---

### Task B2: Admin form (modal)

**Files:**
- Create: `src/pages/HomePage/pages/ChurchCommunication/Components/AnnouncementForm.tsx`

Mirror `Components/AnnualThemeForm.tsx` (Formik + Yup + `usePost` + `FormWrapperNew`). Use `TextEditor` for content, `FormikSelectField` for audience + conditional department/position, `useFetch` for department/position options.

- [ ] **Step 1: Build the form**

```tsx
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { useMemo } from "react";
import FormikInputDiv from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import TextEditor from "@/components/TextEditor";
import FormWrapperNew from "@/Wrappers/FormWrapperNew";
import { usePost } from "@/CustomHooks/usePost";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import type {
  Announcement,
  CreateAnnouncementDto,
} from "@/utils/api/announcements/interfaces";

const AUDIENCE_OPTIONS = [
  { label: "All members", value: "ALL_MEMBERS" },
  { label: "Ministry workers", value: "MINISTRY_WORKERS" },
  { label: "Heads of department", value: "HEADS_OF_DEPARTMENT" },
  { label: "Specific department", value: "SPECIFIC_DEPARTMENT" },
  { label: "Specific position", value: "SPECIFIC_POSITION" },
];

const schema = Yup.object({
  title: Yup.string().required("Title is required"),
  content: Yup.string()
    .test("not-empty", "Content is required", (v) =>
      Boolean(v && v.replace(/<[^>]*>/g, "").trim())
    )
    .required("Content is required"),
  audience_type: Yup.string().required("Audience is required"),
  department_id: Yup.number()
    .nullable()
    .when("audience_type", {
      is: "SPECIFIC_DEPARTMENT",
      then: (s) => s.required("Select a department"),
    }),
  position_id: Yup.number()
    .nullable()
    .when("audience_type", {
      is: "SPECIFIC_POSITION",
      then: (s) => s.required("Select a position"),
    }),
});

interface Props {
  announcement?: Announcement | null;
  onClose: () => void;
  onSaved: () => void;
}

const AnnouncementForm = ({ announcement, onClose, onSaved }: Props) => {
  const isPublished = announcement?.status === "PUBLISHED";
  const { postData: create } = usePost(api.post.createAnnouncement);
  const { postData: publish } = usePost(api.post.publishAnnouncement);
  const { updateData: update } = // use usePut hook per its actual API
    { updateData: api.put.updateAnnouncement };

  const { data: deptData } = useFetch(api.fetch.fetchDepartments);
  const { data: posData } = useFetch(api.fetch.fetchPositions);
  const departmentOptions = useMemo(
    () => mapOptions(deptData),
    [deptData]
  );
  const positionOptions = useMemo(() => mapOptions(posData), [posData]);

  const initial: CreateAnnouncementDto = {
    title: announcement?.title ?? "",
    content: announcement?.content ?? "",
    audience_type: announcement?.audience_type ?? "ALL_MEMBERS",
    department_id: announcement?.department_id ?? null,
    position_id: announcement?.position_id ?? null,
  };

  const save = async (values: CreateAnnouncementDto, publishAfter: boolean) => {
    try {
      let id = announcement?.id;
      if (id) {
        await api.put.updateAnnouncement(id, values);
      } else {
        const res = await create(values);
        id = res?.data?.data?.id ?? res?.data?.id;
      }
      if (publishAfter && id) await publish(id);
      showNotification(
        publishAfter ? "Announcement published" : "Draft saved",
        "success"
      );
      onSaved();
      onClose();
    } catch (e) {
      showNotification("Failed to save announcement", "error");
    }
  };

  return (
    <Formik
      initialValues={initial}
      validationSchema={schema}
      onSubmit={() => {}}
    >
      {({ values, setFieldValue, validateForm, submitForm }) => (
        <Form className="space-y-4">
          <FormWrapperNew>
            <Field
              name="title"
              label="Title"
              placeholder="Announcement title"
              component={FormikInputDiv}
            />
            <Field
              name="audience_type"
              label="Target audience"
              options={AUDIENCE_OPTIONS}
              component={FormikSelectField}
              disabled={isPublished}
            />
            {values.audience_type === "SPECIFIC_DEPARTMENT" && (
              <Field
                name="department_id"
                label="Department"
                options={departmentOptions}
                component={FormikSelectField}
                disabled={isPublished}
              />
            )}
            {values.audience_type === "SPECIFIC_POSITION" && (
              <Field
                name="position_id"
                label="Position"
                options={positionOptions}
                component={FormikSelectField}
                disabled={isPublished}
              />
            )}
          </FormWrapperNew>
          <div>
            <label className="text-sm font-medium">Content</label>
            <TextEditor
              value={values.content}
              onChange={(v: string) => setFieldValue("content", v)}
              placeholder="Write the announcement..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={async () => {
                const errs = await validateForm();
                if (Object.keys(errs).length) return submitForm();
                save(values, false);
              }}
            >
              Save as draft
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                const errs = await validateForm();
                if (Object.keys(errs).length) return submitForm();
                save(values, true);
              }}
            >
              {isPublished ? "Save" : "Save & publish"}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

function mapOptions(data: any) {
  const arr = data?.data ?? data ?? [];
  return (Array.isArray(arr) ? arr : []).map((d: any) => ({
    label: d.name,
    value: d.id,
  }));
}

export default AnnouncementForm;
```

- [ ] **Step 2: Reconcile with real APIs** — confirm and fix: `usePost` return shape (`{ postData }` vs `{ mutate }`) at `src/CustomHooks/usePost.tsx`; `usePut` usage (this plan calls `api.put.updateAnnouncement` directly — swap to the `usePut` hook if that is the codebase norm, per `AnnualThemeForm.tsx`); `FormikSelectField` prop names (`options`/`label`/`disabled`) and whether it takes `{label,value}` options; `TextEditor` props (`value`/`onChange`/`placeholder`) at `src/components/TextEditor.tsx`; `showNotification` signature; the fetch method names for departments/positions in `apiFetch.ts` (e.g. `fetchDepartments`, `fetchPositions` — use the actual names, they may be `fetchAllDepartments` etc.); button class names used elsewhere (replace `btn-secondary`/`btn-primary` with the project's actual button component/classes, e.g. the `Button` component used in `AnnualThemeForm`).

- [ ] **Step 3: Verify**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage/pages/ChurchCommunication/Components/AnnouncementForm.tsx
git commit -m "feat(announcements): add admin create/edit form"
```

---

### Task B3: Admin list page + card + admin route

**Files:**
- Create: `src/pages/HomePage/pages/ChurchCommunication/Components/AnnouncementCard.tsx`
- Create: `src/pages/HomePage/pages/ChurchCommunication/AnnouncementManager.tsx`
- Modify: `src/routes/appRoutes.tsx`

Mirror `AnnualThemeManager.tsx` + `AnnualThemeCard`.

- [ ] **Step 1: Card** — `AnnouncementCard.tsx`

```tsx
import type { Announcement } from "@/utils/api/announcements/interfaces";

interface Props {
  item: Announcement;
  onEdit: (a: Announcement) => void;
  onDelete: (a: Announcement) => void;
}

const AnnouncementCard = ({ item, onEdit, onDelete }: Props) => (
  <div className="flex items-center justify-between rounded-lg border p-4">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-semibold truncate">{item.title}</p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            item.status === "PUBLISHED"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {item.status === "PUBLISHED" ? "Published" : "Draft"}
        </span>
      </div>
      <p className="text-sm text-gray-500">{audienceLabel(item)}</p>
    </div>
    <div className="flex gap-2 shrink-0">
      <button className="text-primary" onClick={() => onEdit(item)}>
        Edit
      </button>
      <button className="text-red-600" onClick={() => onDelete(item)}>
        Delete
      </button>
    </div>
  </div>
);

function audienceLabel(a: Announcement): string {
  switch (a.audience_type) {
    case "ALL_MEMBERS":
      return "All members";
    case "MINISTRY_WORKERS":
      return "Ministry workers";
    case "HEADS_OF_DEPARTMENT":
      return "Heads of department";
    case "SPECIFIC_DEPARTMENT":
      return `Department: ${a.department?.name ?? a.department_id}`;
    case "SPECIFIC_POSITION":
      return `Position: ${a.position?.name ?? a.position_id}`;
    default:
      return "";
  }
}

export default AnnouncementCard;
```

- [ ] **Step 2: Manager page** — `AnnouncementManager.tsx`

```tsx
import { useState } from "react";
import Modal from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { showDeleteDialog } from "@/pages/HomePage/utils/helperFunctions";
import AnnouncementCard from "./Components/AnnouncementCard";
import AnnouncementForm from "./Components/AnnouncementForm";
import type { Announcement } from "@/utils/api/announcements/interfaces";

const AnnouncementManager = () => {
  const { data, refetch } = useFetch(api.fetch.fetchAnnouncements);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const list: Announcement[] = (data as any)?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (a: Announcement) => {
    setEditing(a);
    setOpen(true);
  };
  const remove = (a: Announcement) =>
    showDeleteDialog(a.id, async () => {
      await api.delete.deleteAnnouncement(a.id);
      refetch();
    });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <button className="btn-primary" onClick={openCreate}>
          Create announcement
        </button>
      </div>
      {list.length === 0 ? (
        <p className="text-gray-500">
          No announcements yet. Create your first one.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <AnnouncementCard
              key={a.id}
              item={a}
              onEdit={openEdit}
              onDelete={remove}
            />
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="p-6 w-[min(90vw,640px)]">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? "Edit announcement" : "New announcement"}
          </h2>
          <AnnouncementForm
            announcement={editing}
            onClose={() => setOpen(false)}
            onSaved={refetch}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AnnouncementManager;
```

- [ ] **Step 3: Reconcile** — confirm `Modal` prop names (`open`/`onClose`) at `src/components/Modal.tsx:12`; `showDeleteDialog` signature at `src/pages/HomePage/utils/helperFunctions.ts` (args + callback shape); `useFetch` return (`{data, refetch}`); the response envelope for `fetchAnnouncements` (`data.data` vs `data.data.data`) — match how `AnnualThemeManager` unwraps; replace `btn-primary`/`text-primary` with the actual `Button` component + `EmptyState` used in `AnnualThemeManager.tsx:89`.

- [ ] **Step 4: Admin route** — in `src/routes/appRoutes.tsx`, add a child in the Communication `children` array (`:500-524`), sibling of `theme-manager`:

```tsx
{
  path: "announcements",
  name: "Announcement",
  element: <AnnouncementManager />,
  isPrivate: true,
  permissionNeeded: "view_announcements",
  sideTab: true,
},
```
  Add the import at the top with the other page imports. (Match the exact object shape of the neighboring `theme-manager` child, including any `errorElement`/casing conventions.)

- [ ] **Step 5: Verify**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint`
Expected: clean. Manually: Communication sidenav shows "Announcement" child; page lists + create modal opens.

- [ ] **Step 6: Commit**

```bash
git add src/pages/HomePage/pages/ChurchCommunication src/routes/appRoutes.tsx
git commit -m "feat(announcements): add admin manager page, card, and route"
```

---

### Task B4: Member view modal, member page, dashboard widget, member route

**Files:**
- Create: `src/pages/HomePage/pages/Announcements/Components/AnnouncementViewModal.tsx`
- Create: `src/pages/HomePage/pages/Announcements/MemberAnnouncementsPage.tsx`
- Modify: `src/pages/HomePage/pages/DashBoard/Components/ChurchAnnouncements.tsx`
- Modify: `src/routes/appRoutes.tsx`

- [ ] **Step 1: Shared view modal** — `AnnouncementViewModal.tsx`

```tsx
import DOMPurify from "dompurify";
import Modal from "@/components/Modal";
import type { Announcement } from "@/utils/api/announcements/interfaces";

interface Props {
  announcement: Announcement | null;
  onClose: () => void;
}

const AnnouncementViewModal = ({ announcement, onClose }: Props) => (
  <Modal open={Boolean(announcement)} onClose={onClose}>
    <div className="p-6 w-[min(90vw,600px)] max-h-[80vh] overflow-auto">
      <h2 className="text-lg font-semibold mb-3">{announcement?.title}</h2>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(announcement?.content ?? ""),
        }}
      />
    </div>
  </Modal>
);

export default AnnouncementViewModal;
```

- [ ] **Step 2: Member page** — `MemberAnnouncementsPage.tsx`

```tsx
import { useState } from "react";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import AnnouncementViewModal from "./Components/AnnouncementViewModal";
import type { Announcement } from "@/utils/api/announcements/interfaces";

const MemberAnnouncementsPage = () => {
  const { data } = useFetch(api.fetch.fetchMyAnnouncements);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const list: Announcement[] = (data as any)?.data ?? [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Announcements</h1>
      {list.length === 0 ? (
        <p className="text-gray-500">No announcements.</p>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="w-full text-left rounded-lg border p-4 hover:bg-gray-50"
            >
              <p className="font-semibold">{a.title}</p>
              <p className="text-xs text-gray-500">
                {a.published_at
                  ? new Date(a.published_at).toLocaleDateString()
                  : ""}
              </p>
            </button>
          ))}
        </div>
      )}
      <AnnouncementViewModal
        announcement={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default MemberAnnouncementsPage;
```
  (`new Date(...)` in render is fine in app code — only workflow scripts forbid it.)

- [ ] **Step 3: Dashboard widget** — replace body of `ChurchAnnouncements.tsx` with real data (keep the existing exported component name + its container styling):

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import AnnouncementViewModal from "@/pages/HomePage/pages/Announcements/Components/AnnouncementViewModal";
import type { Announcement } from "@/utils/api/announcements/interfaces";

const ChurchAnnouncements = () => {
  const { data } = useFetch(api.fetch.fetchMyAnnouncements);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const list: Announcement[] = ((data as any)?.data ?? []).slice(0, 5);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Announcements</h3>
        <Link to="/announcements" className="text-sm text-primary">
          See all
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-gray-500">No announcements yet</p>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.id}>
              <button
                className="text-left w-full hover:underline"
                onClick={() => setSelected(a)}
              >
                {a.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      <AnnouncementViewModal
        announcement={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default ChurchAnnouncements;
```
  (Confirm the current export style of `ChurchAnnouncements.tsx` and the member-side route base path for the "See all" link + notification `actionUrl` — align both to the real member route path from Step 4. Confirm `dompurify` is already a dependency per CLAUDE.md — it is.)

- [ ] **Step 4: Member route** — in `src/routes/appRoutes.tsx` register a member-accessible route `announcements` rendering `<MemberAnnouncementsPage />`, mirroring how the member notification-center route is registered (`:1194-1196`). Ensure the path matches the widget `Link to` and the backend `actionUrl` (`/announcements` under the member shell). Add the import.

- [ ] **Step 5: Verify**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint`
Expected: clean. Manually: publish an announcement as admin targeting the logged-in member → it appears in the widget + member page, click opens modal with sanitized content, and a bell notification arrives.

- [ ] **Step 6: Commit**

```bash
git add src/pages/HomePage/pages/Announcements src/pages/HomePage/pages/DashBoard/Components/ChurchAnnouncements.tsx src/routes/appRoutes.tsx
git commit -m "feat(announcements): add member page, view modal, and dashboard widget"
```

---

## End-to-end verification

- [ ] Backend: `npx tsc --noEmit` clean; migration applied; each audience type resolves expected recipients against seed data (spot-check ALL_MEMBERS, MINISTRY_WORKERS, SPECIFIC_DEPARTMENT).
- [ ] Frontend: `npx tsc --noEmit` + `npm run lint` clean.
- [ ] Manual flow: admin creates draft → edits → publishes → member (targeted) gets bell notification + sees it in widget and page → clicking shows title + content → non-targeted member does not see it.
- [ ] Permissions: user without `manage_announcements` cannot see Create/edit; user without `view_announcements` cannot see the admin child route; any authenticated member can load `/announcements/mine`.

## Notes for the implementing agent

Every code block above is a **starting point matched to the explored patterns**, not guaranteed-final. Each task has a "Reconcile" step: before committing, open the named sibling files and align exact names (hook return shapes, component prop names, axios accessor, response envelopes, button/EmptyState components, permission-guard declaration style). Prefer copying the sibling pattern over the illustrative code here where they differ.
