import { Line } from "react-chartjs-2";
import { Badge } from "@/components/Badge";

interface IProps{
  monthly: Monthly[];
  insightsMonthly: MonthlyInsight[];
};

export const AnalyticsMonthlyTrend = ({ monthly, insightsMonthly }: IProps) => {
  const hasMonthlyData = monthly.length > 0;

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div>
        <div className="text-xl font-bold">Monthly Trend</div>
        <div className="text-sm">Soul-winning trends over time</div>
      </div>
      {!hasMonthlyData ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-gray-600">
          No monthly trend data available for the selected filters.
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <div className="h-80 w-full">
            <Line
              data={{
                labels: monthly.map((item) => item.month),
                datasets: [
                  {
                    label: "Souls Won",
                    data: monthly.map((item) => item.count),
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
                  legend: { position: "top" as const },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                  x: {
                    ticks: { maxRotation: 90, minRotation: 45 },
                  },
                },
                interaction: { intersect: false, mode: "index" as const },
              }}
            />
          </div>
          {insightsMonthly.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {insightsMonthly.map((insight, index) => (
                  <div
                    key={`${insight.title}-${index}`}
                    className="rounded-lg bg-gray-50 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Badge>{insight.title}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

type Monthly = { month: string; count: number };
type MonthlyInsight = { title: string; description: string };
