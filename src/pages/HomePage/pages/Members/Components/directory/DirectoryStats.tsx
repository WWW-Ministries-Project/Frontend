import type { UserStatsType } from "@/utils/api/members/interfaces";

type Group = UserStatsType["inhouse"] | undefined;

const StatCard = ({ label, group }: { label: string; group: Group }) => {
  const parts = [
    { label: "Adult male", value: group?.stats?.adults?.Male ?? 0 },
    { label: "Adult female", value: group?.stats?.adults?.Female ?? 0 },
    { label: "Children male", value: group?.stats?.children?.Male ?? 0 },
    { label: "Children female", value: group?.stats?.children?.Female ?? 0 },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-lightGray bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[#4B5563]">{label}</p>
        <p className="text-2xl font-semibold leading-8 text-primary">
          {group?.total_members ?? 0}
        </p>
      </div>
      <div className="flex flex-wrap gap-y-2">
        {parts.map((part) => (
          <div
            key={part.label}
            className="flex flex-col items-center gap-0.5 border-l border-[#E5E7EB] px-4"
          >
            <p className="text-lg font-semibold text-primary">{part.value}</p>
            <p className="whitespace-nowrap text-xs text-[#4B5563]">{part.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DirectoryStats = ({ stats }: { stats?: UserStatsType | null }) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
    <StatCard label="In-person church family" group={stats?.inhouse} />
    <StatCard label="Online e-church family" group={stats?.online} />
  </div>
);
