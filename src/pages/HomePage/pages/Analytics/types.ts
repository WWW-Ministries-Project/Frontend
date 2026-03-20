export type AnalyticsMetricPayloadType =
  | "timeseries"
  | "breakdown"
  | "ratio"
  | "funnel"
  | "distribution"
  | "cohort"
  | "score";

export type AnalyticsGroupBy = "day" | "week" | "month";
export type AnalyticsPeriodType =
  | "year"
  | "month"
  | "week"
  | "specific_date_range";
export type AnalyticsAnalysisMode = "point_in_time" | "cumulative";

export interface AnalyticsRange {
  from: string;
  to: string;
}

export interface AnalyticsFilters {
  dateRange: AnalyticsRange;
  groupBy: AnalyticsGroupBy;
  periodType?: AnalyticsPeriodType;
  analysisMode?: AnalyticsAnalysisMode;
  selectedYear?: string;
  selectedMonth?: string;
  selectedWeek?: string;
}

export interface AnalyticsMetricContract {
  key: string;
  title: string;
  description?: string;
  payloadType: AnalyticsMetricPayloadType;
  sourceEndpoints: string[];
  request: {
    filters: string[];
    groupBy?: AnalyticsGroupBy[];
    notes?: string;
  };
  responseShape: string;
  formula: string;
}

export interface AnalyticsModuleContract {
  module: string;
  endpoint: string;
  method: "POST";
  requestShape: string;
  responseShape: string;
  metrics: AnalyticsMetricContract[];
}

export interface AnalyticsStatItem {
  label: string;
  value: string;
  hint?: string;
}
