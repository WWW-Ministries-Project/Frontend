# Branch delete impact — backend contract

The Settings → Branches delete dialog lists what is still attached to a branch
before the person confirms. The backend refuses to delete a branch that still
has scoped records, so the dialog checks first instead of failing after the click.

## `GET /branch/delete-impact?id=<branchId>`

Auth: `permissions.protect` (same as `/branch/delete-branch`).

`200`

```json
{
  "message": "Branch delete impact",
  "data": {
    "branch_id": 4,
    "name": "Osu",
    "is_default": false,
    "deletable": false,
    "blockers": [
      { "key": "members", "label": "412 members", "count": 412 },
      { "key": "departments", "label": "3 departments", "count": 3 }
    ]
  }
}
```

- `blockers` is empty for the default branch (it is never deletable) and for an
  empty branch.
- `label` is ready to show; the frontend renders it as "Still has 412 members."
- `key` values: `members`, `departments`, `assets`, `events`, `requisitions`,
  `event_reports`, `programs`, `visitors`, `life_centers`, `markets`,
  `annual_themes`, `receipt_configs`, `payment_configs`, `bank_accounts`,
  `tithe_breakdowns`, `financials`, `finance_approvals`, `availability`,
  `appointments`.

`400` missing id · `404` branch not found.

## `DELETE /branch/delete-branch?id=<branchId>` (changed)

When records are still attached it now answers **`409`** (was `400`) with the
same blockers so a stale dialog still explains itself:

```json
{
  "message": "This branch still has 412 members, 3 departments. Move them to another branch first.",
  "data": { "blockers": [{ "key": "members", "label": "412 members", "count": 412 }] }
}
```

Other responses are unchanged (`400` default branch, `404` not found, `200` deleted).
