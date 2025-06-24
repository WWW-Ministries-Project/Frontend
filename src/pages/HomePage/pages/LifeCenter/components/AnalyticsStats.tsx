import {
  ArrowTrendingUpIcon,
  HomeIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface IProps {
  totalSouls: number;
  totalCenters: number;
  topCenterName: string;
  topCenterCount: number;
  averageSouls: number;
}

export const AnalyticsStats = ({
  totalSouls,
  totalCenters,
  topCenterName,
  topCenterCount,
  averageSouls,
}: IProps) => (
  <div className="flex justify-between gap-x-8">
    <div className="border p-4 rounded-xl w-full space-y-2">
      <div className="flex justify-between">
        <div className="text-sm font-medium">Total Souls Won</div>
        <UsersIcon className="h-4" />
      </div>
      <div className="font-bold text-xl">{totalSouls}</div>
      <p className="text-xs text-muted">Across all centers</p>
    </div>
    <div className="border p-4 rounded-xl w-full space-y-2">
      <div className="flex justify-between">
        <div className="text-sm font-medium">Active Centers</div>
        <HomeIcon className="h-4" />
      </div>
      <div className="font-bold text-xl">{totalCenters}</div>
      <p className="text-xs text-muted">Life centers participating</p>
    </div>
    <div className="border p-4 rounded-xl w-full space-y-2">
      <div className="flex justify-between">
        <div className="text-sm font-medium">Top Center</div>
        <TrophyIcon className="h-4" />
      </div>
      <div className="font-bold text-xl">{topCenterName}</div>
      <p className="text-xs text-muted">{topCenterCount} souls won</p>
    </div>
    <div className="border p-4 rounded-xl w-full space-y-2">
      <div className="flex justify-between">
        <div className="text-sm font-medium">Average per Center</div>
        <ArrowTrendingUpIcon className="h-4" />
      </div>
      <div className="font-bold text-xl">
        {Number(averageSouls || 0).toFixed(1)}
      </div>
      <p className="text-xs text-muted">Souls per center</p>
    </div>
  </div>
);
