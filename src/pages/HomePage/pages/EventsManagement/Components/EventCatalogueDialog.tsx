import { useEffect, useState } from "react";

import { BranchSelectField } from "@/components/BranchSelectField";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import type { EventType } from "@/utils/api/events/interfaces";

import { EVENT_TYPES, normalizeType, WEEKDAYS } from "../utils/eventsModel";
import { DialogShell, Field, Segmented, SelectInput, TextArea, TextInput } from "./eventsUi";

interface Draft {
  name: string;
  type: string;
  category: "WEEKLY" | "SPECIAL";
  day: string;
  start: string;
  end: string;
  description: string;
  branchId: number | "";
}

const fromEvent = (event: EventType | null): Draft => ({
  name: event?.event_name ?? "",
  type: event ? normalizeType(event.event_type) : "SERVICE",
  category: event?.event_category === "WEEKLY" ? "WEEKLY" : "SPECIAL",
  day: typeof event?.schedule_day === "number" ? String(event.schedule_day) : "0",
  start: event?.schedule_start_time ?? "09:00",
  end: event?.schedule_end_time ?? "11:00",
  description: event?.event_description ?? "",
  branchId: event?.branch_id ?? "",
});

/** "New event" / "Edit event" for the catalogue. */
const EventCatalogueDialog = ({
  open,
  event,
  existing,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  event: EventType | null;
  existing: EventType[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: EventType) => void | Promise<void>;
}) => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const [draft, setDraft] = useState<Draft>(() => fromEvent(event));
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(fromEvent(event));
      setError("");
    }
  }, [event, open]);

  const update = (patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setError("");
  };

  const submit = () => {
    const name = draft.name.trim();
    if (name.length < 3) return setError("Give the event a name of at least 3 characters.");
    if (
      existing.some(
        (item) => String(item.id) !== String(event?.id ?? "") && item.event_name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      return setError("An event with this name already exists.");
    }
    if (draft.category === "WEEKLY" && (!draft.start || !draft.end || draft.end === draft.start)) {
      return setError("Add a start and end time. The end must differ from the start.");
    }
    if (activeBranchId === ALL_BRANCHES && draft.branchId === "") {
      return setError("Choose the branch it belongs to.");
    }
    const weekly = draft.category === "WEEKLY";
    void onSave({
      id: event?.id ?? "",
      event_name: name,
      event_type: draft.type,
      event_description: draft.description.trim(),
      event_category: draft.category,
      schedule_day: weekly ? Number(draft.day) : "",
      schedule_start_time: weekly ? draft.start : "",
      schedule_end_time: weekly ? draft.end : "",
      branch_id: draft.branchId,
    });
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={event ? "Edit event" : "New event"}
      subtitle="Define it once, then schedule it as often as you need."
      ctaLabel={event ? "Save event" : "Add event"}
      onConfirm={submit}
      loading={saving}
      wide
    >
      <div className="flex flex-col gap-4">
        <Field label={<span className="font-medium">Name</span>}>
          <TextInput
            value={draft.name}
            placeholder="e.g. Youth Camp"
            onChange={(e) => update({ name: e.target.value })}
            autoFocus
          />
        </Field>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-primary">Type</span>
          <Segmented
            role="radiogroup"
            ariaLabel="Type"
            items={EVENT_TYPES.map((type) => ({ key: type.key, label: type.label }))}
            value={normalizeType(draft.type)}
            onChange={(key) => update({ type: key })}
            scroll
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-primary">How often</span>
          <Segmented
            role="radiogroup"
            ariaLabel="How often"
            items={[
              { key: "WEEKLY", label: "Weekly" },
              { key: "SPECIAL", label: "Special / one-off" },
            ]}
            value={draft.category}
            onChange={(key) => update({ category: key })}
          />
        </div>
        {draft.category === "WEEKLY" && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-3">
            <Field label={<span className="font-medium">Day</span>}>
              <SelectInput
                value={draft.day}
                onChange={(e) => update({ day: e.target.value })}
                options={WEEKDAYS.map((day, index) => ({ value: String(index), label: day }))}
              />
            </Field>
            <Field label={<span className="font-medium">Starts</span>}>
              <TextInput type="time" value={draft.start} onChange={(e) => update({ start: e.target.value })} />
            </Field>
            <Field label={<span className="font-medium">Ends</span>}>
              <TextInput type="time" value={draft.end} onChange={(e) => update({ end: e.target.value })} />
            </Field>
            {draft.end && draft.start && draft.end < draft.start && (
              <p className="col-span-full text-xs text-gray-600">Ends after midnight, so it runs into the next day.</p>
            )}
          </div>
        )}
        <BranchSelectField value={draft.branchId} onChange={(value) => update({ branchId: value })} required />
        <Field label={<span className="font-medium">Description</span>}>
          <TextArea rows={3} value={draft.description} onChange={(e) => update({ description: e.target.value })} />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </DialogShell>
  );
};

export default EventCatalogueDialog;
