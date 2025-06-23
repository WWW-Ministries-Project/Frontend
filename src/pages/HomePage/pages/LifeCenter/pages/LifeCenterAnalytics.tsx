import { useEffect, useMemo, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "@/pages/HomePage/Components/PageOutline";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"
import { Bar, Pie, Line } from "react-chartjs-2"
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { Badge } from "@/components/Badge";
import { ArrowTrendingUpIcon, HomeIcon, TrophyIcon, UsersIcon } from "@heroicons/react/24/outline";
import { api } from "@/utils/api/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import { ApiResponse } from "@/utils/interfaces";
import { currentYear, getYearOptions, getMonthOptions, getWeekOptions, LifeCenterStatsType } from "@/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)


const LifeCenterAnalytics = () => {
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedWeek, setSelectedWeek] = useState<string>("all")


  const { data: apiResponse } = useFetch(api.fetch.fetchLifeCenterStats) as { data: ApiResponse<LifeCenterStatsType[]> | null };
  const data: LifeCenterStatsType[] = useMemo(() => {

    if (Array.isArray(apiResponse?.data)) {
      return apiResponse?.data as LifeCenterStatsType[];
    }
    return [];
  }, [apiResponse]);

  const processedData = useMemo(() => {
    const filteredData = Array.isArray(data) ? data.filter((record) => {
  const date = new Date(record["date_won"])
  const year = date.getFullYear().toString()

  if (selectedYear !== "all" && year !== selectedYear) return false

  if (selectedMonth !== "all") {
    const month = (date.getMonth() + 1).toString()
    if (month !== selectedMonth) return false
  }

  if (selectedWeek !== "all") {
    const weekNumber = Math.ceil(date.getDate() / 7).toString()
    if (weekNumber !== selectedWeek) return false
  }

  return true
}) : []


    // Group by life center
    type CenterStats = {
      [centerName: string]: {
        name: string
        leader: string
        count: number
        souls: LifeCenterStatsType[]
      }
    }

    const centerStats = filteredData.reduce(
      (acc, record) => {
        const centerName = record["life_center_name"]
        if (!acc[centerName]) {
          acc[centerName] = {
            name: centerName,
            leader: record["leader_name"],
            count: 0,
            souls: [],
          }
        }
        acc[centerName].count++
        acc[centerName].souls.push(record)
        return acc
      },
      {} as CenterStats,
    )

    // Convert to array and sort by count
    const centerArray = Object.values(centerStats).sort(
      (a: { name: string; leader: string; count: number; souls: LifeCenterStatsType[] }, b: { name: string; leader: string; count: number; souls: LifeCenterStatsType[] }) => b.count - a.count
    )

    // Monthly trend data
    const monthlyData = filteredData.reduce(
      (acc, record) => {
        const date = new Date(record["date_won"])
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthName,
            count: 0,
            sortKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
          }
        }
        acc[monthKey].count++
        return acc
      },
      {} as Record<string, { month: string; count: number; sortKey: string }>,
    )

    const monthlyArray = Object.values(monthlyData).sort((a: { month: string; count: number; sortKey: string }, b: { month: string; count: number; sortKey: string }) => a.sortKey.localeCompare(b.sortKey))

    // Top performers data
    type PerformerStats = { name: string; count: number }
    const topPerformers = filteredData.reduce(
      (acc, record) => {
        const performer = record["won_by"]
        if (!acc[performer]) {
          acc[performer] = { name: performer, count: 0 }
        }
        acc[performer].count++
        return acc
      },
      {} as Record<string, PerformerStats>,
    )

    const topPerformersArray = Object.values(topPerformers)
      .sort((a: PerformerStats, b: PerformerStats) => b.count - a.count)
      .slice(0, 10)

    return {
      centers: centerArray,
      monthly: monthlyArray,
      topPerformers: topPerformersArray,
      totalSouls: filteredData.length,
      totalCenters: Object.keys(centerStats).length,
      filteredData,
    }
  }, [data, selectedYear, selectedMonth, selectedWeek])

  

    // Chart data for top 10 centers
  type Center = {
    name: string;
    leader: string;
    count: number;
    souls: LifeCenterStatsType[];
  };

  const chartData = processedData.centers.slice(0, 10).map((center: Center) => ({
    name: center.name,
    souls: center.count,
    leader: center.leader,
  }))

  const columns =
      [
        
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
                <Badge className={row.original.count > (processedData.totalSouls / processedData.totalCenters) ? "bg-primary text-white " : row.original.count === (processedData.totalSouls / processedData.totalCenters) ? "bg-gray-100" : "bg-white"}>
                          {row.original.count > (processedData.totalSouls / processedData.totalCenters) ? "Excellent" : row.original.count === (processedData.totalSouls / processedData.totalCenters) ? "Good" : "Average"}
                        </Badge>)
        },
        
        
      ]

      // Calculate insights
  const totalSouls = processedData.totalSouls;
  const averageSoulsPerCenter = Math.round(processedData.totalSouls / processedData.totalCenters);
  const topPerformer = processedData.centers[0];
  const underPerformers = processedData.centers.filter(center => center.count < averageSoulsPerCenter);
  
  // Month analysis
  const monthlyActivity = Array.isArray(data) 
  ? data.reduce((acc, record) => {
      const month = new Date(record["date_won"]).toLocaleString('default', { month: 'long' });
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
      type: "success"
    },
    {
      icon: <TrophyIcon className="h-5 w-5 text-yellow-600" />,
      title: "Top Performing Center",
      description: `${topPerformer?.name} leads with ${topPerformer?.count} souls, led by ${topPerformer?.leader}`,
      type: "info"
    },
    {
      icon: <UsersIcon className="h-5 w-5 text-blue-600" />,
      title: "Average Performance",
      description: `Centers are winning an average of ${averageSoulsPerCenter} souls during this period`,
      type: "info"
    },
    {
      icon: <ArrowTrendingUpIcon className="h-5 w-5 text-orange-600 rotate-180" />,
      title: "Growth Opportunities",
      description: `${underPerformers.length} centers are below average and could benefit from additional support`,
      type: "warning"
    },
    {
      icon: <HomeIcon className="h-5 w-5 text-purple-600" />,
      title: "Geographic Distribution",
      description: `Active in ${Object.keys(locationCounts).length} different locations across the region`,
      type: "info"
    },
    {
      icon: <UsersIcon className="h-5 w-5 text-indigo-600" />,
      title: "Consistency Rate",
      description: `${Math.round((processedData.centers.filter(c => c.count >= 2).length / processedData.centers.length) * 100)}% of centers have multiple soul wins, showing consistent effort`,
      type: "success"
    }
  ];

  // Get insights
  const insightsMonthy = useMemo(() => {
    const { monthly } = processedData
    const insights = []

    if (monthly.length > 1) {
      const lastMonth = monthly[monthly.length - 1] as { month: string; count: number }
      const prevMonth = monthly[monthly.length - 2] as { month: string; count: number }
      const growth = ((lastMonth.count - prevMonth.count) / prevMonth.count) * 100
      insights.push({
        type: growth > 0 ? "success" : "warning",
        title: "Monthly Trend",
        description: `${growth > 0 ? "Growth" : "Decline"} of ${Math.abs(growth).toFixed(1)}% from previous month`,
      })
    }


    return insights
  }, [processedData])

    return ( 
       <PageOutline >
        <div>
            <HeaderControls
            title="Life Center Analytics"
            subtitle="Track soul-winning performance across all life centers"
            screenWidth={window.innerWidth}
            />
        </div>
        {/* Filter */}
        <div className="border p-4 rounded-xl sticky top-10 bg-white">
            <div>
                Filter
            </div>
            <div className="flex gap-x-8">
                <div>
                    Year
                    <div>
                        <select id="countries" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
                        value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                        >
                            {getYearOptions().map((year: { label: string; value: string }) => (
                              <option key={year.value} value={year.value}>{year.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    Month
                    <div>
                        <select id="countries" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
                        value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                        >
                            {getMonthOptions().map((month: { label: string; value: string }) => (
                              <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    Week
                     <div>
                        <select id="countries" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
                        value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}
                        >
                            {getWeekOptions(selectedMonth, selectedYear).map((week: { label: string; value: string }) => (
                              <option key={week.value} value={week.value}>{week.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-between gap-x-8">
            <div className="border p-4 rounded-xl w-full space-y-2">
                <div className="flex justify-between">
                    <div className="text-sm font-medium">
                        Total Souls Won
                    </div>
                    <div >
                        <UsersIcon className="h-4"/>
                    </div>
                </div>
                <div className="font-bold text-xl">{totalSouls}</div>
                <p className="text-xs text-muted">Across all centers</p>
            </div>
            <div className="border p-4 rounded-xl w-full space-y-2">
                <div className="flex justify-between">
                    <div className="text-sm font-medium">
                        Active Centers
                    </div>
                    <div >
                        <HomeIcon className="h-4"/>
                    </div>
                </div>
                <div className="font-bold text-xl">{processedData.totalCenters}</div>
                <p className="text-xs text-muted">Life centers participating</p>
            </div>
            <div className="border p-4 rounded-xl w-full space-y-2">
                <div className="flex justify-between">
                    <div className="text-sm font-medium">
                        Top Center
                    </div>
                    <div >
                        <TrophyIcon className="h-4"/>
                    </div>
                </div>
                <div className="font-bold text-xl">{processedData.centers[0]?.name.replace("Life Center ", "LC ") || "N/A"}</div>
                <p className="text-xs text-muted">{processedData.centers[0]?.count || 0} souls won</p>
            </div>
            <div className="border p-4 rounded-xl w-full space-y-2">
                <div className="flex justify-between">
                    <div className="text-sm font-medium">
                        Average per Center
                    </div>
                    <div >
                        <ArrowTrendingUpIcon className="h-4"/>
                    </div>
                </div>
                <div className="font-bold text-xl">{(processedData.totalSouls / processedData.totalCenters).toFixed(1)}</div>
                <p className="text-xs text-muted">Souls per center</p>
            </div>
        </div>

        <div className="p-4 border rounded-xl space-y-4">
            <div>
                <div className="font-bold text-xl">
                    Key insight
                </div>
                <div className="text-sm">
                    Data-driven insights to help improve Life Center performance and strategic decision making
                </div>
            </div>

            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className="p-4 rounded-lg border border-gray-200 bg-white/50 hover:bg-white/80 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {insight?.icon}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge  className="text-xs">
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Performance Recommendations */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-lg mb-3 text-gray-800">Performance Recommendations</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• Consider organizing training sessions for centers below the average performance threshold</p>
            <p>• Share best practices from {topPerformer?.name} with other centers to replicate success</p>
            <p>• Focus additional resources during {peakMonth[0]} period when engagement is highest</p>
            <p>• Establish mentorship programs pairing high-performing with developing centers</p>
          </div>
        </div>
            </div>
        </div>

        {/* monthly trend */}
        {selectedMonth==="all"&&<div className="p-4 border rounded-xl space-y-4">
            
                <div>
                <div className="font-bold text-xl">
                    Monthly Trend
                </div>
                <div className="text-sm">
                    Soul winning trends over time
                </div>
            </div>

            <div className="w-full overflow-hidden"> {/* Add this wrapper */}
  <div className="h-80 w-full max-w-[85vw]"> {/* Add w-full */}
    <Line
      data={{
        labels: processedData.monthly.map((item: { month: string; count: number }) => item.month),
        datasets: [
          {
            label: "Souls Won",
            data: processedData.monthly.map((item: { month: string; count: number }) => item.count),
            borderColor: "rgba(16, 185, 129, 1)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(16, 185, 129, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top" as const,
          },
          title: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
          x: { // Add x-axis configuration
            ticks: {
              maxRotation: 90, // Rotate labels if needed
              minRotation: 45,
            },
          },
        },
        interaction: {
          intersect: false,
          mode: "index" as const,
        },
      }}
    />
  </div>
  
  <div className="mt-4"> {/* Add margin top */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insightsMonthy.map((insight, index) => (
        <div key={index} className="p-4 ">
          <div className="flex items-center gap-2 mb-2">
            <Badge>
              {insight.title}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{insight.description}</p>
        </div>
      ))}
    </div>
  </div>
</div>
        </div>}

        <div className="grid grid-cols-1 gap-x-8">
            <div className="border rounded-xl p-4">
                <div>
                <div className="font-bold text-xl">
                    Top 10 Life Centers Performance
                </div>
                <div className="text-sm">
                    Number of souls won_by each center
                </div>
            </div>

               
                    <div className="h-80">
                <Bar
                  data={{
                    labels: chartData.map((item) => item.name),
                    datasets: [
                      {
                        label: "Souls Won",
                        data: chartData.map((item) => item.souls),
                        backgroundColor: "rgba(59, 130, 246, 0.8)",
                        borderColor: "rgba(59, 130, 246, 1)",
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                      title: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          afterLabel: (context) => {
                            const dataIndex = context.dataIndex
                            return `Leader: ${chartData[dataIndex].leader}`
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
            
        </div>

        
        <div className="p-4 border rounded-xl space-y-4">
            <div>
                <div className="font-bold text-xl">
                    Life Centers Performance Table
                </div>
                <div className="text-sm">
                    Detailed breakdown by center
                </div>
            </div>


            <div>
                <TableComponent
              columns={columns}
              data={processedData.centers}
              displayedCount={12}
            />
            </div>
        </div>
       </PageOutline>
     );
}
 
export default LifeCenterAnalytics;