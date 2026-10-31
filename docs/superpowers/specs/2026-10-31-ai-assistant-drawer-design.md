# AI Assistant Drawer — Design Spec

**Date:** 2026-10-31
**Status:** Approved (design); Phase 1 to build
**Repos:** Frontend (`/Users/akwaah/GitHub/Frontend`), Backend (`WWW-Ministries-Project/Backend`)
**Source design:** Claude Design project "WWM frontend rebuild plan" — `Assistant.dc.html` (drawer) + AI-bot launcher added to `WWM-App-v2.dc.html`.

---

## 1. Summary

Build an **Assistant**: a right-side drawer with three tabs, launched by an animated **AI-bot** floating button. It **replaces** the existing `AiChatbotWidget`. The `AIConsole` page stays (credentials + usage admin).

Surfaces:
- **AI-bot launcher** — animated robot FAB (float/blink/antenna/ring/shadow + "Hi! Need a hand?" tooltip + overdue-count badge). Click opens the drawer to the **Ask** tab. Visible only when the drawer is closed.
- **For you** — aggregated actionable tasks across modules, grouped overdue / today / later-this-week; inline actions (approve, assign, generate, send-reminders-with-confirm, snooze); morning brief + progress bar; done/snoozed collapse with undo.
- **Updates** — feed built on the existing notifications system, with new `assistant.*` categories (done-for-you / status / announcement / access); read-state, mark-all-read.
- **Ask** — chat wired to the existing `/ai/chat` backend; suggestions, busy/error, idempotency; structured render via `AiStructuredMessage`; canned fallback when the model is unavailable.
- **Settings** — per-user reminder preferences (toggles + selects) and a proactive nudge toast.

Non-goals (this spec): member-facing bot (admin shell only — the Member Portal has no Assistant in the design); a real SMS-credits ledger (use the existing Hubtel path; drop the prototype's "uses N credits" wording).

---

## 2. Decisions locked

1. **Full build, phased.** Spec covers all 4 phases; implement Phase 1 first.
2. **Launcher + drawer replace `AiChatbotWidget`.** `AIConsole` page retained for credentials/usage.
3. **Updates extend the notifications infra** (`in_app_notification` + socket.io realtime) — no new transport.
4. **Task actions reuse existing module endpoints** — no action-proxy layer.
5. **SMS credits:** no credits system exists (SMS = Hubtel, preference-gated). Use `POST /pledges/remind-pledgers`; confirm dialog states real effect (sends SMS to N people), not fake credits.
6. **Member bot deferred** — not in the current design.

---

## 3. Phasing

### Phase 1 — Shell + Ask + bot launcher (FE-heavy, BE stub)
- `AssistantLauncher.tsx` (animated bot, reduced-motion, badge), `AssistantDrawer.tsx`, tab shell, `assistantStore` (Zustand).
- Ask tab wired to `api.post.sendAiMessage` (idempotency) + `AiStructuredMessage` + suggestions/busy/error + canned fallback.
- Updates tab reads `useInAppNotificationStore` (realtime already global via `main.tsx`).
- For-you tab renders against `GET /ai/tasks` returning `{ groups: [], summary }` — backend stub returns empty/partial so the UI is real but data is minimal.
- Replace `AiChatbotWidget` mount at `HomePage.tsx:193`; header "AI" nav/bell triggers open.
- Gate: `canView("AI")` + `hasAction("AI.chat")`.

### Phase 2 — Reminder prefs + nudge
- BE: `assistant_preference` table; `GET/PATCH /ai/preferences` (protect only, per-user upsert mirroring `notification_preference`).
- FE: Settings subview wired; nudge toast when overdue > 0 and nudges enabled; morning-brief copy.

### Phase 3 — Task aggregation (BE-heavy)
- BE: `GET /ai/tasks` aggregates actionable items for the current user across requisitions, finance, appointments, visitors, reports, pledges, assets — permission- and branch-scoped (`userHasBranchDomainPermission`, `getBranchScope`). New `AI.view_tasks` action (catalog BE + FE mirror).
- `assistant_task_state` table for per-user snooze/done; merged into the feed.
- Launcher badge + For-you counts become real.

### Phase 4 — Task actions + "done for you"
- FE wires inline actions to existing endpoints:
  - Approve requisition → `POST /requisitions/approval-action`
  - Approve expense → `POST /financials/approve-financial`
  - Appointment accept → `POST /appointment/bookings/:id/actions {action:"accept"}`
  - Visitor follow-up → `POST /visitor/followup` (assign) / `PUT /visitor/followup` (contacted)
  - Attendance submit → navigate to `/event/sign-attendance` flow
  - Pledge reminders → `POST /pledges/remind-pledgers` behind `showConfirmDialog`
  - Report generate → `POST /event-reports/generate` / exec summary
  - Asset reconciliation → `POST /assets/stock-checks/*`
- BE emits `assistant.done_for_you` via `notificationService.createInAppNotification` → appears in Updates.

---

## 4. Frontend architecture

New dir `src/pages/HomePage/Components/Assistant/`:
- `AssistantLauncher.tsx` — animated bot FAB. Props: `open`, `taskCount`, `onOpen`. SVG + CSS keyframes (float, blink, antenna, ring, shadow, tooltip). `@media (prefers-reduced-motion:reduce)` disables animation. Red badge when `taskCount > 0`. Hidden when `open` or on the AI-console page (mirror current `shouldHideOnPage`).
- `AssistantDrawer.tsx` — fixed right panel, dark header, tablist (For you / Updates / Ask with counts), body, Ask composer, toast slot, settings subview.
- `tabs/ForYouTab.tsx`, `tabs/UpdatesTab.tsx`, `tabs/AskTab.tsx`, `SettingsView.tsx`, `TaskCard.tsx`, `UpdateRow.tsx`.
- `useAssistant.ts` — hook over `assistantStore` + data wiring.

State — `src/store/assistantStore.ts` (Zustand, in-memory; reminder prefs persisted via BE in Phase 2, nudge-dismissed in `localStorage`):
`{ open, tab, signal, conversationId, msgs, draft, busy, taskState (optimistic snooze/done), toast }` + actions.

Styling: Tailwind + theme tokens (`cn`), not the prototype's inline styles. Dark header uses existing brand navy; match the prototype's structure/spacing.

Reuse:
- Chat: `api.post.sendAiMessage(payload, {idempotencyKey})`, `api.fetch.fetchAiChatbotConfig`, `AiStructuredMessage`, `AiChatResponse` shape.
- Updates: `useInAppNotificationStore` (`notifications`, `unreadCount`, `connected`, `markAsRead`, `markAllAsRead`, `loadMore`).
- Shell data: `useAuth().user` (name/role/permissions), `useBranchStore` (`activeBranchId`, `buildBranchQuery`), `useMemberOptions` (assignees).
- Gating: `useAccessControl` (`canView`, `hasAction`).
- Feedback: `notify.*`, `showConfirmDialog` (SMS step).

Idempotency: `crypto.randomUUID()` with fallback; `Idempotency-Key` header per chat POST; `lastFailedRequest` retry on 429/401 (match `AIConsole` pattern).

---

## 5. Backend architecture

Module `src/modules/ai/` (extend existing):
- Routes on `aiRoute.ts`, all `[protect, ...]`:
  - `GET /ai/tasks` — `[protect, requireAction("AI","view_tasks")]`. Phase 1 returns `{ summary:{total,overdue,done}, groups:[] }`. Phase 3 aggregates.
  - `GET /ai/preferences`, `PATCH /ai/preferences` — `[protect]` (per-user). Phase 2.
- New catalog action `AI.view_tasks` (level 1) in `src/permissions/catalog.ts` + FE mirror `src/utils/permissionCatalog.ts`.
- New services: `aiTaskService.ts` (aggregation), `aiPreferenceService.ts` (prefs upsert), `aiTaskStateService.ts` (snooze/done).
- Emit assistant updates via `notificationService.createInAppNotification({ type:"assistant.done_for_you", ... })`; register `assistant.*` types in `notificationPreferenceCatalog.ts` (new category "Assistant").

New Prisma tables (`prisma/schema.prisma`, MySQL; migration under `prisma/migrations/`, apply via `npm run migrate`):
- `assistant_preference` — `id`, `user_id`, `brief` `nudges` `quiet` `email_copy` (bool), `approval_after` `report_lead` `visitor_after` (string), timestamps. Unique `user_id`.
- `assistant_task_state` — `id`, `user_id`, `task_key` (string: `<source>:<entityId>`), `state` (enum `done|snoozed`), `snoozed_until?`, `label?`, timestamps. Unique `(user_id, task_key)`.

Aggregation contract (`GET /ai/tasks` response):
```
{ summary: { total, overdue, doneToday },
  groups: [ { key:"overdue"|"today"|"week", label, color, items: [ Task ] } ] }
Task = { id, source, type:"approval"|"report"|"followup"|"finance"|"asset",
         title, meta, why?, people?, group, actions:[{key,label,kind,endpointHint}],
         screen, state?:"done"|"snoozed" }
```
Each source query gated by the actor's `view` on that domain in the active branch; items the user cannot action are omitted.

---

## 6. Data flow

- **Open:** launcher `onOpen` → `assistantStore.open=true, tab='ask', signal++`. Drawer reads store. Esc/backdrop/close → `open=false`.
- **Ask:** submit → optimistic user msg + busy → `sendAiMessage` → append assistant msg (structured `display` or text) → canned fallback on empty/error; 429 shows quota + retry.
- **Updates:** store already hydrated globally; tab subscribes; realtime pushes new items; mark-read optimistic.
- **For you (P3+):** on open/tab → `GET /ai/tasks` (branch-scoped) → render groups; snooze/done optimistic → `assistant_task_state` → toast with undo.
- **Actions (P4):** call module endpoint → on success finish task + optional `assistant.done_for_you` emit → Updates reflects it.

---

## 7. Error handling

- Chat: provider 5xx/429 → 503/429 already mapped BE-side; FE shows friendly quota/retry; empty → canned fallback.
- Tasks: partial failure per source → return the sources that succeeded + `warnings[]`; never fail the whole feed on one module.
- Prefs: upsert idempotent; optimistic UI with rollback + `notify.error`.
- Updates: reuse store's optimistic rollback.
- Launcher badge: errors → badge hidden, never blocks UI.

---

## 8. Testing / verification

No test runner configured (per CLAUDE.md). Verify by:
- `npx tsc --noEmit` (types) + `npm run lint` (`--max-warnings 0`).
- Manual: drawer open/close, tab switch, Ask send + fallback, Updates realtime + mark-read, launcher animation + reduced-motion, gating hides for non-AI roles.
- Backend: `GET /ai/tasks` returns stub for an authed user; 403 without `AI.view_tasks`.

---

## 9. Open items carried forward

- SMS credits ledger — out of scope; revisit if the business wants real credit accounting (Phase 4 flag).
- Member-facing bot — deferred; member Portal has no Assistant in the current design.
- Streaming chat — backend `/ai/chat` is non-streaming; matches prototype. Future enhancement.
