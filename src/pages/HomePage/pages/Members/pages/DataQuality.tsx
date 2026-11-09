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
} from "@/utils/api/dataQuality/interfaces";
import { cn } from "@/utils/cn";
import { useEffect, useMemo, useState } from "react";

const pairKey = (c: DuplicateCandidate) =>
  [c.records[0].id, c.records[1].id].sort((a, b) => a - b).join("-");

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
  onMerged,
}: {
  candidate: DuplicateCandidate;
  canManage: boolean;
  onMerged: () => void;
}) => {
  const [a, b] = candidate.records;
  // A login account can never be removed, so it must be the keeper.
  const forcedKeepId = a.is_user ? a.id : b.is_user ? b.id : null;
  const [keepId, setKeepId] = useState<number>(
    forcedKeepId ?? candidate.suggested_keep_id,
  );
  useEffect(() => {
    if (forcedKeepId) setKeepId(forcedKeepId);
  }, [forcedKeepId]);

  const removeId = keepId === a.id ? b.id : a.id;
  const keeper = keepId === a.id ? a : b;
  const loser = keepId === a.id ? b : a;

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
          keep_id: keepId,
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
    <div className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <MatchBadge candidate={candidate} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <RecordCard
          person={a}
          selected={keepId === a.id}
          disabled={!!forcedKeepId && forcedKeepId !== a.id}
          onSelect={() => !forcedKeepId && setKeepId(a.id)}
        />
        <div className="grid place-items-center text-xs font-semibold text-gray-400">
          MERGE
        </div>
        <RecordCard
          person={b}
          selected={keepId === b.id}
          disabled={!!forcedKeepId && forcedKeepId !== b.id}
          onSelect={() => !forcedKeepId && setKeepId(b.id)}
        />
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleMerge}
          disabled={!canManage}
          title={canManage ? undefined : "You don't have permission to merge records"}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold text-white transition",
            canManage ? "bg-primary hover:bg-primary/90" : "bg-gray-300",
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
            onMerged={refetch}
          />
        ))}
      </div>
    </div>
  );
};

export default DataQuality;
