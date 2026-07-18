# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install: `npm install` (or `npm ci`)
- Dev server: `npm run dev` (Vite; binds `--host` for LAN)
- Build: `npm run build` → outputs `dist/`
- Preview built app: `npm run preview`
- Lint: `npm run lint` (ESLint, `--max-warnings 0`)
- No test runner is configured. Do not add test scripts unless asked.

Husky `pre-commit` runs `lint-staged` (auto-fixes `.ts/.tsx` via ESLint). `pre-push` is currently a no-op (typecheck commented out); run `npx tsc --noEmit` manually to verify types.

## Environment

- API base URL is read from **`REACT_APP_API_URL`** (see `src/pages/Authentication/utils/helpers.js`). Vite's `vite.config.js` uses `define: { "process.env": env }` so `process.env.REACT_APP_API_URL` works at runtime — not the usual `import.meta.env.VITE_*` pattern.
- Auth token is stored in a cookie named `token` via `js-cookie`. Expiry is derived from the JWT `exp` claim (`setToken` in `src/utils/helperFunctions.ts`).

## Architecture

### App shell
Entry `src/main.tsx` wraps `<RenderRoutes />` in `ThemeProvider` → `BrowserRouter` → `AuthWrapper`, plus global singletons (`ScrollbarVisibilityManager`, `NotificationDeviceConnector`, `NotificationRealtimeConnector`, `NotificationCard`). PWA is registered via `virtual:pwa-register` only in `import.meta.env.PROD`.

`src/pages/HomePage/HomePage.tsx` is the authenticated shell (`<Outlet />` with sidebar/header). It bulk-fetches org data (branches, members-for-options, user stats, events, positions, departments) — all scoped by the active branch — and hydrates the Zustand stores that downstream pages read from.

### Routing & permissions
- Route table lives in `src/routes/appRoutes.tsx`. Each route object declares `permissionNeeded`, `isPrivate`, and `sideTab` metadata.
- `ProtectedRoute` (`src/routes/ProtectedRoutes.tsx`) enforces auth by reading the cookie via `getToken()` and calling `useAuth().logout()` when absent.
- Permission model: server permissions are canonicalized by `convertPermissions` / `flattenPermissionsToLegacyFlags` in `src/utils/accessControl.ts`. Domains are enumerated in `CANONICAL_PERMISSION_DOMAINS`; each maps to `view` / `manage` / `admin` actions. `permissionNeeded` in routes uses the transformed keys (e.g., `view_members`, `manage_members`).
- Some domains support extra qualifiers: `EXCLUSION_SUPPORTED_DOMAINS` (Members, Appointments) and `SCOPE_SUPPORTED_DOMAINS` (Departments, Church_Attendance — scope `assigned_departments`).

### API layer
- `src/axiosInstance.js` exports two clients: `instance` (JSON) and `pictureInstance` (multipart). Both share request/response interceptors that:
  - inject `Authorization: Bearer <token>` from `getToken()`
  - dispatch `window` CustomEvents on error: `app:session-expired` (401 w/ session marker), `app:access-denied` (401/403 w/ permission marker + active session), `app:rate-limited` (429, parses `Retry-After`), `app:server-error` (5xx).
  - Public auth paths (`/user/login`, `/user/register`, `/user/forgot-password`, `/user/reset-password`) are exempted from the access-denied dispatch.
- `changeAuth(token)` sets the default `Authorization` header on both clients — call it whenever the token changes.
- API functions are organized under `src/utils/api/<domain>/` (members, events, finance, notifications, etc.). New endpoints belong here, not inline in components.
- Every fetch hook is branch-aware: `useFetch` re-runs when `useBranchStore.activeBranchId` changes. `buildBranchQuery(activeBranchId)` yields `undefined` for `ALL_BRANCHES` or `{ branch_id }` otherwise — pass it as the query to any branch-scoped endpoint.

### Data hooks (`src/CustomHooks/`)
Consistent shape: `{ data, loading, error, refetch | postData }`. They wire in the global loader/notification for UX. Prefer these over raw `axios` in components:
- `useFetch(fn, query?, lazy?)` — GET with branch re-fetch
- `usePost` / `usePut` / `useDelete` — mutations
- `usePaginate` / `usePaginationQueryParams` — table pagination
- `useFileUpload` / `usePictureUpload` — go through `pictureInstance`
- `useAccessControl` — resolves `PermissionRequirement` against the current user
- `useWindowSize` — drives responsive sidebar collapse

### State
Zustand stores in `src/store/`:
- `userStore.ts` — persisted via `sessionStorage` (key `user`). **Not** localStorage.
- `useBranchStore.ts` — persisted via `sessionStorage` (key `branch-selection`); only `activeBranchId` is persisted. `ALL_BRANCHES` is the wildcard sentinel.
- `useStore.ts` — in-memory org data (member options, events, user stats).
- Per-feature stores also exist (e.g., `src/pages/HomePage/pages/Settings/utils/settingsStore`, `src/pages/HomePage/store/globalComponentsStore`).

### Global UI utilities
`src/pages/HomePage/utils/helperFunctions.ts` exposes `showNotification`, `showLoader`, `showDeleteDialog`, backed by `globalComponentsStore`. Use these instead of ad-hoc toasts, `alert`, or `console.log` for user-facing feedback. The corresponding UI (`Dialog`, `LoaderComponent`, `NotificationCard`) is mounted once at the shell level.

### Notifications
`src/features/notifications/` contains `NotificationDeviceConnector` (device registration) and `NotificationRealtimeConnector` (realtime subscription). Both mount at the app root in `main.tsx`. See `docs/DEVICE_NOTIFICATION_BACKEND_CONTRACT.md` and `docs/NOTIFICATION_ACTION_URLS_AND_TRIGGERS.md` for backend contracts.

### Backend
- **Repo:** https://github.com/WWW-Ministries-Project/Backend — sibling to this Frontend in the `WWW-Ministries-Project` org.
- API base URLs (`REACT_APP_API_URL` in `.env`): local `http://localhost:8080/`, dev `https://dev.worldwidewordministries.org/`, prod `https://dashboard.worldwidewordministries.org/`.
- `docs/*_BACKEND_CONTRACT.md` describes API shapes agreed with the backend team (department membership, event reports, module analytics, requisition notifications). Consult these before shipping API changes.

## Conventions

- Path aliases: `@/*` → `src/*`, `@components/*` → `src/components/*` (see `tsconfig.json` + `vite-tsconfig-paths`). Use them for new imports.
- Mixed `.tsx` / `.jsx` — TypeScript `allowJs` is on. Prefer `.tsx` for new files.
- `target: es5`, `strict: true`, `jsx: react-jsx`.
- Tailwind + `tailwind-merge` (`src/utils/cn.ts` for class composition). Custom theme is in `tailwind.config.js`.
- Rich text: `react-quill` + `@ckeditor/ckeditor5-react` (see `src/ckeditor-custom.css`). Sanitize HTML with `dompurify` before rendering server-supplied strings.
- Forms: Formik + Yup (`FormikInputDiv`, `FormikSelect`, `FormWrapperNew`).
- Document generation: `@react-pdf/renderer`, `jspdf`, `pdf-lib`, `docx`, `exceljs` — each is used in Reports/Finance/Certificate features.
- ESLint: `no-console: warn`, `@typescript-eslint/no-unused-vars` with `_` prefix ignored, `react/prop-types` off. `lint` fails on any warning (`--max-warnings 0`).

## Gotchas

- Env var access is `process.env.REACT_APP_API_URL`, NOT `import.meta.env.VITE_*` — Vite is configured to shim `process.env` from the loaded dotenv.
- The `token` cookie's expiry mirrors JWT `exp`; if you shorten JWT lifetimes on the backend, the cookie will follow.
- `HomePage` re-fetches every branch-scoped list when `activeBranchId` changes — avoid piling more `useFetch` calls into the shell unless they are truly global.
- CI blocks reopening a previously merged branch (`.github/workflows/prevent-branch-reuse.yml`) — always cut a fresh branch off `development`.
- Default PR target is `development`, not `main`.
