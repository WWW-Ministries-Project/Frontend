import { useEffect, useMemo, useState } from "react";
import Multiselect from "@/components/MultiSelect";
import { api } from "@/utils/api/apiCalls";
import { useStore } from "@/store/useStore";
import type { DepartmentType } from "@/utils/interfaces";
import type {
  AudienceCount,
  AudienceScope,
  MessageAudience,
} from "@/utils/api/messaging/interfaces";

const SCOPES: { value: AudienceScope; label: string }[] = [
  { value: "CHURCH", label: "Whole church" },
  { value: "DEPARTMENTS", label: "Departments" },
  { value: "PEOPLE", label: "Specific people" },
];

export const emptyAudience = (): MessageAudience => ({
  scope: "CHURCH",
  departmentIds: [],
  userIds: [],
  includeGuests: false,
  includeVisitors: false,
});

export const isAudienceComplete = (a: MessageAudience) =>
  a.scope === "CHURCH" ||
  (a.scope === "DEPARTMENTS" && a.departmentIds.length > 0) ||
  (a.scope === "PEOPLE" && a.userIds.length > 0);

/** idle: audience incomplete · loading: count in flight · error: count failed · ok: count is current. */
export type AudienceCountState = "idle" | "loading" | "error" | "ok";

interface AudiencePickerProps {
  value: MessageAudience;
  onChange: (value: MessageAudience) => void;
  onCount: (count: AudienceCount | null, state: AudienceCountState) => void;
  count: AudienceCount | null;
  countState: AudienceCountState;
}

export const AudiencePicker = ({ value, onChange, onCount, count, countState }: AudiencePickerProps) => {
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const membersOptions = useStore((s) => s.membersOptions);

  // Plain fetch (not useFetch): useFetch toggles the full-screen loader.
  useEffect(() => {
    let cancelled = false;
    api.fetch
      .fetchDepartments()
      .then((response) => {
        if (!cancelled) setDepartments(response.data ?? []);
      })
      .catch(() => {
        // Department list is optional for the other scopes.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ label: d.name, value: String(d.id) })),
    [departments]
  );

  useEffect(() => {
    if (!isAudienceComplete(value)) {
      onCount(null, "idle");
      return;
    }
    let cancelled = false;
    // Drop the stale count right away so nothing can be sent against it
    // during the debounce.
    onCount(null, "loading");
    const timer = setTimeout(async () => {
      try {
        const response = await api.post.countMessageAudience({ audience: value });
        if (!cancelled) onCount(response.data, "ok");
      } catch {
        if (!cancelled) onCount(null, "error");
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, onCount]);

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-primary">Send to</legend>
      {/* Native radios styled as a segmented control; the fieldset legend names the group. */}
      <div className="inline-flex rounded-lg border border-lightGray p-1">
        {SCOPES.map((s) => (
          <label
            key={s.value}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-primary/40 ${value.scope === s.value ? "bg-primary text-white" : "text-primary"}`}
          >
            <input
              type="radio"
              name="audience-scope"
              value={s.value}
              checked={value.scope === s.value}
              onChange={() => onChange({ ...emptyAudience(), scope: s.value })}
              className="sr-only"
            />
            {s.label}
          </label>
        ))}
      </div>

      {value.scope === "CHURCH" && (
        <div className="space-y-1 text-sm">
          <p className="text-gray-500">All active members.</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={value.includeGuests} onChange={(e) => onChange({ ...value, includeGuests: e.target.checked })} />
            Include guests
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={value.includeVisitors} onChange={(e) => onChange({ ...value, includeVisitors: e.target.checked })} />
            Include visitors who agreed to be contacted
          </label>
        </div>
      )}
      {value.scope === "DEPARTMENTS" && (
        <Multiselect
          options={departmentOptions}
          selectedValues={value.departmentIds.map(String)}
          onChange={(ids) => onChange({ ...value, departmentIds: ids.map(Number) })}
          placeholder="Choose departments"
        />
      )}
      {value.scope === "PEOPLE" && (
        <Multiselect
          options={membersOptions}
          selectedValues={value.userIds.map(String)}
          onChange={(ids) => onChange({ ...value, userIds: ids.map(Number) })}
          placeholder="Search members"
        />
      )}

      <p className="text-sm text-gray-600" aria-live="polite">
        {countState === "loading"
          ? "Counting…"
          : countState === "error"
            ? "Couldn't count recipients."
            : countState === "ok" && count
              ? `${count.people} people · ${count.sms} with a phone · ${count.email} with an email · ${count.inApp} on the app`
              : ""}
      </p>
    </fieldset>
  );
};
