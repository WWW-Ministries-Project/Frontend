import type { UserStatsType } from "@/utils/api/members/interfaces";

type Group = UserStatsType["inhouse"] | undefined;

const StatCard = ({ label, group }: { label: string; group: Group }) => {
  // Every bucket (incl. gender "Other") is shown, so the parts add up to the
  // card total. Zero "Other" buckets are hidden to keep the row compact.
  const parts = [
    { label: "Adult male", value: group?.stats?.adults?.Male ?? 0 },
    { label: "Adult female", value: group?.stats?.adults?.Female ?? 0 },
    { label: "Adult other", value: group?.stats?.adults?.Other ?? 0 },
    { label: "Children male", value: group?.stats?.children?.Male ?? 0 },
    { label: "Children female", value: group?.stats?.children?.Female ?? 0 },
    { label: "Children other", value: group?.stats?.children?.Other ?? 0 },
  ].filter((part) => !part.label.endsWith("other") || part.value > 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-lightGray bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <p className="text-2xl font-semibold leading-8 text-primary">
          {group?.total_members ?? 0}
        </p>
      </div>
      <div className="flex flex-wrap gap-y-2">
        {parts.map((part) => (
          <div
            key={part.label}
            className="flex flex-col items-center gap-0.5 border-l border-gray-200 px-4"
          >
            <p className="text-lg font-semibold text-primary">{part.value}</p>
            <p className="whitespace-nowrap text-xs text-gray-600">{part.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DirectoryStats = ({ stats }: { stats?: UserStatsType | null }) => {
  const hasUnspecified = (stats?.unspecified?.total_members ?? 0) > 0;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
      <StatCard label="In-person church family" group={stats?.inhouse} />
      <StatCard label="Online e-church family" group={stats?.online} />
      {/* Members with no membership type yet — shown only when any exist, so the
          three cards still reconcile with the directory total. */}
      {hasUnspecified && (
        <StatCard label="No family type set" group={stats?.unspecified} />
      )}
    </div>
  );
};
