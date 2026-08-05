# Life Center Meetings — Frontend (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo:** `/Users/akwaah/Documents/GitHub/Frontend` (this repo). Branch off `development`, not `main`. CI blocks reopening a previously merged branch — always cut fresh.
>
> **Depends on:** the Backend plan (`2026-08-05-life-center-meetings-backend.md`) must be merged and deployed (at least to a local/dev server this plan's manual QA can hit) before Task 6's manual QA step, since it calls real endpoints. Tasks 1-5 (writing the code) do not require the backend to be live — they only require its documented contract (`docs/LIFE_CENTER_MEETING_FRONTEND_IMPLEMENTATION_GUIDE.md` in the Backend repo, or the API contract section of this feature's design spec).
>
> **No test runner exists in this repo.** Verification steps use `npm run lint` and `npx tsc --noEmit`, per `CLAUDE.md`.

**Goal:** Add a "My Meetings" tab alongside the existing "Souls Won" tab on both the admin (`ViewLifeCenter.tsx`) and member (`MyLifeCenter.tsx`) Life Center pages, with a create/edit form (date, attendees, first-timers, offering + currency, optional rich-text note) and permission-gated view/edit/delete per row.

**Architecture:** New API methods added to the existing shared `apiFetch.ts`/`apiPost.ts`/`apiPut.ts`/`apiDelete.ts` classes (this codebase has no per-domain API files, despite the `lifeCenter/` interfaces subfolder). Two new components (`MeetingForm.tsx`, `MeetingsList.tsx`) under `LifeCenter/components/Meetings/`, reused by both pages via a `TabSelection` tab strip. Admin page access uses the existing `ActionButton`/`useRouteAccess` domain-permission gating unchanged; member page access uses a new, explicit "is this user on this life center's leadership roster" check — deliberately not the existing `SoulsWon.tsx` route-name-matching hack, and deliberately not relying on `ActionButton`'s default `useRouteAccess`-based gating (which defaults to permissive `true`/`true` outside a `RouteAccessProvider` — confirmed by reading `RouteAccessContext.tsx`, this is *why* `SoulsWon.tsx` needed its own hack in the first place).

**Tech Stack:** React, TypeScript, Formik + Yup, Tailwind, `react-quill-new`, `dompurify`.

---

## Branch setup

- [ ] **Step 1: Create a fresh branch off `development`**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend fetch origin
git -C /Users/akwaah/Documents/GitHub/Frontend checkout development
git -C /Users/akwaah/Documents/GitHub/Frontend pull origin development
git -C /Users/akwaah/Documents/GitHub/Frontend checkout -b feature/life-center-meetings
```

---

### Task 1: API layer

**Files:**
- Modify: `src/utils/api/lifeCenter/interfaces.ts`
- Modify: `src/utils/api/apiFetch.ts:589-593` (add methods after `fetchSoulsWon`)
- Modify: `src/utils/api/apiPost.ts:431-433` (add method after `createSoul`, and fix `createSoul`'s return type)
- Modify: `src/utils/api/apiPut.ts:362-367` (add method after `updateSoul`)
- Modify: `src/utils/api/apiDelete.ts:112-114` (add method after `deleteSoulWon`)

- [ ] **Step 1: Add meeting types**

In `src/utils/api/lifeCenter/interfaces.ts`, append at the end of the file
(after `LifeCenterDetailsType`, currently line 83):

```ts
export type MeetingAttendeeType = {
  soulWonId: string | number;
  name: string;
  isFirstTimer: boolean;
};

export type MeetingType = {
  id: string | number;
  lifeCenterId: string | number;
  date: string;
  offeringAmount: string;
  currency: string;
  note: string | null;
  createdById: string | number;
  createdAt: string;
  attendees: MeetingAttendeeType[];
};

export type EligibleFirstTimerType = {
  id: string | number;
  title?: string | null;
  first_name: string;
  last_name: string;
};

export type MeetingListResponse = {
  message: string;
  current_page: number;
  page_size: number;
  total: number;
  totalPages: number;
  data: MeetingType[];
};
```

- [ ] **Step 2: Fix `createSoul`'s return type and add `fetchMeetings`/`fetchMeetingById`/`fetchEligibleFirstTimers`**

In `src/utils/api/apiFetch.ts`, add the import at the top alongside the
existing `lifeCenter/interfaces` import (currently lines 22-28):

```ts
import {
  LifeCenterDetailsType,
  LifeCenterMemberType,
  LifeCenterStatsType,
  LifeCenterType,
  SoulWonListType,
  MeetingType,
  MeetingListResponse,
  EligibleFirstTimerType,
} from "./lifeCenter/interfaces";
```

Then, immediately after `fetchSoulsWon` (currently lines 589-593), add:

```ts
  fetchMeetings = (
    query?: QueryType
  ): Promise<ApiResponse<MeetingListResponse>> => {
    return this.fetchFromApi(`lifecenter/meetings`, query);
  };

  fetchMeetingById = (
    query?: QueryType
  ): Promise<ApiResponse<MeetingType>> => {
    return this.fetchFromApi(`lifecenter/meeting`, query);
  };

  fetchEligibleFirstTimers = (
    query?: QueryType
  ): Promise<ApiResponse<EligibleFirstTimerType[]>> => {
    return this.fetchFromApi(`lifecenter/soulswon-eligible-first-timers`, query);
  };
```

- [ ] **Step 3: Fix `createSoul`'s return type; add `createMeeting`**

In `src/utils/api/apiPost.ts`, the loose existing annotation understates what
the backend actually returns (a full created `soul_won` record with an
`id`) — this needs fixing because the new first-timer flow (Task 2) reads
the created soul's `id` off the response. Replace:

```ts
  createSoul = (payload: ISoulsWonForm): Promise<ApiResponse<undefined>> => {
    return this.postToApi("lifecenter/soulwon", payload);
  };
```

with:

```ts
  createSoul = (
    payload: ISoulsWonForm
  ): Promise<
    ApiResponse<{
      id: string | number;
      first_name: string;
      last_name: string;
    }>
  > => {
    return this.postToApi("lifecenter/soulwon", payload);
  };
```

Then add, immediately after it:

```ts
  createMeeting = (payload: {
    lifeCenterId: string;
    date: string;
    offeringAmount: string;
    currency: string;
    note: string | null;
    attendeeSoulWonIds: number[];
    firstTimerSoulWonIds: number[];
    newFirstTimers: unknown[];
  }): Promise<ApiResponse<MeetingType>> => {
    return this.postToApi("lifecenter/meeting", payload);
  };
```

Add `MeetingType` to this file's import from `./lifeCenter/interfaces` at the
top of the file (find the existing `import { ... } from "./lifeCenter/interfaces"`
or `ISoulsWonForm` import block and add `MeetingType` to it — if no such
import block exists yet in `apiPost.ts`, add a new one:
`import { MeetingType } from "./lifeCenter/interfaces";`).

- [ ] **Step 4: Add `updateMeeting`**

In `src/utils/api/apiPut.ts`, immediately after `updateSoul` (currently lines
362-367), add:

```ts
  updateMeeting = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<MeetingType>> => {
    return this.apiExecution.updateData("lifecenter/meeting", payload, query);
  };
```

Add `MeetingType` to this file's `./lifeCenter/interfaces` import (same as
Step 3 — add it to the existing import block, or add a new import line if
none exists).

- [ ] **Step 5: Add `deleteMeeting`**

In `src/utils/api/apiDelete.ts`, immediately after `deleteSoulWon` (currently
lines 112-114), add:

```ts
  deleteMeeting = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("lifecenter/meeting", query);
  };
```

- [ ] **Step 6: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npx tsc --noEmit
```

Expected: no errors. If `createSoul`'s widened return type breaks a caller
elsewhere that destructured `postResponse.data` assuming `undefined`, that
caller was already relying on incorrect typing — fix its usage to match the
real shape rather than reverting this fix.

- [ ] **Step 7: Commit**

```bash
git add src/utils/api/lifeCenter/interfaces.ts src/utils/api/apiFetch.ts src/utils/api/apiPost.ts src/utils/api/apiPut.ts src/utils/api/apiDelete.ts
git commit -m "feat: add life center meeting API layer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `MeetingForm` component

**Files:**
- Create: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingForm.tsx`

- [ ] **Step 1: Write the form**

```tsx
import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout } from "@/components/ui";
import { Modal } from "@/components/Modal";
import Multiselect from "@/components/MultiSelect";
import TextEditor from "@/components/TextEditor";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { LifeCenterMemberType } from "@/utils";
import { Field, Form, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { array, object, string } from "yup";
import DOMPurify from "dompurify";
import {
  EligibleFirstTimerType,
  MeetingType,
} from "@/utils/api/lifeCenter/interfaces";
import { ISoulsWonForm, SoulsWonForm } from "../SoulsWonForm";

export interface IMeetingForm {
  id?: string;
  lifeCenterId: string;
  date: string;
  attendees: string[];
  firstTimers: string[];
  offeringAmount: string;
  currency: string;
  note: string;
}

const initialValues: IMeetingForm = {
  lifeCenterId: "",
  date: "",
  attendees: [],
  firstTimers: [],
  offeringAmount: "",
  currency: "GHS",
  note: "",
};

const CURRENCY_OPTIONS = [
  { value: "GHS", label: "Ghana Cedi (GHS)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "GBP", label: "British Pound (GBP)" },
];

const validationSchema = object().shape({
  date: string()
    .required("Date is required")
    .test(
      "not-future",
      "Date cannot be in the future",
      (value) => !value || new Date(value) <= new Date()
    ),
  offeringAmount: string().required("Offering amount is required"),
  currency: string().required("Currency is required"),
  attendees: array().of(string()),
  firstTimers: array().of(string()),
  note: string().optional(),
});

interface IProps {
  lifeCenterId: string;
  editData: MeetingType | null;
  leader: LifeCenterMemberType | undefined;
  loading: boolean;
  onSubmit: (payload: {
    id?: string;
    lifeCenterId: string;
    date: string;
    offeringAmount: string;
    currency: string;
    note: string | null;
    attendeeSoulWonIds: number[];
    firstTimerSoulWonIds: number[];
    newFirstTimers: unknown[];
  }) => void;
  onClose: () => void;
}

export const MeetingForm = ({
  lifeCenterId,
  editData,
  leader,
  loading,
  onSubmit,
  onClose,
}: IProps) => {
  const [extraFirstTimers, setExtraFirstTimers] = useState<
    EligibleFirstTimerType[]
  >([]);
  const [showAddFirstTimer, setShowAddFirstTimer] = useState(false);

  const { data: soulsData } = useFetch(api.fetch.fetchSoulsWon, {
    lifeCenterId,
  });
  const { data: eligibleData, refetch: refetchEligible } = useFetch(
    api.fetch.fetchEligibleFirstTimers,
    { lifeCenterId }
  );

  const {
    postData: createFirstTimer,
    data: createFirstTimerResponse,
    loading: creatingFirstTimer,
  } = usePost(api.post.createSoul);

  const souls = soulsData?.data ?? [];
  const eligibleFirstTimers = eligibleData?.data ?? [];

  const initial = useMemo<IMeetingForm>(() => {
    if (!editData) {
      return { ...initialValues, lifeCenterId };
    }
    return {
      id: String(editData.id),
      lifeCenterId,
      date: editData.date.slice(0, 10),
      attendees: editData.attendees
        .filter((a) => !a.isFirstTimer)
        .map((a) => String(a.soulWonId)),
      firstTimers: editData.attendees
        .filter((a) => a.isFirstTimer)
        .map((a) => String(a.soulWonId)),
      offeringAmount: editData.offeringAmount,
      currency: editData.currency,
      note: editData.note ?? "",
    };
  }, [editData, lifeCenterId]);

  const soulOptions = useMemo(
    () =>
      souls.map((s) => ({
        value: String(s.id),
        label: `${s.first_name} ${s.last_name}`,
      })),
    [souls]
  );

  const firstTimerBaseOptions = useMemo(
    () =>
      [...eligibleFirstTimers, ...extraFirstTimers].map((s) => ({
        value: String(s.id),
        label: `${s.first_name} ${s.last_name}`,
      })),
    [eligibleFirstTimers, extraFirstTimers]
  );

  return (
    <Formik
      initialValues={initial}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={(values) => {
        const totalPeople = values.attendees.length + values.firstTimers.length;
        if (totalPeople === 0) {
          showNotification(
            "Add at least one attendee or first-timer",
            "error"
          );
          return;
        }
        onSubmit({
          id: values.id,
          lifeCenterId: values.lifeCenterId,
          date: values.date,
          offeringAmount: values.offeringAmount,
          currency: values.currency,
          note: values.note ? DOMPurify.sanitize(values.note) : null,
          attendeeSoulWonIds: values.attendees.map(Number),
          firstTimerSoulWonIds: values.firstTimers.map(Number),
          newFirstTimers: [],
        });
      }}
    >
      {({ values, setFieldValue, handleSubmit }) => {
        const attendeeOptions = soulOptions.filter(
          (o) => !values.firstTimers.includes(o.value)
        );
        const firstTimerOptions = firstTimerBaseOptions.filter(
          (o) => !values.attendees.includes(o.value)
        );

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          const created = createFirstTimerResponse?.data;
          if (created?.id) {
            const idStr = String(created.id);
            setExtraFirstTimers((prev) => [
              ...prev,
              {
                id: idStr,
                first_name: created.first_name,
                last_name: created.last_name,
              },
            ]);
            setFieldValue("firstTimers", [...values.firstTimers, idStr]);
            setShowAddFirstTimer(false);
            refetchEligible();
            showNotification("First timer added", "success");
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [createFirstTimerResponse]);

        return (
          <Form className="flex h-[85vh] w-full max-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="sticky top-0 z-10 bg-primary text-white">
              <FormHeader>
                <p className="text-lg font-semibold">
                  {values.id ? "Update" : "Add"} a Meeting
                </p>
                <p className="text-sm">
                  Log who attended, offering gathered, and any notes.
                </p>
              </FormHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FormLayout>
                <Field
                  type="date"
                  name="date"
                  component={FormikInputDiv}
                  label="Date of meeting *"
                  id="date"
                  max={new Date().toISOString().split("T")[0]}
                />

                <div>
                  <label className="text-primary font-semibold" htmlFor="attendees">
                    Attendees
                  </label>
                  <Multiselect
                    options={attendeeOptions}
                    selectedValues={values.attendees}
                    onChange={(selected) => setFieldValue("attendees", selected)}
                    placeholder="Select who came"
                    emptyMsg="No attendees selected"
                  />
                </div>

                <div>
                  <label className="text-primary font-semibold" htmlFor="firstTimers">
                    First timers
                  </label>
                  <Multiselect
                    options={firstTimerOptions}
                    selectedValues={values.firstTimers}
                    onChange={(selected) => setFieldValue("firstTimers", selected)}
                    placeholder="Select first timers"
                    emptyMsg="No first timers selected"
                  />
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-primary underline"
                    onClick={() => setShowAddFirstTimer(true)}
                  >
                    + Add new first timer
                  </button>
                </div>

                <Field
                  name="currency"
                  component={FormikSelectField}
                  options={CURRENCY_OPTIONS}
                  label="Currency *"
                  id="currency"
                />
                <Field
                  type="number"
                  name="offeringAmount"
                  component={FormikInputDiv}
                  label="Offering amount *"
                  id="offeringAmount"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />

                <div>
                  <label className="text-primary font-semibold" htmlFor="note">
                    Note (optional)
                  </label>
                  <TextEditor
                    value={values.note}
                    onChange={(value) => setFieldValue("note", value)}
                    placeholder="Anything worth remembering about this meeting..."
                  />
                </div>
              </FormLayout>
            </div>

            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  value={values.id ? "Update" : "Save"}
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                />
                <Button
                  type="button"
                  disabled={loading}
                  value="Cancel"
                  variant="secondary"
                  onClick={onClose}
                />
              </div>
            </div>

            <Modal
              open={showAddFirstTimer}
              onClose={() => setShowAddFirstTimer(false)}
            >
              <SoulsWonForm
                onSubmit={(soulValues: ISoulsWonForm) =>
                  createFirstTimer({ ...soulValues, lifeCenterId })
                }
                onClose={() => setShowAddFirstTimer(false)}
                editData={null}
                loading={creatingFirstTimer}
                leader={leader}
              />
            </Modal>
          </Form>
        );
      }}
    </Formik>
  );
};
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: no warnings (`--max-warnings 0`). The inline
`eslint-disable-next-line react-hooks/rules-of-hooks` comment on the `useEffect`
inside the Formik render-prop is required because it's technically inside a
function passed as a prop, not the component body itself, but it always runs
unconditionally on every render of that render-prop, satisfying the rule's
intent — if lint still flags it, hoist that `useEffect` and its state into a
small wrapper component that takes `values`/`setFieldValue` as props instead
of inlining it in the render prop.

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingForm.tsx
git commit -m "feat: add MeetingForm component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `MeetingsList` component

**Files:**
- Create: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx`

- [ ] **Step 1: Write the list**

```tsx
import { useEffect, useState } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";

import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";

import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";

import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { LifeCenterMemberType } from "@/utils";
import { MeetingType } from "@/utils/api/lifeCenter/interfaces";

import { MeetingForm } from "./MeetingForm";

interface IProps {
  lifeCenterId: string;
  leader: LifeCenterMemberType | undefined;
  accessMode: "route" | "membership";
  isLeadershipMember?: boolean;
}

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

export const MeetingsList = ({
  lifeCenterId,
  leader,
  accessMode,
  isLeadershipMember = false,
}: IProps) => {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | number>("");
  const [openModal, setOpenModal] = useState(false);
  const [viewing, setViewing] = useState<MeetingType | null>(null);
  const [editing, setEditing] = useState<MeetingType | null>(null);

  const { data, refetch } = useFetch(api.fetch.fetchMeetings, {
    lifeCenterId,
    page,
    take: 10,
  });

  const { executeDelete } = useDelete(api.delete.deleteMeeting);
  const {
    postData,
    data: postResponse,
    loading: isPosting,
  } = usePost(api.post.createMeeting);
  const {
    updateData,
    data: updateResponse,
    loading: isUpdating,
  } = usePut(api.put.updateMeeting);

  const meetings = data?.data?.data ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  // Route-mode edit/delete is gated by ActionButton's own useRouteAccess
  // check (default true/true props, deferring entirely to the real
  // RouteAccessProvider on that route). Membership-mode passes
  // requireManageAccess/requireAdminAccess=false and instead gates by
  // whether onEdit/onDelete are even defined, since useRouteAccess()
  // defaults to permissive true/true outside a RouteAccessProvider and
  // MyLifeCenter.tsx has no such provider.
  const canManageHere = accessMode === "route" || isLeadershipMember;

  const closeFormModal = () => {
    setOpenModal(false);
    setEditing(null);
  };

  useEffect(() => {
    if (postResponse?.data) {
      refetch();
      showNotification("Meeting added successfully", "success");
      closeFormModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postResponse]);

  useEffect(() => {
    if (updateResponse?.data) {
      refetch();
      showNotification("Meeting updated successfully", "success");
      closeFormModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateResponse]);

  const handleSave = (payload: {
    id?: string;
    lifeCenterId: string;
    date: string;
    offeringAmount: string;
    currency: string;
    note: string | null;
    attendeeSoulWonIds: number[];
    firstTimerSoulWonIds: number[];
    newFirstTimers: unknown[];
  }) => {
    if (payload.id) {
      updateData(payload, { id: payload.id });
    } else {
      postData(payload);
    }
  };

  const handleDelete = (meeting: MeetingType) => {
    showDeleteDialog(
      { id: String(meeting.id), name: format(new Date(meeting.date), "dd MMM yyyy") },
      async () => {
        await executeDelete({ id: meeting.id });
        refetch();
        showNotification("Meeting deleted successfully", "success");
      }
    );
  };

  return (
    <div className="space-y-6">
      <HeaderControls
        title={`My Meetings (${meetings.length})`}
        subtitle=""
        screenWidth={window.innerWidth}
        btnName={canManageHere ? "Create Meeting" : ""}
        handleClick={() => {
          setEditing(null);
          setOpenModal(true);
        }}
      />

      <hr />

      {meetings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting) => {
            const firstTimerCount = meeting.attendees.filter(
              (a) => a.isFirstTimer
            ).length;
            const attendeeCount = meeting.attendees.length - firstTimerCount;
            return (
              <div
                key={meeting.id}
                className="relative border rounded-lg p-4 shadow-sm bg-white space-y-2"
              >
                <div className="font-medium">
                  {format(new Date(meeting.date), "dd MMM yyyy")}
                </div>
                <div className="text-sm text-gray-600">
                  {meeting.currency} {meeting.offeringAmount}
                </div>
                <div className="text-sm text-gray-600">
                  {attendeeCount} attendee{attendeeCount === 1 ? "" : "s"},{" "}
                  {firstTimerCount} first-timer{firstTimerCount === 1 ? "" : "s"}
                </div>
                {meeting.note && (
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {stripHtml(meeting.note).slice(0, 80)}
                  </div>
                )}
                <div
                  className="pt-2 absolute right-2 top-1"
                  onClick={() =>
                    setSelectedId((prev) => (prev === meeting.id ? "" : meeting.id))
                  }
                >
                  <ActionButton
                    showOptions={meeting.id === selectedId}
                    onView={() => setViewing(meeting)}
                    onEdit={
                      canManageHere
                        ? () => {
                            setEditing(meeting);
                            setOpenModal(true);
                          }
                        : undefined
                    }
                    onDelete={
                      canManageHere ? () => handleDelete(meeting) : undefined
                    }
                    requireManageAccess={accessMode === "route"}
                    requireAdminAccess={accessMode === "route"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          scope="section"
          msg="No meetings recorded yet"
          description="Meetings you create for this life center will appear here."
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={page <= 1}
            className="text-sm font-medium text-primary disabled:text-gray-400"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="text-sm font-medium text-primary disabled:text-gray-400"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      <Modal open={openModal} onClose={closeFormModal}>
        <MeetingForm
          lifeCenterId={lifeCenterId}
          editData={editing}
          leader={leader}
          loading={isPosting || isUpdating}
          onSubmit={(payload) => {
            handleSave(payload);
          }}
          onClose={closeFormModal}
        />
      </Modal>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="p-6 max-w-lg mx-auto bg-white rounded-lg space-y-3">
            <h3 className="text-lg font-semibold">
              Meeting — {format(new Date(viewing.date), "dd MMM yyyy")}
            </h3>
            <p className="text-sm text-gray-600">
              Offering: {viewing.currency} {viewing.offeringAmount}
            </p>
            <div>
              <p className="font-medium text-sm">Attendees</p>
              <ul className="text-sm text-gray-700 list-disc pl-5">
                {viewing.attendees.map((a) => (
                  <li key={a.soulWonId}>
                    {a.name}
                    {a.isFirstTimer ? " (first timer)" : ""}
                  </li>
                ))}
              </ul>
            </div>
            {viewing.note && (
              <div
                className="text-sm text-gray-700 prose"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(viewing.note),
                }}
              />
            )}
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: no warnings.

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx
git commit -m "feat: add MeetingsList component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Tabs on admin `ViewLifeCenter.tsx`

**Files:**
- Modify: `src/pages/HomePage/pages/LifeCenter/pages/ViewLifeCenter.tsx`

- [ ] **Step 1: Rewrite the file with tabs**

Replace the full contents of
`src/pages/HomePage/pages/LifeCenter/pages/ViewLifeCenter.tsx` with:

```tsx
import { useState } from "react";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { decodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useParams } from "react-router-dom";
import { InfoRow } from "../components/LifeCenterCard";
import { LifeCenterMembers } from "../components/LifeCenterMembers";
import { SoulsWon } from "../components/SoulsWon";
import { MeetingsList } from "../components/Meetings/MeetingsList";
import { Banner } from "../../Members/Components/Banner";

const TABS = ["Souls Won", "My Meetings"] as const;
type Tab = (typeof TABS)[number];

export function ViewLifeCenter() {
  const { id: lifeCenterId } = useParams();
  const id = decodeQuery(String(lifeCenterId));
  const { data, refetch } = useFetch(api.fetch.fetchLifeCenterById, { id });
  const [selectedTab, setSelectedTab] = useState<Tab>("Souls Won");

  const lifeCenterData = data?.data;

  return (
    <PageOutline className="p-0 ">
      <div className="space-y-5">
        <Banner>
          <div className="space-y-1 w-full">
            <p className="text-2xl font-semibold">
              {lifeCenterData?.name || "No name"}
            </p>
            {lifeCenterData?.description && (
              <p>{lifeCenterData?.description || ""}</p>
            )}
            <div className="flex gap-5 items-center w-full">
              {lifeCenterData?.location && (
                <InfoRow
                  icon={<MapPinIcon className="h-6 w-6 " />}
                  label={lifeCenterData?.location || "No location"}
                />
              )}

              {lifeCenterData?.meeting_dates && (
                <div className="flex items-center gap-2">
                  <InfoRow
                    icon={<CalendarIcon className="h-6 w-6 " />}
                    label={
                      <ul className="flex gap-2 divide-x-[1px] w-fit">
                        {lifeCenterData?.meeting_dates.map((date, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                          >
                            {date.slice(0, 3)}
                          </span>
                        ))}
                      </ul>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </Banner>

        <div className="app-page-padding">
          <TabSelection
            tabs={[...TABS]}
            selectedTab={selectedTab}
            onTabSelect={setSelectedTab}
          />
        </div>

        {selectedTab === "Souls Won" ? (
          <div className="app-page-padding flex gap-2 xs:flex-col sm:flex-col md:flex-row">
            <div className="rounded-lg xs:w-full p-4 w-full md:w-6/9 ">
              <SoulsWon
                soulsWon={lifeCenterData?.soulsWon || []}
                handleSuccess={refetch}
                lifeCenterId={id}
                hasMembers={lifeCenterData?.members.length !== 0}
                leader={lifeCenterData?.members[0]}
              />
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="w-px bg-gray-200 h-full" />
            </div>

            <div className=" w-[35%] xs:w-full sm:w-full md:w-1/2 rounded-lg h-fit">
              <LifeCenterMembers
                refetchLifeCenter={refetch}
                lifeCenterId={id}
                members={lifeCenterData?.members || []}
              />
            </div>
          </div>
        ) : (
          <div className="app-page-padding">
            <MeetingsList
              lifeCenterId={id}
              leader={lifeCenterData?.members[0]}
              accessMode="route"
            />
          </div>
        )}
      </div>
    </PageOutline>
  );
}
```

This drops the large commented-out duplicate block that was already dead
code in the original file (lines 60-87 of the prior version) — it was
never rendered and had no reason to stay.

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual QA**

```bash
npm run dev
```

Navigate to `/home/life-centers/<id>` (or via the sidebar → Life Centers →
open one). Confirm: "Souls Won" tab shows the existing panel unchanged; "My
Meetings" tab shows the (empty, until Backend is live) meetings list with a
"Create Meeting" button; switching tabs preserves the fetched
`lifeCenterData` (no refetch flicker).

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage/pages/LifeCenter/pages/ViewLifeCenter.tsx
git commit -m "feat: add My Meetings tab to admin Life Center page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Tabs on member `MyLifeCenter.tsx`

**Files:**
- Modify: `src/pages/MembersPage/Pages/MyLifeCenter.tsx`

- [ ] **Step 1: Rewrite the file with tabs**

Replace the full contents of `src/pages/MembersPage/Pages/MyLifeCenter.tsx`
with:

```tsx
import { useState } from "react";
import { useFetch } from "@/CustomHooks/useFetch";
import { InfoRow } from "@/pages/HomePage/pages/LifeCenter/components/LifeCenterCard";
import { SoulsWon } from "@/pages/HomePage/pages/LifeCenter/components/SoulsWon";
import { MeetingsList } from "@/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils/api/apiCalls";
import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import BannerWrapper from "../layouts/BannerWrapper";
import lifecenter from "@/assets/banner/lifecenter.svg";

const TABS = ["Souls Won", "My Meetings"] as const;
type Tab = (typeof TABS)[number];

const MyLifeCenter = () => {
  const userData = useUserStore((state) => state);
  const user_id = userData.id;
  const { data, refetch } = useFetch(api.fetch.fetchLifeCenterByUserId, {
    user_id,
  });
  const lifeCenterData = data?.data;
  const [selectedTab, setSelectedTab] = useState<Tab>("Souls Won");

  const isLeadershipMember = Boolean(
    lifeCenterData?.members?.some(
      (m) => String(m.userId) === String(user_id)
    )
  );

  return (
    <div className="space-y-4 ">
      <BannerWrapper imgSrc={lifecenter}>
        <div className="space-y-4 w-full">
          <div className="font-bold text-2xl">
            {lifeCenterData?.name || "No name"}
          </div>
          <div>
            {lifeCenterData?.description && (
              <p>{lifeCenterData?.description || ""}</p>
            )}
          </div>
          <div className="flex gap-5 items-center ">
            {lifeCenterData?.location && (
              <InfoRow
                icon={<MapPinIcon className="h-6 w-6 " />}
                label={lifeCenterData?.location || "No location"}
              />
            )}

            {lifeCenterData?.meeting_dates && (
              <div className="flex items-center gap-2">
                <InfoRow
                  icon={<CalendarIcon className="h-6 w-6 " />}
                  label={
                    <ul className="border flex divide-x-[1px] w-fit">
                      {lifeCenterData?.meeting_dates.map((date, index) => (
                        <li key={index} className="px-2">
                          {date.slice(0, 3)}
                        </li>
                      ))}
                    </ul>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </BannerWrapper>

      <div className="app-page-padding">
        <TabSelection
          tabs={[...TABS]}
          selectedTab={selectedTab}
          onTabSelect={setSelectedTab}
        />
      </div>

      {selectedTab === "Souls Won" ? (
        <div className=" rounded-lg  ">
          <SoulsWon
            soulsWon={lifeCenterData?.soulsWon || []}
            handleSuccess={refetch}
            lifeCenterId={`${lifeCenterData?.id}`}
            hasMembers={lifeCenterData?.members.length !== 0}
            leader={lifeCenterData?.members[0]}
          />
        </div>
      ) : (
        <div className="rounded-lg">
          <MeetingsList
            lifeCenterId={`${lifeCenterData?.id}`}
            leader={lifeCenterData?.members[0]}
            accessMode="membership"
            isLeadershipMember={isLeadershipMember}
          />
        </div>
      )}
    </div>
  );
};

export default MyLifeCenter;
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual QA**

```bash
npm run dev
```

Log in as a member who belongs to a life center's leadership roster and one
who doesn't (if such a test account exists). Confirm: leadership-roster
member sees "Create Meeting" and Edit/Delete on their own meetings; a
non-roster member (if the app allows viewing this page without being on the
roster at all — check whether `fetchLifeCenterByUserId` returns data for
such a user first) sees the list read-only (View only, no Create button, no
Edit/Delete).

- [ ] **Step 4: Commit**

```bash
git add src/pages/MembersPage/Pages/MyLifeCenter.tsx
git commit -m "feat: add My Meetings tab to member Life Center page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Full verification pass

- [ ] **Step 1: Lint the whole repo**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npm run lint
```

Expected: exits 0, no warnings.

- [ ] **Step 2: Typecheck the whole repo**

```bash
npx tsc --noEmit
```

Expected: exits 0, no errors.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: succeeds, `dist/` produced.

- [ ] **Step 4: End-to-end manual QA against a live backend**

With the Backend plan's branch running locally (or pointed at the dev API
per `.env`'s `REACT_APP_API_URL`), walk through: create a meeting with 2
existing attendees + 1 existing first-timer + 1 brand-new first-timer added
inline; confirm the new first-timer no longer appears in the "First timers"
dropdown on a second meeting for the same life center (since they now have
attendance history); edit the meeting to remove one attendee; delete the
meeting; confirm a different (non-creator) leader on the same life center
cannot see this meeting in their own "My Meetings" list.

- [ ] **Step 5: Final commit / PR**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend push -u origin feature/life-center-meetings
gh pr create --base development --title "Life Center Meetings (web)" --body "Implements the My Meetings tab per docs/superpowers/specs/2026-08-05-life-center-meetings-design.md.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Done criteria

- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.
- Both `ViewLifeCenter.tsx` and `MyLifeCenter.tsx` show two tabs; "My
  Meetings" lists only the current user's own created meetings.
- Admin-side edit/delete gating is unchanged (still driven by
  `manage_life_center`/`admin` route permissions via `RouteAccessProvider`).
- Member-side create/edit/delete is visible only to users on that specific
  life center's leadership roster (`members.some(...)`), not to every member
  viewing the page.
- PR opened against `development`.
