import { Badge } from "@/components/Badge";

interface IProps {
  insights: Insight[];
  topPerformerName: string;
  peakMonth: string;
}

export const AnalyticsInsights = ({
  insights,
  topPerformerName,
  peakMonth,
}: IProps) => {
  const performerName = topPerformerName || "high-performing centers";
  const monthLabel = peakMonth || "high-activity months";

  return (
    <div>
      <div>
        <div className="text-xl font-bold">Key Insights</div>
        <div className="text-sm">
          Data-driven insights to improve Life Center performance and strategic
          decision making.
        </div>
      </div>
      <div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-gray-600">
              Insights will appear when soul-winning activity data is available.
            </div>
          )}
          {insights.map((insight, index) => (
            <div
              key={`${insight.title}-${index}`}
              className="rounded-lg border border-gray-200 bg-white/50 p-4 transition-all duration-200 hover:bg-white/80"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">{insight?.icon}</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">{insight.title}</h4>
                    <Badge className="text-xs">{insight.type}</Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-6">
        <h4 className="mb-3 text-lg font-semibold text-gray-800">
          Performance Recommendations
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            • Consider organizing training sessions for centers below the
            average performance threshold
          </p>
          <p>
            • Share best practices from {performerName} with other centers to
            replicate successful outreach
          </p>
          <p>
            • Focus additional resources during {monthLabel} when engagement is
            highest
          </p>
          <p>
            • Establish mentorship programs pairing high-performing with
            developing centers
          </p>
        </div>
      </div>
    </div>
  );
};
type Insight = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  type: "success" | "info" | "warning";
};
