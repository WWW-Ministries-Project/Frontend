# Branch access — backend contract

Roles (access levels) are global. A user holds **one role per branch** (`user_branch_access`). An admin with no branch roles has no admin access. Everything an admin lists or saves is limited to the branches they hold a role in.

## Migration

`20261027120000_user_branch_access` creates the table and gives every current admin (`is_user` + a live `access_level_id`) their current role in **every existing branch**, so nobody loses access on deploy. Narrow it per user afterwards. `user.access_level_id` is kept in sync (home-branch role, else the first) for older code paths.

## Request scoping

Clients send the branch the user is working in:

```
X-Branch-Id: <branch id>     # omitted = "all of my branches"
```

The server reads `X-Branch-Id`, then `?branch_id=`, then body `branch_id`.

| Caller | Allowed branches | Lists without a branch | Creates without a branch |
|---|---|---|---|
| Admin with grants | their granted branches | `branch_id IN (granted)` | active branch, else first granted |
| Member | not limited | header branch if sent | header branch, else main branch |

- An admin naming a branch outside their grants gets `403 { code: "BRANCH_FORBIDDEN", message: "You don't have access to this branch" }`.
- Permissions follow the active branch's role. With no active branch, **view** needs the right in any branch; **manage/admin** need it in every branch.
- Implemented once in `getBranchScopedWhere`, `getRelationBranchScopedWhere` and `resolveBranchIdOrDefault` (`src/modules/branches/branchService.ts`), so every module already using them is covered.

## Session payloads

`user/login` JWT claims (no permission maps, to keep the cookie small):

```json
{ "branch_id": 1, "branch_access": [{ "branch_id": 1, "branch_name": "Hill City (Accra)", "access_level_id": 3, "access_level_name": "Platform Admin" }] }
```

`GET user/current-user` adds `branch_name` and per-branch `permissions`:

```json
{ "branch_id": 1, "branch_name": "Hill City (Accra)",
  "branch_access": [{ "branch_id": 1, "branch_name": "Hill City (Accra)", "access_level_id": 3, "access_level_name": "Platform Admin", "permissions": { "Members": "Super_Admin" } }] }
```

`user_category` is `"admin"` only when the user has at least one branch role.

## Endpoints

| Method | Path | Guard | Body / query | Response `data` |
|---|---|---|---|---|
| GET | `access/user-branch-access` | Access rights view | `?user_id=` | `{ user_id, home_branch_id, branch_access[] }` |
| PUT | `access/user-branch-access` | Access rights manage | `{ user_id, branch_id, access_level_id \| null }` (`null` removes that branch) | `{ user_id, branch_access[] }` |
| PUT | `access/assign_access_to_user` | Access rights manage | `{ user_id, access_level_id, branch_id? }` | `{ branch_access[] }` |
| PUT | `access/bulk-assign-access-level` | Access rights manage | `{ access_level_id, assign_user_ids?, unassign_user_ids?, branch_id? }` | unchanged |
| GET | `access/assignable-users` | Access rights manage | — | items gain `branch_access[]` |
| GET | `access/list-access-levels`, `access/get-access-level` | Access rights view | — | levels gain `grants[]` `{ user_id, name, email, is_active, photo, branch_id, branch_name }`; `users_assigned` is derived from grants |

Without `branch_id`, assignment endpoints apply to the active branch, else every branch the caller holds a role in. Granting in a branch the caller has no role in returns `403 BRANCH_FORBIDDEN`.

`branch/create-branch` and `branch/update-branch` now need Settings manage, `branch/delete-impact` needs Settings view and `branch/delete-branch` needs Settings admin. Before this change these routes were open to any signed-in user. An admin limited to some branches gets their current role in any branch they create.

## Known gaps

By-id reads and writes (`get-x?id=`, `update-x`, `delete-x`) that don't go through the shared helpers are not yet checked against the record's branch. `assertBranchAccessible(branchId)` in `branchService.ts` is available for modules to adopt.
