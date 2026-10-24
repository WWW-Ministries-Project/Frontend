# Home workspaces, report configuration and department attendance reports — backend contract

Design source: Claude Design project "WWM App v2" — `Workspaces.dc.html`, `Settings.dc.html` (role › Home workspaces, General configuration › Reports), `Reports.dc.html` (Department reports library).

All responses use the usual envelope `{ message, data }`. Branch scoping follows `BRANCH_ACCESS_BACKEND_CONTRACT.md` (`X-Branch-Id`, then `?branch_id=`).

---

## 1. Home workspaces on access levels

Workspace keys, in display order:

| key | Tab label | Question it answers |
|---|---|---|
| `prelate` | Prelate | Is the church healthy and growing? |
| `admin` | Administration | Is everything running? |
| `finance` | Finance | Where is the money, and what's waiting on me? |
| `hod` | My department | How is my team, and what do I need to do? |
| `generic` | Personal | What's happening for me? |

### Database

`access_level.workspaces Json?` — array of keys. `NULL` means "never set"; the server then derives a default:

| Rule (on the role's permissions) | Adds |
|---|---|
| `Reports` admin | `prelate` |
| `Settings` manage, or `Members` manage | `admin` |
| `Financials` manage | `finance` |
| `Departments` manage with scope `assigned_departments` | `hod` |
| nothing above matched | `generic` |

An explicit empty array `[]` is allowed and means "Home only".

### Reads

- `access/list-access-levels`, `access/get-access-level`: each level gains `workspaces: string[]` (stored, else derived) and `workspaces_default: boolean` (`true` when derived).
- `user/current-user`: every `branch_access[]` entry gains `workspaces: string[]` for that branch's role.

The client shows Home plus the workspaces of the active branch's role; with "All my branches" it shows the union across branches.

### Writes

- `access/create-access-level` and `access/update-access-level` accept optional `workspaces: string[]`. Unknown keys → `400`. Duplicates are dropped and the list is stored in canonical order. Omitting the field leaves it unchanged (create: `NULL`).
- `PUT access/access-level-workspaces` `{ id, workspaces: string[] }` → `data: { id, workspaces, workspaces_default: false }`. Guard: Access rights manage. Used by the role's "Home workspaces" tab so toggling a card doesn't resend the permission map.

---

## 2. Report configuration (Settings › General configuration › Reports)

### `GET settings/report-config` (Settings view)

```ts
{
  owners: Record<ReportKey, number | null>,   // department id responsible for each church-wide report
  dept_attendance: { due_day: number, disabled_department_ids: number[] },
  departments: { id: number, name: string, branch_id: number | null, branch_name: string | null,
                 head: { id: number, name: string } | null, members: number }[]
}
```

`ReportKey = "membership" | "visitors" | "events" | "attendance" | "assets" | "finance" | "lifecenters"`. Before anything is saved every owner is `null` and `due_day` is `5`. `departments` is limited to the caller's branches.

### `POST settings/upsert-report-config` (Settings manage)

Body: `{ owners?: Partial<Record<ReportKey, number|null>>, dept_attendance?: { due_day?: number, disabled_department_ids?: number[] } }`. `due_day` must be one of `1, 3, 5, 7, 10, 14`. Unknown department ids → `400`. Returns the same `data` as GET.

### Effect on church-wide department reports

- `prepared_by` defaults to the responsible department's head (instead of the generic `hod_role` label) until someone writes commentary.
- The head of the responsible department may edit commentary and submit, in addition to anyone with manage on the report's module.
- The list item gains `owner: { department_id, department_name, head: { id, name } | null } | null`.
- Submitting notifies the head of the responsible department's reviewers as before; reminders go to the responsible head when one is set.

The existing **Leave out of event reports** list (`settings/event-report-exclusions`) is unchanged and shown on the same page.

Implementation notes (Backend `src/modules/settings/reportConfigService.ts`, table `report_config`, migration `20261030130000_report_config`):

- `departments` follows the usual list scoping: the active branch (`X-Branch-Id` / `?branch_id=`) when one is selected, else every branch the caller can see. `members` counts the department's current roster (main department or a position in it).
- `owners` merges: only the keys sent change, `null` clears one. `disabled_department_ids` replaces the list. Only newly added department ids are validated (must exist and be in the caller's branches), so a branch admin can save the form back unchanged.
- When a report has no owner, or the owner department has no head, behaviour is as before (`hod_role` label; notifications go to whoever prepared it, else everyone with manage on the module).

---

## 3. Department attendance reports

Each department (not in `disabled_department_ids`) gets a **monthly** report of its own team's check-ins, pre-filled from attendance. The department head reviews, adds commentary and submits; leadership approves or returns it — the same workflow as church-wide reports.

- `report_key`: `dept_att:<department_id>` (fits the existing `VARCHAR(32)`).
- `period_type`: `MONTHLY` only (`400` otherwise).
- Due on `due_day` of the month after the period.
- Read: `Reports` view, `Departments` view, or the department's head. Edit/submit: the department's head, or `Departments` manage. Approve/return: `Reports` admin (unchanged).
- `Departments` view/manage honours the `assigned_departments` scope (only the caller's own departments), and `Reports` view / `Departments` access only reach departments in the caller's branches. The head always has access.
- `GET /department-reports/report` returns `branch` = the department's branch. `branch_id` is ignored for `dept_att:` keys; their workflow rows use `branch_key = 0`.
- `viewer.hod_of` in the list also includes the `dept_att:` keys the viewer may prepare.
- Member names (per-member table and the 2+ Sundays list) are shown to the head and to `Departments` viewers; others without `Members` view see "Name hidden".
- "Not checked in 2+ Sundays" = missed the last two or more Sunday services of the month in a row; the KPI is `null` when the month has fewer than two Sundays with check-ins. Only services that took check-ins count. The executive summary does not include department attendance reports.

### List

`GET /department-reports/list` gains:

```ts
department_attendance: DeptReportListItem[]   // same item shape as `reports`, key = "dept_att:<id>"
department_attendance_due_day: number
```

Only departments the viewer may read are included, and only when the selected period type is `MONTHLY` (otherwise the array is empty).

### Body

`GET /department-reports/report?report_key=dept_att:12&period_type=MONTHLY&period_key=2026-09` returns the standard `ApiReportBody`. KPIs: `Team members`, `Check-in rate` (pct, good up), `Services held`, `Not checked in 2+ Sundays`. Sections: weekly check-in rate (`bars`), per-member table (name, check-ins, last check-in, rate), and a `list` of members with no check-in for 2+ weeks. All writes (`commentary`, `submit`, `approve`, `return`, `comment`, `remind`, `requests/decide`) accept the `dept_att:` key.

---

## 4. Workspace data

### `GET workspaces/:ws?range=WEEK|MONTH|QUARTER|YEAR&branch_id=&department_id=`

`:ws` is one of the workspace keys. Guard: signed in **and** the key is in the caller's workspaces for the selected branch (or any branch when none) → else `403`. `department_id` is only read by `hod`; it must be a department the caller heads (defaults to the first).

```ts
WorkspaceResponse {
  ws: WorkspaceKey
  range: { key: "WEEK"|"MONTH"|"QUARTER"|"YEAR", label: string, compare_label: string, from: string, to: string }
  greeting_name: string
  departments?: { id: number, name: string, pack: "media"|"evangelism"|"children"|null }[]   // hod only: departments the caller heads
  needs: { key: string, label: string, count: number, widget: string, tab?: string }[]        // "Needs you" strip; count > 0 only
  widgets: Record<string, WidgetResult>   // only widgets the caller may see; missing = hidden, not locked
}
WidgetResult = { ok: true, data: <shape below> } | { ok: false, error: string }
```

A widget that fails is returned as `{ ok:false }` so the rest still render. Widgets whose module the caller can't view are **omitted**.

### Shared building blocks

```ts
Kpi   { key, label, value: number|null, format: "n"|"pct"|"ghs"|"signed"|"raw", delta_pct: number|null,
        points?: boolean, good: "up"|"down"|null, spark: number[], sub?: string }
Tone  = "success"|"warning"|"danger"|"info"|"neutral"
Pill  { tone: Tone, label: string }
QueueItem { id: string, kind: QueueKind, ref_id: number | string /* weekly records use string ids */, title, sub, amount?: number|null, pill?: Pill|null,
            detail?: { fields: [string,string][], text?: string, text_label?: string,
                       items?: { label, qty?: number|null, amount: number }[],
                       steps?: { label, who, state: "ok"|"cur"|"wait", when?: string }[] },
            selector?: { report_key, period_type, period_key, branch_id?: number } /* dept_report only: body for /department-reports/approve|return; branch_id omitted for church-wide (branch_key 0) */ }
// follow_up items also carry follow_up_id: number|null — the visitor's latest open follow-up, which the client completes instead of creating a new one
QueueKind = "requisition"|"dept_report"|"appointment"|"join_request"|"visitor"|"weekly_record"|"sermon"|"follow_up"
AgendaItem { date: string, title, sub, pill?: Pill|null, ref_id?: number }
ListItem   { title, sub?: string, pill?: Pill|null, right?: string|null, ref_id?: number }
BarRow     { label, value: number, max?: number|null, sub?: string|null }
```

Queue actions call the **existing** module endpoints with `ref_id` (requisition approve/reject, department report approve/return, appointment confirm, join request approve/decline, visitor assign, weekly finance record approve/return, sermon publish, follow-up record). The workspace endpoint only reads.

### Widgets per workspace

**prelate**

| id | Title | data |
|---|---|---|
| `p-hero` | State of the church | `{ lines: string[], theme: string|null, verse: string|null }` |
| `p-sign` | Waiting on you | `{ items: QueueItem[] }` (requisitions at the caller's step, submitted dept reports, pending appointment requests for the caller) |
| `p-kpi` | KPIs | `{ kpis: Kpi[] }` — avg service attendance, active members, souls won, net membership growth, total giving |
| `p-att` | Attendance trend | `{ events: {id,name}[], points: { label, total, by_branch?: {branch_id, branch_name, value}[] }[] }` (last 12 weeks; `?att_event=` selects one scheduled event) |
| `p-fun` | Growth funnel | `{ steps: { label, value }[] }` visitors → souls won → became members |
| `p-fol` | Visitors to follow up | `{ need_follow_up: number, unassigned: number, items: ListItem[] }` |
| `p-lc` | Life Centers health | `{ stats: { souls_won, became_members, active_centers, total_centers, avg_attendance, without_leader: {count, names}, no_meeting_2w: {count, names} }, top: BarRow[] }` |
| `p-som` | School of Ministry | `{ cohorts: { name, on_track: number, total: number }[] }` |
| `p-today` | My appointments today | `{ items: AgendaItem[] }` |
| `p-events` | Upcoming events | `{ items: AgendaItem[] }` (next 14 days, with registration fill) |

**admin**: `a-q` queue (requisitions, join requests, unassigned visitors), `a-rag` `{ columns: string[], rows: { department, cells: ("ok"|"sub"|"ret"|"miss"|null)[] }[] }` (all branches → columns are branches for the last month; one branch → last 4 months), `a-kan` `{ steps: { label, count, amount, overdue: number }[] }`, `a-ev` `{ rows: { title, date, registered: number|null, capacity: number|null, report: "none"|"draft"|"submitted"|"approved"|null, past: boolean }[] }`, `a-dep` `{ rows: { id, name, members, requests, head: string|null }[] }`, `a-ast` `{ needs_repair, needs_repair_without_req, lost, last_lost_at, stock_check_due: string|null }`, `a-com` `{ sent, delivered_pct: number|null, promotions_live }`, `a-log` `{ next_service: string|null, ride_requests, seats_offered, unmatched, orders_to_fulfil }`.

**finance**: `f-kpi` (giving, online giving, pledge fulfilment, requisitions approved), `f-q` queue (weekly records pending approval, requisitions at finance step), `f-wkt` `{ rows: { week_label, branch_name, status }[] }`, `f-opt` `{ rows: BarRow[] }`, `f-br` `{ rows: BarRow[] }` (all branches only; `sub` = per attendee), `f-ch` `{ rows: BarRow[] }` (single branch only), `f-rqd` `{ rows: BarRow[] }`, `f-pl` `{ pledged, paid, overdue_count, overdue_amount, campaigns: BarRow[] }`, `f-mkt` `{ revenue, orders, unpaid_orders, unpaid_amount, awaiting_collection }`.

**hod** (scoped to `department_id`): `h-kpi` (team members, new joins, check-in rate, requisitions in approval + amount), `h-join` queue, `h-att` `{ points: { label, rate }[] }` (last 8 Sundays), `h-abs` `{ items: ListItem[] }`, `h-req` `{ items: ListItem[] }`, `h-rep` `{ current: { period_label, status, due_date, key, period_key }, previous: { period_label, status, decided_at }|null }`, `h-ev` `{ items: AgendaItem[] }`, `h-pos` `{ items: ListItem[] }`, plus the pack for the department type — media: `m-ast` `{ items: ListItem[] }`, `m-ser` queue of draft sermons; evangelism: `e-g` queue of visitors to follow up, `e-s` `{ followed_up, pending, not_contacted }`, `e-f` `{ steps }`; children: `k-ast`, `k-ev` `{ items: AgendaItem[] }`. Pack is chosen from the department name (`media`, `evangel`, `child|kids`); other departments get no pack.

**generic** (the caller's own data): `g-prof` `{ pct: number, missing: string[] }`, `g-ev` `{ items: (AgendaItem & { registered: boolean, can_register: boolean })[] }`, `g-give` `{ year_total, month_total, month_delta_pct: number|null, pledge: { name, paid, amount, next_due: string|null, next_amount: number|null }|null }`, `g-appt` `{ items: AgendaItem[] }`, `g-ride` `{ service_label: string|null, item: ListItem|null }`, `g-grow` `{ life_center: ListItem|null, assignment: ListItem|null, course: BarRow|null }`, `g-req` `{ department: string|null, items: ListItem[] }`, `g-ser` `{ title, preacher, date, duration_min: number|null, id }|null`, `g-com` `{ items: ListItem[] }`, `g-not` `{ items: ListItem[] }`, `g-ord` `{ items: ListItem[] }`. `g-quick` is static on the client.

Every `needs[]` entry points at a widget id (and optional queue tab) so the client can scroll to it.

---

## Known limits

- Workspace numbers are computed on request (no cache). Each widget runs in its own `try` so one slow module doesn't fail the page.
- Department attendance reports exist for `MONTHLY` only.
- `a-com` message counts and `a-log` `next_service` are church-wide: messages carry no branch and the next ride day comes from the ride office's church-wide upcoming events, so neither follows the branch switcher.
- `GET /department-reports/list` with `MONTHLY` selected builds the attendance report for every department the caller can see (each cached 5 minutes per department), so the first load after the cache expires is slow on churches with many departments.
