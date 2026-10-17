# School of Ministry LMS — Backend Contract

Endpoints added for the School of Ministry LMS redesign. All are mounted under
`/program` on the API and return the `{ message, data }` envelope. Validation
failures are `400` and missing records `404`.

Guards:
- **protect**: any signed-in user
- **design**: `can_manage_school_of_ministry` (admins). Program structure and grading.
- **manage**: `can_manage_programs_or_facilitator` (admins and instructors). Running cohorts.

Frontend types live in `src/utils/api/ministrySchool/interfaces.ts`.

---

## Phase 1 — curriculum modules, grading model, due-date rules

Backend PR: WWW-Ministries-Project/Backend#488 · migration `20261017100000_som_lms_curriculum_grading`

### Modules

| Method | Path | Guard | Request | `data` |
|---|---|---|---|---|
| GET | `/modules` | protect | `?programId` | `{ modules: ProgramModule[], unassigned: ModuleTopic[] }` |
| POST | `/module` | design | `{ programId, title, description?, weeks? }` | `ProgramModule` (no `topics`) |
| PUT | `/module` | design | `?id` + `{ title?, description?, weeks? }` | `ProgramModule` |
| DELETE | `/module` | design | `?id` | `{ id }`. The module's units move to `unassigned` |
| PUT | `/reorder-modules` | design | `{ programId, modules: [{ id, order_number }] }` | same as `GET /modules` |
| PUT | `/topic-module` | design | `{ topicId, moduleId: number \| null, order_number? }` | `{ id, moduleId, order_number }` |

```ts
type ModuleTopic = {
  id: number; name: string; order_number: number | null; moduleId: number | null;
  LearningUnit: { id: number; type: string; due_rule: DueRule | null; grading_category: "quiz" | "essay" | "exam" | null } | null;
};
type ProgramModule = {
  id: number; programId: number; title: string; description: string | null;
  order_number: number; weeks: number | null; topics: ModuleTopic[];
};
```

Topic order is still program-wide (`topic.order_number`, set by `PUT /reorder-topics`).
The web client rewrites it to follow module order after every move, so the member
learning view, which sorts by `order_number`, shows units in module order.

`GET /program?id=` also returns `modules` (module rows without topics) and, on each topic, `moduleId`.

### Grading model

| Method | Path | Guard | Request | `data` |
|---|---|---|---|---|
| GET | `/grading` | protect | `?programId` | `ProgramGrading` |
| PUT | `/grading` | design | `?programId` + any of the fields below | `ProgramGrading` |

```ts
type ProgramGrading = {
  programId: number;
  grading_mode: "PASS_FAIL" | "WEIGHTED";              // default PASS_FAIL
  pass_mark: number;                                    // 0–100, default 50
  grading_weights: { quiz: number; essay: number; exam: number; attendance: number }; // must total 100 when WEIGHTED
  completion_rules: { requireGrade: boolean; requireAllUnits: boolean; minAttendance: number | null };
  auto_certificate: boolean;                            // default true
};
```

When unset, weights default to `30 / 40 / 20 / 10` and completion rules to `{ true, true, null }`.

### Unit settings

| Method | Path | Guard | Request |
|---|---|---|---|
| PUT | `/unit-settings` | design | `{ topicId, due_rule?: DueRule \| null, grading_category?: "quiz" \| "essay" \| "exam" \| null }` |

```ts
type DueRule =
  | { week: number; mode: "day"; day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun" }
  | { week: number; mode: "after"; days: number };
```

A cohort's date is derived from `cohort.startDate`, at 23:59 UTC:
- `day`: that weekday within week N, where week N starts `(N-1)*7` days after the start date.
- `after`: the start of week N plus `days`.

A `grading_category` of `null` falls back to the unit type: `assignment` → `quiz`, `assignment-essay` → `essay`.

### Cohort schedule & extensions

| Method | Path | Guard | Request | `data` |
|---|---|---|---|---|
| GET | `/cohort-schedule` | protect | `?cohortId` | `CohortSchedule` |
| PUT | `/cohort-due-date` | manage | `{ cohortId, topicId, dueDate: ISO \| null }` | `CohortSchedule`. `null` falls back to the rule. Does not open the assessment |
| POST | `/assignment-extension` | manage | `{ cohortId, topicId, enrollmentId, dueDate, reason? }` | extension row (upsert per learner and unit) |
| DELETE | `/assignment-extension` | manage | `?id` | `{ id }` |

```ts
type CohortSchedule = {
  cohortId: number; cohortName: string; startDate: string;
  rows: {
    topicId: number; learningUnitId: number; name: string; moduleId: number | null; type: string;
    category: "quiz" | "essay" | "exam" | null;
    rule: DueRule | null; ruleLabel: string;
    ruleDueDate: string | null;      // from the rule
    overrideDueDate: string | null;  // set only when the cohort date differs from the rule
    effectiveDueDate: string | null; // override ?? rule
    isActive: boolean; closedAt: string | null;
    extensions: { id: number; enrollmentId: number; learnerName: string; dueDate: string; reason: string | null }[];
  }[];
};
```

### Behaviour changes in existing endpoints

- `PUT /activate-cohort-assignment` with no `dueDate` keeps the cohort override if there is one. Otherwise it uses the rule date, or no due date if there is no rule. It used to throw.
- When a learner submits (`/submit-mcq-assignment`, `/submit-essay-assignment`), their extension replaces the cohort due date.
- `GET /program-completion-status` shows the learner's extension date in `activation.dueDate`.
