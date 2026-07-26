# Join-Department Ministry-Worker Eligibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block a member's department-join request when they have not completed the programs required to become a ministry worker; allow it when no such programs are defined.

**Architecture:** Backend enforces authoritatively by calling the existing `roleEligibilityService.assertEligible("ministry_worker", userId)` inside the join-request creation handler and returning a 422 with the missing-programs list. Frontend reacts to that 422 by rendering an inline banner in the Join-Department modal. No client-side eligibility computation — the backend is the single source of truth.

**Tech Stack:** Backend: Express + Prisma (TypeScript). Frontend: React + TypeScript + Vite. Neither repo has a test runner; verification is via TypeScript compile, lint, and manual API/UI checks.

**Repos:** Backend at `/Users/akwaah/Documents/GitHub/Backend`; Frontend at `/Users/akwaah/Documents/GitHub/Frontend` (this repo). Each repo commits on its own branch.

---

## Task 1: Backend — enforce ministry-worker eligibility in `createJoinRequest`

**Files:**
- Modify: `Backend/src/modules/departmentJoinRequests/joinRequestController.ts` (imports at top; `createJoinRequest` body ~124-241)

Reference pattern already in the codebase: `Backend/src/modules/departments/departmentController.ts:4-8` (imports), `:194-197` (assertEligible call), `:246-251` (catch guard). `assertEligible` returns without throwing when the role has no required programs (`roleEligibilityService.ts:534-543`), which satisfies "no programs defined → request proceeds".

- [ ] **Step 1: Add the eligibility-service imports**

In `joinRequestController.ts`, directly below the existing import block (after line 5, `import { notificationService } ...`), add:

```ts
import {
  buildRoleEligibilityFailureResponse,
  isRoleEligibilityValidationError,
  roleEligibilityService,
} from "../settings/roleEligibilityService";
```

- [ ] **Step 2: Call `assertEligible` before creating the request**

In `createJoinRequest`, insert the eligibility check between the pending-duplicate check and the `requester` lookup — i.e. after the `if (pending) { ... }` block that ends at line 190, before `const requester = ...` (line 192):

```ts
    await roleEligibilityService.assertEligible("ministry_worker", userId);

```

`userId` is already resolved and validated as a positive int at the top of the handler (lines 125, 129-131), so it is safe to pass here.

- [ ] **Step 3: Add the eligibility guard branch to the catch block**

Replace the existing catch block (lines 236-240):

```ts
  } catch (error) {
    return res
      .status(503)
      .json({ message: "Failed to submit join request", data: error });
  }
```

with:

```ts
  } catch (error: any) {
    if (isRoleEligibilityValidationError(error)) {
      return res
        .status(error.statusCode)
        .json(buildRoleEligibilityFailureResponse(error));
    }

    return res
      .status(503)
      .json({ message: "Failed to submit join request", data: error });
  }
```

The guard must come before the 503 fallback, otherwise the eligibility error is masked as a generic 503 and the missing-programs list is lost.

- [ ] **Step 4: Type-check the backend**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npm run transpile`
Expected: compiles with no new TypeScript errors in `joinRequestController.ts`.
(If `transpile` surfaces unrelated pre-existing errors, confirm none reference `joinRequestController.ts` or `roleEligibilityService`.)

- [ ] **Step 5: Manual API verification**

With the backend running (`npm run dev`), authenticate as a member and `POST department-join-request/create` with `{ "department_id": <OPEN dept id> }`:
- Eligibility rule `ministry_worker` has required programs the member has NOT completed → `422` with body `{ success:false, message, data:{ role_key:"ministry_worker", missing_programs:[{id,title}] } }`.
- Rule has empty `required_program_ids` OR no `ministry_worker` rule → `200` and the request is created.
- Member has completed all required programs → `200` and the request is created.

- [ ] **Step 6: Commit (in the Backend repo, on a fresh branch off `development`)**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
git checkout -b feat/join-department-eligibility development
git add src/modules/departmentJoinRequests/joinRequestController.ts
git commit -m "feat(join-request): enforce ministry-worker program eligibility on create

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Frontend — surface the 422 missing-programs feedback in the modal

**Files:**
- Modify: `Frontend/src/pages/HomePage/pages/DashBoard/Components/JoinDepartmentModal.tsx`

Current handler is at lines 37-57; state at 32-33; modal body renders at 76-143. The catch at lines 49-53 currently only reads `error.response.data.message`. The backend now also returns `error.response.data.data.missing_programs`.

- [ ] **Step 1: Add state for the missing-programs banner**

Below the existing state declarations (after line 33, `const [joinedIds, ...]`), add:

```tsx
  const [missingPrograms, setMissingPrograms] = useState<
    { id: number | string; title: string }[]
  >([]);
```

- [ ] **Step 2: Read the 422 payload in `handleJoin`**

Replace the `catch` block inside `handleJoin` (lines 49-53):

```tsx
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Unable to submit your request. Please try again.";
      showNotification(message, "error");
    } finally {
```

with:

```tsx
    } catch (error) {
      const data = (
        error as {
          response?: {
            data?: {
              message?: string;
              data?: {
                missing_programs?: { id: number | string; title: string }[];
              };
            };
          };
        }
      )?.response?.data;
      const message =
        data?.message || "Unable to submit your request. Please try again.";
      const missing = data?.data?.missing_programs ?? [];
      setMissingPrograms(missing);
      showNotification(message, "error");
    } finally {
```

- [ ] **Step 3: Render the inline banner at the top of the modal body**

Inside the `<div className="flex-1 space-y-4 overflow-y-auto p-6">` (line 76), immediately after that opening tag and before the `{loading ? (` expression, add:

```tsx
        {missingPrograms.length > 0 && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
            <p className="text-sm font-semibold text-primary">
              Complete these programs before joining a department
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-primaryGray">
              {missingPrograms.map((program) => (
                <li key={program.id}>{program.title}</li>
              ))}
            </ul>
          </div>
        )}
```

If `text-warning` / `bg-warning` are not defined in `tailwind.config.js`, use the existing error palette instead (e.g. `border-red-300 bg-red-50` and `text-red-700`) — check the config before choosing.

- [ ] **Step 4: Clear the banner on a successful join**

In the `try` block, after `setJoinedIds((prev) => [...prev, department.id]);` (line 48), add:

```tsx
      setMissingPrograms([]);
```

- [ ] **Step 5: Type-check and lint the frontend**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: no new TypeScript errors.
Run: `npm run lint`
Expected: passes with 0 warnings (lint runs `--max-warnings 0`).

- [ ] **Step 6: Manual UI verification**

With the frontend running (`npm run dev`), as a member who has NOT completed required ministry-worker programs: Dashboard → Quick Actions → "Join a Department" → click **Join** on any department. Expect the inline warning banner listing the missing program titles plus the error notification. As an eligible member (or with no rule configured), Join submits and shows the success notification with no banner.

- [ ] **Step 7: Commit (Frontend repo, on `feat/join-department-eligibility` — already created)**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add src/pages/HomePage/pages/DashBoard/Components/JoinDepartmentModal.tsx
git commit -m "feat(join-department): show missing required programs on eligibility rejection

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the implementer

- Do the Backend task first — the Frontend banner has nothing to display until the API returns the 422 shape.
- No new backend contract is introduced: the 422 body reuses `buildRoleEligibilityFailureResponse`, already used by the `departments`, `user`, and `lifeCenter` controllers.
- Do not add proactive client-side eligibility checks or extra fetches; that was explicitly rejected in the design to avoid duplicating backend logic.
- Each repo has its own branch and its own commit; open two PRs (default target `development` in both).
