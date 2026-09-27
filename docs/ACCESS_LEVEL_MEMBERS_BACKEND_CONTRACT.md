# Access Level Members — Backend Contract

Both endpoints require `can_manage_access` (Access_rights: Can_Manage or higher).

## GET `/access/assignable-users`

Active ministry workers (`is_user = true`, `is_active` true or null), ordered by name, with their current access level.

```json
{
  "message": "Operation successful",
  "data": [
    {
      "id": 12,
      "name": "Ama Mensah",
      "email": "ama@example.org",
      "member_id": "WWM-0012",
      "photo": "https://…",
      "access_level": { "id": 3, "name": "Membership Officer" }
    }
  ]
}
```

`access_level` is `null` when the user has none.

## PUT `/access/bulk-assign-access-level`

```json
{
  "access_level_id": 3,
  "assign_user_ids": [12, 15],
  "unassign_user_ids": [9]
}
```

- Both lists are optional, but at least one must be non-empty.
- A user id cannot appear in both lists (400, `data.conflicting_user_ids`).
- Assigning moves the user off any previous level (a user holds one level).
- Every assign id must be an existing ministry worker (400, `data.invalid_user_ids` / `data.non_ministry_worker_ids`).
- Unassign only clears users currently on `access_level_id`; others are ignored.
- Both writes run in one transaction.
- 404 if the access level does not exist or is soft-deleted.

Response 200:

```json
{
  "message": "Access level members updated successfully",
  "data": {
    "access_level": { "id": 3, "name": "…", "users_assigned": [ … ], "exclusion_users": { … } },
    "assigned_count": 2,
    "unassigned_count": 1
  }
}
```

`access_level` has the same shape as `GET /access/get-access-level`.
