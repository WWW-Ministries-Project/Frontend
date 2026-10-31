# Visitor Management Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix visitor-form title/phone consistency, make the event-attended picker date-driven + searchable, add configurable monthly follow-up auto-generation, and give assigned members a mobile screen to manage their visitors.

**Architecture:** Changes span three repos. Backend (Express + Prisma/MySQL) ships additive endpoints + a new singleton settings model + a monthly cron. Frontend (Vite + React + Zustand) unifies shared form components and rebuilds the event picker and adds a Settings section. Mobile (Expo/React Native, `features/` layout) adds a `visitors` feature under the More menu.

**Tech Stack:** TypeScript throughout. Prisma, node-cron, Formik/Yup, Tailwind, TanStack Query (mobile).

**NO TEST RUNNER exists in any repo** (per each repo's CLAUDE.md — do not add one). Verification per repo is static + manual:
- Frontend: `npm --prefix /Users/akwaah/GitHub/Frontend run lint` (fails on any warning) **and** `npx --prefix /Users/akwaah/GitHub/Frontend tsc --noEmit` (run from the repo dir).
- Backend: `cd /Users/akwaah/GitHub/Backend && npx tsc --noEmit`.
- Mobile: `cd /Users/akwaah/GitHub/wwm-mobile && npx tsc --noEmit`.
Manual verification steps are called out per task.

**Line numbers below are anchors from the spec's code map and WILL drift. Re-grep/read the current file before each edit.**

---

## Branches (one per repo — hard boundary, never cross-stage)

- **Frontend:** `feat/visitor-management-improvements` (already cut off `development`; holds the spec + this plan). Items 1, 2-FE, 3-FE. PR → `development`.
- **Backend:** cut fresh `feat/visitor-management-improvements` off `main`. Items 2-BE, 3-BE, 4-BE. PR → `main`. (CI runs `prisma migrate deploy` on merge → dev DB immediately.)
- **Mobile:** cut `codex/my-visitors` off `dev`. Item 4-Mobile. PR → `dev`.

**Deploy order:** Backend merges & deploys first → then Frontend → then Mobile (mobile depends on backend member endpoints; additive only).

---

## File Structure

### Backend (`/Users/akwaah/GitHub/Backend`)
- Modify `src/modules/events/eventContoller.ts` — `listEventsLight` gains `from`/`to`/`q`.
- Modify `prisma/schema.prisma` — add `visitor_follow_up_settings` model; add relation field on `visitor`/`follow_up` only if needed (no FK added — assignment stays `responsibleMembers`/`assignedTo`).
- New migration under `prisma/migrations/`.
- New `src/modules/settings/visitorFollowUpSettingsService.ts` + `visitorFollowUpSettingsController.ts`; wire into `src/modules/settings/route.ts`.
- New `src/cron-jobs/visitorFollowUpGenerationCron.ts`; register in `index.ts`.
- New helper to resolve `Visitors:manage` → user ids: add `listUserIdsWithVisitorManageAccess` to `src/modules/notifications/notificationService.ts` (or a small access util it imports).
- New member-facing controller methods + service fns in `src/modules/visitorManagement/` (`visitorController.ts`/`visitService` or a new `memberVisitorController.ts`) + routes in `visitorRoute.ts`.

### Frontend (`/Users/akwaah/GitHub/Frontend`)
- New `src/components/subform/titleOptions.ts` (shared TITLE_OPTIONS).
- New `src/components/subform/PhoneField.tsx` (relocated shared phone input).
- Modify `src/components/subform/NameInfo.tsx`, `src/components/subform/ContactsSubForm.tsx`, `src/components/ContactInput.tsx` (retire/redirect), member `memberFormOptions.ts` + `formFields.tsx` (re-export).
- Modify `src/pages/HomePage/pages/VisitorManagement/Components/VisitorForm.tsx` — rebuild `EventSelectionFields`.
- Modify `src/utils/api/apiFetch.ts` — `fetchEventOptions` gains `from`/`to`/`q`.
- New `src/pages/HomePage/pages/Settings/visitorFollowUps/VisitorFollowUpsSettings.tsx` + API fn (`src/utils/api/settings/…` or existing settings api file) + lazy entry + route.

### Mobile (`/Users/akwaah/GitHub/wwm-mobile`)
- New `src/features/visitors/` (`api.ts`, `queryKeys.ts`, `types.ts`, `hooks.ts`, `screens/MyVisitorsScreen.tsx`, `index.ts`).
- Modify `src/shared/api/index.ts`, `src/navigation/index.tsx`, `src/features/more/screens/MoreScreen.tsx`.

---

# PHASE 1 — Item 1: Title + phone consistency (Frontend only)

Branch: `feat/visitor-management-improvements`. **Finding:** the two title lists are already byte-identical (same 20 values, same order); the real divergence is (a) two copies of the list (DRY) and (b) two different phone components — visitor uses `ContactInput` (custom click-dropdown, `src/components/ContactInput.tsx`), member uses `PhoneField` (SelectInput-based, `formFields.tsx:231`). Canonical = member's.

### Task 1.1: Shared title options

**Files:**
- Create: `src/components/subform/titleOptions.ts`
- Modify: `src/components/subform/NameInfo.tsx` (remove local `titleOptions`, import shared)
- Modify: `src/pages/HomePage/pages/Members/Components/form/memberFormOptions.ts:7-28` (re-export shared instead of redefining)

- [ ] **Step 1: Create the shared constant.**

```ts
// src/components/subform/titleOptions.ts
export interface TitleOption {
  label: string;
  value: string;
}

// Single source of truth for the person-title dropdown used by the member form,
// the visitor form, and any other name subform. Values are unchanged from the
// two previous copies (NameInfo.titleOptions and members' TITLE_OPTIONS) so no
// saved payload changes.
export const TITLE_OPTIONS: TitleOption[] = [
  "Mr", "Mrs", "Miss", "Ms", "Dr", "Prof", "Pastor", "Apostle", "Prophet",
  "Evangelist", "Teacher", "Bishop", "Rev", "Elder", "Deacon", "Deaconess",
  "Minister", "Hon", "Sir", "Lady",
].map((value) => ({ value, label: value }));
```

- [ ] **Step 2: Point `NameInfo` at it.** In `src/components/subform/NameInfo.tsx`: delete the local `titleOptions` array (currently `:56-77`), add `import { TITLE_OPTIONS } from "./titleOptions";`, and change the Title `<Field>` prop `options={titleOptions}` → `options={TITLE_OPTIONS}` (`:25`).

- [ ] **Step 3: Re-export from member options.** In `memberFormOptions.ts`, replace the `TITLE_OPTIONS = toOptions([...])` block (`:7-28`) with:

```ts
export { TITLE_OPTIONS } from "@/components/subform/titleOptions";
```
Leave `GENDER_OPTIONS`, `MARITAL_OPTIONS`, etc. unchanged. If `toOptions` is now unused elsewhere in the file, keep it (other option lists use it) — do not remove used code.

- [ ] **Step 4: Verify.** `npx tsc --noEmit` from the Frontend dir → PASS. `npm run lint` → 0 warnings. Grep for any other title list: `grep -rniE "titleoptions|\"Mr\".*\"Mrs\"" src | grep -v titleOptions.ts` — if another inline copy exists, redirect it to the shared import too.

- [ ] **Step 5: Commit.**
```bash
git -C /Users/akwaah/GitHub/Frontend add -A
git -C /Users/akwaah/GitHub/Frontend commit -m "refactor(forms): single shared TITLE_OPTIONS for member + visitor forms"
```

### Task 1.2: Shared phone component (visitor adopts member's PhoneField)

**Files:**
- Create: `src/components/subform/PhoneField.tsx` (moved from `formFields.tsx`)
- Modify: `src/pages/HomePage/pages/Members/Components/form/formFields.tsx` (re-export from new location)
- Modify: `src/components/subform/ContactsSubForm.tsx:19-23` (use `PhoneField` instead of `ContactInput`)
- Modify: `src/components/ContactInput.tsx` (retire or keep as thin re-export — see step 4)

- [ ] **Step 1: Read current `formFields.tsx` imports** (top of file) to learn where `PhoneField`'s deps come from: `useCountries`, `useField`, `useFieldError`, `SelectInput`, `TextInput`, `CountryCode`, `parsePhoneNumberFromString`, `SelectOption`, `useMemo`. Copy the exact import lines.

- [ ] **Step 2: Create `src/components/subform/PhoneField.tsx`** by moving the `PhoneField` component (currently `formFields.tsx:231-314`) verbatim, plus `OtherNumberField` (`:320-350+`) if the visitor form or others need a secondary number. Add the imports gathered in Step 1, rewritten to absolute `@/` paths so they resolve from the new location. The component body is unchanged (it already binds `${prefix}.phone.country_code` / `${prefix}.phone.number`, defaults `+233`/GH, validates with libphonenumber).

- [ ] **Step 3: Re-export from `formFields.tsx`** so the member form keeps working without touching its call sites:
```ts
export { PhoneField, OtherNumberField } from "@/components/subform/PhoneField";
```
Remove the moved component definitions from `formFields.tsx`. Keep every other export intact.

- [ ] **Step 4: Switch the visitor contact subform to `PhoneField`.** In `src/components/subform/ContactsSubForm.tsx`, replace the `<ContactInput prefix=... />` usage (`:19-23`) with `<PhoneField prefix={prefix} label="Phone Number" disabled={disabled} />` (import from `./PhoneField`). `ContactInput` and `PhoneField` bind the same field names, so initial values and payload are unchanged.
  - Then search the whole app for remaining `ContactInput` consumers: `grep -rn "ContactInput" src`. For each, swap to `PhoneField` (same props: `prefix`, `label`, `disabled`). Once no consumers remain, either delete `src/components/ContactInput.tsx` or replace its body with `export { PhoneField as ContactInput } from "@/components/subform/PhoneField";` **only if** something imports the `ContactInput.initialValues`/`validationSchema` statics — grep `ContactInput.initialValues` / `ContactInput.validationSchema`; if used, keep an object-assigned compatibility export, else delete the file.

- [ ] **Step 5: Verify.** `npx tsc --noEmit` → PASS. `npm run lint` → 0 warnings. **Manual:** `npm run dev`, open the visitor create form and the member create form side by side; confirm the phone country-code picker is now the same SelectInput control in both, default `+233`, and the title dropdown shows the same 20 options.

- [ ] **Step 6: Commit.**
```bash
git -C /Users/akwaah/GitHub/Frontend add -A
git -C /Users/akwaah/GitHub/Frontend commit -m "refactor(forms): unify phone input on shared PhoneField across visitor + member forms"
```

---

# PHASE 2 — Item 2: Date-driven + searchable event picker

### Task 2.1 (Backend): add `from`/`to`/`q` to `list-events-light`

Branch: Backend `feat/visitor-management-improvements` (cut off `main` first).

**Files:** Modify `src/modules/events/eventContoller.ts` (`listEventsLight` `:2047`, `resolveLightEventDateRange` `:564`).

- [ ] **Step 1: Cut the backend branch.**
```bash
git -C /Users/akwaah/GitHub/Backend fetch origin main --quiet
git -C /Users/akwaah/GitHub/Backend checkout -b feat/visitor-management-improvements origin/main
```

- [ ] **Step 2: Extend the date-range resolver (additive).** In `listEventsLight`, read the new params and prefer an explicit `from`/`to` range over the month/year logic. After the existing `const { month, year, event_type, event_status }: any = req.query;` line, add:

```ts
const { from, to, q }: any = req.query;

// Explicit ISO date range takes priority over month/year (new, date-driven
// picker sends from/to); month/year still work for legacy/mobile callers.
const parseDay = (v: unknown, end = false): Date | undefined => {
  if (!v) return undefined;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return undefined;
  if (end) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
};
const fromDate = parseDay(from);
const toDate = parseDay(to, true);
const explicitRange =
  fromDate || toDate
    ? { gte: fromDate ?? undefined, lte: toDate ?? undefined }
    : null;
```

Then change the `start_date` assignment in `whereClause` from `start_date: startDateRange,` to:
```ts
start_date: explicitRange ?? startDateRange,
```

- [ ] **Step 3: Add name search `q`.** The event name lives on the related `event_act` via `event_name_id` (see `event_mgt` `schema.prisma:686`). Add to `whereClause` (only when `q` is a non-empty string):
```ts
...(typeof q === "string" && q.trim()
  ? {
      name: {
        name: { contains: q.trim() },
      },
    }
  : {}),
```
Confirm the relation field name on `event_mgt` that points to `event_act` (read the model around `schema.prisma:686`; it may be `name`/`event_name`/`event_act`). Use the actual relation field + its searchable string column. If MySQL collation is case-insensitive (default `utf8mb4_*_ci`), `contains` is already case-insensitive — do not pass Prisma `mode:"insensitive"` (unsupported on MySQL).

- [ ] **Step 4: Verify.** `npx tsc --noEmit` → PASS. **Manual (if a local DB is up):** `GET /event/list-events-light?from=2026-09-01&to=2026-09-30` returns only September events; `?q=sunday` filters by name; `?month=9&year=2026` still works.

- [ ] **Step 5: Update the contract doc** if one exists: `grep -rln "list-events-light\|list_events_light" /Users/akwaah/GitHub/Backend/docs /Users/akwaah/GitHub/Frontend/docs` and add the new `from`/`to`/`q` params there.

- [ ] **Step 6: Commit.**
```bash
git -C /Users/akwaah/GitHub/Backend add -A
git -C /Users/akwaah/GitHub/Backend commit -m "feat(events): list-events-light accepts from/to date range and q name search"
```

### Task 2.2 (Frontend): rebuild `EventSelectionFields`

Branch: Frontend `feat/visitor-management-improvements`.

**Files:**
- Modify `src/utils/api/apiFetch.ts:296-300` (`fetchEventOptions`)
- Modify `src/pages/HomePage/pages/VisitorManagement/Components/VisitorForm.tsx` (`EventSelectionFields` `:121-249`, keep `SyncEventDate` `:101-118`, visit date field `:427-434`)

- [ ] **Step 1: Extend the API fn.** Read `fetchEventOptions` (`apiFetch.ts:296-300`). It currently passes `month`/`year`/`includeEventId`. Add optional `from`, `to`, `q` to its query param object (pass through as given). Keep `includeEventId`. Keep `month`/`year` optional so nothing else that calls it breaks — grep `fetchEventOptions` for other callers first.

- [ ] **Step 2: Compute the week window from visit date.** In `VisitorForm.tsx`, add a helper near the other date helpers (`:62-89`):
```ts
// Monday–Sunday ISO week bounds for a yyyy-mm-dd string.
const weekBounds = (isoDate: string): { from: string; to: string } | null => {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x: Date) => x.toISOString().split("T")[0];
  return { from: fmt(monday), to: fmt(sunday) };
};
```

- [ ] **Step 3: Replace month/year selects with date-driven + search.** In `EventSelectionFields` (`:121-249`):
  - Remove the `eventFilterMonth`/`eventFilterYear` state and the two `<select>` blocks (`:212-231`) and their option builders if now unused (`monthOptions` `:62-67`, `createYearOptions` `:78-89`, `getCurrentMonthYear` `:69-76` — remove only if nothing else references them; grep first).
  - Add a debounced search term state:
```ts
const [eventSearch, setEventSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");
useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(eventSearch.trim()), 300);
  return () => clearTimeout(t);
}, [eventSearch]);
```
  - Read the current visit date from Formik (`useFormikContext`, field `visit.date`). Build the query so a search term searches all dates, otherwise the week of the visit date is shown; always keep the selected event visible:
```ts
const { values } = useFormikContext<VisitorType>(); // use the form's actual type
const visitDate = (values as any)?.visit?.date ?? "";
const selectedEventId = (values as any)?.visit?.eventId;
const week = weekBounds(visitDate);
const eventQuery = useMemo(
  () => ({
    ...(debouncedSearch
      ? { q: debouncedSearch }
      : week
      ? { from: week.from, to: week.to }
      : {}),
    ...(selectedEventId ? { includeEventId: selectedEventId } : {}),
  }),
  [debouncedSearch, week?.from, week?.to, selectedEventId]
);
```
  - Keep `useFetch(api.fetch.fetchEventOptions, eventQuery)` and `mapEventOptions` (`:94-98,146-158`).
  - Render a text input bound to `eventSearch` ("Search events by name") above the event `<Field>` (`:234-245`), and keep that `FormikSelectField` for `visit.eventId`.
  - Add helper text: when no search and a visit date is set, show "Showing events for the week of {visitDate}. Type to search all events."

- [ ] **Step 4: Keep both-way sync.** Leave `SyncEventDate` (`:101-118`) mounted — selecting an event still autofills `visit.date`. Now the reverse also holds: changing `visit.date` re-filters the event list via `eventQuery`. The spec rule "event wins on conflict" is already satisfied because `SyncEventDate` overwrites the date when an event is picked.

- [ ] **Step 5: Verify.** `npx tsc --noEmit` → PASS. `npm run lint` → 0 warnings. **Manual:** `npm run dev`, open visitor form: pick a visit date in a past month → event dropdown lists that week's events (prev-month reachable without any month selector); type a name → finds events across any date; pick an event → visit date snaps to the event's date.

- [ ] **Step 6: Commit.**
```bash
git -C /Users/akwaah/GitHub/Frontend add -A
git -C /Users/akwaah/GitHub/Frontend commit -m "feat(visitors): date-driven + searchable event-attended picker"
```

---

# PHASE 3 — Item 3: Monthly follow-up config + auto-generation

### Task 3.1 (Backend): `visitor_follow_up_settings` model + migration

Branch: Backend `feat/visitor-management-improvements`.

**Files:** Modify `prisma/schema.prisma`; new migration.

- [ ] **Step 1: Add the model** near the other singleton settings (e.g. after `attendance_timing_settings` `:278`):
```prisma
model visitor_follow_up_settings {
  id                   Int      @id @default(1)
  follow_ups_per_month Int      @default(2)
  enabled              Boolean  @default(false)
  updated_at           DateTime @updatedAt
  updated_by_user_id   Int?
  updated_by           user?    @relation("visitor_follow_up_settings_updated_by", fields: [updated_by_user_id], references: [id])
}
```
Add the back-relation on `model user`: `visitor_follow_up_settings visitor_follow_up_settings[] @relation("visitor_follow_up_settings_updated_by")` (match how `attendance_timing_settings.updated_by` is wired on `user` — read that relation and mirror its naming).

- [ ] **Step 2: Create the migration.**
```bash
cd /Users/akwaah/GitHub/Backend
npx prisma migrate dev --name add_visitor_follow_up_settings --create-only
```
Review the generated SQL (one `CREATE TABLE`, one FK). Do **not** run `migrate deploy` locally against a shared DB. Then regenerate client: `npx prisma generate`.

- [ ] **Step 3: Verify.** `npx tsc --noEmit` → PASS (confirms the generated client has `prisma.visitor_follow_up_settings`).

- [ ] **Step 4: Commit.**
```bash
git -C /Users/akwaah/GitHub/Backend add -A
git -C /Users/akwaah/GitHub/Backend commit -m "feat(db): add visitor_follow_up_settings singleton"
```

### Task 3.2 (Backend): settings service + controller + routes

**Files:** New `src/modules/settings/visitorFollowUpSettingsService.ts`, `visitorFollowUpSettingsController.ts`; modify `src/modules/settings/route.ts`.

- [ ] **Step 1: Service** (mirror `attendanceTimingSettingsService.ts` structure — singleton id=1, get + upsert):
```ts
// src/modules/settings/visitorFollowUpSettingsService.ts
import { prisma } from "../../Models/context";
import { InputValidationError } from "../../utils/custom-error-handlers";

const SETTINGS_ID = 1;
const MAX_PER_MONTH = 31;

export type VisitorFollowUpSettingsResponse = {
  follow_ups_per_month: number;
  enabled: boolean;
  updated_at: string | null;
  updated_by: { id: number; name: string } | null;
};

const mapRow = (row: any): VisitorFollowUpSettingsResponse => ({
  follow_ups_per_month: row?.follow_ups_per_month ?? 2,
  enabled: row?.enabled ?? false,
  updated_at: row?.updated_at ? row.updated_at.toISOString() : null,
  updated_by: row?.updated_by ?? null,
});

const normalizeCount = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > MAX_PER_MONTH) {
    throw new InputValidationError(
      `follow_ups_per_month must be a whole number between 1 and ${MAX_PER_MONTH}`,
    );
  }
  return n;
};

const normalizeEnabled = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

export class VisitorFollowUpSettingsService {
  async getConfig(): Promise<VisitorFollowUpSettingsResponse> {
    const row = await prisma.visitor_follow_up_settings.findUnique({
      where: { id: SETTINGS_ID },
      select: {
        follow_ups_per_month: true,
        enabled: true,
        updated_at: true,
        updated_by: { select: { id: true, name: true } },
      },
    });
    return mapRow(row);
  }

  async upsertConfig(payload: unknown, updatedByUserId: number) {
    const record =
      payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const data = {
      follow_ups_per_month: normalizeCount(record.follow_ups_per_month),
      enabled: normalizeEnabled(record.enabled),
      updated_by_user_id: updatedByUserId,
    };
    await prisma.visitor_follow_up_settings.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data },
    });
    return this.getConfig();
  }
}

export const visitorFollowUpSettingsService = new VisitorFollowUpSettingsService();
```

- [ ] **Step 2: Controller** (mirror `attendanceTimingSettingsController` — read it for the exact shape of how it reads the user id and shapes responses):
```ts
// src/modules/settings/visitorFollowUpSettingsController.ts
import { Request, Response } from "express";
import { visitorFollowUpSettingsService } from "./visitorFollowUpSettingsService";
import { InputValidationError } from "../../utils/custom-error-handlers";

const getUserId = (req: Request) => Number((req as any)?.user?.id) || 0;

export default {
  getConfig: async (_req: Request, res: Response) => {
    const data = await visitorFollowUpSettingsService.getConfig();
    res.status(200).json({ message: "Operation successful", data });
  },
  upsertConfig: async (req: Request, res: Response) => {
    try {
      const data = await visitorFollowUpSettingsService.upsertConfig(
        req.body,
        getUserId(req),
      );
      res.status(200).json({ message: "Operation successful", data });
    } catch (error: any) {
      if (error instanceof InputValidationError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to save config", error: error.message });
    }
  },
};
```

- [ ] **Step 3: Routes.** In `src/modules/settings/route.ts`, import the controller and add (gate reads with `permissions.can_view_settings`, writes with `requireOrgWide(CONFIGURE_GENERAL, …)` — matching the role-eligibility/system-notification routes):
```ts
import visitorFollowUpSettingsController from "./visitorFollowUpSettingsController";
// ...
settingsRouter.get(
  "/visitor-follow-up-config",
  [protect, permissions.can_view_settings],
  visitorFollowUpSettingsController.getConfig,
);
settingsRouter.post(
  "/upsert-visitor-follow-up-config",
  requireOrgWide(CONFIGURE_GENERAL, "Not authorized to change general configuration"),
  visitorFollowUpSettingsController.upsertConfig,
);
```

- [ ] **Step 4: Verify.** `npx tsc --noEmit` → PASS.

- [ ] **Step 5: Commit.**
```bash
git -C /Users/akwaah/GitHub/Backend add -A
git -C /Users/akwaah/GitHub/Backend commit -m "feat(settings): visitor follow-up config get/upsert endpoints"
```

### Task 3.3 (Backend): manage-visitors recipient resolver

**Files:** Modify `src/modules/notifications/notificationService.ts` (add helper near `listAdminUserIds` `:1318`).

- [ ] **Step 1: Read** `listAdminUserIds` (`notificationService.ts:1318`) and `SETTINGS_PERMISSION_KEYS`/the permission-key matching at `:403-408` to reuse the exact access-table query shape. The visitor domain keys are `["Visitors","Members"]` (from `authorization.ts:19`). Add:
```ts
// Users who can act on visitors (Visitors:manage, aliased to Members).
// Used to notify managers about unassigned visitors needing follow-ups.
async function listUserIdsWithVisitorManageAccess(): Promise<number[]> {
  // Mirror listAdminUserIds' query, but match permission keys ["Visitors","Members"]
  // with a manage/admin action. Keep it a single query over the access tables;
  // de-dupe ids before returning.
  // ...implement against the same tables listAdminUserIds reads...
}
```
Expose it on the exported `notificationService` object (`:1407-1423`). **Implement the body by copying `listAdminUserIds`'s actual query** (read it — do not guess table/column names) and swapping the permission-key set to `["Visitors","Members"]` with action manage/admin.

- [ ] **Step 2: Verify.** `npx tsc --noEmit` → PASS.

- [ ] **Step 3: Commit.**
```bash
git -C /Users/akwaah/GitHub/Backend add -A
git -C /Users/akwaah/GitHub/Backend commit -m "feat(notifications): resolver for users with manage-visitors access"
```

### Task 3.4 (Backend): monthly generation cron

**Files:** New `src/cron-jobs/visitorFollowUpGenerationCron.ts`; modify `index.ts:26-45`.

- [ ] **Step 1: Read `src/cron-jobs/followUpNotificationCron.ts`** end to end — copy its conventions: re-entrancy guard bool, env-config reads with clamped defaults, cursor pagination, `notificationService.createManyInAppNotifications`, `notifyAdminsJobFailed` on error, the `cron.validate()`/`cron.schedule()` loop, and how `responsibleMembers` is parsed (also check `visitorAccess.ts` for the existing parse helper and reuse it).

- [ ] **Step 2: Write the generation job.** Behaviour: if config `enabled` is false → return immediately. Else, for the current month, cursor-paginate visitors; for each with ≥1 responsible member, create N `follow_up` rows (`status:"pending"`, dates spread across the month, `assignedTo` round-robin over the visitor's responsible members), idempotent via dedupe. Collect visitors with no responsible member; after the pass, notify each manage-visitors user once with a digest count.

```ts
// src/cron-jobs/visitorFollowUpGenerationCron.ts
import cron from "node-cron";
import { prisma } from "../Models/context";
import { notificationService } from "../modules/notifications/notificationService";
import { visitorFollowUpSettingsService } from "../modules/settings/visitorFollowUpSettingsService";

let isRunning = false;

const QUERY_BATCH = 250;

// Reuse the existing responsibleMembers parser if one is exported; otherwise:
const parseResponsibleIds = (raw: unknown): number[] => {
  if (!raw) return [];
  try {
    const arr = JSON.parse(String(raw));
    return Array.isArray(arr)
      ? arr.map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
  } catch {
    return [];
  }
};

// N due dates spread across the given month (UTC), evenly across the days.
const spreadDates = (year: number, month0: number, n: number): Date[] => {
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const step = daysInMonth / (n + 1);
  return Array.from({ length: n }, (_, i) => {
    const day = Math.max(1, Math.min(daysInMonth, Math.round(step * (i + 1))));
    return new Date(Date.UTC(year, month0, day, 9, 0, 0));
  });
};

export async function generateMonthlyFollowUps(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const config = await visitorFollowUpSettingsService.getConfig();
    if (!config.enabled) return;
    const n = config.follow_ups_per_month;

    const now = new Date();
    const year = now.getUTCFullYear();
    const month0 = now.getUTCMonth();
    const monthKey = `${year}-${String(month0 + 1).padStart(2, "0")}`;

    const unassignedVisitorIds: number[] = [];
    let cursor: number | undefined;

    for (;;) {
      const visitors = await prisma.visitor.findMany({
        take: QUERY_BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: "asc" },
        select: { id: true, responsibleMembers: true },
      });
      if (visitors.length === 0) break;
      cursor = visitors[visitors.length - 1].id;

      for (const v of visitors) {
        const ids = parseResponsibleIds(v.responsibleMembers);
        if (ids.length === 0) {
          unassignedVisitorIds.push(v.id);
          continue;
        }
        const dates = spreadDates(year, month0, n);
        // Idempotency: skip if this month's rows already exist for this visitor.
        const existing = await prisma.follow_up.count({
          where: {
            visitorId: v.id,
            date: {
              gte: new Date(Date.UTC(year, month0, 1)),
              lt: new Date(Date.UTC(year, month0 + 1, 1)),
            },
            type: "auto_monthly",
          },
        });
        if (existing >= n) continue;

        const toCreate = dates.slice(existing).map((date, i) => ({
          visitorId: v.id,
          assignedTo: ids[(existing + i) % ids.length], // round-robin
          date,
          type: "auto_monthly",
          status: "pending",
          notes: `Auto-generated monthly follow-up (${monthKey})`,
        }));
        if (toCreate.length === 0) continue;

        await prisma.follow_up.createMany({ data: toCreate });

        await notificationService.createManyInAppNotifications(
          toCreate.map((f) => ({
            type: "follow_up.assigned",
            title: "New follow-up assigned",
            body: "A monthly visitor follow-up has been assigned to you.",
            recipientUserId: f.assignedTo as number,
            entityType: "VISITOR_FOLLOW_UP",
            entityId: v.id,
            actionUrl: `/home/visitors/visitor/${v.id}`,
            priority: "MEDIUM",
            dedupeKey: `follow-up-gen:${v.id}:${monthKey}:${f.assignedTo}:${f.date.getUTCDate()}`,
            sendSms: false,
          })),
        );
      }
    }

    if (unassignedVisitorIds.length > 0) {
      const managerIds = await notificationService.listUserIdsWithVisitorManageAccess();
      await notificationService.createManyInAppNotifications(
        managerIds.map((uid) => ({
          type: "follow_up.unassigned_digest",
          title: "Visitors need a responsible member",
          body: `${unassignedVisitorIds.length} visitor(s) have no responsible member for this month's follow-ups.`,
          recipientUserId: uid,
          entityType: "VISITOR",
          actionUrl: `/home/visitors`,
          priority: "MEDIUM",
          dedupeKey: `follow-up-unassigned:${monthKey}:${uid}`,
          sendSms: false,
        })),
      );
    }
  } catch (error) {
    await notificationService.notifyAdminsJobFailed?.({
      jobName: "visitorFollowUpGenerationCron",
      error,
    } as any);
  } finally {
    isRunning = false;
  }
}

const CRON_EXPR = process.env.VISITOR_FOLLOW_UP_GEN_CRON || "0 1 1 * *"; // 01:00 on day 1
if (cron.validate(CRON_EXPR)) {
  cron.schedule(CRON_EXPR, generateMonthlyFollowUps);
}
```
Adjust `notifyAdminsJobFailed`'s argument shape to match its real signature (`notificationService.ts:1351` — read it). Confirm `follow_up.type` is a free string (schema `:1967`) so `"auto_monthly"` is valid.

- [ ] **Step 3: Register the cron.** In `index.ts`, inside the `require()` block (`:26-45`) that runs under `shouldRunBackgroundJobs`, add `require("./src/cron-jobs/visitorFollowUpGenerationCron");` (match the exact require style/path used by its neighbours).

- [ ] **Step 4: Verify.** `npx tsc --noEmit` → PASS. **Manual (optional, local):** temporarily export and call `generateMonthlyFollowUps()` once with `enabled=true` and a seeded visitor → confirm N pending `follow_up` rows with `type="auto_monthly"` and a notification per assignee; run again → no duplicates (idempotent).

- [ ] **Step 5: Commit.**
```bash
git -C /Users/akwaah/GitHub/Backend add -A
git -C /Users/akwaah/GitHub/Backend commit -m "feat(cron): monthly visitor follow-up auto-generation"
```

### Task 3.5 (Frontend): Settings section "Visitor Follow-ups"

Branch: Frontend `feat/visitor-management-improvements`.

**Files:**
- New `src/pages/HomePage/pages/Settings/visitorFollowUps/VisitorFollowUpsSettings.tsx`
- New/append settings API fn (find the file holding other settings GET/POST, e.g. `src/utils/api/settings/…` — grep `attendance-timing-config` under `src/utils/api` to locate the pattern)
- Modify `src/pages/HomePage/pages/Settings/lazyPages.ts:4-8`
- Modify `src/routes/appRoutes.tsx` (settings children `:1296-1352`)

- [ ] **Step 1: API fns.** `grep -rn "attendance-timing-config\|upsert-attendance-timing-config" src/utils/api` to find where settings calls live; add in the same file/pattern:
```ts
export const fetchVisitorFollowUpConfig = () =>
  instance.get("settings/visitor-follow-up-config");
export const upsertVisitorFollowUpConfig = (payload: {
  follow_ups_per_month: number;
  enabled: boolean;
}) => instance.post("settings/upsert-visitor-follow-up-config", payload);
```
(Match the existing module's import of `instance`/`api` and its export convention exactly.)

- [ ] **Step 2: Page component.** Build with the existing settings UI + hooks (`useFetch`, `usePost`, `showNotification`/`notify`). Read a sibling settings page (e.g. `general/GeneralConfiguration.tsx`) for the layout wrapper, then:
```tsx
// src/pages/HomePage/pages/Settings/visitorFollowUps/VisitorFollowUpsSettings.tsx
import { useEffect, useState } from "react";
import useFetch from "@/CustomHooks/useFetch";
import usePost from "@/CustomHooks/usePost";
import { notify } from "@/components/feedback";
import {
  fetchVisitorFollowUpConfig,
  upsertVisitorFollowUpConfig,
} from "@/utils/api/settings"; // use the actual path from Step 1

const VisitorFollowUpsSettings = () => {
  const { data } = useFetch(fetchVisitorFollowUpConfig);
  const { postData, loading } = usePost();
  const [count, setCount] = useState(2);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const cfg = (data as any)?.data;
    if (cfg) {
      setCount(cfg.follow_ups_per_month ?? 2);
      setEnabled(Boolean(cfg.enabled));
    }
  }, [data]);

  const save = async () => {
    await postData(upsertVisitorFollowUpConfig, {
      follow_ups_per_month: count,
      enabled,
    });
    notify.success("Follow-up settings saved");
  };

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Visitor Follow-ups</h2>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Auto-generate monthly follow-ups
      </label>
      <label className="flex flex-col gap-1 max-w-xs">
        <span>Follow-ups expected per visitor each month</span>
        <input
          type="number" min={1} max={31} value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="border border-primary rounded p-2"
        />
      </label>
      <button onClick={save} disabled={loading} className="btn-primary">
        Save
      </button>
    </section>
  );
};

export default VisitorFollowUpsSettings;
```
Match the real `usePost` signature and button/class conventions used by neighbouring settings pages (read one first; adjust `notify`/`showNotification` import to what the codebase uses).

- [ ] **Step 3: Lazy register.** In `lazyPages.ts`:
```ts
export const VisitorFollowUpsSettings = lazy(
  () => import("./visitorFollowUps/VisitorFollowUpsSettings"),
);
```

- [ ] **Step 4: Route.** In `src/routes/appRoutes.tsx`, add a child in the settings `children` array (`:1296-1352`), mirroring the `approvals` child (`:1337-1344`):
```tsx
{
  path: "visitor-follow-ups",
  name: "Visitor Follow-ups",
  element: (
    <Suspense fallback={null}>
      <VisitorFollowUpsSettings />
    </Suspense>
  ),
  isPrivate: true,
  permissionNeeded: "view_settings",
  sideTab: true,
},
```
Import the lazy page at the top where the other settings lazies are imported.

- [ ] **Step 5: Verify.** `npx tsc --noEmit` → PASS. `npm run lint` → 0 warnings. **Manual:** `npm run dev`, Settings → "Visitor Follow-ups" appears as a side tab; set N + toggle, Save → success toast; reload → values persist.

- [ ] **Step 6: Commit.**
```bash
git -C /Users/akwaah/GitHub/Frontend add -A
git -C /Users/akwaah/GitHub/Frontend commit -m "feat(settings): visitor follow-up monthly config UI"
```

---

# PHASE 4 — Item 4: Mobile — member manages assigned visitors

### Task 4.1 (Backend): member-facing endpoints

Branch: Backend `feat/visitor-management-improvements`.

**Files:** New `src/modules/visitorManagement/memberVisitorController.ts` + service fns (add to `visitService`/`followUpService` or a new `memberVisitorService.ts`); modify `visitorRoute.ts`.

- [ ] **Step 1: Service fns** (ownership-scoped, user id from token, never body). Reuse the `responsibleMembers` parser. Add:
  - `getVisitorsForResponsibleUser(userId)` — visitors whose `responsibleMembers` JSON contains `userId`. Since it's a stringified array, prefilter with `responsibleMembers: { contains: String(userId) }` then parse-and-verify in app (the `contains` is a loose prefilter; exact check avoids `12` matching `123`):
```ts
async getVisitorsForResponsibleUser(userId: number) {
  const candidates = await prisma.visitor.findMany({
    where: { responsibleMembers: { contains: String(userId) } },
    orderBy: { visitDate: "desc" },
    select: {
      id: true, firstName: true, lastName: true, phone: true, email: true,
      visitDate: true, is_member: true, responsibleMembers: true,
    },
  });
  return candidates.filter((v) => parseResponsibleIds(v.responsibleMembers).includes(userId));
}
```
  - `getFollowUpsForAssignee(userId, visitorId?)` — `prisma.follow_up.findMany({ where: { assignedTo: userId, ...(visitorId ? { visitorId } : {}) }, orderBy: { date: "asc" } })`.
  - `updateOwnFollowUp(userId, followUpId, { status?, notes? })` — load the row; if `assignedTo !== userId` throw a 403-mapped error; else update only `status`/`notes`.
  - `addVisitNoteForResponsibleUser(userId, visitorId, note)` — verify the visitor's `responsibleMembers` includes `userId`; else 403; else create a `note`/`visit` note per the existing note model (read how notes attach to a visitor — `visitor.notes note[]`).

- [ ] **Step 2: Controller** (`getRequestUserId` pattern from `prayerRequestController.ts:8-11`):
```ts
// src/modules/visitorManagement/memberVisitorController.ts
import { Request, Response } from "express";
import { memberVisitorService } from "./memberVisitorService";

const getUserId = (req: Request) => {
  const n = Number((req as any)?.user?.id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export class MemberVisitorController {
  listMyVisitors = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const data = await memberVisitorService.getVisitorsForResponsibleUser(userId);
    res.status(200).json({ message: "Operation successful", data });
  };
  listMyFollowUps = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const visitorId = req.query.visitorId ? Number(req.query.visitorId) : undefined;
    const data = await memberVisitorService.getFollowUpsForAssignee(userId, visitorId);
    res.status(200).json({ message: "Operation successful", data });
  };
  updateMyFollowUp = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const data = await memberVisitorService.updateOwnFollowUp(
        userId, Number(req.body.id), { status: req.body.status, notes: req.body.notes },
      );
      res.status(200).json({ message: "Operation successful", data });
    } catch (e: any) {
      res.status(e.statusCode ?? 500).json({ message: e.message });
    }
  };
  addMyVisitNote = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const data = await memberVisitorService.addVisitNoteForResponsibleUser(
        userId, Number(req.body.visitorId), String(req.body.note ?? ""),
      );
      res.status(201).json({ message: "Operation successful", data });
    } catch (e: any) {
      res.status(e.statusCode ?? 500).json({ message: e.message });
    }
  };
}
```

- [ ] **Step 3: Routes** — add member-facing block in `visitorRoute.ts` (next to the `/my-prayer-requests` block `:167-176`), `protect` only, no permission guard:
```ts
import { MemberVisitorController } from "./memberVisitorController";
const memberVisitorController = new MemberVisitorController();
// Member-facing: a signed-in member manages ONLY the visitors they are responsible for.
visitorRouter.get("/my-visitors", [protect], memberVisitorController.listMyVisitors);
visitorRouter.get("/my-follow-ups", [protect], memberVisitorController.listMyFollowUps);
visitorRouter.put("/my-follow-up", [protect], memberVisitorController.updateMyFollowUp);
visitorRouter.post("/my-visit-note", [protect], memberVisitorController.addMyVisitNote);
```

- [ ] **Step 4: Verify.** `npx tsc --noEmit` → PASS. **Manual (if local):** as a non-admin user who is a responsible member, `GET /visitor/my-visitors` returns only their visitors; `PUT /visitor/my-follow-up` with another user's follow-up id → 403.

- [ ] **Step 5: Commit.**
```bash
git -C /Users/akwaah/GitHub/Backend add -A
git -C /Users/akwaah/GitHub/Backend commit -m "feat(visitors): member-facing endpoints for managing assigned visitors"
```

### Task 4.2 (Mobile): `visitors` feature + More menu entry

Branch: cut `codex/my-visitors` off `dev`.

**Files:** New `src/features/visitors/{api.ts,queryKeys.ts,types.ts,hooks.ts,index.ts,screens/MyVisitorsScreen.tsx}`; modify `src/shared/api/index.ts`, `src/navigation/index.tsx`, `src/features/more/screens/MoreScreen.tsx`.

- [ ] **Step 1: Cut the branch.**
```bash
git -C /Users/akwaah/GitHub/wwm-mobile fetch origin dev --quiet
git -C /Users/akwaah/GitHub/wwm-mobile checkout -b codex/my-visitors origin/dev
```

- [ ] **Step 2: Types** (`src/features/visitors/types.ts`):
```ts
export type AssignedVisitor = {
  id: string;
  name: string;
  phone: string;
  email: string;
  visitDate: string;
  isMember: boolean;
};
export type VisitorFollowUp = {
  id: string;
  visitorId: string;
  date: string;
  status: string;
  notes: string;
  open: boolean;
};
```

- [ ] **Step 3: API slice + normalizers** (`src/features/visitors/api.ts`) — mirror `src/features/more/api.ts` (member endpoints under `visitor/` prefix), import verb helpers + coercion from shared:
```ts
import { get, post, put } from "@/shared/api/client";
import { asArray, asRecord, toText, toBool } from "@/shared/lib";
import type { AssignedVisitor, VisitorFollowUp } from "./types";

export const normalizeAssignedVisitor = (value: unknown): AssignedVisitor => {
  const raw = asRecord(value);
  const first = toText(raw.firstName ?? raw.first_name);
  const last = toText(raw.lastName ?? raw.last_name);
  return {
    id: toText(raw.id),
    name: `${first} ${last}`.trim(),
    phone: toText(raw.phone),
    email: toText(raw.email),
    visitDate: toText(raw.visitDate ?? raw.visit_date),
    isMember: toBool(raw.is_member ?? raw.isMember),
  };
};

export const normalizeFollowUp = (value: unknown): VisitorFollowUp => {
  const raw = asRecord(value);
  const status = toText(raw.status, "pending").toLowerCase();
  return {
    id: toText(raw.id),
    visitorId: toText(raw.visitorId ?? raw.visitor_id),
    date: toText(raw.date),
    status,
    notes: toText(raw.notes),
    open: !["completed", "done", "cancelled"].includes(status),
  };
};

export const visitorsApi = {
  myVisitors: () => get<unknown[]>("visitor/my-visitors"),
  myFollowUps: (visitorId?: string) =>
    get<unknown[]>("visitor/my-follow-ups", visitorId ? { visitorId } : undefined),
  updateFollowUp: (payload: { id: string; status?: string; notes?: string }) =>
    put<unknown>("visitor/my-follow-up", payload),
  addVisitNote: (payload: { visitorId: string; note: string }) =>
    post<unknown>("visitor/my-visit-note", payload),
};
```
(Confirm `get` accepts a query object as 2nd arg — `client.ts:96`/`withQuery:86`; match the real signature.)

- [ ] **Step 4: Query keys** (`queryKeys.ts`), mirroring `appointments/queryKeys.ts`:
```ts
export const visitorsKeys = {
  all: ["visitors"] as const,
  myVisitors: (userId?: string | number) => ["visitors", "mine", userId] as const,
  followUps: (visitorId?: string) => ["visitors", "followups", visitorId] as const,
};
```

- [ ] **Step 5: Hooks** (`hooks.ts`) — TanStack Query, mirroring `more/hooks.ts:49`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { visitorsApi, normalizeAssignedVisitor, normalizeFollowUp } from "./api";
import { visitorsKeys } from "./queryKeys";
import { asArray } from "@/shared/lib";

export const useMyVisitors = () =>
  useQuery({
    queryKey: visitorsKeys.myVisitors(),
    queryFn: async () => asArray(await visitorsApi.myVisitors()).map(normalizeAssignedVisitor),
  });

export const useMyFollowUps = (visitorId?: string) =>
  useQuery({
    queryKey: visitorsKeys.followUps(visitorId),
    queryFn: async () => asArray(await visitorsApi.myFollowUps(visitorId)).map(normalizeFollowUp),
  });

export const useUpdateFollowUp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: visitorsApi.updateFollowUp,
    onSuccess: () => qc.invalidateQueries({ queryKey: visitorsKeys.all }),
  });
};
```
(Confirm the project's React Query version/import path matches other features.)

- [ ] **Step 6: Screen** (`screens/MyVisitorsScreen.tsx`) — follow `AppointmentsScreen.tsx` for layout primitives (`@/shared/ui`), list the assigned visitors, tap → their follow-ups with a "Mark done" action. Keep it inline with existing member screens (reuse `ActionRow`/card components from `@/shared/ui`). Empty state when none.

- [ ] **Step 7: Barrel** (`index.ts`), mirroring `appointments/index.ts`:
```ts
export { MyVisitorsScreen } from "./screens/MyVisitorsScreen";
export { visitorsApi, normalizeAssignedVisitor, normalizeFollowUp } from "./api";
export { visitorsKeys } from "./queryKeys";
export * from "./hooks";
export type { AssignedVisitor, VisitorFollowUp } from "./types";
```

- [ ] **Step 8: Register API slice.** In `src/shared/api/index.ts` add `import { visitorsApi } from "@/features/visitors/api";` and spread `...visitorsApi,` into the composed `api` object (`:28`).

- [ ] **Step 9: Register navigation.** In `src/navigation/index.tsx`: add `import { MyVisitorsScreen } from "@/features/visitors";` near the other feature-barrel imports (~`:53`), and add inside `MoreNavigator` (~`:165`): `<MoreStack.Screen name="MyVisitors" component={MyVisitorsScreen} />`.

- [ ] **Step 10: Add the More row.** In `src/features/more/screens/MoreScreen.tsx`, inside the "Church" `MenuGroup` (~`:322`, next to Directory), add:
```tsx
<ActionRow
  title="My Visitors"
  subtitle="Visitors assigned to you and their follow-ups"
  icon="person-add-outline"
  iconColor={colors.accentIndigo}
  onPress={() => navigation.navigate("MyVisitors")}
/>
```
Gate on `isGuest ? null : (…)` like the Directory row (assignment-based access; the backend already returns only the member's own visitors, so no permission module is required — show it to all non-guest members; empty state covers members with no assignments).

- [ ] **Step 11: Verify.** `cd /Users/akwaah/GitHub/wwm-mobile && npx tsc --noEmit` → PASS. **Manual:** run the app (`npx expo start`), sign in as a member who is a responsible member, More → My Visitors lists them; open one, mark a follow-up done → list refreshes.

- [ ] **Step 12: Commit.**
```bash
git -C /Users/akwaah/GitHub/wwm-mobile add -A
git -C /Users/akwaah/GitHub/wwm-mobile commit -m "feat(visitors): member screen to manage assigned visitors under More"
```

---

## PRs (after each repo's phase verifies)

- Backend PR → `main` first (items 2.1, 3.1-3.4, 4.1). Title: "Visitor management: event search, follow-up config + cron, member endpoints". End body with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Frontend PR → `development` (items 1, 2.2, 3.5). Same trailer.
- Mobile PR → `dev` (item 4.2). Same trailer.

Each PR body should note the cross-repo dependency (Frontend/Mobile require the Backend PR deployed first) and that there is no test runner — verification was `tsc`/`lint`/manual.

---

## Self-Review (completed during authoring)

- **Spec coverage:** Item 1 → Tasks 1.1-1.2. Item 2 → 2.1 (BE) + 2.2 (FE). Item 3 → 3.1-3.4 (BE) + 3.5 (FE). Item 4 → 4.1 (BE) + 4.2 (Mobile). All covered.
- **Type consistency:** `follow_ups_per_month`/`enabled` consistent across schema, service, controller, FE payload, settings UI. `AssignedVisitor`/`VisitorFollowUp` consistent across mobile types/api/hooks. `type:"auto_monthly"` used by both the cron create and its idempotency count.
- **Known soft spots flagged inline (not placeholders):** exact access-table query for `listUserIdsWithVisitorManageAccess` (Task 3.3) and `notifyAdminsJobFailed` arg shape (Task 3.4 Step 2) must be copied from the real functions at execution — the plan says which function to read and mirror. `responsibleMembers` `contains` is a documented loose prefilter followed by an exact in-app check.
