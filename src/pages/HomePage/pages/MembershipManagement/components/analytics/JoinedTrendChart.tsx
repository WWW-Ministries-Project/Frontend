import { DateTime } from "luxon";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";

import { ensureAnalyticsChartsRegistered } from "@/pages/HomePage/pages/Analytics/chartSetup";
import { AnalyticsRange } from "@/pages/HomePage/pages/Analytics/types";
import { isWithinRange, toDateTime } from "@/pages/HomePage/pages/Analytics/utils";

import { ChartCard } from "./AnalyticsCharts";
import { getMemberJoinDate, MemberRecord } from "./memberAnalyticsData";

ensureAnalyticsChartsRegistered();

type TrendGranularity = "year" | "month" | "week" | "day";

const getTrendBucketKey = (date: DateTime, granularity: TrendGranularity) => {
  if (granularity === "year") return date.toFormat("yyyy");
  if (granularity === "month") return date.toFormat("yyyy-LL");
  if (granularity === "week") {
    return `${date.weekYear}-W${String(date.weekNumber).padStart(2, "0")}`;
  }
  return date.toFormat("yyyy-LL-dd");
};

const getTrendBucketLabel = (key: string, granularity: TrendGranularity) => {
  if (granularity === "year") return key;

  if (granularity === "month") {
    const parsed = DateTime.fromFormat(key, "yyyy-LL");
    return parsed.isValid ? parsed.toFormat("LLL yyyy") : key;
  }

  if (granularity === "week") return key;

  const parsed = DateTime.fromFormat(key, "yyyy-LL-dd");
  return parsed.isValid ? parsed.toFormat("dd LLL") : key;
};

const resolveTrendGranularity = (
  earliest: DateTime,
  latest: DateTime
): TrendGranularity => {
  if (earliest.year !== latest.year) return "year";
  if (earliest.month !== latest.month) return "month";
  if (
    earliest.weekYear !== latest.weekYear ||
    earliest.weekNumber !== latest.weekNumber
  ) {
    return "week";
  }
  return "day";
};

/**
 * Members joined trend (using date joined). The bucketing, datasets and chart
 * look are intentionally unchanged from the previous analytics page; only the
 * surrounding card shell follows the redesign.
 */
export const JoinedTrendChart = ({
  members,
  effectiveDateRange,
}: {
  members: MemberRecord[];
  effectiveDateRange: AnalyticsRange;
}) => {
  const joinedTrend = useMemo(() => {
    const joinDates = members
      .map((member) => toDateTime(getMemberJoinDate(member)))
      .filter((value): value is DateTime => Boolean(value));

    const earliestDataDate = joinDates.reduce<DateTime | null>((earliest, current) => {
      if (!earliest) return current;
      return current.toMillis() < earliest.toMillis() ? current : earliest;
    }, null);
    const latestDataDate = joinDates.reduce<DateTime | null>((latest, current) => {
      if (!latest) return current;
      return current.toMillis() > latest.toMillis() ? current : latest;
    }, null);

    const fallbackFrom = toDateTime(effectiveDateRange.from);
    const fallbackTo = toDateTime(effectiveDateRange.to);

    const anchorFrom = earliestDataDate ?? fallbackFrom ?? DateTime.now();
    const anchorTo = latestDataDate ?? fallbackTo ?? anchorFrom;
    const granularity = resolveTrendGranularity(anchorFrom, anchorTo);

    const buckets = new Map<string, number>();

    members.forEach((member) => {
      const joinedAt = getMemberJoinDate(member);
      if (!joinedAt || !isWithinRange(joinedAt, effectiveDateRange)) return;

      const parsed = toDateTime(joinedAt);
      if (!parsed) return;

      const key = getTrendBucketKey(parsed, granularity);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });

    const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a.localeCompare(b));

    return {
      granularity,
      labels: sortedKeys.map((key) => getTrendBucketLabel(key, granularity)),
      values: sortedKeys.map((key) => buckets.get(key) ?? 0),
    };
  }, [effectiveDateRange, members]);

  const joinedTrendCumulative = useMemo(() => {
    let runningTotal = 0;
    return joinedTrend.values.map((value) => {
      runningTotal += value;
      return runningTotal;
    });
  }, [joinedTrend.values]);

  return (
    <ChartCard
      fullWidth
      title="Members joined trend (using date joined)"
      sub={
        <>
          Growth is evaluated by member join date and auto-grouped by{" "}
          <span className="font-semibold">{joinedTrend.granularity}</span> based on
          the current data span.
        </>
      }
    >
      <div className="h-72">
        <Line
          data={{
            labels: joinedTrend.labels,
            datasets: [
              {
                label: "Members joined",
                data: joinedTrend.values,
                borderColor: "#2463EB",
                backgroundColor: "rgba(36, 99, 235, 0.2)",
                tension: 0.3,
              },
              {
                label: "Cumulative growth",
                data: joinedTrendCumulative,
                borderColor: "#16A34A",
                backgroundColor: "rgba(22, 163, 74, 0.15)",
                tension: 0.3,
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>
    </ChartCard>
  );
};
