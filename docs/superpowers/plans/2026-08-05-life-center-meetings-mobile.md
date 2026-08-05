# Life Center Meetings — Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo:** `/Users/akwaah/Documents/GitHub/wwm-mobile` — a separate git repo from Frontend. Branch off `dev` (never `main`), name it `codex/life-center-meetings` per this repo's branch convention. Every git command in this plan must target this path.
>
> **No per-component file tree in this repo.** `src/screens.tsx` is one large file holding every screen; new UI goes into it as new functions, not new files, per existing convention. Read `wwm-mobile/CLAUDE.md` and `wwm-mobile/AGENTS.md` before starting if not already familiar with this repo.
>
> **No test runner or linter exists.** `npx tsc --noEmit` is the only static gate.
>
> **Depends on:** the Backend plan (`2026-08-05-life-center-meetings-backend.md`) for the live endpoints used in Task 4's manual QA. Tasks 1-3 only need the documented contract.

**Goal:** Add a "Souls Won" / "My Meetings" segment switcher inside the existing `LifeCenterScreen`, with a meeting log form (date, attendees, first-timers with inline "add new," offering + currency, optional note) gated to leadership-roster members of that specific life center.

**Architecture:** No new navigation route — the tab switcher lives inside the existing screen using the `Segment` component, matching the "two tabs" requirement without a new stack entry. New types in `types.ts`, new API functions + a `normalizeMeeting` in `api.ts` following `normalizeAppointment`'s shape, and a new `MeetingRecordForm` function in `screens.tsx` mirroring `SoulWonRecordForm`'s structure (chip-based date picker, hand-rolled multi-select via `Chip`, `Segment` for currency, plain `Field` for notes). `SoulWonRecordForm`'s `onSaved` callback is widened to pass back the created record, since the new "add first timer inline" flow needs the new soul's id to auto-select it — the one existing caller (`LifeCenterScreen`) ignores extra args today, so this is backward compatible.

**Tech Stack:** React Native, Expo, TypeScript (no external form/state library).

---

## Branch setup

- [ ] **Step 1: Create a fresh branch off `dev`**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile fetch origin
git -C /Users/akwaah/Documents/GitHub/wwm-mobile checkout dev
git -C /Users/akwaah/Documents/GitHub/wwm-mobile pull origin dev
git -C /Users/akwaah/Documents/GitHub/wwm-mobile checkout -b codex/life-center-meetings
```

---

### Task 1: Types

**Files:**
- Modify: `src/types.ts:150-173` (insert after `SoulWon`)

- [ ] **Step 1: Add `Meeting`/`MeetingAttendee` types**

In `src/types.ts`, immediately after the closing `};` of `export type SoulWon`
(currently line 173, just before `export type Appointment = {`), add:

```ts
export type MeetingAttendee = {
  soulWonId?: string | number;
  name?: string;
  isFirstTimer?: boolean;
};

export type Meeting = {
  id?: string | number;
  lifeCenterId?: string | number;
  date?: string;
  offeringAmount?: string;
  currency?: string;
  note?: string;
  createdById?: string | number;
  createdAt?: string;
  attendees?: MeetingAttendee[];
};
```

- [ ] **Step 2: Add `LifeCenter` to the `Meeting` shape's parent, and export it for `screens.tsx` to use directly**

`LifeCenter` (lines 132-140) already exists but is never imported into
`screens.tsx` today (confirmed by reading the file's import block — only
`LifeCenterMember` and `SoulWon` are imported there). No change needed to
`types.ts` for this — Task 3 adds `LifeCenter` to `screens.tsx`'s import list
directly.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/wwm-mobile
npx tsc --noEmit
```

Expected: no errors (these are new, unused-so-far types — nothing consumes
them until Task 2/3).

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/types.ts
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "feat: add Meeting/MeetingAttendee types

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: API layer

**Files:**
- Modify: `src/api.ts` (widen `createSoulWon`'s return type; add meeting functions + `normalizeMeeting`)

- [ ] **Step 1: Widen `createSoulWon`'s return type**

In `src/api.ts`, replace the existing line:

```ts
  createSoulWon: (payload: unknown) => post<unknown>("lifecenter/soulwon", payload),
```

with:

```ts
  createSoulWon: (payload: unknown) =>
    post<{ id: string | number; first_name: string; last_name: string }>(
      "lifecenter/soulwon",
      payload,
    ),
```

- [ ] **Step 2: Add `normalizeMeeting`**

Immediately after `normalizeAppointment` (currently ending at line 115, just
before the blank line preceding the `del` helper's later usage / next
exported function), add:

```ts
export const normalizeMeetingAttendee = (value: unknown): MeetingAttendee => {
  const raw = asRecord(value);
  return {
    soulWonId: toText(raw.soulWonId ?? raw.soul_won_id),
    name: toText(raw.name),
    isFirstTimer: Boolean(raw.isFirstTimer ?? raw.is_first_timer),
  };
};

export const normalizeMeeting = (value: unknown): Meeting => {
  const raw = asRecord(value);
  return {
    id: toText(raw.id),
    lifeCenterId: toText(raw.lifeCenterId ?? raw.life_center_id),
    date: toText(raw.date),
    offeringAmount: toText(raw.offeringAmount ?? raw.offering_amount),
    currency: toText(raw.currency, "GHS"),
    note: toText(raw.note),
    createdById: toText(raw.createdById ?? raw.created_by_id),
    createdAt: toText(raw.createdAt ?? raw.created_at),
    attendees: asArray<unknown>(raw.attendees).map(normalizeMeetingAttendee),
  };
};
```

Add `Meeting` and `MeetingAttendee` to this file's type imports from
`./types` (find the existing `import type { ... } from "./types"` or
`import { ... } from "./types"` block near the top of `api.ts` and add both
names to it).

- [ ] **Step 3: Add meeting endpoints**

Immediately after the existing `createSoulWon` entry (now widened in Step 1),
add:

```ts
  meetingsByLifeCenter: (lifeCenterId: string | number, page = 1, take = 10) =>
    get<{ current_page: number; page_size: number; total: number; totalPages: number; data: unknown[] }>(
      "lifecenter/meetings",
      { lifeCenterId, page, take },
    ),
  meeting: (id: string | number) => get<unknown>("lifecenter/meeting", { id }),
  eligibleFirstTimers: (lifeCenterId: string | number) =>
    get<unknown[]>("lifecenter/soulswon-eligible-first-timers", { lifeCenterId }),
  createMeeting: (payload: unknown) => post<unknown>("lifecenter/meeting", payload),
  updateMeeting: (payload: unknown) => put<unknown>("lifecenter/meeting", payload),
  deleteMeeting: (id: string | number) => del<unknown>("lifecenter/meeting", { id }),
```

`put` is the existing local helper defined near the top of this file
(`src/api.ts`, alongside `get`/`post`/`del`): `const put = async <T>(path: string, payload?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => { const response = await client.put<ApiResponse<T>>(path, payload ?? {}, config); return response.data; };` — no new helper needed.

- [ ] **Step 4: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/wwm-mobile
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/api.ts
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "feat: add life center meeting API functions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `LifeCenterScreen` tab switcher + `MeetingRecordForm`

**Files:**
- Modify: `src/screens.tsx:27-53` (imports)
- Modify: `src/screens.tsx:3907-3979` (`LifeCenterScreen`)
- Modify: `src/screens.tsx:3981-4155` (`SoulWonRecordForm` — widen `onSaved`)
- Create (in the same file, new function after `SoulWonRecordForm`): `MeetingRecordForm`

- [ ] **Step 1: Add `Meeting`/`MeetingAttendee`/`LifeCenter` to the type imports**

In `src/screens.tsx`, the import block from `./types` (currently lines 32-53)
is missing `LifeCenter` even though `LifeCenterScreen` uses it structurally.
Replace:

```ts
import {
  Appointment,
  Assignment,
  CartItem,
  CertificateData,
  Cohort,
  Course,
  Department,
  GivingFeePreview,
  GivingOption,
  InAppNotification,
  LifeCenterMember,
  MyPledge,
  Order,
  PledgeFeePreview,
  Product,
  Program,
  StaffAvailability,
  Submission,
  SoulWon,
  Topic,
} from "./types";
```

with:

```ts
import {
  Appointment,
  Assignment,
  CartItem,
  CertificateData,
  Cohort,
  Course,
  Department,
  GivingFeePreview,
  GivingOption,
  InAppNotification,
  LifeCenter,
  LifeCenterMember,
  Meeting,
  MeetingAttendee,
  MyPledge,
  Order,
  PledgeFeePreview,
  Product,
  Program,
  StaffAvailability,
  Submission,
  SoulWon,
  Topic,
} from "./types";
```

Also add `normalizeMeeting` to the `./api` import block (currently line 27):

```ts
import { api, normalizeAnnouncement, normalizeAppointment, normalizeAssignment, normalizeDepartment, normalizeGivingContribution, normalizeGivingFeePreview, normalizeGivingOption, normalizeMeeting, normalizeMyPledge, normalizeNotification, normalizePledgeFeePreview, normalizePledgePayment, normalizeProgram, normalizeSermonSeries, normalizeSubmission } from "./api";
```

- [ ] **Step 2: Widen `SoulWonRecordForm`'s `onSaved` and capture the create response**

In `src/screens.tsx`, the `SoulWonRecordForm` function signature (currently
lines 3981-3993) takes `onSaved: () => Promise<void>`. Change it to:

```tsx
function SoulWonRecordForm({
  lifeCenterId,
  members,
  currentUserId,
  onClose,
  onSaved,
}: {
  lifeCenterId?: string | number;
  members: LifeCenterMember[];
  currentUserId?: string | number;
  onClose: () => void;
  onSaved: (created?: { id: string | number; first_name: string; last_name: string }) => Promise<void>;
}) {
```

Then inside its `save` function (currently lines 4013-4057), replace:

```ts
    setSaving(true);
    try {
      await api.createSoulWon({
        title,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        other_name: otherName.trim(),
        phone: {
          number: phone.trim(),
          country_code: countryCode.trim() || DEFAULT_COUNTRY_CODE,
        },
        contact_email: email.trim(),
        country: country.trim(),
        city: city.trim(),
        date_won: dateWon,
        wonById,
        lifeCenterId,
      });
      haptic("success");
      Alert.alert("Record saved", "The soul-won record has been added.");
      await onSaved();
    } catch (err) {
```

with:

```ts
    setSaving(true);
    try {
      const response = await api.createSoulWon({
        title,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        other_name: otherName.trim(),
        phone: {
          number: phone.trim(),
          country_code: countryCode.trim() || DEFAULT_COUNTRY_CODE,
        },
        contact_email: email.trim(),
        country: country.trim(),
        city: city.trim(),
        date_won: dateWon,
        wonById,
        lifeCenterId,
      });
      haptic("success");
      Alert.alert("Record saved", "The soul-won record has been added.");
      await onSaved(response?.data);
    } catch (err) {
```

The one existing call site (inside `LifeCenterScreen`, see Step 3) currently
reads `onSaved={async () => { setRecordOpen(false); await refetch(); }}` — a
zero-arg arrow function is still a valid `(created?) => Promise<void>`, so
this widening is backward compatible and needs no change at that call site
unless you also want the plain Souls-Won flow to consume `created` (it
doesn't need to).

- [ ] **Step 3: Rewrite `LifeCenterScreen` with the tab switcher**

Replace the full `LifeCenterScreen` function (currently lines 3907-3979)
with:

```tsx
type LifeCenterTab = "Souls Won" | "My Meetings";
const LIFE_CENTER_TABS: LifeCenterTab[] = ["Souls Won", "My Meetings"];

export function LifeCenterScreen({ navigation }: NavProps) {
  useTheme();
  const user = useAuthStore((state) => state.user);
  const { data, loading, error, refetch } = useAsync(() => api.lifeCenterByUser(user?.id ?? ""), [user?.id], { enabled: Boolean(user?.id) });
  const lifeCenter: LifeCenter | undefined = data?.data;
  const [recordOpen, setRecordOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [tab, setTab] = useState<LifeCenterTab>("Souls Won");
  const members = lifeCenter?.members ?? [];
  const souls = lifeCenter?.soulsWon ?? [];
  const isLeadershipMember = members.some((m) => toText(m.userId) === toText(user?.id));

  const {
    data: meetingsData,
    loading: meetingsLoading,
    refetch: refetchMeetings,
  } = useAsync(
    () => api.meetingsByLifeCenter(lifeCenter?.id ?? ""),
    [lifeCenter?.id, tab],
    { enabled: Boolean(lifeCenter?.id) && tab === "My Meetings" },
  );
  const meetings = asArray<unknown>(meetingsData?.data).map(normalizeMeeting);

  if (loading) return <LoadingState text="Loading life center…" />;
  const unassigned = (!loading && !lifeCenter) || (error && /not assigned|no life ?center|not found/i.test(error));
  if (unassigned) return <LifeCenterUnassigned onRefresh={refetch} onBack={() => navigation.goBack()} />;
  if (error) return <ErrorState text={error} onRetry={refetch} />;

  const handleDeleteMeeting = (meeting: Meeting) => {
    Alert.alert("Delete meeting?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteMeeting(meeting.id ?? "");
            haptic("success");
            await refetchMeetings();
          } catch (err) {
            haptic("error");
            Alert.alert("Unable to delete", errorMessage(err, "This meeting could not be deleted."));
          }
        },
      },
    ]);
  };

  return (
    <Screen title={lifeCenter?.name || "My Life Center"} showHeader={false} density="relaxed">
      <ScreenHeading
        kicker="Life Center"
        title={lifeCenter?.name || "My Life Center"}
        subtitle={stripHtml(lifeCenter?.description) || "Your local care group, meeting rhythm, and outreach records."}
        onBack={() => navigation.goBack()}
      />
      <HeroRow>
        <HeroStat icon="person-outline" label={`${members.length} member${members.length === 1 ? "" : "s"}`} />
        <HeroStat icon="heart-outline" label={`${souls.length} soul${souls.length === 1 ? "" : "s"} won`} />
      </HeroRow>
      <Section title="Life Center Details">
        <Card tone="accent">
          <InfoRow icon="location-outline" label="Location" value={lifeCenter?.location || "-"} />
          <InfoRow icon="calendar-outline" label="Meeting Days" value={(lifeCenter?.meeting_dates ?? []).join(", ") || "-"} />
        </Card>
      </Section>

      <View style={{ paddingHorizontal: space.md }}>
        <Segment options={LIFE_CENTER_TABS} value={tab} onChange={setTab} />
      </View>

      {tab === "Souls Won" ? (
        <Section
          title={`Souls Won (${souls.length})`}
          action={
            members.length > 0 && lifeCenter?.id
              ? <Button label="Add Record" icon="add" onPress={() => setRecordOpen(true)} />
              : undefined
          }
        >
          {members.length === 0 ? (
            <Card tone="muted">
              <Text style={styles.muted}>A life center leader must be assigned before soul-won records can be added.</Text>
            </Card>
          ) : null}
          {souls.length === 0 ? <EmptyState icon="heart-outline" text="No souls-won records yet. Add one after your next outreach." /> : null}
          {souls.map((item, index) => (
            <Card key={String(item.id ?? index)} tone="elevated">
              <View style={row}>
                <Text style={[styles.cardTitle, { flex: 1 }]}>{soulName(item)}</Text>
                {item.isMember ? <Pill label="Member" tone="success" /> : null}
              </View>
              <InfoRow icon="call-outline" label="Phone" value={soulPhone(item) || "-"} />
              <InfoRow icon="location-outline" label="Location" value={[item.city, item.country].filter(Boolean).join(", ") || "-"} />
              <InfoRow icon="calendar-outline" label="Date Won" value={formatDate(item.date_won ?? item.created_at)} />
              <InfoRow icon="person-outline" label="Won By" value={item.wonByName || "-"} />
              {item.memberName ? <Text style={styles.muted}>Member record: {item.memberName}{item.memberMemberId ? ` (${item.memberMemberId})` : ""}</Text> : null}
            </Card>
          ))}
        </Section>
      ) : (
        <Section
          title={`My Meetings (${meetings.length})`}
          action={
            isLeadershipMember && lifeCenter?.id
              ? <Button label="Log Meeting" icon="add" onPress={() => { setEditingMeeting(null); setMeetingOpen(true); }} />
              : undefined
          }
        >
          {meetingsLoading ? <ActivityIndicator /> : null}
          {!meetingsLoading && meetings.length === 0 ? <EmptyState icon="calendar-outline" text="No meetings logged yet." /> : null}
          {meetings.map((meeting, index) => {
            const firstTimerCount = (meeting.attendees ?? []).filter((a) => a.isFirstTimer).length;
            const attendeeCount = (meeting.attendees ?? []).length - firstTimerCount;
            return (
              <Card key={String(meeting.id ?? index)} tone="elevated">
                <Text style={styles.cardTitle}>{formatDate(meeting.date)}</Text>
                <InfoRow icon="cash-outline" label="Offering" value={`${meeting.currency} ${meeting.offeringAmount}`} />
                <InfoRow icon="people-outline" label="Attendance" value={`${attendeeCount} attendee${attendeeCount === 1 ? "" : "s"}, ${firstTimerCount} first-timer${firstTimerCount === 1 ? "" : "s"}`} />
                {meeting.note ? <Text style={styles.muted}>{stripHtml(meeting.note)}</Text> : null}
                {isLeadershipMember ? (
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    <Button
                      label="Edit"
                      variant="secondary"
                      style={{ flex: 1 }}
                      onPress={() => { setEditingMeeting(meeting); setMeetingOpen(true); }}
                    />
                    <Button
                      label="Delete"
                      variant="secondary"
                      style={{ flex: 1 }}
                      onPress={() => handleDeleteMeeting(meeting)}
                    />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </Section>
      )}

      <Modal visible={recordOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setRecordOpen(false)}>
        <SoulWonRecordForm
          lifeCenterId={lifeCenter?.id}
          members={members}
          currentUserId={user?.id}
          onClose={() => setRecordOpen(false)}
          onSaved={async () => {
            setRecordOpen(false);
            await refetch();
          }}
        />
      </Modal>

      <Modal visible={meetingOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMeetingOpen(false)}>
        <MeetingRecordForm
          lifeCenterId={lifeCenter?.id}
          members={members}
          souls={souls}
          editData={editingMeeting}
          onClose={() => setMeetingOpen(false)}
          onSaved={async () => {
            setMeetingOpen(false);
            await refetchMeetings();
          }}
        />
      </Modal>
    </Screen>
  );
}
```

- [ ] **Step 4: Add `MeetingRecordForm`**

Immediately after the closing `}` of `SoulWonRecordForm` (currently line
4155, just before `export function AppointmentsScreen`), add:

```tsx
function MeetingRecordForm({
  lifeCenterId,
  members,
  souls,
  editData,
  onClose,
  onSaved,
}: {
  lifeCenterId?: string | number;
  members: LifeCenterMember[];
  souls: SoulWon[];
  editData: Meeting | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  useTheme();
  const [date, setDate] = useState(editData?.date ?? todayIsoDate());
  const [attendeeIds, setAttendeeIds] = useState<string[]>(
    (editData?.attendees ?? []).filter((a) => !a.isFirstTimer).map((a) => toText(a.soulWonId)),
  );
  const [firstTimerIds, setFirstTimerIds] = useState<string[]>(
    (editData?.attendees ?? []).filter((a) => a.isFirstTimer).map((a) => toText(a.soulWonId)),
  );
  const [extraFirstTimers, setExtraFirstTimers] = useState<SoulWon[]>([]);
  const [currency, setCurrency] = useState(editData?.currency ?? "GHS");
  const [offeringAmount, setOfferingAmount] = useState(editData?.offeringAmount ?? "");
  const [note, setNote] = useState(editData?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [addFirstTimerOpen, setAddFirstTimerOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const dateChoices = useMemo(() => recentDateOptions(), []);
  const clearFieldError = (key: string) =>
    setFieldErrors((current) => (current[key] ? { ...current, [key]: "" } : current));

  const eligiblePeople = useMemo(
    () => [...souls, ...extraFirstTimers],
    [souls, extraFirstTimers],
  );

  const toggleAttendee = (id: string) => {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setFirstTimerIds((prev) => prev.filter((x) => x !== id));
  };

  const toggleFirstTimer = (id: string) => {
    setFirstTimerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setAttendeeIds((prev) => prev.filter((x) => x !== id));
  };

  const save = async () => {
    const errors: Record<string, string> = {};
    if (!date.trim()) errors.date = "Date is required.";
    else if (!isIsoDate(date)) errors.date = "Use the format YYYY-MM-DD, for example 2026-08-02.";
    if (!offeringAmount.trim()) errors.offeringAmount = "Offering amount is required.";
    if (attendeeIds.length + firstTimerIds.length === 0) {
      errors.people = "Add at least one attendee or first-timer.";
    }
    if (!lifeCenterId) errors.lifeCenterId = "Life center is missing.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const payload = {
        lifeCenterId,
        date,
        offeringAmount: offeringAmount.trim(),
        currency,
        note: note.trim() || null,
        attendeeSoulWonIds: attendeeIds.map(Number),
        firstTimerSoulWonIds: firstTimerIds.map(Number),
        newFirstTimers: [],
      };
      if (editData?.id) {
        await api.updateMeeting({ ...payload, id: editData.id });
      } else {
        await api.createMeeting(payload);
      }
      haptic("success");
      Alert.alert("Meeting saved", "The meeting has been recorded.");
      await onSaved();
    } catch (err) {
      haptic("error");
      Alert.alert("Unable to save meeting", errorMessage(err, "This meeting could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={editData ? "Edit Meeting" : "Log Meeting"} variant="modal" density="relaxed">
      <ScreenHeading
        kicker="Life Center"
        title={editData ? "Edit Meeting" : "Log Meeting"}
        subtitle="Record who attended, offering gathered, and any notes."
        onBack={onClose}
      />
      <Section title="Date">
        <Card tone="elevated">
          <Segment
            options={dateChoices.map((entry) => entry.label)}
            value={dateChoices.find((entry) => entry.value === date)?.label ?? ""}
            onChange={(label) => {
              const match = dateChoices.find((entry) => entry.label === label);
              if (match) setDate(match.value);
              clearFieldError("date");
            }}
          />
          <Field
            label="Or type a date"
            value={date}
            onChangeText={(value) => { setDate(value); clearFieldError("date"); }}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            helper="Use the format YYYY-MM-DD."
            error={fieldErrors.date}
          />
        </Card>
      </Section>
      <Section title="Attendees">
        <Card tone="muted">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {eligiblePeople
              .filter((s) => !firstTimerIds.includes(toText(s.id)))
              .map((soul) => {
                const id = toText(soul.id);
                return (
                  <Chip
                    key={id}
                    label={`${soul.first_name ?? ""} ${soul.last_name ?? ""}`.trim()}
                    active={attendeeIds.includes(id)}
                    onPress={() => toggleAttendee(id)}
                  />
                );
              })}
          </View>
        </Card>
      </Section>
      <Section title="First timers">
        <Card tone="muted">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {eligiblePeople
              .filter((s) => !attendeeIds.includes(toText(s.id)))
              .map((soul) => {
                const id = toText(soul.id);
                return (
                  <Chip
                    key={id}
                    label={`${soul.first_name ?? ""} ${soul.last_name ?? ""}`.trim()}
                    active={firstTimerIds.includes(id)}
                    onPress={() => toggleFirstTimer(id)}
                  />
                );
              })}
          </View>
          <Button
            label="+ Add new first timer"
            variant="secondary"
            onPress={() => setAddFirstTimerOpen(true)}
          />
          <FieldError text={fieldErrors.people} />
        </Card>
      </Section>
      <Section title="Offering">
        <Card tone="elevated">
          <Segment options={["GHS", "USD", "GBP"]} value={currency} onChange={setCurrency} />
          <Field
            label="Amount"
            required
            value={offeringAmount}
            onChangeText={(value) => { setOfferingAmount(value); clearFieldError("offeringAmount"); }}
            keyboardType="decimal-pad"
            error={fieldErrors.offeringAmount}
          />
        </Card>
      </Section>
      <Section title="Note (optional)">
        <Card tone="elevated">
          <Field
            label="Anything worth remembering?"
            placeholder="A sentence or two is plenty..."
            value={note}
            onChangeText={setNote}
            multiline
          />
        </Card>
      </Section>
      <FieldError text={fieldErrors.lifeCenterId} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button label="Cancel" variant="secondary" style={{ flex: 1 }} disabled={saving} onPress={onClose} />
        <Button label="Save" style={{ flex: 1 }} loading={saving} onPress={save} />
      </View>

      <Modal visible={addFirstTimerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddFirstTimerOpen(false)}>
        <SoulWonRecordForm
          lifeCenterId={lifeCenterId}
          members={members}
          currentUserId={undefined}
          onClose={() => setAddFirstTimerOpen(false)}
          onSaved={async (created) => {
            setAddFirstTimerOpen(false);
            if (created?.id) {
              const id = toText(created.id);
              setExtraFirstTimers((prev) => [
                ...prev,
                { id, first_name: created.first_name, last_name: created.last_name },
              ]);
              setFirstTimerIds((prev) => [...prev, id]);
              clearFieldError("people");
            }
          }}
        />
      </Modal>
    </Screen>
  );
}
```

- [ ] **Step 5: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/wwm-mobile
npx tsc --noEmit
```

Expected: no errors. Common fixups if this fails:
- `ActivityIndicator` must already be imported from `react-native` in the
  top import block (it is, per the file's existing imports) — if not,
  add it there.
- `Chip` and `Segment` are already exported from wherever `screens.tsx`
  imports its UI kit from (the same import block that brings in `Card`,
  `Section`, `Button`, etc. — add `Chip` to that list if it isn't already
  imported).
- `todayIsoDate` must exist somewhere in this file (used by
  `SoulWonRecordForm` already) — if the earlier investigation's note about
  not finding it in the 260-300 line range means it's defined elsewhere,
  locate it with `grep -n "todayIsoDate" src/screens.tsx` and confirm it's in
  scope for `MeetingRecordForm` (same file, so it will be — this is just a
  sanity check, not an expected code change).

- [ ] **Step 6: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/screens.tsx
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "feat: add My Meetings tab and MeetingRecordForm to Life Center screen

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Manual QA

- [ ] **Step 1: Run the app**

```bash
cd /Users/akwaah/Documents/GitHub/wwm-mobile
npx expo start
```

- [ ] **Step 2: Walk through the flow**

As a user who is on a life center's leadership roster (`life_center_member`
row for that center): open Grow → Life Center, confirm the "Souls Won" /
"My Meetings" segment switcher appears under Life Center Details, switch to
"My Meetings", tap "Log Meeting", pick a recent date, tap a couple of
existing souls as attendees, tap "+ Add new first timer", fill the nested
form, save it, confirm it appears already toggled-on in the First Timers
chip row, fill offering amount + currency, save the meeting, confirm it
shows in the list with correct attendee/first-timer counts. Edit it, remove
one attendee, save, confirm the count updates. Delete it, confirm it
disappears (with the confirmation alert shown first).

As a user NOT on that roster (viewing a different life center's souls list,
if reachable, or simulate by temporarily hard-coding `isLeadershipMember` to
`false` during QA): confirm "Log Meeting" and the Edit/Delete buttons do not
render, but the meetings list (if any are visible per whatever list-scoping
the backend enforces) still renders read-only.

- [ ] **Step 3: Final commit / PR**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile push -u origin codex/life-center-meetings
gh pr create --base dev --title "Life Center Meetings (mobile)" --body "Implements the My Meetings tab per docs/superpowers/specs/2026-08-05-life-center-meetings-design.md in the Frontend repo.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Done criteria

- `npx tsc --noEmit` passes with no errors.
- `LifeCenterScreen` shows a working Souls Won / My Meetings segment switch.
- A leadership-roster member can log, edit, and delete meetings, including
  adding a brand-new first-timer inline without leaving the meeting form.
- A non-roster member sees the list read-only.
- PR opened against `dev`.
