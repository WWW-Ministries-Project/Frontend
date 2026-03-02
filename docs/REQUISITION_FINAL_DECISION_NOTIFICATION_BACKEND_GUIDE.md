# Requisition Final Decision Notifications: Backend Implementation Guide

This document specifies backend changes needed to support selecting multiple users to be notified when a requisition is finally approved or disapproved by the final approver.

## 1. Scope

Feature intent:
- Admin configures a list of users to notify.
- Backend stores that list as part of requisition approval configuration.
- Backend sends notifications only when the final approver takes the final decision:
  - final approval
  - final disapproval

Out of scope:
- UI selection behavior (already implemented in frontend).
- Notification template design details.

## 2. API Contract Changes

### 2.1 Upsert approval config

Endpoint:
- `POST /requisitions/upsert-approval-config`

Request payload (updated):

```json
{
  "module": "REQUISITION",
  "requester_user_ids": [11, 14, 19],
  "approvers": [
    { "order": 1, "type": "HEAD_OF_DEPARTMENT" },
    { "order": 2, "type": "SPECIFIC_PERSON", "user_id": 7 }
  ],
  "notification_user_ids": [5, 7, 22],
  "is_active": true
}
```

Contract notes:
- `notification_user_ids` is optional for backward compatibility.
- Treat missing `notification_user_ids` as empty array.
- Persist in canonical deduped order (or deterministic sorted order).

### 2.2 Fetch approval config

Endpoint:
- `GET /requisitions/get-approval-config`

Response requirement:
- Always return `notification_user_ids` as an array.
- If unset in DB, return `[]` (not `null`).

Example:

```json
{
  "data": {
    "id": 3,
    "module": "REQUISITION",
    "requester_user_ids": [11, 14, 19],
    "approvers": [
      { "order": 1, "type": "HEAD_OF_DEPARTMENT" },
      { "order": 2, "type": "SPECIFIC_PERSON", "user_id": 7 }
    ],
    "notification_user_ids": [5, 7, 22],
    "is_active": true
  }
}
```

## 3. Validation Rules

Apply during config upsert:
- `notification_user_ids` must be an array of positive integers.
- Remove duplicates (or reject with validation error; choose one policy and keep consistent).
- Every id should resolve to an active user.
- Optional guard: maximum recipients count (for example `<= 50`) to prevent accidental mass notify.

Recommended error shape:

```json
{
  "message": "Validation failed",
  "errors": {
    "notification_user_ids": "Must contain unique active user IDs."
  }
}
```

## 4. Data Model

Choose one storage pattern:

1. `integer[]` column on approval config (simple)
- Add `notification_user_ids integer[] not null default '{}'`.

2. Join table (more normalized)
- `requisition_approval_config_notifications(config_id, user_id)`.
- Unique index on `(config_id, user_id)`.

Either model is valid. If you already store requester ids/approvers in structured JSON/arrays, option 1 is usually fastest.

## 5. Final Decision Trigger Logic

Notifications should be dispatched from approval action flow:
- Endpoint: `POST /requisitions/approval-action`
- Actions: `APPROVE`, `REJECT`

### 5.1 Final decision definition

A decision is final only when the actor is the last configured approval step and the action closes the workflow.

Recommended condition:
- Load current pending step and max step order for that requisition.
- `is_final_step = current_step.order == max_step_order`
- Trigger notifications only if `is_final_step` is true and action is:
  - `APPROVE` (status becomes `APPROVED`)
  - `REJECT` (status becomes `REJECTED`)

Non-final approvals/rejections should not trigger this feature.

## 6. Transaction and Delivery Pattern

Use transactional write + async delivery:

1. In DB transaction:
- Validate actor authorization.
- Apply approval action and update requisition status.
- If final decision, create one notification event row:
  - `event_type`: `REQUISITION_FINAL_APPROVED` or `REQUISITION_FINAL_REJECTED`
  - `requisition_id`
  - `recipient_user_ids` (snapshot at event time)
  - `created_at`

2. Commit transaction.

3. Worker/queue sends notifications from event row.

This prevents sending notifications for rolled-back actions and supports retries safely.

## 7. Idempotency and Duplicate Protection

Avoid double-sending when retries happen:
- Add idempotency key or unique constraint for final-decision event:
  - unique on `(requisition_id, event_type)` or event UUID per state transition.
- Worker should mark event status (`PENDING`, `SENT`, `FAILED`) and retry safely.

## 8. Recipient Resolution Rules

Suggested runtime behavior:
- Base recipients: `approval_config.notification_user_ids`.
- Optional exclusions:
  - remove actor user id
  - remove duplicates
  - remove disabled/deleted users

If final recipient list is empty:
- Do not fail approval action.
- Log event as skipped (`NO_RECIPIENTS`) for auditability.

## 9. Backward Compatibility

Required compatibility behavior:
- Older clients can keep sending payload without `notification_user_ids`.
- Backend defaults missing field to `[]`.
- Existing configs without field continue working.

## 10. Acceptance Criteria

Implementation is complete when:

1. Upsert persists `notification_user_ids`.
2. Get-config returns `notification_user_ids` consistently as array.
3. Final approver `APPROVE` sends notification event to configured users.
4. Final approver `REJECT` sends notification event to configured users.
5. Non-final approver actions do not send final-decision notification events.
6. Duplicate send is prevented on retries.
7. Missing `notification_user_ids` payload does not break API.

## 11. Test Matrix (Minimum)

API tests:
- Upsert with valid `notification_user_ids`.
- Upsert with duplicates and invalid ids.
- Upsert without `notification_user_ids`.
- Get-config with legacy row (expect `[]`).

Workflow tests:
- Multi-step approval where step 1 approves: no final notification.
- Final step approves: send final approved notification.
- Final step rejects: send final rejected notification.
- Retry same final action request: only one notification event emitted.

## 12. Operational Logging

Add logs/metrics for observability:
- `requisition.final_decision_notification.created`
- `requisition.final_decision_notification.sent`
- `requisition.final_decision_notification.failed`
- `requisition.final_decision_notification.skipped_no_recipients`

Include:
- `requisition_id`
- `decision` (`APPROVED`/`REJECTED`)
- `recipient_count`
- `actor_user_id`

