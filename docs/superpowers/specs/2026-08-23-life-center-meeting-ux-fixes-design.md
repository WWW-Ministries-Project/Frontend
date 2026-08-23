# Life Center meeting UX fixes — design

Date: 2026-08-23
Repos: Frontend (this repo) + Backend (sibling repo, `WWW-Ministries-Project/Backend`)

## 1. Full-width Attendees/First-timers fields
**Frontend.** `MeetingForm.tsx:229,242` — add `md:col-span-2` to both field wrapper `div`s (same convention as the `Note` field at `MeetingForm.tsx:282`).

## 2. "Add new first timer" moves into the dropdown
**Frontend.** Add optional prop to `Multiselect.tsx`: `footerAction?: { label: string; onClick: () => void }`, rendered as a non-checkbox row at the bottom of the option list. `MeetingForm.tsx` passes `{ label: "+ Add new first timer", onClick: () => setShowAddFirstTimer(true) }` instead of today's link below the field. Existing modal/`SoulsWonForm` flow unchanged. Optional prop — `EventsScheduleForm.tsx`'s usage of `Multiselect` is unaffected.

## 3. Actions dropdown positioning (member portal "My Meetings")
**Frontend.** Root cause: `MeetingsList.tsx` uses the legacy `ActionButton`/`Action.tsx` pair, which renders the trigger icon and menu as unpositioned siblings plus an invalid Tailwind class `bottom-50%` (dropped by JIT) — no positioned ancestor, so the menu lands wherever the browser's fallback placement puts it.

`development` already has a proper fix for this shape of problem: `ActionsMenu.tsx` (portal-based, positions itself off the trigger's `getBoundingClientRect()`), adopted so far only by `MarketOrders.tsx`. Rather than patch the legacy shared component (which would touch 6 unrelated screens: `MarketCard`, `Visit`, `AllEventCard`, `LifeCenterRoles`, `SoulsWon`, `ProductDetailsCard`), migrate just `MeetingsList.tsx`'s Actions cell to `ActionsMenu`, matching the established `MarketOrders.tsx` pattern: build a `menuActions` array inline, gating Edit/Delete explicitly via `useRouteAccess()` (`canManageCurrentRoute`/`canAdminCurrentRoute`) since `ActionsMenu` has no built-in permission gating (unlike `Action.tsx`). Equivalent gate, derived from the current `requireManageAccess`/`requireAdminAccess`/`canManageHere` logic:
- `canEdit = accessMode === "route" ? canManageCurrentRoute : isLeadershipMember`
- `canDelete = accessMode === "route" ? canAdminCurrentRoute : isLeadershipMember`
- View: always shown (unconditional today too).

Other `ActionButton`/`Action` consumers are untouched — out of scope.

## 4. Gender field on Add-a-Soul form
**Backend:**
- Migration: `ALTER TABLE soul_won ADD COLUMN gender VARCHAR(191) NULL` (matches `user.gender` convention).
- Thread `gender` through `createSoulWon`/`updateSoulWon` (service + controller) and `mapSoulWonResponse`.

**Frontend:**
- `ISoulsWonForm` + Yup schema + `initialValues`: add `gender`.
- `SoulsWonForm.tsx`: add `Field component={FormikSelectField}` with the same `genderOptions` (Male/Female) used in `PersonalDetails.tsx`, placed right after the name fields.

## 5. View Meeting → full-screen page-like overlay
**Backend:**
- Expand `ATTENDEE_INCLUDE` select (`lifeCenterMeetingService.ts:33`) to include `contact_number, country_code, gender`.
- Expand `mapAttendee` (`lifeCenterMeetingController.ts:33`) to emit `phone: {number, country_code}` and `gender` alongside existing `soulWonId/name/isFirstTimer`.

**Frontend:**
- Replace the small view-modal body (`MeetingsList.tsx:244-301`) with a full-screen `Modal` (`className="max-w-none w-screen h-[100dvh] rounded-none"`).
- Header: date, offering amount, currency, note.
- Body: `TableComponent` over the combined attendee list. Columns: Name · Phone (`country_code number`) · Gender · Type (`Badge` "First Timer" when `isFirstTimer`, else "Member").
- Update `MeetingAttendeeType` to add `phone`/`gender`.

## 6. Flag icons not showing
**Frontend.** Root cause: flags are Unicode emoji glyphs (`country.flags.emoji` in `<span role="img">`); many OS/browser combos (notably Windows) lack emoji-flag fonts and render blank/text. Fix: add `flag-icons` npm package (self-hosted SVG, no CDN), import its CSS once, replace the emoji span in `ContactInput.tsx:127-133` with `<span className={`fi fi-${country.countryCode.toLowerCase()}`} />`. `countryCode` (ISO cca2) already exists on `countryType` — no store/schema change needed.

## Out of scope
- `CountryField.tsx` (plain country-name select, no flags) — untouched.
- No new route added for item 5 (overlay, not a URL-addressable page, per approved choice).
