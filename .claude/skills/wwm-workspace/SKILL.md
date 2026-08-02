---
name: wwm-workspace
description: Use when a task touches the WWM backend API or the WWM mobile app from inside the Frontend repo - resolves the sibling Backend and wwm-mobile repository paths, routes work to the correct repo, and coordinates cross-repo feature changes (new endpoint + web client + mobile client, permission changes, notification changes, API contract updates).
---

# WWM Multi-Repository Workspace

Three separate git repositories make up the World Wide Word Ministries platform. They are siblings on disk but **independent repos with independent branches, PRs, and CI**. This skill lets a session started in any one of them work across all three without losing track of which repo it is editing.

## Repository map

| Role | Path | Remote | Base branch for PRs |
|---|---|---|---|
| **Frontend** (web dashboard) | `/Users/akwaah/Documents/GitHub/Frontend` | `WWW-Ministries-Project/Frontend` | `development` |
| **Backend** (API) | `/Users/akwaah/Documents/GitHub/Backend` | `WWW-Ministries-Project/Backend` | `main` |
| **Mobile** (Expo/React Native) | `/Users/akwaah/Documents/GitHub/wwm-mobile` | `Akwaah/wwm-mobile` | `dev` — **never branch from `main`**, task branches are `codex/<task>` |

Also present: `/Users/akwaah/Documents/GitHub/Backend-expo-push` — a **second clone of the same Backend remote** parked on the `production` branch. It is not a separate project. Never edit it as if it were the mobile push service; if a task mentions push notifications, the code lives in `Backend/src` and `wwm-mobile/src/push.ts`.

### Verify paths before trusting this table

Paths are machine-specific. At the start of a cross-repo task, confirm:

```bash
for d in Backend wwm-mobile; do
  p="/Users/akwaah/Documents/GitHub/$d"
  [ -d "$p/.git" ] && echo "OK   $d -> $(git -C "$p" remote get-url origin) @ $(git -C "$p" branch --show-current)" || echo "MISS $d"
done
```

If a path is missing, ask the user where the repo lives rather than guessing or cloning.

## What each repo owns

**Backend** — the only source of truth for data. Express + Prisma (MySQL), single app, no microservices. Owns: the Prisma schema (`prisma/schema.prisma`, ~2100 lines, 130+ models), all endpoints (`src/modules/<domain>/{controller,routes,service}`), authorization (`src/middleWare/authorization.ts`, `checkPermission` + `PERMISSION_KEY_ALIASES`), cron jobs, S3/email/AI/web-push integrations. Read `Backend/CLAUDE.md` before editing.

**Frontend** — web dashboard for staff/admins. Vite + React + TypeScript + Tailwind + Zustand. Owns: admin surfaces, reports, finance, settings, permission administration. API calls live under `src/utils/api/<domain>/`, consumed through `src/CustomHooks/` (`useFetch`/`usePost`/…). Read `Frontend/CLAUDE.md`.

**Mobile** — member-facing Expo app. Owns: member self-service (market, appointments, life center, school), push receipt, cart/checkout deep-link flow. The whole app is a handful of large modules in `src/` (`screens.tsx`, `api.ts`, `ui-components.tsx`, `navigation.tsx`, `store.ts`, `utils.ts`) — there is no per-component file tree; find the section inside the file. Read `wwm-mobile/CLAUDE.md` **and** `wwm-mobile/AGENTS.md` (navigation and branch rules are enforced there).

Both clients talk to the same Backend. Neither client is authoritative about data shape — the Prisma schema and the controller are.

## Routing a task to the right repo

Decide by what actually changes, not by where the user noticed the problem:

- New/changed data, new endpoint, new permission domain, changed response shape → **Backend first**, then whichever clients consume it.
- Staff/admin screen, report, finance, settings UI → **Frontend**.
- Member-facing screen, tab visibility, push handling, deep link → **Mobile**.
- "The app shows the wrong value" → trace from the client's normalizer/API function back to the Backend controller before editing anything. The bug is often a Backend field name, not a client bug.
- Permission/access bug → check all three: `Backend/src/middleWare/authorization.ts` (`PERMISSION_KEY_ALIASES`), `Frontend/src/utils/accessControl.ts` (`convertPermissions`, `CANONICAL_PERMISSION_DOMAINS`), `wwm-mobile/src/utils.ts` (`canAccessMemberModule`, `DOMAIN_ALIASES`). These three alias maps drift apart — that drift is a recurring source of bugs.

State the target repo out loud before the first edit of a cross-repo task, e.g. "Backend: add endpoint. Frontend: add API fn + hook. Mobile: no change."

## Cross-repo working rules

**Boundaries are hard.** One branch, one commit, one PR **per repo**. Never stage files from two repos in one commit — they are different git roots, so this is impossible by accident but easy to attempt via `git -C`. Always pass `-C <repo path>` to git rather than `cd`-ing, so the working repo is explicit in the command.

**Branch per repo, per the table above.** Frontend PRs target `development`; Frontend CI blocks reopening a previously merged branch, so always cut fresh off `development`. Mobile branches off `dev` as `codex/<task>`. Backend targets `main` and CI runs `prisma migrate deploy` on every push to `main` — a merged migration hits the dev database immediately.

**Order of work for a feature spanning repos:**
1. Backend: schema/migration → service → controller → route + permission guard.
2. Write down the actual request/response shape you shipped (copy it from the controller, do not paraphrase).
3. Frontend: `src/utils/api/<domain>/` function → hook → UI.
4. Mobile: `src/api.ts` endpoint + a `normalize*` function → screen in `src/screens.tsx`.
5. Verify each repo separately (see below).

Deploy order matters: backend must be deployed before either client ships code that depends on the new shape. Mobile is worst-hit — users run old binaries, so **additive changes only** on any endpoint the mobile app consumes. Removing or renaming a response field breaks installed apps.

**Contract docs are the handoff artifact.** Agreed API shapes live in `Frontend/docs/*_BACKEND_CONTRACT.md` and `Backend/docs/*_FRONTEND_IMPLEMENTATION_GUIDE.md`. Read the relevant one before changing an endpoint; update it in the same PR when the shape changes. Do not invent a new doc format when one of these already covers the domain.

**Mobile clients must normalize.** Backend JSON is loosely shaped (envelopes, mixed camelCase/snake_case). In mobile, run every new endpoint response through the coercion helpers (`asArray`, `asRecord`, `toText`, `toNumber`) and a `normalize*` function rather than reading raw fields.

## Environment and API base URLs

Each repo reads the API host differently — do not copy one pattern into another:

| Repo | Variable | Notes |
|---|---|---|
| Frontend | `process.env.REACT_APP_API_URL` | **Not** `import.meta.env.VITE_*`; `vite.config.js` shims `process.env` from dotenv |
| Mobile | `process.env.EXPO_PUBLIC_API_URL` | Defaults to `https://dashboard.worldwidewordministries.org/` (`src/utils.ts`) |
| Backend | `PORT` (required, no default) | Plus `DATABASE_URL`, `SHADOW_DATABASE_URL`, `JWT_SECRET` |

Hosts: dev `https://dev.worldwidewordministries.org/`, prod `https://dashboard.worldwidewordministries.org/`. For local work, point the client env var at whatever `PORT` the Backend `.env` sets — the Dockerfile exposes `8000` while the Frontend `.env` has historically used `8080`, so confirm rather than assume.

## Verification per repo

There is no shared test runner. Verify in the repo you changed, and say which command you ran:

- **Frontend** — `npm run lint` (fails on any warning) and `npx tsc --noEmit` (pre-push typecheck is commented out, so run it manually).
- **Backend** — `npx tsc --noEmit`, or `npm run build`. No linter, no test runner configured — do not fabricate `npm test`.
- **Mobile** — `npx tsc --noEmit` (strict on; the only static gate). No linter, no test runner.

Run these with `-C`/`--prefix` or an absolute path so it is unambiguous which repo was checked, e.g. `npm --prefix /Users/akwaah/Documents/GitHub/wwm-mobile run …`.

## Reading another repo's code

Read freely across all three — cross-repo reading is the point of this skill. Reading `Backend/prisma/schema.prisma` or a controller is always cheaper and more reliable than guessing a field name from the client side.

Writing outside the repo the user is working in is different: it is fine when the task is explicitly cross-repo, but say which repo you are about to modify first. Do not make a "small fix" in Backend or Mobile as a side effect of a Frontend task without flagging it — a stray uncommitted change in a sibling repo is easy for the user to miss.
