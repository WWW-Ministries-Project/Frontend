# In-App Notifications: `actionUrl` + Triggered Actions

## Scope
- Delivery channel: in-app only.
- Real-time strategy: SSE.
- Toast policy: only `HIGH` / `CRITICAL` notifications show toast popups.

## Base Routes
- `GET /notifications`
- `GET /notifications/unread-count`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/:id/unread`
- `PATCH /notifications/read-all`
- `GET /notifications/stream-token` (short-lived token for native SSE)
- `GET /notifications/stream` (SSE)

All routes require bearer auth.

## Standard Notification Payload

```json
{
  "type": "string",
  "title": "string",
  "body": "string",
  "recipientUserId": "string",
  "actorUserId": "string | null",
  "entityType": "string | null",
  "entityId": "string | null",
  "actionUrl": "string | null",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL",
  "isRead": false,
  "createdAt": "ISO-8601 timestamp"
}
```

Notes:
- Backend can return snake_case; frontend normalizes both camelCase and snake_case.
- `actionUrl` can be internal (e.g. `/home/requests/abc`) or external (`https://...`).
- Requisition detail URLs use a base64-encoded requisition id in path: `/home/requests/{encodedRequisitionId}`.

## SSE Auth and Events

Native `EventSource` cannot send custom auth headers. Frontend uses:
1. `GET /notifications/stream-token` with bearer token.
2. `GET /notifications/stream?stream_token=<token>` with native `EventSource`.

Handled SSE event names:
- `connected`
- `heartbeat`
- `notification`
- `notification_updated`
- `notifications_read_all`
- `unread_count`

## `actionUrl` Templates by Domain

- Requisition: `/home/requests/{encodedRequisitionId}`
- Appointment (admin/staff): `/home/appointments`
- Appointment (member): `/member/appointments`
- Visitor/follow-up: `/home/visitors/visitor/{visitorId}`
- Events: `/home/events`
- Orders/payments/delivery: `/member/market/orders`
- System/admin jobs: `/home/dashboard` or `/home/notifications`

If `actionUrl` is missing, frontend falls back by `entityType`/`type` to the nearest route above.

## Implemented Action Types and Associations

| Action Type | Trigger | Primary Recipient(s) | Default Priority | actionUrl |
|---|---|---|---|---|
| `requisition.submitted` | Requisition submitted | First approver | `MEDIUM` | `/home/requests/{encodedRequisitionId}` |
| `requisition.step_advanced` | Approval moved to next step | Next approver | `MEDIUM` | `/home/requests/{encodedRequisitionId}` |
| `requisition.final_approved` | Final approval | Requester + configured watchers | `HIGH` | `/home/requests/{encodedRequisitionId}` |
| `requisition.final_rejected` | Final rejection | Requester + configured watchers | `HIGH` | `/home/requests/{encodedRequisitionId}` |
| `requisition.comment_added` | Comment added during approval | Requester/current approver | `MEDIUM` | `/home/requests/{encodedRequisitionId}` |
| `appointment.booked` | Appointment booked | Assigned staff | `MEDIUM` | `/home/appointments` |
| `appointment.status_changed` | Status changed (confirmed/cancelled/pending) | Requester (+ optional staff) | `MEDIUM` | `/member/appointments` |
| `follow_up.assigned` | Follow-up assigned | Assigned member | `MEDIUM` | `/home/visitors/visitor/{visitorId}` |
| `follow_up.due` | Follow-up due job | Assigned member | `HIGH` | `/home/visitors/visitor/{visitorId}` |
| `follow_up.overdue` | Follow-up overdue job | Assigned member | `HIGH` | `/home/visitors/visitor/{visitorId}` |
| `event.updated` | Event updated | Registered users | `MEDIUM` | `/home/events` |
| `event.cancelled` | Event cancelled | Registered users | `HIGH` | `/home/events` |
| `event.registration_success` | Registration completed | Registering user | `LOW` | `/home/events` |
| `order.payment_success` | Payment webhook/verification success | Order owner | `MEDIUM` | `/member/market/orders` |
| `order.payment_failed` | Payment webhook/verification failure | Order owner | `HIGH` | `/member/market/orders` |
| `delivery.status_changed` | Delivery status updated | Order owner | `MEDIUM` | `/member/market/orders` |
| `system.job_failed` | Reconciliation/notification processing failure | Admins | `CRITICAL` | `/home/dashboard` |

## Additional Recommended Actions Added

| Action Type | Why It Helps | Suggested Priority | actionUrl |
|---|---|---|---|
| `requisition.approval_reminder` | Prevents stalled approvals | `HIGH` | `/home/requests/{encodedRequisitionId}` |
| `requisition.escalated` | Flags SLA breaches and escalation | `HIGH` | `/home/requests/{encodedRequisitionId}` |
| `appointment.reminder_24h` | Reduces no-shows | `LOW` | `/member/appointments` |
| `appointment.no_show_recorded` | Notifies staff/requester of missed session | `MEDIUM` | `/home/appointments` |
| `follow_up.commented` | Keeps assignee informed of updates | `LOW` | `/home/visitors/visitor/{visitorId}` |
| `event.reminder_24h` | Improves attendance | `LOW` | `/home/events` |
| `order.refund_initiated` | Clarifies post-payment status | `MEDIUM` | `/member/market/orders` |
| `delivery.exception` | Requires quick owner action | `HIGH` | `/member/market/orders` |
| `system.notification_delivery_failed` | Alerts admins to pipeline breakage | `CRITICAL` | `/home/notifications` |

## Frontend Behavior Implemented

- Bell icon with unread badge in app header.
- Notification popover with:
  - recent notifications,
  - per-item mark read/unread,
  - mark all read,
  - deep-link open.
- Notification center page (`Unread` / `All`) at:
  - `/home/notifications`
  - `/member/notifications`
- Notification center fetch patterns:
  - `Unread` tab: `GET /notifications?unreadOnly=true&page=1&limit=20`
  - `All` tab: `GET /notifications?page=1&limit=20`
- SSE connection with reconnect backoff.
- Deduping on merge by `id`, then `dedupeKey`, then composite fallback identity.
