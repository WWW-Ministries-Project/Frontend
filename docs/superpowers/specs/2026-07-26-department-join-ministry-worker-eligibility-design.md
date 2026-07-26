# Design: Gate Department-Join Requests on Ministry-Worker Program Eligibility

Date: 2026-07-26
Repos: `Frontend` (this repo) + sibling `Backend`

## Problem

When a member triggers "Join a Department", the system must first verify the
member has completed all programs required to become a ministry worker. If no
required programs are defined, the request proceeds. If required programs exist
and are not all completed, the request is rejected with feedback listing the
outstanding programs.

## Source of the rule

"Required programs to become a ministry worker" is the **role eligibility
config**, rule `role_key = "ministry_worker"` → `required_program_ids`.

- Configured by admins in Settings → Eligibility Rules.
- Read/write endpoints: `settings/get-role-eligibility-config`,
  `settings/upsert-role-eligibility-config`.
- Position-based rules (`position_rules`) are a **separate** role/position-change
  flow and are out of scope for join-department.

## Backend (authoritative)

The enforcement infrastructure already exists and implements the required
semantics — including "no required programs → proceed".

`roleEligibilityService.assertEligible("ministry_worker", userId)`:
- Resolves required programs for the role. If none defined → returns without
  throwing (request proceeds).
- Computes the member's completed programs (enrollment.completed, or all topics
  passed) and the set of missing required programs.
- Throws `RoleEligibilityValidationError` only when `missingPrograms.length > 0`.

### Edits — `Backend/src/modules/departmentJoinRequests/joinRequestController.ts`, `createJoinRequest`

1. Import from `../settings/roleEligibilityService`: `roleEligibilityService`,
   `isRoleEligibilityValidationError`, `buildRoleEligibilityFailureResponse`.
2. Insert **before** `prisma.department_join_request.create(...)` (after the
   pending-duplicate check, ~line 190), using the already-resolved `userId`:
   ```ts
   await roleEligibilityService.assertEligible("ministry_worker", userId);
   ```
3. In the `catch` block (currently returns a generic 503 for everything), add a
   guard branch **before** the 503 fallback:
   ```ts
   if (isRoleEligibilityValidationError(error)) {
     return res
       .status(error.statusCode) // 422 UNPROCESSABLE_ENTITY
       .json(buildRoleEligibilityFailureResponse(error));
   }
   ```
   Without this branch the eligibility error is masked as 503 and the missing-
   programs list is lost.

### Response contract on rejection (422)

```json
{
  "success": false,
  "message": "Member is not eligible for this role",
  "data": {
    "role_key": "ministry_worker",
    "missing_programs": [ { "id": 3, "title": "Foundations of Faith" } ]
  }
}
```

This is the existing `buildRoleEligibilityFailureResponse` shape, already used by
the `departments`, `user`, and `lifeCenter` controllers. No new backend contract
invented — this reuses the established pattern.

## Frontend (react to 422)

No client-side eligibility computation and no extra fetches — the backend is the
single source of truth and returns the exact missing list. This avoids logic
drift between the two repos.

### Edit — `Frontend/src/pages/HomePage/pages/DashBoard/Components/JoinDepartmentModal.tsx`

- Add state: `missingPrograms: { id: number | string; title: string }[]` and the
  server `message` (or a combined `eligibilityBlock` object), defaulting to empty.
- In `handleJoin`'s `catch`, detect the eligibility rejection: read
  `error.response?.data?.data?.missing_programs`. If present, set the state so the
  banner renders; still surface the server `message` via `showNotification`
  (error), matching current behavior.
- Render an inline banner at the top of the modal body when
  `missingPrograms.length > 0`: the server message plus a bulleted list of the
  missing program titles. Copy example: "Complete these programs before joining a
  department:" followed by the titles.
- The gate is global to the member (single `ministry_worker` rule), so one banner
  covers all departments; no per-card change is required beyond the existing
  disabled/loading states.
- On a successful join (or when the member later becomes eligible), the banner
  does not reappear because it is only set from a 422 response.

### Non-eligibility errors

Existing generic error handling is unchanged: any non-422 / non-eligibility error
still shows the fallback notification "Unable to submit your request. Please try
again." Only the eligibility 422 drives the banner.

## Out of scope

- Position-change eligibility (`position_rules`) — separate flow.
- Proactive pre-disabling of Join buttons via client-side eligibility computation
  (considered and rejected to avoid duplicating backend logic).
- Any change to the admin Eligibility Rules settings UI.

## Testing / verification

No test runner is configured in Frontend. Manual verification:
- Backend: with a `ministry_worker` rule that has required programs the member has
  not completed → `POST department-join-request/create` returns 422 with
  `missing_programs`. With no rule / empty `required_program_ids` → request
  succeeds. With all required programs completed → request succeeds.
- Frontend: clicking Join for a blocked member renders the inline banner listing
  the missing programs; an eligible member's request submits as before.
- Run `npx tsc --noEmit` in Frontend and `npm run lint`.
