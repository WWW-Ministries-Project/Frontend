# Life Center Meeting UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix six Life Center meeting UX issues (full-width fields, in-dropdown "add first timer", mispositioned actions menu, missing gender field, a real view-meeting screen with phone+gender, and broken flag icons), spanning the Frontend repo and the sibling Backend repo.

**Architecture:** Backend gains a `gender` column on `soul_won` and exposes `phone`/`gender` on the meeting-attendee response; Frontend consumes those fields in a redesigned full-screen "View Meeting" table, adds `gender` to the Add-a-Soul form, moves the first-timer creation trigger into the `Multiselect` dropdown itself, migrates the meeting row-actions menu to the already-existing `ActionsMenu` component, and replaces emoji flags with the `flag-icons` SVG library.

**Tech Stack:** React 18 + TypeScript + Formik/Yup + Tailwind (Frontend); Express + Prisma + MySQL (Backend). No test runner is configured in either repo — verification is `npx tsc --noEmit` plus manual exercise of the affected screens.

**Spec:** `docs/superpowers/specs/2026-08-23-life-center-meeting-ux-fixes-design.md`

---

## Repo paths

- Frontend: `/Users/akwaah/Documents/GitHub/Frontend` (branch `feat/life-center-meeting-ux`, already cut off `development`)
- Backend: `/Users/akwaah/Documents/GitHub/Backend` (cut a matching branch off `development` before Task 1 — see Task 0)

## File Structure

**Backend:**
- Modify: `prisma/schema.prisma` (`soul_won` model — add `gender`)
- Create: `prisma/migrations/20260823013000_add_soul_won_gender/migration.sql`
- Modify: `src/modules/lifeCenterMangement/lifeCenterService.ts` (`createSoulWon`/`updateSoulWon` param types + prisma calls)
- Modify: `src/modules/lifeCenterMangement/lifeCenterController.ts` (`createSoulWon`/`updateSoulWon` request destructure + response shape)
- Modify: `src/modules/lifeCenterMangement/lifeCenterMeetingService.ts` (`ATTENDEE_INCLUDE` select)
- Modify: `src/modules/lifeCenterMangement/lifeCenterMeetingController.ts` (`mapAttendee`)

**Frontend:**
- Modify: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingForm.tsx` (full-width fields, footer-action wiring)
- Modify: `src/components/MultiSelect.tsx` (new `footerAction` prop)
- Modify: `src/pages/HomePage/pages/LifeCenter/components/SoulsWonForm.tsx` (gender field)
- Modify: `src/utils/api/lifeCenter/interfaces.ts` (`MeetingAttendeeType` gains `phone`/`gender`)
- Modify: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx` (ActionsMenu migration + full-screen view)
- Modify: `src/components/ContactInput.tsx` (flag rendering)
- Modify: `package.json` (add `flag-icons` dependency)
- Modify: `src/main.tsx` (import `flag-icons/css/flag-icons.min.css` once, globally)

---

## Task 0: Cut the Backend branch

**Files:** none (git only)

- [ ] **Step 1: Create a matching feature branch in the Backend repo**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
git fetch origin
git checkout development
git pull origin development
git checkout -b feat/life-center-meeting-ux
```

Expected: `Switched to a new branch 'feat/life-center-meeting-ux'`, working tree clean (`git status --short` prints nothing).

---

## Task 1: Add `gender` column to `soul_won` (Backend, schema + migration)

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260823013000_add_soul_won_gender/migration.sql`

- [ ] **Step 1: Add the field to the Prisma model**

In `prisma/schema.prisma`, find the `soul_won` model (currently starts at line 1474) and add `gender` right after `other_name`:

```prisma
model soul_won {
  id             Int         @id @unique @default(autoincrement())
  title          String?
  first_name     String
  last_name      String
  other_name     String?
  gender         String?
  contact_number String
  contact_email  String?
  country_code   String?
  country        String
  city           String
  date_won       DateTime
  wonById        Int
  lifeCenterId   Int
  memberId       Int?        @unique
  lifeCenter     life_center @relation("life_center_soul_won", fields: [lifeCenterId], references: [id], map: "soulwon_lifecenter_fkey")
  wonBy          user        @relation("user_soul_winner", fields: [wonById], references: [id], map: "soulwon_wonby_fkey")
  member         user?       @relation("soul_won_member", fields: [memberId], references: [id], map: "soulwon_member_fkey")
  life_center_meeting_attendee life_center_meeting_attendee[]

  @@index([lifeCenterId], map: "soulwon_lifecenter_fkey")
  @@index([wonById], map: "soulwon_wonby_fkey")
}
```

- [ ] **Step 2: Write the migration by hand** (matches the existing hand-written-migration convention, e.g. `20260822223000_add_product_colour_name/migration.sql` — do NOT run `prisma migrate dev` against the shared dev/prod MySQL host)

Create `prisma/migrations/20260823013000_add_soul_won_gender/migration.sql`:

```sql
-- Add-a-Soul form and the meeting-attendee view both need gender, and
-- soul_won had no such column. Nullable so existing rows are unaffected;
-- new/edited souls populate it going forward.
ALTER TABLE `soul_won` ADD COLUMN `gender` VARCHAR(191) NULL;
```

- [ ] **Step 3: Regenerate the Prisma client (schema-only, no DB connection)**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
npx prisma generate
```

Expected: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors (the new `gender` field on `soul_won` isn't referenced by any code yet, so this should be a no-op check).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260823013000_add_soul_won_gender
git commit -m "feat(life-center): add gender column to soul_won

Nullable VARCHAR, matches the user.gender convention. Migration applies
automatically via CI's prisma migrate deploy on merge to development/main —
not run manually against the shared DB here.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Thread `gender` through the soul_won service layer (Backend)

**Files:**
- Modify: `src/modules/lifeCenterMangement/lifeCenterService.ts`

- [ ] **Step 1: Add `gender` to `createSoulWon`'s param type and prisma call**

Find `createSoulWon` (currently ~line 358):

```typescript
  async createSoulWon(data: {
    title: string;
    first_name: string;
    last_name: string;
    other_name?: string;
    contact_number: string;
    country_code: string;
    contact_email?: string;
    country: string;
    city: string;
    date_won: Date;
    wonById: number;
    lifeCenterId: number;
  }) {
    return await prisma.soul_won.create({
      data,
    });
  }
```

Replace with:

```typescript
  async createSoulWon(data: {
    title: string;
    first_name: string;
    last_name: string;
    other_name?: string;
    gender?: string;
    contact_number: string;
    country_code: string;
    contact_email?: string;
    country: string;
    city: string;
    date_won: Date;
    wonById: number;
    lifeCenterId: number;
  }) {
    return await prisma.soul_won.create({
      data,
    });
  }
```

(`data` is passed straight through to Prisma, so adding the field to the type is the only change needed here.)

- [ ] **Step 2: Add `gender` to `updateSoulWon`'s param type and prisma call**

Find `updateSoulWon` (currently ~line 377):

```typescript
  async updateSoulWon(
    id: number,
    data: {
      title?: string;
      first_name?: string;
      last_name?: string;
      other_name?: string;
      contact_number?: string;
      country_code?: string;
      contact_email?: string;
      country?: string;
      city?: string;
      date_won?: Date;
      wonById?: number;
      lifeCenterId?: number;
    },
  ) {
    return await prisma.soul_won.update({
      where: { id },
      data: {
        title: data.title,
        first_name: data.first_name,
        last_name: data.last_name,
        other_name: data.other_name,
        contact_number: data.contact_number,
        country_code: data.country_code,
        contact_email: data.contact_email,
        country: data.country,
        city: data.city,
        date_won: data.date_won,
        wonById: data.wonById,
        lifeCenterId: data.lifeCenterId,
      },
    });
  }
```

Replace with:

```typescript
  async updateSoulWon(
    id: number,
    data: {
      title?: string;
      first_name?: string;
      last_name?: string;
      other_name?: string;
      gender?: string;
      contact_number?: string;
      country_code?: string;
      contact_email?: string;
      country?: string;
      city?: string;
      date_won?: Date;
      wonById?: number;
      lifeCenterId?: number;
    },
  ) {
    return await prisma.soul_won.update({
      where: { id },
      data: {
        title: data.title,
        first_name: data.first_name,
        last_name: data.last_name,
        other_name: data.other_name,
        gender: data.gender,
        contact_number: data.contact_number,
        country_code: data.country_code,
        contact_email: data.contact_email,
        country: data.country,
        city: data.city,
        date_won: data.date_won,
        wonById: data.wonById,
        lifeCenterId: data.lifeCenterId,
      },
    });
  }
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/modules/lifeCenterMangement/lifeCenterService.ts
git commit -m "feat(life-center): thread gender through soul_won service

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Thread `gender` through the soul_won controller (Backend)

**Files:**
- Modify: `src/modules/lifeCenterMangement/lifeCenterController.ts`

Note: `mapSoulWonResponse` (top of file, used by the list/read endpoints) already spreads `...soul`, so `gender` flows through it automatically — no change needed there. `createSoulWon`/`updateSoulWon` build their response objects field-by-field and need explicit updates.

- [ ] **Step 1: Update `createSoulWon`**

Find (currently ~line 376):

```typescript
      const {
        title,
        first_name,
        last_name,
        other_name,
        phone,
        contact_email,
        country,
        city,
        date_won,
        wonById,
        lifeCenterId,
      } = req.body;
```

Replace with:

```typescript
      const {
        title,
        first_name,
        last_name,
        other_name,
        gender,
        phone,
        contact_email,
        country,
        city,
        date_won,
        wonById,
        lifeCenterId,
      } = req.body;
```

A few lines down, find:

```typescript
      const newSoul = await lifeCenterService.createSoulWon({
        title,
        first_name,
        last_name,
        other_name,
        contact_number: phone.number,
        country_code: phone.country_code,
        contact_email,
        country,
        city,
        date_won: new Date(date_won),
        wonById: Number(wonById),
        lifeCenterId: Number(lifeCenterId),
      });
```

Replace with:

```typescript
      const newSoul = await lifeCenterService.createSoulWon({
        title,
        first_name,
        last_name,
        other_name,
        gender,
        contact_number: phone.number,
        country_code: phone.country_code,
        contact_email,
        country,
        city,
        date_won: new Date(date_won),
        wonById: Number(wonById),
        lifeCenterId: Number(lifeCenterId),
      });
```

Then find:

```typescript
      const returningSoul = {
        id: newSoul.id,
        title: newSoul.title,
        first_name: newSoul.first_name,
        last_name: newSoul.last_name,
        other_name: newSoul.other_name,
        phone: {
          number: newSoul.contact_number,
          country_code: newSoul.country_code,
        },
        contact_email: newSoul.contact_email,
        country: newSoul.country,
        city: newSoul.city,
        date_won: newSoul.date_won,
        wonById: newSoul.wonById,
        lifeCenterId: newSoul.lifeCenterId,
      };
```

Replace with:

```typescript
      const returningSoul = {
        id: newSoul.id,
        title: newSoul.title,
        first_name: newSoul.first_name,
        last_name: newSoul.last_name,
        other_name: newSoul.other_name,
        gender: newSoul.gender,
        phone: {
          number: newSoul.contact_number,
          country_code: newSoul.country_code,
        },
        contact_email: newSoul.contact_email,
        country: newSoul.country,
        city: newSoul.city,
        date_won: newSoul.date_won,
        wonById: newSoul.wonById,
        lifeCenterId: newSoul.lifeCenterId,
      };
```

- [ ] **Step 2: Update `updateSoulWon`** the same way

Find:

```typescript
      const {
        title,
        first_name,
        last_name,
        other_name,
        phone,
        contact_email,
        country,
        city,
        date_won,
        wonById,
        lifeCenterId,
      } = req.body;

      if (
        lifeCenterScope?.mode === "member" &&
```

Replace the destructure with:

```typescript
      const {
        title,
        first_name,
        last_name,
        other_name,
        gender,
        phone,
        contact_email,
        country,
        city,
        date_won,
        wonById,
        lifeCenterId,
      } = req.body;

      if (
        lifeCenterScope?.mode === "member" &&
```

Find:

```typescript
      const updated = await lifeCenterService.updateSoulWon(Number(id), {
        title,
        first_name,
        last_name,
        other_name,
        contact_number: phone.number,
        country_code: phone.country_code,
        contact_email,
        country,
        city,
        date_won: new Date(date_won),
        wonById: Number(wonById),
        lifeCenterId: Number(lifeCenterId),
      });

      const updatedSoul = {
        id: updated.id,
        first_name: updated.first_name,
        last_name: updated.last_name,
        other_name: updated.other_name,
        phone: {
          number: updated.contact_number,
          country_code: updated.country_code,
        },
        contact_email: updated.contact_email,
        country: updated.country,
        city: updated.city,
        date_won: updated.date_won,
        wonById: updated.wonById,
        lifeCenterId: updated.lifeCenterId,
      };
```

Replace with:

```typescript
      const updated = await lifeCenterService.updateSoulWon(Number(id), {
        title,
        first_name,
        last_name,
        other_name,
        gender,
        contact_number: phone.number,
        country_code: phone.country_code,
        contact_email,
        country,
        city,
        date_won: new Date(date_won),
        wonById: Number(wonById),
        lifeCenterId: Number(lifeCenterId),
      });

      const updatedSoul = {
        id: updated.id,
        first_name: updated.first_name,
        last_name: updated.last_name,
        other_name: updated.other_name,
        gender: updated.gender,
        phone: {
          number: updated.contact_number,
          country_code: updated.country_code,
        },
        contact_email: updated.contact_email,
        country: updated.country,
        city: updated.city,
        date_won: updated.date_won,
        wonById: updated.wonById,
        lifeCenterId: updated.lifeCenterId,
      };
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/modules/lifeCenterMangement/lifeCenterController.ts
git commit -m "feat(life-center): accept and return gender on soul_won endpoints

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Expose phone + gender on meeting attendees (Backend)

**Files:**
- Modify: `src/modules/lifeCenterMangement/lifeCenterMeetingService.ts`
- Modify: `src/modules/lifeCenterMangement/lifeCenterMeetingController.ts`

- [ ] **Step 1: Expand the attendee select**

In `lifeCenterMeetingService.ts`, find:

```typescript
const ATTENDEE_INCLUDE = {
  attendees: {
    include: {
      soulWon: {
        select: { id: true, first_name: true, last_name: true },
      },
    },
  },
} as const;
```

Replace with:

```typescript
const ATTENDEE_INCLUDE = {
  attendees: {
    include: {
      soulWon: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          contact_number: true,
          country_code: true,
          gender: true,
        },
      },
    },
  },
} as const;
```

- [ ] **Step 2: Expand the response mapper**

In `lifeCenterMeetingController.ts`, find:

```typescript
const mapAttendee = (row: any) => ({
  soulWonId: row.soulWonId,
  name: [row.soulWon?.first_name, row.soulWon?.last_name]
    .filter(Boolean)
    .join(" "),
  isFirstTimer: row.isFirstTimer,
});
```

Replace with:

```typescript
const mapAttendee = (row: any) => ({
  soulWonId: row.soulWonId,
  name: [row.soulWon?.first_name, row.soulWon?.last_name]
    .filter(Boolean)
    .join(" "),
  isFirstTimer: row.isFirstTimer,
  phone: {
    number: row.soulWon?.contact_number ?? null,
    country_code: row.soulWon?.country_code ?? null,
  },
  gender: row.soulWon?.gender ?? null,
});
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/modules/lifeCenterMangement/lifeCenterMeetingService.ts src/modules/lifeCenterMangement/lifeCenterMeetingController.ts
git commit -m "feat(life-center): expose phone and gender on meeting attendees

Frontend's redesigned View Meeting table needs both per row; the data
already lived on soul_won, it just wasn't selected/mapped through.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Push the Backend branch and open a draft PR** (Frontend Tasks 5-11 depend on this data being available; the Frontend PR should note it needs this Backend PR merged first)

```bash
git push -u origin feat/life-center-meeting-ux
gh pr create --base development --title "feat(life-center): add gender to soul_won, expose phone+gender on meeting attendees" --body "Backend half of the Life Center meeting UX fixes. See Frontend PR for the consuming changes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Task 5: Full-width Attendees/First-timers fields (Frontend)

**Files:**
- Modify: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingForm.tsx:229,242`

- [ ] **Step 1: Add `md:col-span-2` to both field wrappers**

Find:

```tsx
                <div>
                  <label className="text-primary font-semibold" htmlFor="attendees">
                    Attendees
                  </label>
```

Replace with:

```tsx
                <div className="md:col-span-2">
                  <label className="text-primary font-semibold" htmlFor="attendees">
                    Attendees
                  </label>
```

Find:

```tsx
                <div>
                  <label className="text-primary font-semibold" htmlFor="firstTimers">
                    First timers
                  </label>
```

Replace with:

```tsx
                <div className="md:col-span-2">
                  <label className="text-primary font-semibold" htmlFor="firstTimers">
                    First timers
                  </label>
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manually verify** — open the Add Meeting form (Life Center → Meetings → Create Meeting) at desktop width and confirm Attendees and First timers each span the full form width instead of sitting side-by-side.

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingForm.tsx
git commit -m "fix(life-center): make attendees/first-timers fields full width

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Move "add new first timer" into the dropdown (Frontend)

**Files:**
- Modify: `src/components/MultiSelect.tsx`
- Modify: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingForm.tsx`

- [ ] **Step 1: Add a `footerAction` prop to `Multiselect`**

In `src/components/MultiSelect.tsx`, update the props interface:

```typescript
interface MultiselectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;

  placeholder?: string;
  emptyMsg?: string;
  disabled?: boolean;
  className?: string;
  footerAction?: { label: string; onClick: () => void };
}
```

Update the destructure:

```typescript
const Multiselect: React.FC<MultiselectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  emptyMsg = "No selection",
  disabled,
  className,
  footerAction,
}) => {
```

Find the dropdown panel's option list:

```tsx
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                  />
                  {option.label}
                </label>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
          </div>
```

Replace with:

```tsx
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                  />
                  {option.label}
                </label>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
          </div>
          {footerAction && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                footerAction.onClick();
              }}
              className="flex w-full items-center gap-2 border-t px-3 py-2 text-sm font-medium text-primary hover:bg-gray-100"
            >
              {footerAction.label}
            </button>
          )}
```

- [ ] **Step 2: Wire it up in `MeetingForm.tsx`**

Find:

```tsx
                <div className="md:col-span-2">
                  <label className="text-primary font-semibold" htmlFor="firstTimers">
                    First timers
                  </label>
                  <Multiselect
                    options={firstTimerOptions}
                    selectedValues={values.firstTimers}
                    onChange={(selected) => setFieldValue("firstTimers", selected)}
                    placeholder="Select first timers"
                    emptyMsg="No first timers selected"
                  />
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-primary underline"
                    onClick={() => setShowAddFirstTimer(true)}
                  >
                    + Add new first timer
                  </button>
                </div>
```

Replace with:

```tsx
                <div className="md:col-span-2">
                  <label className="text-primary font-semibold" htmlFor="firstTimers">
                    First timers
                  </label>
                  <Multiselect
                    options={firstTimerOptions}
                    selectedValues={values.firstTimers}
                    onChange={(selected) => setFieldValue("firstTimers", selected)}
                    placeholder="Select first timers"
                    emptyMsg="No first timers selected"
                    footerAction={{
                      label: "+ Add new first timer",
                      onClick: () => setShowAddFirstTimer(true),
                    }}
                  />
                </div>
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. `EventsScheduleForm.tsx`'s `Multiselect` usage doesn't pass `footerAction` — it's optional, so that call site is unaffected.

- [ ] **Step 4: Manually verify** — open Add Meeting, click the First timers dropdown, confirm "+ Add new first timer" renders as the last row inside the open dropdown panel (below a divider), and clicking it still opens the existing Add-a-Soul modal.

- [ ] **Step 5: Commit**

```bash
git add src/components/MultiSelect.tsx src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingForm.tsx
git commit -m "feat(life-center): move add-first-timer trigger into the dropdown

Multiselect gains an optional footerAction row instead of a separate
link below the field.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Gender field on Add-a-Soul form (Frontend)

**Files:**
- Modify: `src/pages/HomePage/pages/LifeCenter/components/SoulsWonForm.tsx`

- [ ] **Step 1: Add `gender` to the interface, initial values, and validation schema**

Find:

```typescript
export interface ISoulsWonForm extends INameInfo {
  contact_email: string;
  country: string;
  phone: IContactInput;
  city: string;
  date_won: string;
  wonById: string;
  wonByName?: string;
  contact_number?: string;
  id: string;
  lifeCenterId: string;
  isMember?: boolean;
  memberId?: string | number | null;
  memberName?: string;
  memberMemberId?: string;
}

const initialValues: ISoulsWonForm = {
  ...NameInfo.initialValues,
  phone: ContactInput.initialValues,
  contact_email: "",
  country: "",
  city: "",
  date_won: "",
  wonById: "",
  wonByName: "",
  contact_number: "",
  id: "",
  lifeCenterId: "",
};

const validationSchema = object().shape({
  ...NameInfo.validationSchema,
  contact_email: string().email(),
  country: string().required("required"),
  city: string().required("required"),
  date_won: string().required("required"),
  wonById: string().required("required"),
  phone: object(ContactInput.validationSchema),
});
```

Replace with:

```typescript
export interface ISoulsWonForm extends INameInfo {
  contact_email: string;
  country: string;
  phone: IContactInput;
  gender: string;
  city: string;
  date_won: string;
  wonById: string;
  wonByName?: string;
  contact_number?: string;
  id: string;
  lifeCenterId: string;
  isMember?: boolean;
  memberId?: string | number | null;
  memberName?: string;
  memberMemberId?: string;
}

const initialValues: ISoulsWonForm = {
  ...NameInfo.initialValues,
  phone: ContactInput.initialValues,
  contact_email: "",
  country: "",
  gender: "",
  city: "",
  date_won: "",
  wonById: "",
  wonByName: "",
  contact_number: "",
  id: "",
  lifeCenterId: "",
};

const validationSchema = object().shape({
  ...NameInfo.validationSchema,
  contact_email: string().email(),
  country: string().required("required"),
  gender: string().required("Gender is required"),
  city: string().required("required"),
  date_won: string().required("required"),
  wonById: string().required("required"),
  phone: object(ContactInput.validationSchema),
});
```

- [ ] **Step 2: Add the field and its options, reusing the `PersonalDetails.tsx` gender pattern**

Add the import:

```typescript
import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
```

Find:

```tsx
              <NameInfo />
              <ContactInput />
```

Replace with:

```tsx
              <NameInfo />
              <Field
                name="gender"
                component={FormikSelectField}
                options={genderOptions}
                label="Gender *"
                id="gender"
                placeholder="Select gender"
              />
              <ContactInput />
```

Add the options constant near the bottom of the file, next to `initialValues`:

```typescript
const genderOptions: ISelectOption[] = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manually verify** — open the Add-a-Soul form (either standalone or via "+ Add new first timer" from Task 6) and confirm a required Gender dropdown appears right after the name fields, before phone.

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage/pages/LifeCenter/components/SoulsWonForm.tsx
git commit -m "feat(life-center): add gender field to Add-a-Soul form

Requires the Backend soul_won.gender column (see Backend PR).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Update `MeetingAttendeeType` for phone + gender (Frontend)

**Files:**
- Modify: `src/utils/api/lifeCenter/interfaces.ts`

- [ ] **Step 1: Extend the type**

Find:

```typescript
export type MeetingAttendeeType = {
  soulWonId: string | number;
  name: string;
  isFirstTimer: boolean;
};
```

Replace with:

```typescript
export type MeetingAttendeeType = {
  soulWonId: string | number;
  name: string;
  isFirstTimer: boolean;
  phone: {
    number: string | null;
    country_code: string | null;
  };
  gender: string | null;
};
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors (nothing consumes the new fields yet — that's Task 9).

- [ ] **Step 3: Commit**

```bash
git add src/utils/api/lifeCenter/interfaces.ts
git commit -m "feat(life-center): add phone/gender to MeetingAttendeeType

Matches the Backend meeting-attendee response shape (see Backend PR).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Migrate the Actions cell to `ActionsMenu` (Frontend)

**Files:**
- Modify: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx`

- [ ] **Step 1: Swap the import and add `useRouteAccess`**

Find:

```typescript
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
```

Replace with:

```typescript
import { ActionsMenu } from "@/pages/HomePage/Components/reusable/ActionsMenu";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { useRouteAccess } from "@/context/RouteAccessContext";
```

- [ ] **Step 2: Compute the permission gates once, replacing the old comment/`canManageHere`-only logic**

Find:

```typescript
  // Route-mode edit/delete is gated by ActionButton's own useRouteAccess
  // check (default true/true props, deferring entirely to the real
  // RouteAccessProvider on that route). Membership-mode passes
  // requireManageAccess/requireAdminAccess=false and instead gates by
  // whether onEdit/onDelete are even defined, since useRouteAccess()
  // defaults to permissive true/true outside a RouteAccessProvider and
  // MyLifeCenter.tsx has no such provider.
  const canManageHere = accessMode === "route" || isLeadershipMember;
```

Replace with:

```typescript
  // ActionsMenu has no built-in permission gating (unlike the old
  // ActionButton/Action pair, which read useRouteAccess() internally) — so
  // it's computed here instead. Route mode (admin/HomePage side) defers to
  // the real RouteAccessProvider; membership mode (member portal, no such
  // provider) gates purely on leadership status.
  const { canManageCurrentRoute, canAdminCurrentRoute } = useRouteAccess();
  const canManageHere = accessMode === "route" || isLeadershipMember;
  const canEdit =
    accessMode === "route" ? canManageCurrentRoute : isLeadershipMember;
  const canDelete =
    accessMode === "route" ? canAdminCurrentRoute : isLeadershipMember;
```

- [ ] **Step 3: Replace the Actions column cell**

Find:

```tsx
      {
        header: "Actions",
        cell: ({ row }) => {
          const meeting = row.original;
          return (
            <div
              onClick={() =>
                setSelectedId((prev) => (prev === meeting.id ? "" : meeting.id))
              }
            >
              <ActionButton
                showOptions={meeting.id === selectedId}
                onView={() => setViewing(meeting)}
                onEdit={
                  canManageHere
                    ? () => {
                        setEditing(meeting);
                        setOpenModal(true);
                      }
                    : undefined
                }
                onDelete={
                  canManageHere ? () => handleDelete(meeting) : undefined
                }
                requireManageAccess={accessMode === "route"}
                requireAdminAccess={accessMode === "route"}
              />
            </div>
          );
        },
      },
    ],
    [selectedId, canManageHere, accessMode, handleDelete]
  );
```

Replace with:

```tsx
      {
        header: "Actions",
        cell: ({ row }) => {
          const meeting = row.original;
          const menuActions = [
            { label: "View", onClick: () => setViewing(meeting) },
            ...(canEdit
              ? [
                  {
                    label: "Edit",
                    onClick: () => {
                      setEditing(meeting);
                      setOpenModal(true);
                    },
                  },
                ]
              : []),
            ...(canDelete
              ? [
                  {
                    label: "Delete",
                    variant: "danger" as const,
                    onClick: () => handleDelete(meeting),
                  },
                ]
              : []),
          ];
          return <ActionsMenu actions={menuActions} />;
        },
      },
    ],
    [canEdit, canDelete, handleDelete]
  );
```

- [ ] **Step 4: Remove the now-unused `selectedId` state**

Find:

```typescript
  const [selectedId, setSelectedId] = useState<string | number>("");
```

Delete this line entirely (no other reference to `selectedId`/`setSelectedId` remains after Step 3).

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors, no unused-variable warnings.

- [ ] **Step 6: Manually verify** — on the member portal (Life Center → My Meetings), click the "…" actions trigger on a row and confirm the menu opens directly under/beside the button instead of far away. Repeat on the admin/HomePage Life Center meetings screen (`accessMode="route"`) and confirm Edit/Delete visibility still matches the signed-in user's permissions.

- [ ] **Step 7: Commit**

```bash
git add src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx
git commit -m "fix(life-center): fix mispositioned actions menu on My Meetings

Migrates MeetingsList's row actions from the legacy ActionButton/Action
pair (unpositioned absolute div + invalid bottom-50% class) to the
existing portal-based ActionsMenu component, already used by
MarketOrders. Permission gating (previously inside Action.tsx via
useRouteAccess) is now computed explicitly in this file.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Redesign View Meeting as a full-screen table (Frontend)

**Files:**
- Modify: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx`

- [ ] **Step 1: Add the `Badge` import if not already present, plus a `ColumnDef` for the attendee table**

`Badge` is already imported (line 9). Add a `MeetingAttendeeType` import:

Find:

```typescript
import { MeetingType } from "@/utils/api/lifeCenter/interfaces";
```

Replace with:

```typescript
import {
  MeetingAttendeeType,
  MeetingType,
} from "@/utils/api/lifeCenter/interfaces";
```

- [ ] **Step 2: Build the attendee columns and replace the view-modal body**

Add this above the `columns` memo (which stays as-is from Task 9):

```typescript
  const attendeeColumns = useMemo<ColumnDef<MeetingAttendeeType>[]>(
    () => [
      { header: "Name", cell: ({ row }) => row.original.name },
      {
        header: "Phone",
        cell: ({ row }) => {
          const { country_code, number } = row.original.phone;
          return country_code && number
            ? `${country_code} ${number}`
            : "—";
        },
      },
      {
        header: "Gender",
        cell: ({ row }) => row.original.gender ?? "—",
      },
      {
        header: "Type",
        cell: ({ row }) =>
          row.original.isFirstTimer ? (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
              First Timer
            </Badge>
          ) : (
            "Member"
          ),
      },
    ],
    []
  );
```

Find the entire view modal:

```tsx
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="p-6 max-w-lg mx-auto bg-white rounded-lg space-y-3">
            <h3 className="text-lg font-semibold">
              Meeting — {format(new Date(viewing.date), "dd MMM yyyy")}
            </h3>
            <p className="text-sm text-gray-600">
              Offering: {viewing.currency} {viewing.offeringAmount}
            </p>
            <div>
              <p className="font-medium text-sm">Attendees</p>
              {viewing.attendees.filter((a) => !a.isFirstTimer).length > 0 ? (
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {viewing.attendees
                    .filter((a) => !a.isFirstTimer)
                    .map((a) => (
                      <li key={a.soulWonId}>{a.name}</li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">None recorded</p>
              )}
            </div>
            {viewing.attendees.some((a) => a.isFirstTimer) && (
              <div>
                <p className="font-medium text-sm">First timers</p>
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {viewing.attendees
                    .filter((a) => a.isFirstTimer)
                    .map((a) => (
                      <li key={a.soulWonId}>{a.name}</li>
                    ))}
                </ul>
              </div>
            )}
            {viewing.note && (
              <div className="rounded-md border border-gray-200 p-3">
                <p className="font-medium text-sm mb-1">Notes</p>
                <div
                  className="text-sm text-gray-700 prose"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(viewing.note),
                  }}
                />
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
```

Replace with:

```tsx
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        className="max-w-none w-screen h-[100dvh] max-h-[100dvh] rounded-none"
      >
        {viewing && (
          <div className="flex h-full w-full flex-col overflow-hidden bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-primary px-6 py-4 text-white">
              <div>
                <h3 className="text-lg font-semibold">
                  Meeting — {format(new Date(viewing.date), "dd MMM yyyy")}
                </h3>
                <p className="text-sm text-white/80">
                  Offering: {viewing.currency} {viewing.offeringAmount}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {viewing.note && (
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="font-medium text-sm mb-1">Notes</p>
                  <div
                    className="text-sm text-gray-700 prose"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(viewing.note),
                    }}
                  />
                </div>
              )}

              {viewing.attendees.length > 0 ? (
                <TableComponent
                  columns={attendeeColumns}
                  data={viewing.attendees}
                  total={viewing.attendees.length}
                  displayedCount={viewing.attendees.length}
                  getRowId={(a) => String(a.soulWonId)}
                />
              ) : (
                <EmptyState
                  scope="section"
                  msg="No attendees recorded"
                  description="No one was marked present or first-timer for this meeting."
                />
              )}
            </div>
          </div>
        )}
      </Modal>
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. `total` and `onPageChange` are optional on `TableComponentProps` (`TableComponent.tsx:28,30`), so omitting them is fine — the full attendee list renders on one unpaginated page here.

- [ ] **Step 4: Manually verify** — open View on a meeting with both attendees and first-timers (this requires the Backend PR from Task 4 to be running locally, or the API to already return `phone`/`gender`). Confirm: full-screen overlay, name/phone/gender/type columns populated, first-timers show the amber "First Timer" badge, everyone else shows "Member", phone renders as `<country_code> <number>` or "—" when absent, Close button works.

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx
git commit -m "feat(life-center): redesign View Meeting as a full-screen table

Combined attendee + first-timer list with name, phone (with country
code), gender, and a First Timer badge, replacing the old two-list
modal. Requires the Backend PR that exposes phone/gender on meeting
attendees.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: Fix flag icons (Frontend)

**Files:**
- Modify: `package.json`
- Modify: `src/main.tsx`
- Modify: `src/components/ContactInput.tsx`

- [ ] **Step 1: Install `flag-icons`**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npm install flag-icons
```

Expected: `package.json`'s `dependencies` gains a `"flag-icons": "^<version>"` entry; `package-lock.json` updates.

- [ ] **Step 2: Import its CSS once, globally**

In `src/main.tsx`, add near the other global CSS imports (check the top of the file for the existing import block, e.g. `import "./index.css"`, and add alongside it):

```typescript
import "flag-icons/css/flag-icons.min.css";
```

- [ ] **Step 3: Replace the emoji flag with the SVG flag class**

In `src/components/ContactInput.tsx`, find:

```tsx
                  <span
                    className="text-base leading-none"
                    role="img"
                    aria-label={country.name}
                  >
                    {country.flag}
                  </span>
```

Replace with:

```tsx
                  <span
                    className={`fi fi-${country.countryCode.toLowerCase()}`}
                    role="img"
                    aria-label={country.name}
                  />
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. `country.countryCode` is already typed as `CountryCode` (a string-based type) on `countryType` in `homeInterfaces.tsx` — no interface change needed.

- [ ] **Step 5: Manually verify** — open the Add-a-Soul form (or any screen using `ContactInput`), click the country-code field to open the dropdown, and confirm each row shows an actual flag image (not a blank box or emoji) regardless of OS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/main.tsx src/components/ContactInput.tsx
git commit -m "fix(contact-input): render flags as SVG icons, not emoji

Unicode flag-emoji glyphs depend on OS/browser emoji-font support and
render blank or as plain text on Windows and some browsers. Switch to
the flag-icons package (self-hosted SVG per ISO country code) so flags
render consistently everywhere.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: Push, open PR

**Files:** none (git only)

- [ ] **Step 1: Push the Frontend branch**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git push -u origin feat/life-center-meeting-ux
```

- [ ] **Step 2: Open the PR against `development`**, noting the Backend dependency

```bash
gh pr create --base development --title "feat(life-center): meeting UX fixes (full-width fields, in-dropdown add-first-timer, actions menu positioning, gender, view-meeting redesign, flag icons)" --body "Implements docs/superpowers/specs/2026-08-23-life-center-meeting-ux-fixes-design.md.

Depends on the companion Backend PR (soul_won.gender column + phone/gender exposed on meeting attendees) — merge that first, then this one.

## Changes
1. Attendees/First timers fields are now full width
2. \"+ Add new first timer\" moved into the Multiselect dropdown itself
3. Fixed the mispositioned actions menu on My Meetings (migrated to ActionsMenu)
4. Added a required Gender field to the Add-a-Soul form
5. View Meeting is now a full-screen table (name, phone w/ country code, gender, First Timer badge)
6. Flag icons now render as real SVGs instead of OS-dependent emoji

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Post-implementation notes

- The stashed `feat/admin-order-management` WIP (`git stash list` on the Frontend repo) is untouched by this work — resume it separately with `git checkout feat/admin-order-management && git stash pop`.
- Other `ActionButton`/`Action` consumers (`MarketCard`, `Visit`, `AllEventCard`, `LifeCenterRoles`, `SoulsWon`, `ProductDetailsCard`, etc.) still have the same positioning bug — out of scope per the design doc, but worth a follow-up ticket if they get reported too.
