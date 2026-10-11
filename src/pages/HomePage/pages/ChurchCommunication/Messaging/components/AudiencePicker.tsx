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

interface AudiencePickerProps {
  value: MessageAudience;
  onChange: (value: MessageAudience) => void;
  onCount: (count: AudienceCount | null) => void;
  count: AudienceCount | null;
}

export const AudiencePicker = ({ value, onChange, onCount, count }: AudiencePickerProps) => {
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const membersOptions = useStore((s) => s.membersOptions);
  const [counting, setCounting] = useState(false);

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
      onCount(null);
      return;
    }
    let cancelled = false;
    setCounting(true);
    const timer = setTimeout(async () => {
      try {
        const response = await api.post.countMessageAudience({ audience: value });
        if (!cancelled) onCount(response.data);
      } catch {
        if (!cancelled) onCount(null);
      } finally {
        if (!cancelled) setCounting(false);
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
      <div className="inline-flex rounded-lg border border-lightGray p-1" role="radiogroup">
        {SCOPES.map((s) => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={value.scope === s.value}
            onClick={() => onChange({ ...emptyAudience(), scope: s.value })}
            className={`rounded-md px-3 py-1.5 text-sm ${value.scope === s.value ? "bg-primary text-white" : "text-primary"}`}
          >
            {s.label}
          </button>
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
        {counting
          ? "Counting…"
          : count
            ? `${count.people} people · ${count.sms} with a phone · ${count.email} with an email · ${count.inApp} on the app`
            : ""}
      </p>
    </fieldset>
  );
};
