import { ReactNode, useEffect, useMemo, useState } from "react";

import { BranchSelectField } from "@/components/BranchSelectField";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { useActiveMemberOptions } from "@/pages/HomePage/pages/MembershipManagement/components/departments/useActiveMemberOptions";
import { errorText } from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import {
  DialogShell,
  Field,
  SelectInput,
  SelectOption,
  TextArea,
  TextInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { formatDate } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { api } from "@/utils/api/apiCalls";
import type { VisitorType } from "@/utils/api/visitors/interfaces";
import {
  COMPLETED_STATUS,
  createVisitor,
  FollowUpInput,
  isCompletedStatus,
  PENDING_STATUS,
  recordVisit,
  responsibleMemberIds,
  saveFollowUp,
  setResponsibleMembers,
  updateVisitor,
  visitorToPayload,
} from "@/utils/api/visitors/visitorActions";
import { cn } from "@/utils/cn";

import {
  FOLLOW_UP_TYPES,
  HEARD_OPTIONS,
  isoDay,
  TITLE_OPTIONS,
} from "../utils/visitorHelpers";

/* -------------------------------------------------------------------------- */
/*                                   Shared                                   */
/* -------------------------------------------------------------------------- */

type FormValues = Record<string, string>;
type FormErrors = Record<string, string>;

const todayIso = () => isoDay(new Date());

const YES_NO: SelectOption[] = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

const useForm = (open: boolean, initial: () => FormValues) => {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(initial());
    setErrors({});
    setSaving(false);
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (key: string) => (
    event: { target: { value: string } }
  ) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  /** Returns true when every listed key has a value; marks the rest. */
  const require = (rules: [string, string][]) => {
    const next: FormErrors = {};
    rules.forEach(([key, message]) => {
      if (!String(values[key] ?? "").trim()) next[key] = message;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const run = async (task: () => Promise<void>, fallback: string) => {
    setSaving(true);
    try {
      await task();
    } catch (error) {
      showNotification(errorText(error, fallback), "error");
    } finally {
      setSaving(false);
    }
  };

  return { values, setValues, errors, setErrors, saving, set, require, run };
};

const FieldGrid = ({ children, wide }: { children: ReactNode; wide?: boolean }) => (
  <div
    className={cn(
      "grid gap-4",
      wide
        ? "grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))]"
        : "grid-cols-1"
    )}
  >
    {children}
  </div>
);

/** Events in the month of `date`, for visit event pickers. */
const useEventOptions = (open: boolean, date: string, keepId?: string) => {
  const query = useMemo(() => {
    const day = date || todayIso();
    const next: Record<string, string> = {
      year: String(Number(day.slice(0, 4))),
      month: String(Number(day.slice(5, 7))),
    };
    if (keepId) next.includeEventId = keepId;
    return next;
  }, [date, keepId]);
  const { data, loading } = useFetch(api.fetch.fetchEventOptions, query, !open, {
    silent: true,
  });
  const options = useMemo<SelectOption[]>(
    () =>
      (Array.isArray(data?.data) ? data.data : []).map((event) => ({
        value: String(event.id),
        label: `${event.name || "Untitled event"} · ${formatDate(event.start_date)}`,
      })),
    [data]
  );
  return { options, loading };
};

const eventSelectOptions = (
  options: SelectOption[],
  loading: boolean,
  emptyLabel: string
): SelectOption[] => [
  {
    value: "",
    label: loading ? "Loading events…" : options.length ? emptyLabel : "No events that month",
  },
  ...options,
];

/* -------------------------------------------------------------------------- */
/*                            Register / edit visitor                         */
/* -------------------------------------------------------------------------- */

const visitorInitial = (visitor?: VisitorType | null): FormValues => ({
  branch: "",
  title: visitor?.title || "",
  first: visitor?.firstName || "",
  last: visitor?.lastName || "",
  gender: visitor?.gender || "",
  code: visitor?.country_code || "+233",
  phone: visitor?.phone || "",
  email: visitor?.email || "",
  city: visitor?.city || "",
  howHeard: visitor?.howHeard || "",
  date: todayIso(),
  event: "",
  wish: visitor?.membershipWish ? "yes" : "no",
  consent: visitor?.consentToContact ? "yes" : "no",
  resp: "",
  isClergy: visitor?.isClergy ? "yes" : "no",
  church: visitor?.churchName || "",
  location: visitor?.churchLocation || "",
  role: visitor?.churchRole || "",
});

export const VisitorFormDialog = ({
  open,
  visitor,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Present when editing. */
  visitor?: VisitorType | null;
  onClose: () => void;
  onSaved: (created: boolean) => void;
}) => {
  const editing = Boolean(visitor);
  // New visitors get a branch: a choice in "all my branches", otherwise the
  // fixed branch (shown read-only with the reason).
  const needsBranch = !editing;
  const form = useForm(open, () => visitorInitial(visitor));
  const { values, errors, set } = form;
  const clergy = values.isClergy === "yes";
  const members = useActiveMemberOptions(open);
  const events = useEventOptions(open && !editing, values.date);

  const assigned = visitor ? responsibleMemberIds(visitor).map(String) : [];
  const respOptions: SelectOption[] = [
    { value: "", label: editing ? "Keep current" : "Assign later" },
    ...members.filter((member) => !assigned.includes(member.value)),
  ];

  const submit = () => {
    const ok = form.require([
      ...(needsBranch ? ([["branch", "Choose a branch"]] as [string, string][]) : []),
      ["first", "First name is required"],
      ["last", "Last name is required"],
      ["phone", "Phone number is required"],
      ...(editing ? [] : ([["date", "Visit date is required"]] as [string, string][])),
      ...(clergy
        ? ([
            ["church", "Church name is required"],
            ["location", "Church location is required"],
          ] as [string, string][])
        : []),
    ]);
    if (!ok) return;

    const base = visitor ? visitorToPayload(visitor) : visitorToPayload({} as VisitorType);
    const payload = {
      ...base,
      ...(needsBranch && values.branch ? { branch_id: Number(values.branch) } : {}),
      personal_info: {
        ...base.personal_info,
        title: values.title,
        first_name: values.first.trim(),
        last_name: values.last.trim(),
        gender: values.gender,
      },
      contact_info: {
        ...base.contact_info,
        email: values.email.trim(),
        phone: { country_code: values.code.trim() || "+233", number: values.phone.trim() },
        city: values.city.trim(),
      },
      visit: editing
        ? { ...base.visit, howHeard: values.howHeard }
        : { date: values.date, eventId: values.event || undefined, howHeard: values.howHeard },
      membershipWish: values.wish === "yes",
      consentToContact: values.consent === "yes",
      responsibleMembers: values.resp
        ? Array.from(new Set([...base.responsibleMembers, Number(values.resp)]))
        : base.responsibleMembers,
      isClergy: clergy,
      clergy_info: clergy
        ? { churchName: values.church.trim(), churchLocation: values.location.trim(), churchRole: values.role.trim() }
        : { churchName: "", churchLocation: "", churchRole: "" },
    };

    form.run(async () => {
      if (visitor) {
        await updateVisitor(visitor.id, payload);
        showNotification("Visitor updated", "success");
      } else {
        await createVisitor(payload);
      }
      onSaved(!editing);
    }, editing ? "Could not update the visitor." : "Could not register the visitor.");
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      wide
      title={editing ? "Edit visitor" : "Register visitor"}
      subtitle={editing ? "Update the visitor’s details." : "Record someone visiting for the first time."}
      ctaLabel={editing ? "Save changes" : "Register visitor"}
      onConfirm={submit}
      loading={form.saving}
    >
      <FieldGrid wide>
        {needsBranch && (
          <div className="col-span-full">
            <BranchSelectField
              value={values.branch === "" ? "" : Number(values.branch)}
              onChange={(branchId) => set("branch")({ target: { value: String(branchId) } })}
              required
              error={errors.branch}
            />
          </div>
        )}
        <Field label="Title">
          <SelectInput
            options={[{ value: "", label: "Select title" }, ...TITLE_OPTIONS.map((t) => ({ value: t, label: t }))]}
            value={values.title}
            onChange={set("title")}
          />
        </Field>
        <Field label="First name *" error={errors.first}>
          <TextInput value={values.first} onChange={set("first")} hasError={Boolean(errors.first)} />
        </Field>
        <Field label="Last name *" error={errors.last}>
          <TextInput value={values.last} onChange={set("last")} hasError={Boolean(errors.last)} />
        </Field>
        <Field label="Gender">
          <SelectInput
            options={[
              { value: "", label: "Select gender" },
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
            ]}
            value={values.gender}
            onChange={set("gender")}
          />
        </Field>
        <Field label="Phone number *" error={errors.phone}>
          <div className="flex gap-2">
            <TextInput
              value={values.code}
              onChange={set("code")}
              aria-label="Country code"
              className="w-[84px] flex-shrink-0"
            />
            <TextInput
              type="tel"
              value={values.phone}
              onChange={set("phone")}
              placeholder="24 000 0000"
              hasError={Boolean(errors.phone)}
            />
          </div>
        </Field>
        <Field label="Email">
          <TextInput type="email" value={values.email} onChange={set("email")} placeholder="name@example.com" />
        </Field>
        <Field label="City / town">
          <TextInput value={values.city} onChange={set("city")} />
        </Field>
        <Field label="How did they hear about us?">
          <SelectInput
            options={[
              { value: "", label: "Select source" },
              ...HEARD_OPTIONS,
              ...(values.howHeard &&
              !HEARD_OPTIONS.some((option) => option.value === values.howHeard)
                ? [{ value: values.howHeard, label: values.howHeard }]
                : []),
            ]}
            value={values.howHeard}
            onChange={set("howHeard")}
          />
        </Field>
        {!editing && (
          <>
            <Field label="Visit date *" error={errors.date}>
              <TextInput type="date" value={values.date} onChange={set("date")} hasError={Boolean(errors.date)} />
            </Field>
            <Field label="Event attended">
              <SelectInput
                options={eventSelectOptions(events.options, events.loading, "Select event")}
                value={values.event}
                onChange={set("event")}
              />
            </Field>
          </>
        )}
        <Field label="Interested in membership?">
          <SelectInput
            options={[
              { value: "no", label: "Not yet" },
              { value: "yes", label: "Yes" },
            ]}
            value={values.wish}
            onChange={set("wish")}
          />
        </Field>
        <Field label="Happy to be contacted?">
          <SelectInput options={YES_NO} value={values.consent} onChange={set("consent")} />
        </Field>
        <Field label="Responsible person">
          <SelectInput options={respOptions} value={values.resp} onChange={set("resp")} />
        </Field>
        <Field label="Are they clergy?">
          <SelectInput options={YES_NO} value={values.isClergy} onChange={set("isClergy")} />
        </Field>
        {clergy && (
          <>
            <Field label="Church name *" error={errors.church}>
              <TextInput value={values.church} onChange={set("church")} hasError={Boolean(errors.church)} />
            </Field>
            <Field label="Church location *" error={errors.location}>
              <TextInput value={values.location} onChange={set("location")} hasError={Boolean(errors.location)} />
            </Field>
            <Field label="Role in church">
              <TextInput value={values.role} onChange={set("role")} />
            </Field>
          </>
        )}
      </FieldGrid>
    </DialogShell>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Record a visit                               */
/* -------------------------------------------------------------------------- */

export const VisitDialog = ({
  open,
  visitor,
  onClose,
  onSaved,
}: {
  open: boolean;
  visitor: VisitorType | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const form = useForm(open, () => ({ date: todayIso(), event: "", notes: "" }));
  const { values, errors, set } = form;
  const events = useEventOptions(open, values.date);

  const submit = () => {
    if (!visitor) return;
    const ok = form.require([
      ["date", "Visit date is required"],
      ["event", "Choose the event they attended"],
    ]);
    if (!ok) return;
    form.run(async () => {
      await recordVisit(visitor.id, {
        date: values.date,
        eventId: values.event,
        notes: values.notes.trim(),
      });
      showNotification("Visit recorded", "success");
      onSaved();
    }, "Could not record the visit.");
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title="Record a visit"
      subtitle={visitor ? `Log another visit for ${visitor.firstName} ${visitor.lastName}.` : undefined}
      ctaLabel="Record visit"
      onConfirm={submit}
      loading={form.saving}
    >
      <FieldGrid>
        <Field label="Visit date *" error={errors.date}>
          <TextInput type="date" value={values.date} onChange={set("date")} hasError={Boolean(errors.date)} />
        </Field>
        <Field label="Event *" error={errors.event}>
          <SelectInput
            options={eventSelectOptions(events.options, events.loading, "Select event")}
            value={values.event}
            onChange={set("event")}
            hasError={Boolean(errors.event)}
          />
        </Field>
        <Field label="Notes">
          <TextArea
            value={values.notes}
            onChange={set("notes")}
            maxLength={500}
            placeholder="Anything worth remembering about this visit"
          />
        </Field>
      </FieldGrid>
    </DialogShell>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Record a follow-up                            */
/* -------------------------------------------------------------------------- */

export interface FollowUpDraft extends Partial<FollowUpInput> {
  id?: string | number;
}

export const FollowUpDialog = ({
  open,
  visitor,
  draft,
  responsible,
  onClose,
  onSaved,
}: {
  open: boolean;
  visitor: VisitorType | null;
  /** Existing follow-up when editing. */
  draft?: FollowUpDraft | null;
  /** Members who can be assigned (the visitor's responsible persons). */
  responsible: SelectOption[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const editing = draft?.id !== undefined;
  const form = useForm(open, () => ({
    date: draft?.date ? isoDay(draft.date) : todayIso(),
    type: draft?.type || "",
    assignedTo: draft?.assignedTo || responsible[0]?.value || "",
    status: draft?.status
      ? isCompletedStatus(draft.status)
        ? COMPLETED_STATUS
        : PENDING_STATUS
      : COMPLETED_STATUS,
    notes: draft?.notes || "",
  }));
  const { values, errors, set } = form;

  const typeOptions = [
    { value: "", label: "How did you reach them?" },
    ...FOLLOW_UP_TYPES,
    ...(values.type && !FOLLOW_UP_TYPES.some((option) => option.value === values.type)
      ? [{ value: values.type, label: values.type }]
      : []),
  ];

  const submit = () => {
    if (!visitor) return;
    const ok = form.require([
      ["date", "Date is required"],
      ["type", "Choose a type"],
      ["assignedTo", "Choose who followed up"],
      ["notes", "Add a short note"],
    ]);
    if (!ok) return;
    form.run(async () => {
      await saveFollowUp(
        visitor.id,
        {
          date: values.date,
          type: values.type,
          assignedTo: values.assignedTo,
          status: values.status,
          notes: values.notes.trim(),
        },
        draft?.id
      );
      showNotification(editing ? "Follow-up updated" : "Follow-up recorded", "success");
      onSaved();
    }, "Could not save the follow-up.");
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={editing ? "Edit follow-up" : "Record a follow-up"}
      subtitle={visitor ? `Note how ${visitor.firstName} was contacted and what happened.` : undefined}
      ctaLabel={editing ? "Save follow-up" : "Record follow-up"}
      onConfirm={submit}
      loading={form.saving}
    >
      <FieldGrid>
        <Field label="Date *" error={errors.date}>
          <TextInput type="date" value={values.date} onChange={set("date")} hasError={Boolean(errors.date)} />
        </Field>
        <Field label="Type *" error={errors.type}>
          <SelectInput options={typeOptions} value={values.type} onChange={set("type")} hasError={Boolean(errors.type)} />
        </Field>
        <Field label="Assigned to *" error={errors.assignedTo}>
          <SelectInput
            options={[{ value: "", label: "Select responsible member" }, ...responsible]}
            value={values.assignedTo}
            onChange={set("assignedTo")}
            hasError={Boolean(errors.assignedTo)}
          />
        </Field>
        <Field label="Status">
          <SelectInput
            options={[
              { value: COMPLETED_STATUS, label: "Completed" },
              { value: PENDING_STATUS, label: "Pending" },
            ]}
            value={values.status}
            onChange={set("status")}
          />
        </Field>
        <Field label="Note *" error={errors.notes}>
          <TextArea
            value={values.notes}
            onChange={set("notes")}
            placeholder="What was discussed?"
            hasError={Boolean(errors.notes)}
          />
        </Field>
      </FieldGrid>
    </DialogShell>
  );
};

/* -------------------------------------------------------------------------- */
/*                         Assign a responsible person                        */
/* -------------------------------------------------------------------------- */

export const AssignResponsibleDialog = ({
  open,
  visitor,
  onClose,
  onSaved,
}: {
  open: boolean;
  visitor: VisitorType | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const form = useForm(open, () => ({ resp: "" }));
  const members = useActiveMemberOptions(open);
  const assigned = visitor ? responsibleMemberIds(visitor) : [];
  const options = members.filter((member) => !assigned.includes(Number(member.value)));

  const submit = () => {
    if (!visitor || !form.require([["resp", "Choose a member"]])) return;
    form.run(async () => {
      await setResponsibleMembers(visitor, [...assigned, Number(form.values.resp)]);
      showNotification("Responsible person assigned", "success");
      onSaved();
    }, "Could not assign the responsible person.");
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title="Assign responsible person"
      subtitle={visitor ? `They will follow up with ${visitor.firstName}.` : undefined}
      ctaLabel="Assign"
      onConfirm={submit}
      loading={form.saving}
    >
      <Field label="Member *" error={form.errors.resp}>
        <SelectInput
          options={[{ value: "", label: "Select member" }, ...options]}
          value={form.values.resp}
          onChange={form.set("resp")}
          hasError={Boolean(form.errors.resp)}
        />
      </Field>
    </DialogShell>
  );
};
