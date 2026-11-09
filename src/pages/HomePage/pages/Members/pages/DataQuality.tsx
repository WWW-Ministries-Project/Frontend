import { useFetch } from "@/CustomHooks/useFetch";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { notify } from "@/components/feedback";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { PageHeading } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { api } from "@/utils/api/apiCalls";
import type {
  DuplicateCandidate,
  DuplicatePerson,
  DobRelation,
  BulkMergeJob,
} from "@/utils/api/dataQuality/interfaces";
import { cn } from "@/utils/cn";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const pairKey = (c: DuplicateCandidate) =>
  [c.records[0].id, c.records[1].id].sort((a, b) => a - b).join("-");

// A login account can never be removed, so it is always the keeper; otherwise
// fall back to the backend's suggestion.
const defaultKeepId = (c: DuplicateCandidate) => {
  const [a, b] = c.records;
  return a.is_user ? a.id : b.is_user ? b.id : c.suggested_keep_id;
};

const DOB_LABEL: Record<DobRelation, string> = {
  exact: "Same birth date",
  "day-month-swapped": "Birth date day/month swapped",
  "same-year": "Same birth year",
  different: "Different birth dates",
  "one-missing": "Birth date missing on one",
};

const MatchBadge = ({ candidate }: { candidate: DuplicateCandidate }) => (
  <div className="flex flex-wrap items-center gap-2 text-xs">
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-semibold",
        candidate.match_type === "exact"
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700",
      )}
    >
      {candidate.match_type === "exact" ? "Exact match" : "Likely match"}
    </span>
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
      Name {Math.round(candidate.name_score * 100)}%
    </span>
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
      {DOB_LABEL[candidate.dob_relation]}
    </span>
    {candidate.shared_parent && (
      <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">
        Shares a parent — possibly twins, check carefully
      </span>
    )}
  </div>
);

const RecordCard = ({
  person,
  selected,
  disabled,
  onSelect,
}: {
  person: DuplicatePerson;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    className={cn(
      "flex flex-1 flex-col gap-2 rounded-lg border p-4 text-left transition",
      selected
        ? "border-primary bg-primary/5 ring-1 ring-primary"
        : "border-lightGray bg-white hover:border-primary/50",
      disabled && "cursor-not-allowed opacity-70",
    )}
  >
    <div className="flex items-center justify-between gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold",
          selected ? "text-primary" : "text-gray-400",
        )}
      >
        <span
          className={cn(
            "grid h-4 w-4 place-items-center rounded-full border",
            selected ? "border-primary bg-primary text-white" : "border-gray-300",
          )}
        >
          {selected ? "✓" : ""}
        </span>
        {selected ? "Keep this one" : "Keep"}
      </span>
      {person.is_user && (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
          Has login — kept
        </span>
      )}
    </div>
    <div className="font-semibold text-primary">{person.name}</div>
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-gray-600">
      <dt className="text-gray-400">ID</dt>
      <dd>{person.member_id || `#${person.id}`}</dd>
      <dt className="text-gray-400">Born</dt>
      <dd>{person.date_of_birth || "—"}</dd>
      <dt className="text-gray-400">Parent{person.parents.length === 1 ? "" : "s"}</dt>
      <dd>{person.parents.map((p) => p.name).join(", ") || "—"}</dd>
    </dl>
  </button>
);

const CandidateRow = ({
  candidate,
  canManage,
  busy,
  checked,
  keepId,
  onToggle,
  onKeep,
  onMerged,
}: {
  candidate: DuplicateCandidate;
  canManage: boolean;
  busy: boolean;
  checked: boolean;
  keepId: number;
  onToggle: () => void;
  onKeep: (keepId: number) => void;
  onMerged: () => void;
}) => {
  const [a, b] = candidate.records;
  const forcedKeepId = a.is_user ? a.id : b.is_user ? b.id : null;
  const effectiveKeep = forcedKeepId ?? keepId;
  const removeId = effectiveKeep === a.id ? b.id : a.id;
  const keeper = effectiveKeep === a.id ? a : b;
  const loser = effectiveKeep === a.id ? b : a;

  const handleMerge = () => {
    confirmAction({
      title: "Merge duplicate records?",
      message: `Keep "${keeper.name}" and remove "${loser.name}".`,
      tone: "danger",
      confirmLabel: "Merge",
      points: [
        `"${loser.name}" (${loser.member_id || `#${loser.id}`}) will be deleted.`,
        `Its parent link${loser.parents.length === 1 ? "" : "s"} (${
          loser.parents.map((p) => p.name).join(", ") || "none"
        }) will move to "${keeper.name}", unifying the family.`,
        `"${keeper.name}" keeps its own name and birth date.`,
      ],
      // The dialog awaits this promise: it spins while merging and shows a
      // failure inside itself if the request throws.
      onConfirm: async () => {
        await api.post.mergeDuplicateChildren({
          keep_id: effectiveKeep,
          remove_id: removeId,
        });
        notify.success({
          title: "Records merged",
          message: `"${loser.name}" merged into "${keeper.name}".`,
        });
        onMerged();
      },
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        checked ? "border-primary ring-1 ring-primary" : "border-lightGray",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <label
          className={cn(
            "inline-flex items-center gap-2 text-sm font-medium",
            canManage ? "cursor-pointer text-gray-700" : "cursor-not-allowed text-gray-400",
          )}
        >
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={checked}
            disabled={!canManage || busy}
            onChange={onToggle}
          />
          Select for bulk merge
        </label>
        <MatchBadge candidate={candidate} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <RecordCard
          person={a}
          selected={effectiveKeep === a.id}
          disabled={!!forcedKeepId && forcedKeepId !== a.id}
          onSelect={() => !forcedKeepId && onKeep(a.id)}
        />
        <div className="grid place-items-center text-xs font-semibold text-gray-400">
          MERGE
        </div>
        <RecordCard
          person={b}
          selected={effectiveKeep === b.id}
          disabled={!!forcedKeepId && forcedKeepId !== b.id}
          onSelect={() => !forcedKeepId && onKeep(b.id)}
        />
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleMerge}
          disabled={!canManage || busy}
          title={canManage ? undefined : "You don't have permission to merge records"}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold text-white transition",
            canManage && !busy ? "bg-primary hover:bg-primary/90" : "bg-gray-300",
          )}
        >
          Merge &amp; keep selected
        </button>
      </div>
    </div>
  );
};

export const DataQuality = () => {
  const { canManage } = useAccessControl();
  const { data, loading, error, refetch } = useFetch(
    api.fetch.fetchDuplicateChildren,
  );
  const result = data?.data;
  const canMerge = canManage("Data_Quality");

  const candidates = useMemo(() => result?.candidates ?? [], [result]);

  // pairKey -> chosen keepId (overrides the default when the user flips keeper).
  const [keepers, setKeepers] = useState<Record<string, number>>({});
  // pairKeys ticked for bulk merge.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [job, setJob] = useState<BulkMergeJob | null>(null);

  const running = job?.status === "running";

  const getKeep = useCallback(
    (c: DuplicateCandidate) => keepers[pairKey(c)] ?? defaultKeepId(c),
    [keepers],
  );

  const setKeep = useCallback((c: DuplicateCandidate, keepId: number) => {
    setKeepers((k) => ({ ...k, [pairKey(c)]: keepId }));
  }, []);

  const toggle = useCallback((c: DuplicateCandidate) => {
    const key = pairKey(c);
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAllSkipTwins = useCallback(() => {
    setSelected(
      new Set(candidates.filter((c) => !c.shared_parent).map(pairKey)),
    );
  }, [candidates]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectedPairs = useMemo(
    () =>
      candidates
        .filter((c) => selected.has(pairKey(c)))
        .map((c) => {
          const [a, b] = c.records;
          const keepId = getKeep(c);
          const removeId = keepId === a.id ? b.id : a.id;
          return { keep_id: keepId, remove_id: removeId };
        }),
    [candidates, selected, getKeep],
  );

  // Poll the background job while it runs so the user sees progress without
  // blocking. Keep a ref to refetch so the interval never goes stale.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const jobId = job?.id;
  const jobStatus = job?.status;
  useEffect(() => {
    if (!jobId || jobStatus !== "running") return;
    let active = true;
    const id = setInterval(async () => {
      try {
        const res = await api.fetch.fetchBulkMergeJob(jobId);
        const latest = res?.data;
        if (!active || !latest) return;
        setJob(latest);
        if (latest.status === "completed") {
          clearInterval(id);
          if (latest.failed === 0) {
            notify.success({
              title: "Bulk merge done",
              message: `${latest.succeeded} pair${
                latest.succeeded === 1 ? "" : "s"
              } merged.`,
            });
          } else {
            notify.partial({
              title: "Bulk merge done",
              message: `${latest.succeeded} merged, ${latest.failed} skipped.`,
              failed: latest.results
                .filter((r) => r.status === "failed")
                .map((r) => ({
                  label: `#${r.keep_id} ← #${r.remove_id}`,
                  reason: r.error,
                })),
            });
          }
          refetchRef.current();
        }
      } catch {
        // Transient poll error — keep trying on the next tick.
      }
    }, 1500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [jobId, jobStatus]);

  const handleBulkMerge = () => {
    const count = selectedPairs.length;
    if (!count) return;
    confirmAction({
      title: "Merge selected duplicates?",
      message: `${count} pair${
        count === 1 ? "" : "s"
      } will be merged in the background. You can keep working while it runs.`,
      tone: "danger",
      confirmLabel: `Merge ${count}`,
      typeToConfirm: count > 10 ? "MERGE" : undefined,
      points: [
        "For each pair, the record you did not keep is deleted and its parent links move to the kept record.",
        "Pairs run one at a time; a pair that cannot be merged (for example already merged) is skipped and reported, not retried.",
      ],
      onConfirm: async () => {
        const res = await api.post.bulkMergeDuplicateChildren({
          pairs: selectedPairs,
        });
        const started = res?.data;
        if (started) {
          setJob(started);
          clearSelection();
          notify.info({
            title: "Bulk merge started",
            message: `Merging ${started.total} pair${
              started.total === 1 ? "" : "s"
            } in the background.`,
          });
        }
      },
    });
  };

  const pct = job && job.total ? Math.round((job.processed / job.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeading
        title="Data Quality"
        subtitle="Review and merge duplicate member records so each person appears once."
      />

      {result && (
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg border border-lightGray bg-white px-3 py-1.5">
            <b className="text-primary">{result.total}</b> potential duplicates
          </span>
          <span className="rounded-lg border border-lightGray bg-white px-3 py-1.5">
            <b className="text-green-700">{result.exact}</b> exact
          </span>
          <span className="rounded-lg border border-lightGray bg-white px-3 py-1.5">
            <b className="text-amber-700">{result.fuzzy}</b> likely
          </span>
        </div>
      )}

      {job && (
        <div
          className={cn(
            "flex flex-col gap-2 rounded-lg border p-4 text-sm",
            running
              ? "border-primary/30 bg-primary/5 text-gray-700"
              : "border-lightGray bg-white text-gray-600",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">
              {running
                ? `Merging duplicates… ${job.processed} of ${job.total}`
                : `Bulk merge finished — ${job.succeeded} merged${
                    job.failed ? `, ${job.failed} skipped` : ""
                  }`}
            </span>
            {!running && (
              <button
                type="button"
                onClick={() => setJob(null)}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                Dismiss
              </button>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                running ? "bg-primary" : job.failed ? "bg-amber-500" : "bg-green-500",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          {running && (
            <span className="text-xs text-gray-500">
              You can leave this page — the merge keeps running on the server.
            </span>
          )}
        </div>
      )}

      {canMerge && candidates.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-lightGray bg-white px-4 py-3 text-sm">
          <button
            type="button"
            onClick={selectAllSkipTwins}
            disabled={running}
            className="rounded-lg border border-lightGray px-3 py-1.5 font-medium text-gray-700 hover:border-primary/50 disabled:opacity-50"
          >
            Select all (skip twins)
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={running || selected.size === 0}
            className="rounded-lg border border-lightGray px-3 py-1.5 font-medium text-gray-700 hover:border-primary/50 disabled:opacity-50"
          >
            Clear
          </button>
          <span className="text-gray-500">{selected.size} selected</span>
          <button
            type="button"
            onClick={handleBulkMerge}
            disabled={running || selected.size === 0}
            className={cn(
              "ml-auto rounded-lg px-4 py-2 font-semibold text-white transition",
              !running && selected.size > 0
                ? "bg-primary hover:bg-primary/90"
                : "bg-gray-300",
            )}
          >
            {running ? "Merging…" : `Merge ${selected.size} selected`}
          </button>
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-lightGray bg-white p-8 text-center text-gray-500">
          Checking for duplicates…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load duplicate records. Try again.
        </div>
      )}

      {!loading && !error && candidates.length === 0 && (
        <div className="rounded-lg border border-lightGray bg-white p-8 text-center text-gray-500">
          No duplicate records found. The directory is clean.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {candidates.map((c) => (
          <CandidateRow
            key={pairKey(c)}
            candidate={c}
            canManage={canMerge}
            busy={running}
            checked={selected.has(pairKey(c))}
            keepId={getKeep(c)}
            onToggle={() => toggle(c)}
            onKeep={(keepId) => setKeep(c, keepId)}
            onMerged={refetch}
          />
        ))}
      </div>
    </div>
  );
};

export default DataQuality;
