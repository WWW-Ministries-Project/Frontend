# Event Report Backend Contract

## Goal
Support the new **Reports > Event Reports** feature with full data integrity, approvals, and notifications.

## Scope
One event report detail is keyed by:
- `event_id` (scheduled event instance)
- `event_date` (`YYYY-MM-DD`)

The report aggregates:
- department attendance breakdown
- church attendance summary (+ visitor count)
- finance summary (income/expense)
- multi-step approval flow ending with Executive Pastor final decision
- final-viewer notification list

## Required Endpoints

### 1) Get Event Report Detail
- `GET /event-reports/get-report?event_id={id}&event_date={yyyy-mm-dd}`
- If `event_date` is omitted, backend should return the latest report date for that event.

Response shape:
```json
{
  "data": {
    "event_id": 91,
    "event_name": "Sunday Service",
    "event_date": "2026-03-08",
    "departments": [
      {
        "department_id": 4,
        "department_name": "Ushering",
        "head_user_id": 122,
        "head_name": "Jane Doe",
        "attendees": [
          {
            "id": 88,
            "user_id": 451,
            "name": "Member One",
            "arrival_time": "2026-03-08T08:24:00.000Z"
          }
        ],
        "approval": {
          "status": "PENDING",
          "approved_by_user_id": null,
          "approved_by_name": null,
          "approved_at": null,
          "can_current_user_approve": false
        }
      }
    ],
    "church_attendance": {
      "adult_male": 120,
      "adult_female": 142,
      "children_male": 19,
      "children_female": 24,
      "youth_male": 35,
      "youth_female": 41,
      "visiting_pastors": 2,
      "visitors": 18,
      "approval": {
        "status": "PENDING",
        "approved_by_user_id": null,
        "approved_by_name": null,
        "approved_at": null,
        "can_current_user_approve": false
      }
    },
    "finance": {
      "income": [
        { "id": "inc-1", "name": "Tithe", "amount": 5000 }
      ],
      "expense": [
        { "id": "exp-1", "name": "Logistics", "amount": 1200 }
      ],
      "counting_leader_name": "John Doe",
      "finance_rep_name": "Mary Doe",
      "counting_leader_approval": {
        "status": "PENDING",
        "approved_by_user_id": null,
        "approved_by_name": null,
        "approved_at": null,
        "can_current_user_approve": false
      },
      "finance_rep_approval": {
        "status": "PENDING",
        "approved_by_user_id": null,
        "approved_by_name": null,
        "approved_at": null,
        "can_current_user_approve": false
      }
    },
    "final_approval": {
      "status": "WAITING",
      "approver_user_id": 700,
      "approver_name": "Executive Pastor",
      "acted_by_name": null,
      "acted_at": null,
      "can_current_user_submit": false,
      "can_current_user_approve": false
    },
    "final_viewers": [
      { "id": 21, "name": "Resident Pastor" },
      { "id": 22, "name": "Admin Officer" }
    ]
  }
}
```

### 2) Save/Update Finance Items
- `POST /event-reports/upsert-finance`

Payload:
```json
{
  "event_id": 91,
  "event_date": "2026-03-08",
  "income": [{ "name": "Tithe", "amount": 5000 }],
  "expense": [{ "name": "Logistics", "amount": 1200 }]
}
```

Rules:
- amounts must be non-negative numbers
- recompute and persist totals server-side
- return updated finance block

### 3) Department Approval Action
- `POST /event-reports/department-approval-action`

Payload:
```json
{
  "event_id": 91,
  "event_date": "2026-03-08",
  "department_id": 4,
  "action": "APPROVE"
}
```

Rules:
- only that department head can approve
- idempotent for repeated approve
- audit actor/timestamp

### 4) Church Attendance Approval Action
- `POST /event-reports/church-attendance-approval-action`

Payload:
```json
{
  "event_id": 91,
  "event_date": "2026-03-08",
  "action": "APPROVE"
}
```

Rules:
- enforce role-based approver(s)
- persist actor/timestamp

### 5) Finance Approval Action
- `POST /event-reports/finance-approval-action`

Payload:
```json
{
  "event_id": 91,
  "event_date": "2026-03-08",
  "role": "COUNTING_LEADER",
  "action": "APPROVE"
}
```

`role` values:
- `COUNTING_LEADER`
- `FINANCE_REP`

Rules:
- only mapped role owner can approve
- persist actor/timestamp

### 6) Submit for Final Approval
- `POST /event-reports/submit-final-approval`

Payload:
```json
{
  "event_id": 91,
  "event_date": "2026-03-08"
}
```

Rules:
- allow only when all prior approvals are complete:
  - all departments approved
  - church attendance approved
  - counting leader + finance rep approved
- move final state to `PENDING`
- notify current final approver(s) configured for `EVENT_REPORT`

### 7) Final Approval Action
- `POST /event-reports/final-approval-action`

Payload:
```json
{
  "event_id": 91,
  "event_date": "2026-03-08",
  "action": "APPROVE",
  "comment": "optional"
}
```

Rules:
- only current final approver can act
- on final decision, notify configured final viewers
- support both `APPROVE` and `REJECT`

## Settings > Approval > Report

Frontend now has a `Report` tab in Settings > Approval. It configures:
- **Who can give final approval?** (`approvers`)
- **Who should be notified after final approval?** (`notification_user_ids`)

Use the existing approval-config endpoints with module routing:
- `POST /requisitions/upsert-approval-config`
- `GET /requisitions/get-approval-config`

### Upsert Report Approval Flow
- `POST /requisitions/upsert-approval-config`

Payload for `Report` tab:
```json
{
  "module": "EVENT_REPORT",
  "requester_user_ids": [],
  "approvers": [
    { "order": 1, "type": "POSITION", "position_id": 12 },
    { "order": 2, "type": "SPECIFIC_PERSON", "user_id": 700 }
  ],
  "notification_user_ids": [21, 22, 37],
  "is_active": true
}
```

Contract rules:
- `module` must accept `EVENT_REPORT`.
- `approvers` defines the final approval chain and must be sequential by `order` (`1..N`).
- `APPROVER.type` rules:
  - `HEAD_OF_DEPARTMENT`: no `position_id` / no `user_id`
  - `POSITION`: requires `position_id`
  - `SPECIFIC_PERSON`: requires `user_id`
- `notification_user_ids` must be unique positive user IDs; these are the post-final-approval recipients.
- `requester_user_ids` is not used for report flow and can be accepted as an empty array for compatibility with shared payload shape.
- Only one `is_active=true` configuration should exist per module (`EVENT_REPORT`).

### Fetch Report Approval Flow
- `GET /requisitions/get-approval-config`

Response must include the `EVENT_REPORT` config in the returned module list.
Example:
```json
{
  "data": [
    {
      "id": 3,
      "module": "REQUISITION",
      "requester_user_ids": [11, 14],
      "approvers": [{ "order": 1, "type": "HEAD_OF_DEPARTMENT" }],
      "notification_user_ids": [9],
      "is_active": true
    },
    {
      "id": 8,
      "module": "EVENT_REPORT",
      "requester_user_ids": [],
      "approvers": [
        { "order": 1, "type": "POSITION", "position_id": 12 },
        { "order": 2, "type": "SPECIFIC_PERSON", "user_id": 700 }
      ],
      "notification_user_ids": [21, 22, 37],
      "is_active": true
    }
  ]
}
```

Optional alternative (if backend prefers module-specific namespace):
- `POST /event-reports/upsert-approval-config`
- `GET /event-reports/get-approval-config`

## Notification Events
Emit and register these events (same style as requisition):
- `event_report.submitted_for_final_approval` (to currently pending configured final approver(s))
- `event_report.final_approved` (to final viewers + optionally requester/owner)
- `event_report.final_rejected` (to final viewers + optionally requester/owner)

Minimum notification payload fields:
- `type`
- `entityType`: `event_report`
- `entityId`: report id or compound key identifier
- `actionUrl`: `/home/reports/event-reports/{event_id}?eventDate={yyyy-mm-dd}`
- `title`, `body`, `priority`, `dedupeKey`, `createdAt`

## Data Model Requirements

## `event_reports`
- `id`
- `event_id`
- `event_date`
- `status` (`DRAFT|PENDING_FINAL|APPROVED|REJECTED`)
- `final_approver_user_id`
- `final_acted_by_user_id`
- `final_acted_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- unique index on (`event_id`, `event_date`)

## `event_report_department_approvals`
- `event_report_id`
- `department_id`
- `status`
- `approved_by_user_id`
- `approved_at`
- unique index on (`event_report_id`, `department_id`)

## `event_report_attendance_approval`
- `event_report_id`
- `status`
- `approved_by_user_id`
- `approved_at`

## `event_report_finance`
- `event_report_id`
- `income_json`
- `expense_json`
- `total_income`
- `total_expense`
- `surplus`
- `updated_by_user_id`
- `updated_at`

## `event_report_finance_approvals`
- `event_report_id`
- `role` (`COUNTING_LEADER|FINANCE_REP`)
- `status`
- `approved_by_user_id`
- `approved_at`
- unique index on (`event_report_id`, `role`)

## `event_report_viewers`
- `event_report_id`
- `user_id`
- unique index on (`event_report_id`, `user_id`)

## Authorization Rules
- Department approval: only department head for that department.
- Church attendance approval: configured role/user for attendance approval.
- Finance role approvals: only assigned role owners.
- Submit final approval: report owner/admin or configured submitter.
- Final approval action: only currently pending approver(s) in active `EVENT_REPORT` approval config.

## API Response Requirements for Frontend
For each approval block return:
- `status`
- `approved_by_user_id`
- `approved_by_name`
- `approved_at`
- `can_current_user_approve`

For final approval return:
- `can_current_user_submit`
- `can_current_user_approve`

These booleans are required so frontend does not guess permissions.
