# Copilot instructions — Frontend

Quick, actionable guidance for AI coding agents working on this repo (React + TypeScript + Vite).

## Quick start (dev & build)
- Install: `npm ci` or `npm install`
- Run development server: `npm run dev` (Vite, use `--host` for LAN)
- Build: `npm run build`; preview build with `npm run preview`
- Lint: `npm run lint` (ESLint); Husky + lint-staged auto-runs on commit via `prepare`

## Important environment variables
- API base URL: **`REACT_APP_API_URL`** (referenced in `src/pages/Authentication/utils/helpers.js`). Ensure it's set in the environment before running API calls.

## Big-picture architecture & important files
- App shell & routing: `src/routes/appRoutes.tsx` (routes declare `permissionNeeded`, `isPrivate`, and `sideTab` metadata used by `ProtectedRoute` in `src/routes/ProtectedRoutes.tsx`).
- API access: `src/axiosInstance.js` — single place that creates `instance` and `pictureInstance` and injects auth token via `getToken()` (from `src/utils/helperFunctions.ts`).
- Auth & session: token stored in a cookie named `token` (helper functions in `src/utils/helperFunctions.ts` and `src/pages/Authentication/utils/helpers.js`).
- Global UI utilities: `src/pages/HomePage/utils/helperFunctions.ts` exposes `showNotification`, `showLoader`, `showDeleteDialog` backed by `src/pages/HomePage/store/globalComponentsStore.ts` (Zustand stores).
- State & persistence: `src/store/userStore.ts` uses Zustand `persist` with `sessionStorage` (key: `user`) — do **not** assume localStorage.
- Hooks conventions: `src/CustomHooks/*` (e.g., `useFetch`, `usePost`, `useDelete`) follow a common return shape: `{ data, loading, error, refetch/postData }` and use `showLoader` / `showNotification` for UX.

## Project patterns & conventions (explicit)
- Path aliases: `@/*` and `@components/*` are configured in `tsconfig.json` — use these imports for consistency.
- Permissions model: server returns permissions that are converted by `convertPermissions` (`src/utils/helperFunctions.ts`) into boolean flags like `view_members` or `manage_members`. `permissionNeeded` in routes expects keys in this transformed format.
- Token flow: cookies hold `token` → `getToken()` reads cookie → axios interceptors add `Authorization: Bearer <token>` automatically (`src/axiosInstance.js`). When changing auth handling, update both `getToken()` and axios interceptors.
- File uploads: use `pictureInstance` (multipart/form-data) for endpoints that accept files.
- UI messaging: prefer the repo's `showNotification` and `showLoader` for errors/UX instead of adding ad-hoc toasts or console logs.

## How to add new API calls
- Add API functions under `src/utils/api/` (there's a README in that folder describing intent).
- Use existing hooks: wrap API calls with `useFetch`, `usePost`, or `useDelete` to get consistent loading/error behavior and automatic UX handling.

## Routing & permissions notes
- To protect a route, set `isPrivate: true` and `permissionNeeded` on the route object in `src/routes/appRoutes.tsx`.
- Use `ProtectedRoute` to enforce auth + permission checks; follow patterns in `appRoutes.tsx` when adding new sections.

## Developer workflow gotchas
- Mixed file extensions: project contains both `.tsx` and `.jsx` files; TypeScript `allowJs` is enabled but prefer `.tsx` for new components.
- No test runner configured — don't expect test-related scripts to exist.
- Environment variable access is via `process.env.REACT_APP_API_URL` in some files (note: Vite convention is `import.meta.env`; verify any env mismatch when debugging).

## Examples & references (copy-paste snippets)
- Check axios interceptors: `src/axiosInstance.js` (adds token header, exports `pictureInstance`).
- Permissions conversion: `convertPermissions` in `src/utils/helperFunctions.ts`.
- Hook usage example: `useFetch` returns `{ data, loading, error, refetch }` (see `src/CustomHooks/useFetch.tsx`).

---
If anything in this file looks incomplete or you want more examples (e.g., component-level patterns, common CSS/Tailwind utilities, or typical backend response shapes), tell me which area to expand and I'll iterate. ✅