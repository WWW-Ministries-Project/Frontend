import {
  AnalyticsMetricContract,
  AnalyticsModuleContract,
} from "../types";

interface Props {
  contract: AnalyticsModuleContract;
}

const readableFilter = (value: string) => {
  return value
    .replace(/_/g, " ")
    .replace(/\//g, " ")
    .trim();
};

const friendlySource = (source: string) => {
  return source
    .replace(/^GET\s+/i, "")
    .replace(/^POST\s+/i, "")
    .trim();
};

const fallbackDescription = (title: string) => {
  const normalized = title.toLowerCase();

  if (normalized.includes("trend")) {
    return "Shows how this metric changes over time.";
  }
  if (normalized.includes("rate")) {
    return "Shows the percentage of a key outcome.";
  }
  if (normalized.includes("mix") || normalized.includes("distribution")) {
    return "Shows how values are split across categories.";
  }
  if (normalized.includes("funnel")) {
    return "Shows progression from one stage to the next.";
  }
  if (normalized.includes("score")) {
    return "Shows an overall health score for this area.";
  }

  return "Shows a quick summary of this performance area.";
};

const MetricGuideCard = ({ metric }: { metric: AnalyticsMetricContract }) => {
  return (
    <div className="rounded-lg border p-3 space-y-2 bg-gray-50">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-sm text-primary">{metric.title}</p>
      </div>

      <p className="text-xs text-gray-700">
        <span className="font-medium">Short description:</span>{" "}
        {metric.description || fallbackDescription(metric.title)}
      </p>

      <p className="text-xs text-gray-700">
        <span className="font-medium">What this shows:</span> {metric.formula}
      </p>

      <p className="text-xs text-gray-700">
        <span className="font-medium">Data comes from:</span>{" "}
        {metric.sourceEndpoints.map(friendlySource).join(", ")}
      </p>

      <p className="text-xs text-gray-700">
        <span className="font-medium">You can filter by:</span>{" "}
        {metric.request.filters.map(readableFilter).join(", ")}
      </p>
    </div>
  );
};

export const AnalyticsContractsPanel = ({ contract }: Props) => {
  return (
    <details className="rounded-xl border bg-white p-4">
      <summary className="cursor-pointer font-semibold text-primary">
        How These Metrics Work
      </summary>

      <div className="mt-4 space-y-3 text-sm text-gray-700">
        <p>
          This page combines church data into easy-to-read indicators for <span className="font-semibold">{contract.module.replace(/_/g, " ")}</span>.
        </p>
        <p>
          Each card below explains what the metric means, which records it uses, and the filters that affect it.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {contract.metrics.map((metric) => (
          <MetricGuideCard key={metric.key} metric={metric} />
        ))}
      </div>
    </details>
  );
};
