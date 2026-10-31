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

---

## Phase 2 — question bank, rubrics, gradebook, certificates

Backend PR: WWW-Ministries-Project/Backend#489 · migration `20261017120000_som_lms_assessment_tools`

### Question bank

| Method | Path | Guard | Request | `data` |
|---|---|---|---|---|
| GET | `/question-bank` | manage | `?search&type&tag` | `BankQuestion[]` (500 newest) |
| POST | `/question-bank` | design | `BankQuestionPayload` | `BankQuestion` |
| PUT | `/question-bank` | design | `?id` + partial payload | `BankQuestion` |
| DELETE | `/question-bank` | design | `?id` | `{ id }` |
| POST | `/question-bank/add-to-unit` | design | `{ topicId, questionIds[] }` | `{ added, skipped, total }` |

```ts
type BankQuestion = {
  id: number; type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY"; prompt: string;
  options: { id: string; text: string }[] | null; correct_option_id: string | null;
  tags: string[] | null; difficulty: "EASY" | "MEDIUM" | "HARD";
};
```

`add-to-unit` only accepts quiz units (`assignment`) and only multiple-choice or true/false questions. Each question is
**copied** into `LearningUnit.data.questions` with new option ids and a `bankQuestionId`, so later bank
edits don't change quizzes. Questions already added (matched by `bankQuestionId`) are skipped.

### Rubrics

| Method | Path | Guard | Request |
|---|---|---|---|
| GET | `/rubrics` | manage | (each item has `usedBy`) |
| POST / PUT / DELETE | `/rubric` | design | `{ title, criteria: [{ id?, label, weight }], levels?: [{ id?, label, factor }] }`. Criterion weights must total 100. Levels default to Excellent 1 · Good 0.8 · Fair 0.6 · Poor 0.3 |
| PUT | `/unit-rubric` | design | `{ topicId, rubricId \| null }`. Essay units only |
| GET | `/submission` | manage | `?id` → `GradingSubmission` (submission, learner, unit prompt and pass mark, rubric) |
| PUT | `/grade-with-rubric` | manage | `{ submissionId, scores: { [criterionId]: levelId }, feedback? }` |

Rubric percentage = `Σ(weight × level factor) / Σ weight × 100`, rounded. The result is saved through the existing
`PUT /grade-assignment` path, which updates the submission and progress and notifies the learner. `rubric_scores` is stored on the submission.

### Gradebook

| Method | Path | Guard | Request | `data` |
|---|---|---|---|---|
| GET | `/gradebook` | manage | `?cohortId&courseId?` | `Gradebook` |
| PUT | `/grade-overrides` | manage | `{ topicId, enrollmentIds[], score?, excused?, clear?, note? }` | `{ updated }` |

Each cell's status is the first rule that applies:
1. `excused`
2. `overridden` (staff score)
3. `needs_grading` (latest submission is `SUBMITTED` or `RESUBMITTED`)
4. `graded` (completed progress)
5. `missing` (past the due date, or the extension date, with nothing submitted; counts as 0)
6. `open`

Weighted programs average each category, then renormalise the weights over the categories that have data.
Attendance is included once phase 3 provides it. `status` is `Completed`, `At risk` or `On track`, and `reasons[]` explains
any risk: 2+ missing, below the pass mark (weighted), a failed unit (pass/fail), or attendance below the minimum (75% when unset).

An override also writes `progress`: a score sets PASS or FAIL against the unit's pass mark, and an excusal counts as PASS. This keeps
completion and certificate eligibility in step with the gradebook. The first override on a cell saves the learner's earlier
progress row in `prev_progress`. `clear: true` restores that row exactly, or deletes the progress row if there wasn't one.
Every `enrollmentIds` entry must belong to the unit's program (otherwise `400`).

`grading.attendanceTracked` is `false` until session attendance is recorded (phase 3). While it is false, the attendance weight is left
out and the other weights are scaled up to 100%.

Essay submissions (`/submit-essay-assignment`) now reject a `fileUrl` that isn't `http(s)`.

### Certificates

| Method | Path | Guard | Request | `data` |
|---|---|---|---|---|
| GET | `/certificates` | manage | `?programId` | `{ issued: [{ id, certificateNumber, issuedAt, userId, name }], eligible: [{ userId, name, cohort, className }] }` |
| POST | `/certificates/issue` | design | `{ programId, userIds[] }` | `{ issued, results[] }` |

A learner is eligible when their first enrollment in the program (the one the issuing path checks) has passed every topic,
and they have no certificate yet. Issuing goes through
`EnrollmentService.getProgramCertificate`, the same path the learner uses, so numbering is unchanged. The PDF design
is still the server-rendered one: `GET /certificate/pdf?certificateNumber=`.

---

## Phases 3 and 4: teaching, enrollment review, instructors, content library, reports

Backend PR: WWW-Ministries-Project/Backend#490 · migration `20261018090000_som_lms_teaching_enrollment`

### Facilitator scoping (applies to phases 1–4)

The `manage` guard lets in admins with School-of-Ministry manage permission and also facilitators (`user.instructor`).
Facilitators are additionally limited to programs where they teach a class, or where they are on the program's instructor roster
with the matching ability:

| Endpoints | Ability needed |
|---|---|
| Gradebook, grading, overrides, schedule, extensions, certificates list | `can_grade` |
| Sessions and attendance | `can_attendance` |
| Announcements | `can_message` |

A facilitator who teaches in the program but isn't on its roster gets grade, attendance and message by default. Any other request returns `403`.

### Sessions & attendance

| Method | Path | Request | `data` |
|---|---|---|---|
| GET | `/sessions` | `?cohortId&courseId&from&to` | `LmsSession[]` with `expected`, `recorded`, `tally` |
| POST | `/session` | `{ cohortId, courseId?, title, starts_at, ends_at?, mode, location?, meeting_link?, week?, notes? }` | session |
| PUT | `/session` | `?id` + partial (also `cancelled`) | session |
| DELETE | `/session` | `?id` | `{ id }` |
| GET | `/session-attendance` | `?sessionId` | `{ session, learners[{ enrollmentId, name, classId, className, status, note }] }` |
| PUT | `/session-attendance` | `{ sessionId, records[{ enrollmentId, status, note? }] }` | same as GET |

- `mode` is one of `IN_PERSON`, `ONLINE`, `HYBRID`. Attendance `status` is one of `PRESENT`, `LATE`, `ABSENT`, `EXCUSED`.
- Attendance notes can be at most 191 characters (otherwise `400`).
- `GET /sessions`, `GET /applications` and `GET /instructors-overview` accept `branch_id`, which filters by the program's branch.
  The web client adds it automatically (`branchScope.ts`).
- A session with `courseId: null` covers every class in the cohort.
- `meeting_link` must be an http(s) URL.

**How attendance counts toward the gradebook:**
- Only past, non-cancelled sessions where attendance was taken are counted.
- `LATE` counts as attended. `EXCUSED` is left out.
- A learner with no record for a session that was taken counts as absent.
- `grading.attendanceTracked` becomes `true` once any attendance is taken, and the attendance weight then applies.
- A learner is at risk when attendance is below the program's `minAttendance`, or below 75% when no minimum is set.

### Announcements

| Method | Path | Request |
|---|---|---|
| GET | `/announcements` | `?cohortId` → newest first, with `delivery { status, counts }` from the messaging outbox |
| POST | `/announcement` | `{ cohortId, courseId?, audience: "COHORT" \| "CLASS" \| "AT_RISK", title, body, channels: { inApp, email, sms }, scheduledFor? }` |

- Delivery goes through the messaging module (`createGeneralDispatch`, audience `PEOPLE`). That module validates the channels, the schedule (must be in the future, within its limit) and the body length.
- `AT_RISK` resolves to the learners the gradebook marks as at risk, optionally limited to one class.

### Applications & review queue

| Method | Path | Guard | Request | `data` |
|---|---|---|---|---|
| POST | `/apply` | signed in (self) | `{ courseId, note? }` | `{ status: "ENROLLED", enrollmentId }` or `{ status: "PENDING", applicationId, reasons[] }` |
| GET | `/apply/eligibility` | signed in (self) | `?courseId` | `{ eligible, alreadyEnrolled, reasons[] }` |
| GET | `/applications` | design | `?status&programId` | `LmsApplication[]` |
| PUT | `/application/decide` | design | `{ id, decision: "APPROVE" \| "DECLINE", courseId?, note? }` | |

**Eligibility rules:**

| Program flag | The applicant must… |
|---|---|
| `member_required` | not be a guest |
| `leader_required` | head a department or hold a position |
| `ministry_required` | belong to a department |

Prerequisites and class capacity use the same rules as `POST /enroll`, which is unchanged. The member "Explore programs" page now uses `/apply`.

**Decisions:**
- `APPROVE` enrolls the applicant even when the class is full or a rule failed.
- `courseId` can move them to another class in the same program.
- The applicant gets an in-app notification for either decision.

### Instructors

| Method | Path | Guard | Request |
|---|---|---|---|
| GET | `/program-instructors` | manage | `?programId` → roster rows plus class instructors not on the roster (`onRoster: false`, `id: null`) |
| POST | `/program-instructors` | design | `{ programId, userIds[], can_grade?, can_attendance?, can_message?, can_edit_curriculum? }` |
| PUT / DELETE | `/program-instructor` | design | `?id` (+ abilities) |
| GET | `/instructors-overview` | design | → `InstructorOverview[]` |

Each overview row includes the instructor's live classes and learners, `toGrade` (essays waiting to be graded) and `avgGradingHours` (over the last 180 days).

### Content library

| Method | Path | Guard | Request |
|---|---|---|---|
| GET | `/library` | manage | `?search&type&tag` → items with `usedBy` |
| POST / PUT / DELETE | `/library-item` | design | `{ title, type, url, size_bytes?, duration_minutes?, pages?, tags? }`. PUT returns `unitsUpdated` |
| POST | `/library/use` | design | `{ itemId, programId, moduleId?, title? }` → `{ topicId, name }` |

How each item type becomes a unit:

| Item `type` | Unit |
|---|---|
| `VIDEO` | video `{ url }` |
| `PDF`, `DOCUMENT` | pdf `{ link }` |
| `SLIDES` | ppt `{ link }` |
| `IMAGE`, `LINK` | lesson note containing the image or link |

When an item's link, title or type changes, every unit created from it is rewritten (`version` + 1). Deleting an item keeps the units' content.

### Reports

| Method | Path | Guard | Request |
|---|---|---|---|
| GET | `/lms-reports` | design | `?branch_id&from&to` |

```ts
type LmsReports = {
  totals: { programs: number; enrollments: number; completed: number };
  completionByProgram: { programId: number; title: string; enrolled: number; completed: number; rate: number | null }[];
  attendanceByMode: { mode: "IN_PERSON" | "ONLINE" | "HYBRID"; records: number; rate: number | null }[];
  passRateByType: { category: "quiz" | "essay" | "exam"; graded: number; rate: number | null }[];
  gradingTurnaround: { graded: number; avgHours: number | null; medianHours: number | null; within4Days: number | null };
  enrollmentsByMonth: { month: "YYYY-MM"; count: number }[];
};
```
