import { Badge } from "@/components/Badge";
import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils/api/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import { currentYear, LifeCenterStatsType } from "@/utils";
import {
  ArrowTrendingUpIcon,
  HomeIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo, useState } from "react";
import { AnalyticsFilters } from "../components/AnalyticsFilters";
import { AnalyticsInsights } from "../components/AnalyticsInsights";
import { AnalyticsMonthlyTrend } from "../components/AnalyticsMonthlyTrend";
import { AnalyticsStats } from "../components/AnalyticsStats";
import { AnalyticsTable } from "../components/AnalyticsTable";
import { AnalyticsTopCentersChart } from "../components/AnalyticsTopCentersChart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

type AnalyticsRecord = LifeCenterStatsType & {
  parsedDate: Date;
};

type Center = {
  name: string;
  leader: string;
  count: number;
  souls: AnalyticsRecord[];
};

type MonthlyData = {
  month: string;
  count: number;
  sortKey: string;
};

type Insight = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  type: "success" | "info" | "warning";
};

const parseValidDate = (value: string): Date | null => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getPerformanceMeta = (count: number, average: number) => {
  if (average <= 0) {
    return {
      label: "No Data",
      className: "bg-gray-100 text-gray-700 border-gray-300",
    };
  }

  if (count > average) {
    return {
      label: "Excellent",
      className: "bg-primary text-white border-primary",
    };
  }

  if (Math.abs(count - average) < 0.001) {
    return {
      label: "Good",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  return {
    label: "Needs Support",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  };
};

export const LifeCenterAnalytics = () => {
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");

  const {
    data: apiResponse,
    loading,
    error,
  } = useFetch<ApiResponse<LifeCenterStatsType[]>>(api.fetch.fetchLifeCenterStats);

  const data: LifeCenterStatsType[] = useMemo(() => {
    if (Array.isArray(apiResponse?.data)) {
      return apiResponse.data;
    }
    return [];
  }, [apiResponse]);

  const analyticsRecords = useMemo(() => {
    return data.reduce((acc, record) => {
      const parsedDate = parseValidDate(record.date_won);
      if (!parsedDate) return acc;

      acc.push({
        ...record,
        life_center_name:
          String(record.life_center_name || "").trim() ||
          "Unassigned Life Center",
        leader_name:
          String(record.leader_name || "").trim() || "Unassigned Leader",
        won_by: String(record.won_by || "").trim() || "Unknown Member",
        location: String(record.location || "").trim() || "Unknown Location",
        parsedDate,
      });

      return acc;
    }, [] as AnalyticsRecord[]);
  }, [data]);

  const invalidRecordsCount = data.length - analyticsRecords.length;

  const processedData = useMemo(() => {
    const filteredData = analyticsRecords.filter((record) => {
      const year = record.parsedDate.getFullYear().toString();

      if (selectedYear !== "all" && year !== selectedYear) return false;

      if (selectedMonth !== "all") {
        const month = (record.parsedDate.getMonth() + 1).toString();
        if (month !== selectedMonth) return false;
      }

      if (selectedWeek !== "all") {
        const weekNumber = Math.ceil(record.parsedDate.getDate() / 7).toString();
        if (weekNumber !== selectedWeek) return false;
      }

      return true;
    });

    const centerStats = filteredData.reduce((acc, record) => {
      const centerName = record.life_center_name;
      if (!acc[centerName]) {
        acc[centerName] = {
          name: centerName,
          leader: record.leader_name,
          count: 0,
          souls: [],
        };
      }

      acc[centerName].count += 1;
      acc[centerName].souls.push(record);
      return acc;
    }, {} as Record<string, Center>);

    const centers = Object.values(centerStats).sort((a, b) => b.count - a.count);

    const monthlyData = filteredData.reduce((acc, record) => {
      const monthKey = `${record.parsedDate.getFullYear()}-${String(
        record.parsedDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: record.parsedDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          count: 0,
          sortKey: monthKey,
        };
      }

      acc[monthKey].count += 1;
      return acc;
    }, {} as Record<string, MonthlyData>);

    const monthly = Object.values(monthlyData).sort((a, b) =>
      a.sortKey.localeCompare(b.sortKey)
    );

    return {
      centers,
      monthly,
      totalSouls: filteredData.length,
      totalCenters: centers.length,
      filteredData,
    };
  }, [analyticsRecords, selectedMonth, selectedWeek, selectedYear]);

  const chartData = processedData.centers.slice(0, 10).map((center) => ({
    name: center.name,
    souls: center.count,
    leader: center.leader,
  }));

  const totalSouls = processedData.totalSouls;
  const averageSoulsPerCenter =
    processedData.totalCenters > 0
      ? processedData.totalSouls / processedData.totalCenters
      : 0;

  const topPerformer = processedData.centers[0] || null;
  const underPerformers =
    averageSoulsPerCenter > 0
      ? processedData.centers.filter((center) => center.count < averageSoulsPerCenter)
      : [];

  const monthlyActivity = processedData.filteredData.reduce((acc, record) => {
    const month = record.parsedDate.toLocaleString("default", {
      month: "long",
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const peakMonthEntry =
    Object.entries(monthlyActivity).sort((a, b) => b[1] - a[1])[0] || null;

  const activeLocationsCount = new Set(
    processedData.filteredData
      .map((record) => record.location)
      .filter((location) => Boolean(location))
  ).size;

  const consistentCenters = processedData.centers.filter(
    (center) => center.count >= 2
  ).length;

  const consistencyRate =
    processedData.totalCenters > 0
      ? Math.round((consistentCenters / processedData.totalCenters) * 100)
      : 0;

  const insights: Insight[] = [
    {
      icon: <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />,
      title: "Peak Performance Period",
      description: peakMonthEntry
        ? `${peakMonthEntry[0]} was the most productive month with ${peakMonthEntry[1]} souls won.`
        : "No peak month identified for the selected filters yet.",
      type: "success",
    },
    {
      icon: <TrophyIcon className="h-5 w-5 text-yellow-600" />,
      title: "Top Performing Center",
      description: topPerformer
        ? `${topPerformer.name} leads with ${topPerformer.count} souls, led by ${topPerformer.leader}.`
        : "No center has activity in the selected period yet.",
      type: "info",
    },
    {
      icon: <UsersIcon className="h-5 w-5 text-blue-600" />,
      title: "Average Performance",
      description:
        processedData.totalCenters > 0
          ? `Centers are winning an average of ${averageSoulsPerCenter.toFixed(1)} souls during this period.`
          : "Average performance will appear when there is at least one active center.",
      type: "info",
    },
    {
      icon: (
        <ArrowTrendingUpIcon className="h-5 w-5 rotate-180 text-orange-600" />
      ),
      title: "Growth Opportunities",
      description:
        processedData.totalCenters > 0
          ? `${underPerformers.length} centers are below average and could benefit from additional support.`
          : "No growth analysis available without center activity.",
      type: "warning",
    },
    {
      icon: <HomeIcon className="h-5 w-5 text-indigo-600" />,
      title: "Geographic Distribution",
      description: `Activity is recorded in ${activeLocationsCount} location${
        activeLocationsCount === 1 ? "" : "s"
      } for the selected filters.`,
      type: "info",
    },
    {
      icon: <UsersIcon className="h-5 w-5 text-cyan-600" />,
      title: "Consistency Rate",
      description:
        processedData.totalCenters > 0
          ? `${consistencyRate}% of centers have multiple soul wins, showing consistency.`
          : "Consistency rate will be available when centers record wins.",
      type: "success",
    },
  ];

  const insightsMonthly = useMemo(() => {
    const insights: { title: string; description: string }[] = [];
    const { monthly } = processedData;

    if (monthly.length > 1) {
      const lastMonth = monthly[monthly.length - 1];
      const previousMonth = monthly[monthly.length - 2];

      if (previousMonth.count === 0) {
        const trendText =
          lastMonth.count > 0
            ? `New growth started in ${lastMonth.month} after no recorded wins in ${previousMonth.month}.`
            : `No recorded wins in both ${previousMonth.month} and ${lastMonth.month}.`;

        insights.push({
          title: "Monthly Trend",
          description: trendText,
        });
      } else {
        const growth =
          ((lastMonth.count - previousMonth.count) / previousMonth.count) * 100;

        insights.push({
          title: "Monthly Trend",
          description: `${growth >= 0 ? "Growth" : "Decline"} of ${Math.abs(
            growth
          ).toFixed(1)}% from ${previousMonth.month} to ${lastMonth.month}.`,
        });
      }
    }

    return insights;
  }, [processedData]);

  const columns: ColumnDef<Center, any>[] = useMemo(
    () => [
      {
        header: "Life Center",
        accessorKey: "name",
      },
      {
        header: "Leader",
        accessorKey: "leader",
      },
      {
        header: "Souls Won",
        accessorKey: "count",
      },
      {
        header: "Performance",
        accessorKey: "name",
        cell: ({ row }: { row: Row<Center> }) => {
          const performance = getPerformanceMeta(
            row.original.count,
            averageSoulsPerCenter
          );

          return <Badge className={performance.className}>{performance.label}</Badge>;
        },
      },
    ],
    [averageSoulsPerCenter]
  );

  const hasFilteredResults = processedData.totalSouls > 0;

  return (
    <PageOutline className="space-y-6">
      <div>
        <HeaderControls
          title="Life Center Analytics"
          subtitle="Track soul-winning performance across all life centers"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load life center analytics. Please refresh and try again.
        </div>
      )}

      {invalidRecordsCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {invalidRecordsCount} record{invalidRecordsCount > 1 ? "s" : ""} were
          skipped due to invalid dates.
        </div>
      )}

      <AnalyticsFilters
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
      />

      {loading && !apiResponse && (
        <div className="rounded-lg border px-4 py-3 text-sm text-gray-600">
          Loading analytics data...
        </div>
      )}

      {!loading && !hasFilteredResults && (
        <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-gray-600">
          No soul-winning records found for the selected filters.
        </div>
      )}

      <AnalyticsStats
        totalSouls={totalSouls}
        totalCenters={processedData.totalCenters}
        topCenterName={topPerformer?.name || ""}
        topCenterCount={topPerformer?.count || 0}
        averageSouls={averageSoulsPerCenter}
      />

      <AnalyticsInsights
        insights={insights}
        topPerformerName={topPerformer?.name || ""}
        peakMonth={peakMonthEntry?.[0] || ""}
      />

      {selectedMonth === "all" && (
        <AnalyticsMonthlyTrend
          monthly={processedData.monthly}
          insightsMonthly={insightsMonthly}
        />
      )}

      <AnalyticsTopCentersChart chartData={chartData} />

      <AnalyticsTable columns={columns} data={processedData.centers} />
    </PageOutline>
  );
};
