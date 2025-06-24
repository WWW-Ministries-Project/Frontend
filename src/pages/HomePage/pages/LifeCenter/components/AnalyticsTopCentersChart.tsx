import { Bar } from "react-chartjs-2";

interface IProps {
  chartData: ChartData[];
}

export const AnalyticsTopCentersChart = ({ chartData }: IProps) => (
  <div className="border rounded-xl p-4">
    <div>
      <div className="font-bold text-xl">Top 10 Life Centers Performance</div>
      <div className="text-sm">Number of souls won_by each center</div>
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
            legend: { position: "top" as const },
            title: { display: false },
            tooltip: {
              callbacks: {
                afterLabel: (context) => {
                  const dataIndex = context.dataIndex;
                  return `Leader: ${chartData[dataIndex].leader}`;
                },
              },
            },
          },
          scales: { y: { beginAtZero: true } },
        }}
      />
    </div>
  </div>
);

type ChartData = { name: string; souls: number; leader: string };
