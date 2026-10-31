# AI Assistant Drawer — Phase 1 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]`. **No test runner exists** (CLAUDE.md) — per-task verification is `npx tsc --noEmit` + `npm run lint` + manual, not unit tests.

**Goal:** Ship the Assistant drawer + animated AI-bot launcher (replacing `AiChatbotWidget`), with the Ask tab wired to `/ai/chat`, Updates from the notifications store, and a For-you tab backed by a backend `/ai/tasks` stub.

**Architecture:** New `src/pages/HomePage/Components/Assistant/` tree + `assistantStore` (Zustand). Reuse AI chat client, `AiStructuredMessage`, `useInAppNotificationStore`, `useAccessControl`, `notify`. Backend adds `GET /ai/tasks` (stub) + `AI.view_tasks` action.

**Tech Stack:** React 18 + TS, Zustand, Tailwind + `cn`, Express + Prisma (backend).

**Repos:** Frontend `/Users/akwaah/GitHub/Frontend` (branch `feat/ai-assistant-drawer`), Backend `/Users/akwaah/Documents/GitHub/Backend`.

---

## File structure

**Backend**
- Modify `src/permissions/catalog.ts` — add `["view_tasks",1]` to AI actions.
- Modify `src/modules/ai/aiRoute.ts` — add `GET /tasks` route.
- Modify `src/modules/ai/aiController.ts` — add `tasks()` handler (stub).

**Frontend**
- Modify `src/utils/permissionCatalog.ts` — mirror `view_tasks`.
- Create `src/utils/api/ai/tasksInterfaces.ts` — `AiTask`, `AiTaskGroup`, `AiTasksResponse`.
- Modify `src/utils/api/apiFetch.ts` — `fetchAiTasks()`.
- Create `src/store/assistantStore.ts` — drawer/chat/task UI state.
- Create `src/pages/HomePage/Components/Assistant/AssistantLauncher.tsx`.
- Create `src/pages/HomePage/Components/Assistant/AssistantDrawer.tsx`.
- Create `src/pages/HomePage/Components/Assistant/tabs/AskTab.tsx`.
- Create `src/pages/HomePage/Components/Assistant/tabs/UpdatesTab.tsx`.
- Create `src/pages/HomePage/Components/Assistant/tabs/ForYouTab.tsx`.
- Create `src/pages/HomePage/Components/Assistant/SettingsView.tsx`.
- Create `src/pages/HomePage/Components/Assistant/TaskCard.tsx`.
- Create `src/pages/HomePage/Components/Assistant/index.tsx` — mounts launcher + drawer, gating.
- Modify `src/pages/HomePage/HomePage.tsx:14,193` — replace `<AiChatbotWidget />` with `<Assistant />`.

---

## Backend tasks

### Task B1: Add `view_tasks` AI action
**Files:** Modify `src/permissions/catalog.ts` (AI block ~364-373).
- [ ] Add tuple `["view_tasks", 1]` to the AI `actions` array (level 1, non-explicit), after `query_data`.
- [ ] Verify: `grep view_tasks src/permissions/catalog.ts` shows the entry.
- [ ] Commit: `feat(ai): add AI.view_tasks permission action`.

### Task B2: `GET /ai/tasks` stub
**Files:** Modify `src/modules/ai/aiRoute.ts`, `src/modules/ai/aiController.ts`.
- [ ] In `aiRoute.ts`: add guard `const viewTasks = permissions.requireAction("AI","view_tasks","You don't have access to assistant tasks.");` and route `aiRouter.get("/tasks",[protect, ...viewTasks],(req,res)=>aiController.tasks(req,res));` (match existing spread style).
- [ ] In `aiController.ts`: add method
```ts
async tasks(req: Request, res: Response) {
  const summary = { total: 0, overdue: 0, doneToday: 0 };
  return res.status(200).json({ status: "success", data: { summary, groups: [], warnings: [] } });
}
```
- [ ] Verify: start dev or `npx tsc --noEmit`; authed `GET /ai/tasks` → `{data:{summary,groups:[]}}`; without `AI.view_tasks` → 403.
- [ ] Commit: `feat(ai): add /ai/tasks aggregation endpoint (stub)`.

---

## Frontend tasks

### Task F1: Mirror `view_tasks` in FE catalog
**Files:** Modify `src/utils/permissionCatalog.ts:404-413`.
- [ ] Add action `view_tasks` (level 1, label "View assistant tasks") to the `AI` block actions.
- [ ] Verify: `npx tsc --noEmit`.
- [ ] Commit.

### Task F2: AI tasks types + client
**Files:** Create `src/utils/api/ai/tasksInterfaces.ts`; modify `src/utils/api/apiFetch.ts`.
- [ ] `tasksInterfaces.ts`:
```ts
export type AiTaskType = "approval" | "report" | "followup" | "finance" | "asset";
export type AiTaskGroupKey = "overdue" | "today" | "week";
export interface AiTaskAction { key: string; label: string; kind: "approve" | "assign" | "generate" | "sms" | "open"; }
export interface AiTask {
  id: string; source: string; type: AiTaskType; title: string; meta: string;
  why?: string; people?: string[]; group: AiTaskGroupKey;
  actions: AiTaskAction[]; screen?: string; state?: "done" | "snoozed";
}
export interface AiTaskGroup { key: AiTaskGroupKey; label: string; color: string; items: AiTask[]; }
export interface AiTasksSummary { total: number; overdue: number; doneToday: number; }
export interface AiTasksResponse { summary: AiTasksSummary; groups: AiTaskGroup[]; warnings?: string[]; }
```
- [ ] `apiFetch.ts`: add `fetchAiTasks()` → `GET ai/tasks`, returning `ApiResponse<AiTasksResponse>` (match sibling `fetchAiUsageSummary` style + branch query via `buildBranchQuery`).
- [ ] Verify: `npx tsc --noEmit`.
- [ ] Commit.

### Task F3: assistantStore
**Files:** Create `src/store/assistantStore.ts`.
Shape:
```ts
type Tab = "tasks" | "updates" | "ask";
interface Msg { role: "user" | "ai"; text: string; display?: AiDisplay; intent?: string; }
interface AssistantState {
  open: boolean; tab: Tab; view: "main" | "settings"; signal: number;
  conversationId?: string; msgs: Msg[]; draft: string; busy: boolean;
  toast?: { text: string; undo?: () => void } | null;
  openTo: (tab?: Tab) => void; close: () => void; setTab: (t: Tab) => void;
  setView: (v: "main" | "settings") => void; setDraft: (s: string) => void;
  pushMsg: (m: Msg) => void; setBusy: (b: boolean) => void;
  setConversationId: (id?: string) => void; setToast: (t: AssistantState["toast"]) => void;
}
```
- [ ] Implement with `create<AssistantState>`. In-memory (no persist in P1).
- [ ] Verify: `npx tsc --noEmit`. Commit.

### Task F4: AssistantLauncher (animated bot)
**Files:** Create `.../Assistant/AssistantLauncher.tsx`.
- [ ] Port the bot from `WWM-App-v2.dc.html` added block: fixed `right-6 bottom-6 z-[100]`; SVG robot with `float/blink/antenna/ring/shadow` keyframes; tooltip "Hi! Need a hand?"; red badge when `taskCount>0`; `@media (prefers-reduced-motion:reduce)` disables animations. Props `{ taskCount: number; onOpen: () => void; hidden?: boolean }`. Inject keyframes via a scoped `<style>` (class prefix `wwm-bot-`). `aria-label="Ask the AI assistant"`.
- [ ] Verify: `npx tsc --noEmit`. Commit.

### Task F5: AssistantDrawer shell + tabs nav
**Files:** Create `.../Assistant/AssistantDrawer.tsx`.
- [ ] Fixed right panel (`top-3 right-3 bottom-3 w-[440px] max-w-[calc(100vw-24px)]`), dark navy header (title "Assistant", `branchName · dateLabel`, settings + close buttons), tablist (For you / Updates / Ask) with count pills, body container, renders `<ForYouTab/>`/`<UpdatesTab/>`/`<AskTab/>`/`<SettingsView/>` by store state, toast slot. Reads `useAssistantStore`, `useAuth().user`, `useBranchStore`. Counts: tasks from `/ai/tasks` summary (via ForYou data or 0), unread from `useInAppNotificationStore`.
- [ ] Verify: `npx tsc --noEmit`. Commit.

### Task F6: AskTab (wire to /ai/chat)
**Files:** Create `.../Assistant/tabs/AskTab.tsx`.
- [ ] Empty-state header + 4 suggestion buttons; message list (user bubble right, AI bubble left with `AiStructuredMessage` for `display` else text); "Thinking…" when busy; composer form with idempotency. Send: optimistic user msg → `api.post.sendAiMessage({message, model: default, conversation_id}, {idempotencyKey: uuid})` → append AI msg (`reply`/`display`), set `conversationId`. On empty/error → canned fallback text (port `canned()` intents: today/draft/shorter/visitors/report/other). 429 → `notify.warning` quota + keep draft. Footer disclaimer "Answers can be wrong. Check figures before you act on them."
- [ ] Verify: `npx tsc --noEmit`. Commit.

### Task F7: UpdatesTab
**Files:** Create `.../Assistant/tabs/UpdatesTab.tsx`.
- [ ] Read `useInAppNotificationStore` (`notifications`, `unreadCount`, `markAsRead`, `markAllAsRead`, `loadMore`, `hasMore`, `connected`). Filter segmented control (All / Done for you (`assistant.*`) / Announcements (`announce`/`system`)). Row: icon tile by type, title/body, `when · source`, unread dot; click marks read + navigates `actionUrl`. "Mark all read". Empty state.
- [ ] Verify: `npx tsc --noEmit`. Commit.

### Task F8: ForYouTab
**Files:** Create `.../Assistant/tabs/ForYouTab.tsx`, `.../Assistant/TaskCard.tsx`.
- [ ] On mount/open + branch change: `api.fetch.fetchAiTasks()`. Render morning-brief card (greeting + summary + progress from `summary`), filter segmented control, grouped `TaskCard`s. P1: actions render but `kind:"open"` navigates; approve/assign/generate/sms show a `notify.info("Available soon")` placeholder (real wiring = Phase 4). Empty → "You're all caught up". Loading + error states.
- [ ] `TaskCard.tsx`: type pill, title, meta, optional why/people, action buttons, snooze toggle (local only in P1).
- [ ] Verify: `npx tsc --noEmit`. Commit.

### Task F9: SettingsView (static P1)
**Files:** Create `.../Assistant/SettingsView.tsx`.
- [ ] Back button, toggles (Morning briefing / Nudges / Quiet hours / Email copy) + selects (approval after / report lead / visitor after) rendered from local state (persisted BE in Phase 2). "← Back" returns to main.
- [ ] Verify: `npx tsc --noEmit`. Commit.

### Task F10: Mount + retire widget
**Files:** Create `.../Assistant/index.tsx`; modify `HomePage.tsx:14,193`.
- [ ] `index.tsx`: `export const Assistant = () => {...}` — gate `const { canView, hasAction } = useAccessControl(); if(!canView("AI")) return null;`; hide on AI-console route (mirror `shouldHideOnPage`); render `<AssistantLauncher hidden={open} taskCount={overdueCount} onOpen={openTo}/>` + `{open && <AssistantDrawer/>}`.
- [ ] `HomePage.tsx`: replace import `AiChatbotWidget` (line 14) → `Assistant` from `./Components/Assistant`; replace `<AiChatbotWidget />` (line 193) → `<Assistant />`.
- [ ] Leave `AiChatbotWidget.tsx` file in place but unreferenced (delete in a follow-up once confirmed).
- [ ] Verify: `npx tsc --noEmit` + `npm run lint`. Commit.

### Task F11: Full verification
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run lint` passes (`--max-warnings 0`).
- [ ] Manual: `npm run dev` → launcher visible (admin, AI perm), animates, reduced-motion off; click → drawer opens Ask; send message (real or fallback); Updates shows notifications + mark-read; tab switch; non-AI role → nothing renders; AI-console page → launcher hidden.
- [ ] Commit any lint fixes.

---

## Self-review

- **Spec coverage:** launcher ✓(F4) drawer ✓(F5) Ask ✓(F6) Updates ✓(F7) For-you+stub ✓(F8,B2) settings-static ✓(F9) gating ✓(F10) replace-widget ✓(F10) catalog ✓(B1,F1) client/types ✓(F2) store ✓(F3). Phase 2-4 items intentionally excluded.
- **Placeholders:** action wiring in F8 is explicitly deferred to Phase 4 (documented), not a gap.
- **Type consistency:** `AiTasksResponse`/`AiTask` names identical across F2/F8; `Tab` union consistent F3/F5/F6/F7/F8.
