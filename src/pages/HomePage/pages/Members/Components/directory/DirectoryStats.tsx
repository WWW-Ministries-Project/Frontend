import type { UserStatsType } from "@/utils/api/members/interfaces";

type Group = UserStatsType["inhouse"] | undefined;

const GroupLine = ({ label, group }: { label: string; group: Group }) => {
  const total = group?.total_members ?? 0;
  const males = group?.total_males ?? 0;
  const females = group?.total_females ?? 0;
  const others = group?.total_others ?? 0;
  const children =
    (group?.stats?.children?.Total ?? 0) ||
    (group?.stats?.children?.Male ?? 0) + (group?.stats?.children?.Female ?? 0);

  const parts = [
    `${males} M`,
    `${females} F`,
    ...(others > 0 ? [`${others} O`] : []),
    `${children} children`,
  ].join(" · ");

  return (
    <div className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-sm font-semibold text-gray-600">{label}</span>
      <span className="text-lg font-bold leading-none text-primary">{total}</span>
      <span className="text-xs text-gray-500">{parts}</span>
    </div>
  );
};

/**
 * Compact one/two-line family-type summary for the directory header. The full
 * breakdown lives in Membership Analytics.
 */
export const DirectoryStats = ({ stats }: { stats?: UserStatsType | null }) => {
  const hasUnspecified = (stats?.unspecified?.total_members ?? 0) > 0;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-lightGray bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <GroupLine label="In-person" group={stats?.inhouse} />
      <GroupLine label="Online" group={stats?.online} />
      {hasUnspecified && <GroupLine label="No family type" group={stats?.unspecified} />}
    </div>
  );
};
