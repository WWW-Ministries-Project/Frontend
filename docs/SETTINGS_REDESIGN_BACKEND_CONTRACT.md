# Settings redesign — backend contract

Settings now has four pages: General configuration, Access rights, Users and Approvals. Most of them run on endpoints that already existed. This note covers only what was added or changed for the redesign. Every change is additive, so older clients keep working.

Branch scoping (`X-Branch-Id`, one role per branch) is described in `BRANCH_ACCESS_BACKEND_CONTRACT.md`.

## Branches

| Method | Path | Guard | Change |
|---|---|---|---|
| GET | `branch/list-branches` | signed in | Each item gains `member_count`, the number of people whose home branch it is. |
| PUT | `branch/set-default-branch` | Settings manage | **New.** Body `{ id }`. Makes that branch the default and clears the flag on every other branch. Returns `data`, the updated branch. An admin limited to some branches gets `403 BRANCH_FORBIDDEN` for a branch outside them. |

## Access levels (roles)

| Method | Path | Change |
|---|---|---|
| GET | `access/list-access-levels`, `access/get-access-level` | Items gain `created_at` and `updated_at`. |
| POST/PUT | `access/create-access-level`, `access/update-access-level` | `updated_at` is set on every create and update. Update also sets `updated_by`. |
| DELETE | `access/delete-access-level?id=&reassign_to=` | **New optional `reassign_to`.** Before the role is deleted, every branch grant and every legacy `access_level_id` that points to it moves to the `reassign_to` role. An unknown or deleted target returns 400. |
| POST/PUT | `permissions` payload | `Membership_Management` and `AI` are now accepted and saved. Before this change they were silently dropped. |
| GET | `access/assignable-users?include_inactive=true` | With `include_inactive=true`, deactivated accounts are listed too. Items gain `is_active`, `home_branch_id`, `home_branch_name` and `last_active_at`. |

## Users

New column: `user.last_active_at` (migration `20261028120000_user_last_active`). It is updated on `user/login` and `user/current-user`, at most once every 5 minutes, without waiting for the write. It is `null` until the user signs in after deploy.

| Method | Path | Guard | Body | Response `data` |
|---|---|---|---|---|
| POST | `user/give-access` | Access rights manage | `{ user_id, branch_id, access_level_id, send_invite? = true }` | `{ user_id, invited, branch_access[] }` |
| POST | `user/send-reset-link` | Members manage | `{ user_id }` | `{ user_id, email, expires_in: "15m" \| "7d" }` |

`give-access` does four things:
1. If the member doesn't have an account yet, runs the `ministry_worker` eligibility check. A failed check returns `422` with `missing_programs`.
2. Gives the member the role in the branch.
3. Turns on the account (`is_user`, `is_active`). This happens only after the role is saved, so a failed grant never leaves an admin account with no role.
4. Refreshes their session.
5. If `send_invite` is true, emails them a link to set a password: the 7-day welcome link for an account that was just turned on, or the 15-minute reset link for an existing one. An account with no stored password is first given a random one, because the reset endpoint needs a stored hash to check the link against.

If `send_invite` is true and the member has no real email address, the request returns 400. A branch outside the caller's own branches returns `403 BRANCH_FORBIDDEN`.

`send-reset-link` always sends the 15-minute reset link. It returns 400 when the account has no email address.

## Approvals

| Method | Path | Guard |
|---|---|---|
| GET | `event-reports/get-approval-config` | Events view |
| POST | `event-reports/upsert-approval-config` | Events manage |

These two routes are **restored**. The frontend already called them, but they had been removed together with the event-report sign-off flow. The config is stored in the `EVENT_REPORT` row of `requisition_approval_configs`; the finance approver goes in the `finance_*` columns.

Body:

```json
{
  "approvers": [{ "order": 1, "type": "HEAD_OF_DEPARTMENT" }, { "order": 2, "type": "POSITION", "position_id": 3 }],
  "finance_approver": { "type": "POSITION", "position_id": 7 },
  "notification_user_ids": [12],
  "is_active": true
}
```

The response has the same shape as the requisition config, plus `finance_approver`, and `requester_user_ids` is always `[]`. The validation rules are the same as for requisitions: steps are numbered 1..n, `POSITION` needs `position_id`, `SPECIFIC_PERSON` needs `user_id`, and `HEAD_OF_DEPARTMENT` takes neither.

> Known gap: nothing reads this config yet. Event reports are generated and have no sign-off flow at the moment. The settings are saved so they are ready when that flow comes back.

`requisitions/get-approval-config` gains `configured_requester_user_ids`: only the requesters chosen in the config. `requester_user_ids` still also includes everyone whose role can manage Requisition. Clients should save back the configured list, so that people added automatically don't become permanent requesters. If that list is empty, they fall back to the merged list.

The finance approval endpoints have not changed.
