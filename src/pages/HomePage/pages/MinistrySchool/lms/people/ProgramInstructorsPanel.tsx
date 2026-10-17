import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import type { UserType } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import type { InstructorAbilities, ProgramInstructor } from "@/utils/api/ministrySchool/interfaces";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { runAction } from "../runAction";
import { somPaths } from "../somUtils";
import { Avatar, Btn, EmptyBlock, LoadError, Panel, Pill } from "../ui";

type Props = { programId: number; canManage: boolean };
type AbilityKey = keyof InstructorAbilities;

const ABILITIES: { key: AbilityKey; label: string }[] = [
  { key: "can_grade", label: "Grade submissions" },
  { key: "can_attendance", label: "Take attendance" },
  { key: "can_message", label: "Message their classes" },
  { key: "can_edit_curriculum", label: "Edit program curriculum" },
];

const DEFAULT_ABILITIES: InstructorAbilities = {
  can_grade: true,
  can_attendance: true,
  can_message: true,
  can_edit_curriculum: false,
};

const MAX_RESULTS = 60;

export const ProgramInstructorsPanel = ({ programId, canManage }: Props) => {
  const { data, loading, error, refetch } = useFetch(
    api.fetch.fetchProgramInstructors,
    { programId: String(programId) },
    !canManage
  );
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const rows = useMemo(
    () => [...(data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  );

  if (!canManage) {
    return (
      <EmptyBlock msg="The instructor roster is managed by School of Ministry managers. Class instructors are shown on each class in the Cohorts tab." />
    );
  }
  if (loading && !data) return <SkeletonLoader />;

  const add = async (userIds: number[], abilities: InstructorAbilities) => {
    const ok = await runAction(() => api.post.addProgramInstructors({ programId, userIds, ...abilities }), {
      success: userIds.length === 1 ? "Instructor added" : `${userIds.length} instructors added`,
      failure: "Could not add instructors",
    });
    if (ok) refetch();
    return ok;
  };

  const addToRoster = async (row: ProgramInstructor) => {
    setBusy(row.userId);
    await add([row.userId], DEFAULT_ABILITIES);
    setBusy(null);
  };

  const toggle = async (row: ProgramInstructor, key: AbilityKey, value: boolean) => {
    if (row.id === null) return;
    const rosterId = row.id;
    setBusy(row.userId);
    const ok = await runAction(() => api.put.updateProgramInstructor({ [key]: value }, { id: String(rosterId) }), {
      failure: "Could not update this instructor",
    });
    setBusy(null);
    if (ok) refetch();
  };

  const remove = (row: ProgramInstructor) => {
    if (row.id === null) return;
    showDeleteDialog({ name: row.name, id: row.id }, async (id) => {
      const ok = await runAction(() => api.delete.removeProgramInstructor({ id: String(id) }), {
        success: `${row.name} removed from the roster`,
        failure: "Could not remove this instructor",
      });
      if (ok) refetch();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {error && !data && <LoadError msg="Could not load instructors." onRetry={() => refetch()} />}
      <Panel
        title="Instructors teaching this program"
        action={
          <Btn size="sm" variant="primary" onClick={() => setAdding(true)}>
            + Add instructors
          </Btn>
        }
      >
        <p className="border-b border-gray-100 px-4 py-2.5 text-sm text-primaryGray">
          Add instructors here, then assign them to a class from the Cohorts tab.
        </p>
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyBlock msg="No instructors yet." />
          </div>
        ) : (
          <ul>
            {rows.map((row) => {
              const disabled = busy === row.userId;
              return (
                <li
                  key={row.userId}
                  className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 last:border-0 laptop:flex-row laptop:items-start laptop:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <Avatar name={row.name} />
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-primary">{row.name}</p>
                        {!row.onRoster && <Pill tone="amber">Not on roster (teaches a class)</Pill>}
                      </div>
                      {row.email && <p className="truncate text-xs text-mainGray">{row.email}</p>}
                      {row.classes.length > 0 ? (
                        <ul className="flex flex-col gap-0.5 text-xs">
                          {row.classes.map((c) => (
                            <li key={c.id}>
                              <Link to={somPaths.class(c.cohortId, c.id)} className="text-primary hover:underline">
                                {c.cohortName} · {c.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-mainGray">No classes assigned yet</p>
                      )}
                    </div>
                  </div>
                  <fieldset className="flex flex-col gap-1 text-sm" disabled={disabled || !row.onRoster}>
                    <legend className="sr-only">Abilities for {row.name}</legend>
                    {ABILITIES.map((a) => (
                      <label
                        key={a.key}
                        className="flex items-center gap-2 text-primary"
                        title={row.onRoster ? undefined : "Add to the roster to change abilities"}
                      >
                        <input
                          type="checkbox"
                          checked={row[a.key]}
                          onChange={(e) => toggle(row, a.key, e.target.checked)}
                        />
                        {a.label}
                      </label>
                    ))}
                  </fieldset>
                  <div className="flex gap-2 laptop:justify-end">
                    {row.onRoster ? (
                      <Btn size="sm" disabled={disabled} onClick={() => remove(row)}>
                        Remove
                      </Btn>
                    ) : (
                      <Btn size="sm" disabled={disabled} onClick={() => addToRoster(row)}>
                        Add to roster
                      </Btn>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-mainGray">
          Instructors can only grade, take attendance and message in programs they teach or are on the roster of.
        </p>
      </Panel>

      {adding && (
        <AddInstructorsModal
          excludeIds={rows.filter((r) => r.onRoster).map((r) => r.userId)}
          onClose={() => setAdding(false)}
          onAdd={async (ids, abilities) => {
            const ok = await add(ids, abilities);
            if (ok) setAdding(false);
          }}
        />
      )}
    </div>
  );
};

const AddInstructorsModal = ({
  excludeIds,
  onClose,
  onAdd,
}: {
  excludeIds: number[];
  onClose: () => void;
  onAdd: (userIds: number[], abilities: InstructorAbilities) => Promise<void>;
}) => {
  const membersOptions = useStore((s) => s.membersOptions);
  const setMemberOptions = useStore((s) => s.setMemberOptions);
  const { data: membersData, loading } = useFetch(
    api.fetch.fetchMembersForOptions,
    undefined,
    membersOptions.length > 0
  );

  useEffect(() => {
    if (membersData?.data?.length) setMemberOptions(membersData.data as unknown as UserType[]);
  }, [membersData, setMemberOptions]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [abilities, setAbilities] = useState<InstructorAbilities>(DEFAULT_ABILITIES);
  const [saving, setSaving] = useState(false);

  const available = useMemo(() => {
    const excluded = new Set(excludeIds.map(String));
    return membersOptions
      .filter((m) => !excluded.has(m.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [membersOptions, excludeIds]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? available.filter((m) => m.label.toLowerCase().includes(q)) : available;
  }, [available, search]);

  const toggleMember = (value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const submit = async () => {
    setSaving(true);
    await onAdd([...selected].map(Number), abilities);
    setSaving(false);
  };

  return (
    <Modal open onClose={() => !saving && onClose()} className="!max-w-lg" title="Add instructors">
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-primary">Add instructors</h3>
          <p className="text-sm text-primaryGray">Pick the people who will teach in this program.</p>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="search"
            aria-label="Search members"
            placeholder="Search members by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-lg border border-lightGray bg-inputBackground px-3 text-sm text-primary"
          />
          <div
            role="group"
            aria-label="Members"
            className="max-h-64 overflow-y-auto rounded-lg border border-gray-200"
          >
            {loading && !membersOptions.length ? (
              <p className="px-3 py-3 text-sm text-primaryGray">Loading members…</p>
            ) : matches.length === 0 ? (
              <p className="px-3 py-3 text-sm text-primaryGray">No members match “{search}”.</p>
            ) : (
              matches.slice(0, MAX_RESULTS).map((m) => (
                <label
                  key={m.value}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-gray-100 px-3 py-2 text-sm text-primary last:border-0 hover:bg-gray-50"
                >
                  <input type="checkbox" checked={selected.has(m.value)} onChange={() => toggleMember(m.value)} />
                  <Avatar name={m.label} />
                  <span className="truncate">{m.label}</span>
                </label>
              ))
            )}
            {matches.length > MAX_RESULTS && (
              <p className="px-3 py-2 text-xs text-mainGray">
                Showing {MAX_RESULTS} of {matches.length}. Type to narrow the list.
              </p>
            )}
          </div>
          <p className="text-xs text-mainGray">{selected.size} selected</p>
        </div>

        <fieldset className="flex flex-col gap-1.5 text-sm">
          <legend className="mb-1 font-medium text-primary">They can</legend>
          {ABILITIES.map((a) => (
            <label key={a.key} className="flex items-center gap-2 text-primary">
              <input
                type="checkbox"
                checked={abilities[a.key]}
                onChange={(e) => setAbilities((prev) => ({ ...prev, [a.key]: e.target.checked }))}
              />
              {a.label}
            </label>
          ))}
        </fieldset>

        <div className="flex justify-end gap-2">
          <Btn onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit} disabled={saving || selected.size === 0}>
            {saving
              ? "Adding…"
              : selected.size
                ? `Add ${selected.size} instructor${selected.size === 1 ? "" : "s"}`
                : "Add instructors"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

export default ProgramInstructorsPanel;
