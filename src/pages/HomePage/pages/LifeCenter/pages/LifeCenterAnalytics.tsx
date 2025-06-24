import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { useMemo, useState } from "react";

import { Badge } from "@/components/Badge";
import { useFetch } from "@/CustomHooks/useFetch";
import { currentYear, LifeCenterStatsType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import {
  ArrowTrendingUpIcon,
  HomeIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
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

export const LifeCenterAnalytics = () => {
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");

  const { data: apiResponse } = useFetch(api.fetch.fetchLifeCenterStats) as {
    data: ApiResponse<LifeCenterStatsType[]> | null;
  };
  const data: LifeCenterStatsType[] = useMemo(() => {
    if (Array.isArray(apiResponse?.data)) {
      return apiResponse?.data as LifeCenterStatsType[];
    }
    return [];
  }, [apiResponse]);

  const processedData = useMemo(() => {
    const filteredData = Array.isArray(data)
      ? data.filter((record) => {
          const date = new Date(record["date_won"]);
          const year = date.getFullYear().toString();

          if (selectedYear !== "all" && year !== selectedYear) return false;

          if (selectedMonth !== "all") {
            const month = (date.getMonth() + 1).toString();
            if (month !== selectedMonth) return false;
          }

          if (selectedWeek !== "all") {
            const weekNumber = Math.ceil(date.getDate() / 7).toString();
            if (weekNumber !== selectedWeek) return false;
          }

          return true;
        })
      : [];

    // Group by life center
    type CenterStats = {
      [centerName: string]: {
        name: string;
        leader: string;
        count: number;
        souls: LifeCenterStatsType[];
      };
    };

    const centerStats = filteredData.reduce((acc, record) => {
      const centerName = record["life_center_name"];
      if (!acc[centerName]) {
        acc[centerName] = {
          name: centerName,
          leader: record["leader_name"],
          count: 0,
          souls: [],
        };
      }
      acc[centerName].count++;
      acc[centerName].souls.push(record);
      return acc;
    }, {} as CenterStats);

    // Convert to array and sort by count
    const centerArray = Object.values(centerStats).sort(
      (
        a: {
          name: string;
          leader: string;
          count: number;
          souls: LifeCenterStatsType[];
        },
        b: {
          name: string;
          leader: string;
          count: number;
          souls: LifeCenterStatsType[];
        }
      ) => b.count - a.count
    );

    // Monthly trend data
    const monthlyData = filteredData.reduce((acc, record) => {
      const date = new Date(record["date_won"]);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          count: 0,
          sortKey: `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`,
        };
      }
      acc[monthKey].count++;
      return acc;
    }, {} as Record<string, { month: string; count: number; sortKey: string }>);

    const monthlyArray = Object.values(monthlyData).sort(
      (
        a: { month: string; count: number; sortKey: string },
        b: { month: string; count: number; sortKey: string }
      ) => a.sortKey.localeCompare(b.sortKey)
    );

    // Top performers data
    type PerformerStats = { name: string; count: number };
    const topPerformers = filteredData.reduce((acc, record) => {
      const performer = record["won_by"];
      if (!acc[performer]) {
        acc[performer] = { name: performer, count: 0 };
      }
      acc[performer].count++;
      return acc;
    }, {} as Record<string, PerformerStats>);

    const topPerformersArray = Object.values(topPerformers)
      .sort((a: PerformerStats, b: PerformerStats) => b.count - a.count)
      .slice(0, 10);

    return {
      centers: centerArray,
      monthly: monthlyArray,
      topPerformers: topPerformersArray,
      totalSouls: filteredData.length,
      totalCenters: Object.keys(centerStats).length,
      filteredData,
    };
  }, [data, selectedYear, selectedMonth, selectedWeek]);

  // Chart data for top 10 centers
  type Center = {
    name: string;
    leader: string;
    count: number;
    souls: LifeCenterStatsType[];
  };

  const chartData = processedData.centers
    .slice(0, 10)
    .map((center: Center) => ({
      name: center.name,
      souls: center.count,
      leader: center.leader,
    }));

  const columns = [
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
      cell: ({ row }: { row: import("@tanstack/react-table").Row<Center> }) => (
        <Badge
          className={
            row.original.count >
            processedData.totalSouls / processedData.totalCenters
              ? "bg-primary text-white "
              : row.original.count ===
                processedData.totalSouls / processedData.totalCenters
              ? "bg-gray-100"
              : "bg-white"
          }
        >
          {row.original.count >
          processedData.totalSouls / processedData.totalCenters
            ? "Excellent"
            : row.original.count ===
              processedData.totalSouls / processedData.totalCenters
            ? "Good"
            : "Average"}
        </Badge>
      ),
    },
  ];

  // Calculate insights
  const totalSouls = processedData.totalSouls;
  const averageSoulsPerCenter = Math.round(
    processedData.totalSouls / processedData.totalCenters
  );
  const topPerformer = processedData.centers[0];
  const underPerformers = processedData.centers.filter(
    (center) => center.count < averageSoulsPerCenter
  );

  // Month analysis
  const monthlyActivity = Array.isArray(data)
    ? data.reduce((acc, record) => {
        const month = new Date(record["date_won"]).toLocaleString("default", {
          month: "long",
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  let peakMonth: [string, number] | [] = [];

  // Check if monthlyActivity has entries before reducing
  if (Object.entries(monthlyActivity).length > 0) {
    peakMonth = Object.entries(monthlyActivity).reduce((a, b) =>
      monthlyActivity[a[0]] > monthlyActivity[b[0]] ? a : b
    );
  } else {
    // Handle the empty case - set a default or leave empty
    peakMonth = []; // or peakMonth = ["No data", 0];
  }

  // location analysis
  const locationCounts = Array.isArray(data)
    ? data.reduce((acc, record) => {
        const location = record.location;
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  type Insight = {
    icon?: React.ReactNode;
    title: string;
    description: string;
    type: "success" | "info" | "warning";
  };

  const insights: Insight[] = [
    {
      icon: <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />,
      title: "Peak Performance Period",
      description: `${peakMonth[0]} was the most productive month with ${peakMonth[1]} souls won`,
      type: "success",
    },
    {
      icon: <TrophyIcon className="h-5 w-5 text-yellow-600" />,
      title: "Top Performing Center",
      description: `${topPerformer?.name} leads with ${topPerformer?.count} souls, led by ${topPerformer?.leader}`,
      type: "info",
    },
    {
      icon: <UsersIcon className="h-5 w-5 text-blue-600" />,
      title: "Average Performance",
      description: `Centers are winning an average of ${averageSoulsPerCenter} souls during this period`,
      type: "info",
    },
    {
      icon: (
        <ArrowTrendingUpIcon className="h-5 w-5 text-orange-600 rotate-180" />
      ),
      title: "Growth Opportunities",
      description: `${underPerformers.length} centers are below average and could benefit from additional support`,
      type: "warning",
    },
    {
      icon: <HomeIcon className="h-5 w-5 text-purple-600" />,
      title: "Geographic Distribution",
      description: `Active in ${
        Object.keys(locationCounts).length
      } different locations across the region`,
      type: "info",
    },
    {
      icon: <UsersIcon className="h-5 w-5 text-indigo-600" />,
      title: "Consistency Rate",
      description: `${Math.round(
        (processedData.centers.filter((c) => c.count >= 2).length /
          processedData.centers.length) *
          100
      )}% of centers have multiple soul wins, showing consistent effort`,
      type: "success",
    },
  ];

  // Get insights
  const insightsMonthy = useMemo(() => {
    const { monthly } = processedData;
    const insights = [];

    if (monthly.length > 1) {
      const lastMonth = monthly[monthly.length - 1] as {
        month: string;
        count: number;
      };
      const prevMonth = monthly[monthly.length - 2] as {
        month: string;
        count: number;
      };
      const growth =
        ((lastMonth.count - prevMonth.count) / prevMonth.count) * 100;
      insights.push({
        type: growth > 0 ? "success" : "warning",
        title: "Monthly Trend",
        description: `${growth > 0 ? "Growth" : "Decline"} of ${Math.abs(
          growth
        )?.toFixed(1)}% from previous month`,
      });
    }

    return insights;
  }, [processedData]);

  return (
    <PageOutline>
      <div>
        <HeaderControls
          title="Life Center Analytics"
          subtitle="Track soul-winning performance across all life centers"
          screenWidth={window.innerWidth}
        />
      </div>

      {/* Filters */}
      <AnalyticsFilters
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
      />

      {/* Stats Cards */}
      <AnalyticsStats
        totalSouls={totalSouls}
        totalCenters={processedData.totalCenters}
        topCenterName={topPerformer?.name || ""}
        topCenterCount={topPerformer?.count || 0}
        averageSouls={averageSoulsPerCenter}
      />

      {/* Insights */}
      <AnalyticsInsights
        insights={insights}
        topPerformerName={topPerformer?.name || ""}
        peakMonth={peakMonth[0] || ""}
      />

      {/* Monthly Trend */}
      {selectedMonth === "all" && (
        <AnalyticsMonthlyTrend
          monthly={processedData.monthly}
          insightsMonthly={insightsMonthy}
        />
      )}

      {/* Top Centers Bar Chart */}
      <AnalyticsTopCentersChart chartData={chartData} />

      {/* Performance Table */}
      <AnalyticsTable columns={columns} data={processedData.centers} />
    </PageOutline>
  );
};
