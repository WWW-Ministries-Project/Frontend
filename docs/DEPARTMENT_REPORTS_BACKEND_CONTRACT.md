# Department reports, executive summary and event report sign-off — backend contract

Backend module: `Backend/src/modules/departmentReports/` (mounted at `/department-reports`) and additions to `Backend/src/modules/eventReports/`.
Frontend: `src/pages/HomePage/pages/Reports/`, API in `src/utils/api/reports/interfaces.ts` + `apiFetch` / `apiPost` / `apiPut`.

All responses use the usual envelope `{ message, data }`. Errors: `400` validation, `401`/`403` permission, `404` unknown report, `409` wrong workflow state.

## Permissions

| Who | Rule |
|---|---|
| Read a department report | `Reports` view **or** view on the report's module (table below) |
| Head of department (edit commentary, submit) | manage on the report's module |
| Leadership (approve, return, decide requests, remind) | `Reports` admin |
| Executive summary | `Reports` view |
| Approve / return an event report | `Reports` admin or `Events` admin |
| Resubmit an event report | `Events` manage |
| Comment on an event report | `Events` view |

`Reports` is a new permission domain. It falls back to `Settings` (then `Access_rights`) on both sides — `PERMISSION_KEY_ALIASES` in the Backend and `DOMAIN_FALLBACKS` in `src/utils/accessControl.ts` — so existing Settings administrators keep access until an access level sets `Reports` explicitly.

| `report_key` | Module (permission domain) |
|---|---|
| `membership` | `Membership_Management` (→ `Members`) |
| `visitors` | `Visitors` |
| `events` | `Events` |
| `attendance` | `Church_Attendance` |
| `assets` | `Asset` |
| `finance` | `Financials` |
| `lifecenters` | `Life Center` |

## Periods

`period_type`: `WEEKLY | MONTHLY | QUARTERLY | ANNUAL | CUSTOM`. `period_key`:

| Type | Key | Example |
|---|---|---|
| WEEKLY | ISO week, Monday start | `2026-W42` |
| MONTHLY | year-month | `2026-09` |
| QUARTERLY | year-quarter | `2026-Q3` |
| ANNUAL | year | `2026` |
| CUSTOM | `from_to`, inclusive end, at most two years | `2026-08-01_2026-09-30` |

Omit `period_key` to get the last completed period. All dates are UTC. A report is **due five days after its period closes** (`due_date`) and is `overdue` when still `DRAFT` after that. `branch_id` is optional; omitted means the active branch from `X-Branch-Id`, or all branches the caller can see when there is none (workflow rows use `branch_key = 0` for that church-wide scope). Callers limited to some branches can read the church-wide report (it shows only their branches' numbers) but get `403` on any write to it — they work on their own branch's report.

## Report body (shared by list, detail and summary cards)

```ts
ApiReportBody {
  kpis: { key, label, value: number|null, display?: string|null,
          format: "n"|"pct"|"ghs"|"days"|"dec"|"signed"|"raw",
          compare: { prev: number|null, yoy: number|null },  // same metric, previous period / same period last year
          points?: boolean,                                   // show the delta in percentage points
          good: "up"|"down"|null, spark: number[],            // oldest → newest, selected period last
          sub?: string|null, provisional?: boolean }[]
  flags: { severity: "act"|"watch", text, link_label?, link_path? }[]   // link_path is an app path under /home
  highlights: string[]
  sections: ApiSection[]          // kind: bars | hbars | funnel | table | segments | heat | calendar | list | stats
  by_branch: ApiSection|null      // a table, only when all branches are selected and there are 2+
  headline: [number, number]      // kpi indexes for summary cards
  health: "ok"|"watch"|"act"      // act if any act flag, watch if any flag
  provisional_note: string|null
  empty: boolean
  restricted?: boolean            // caller lacks Members view; list items marked pii have title "Name hidden"
}
```

Section shapes are in `ApiSection` (`src/utils/api/reports/interfaces.ts`) and `SectionDTO` (`Backend/.../departmentReports/types.ts`); they must stay identical. Colours are hex/rgba strings from the design palette. Bodies are computed live and cached in memory for five minutes per report, period, branch and branch scope.

## Endpoints

### `GET /department-reports/list?period_type&period_key&branch_id`
Reports the caller can read, for the library page.
`data: { period, period_options, branch: {id, name}, viewer: { is_leadership, hod_of: report_key[] }, reports: DeptReportListItem[] }`
Each item: meta (`key, area, name, hod_role, cadence`), workflow summary (`status, status_label, overdue, due_date, submitted_at, approved_at, returned_at, prepared_by`), `health`, `headline: Kpi[]`, `failed`, `permissions`.
Each item also has `owner: { department_id, department_name, head: {id, name}|null } | null`, and `data` also has `department_attendance: DeptReportListItem[]` and `department_attendance_due_day` — see `WORKSPACES_AND_REPORT_CONFIG_BACKEND_CONTRACT.md` §2–3 (responsible department heads can prepare and submit; `dept_att:<id>` reports).

### `GET /department-reports/report?report_key&period_type&period_key&branch_id`
`data: { meta, period, period_options, branch, workflow, permissions, body, failed }`

```ts
period: { type, key, label, from, to, in_progress, due_date, prev_label, yoy_label }
period_options: { key, label, in_progress }[]   // last completed first, then in progress, then older
workflow: {
  id|null, status: "DRAFT"|"SUBMITTED"|"RETURNED"|"APPROVED", status_label, overdue, due_date,
  submitted_at, approved_at, returned_at, prepared_by: {id, name}|null,
  commentary: { wins, challenges, plans, testimonies },
  requests: { id, text, needs_decision, outcome: "APPROVED"|"RESPONDED"|null, response, decided_at, decided_by }[],
  trail: { action, who, when: ISO|string|null, note, done }[],   // includes "Draft pre-filled…" and a pending step
  comments: { id, author, author_id, when, text }[]
}
permissions: { can_edit, can_submit, can_approve, can_return, can_comment, can_decide, can_remind }
```
No workflow row is created by reading; it is created on the first write.

### Writes (all take `report_key, period_type, period_key, branch_id?`; all except remind return the same `data` as GET report)

| Method + path | Extra body | Who | Effect |
|---|---|---|---|
| `PUT /department-reports/commentary` | `wins?, challenges?, plans?, testimonies?, requests?: {id?, text, needs_decision}[]` | HOD, status DRAFT/RETURNED (else 409) | Saves; `requests` replaces undecided requests (decided ones are kept). Max 20. |
| `POST /department-reports/submit` | — | HOD, DRAFT/RETURNED, period ended (else 400) | → SUBMITTED; notifies Reports admins (`department_report.submitted`) |
| `POST /department-reports/approve` | — | Reports admin, SUBMITTED | → APPROVED; notifies HOD |
| `POST /department-reports/return` | `note` (required) | Reports admin, SUBMITTED | → RETURNED; note saved as a comment; notifies HOD |
| `POST /department-reports/comment` | `text` | anyone who can read | Adds a comment; notifies the other side |
| `POST /department-reports/remind` | — | Reports admin, DRAFT/RETURNED | Notifies the HOD (or everyone with manage on the module); `data: { sent_to }` |
| `POST /department-reports/requests/decide` | `request_id, decision: "APPROVE"|"RESPOND", response?` (required for RESPOND) | Reports admin, report SUBMITTED or APPROVED (else 409) | Records the outcome; a response is also posted as a comment; `data: { id, outcome, response }` |

Status changes are conditional updates (`where status in …`), so two people acting at once cannot both succeed; the loser gets `409`.

Notification types (in-app, catalogued under "Department reports"): `department_report.submitted | approved | returned | reminder | comment_added | request_decided`. `actionUrl` is `/home/reports/department/{key}?period_type=…&period_key=…[&branch_id=…]`.

### `GET /department-reports/executive-summary?period_type&period_key&branch_id`
`period_type` must be MONTHLY, QUARTERLY or ANNUAL.

```ts
data: {
  period, period_options, branch, viewer: { is_leadership }, empty,
  cards: { key, area, health, headline: Kpi[], status, status_label, overdue, prepared_by, failed }[],
  top: (Flag & { report_key, area })[],          // up to 5: first act flag per report (worst health first), then first watch flag
  tracker: { submitted, total, due_date, items: { report_key, area, prepared_by, status, status_label, overdue, submitted_at, returned_at, approved_at }[] },
  requests: { id, report_key, text, from, outcome, response }[],   // needs_decision only, undecided first
  pipeline: { label, value: number|null, sub }[],                  // visitors → souls won → new members → serving
  branches: { id, name, avg_sunday_attendance, visitors_per_100, new_members, giving_per_attendee,
              life_centers_meeting: "x of y"|null, reports_in: "n of 7" }[] | null   // all branches, 2+ only
}
```

## Event reports (additive changes)

Status mapping for the UI: `DRAFT`, `PENDING_FINAL` → "Pending approval"; `REJECTED` → "Returned"; `APPROVED` → "Approved". `POST /event-reports/generate` now creates reports as `PENDING_FINAL` and logs a `GENERATED` activity row.

- `GET /event-reports/overview` items gain `event_type, location, start_time, end_time, status_label, total_attendance, workers_present_pct` (metrics for the newest 300 rows). The `status` filter also accepts `pending` and `returned`.
- `GET /event-reports/get-report` gains `event_type, start_time, end_time, location, generated_at, available_dates[], report: { id, status, status_label, generated_at, generated_by_name, acted_at, acted_by_name }, trail: { action: GENERATED|APPROVED|RETURNED|RESUBMITTED, who, when, note }[], comments: { id, author, when, text }[], permissions: { can_approve, can_return, can_resubmit, can_comment }`.

| Method + path | Body | Effect |
|---|---|---|
| `POST /event-reports/approve` | `event_id, event_date` | DRAFT/PENDING_FINAL → APPROVED |
| `POST /event-reports/return` | `event_id, event_date, note` | DRAFT/PENDING_FINAL → REJECTED; note also saved as a comment |
| `POST /event-reports/resubmit` | `event_id, event_date` | REJECTED → PENDING_FINAL |
| `POST /event-reports/comment` | `event_id, event_date, text` | `201`, `data: { id, author, when, text }` |

Approve, return and resubmit return `{ event_id, event_date, report, trail, comments, permissions }`. State changes are conditional updates, so concurrent actions cannot both succeed.

## Database

Migration `20261029120000_department_reports`: `department_reports`, `department_report_comments`, `department_report_activity`, `department_report_requests`, `event_report_comments`, `event_report_activity`. User ids are plain columns (no foreign key to `user`).

## Known limits

- Some figures use today's state for past periods because history isn't stored (member active flag, profile completeness, department rosters, asset department/category, pledged amounts). Each aggregator lists these in its header comment.
- Design metrics without a data source were dropped rather than estimated (e.g. member net growth, visitor marital status, "Very late" punctuality, per-event offerings — replaced by event report finance income).
- PDF for department reports and the executive summary uses the browser's print to PDF; DOCX is generated in the browser. Event report PDF/DOCX are still rendered by the backend.
