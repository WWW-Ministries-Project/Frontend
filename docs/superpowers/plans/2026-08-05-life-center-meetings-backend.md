# Life Center Meetings — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo:** `/Users/akwaah/Documents/GitHub/Backend` — a separate git repo from Frontend. Branch off `main`. Every git command in this plan must target this path (`git -C /Users/akwaah/Documents/GitHub/Backend ...`), never the Frontend repo.
>
> **No test runner exists in this repo** (confirmed in `Backend/CLAUDE.md`-equivalent conventions). Verification steps use `npx tsc --noEmit` and manual `curl` smoke tests against a running local server instead of a test suite. Do not add a test framework as part of this plan.

**Goal:** Add a `life_center_meeting` + `life_center_meeting_attendee` data model, service, controller, and routes so leaders can log dated meetings (attendees, first-timers, offering, note) for a life center, gated by the existing `"Life Center"` permission domain plus creator ownership.

**Architecture:** New Prisma models alongside the existing `life_center`/`soul_won` models. New `LifeCenterMeetingService`/`LifeCenterMeetingController` classes (sibling files to the existing `lifeCenterService.ts`/`lifeCenterController.ts`), wired into the existing flat `lifeCenterRoute.ts` router under `/lifecenter`. Reuses the existing `can_manage_life_center_scoped` / `can_view_life_center_scoped` / `can_delete_life_center` middleware — no changes to `authorization.ts`. Ownership (creator-only edit/delete) is checked in the controller by comparing `req.user.id` (set by the scoped middleware via `getAccessContext`) to the meeting's `createdById`, bypassed for privileged users (`req.user.user_category === "admin"`).

**Tech Stack:** Express, Prisma (MySQL), TypeScript.

---

## Branch setup

- [ ] **Step 1: Create a fresh branch off `main`**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend fetch origin
git -C /Users/akwaah/Documents/GitHub/Backend checkout main
git -C /Users/akwaah/Documents/GitHub/Backend pull origin main
git -C /Users/akwaah/Documents/GitHub/Backend checkout -b feature/life-center-meetings
```

---

### Task 1: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma:81` (user model — add back-relation)
- Modify: `prisma/schema.prisma:1453` (life_center model — add back-relation)
- Modify: `prisma/schema.prisma:1493` (soul_won model — add back-relation, insert new models after)
- Create: `prisma/migrations/20260805150000_add_life_center_meeting/migration.sql`

- [ ] **Step 1: Add the `user` back-relation**

In `prisma/schema.prisma`, immediately after line 81
(`  soul_won                 soul_won[]                 @relation("user_soul_winner")`),
add:

```prisma
  life_center_meetings_created life_center_meeting[]   @relation("life_center_meeting_created_by")
```

- [ ] **Step 2: Add the `life_center` back-relation**

In `prisma/schema.prisma`, inside `model life_center { ... }`, immediately after
the line `soul_won           soul_won[]           @relation("life_center_soul_won")`
(currently line 1453), add:

```prisma
  life_center_meeting life_center_meeting[]
```

- [ ] **Step 3: Add the `soul_won` back-relation**

In `prisma/schema.prisma`, inside `model soul_won { ... }`, immediately after
the `member` field (currently line 1489, `member         user?       @relation("soul_won_member", ...)`),
add:

```prisma
  life_center_meeting_attendee life_center_meeting_attendee[]
```

- [ ] **Step 4: Add the two new models**

Immediately after the closing `}` of `model soul_won` (currently line 1493),
insert:

```prisma
model life_center_meeting {
  id             Int      @id @default(autoincrement())
  lifeCenterId   Int
  date           DateTime
  offeringAmount Decimal  @db.Decimal(10, 2)
  currency       String   @default("GHS")
  note           String?  @db.Text
  createdById    Int
  createdAt      DateTime @default(now())

  lifeCenter life_center                    @relation(fields: [lifeCenterId], references: [id])
  createdBy  user                           @relation("life_center_meeting_created_by", fields: [createdById], references: [id])
  attendees  life_center_meeting_attendee[]

  @@index([lifeCenterId], map: "life_center_meeting_lifeCenterId_idx")
  @@index([createdById], map: "life_center_meeting_createdById_idx")
}

model life_center_meeting_attendee {
  id           Int     @id @default(autoincrement())
  meetingId    Int
  soulWonId    Int
  isFirstTimer Boolean @default(false)

  meeting life_center_meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  soulWon soul_won            @relation(fields: [soulWonId], references: [id])

  @@unique([meetingId, soulWonId])
  @@index([meetingId], map: "life_center_meeting_attendee_meetingId_idx")
  @@index([soulWonId], map: "life_center_meeting_attendee_soulWonId_idx")
}
```

- [ ] **Step 5: Generate the migration SQL**

Run:

```bash
cd /Users/akwaah/Documents/GitHub/Backend
npx prisma migrate dev --create-only --name add_life_center_meeting
```

This creates a new folder under `prisma/migrations/` — rename it if the
timestamp doesn't match `20260805150000_add_life_center_meeting`, then replace
its `migration.sql` contents with:

```sql
-- CreateTable
CREATE TABLE `life_center_meeting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lifeCenterId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `offeringAmount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'GHS',
    `note` TEXT NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `life_center_meeting_lifeCenterId_idx`(`lifeCenterId`),
    INDEX `life_center_meeting_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `life_center_meeting_attendee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `meetingId` INTEGER NOT NULL,
    `soulWonId` INTEGER NOT NULL,
    `isFirstTimer` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `life_center_meeting_attendee_meetingId_soulWonId_key`(`meetingId`, `soulWonId`),
    INDEX `life_center_meeting_attendee_meetingId_idx`(`meetingId`),
    INDEX `life_center_meeting_attendee_soulWonId_idx`(`soulWonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `life_center_meeting` ADD CONSTRAINT `life_center_meeting_lifeCenterId_fkey` FOREIGN KEY (`lifeCenterId`) REFERENCES `life_center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `life_center_meeting` ADD CONSTRAINT `life_center_meeting_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `life_center_meeting_attendee` ADD CONSTRAINT `life_center_meeting_attendee_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `life_center_meeting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `life_center_meeting_attendee` ADD CONSTRAINT `life_center_meeting_attendee_soulWonId_fkey` FOREIGN KEY (`soulWonId`) REFERENCES `soul_won`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 6: Apply the migration and regenerate the client**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
npx prisma migrate dev
npx prisma generate
```

Expected: `The following migration(s) have been applied: ... add_life_center_meeting` with no errors, and `Generated Prisma Client` output.

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no new errors referencing `life_center_meeting`.

- [ ] **Step 8: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add prisma/schema.prisma prisma/migrations
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat: add life_center_meeting data model

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `LifeCenterMeetingService`

**Files:**
- Create: `src/modules/lifeCenterMangement/lifeCenterMeetingService.ts`

- [ ] **Step 1: Write the service**

```ts
import { prisma } from "../../Models/context";

export type NewFirstTimerInput = {
  title?: string;
  first_name: string;
  last_name: string;
  other_name?: string;
  contact_number: string;
  country_code?: string;
  contact_email?: string;
  country: string;
  city: string;
  date_won: Date;
  wonById: number;
};

export type CreateMeetingInput = {
  lifeCenterId: number;
  date: Date;
  offeringAmount: string;
  currency: string;
  note?: string | null;
  createdById: number;
  attendeeSoulWonIds: number[];
  firstTimerSoulWonIds: number[];
  newFirstTimers: NewFirstTimerInput[];
};

export type UpdateMeetingInput = Omit<CreateMeetingInput, "createdById">;

const ATTENDEE_INCLUDE = {
  attendees: {
    include: {
      soulWon: {
        select: { id: true, first_name: true, last_name: true },
      },
    },
  },
} as const;

export class LifeCenterMeetingService {
  private async replaceAttendees(
    meetingId: number,
    attendeeSoulWonIds: number[],
    firstTimerSoulWonIds: number[],
    newFirstTimers: NewFirstTimerInput[],
    lifeCenterId: number,
    fallbackWonById: number,
  ) {
    const createdFirstTimers = await Promise.all(
      newFirstTimers.map((soul) =>
        prisma.soul_won.create({
          data: {
            title: soul.title,
            first_name: soul.first_name,
            last_name: soul.last_name,
            other_name: soul.other_name,
            contact_number: soul.contact_number,
            country_code: soul.country_code,
            contact_email: soul.contact_email,
            country: soul.country,
            city: soul.city,
            date_won: soul.date_won,
            wonById: soul.wonById || fallbackWonById,
            lifeCenterId,
          },
        }),
      ),
    );

    // A soul id present in both lists is treated as a first-timer.
    const firstTimerIds = new Set<number>([
      ...firstTimerSoulWonIds,
      ...createdFirstTimers.map((s) => s.id),
    ]);
    const attendeeOnlyIds = attendeeSoulWonIds.filter(
      (id) => !firstTimerIds.has(id),
    );

    await prisma.life_center_meeting_attendee.deleteMany({
      where: { meetingId },
    });

    const rows = [
      ...attendeeOnlyIds.map((soulWonId) => ({
        meetingId,
        soulWonId,
        isFirstTimer: false,
      })),
      ...Array.from(firstTimerIds).map((soulWonId) => ({
        meetingId,
        soulWonId,
        isFirstTimer: true,
      })),
    ];

    if (rows.length) {
      await prisma.life_center_meeting_attendee.createMany({ data: rows });
    }

    return rows.length;
  }

  async createMeeting(data: CreateMeetingInput) {
    const meeting = await prisma.life_center_meeting.create({
      data: {
        lifeCenterId: data.lifeCenterId,
        date: data.date,
        offeringAmount: data.offeringAmount,
        currency: data.currency,
        note: data.note ?? null,
        createdById: data.createdById,
      },
    });

    const attendeeCount = await this.replaceAttendees(
      meeting.id,
      data.attendeeSoulWonIds,
      data.firstTimerSoulWonIds,
      data.newFirstTimers,
      data.lifeCenterId,
      data.createdById,
    );

    if (attendeeCount === 0) {
      await prisma.life_center_meeting.delete({ where: { id: meeting.id } });
      throw new Error("A meeting must have at least one attendee or first-timer");
    }

    return this.getMeetingById(meeting.id);
  }

  async updateMeeting(id: number, data: UpdateMeetingInput, actorId: number) {
    const existing = await prisma.life_center_meeting.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error("Meeting not found");
    }

    await prisma.life_center_meeting.update({
      where: { id },
      data: {
        lifeCenterId: data.lifeCenterId,
        date: data.date,
        offeringAmount: data.offeringAmount,
        currency: data.currency,
        note: data.note ?? null,
      },
    });

    const attendeeCount = await this.replaceAttendees(
      id,
      data.attendeeSoulWonIds,
      data.firstTimerSoulWonIds,
      data.newFirstTimers,
      data.lifeCenterId,
      actorId,
    );

    if (attendeeCount === 0) {
      throw new Error("A meeting must have at least one attendee or first-timer");
    }

    return this.getMeetingById(id);
  }

  async deleteMeeting(id: number) {
    const existing = await prisma.life_center_meeting.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error("Meeting not found");
    }
    await prisma.life_center_meeting.delete({ where: { id } });
    return existing;
  }

  async getMeetingById(id: number) {
    return prisma.life_center_meeting.findUnique({
      where: { id },
      include: ATTENDEE_INCLUDE,
    });
  }

  async getMeetings(filter: {
    lifeCenterId?: number;
    createdById: number;
    skip: number;
    take: number;
  }) {
    const where = {
      createdById: filter.createdById,
      ...(filter.lifeCenterId ? { lifeCenterId: filter.lifeCenterId } : {}),
    };

    const [total, meetings] = await Promise.all([
      prisma.life_center_meeting.count({ where }),
      prisma.life_center_meeting.findMany({
        where,
        include: ATTENDEE_INCLUDE,
        orderBy: { date: "desc" },
        skip: filter.skip,
        take: filter.take,
      }),
    ]);

    return { total, meetings };
  }

  async getEligibleFirstTimers(lifeCenterId: number) {
    return prisma.soul_won.findMany({
      where: {
        lifeCenterId,
        life_center_meeting_attendee: { none: {} },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        title: true,
      },
      orderBy: { first_name: "asc" },
    });
  }
}

export const lifeCenterMeetingService = new LifeCenterMeetingService();
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
npx tsc --noEmit
```

Expected: no errors in `lifeCenterMeetingService.ts`. If `life_center_meeting_attendee` is unrecognized on `soul_won`'s relation filter, re-run `npx prisma generate` (Task 1 Step 6) — the client must be regenerated after schema changes.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/lifeCenterMangement/lifeCenterMeetingService.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat: add LifeCenterMeetingService

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `LifeCenterMeetingController`

**Files:**
- Create: `src/modules/lifeCenterMangement/lifeCenterMeetingController.ts`

- [ ] **Step 1: Write the controller**

```ts
import { Request, Response } from "express";
import {
  lifeCenterMeetingService,
  NewFirstTimerInput,
} from "./lifeCenterMeetingService";

const toPositiveInt = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

const mapAttendee = (row: any) => ({
  soulWonId: row.soulWonId,
  name: [row.soulWon?.first_name, row.soulWon?.last_name]
    .filter(Boolean)
    .join(" "),
  isFirstTimer: row.isFirstTimer,
});

const mapMeeting = (meeting: any) => ({
  id: meeting.id,
  lifeCenterId: meeting.lifeCenterId,
  date: meeting.date,
  offeringAmount: meeting.offeringAmount,
  currency: meeting.currency,
  note: meeting.note,
  createdById: meeting.createdById,
  createdAt: meeting.createdAt,
  attendees: (meeting.attendees ?? []).map(mapAttendee),
});

const parseNewFirstTimers = (raw: unknown): NewFirstTimerInput[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry: any) => ({
    title: entry.title,
    first_name: entry.first_name,
    last_name: entry.last_name,
    other_name: entry.other_name,
    contact_number: entry.contact_number,
    country_code: entry.country_code,
    contact_email: entry.contact_email,
    country: entry.country,
    city: entry.city,
    date_won: new Date(entry.date_won),
    wonById: Number(entry.wonById),
  }));
};

export class LifeCenterMeetingController {
  async createMeeting(req: Request, res: Response) {
    try {
      const lifeCenterId = toPositiveInt(req.body?.lifeCenterId);
      if (!lifeCenterId) {
        return res.status(400).json({ message: "lifeCenterId is required" });
      }
      const createdById = Number((req as any).user?.id);

      const meeting = await lifeCenterMeetingService.createMeeting({
        lifeCenterId,
        date: new Date(req.body?.date),
        offeringAmount: String(req.body?.offeringAmount ?? "0"),
        currency: req.body?.currency || "GHS",
        note: req.body?.note ?? null,
        createdById,
        attendeeSoulWonIds: (req.body?.attendeeSoulWonIds ?? []).map(Number),
        firstTimerSoulWonIds: (req.body?.firstTimerSoulWonIds ?? []).map(Number),
        newFirstTimers: parseNewFirstTimers(req.body?.newFirstTimers),
      });

      return res
        .status(201)
        .json({ message: "Meeting created", data: mapMeeting(meeting) });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async updateMeeting(req: Request, res: Response) {
    try {
      const id = toPositiveInt(req.body?.id);
      const lifeCenterId = toPositiveInt(req.body?.lifeCenterId);
      if (!id || !lifeCenterId) {
        return res
          .status(400)
          .json({ message: "id and lifeCenterId are required" });
      }

      const existing = await lifeCenterMeetingService.getMeetingById(id);
      if (!existing) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      const currentUserId = Number((req as any).user?.id);
      const isPrivileged = (req as any).user?.user_category === "admin";
      if (!isPrivileged && existing.createdById !== currentUserId) {
        return res
          .status(401)
          .json({ message: "Not authorized to modify this meeting" });
      }

      const meeting = await lifeCenterMeetingService.updateMeeting(
        id,
        {
          lifeCenterId,
          date: new Date(req.body?.date),
          offeringAmount: String(req.body?.offeringAmount ?? "0"),
          currency: req.body?.currency || "GHS",
          note: req.body?.note ?? null,
          attendeeSoulWonIds: (req.body?.attendeeSoulWonIds ?? []).map(Number),
          firstTimerSoulWonIds: (req.body?.firstTimerSoulWonIds ?? []).map(
            Number,
          ),
          newFirstTimers: parseNewFirstTimers(req.body?.newFirstTimers),
        },
        currentUserId,
      );

      return res
        .status(200)
        .json({ message: "Meeting updated", data: mapMeeting(meeting) });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async deleteMeeting(req: Request, res: Response) {
    try {
      const id = toPositiveInt(req.query?.id);
      if (!id) {
        return res.status(400).json({ message: "id is required" });
      }

      const existing = await lifeCenterMeetingService.getMeetingById(id);
      if (!existing) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      const currentUserId = Number((req as any).user?.id);
      const isPrivileged = (req as any).user?.user_category === "admin";
      if (!isPrivileged && existing.createdById !== currentUserId) {
        return res
          .status(401)
          .json({ message: "Not authorized to delete this meeting" });
      }

      await lifeCenterMeetingService.deleteMeeting(id);
      return res.status(200).json({ message: "Meeting deleted" });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async getMeeting(req: Request, res: Response) {
    try {
      const id = toPositiveInt(req.query?.id);
      if (!id) {
        return res.status(400).json({ message: "id is required" });
      }

      const meeting = await lifeCenterMeetingService.getMeetingById(id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      const currentUserId = Number((req as any).user?.id);
      const isPrivileged = (req as any).user?.user_category === "admin";
      if (!isPrivileged && meeting.createdById !== currentUserId) {
        return res
          .status(401)
          .json({ message: "Not authorized to view this meeting" });
      }

      return res.status(200).json({ message: "OK", data: mapMeeting(meeting) });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getMeetings(req: Request, res: Response) {
    try {
      const lifeCenterId = toPositiveInt(req.query?.lifeCenterId);
      const page = toPositiveInt(req.query?.page) ?? 1;
      const take = toPositiveInt(req.query?.take) ?? 10;
      const createdById = Number((req as any).user?.id);

      const { total, meetings } = await lifeCenterMeetingService.getMeetings({
        lifeCenterId,
        createdById,
        skip: (page - 1) * take,
        take,
      });

      return res.status(200).json({
        message: "OK",
        current_page: page,
        page_size: take,
        total,
        totalPages: Math.ceil(total / take),
        data: meetings.map(mapMeeting),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getEligibleFirstTimers(req: Request, res: Response) {
    try {
      const lifeCenterId = toPositiveInt(req.query?.lifeCenterId);
      if (!lifeCenterId) {
        return res.status(400).json({ message: "lifeCenterId is required" });
      }
      const souls = await lifeCenterMeetingService.getEligibleFirstTimers(
        lifeCenterId,
      );
      return res.status(200).json({ message: "OK", data: souls });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/lifeCenterMangement/lifeCenterMeetingController.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat: add LifeCenterMeetingController

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Wire routes

**Files:**
- Modify: `src/modules/lifeCenterMangement/lifeCenterRoute.ts`

- [ ] **Step 1: Add the controller import and instance**

In `src/modules/lifeCenterMangement/lifeCenterRoute.ts`, after line 5
(`import { LifeCenterController } from "./lifeCenterController";`), add:

```ts
import { LifeCenterMeetingController } from "./lifeCenterMeetingController";
```

After line 12 (`const lifeCenterController = new LifeCenterController();`), add:

```ts
const lifeCenterMeetingController = new LifeCenterMeetingController();
```

- [ ] **Step 2: Add the meeting routes**

Immediately before the closing `export default lifeCenterRouter;` line
(currently line 135), add:

```ts
//life center meetings
lifeCenterRouter.post(
  "/meeting",
  [protect, permissions.can_manage_life_center_scoped],
  lifeCenterMeetingController.createMeeting,
);
lifeCenterRouter.put(
  "/meeting",
  [protect, permissions.can_manage_life_center_scoped],
  lifeCenterMeetingController.updateMeeting,
);
lifeCenterRouter.delete(
  "/meeting",
  [protect, permissions.can_delete_life_center],
  lifeCenterMeetingController.deleteMeeting,
);
lifeCenterRouter.get(
  "/meeting",
  [protect, permissions.can_view_life_center_scoped],
  lifeCenterMeetingController.getMeeting,
);
lifeCenterRouter.get(
  "/meetings",
  [protect, permissions.can_view_life_center_scoped],
  lifeCenterMeetingController.getMeetings,
);
lifeCenterRouter.get(
  "/soulswon-eligible-first-timers",
  [protect, permissions.can_view_life_center_scoped],
  lifeCenterMeetingController.getEligibleFirstTimers,
);
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Start the dev server (`npm run dev` or the project's existing local-run
command), then with a valid JWT for a user who is a `life_center_member` of
life center `1` with at least one `soul_won` row:

```bash
TOKEN="<paste a valid JWT>"

# Create
curl -s -X POST http://localhost:8080/lifecenter/meeting \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"lifeCenterId":1,"date":"2026-08-02","offeringAmount":"150.00","currency":"GHS","note":"<p>Good turnout</p>","attendeeSoulWonIds":[],"firstTimerSoulWonIds":[],"newFirstTimers":[{"first_name":"Ama","last_name":"Owusu","contact_number":"0200000000","country":"Ghana","city":"Accra","date_won":"2026-08-02","wonById":1}]}'
```

Expected: `201` with a `data` object whose `attendees` array has one entry
with `isFirstTimer: true`.

```bash
# List
curl -s "http://localhost:8080/lifecenter/meetings?lifeCenterId=1" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200`, `data` array containing the meeting just created,
`current_page: 1`, `total: 1`.

```bash
# Eligible first timers (should now EXCLUDE the soul just created above)
curl -s "http://localhost:8080/lifecenter/soulswon-eligible-first-timers?lifeCenterId=1" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200`, `data` array that does not contain "Ama Owusu".

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/lifeCenterMangement/lifeCenterRoute.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat: wire life center meeting routes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Frontend contract doc

**Files:**
- Create: `docs/LIFE_CENTER_MEETING_FRONTEND_IMPLEMENTATION_GUIDE.md`

- [ ] **Step 1: Write the contract doc**

```markdown
# Life Center Meeting — Frontend Implementation Guide

## 1. Scope

Endpoints for logging dated Life Center meetings: attendees, first-timers,
offering amount, optional note. All under `/lifecenter`.

## 2. API Endpoints

### 2.1 Create — `POST /lifecenter/meeting`

Body:
```json
{
  "lifeCenterId": 3,
  "date": "2026-08-02",
  "offeringAmount": "150.00",
  "currency": "GHS",
  "note": "<p>optional html</p>",
  "attendeeSoulWonIds": [12, 14],
  "firstTimerSoulWonIds": [21],
  "newFirstTimers": [
    { "first_name": "Ama", "last_name": "Owusu", "contact_number": "...", "country": "Ghana", "city": "Accra", "date_won": "2026-08-02", "wonById": 7 }
  ]
}
```
Auth: caller must be a `life_center_member` of `lifeCenterId` (any role) or a
privileged user with the `Life Center` manage permission. Response `201`.

### 2.2 Update — `PUT /lifecenter/meeting`

Same body as create, plus `"id"`. Fully replaces the attendee list. Only the
creator (or a privileged user) may update. `401` otherwise.

### 2.3 Delete — `DELETE /lifecenter/meeting?id=`

Only the creator (or a privileged user) may delete. `401` otherwise.

### 2.4 Get one — `GET /lifecenter/meeting?id=`

### 2.5 List ("My Meetings") — `GET /lifecenter/meetings?lifeCenterId=&page=&take=`

Always filtered server-side to the caller's own `createdById` — this is what
makes it "my" meetings, not a separate permission tier. Paginated envelope:
```json
{ "message": "OK", "current_page": 1, "page_size": 10, "total": 4, "totalPages": 1, "data": [ /* meetings */ ] }
```

### 2.6 Eligible first-timers — `GET /lifecenter/soulswon-eligible-first-timers?lifeCenterId=`

Souls won for that life center with zero prior meeting attendance. Backs the
"First timers" dropdown. The existing `GET /lifecenter/soulswon?lifeCenterId=`
(unfiltered) backs the "Attendees" dropdown — no change there.

## 3. Data shape

```ts
type MeetingAttendee = { soulWonId: number; name: string; isFirstTimer: boolean };
type Meeting = {
  id: number; lifeCenterId: number; date: string;
  offeringAmount: string; currency: "GHS" | "USD" | "GBP";
  note: string | null; createdById: number; createdAt: string;
  attendees: MeetingAttendee[];
};
```

## 4. Validation rules (match backend)

- `date` required, not in the future.
- At least one id across `attendeeSoulWonIds` + `firstTimerSoulWonIds` +
  `newFirstTimers` combined — a meeting with nobody recorded is rejected
  (`400`, "A meeting must have at least one attendee or first-timer").
- `offeringAmount` required, `>= 0`.
- `currency` one of `GHS` / `USD` / `GBP`.
- `note` optional.

## 5. Error handling

- `400` — validation failures (missing `lifeCenterId`, empty attendee list, etc).
- `401` — permission domain check failed, or ownership check failed on
  update/delete/get-one.
- `404` — meeting id not found.

## 6. Implementation checklist

- [ ] Frontend web: API layer + `MeetingsList`/`MeetingForm` + tabs on
      `ViewLifeCenter.tsx` and `MyLifeCenter.tsx`.
- [ ] Mobile: types + api + `MeetingRecordForm` + tab switcher on
      `LifeCenterScreen`.
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add docs/LIFE_CENTER_MEETING_FRONTEND_IMPLEMENTATION_GUIDE.md
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "docs: add life center meeting frontend contract

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Done criteria

- `npx tsc --noEmit` passes with no errors.
- The six manual `curl` checks in Task 4 Step 4 all return the expected
  status/shape against a local dev server.
- Migration applies cleanly via `npx prisma migrate dev` from a clean clone.
- Branch `feature/life-center-meetings` has 5 commits (schema, service,
  controller, routes, docs), ready to open a PR against `main`.
