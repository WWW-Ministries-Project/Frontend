import { AnalyticsStatItem } from "../types";

interface Props {
  stats: AnalyticsStatItem[];
}

export const AnalyticsStatCards = ({ stats }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-600">{stat.label}</p>
          <p className="text-2xl font-semibold text-primary mt-1">{stat.value}</p>
          {stat.hint ? <p className="text-xs text-gray-500 mt-2">{stat.hint}</p> : null}
        </div>
      ))}
    </div>
  );
};
