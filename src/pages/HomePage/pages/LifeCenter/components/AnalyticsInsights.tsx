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
}: IProps) => (
  <div className="">
    <div>
      <div className="font-bold text-xl">Key insight</div>
      <div className="text-sm">
        Data-driven insights to help improve Life Center performance and
        strategic decision making
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
              <div className="flex-shrink-0 mt-1">{insight?.icon}</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <Badge className="text-xs">{insight.type}</Badge>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Recommendations */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-lg mb-3 text-gray-800">
          Performance Recommendations
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            • Consider organizing training sessions for centers below the
            average performance threshold
          </p>
          <p>
            • Share best practices from {topPerformerName} with other centers to
            replicate success
          </p>
          <p>
            • Focus additional resources during {peakMonth} period when
            engagement is highest
          </p>
          <p>
            • Establish mentorship programs pairing high-performing with
            developing centers
          </p>
        </div>
      </div>
    </div>
  </div>
);
type Insight = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  type: "success" | "info" | "warning";
};
