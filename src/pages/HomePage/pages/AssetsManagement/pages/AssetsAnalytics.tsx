import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import { assetType } from "../utils/assetsInterface";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo, useState } from "react";
import { assetsContract } from "../../Analytics/contracts";
import { ensureAnalyticsChartsRegistered } from "../../Analytics/chartSetup";
import { AnalyticsContractsPanel } from "../../Analytics/components/AnalyticsContractsPanel";
import { AnalyticsDateFilters } from "../../Analytics/components/AnalyticsDateFilters";
import { AnalyticsStatCards } from "../../Analytics/components/AnalyticsStatCards";
import { AnalyticsFilters } from "../../Analytics/types";
import {
  buildSeries,
  currencyFormatter,
  createDefaultAnalyticsFilters,
  isWithinRange,
  numberFormatter,
} from "../../Analytics/utils";

ensureAnalyticsChartsRegistered();

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAssetAgeYears = (datePurchased: string) => {
  const purchased = new Date(datePurchased);
  if (Number.isNaN(purchased.getTime())) return null;

  const diffMs = Date.now() - purchased.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365);
};

export const AssetsAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    createDefaultAnalyticsFilters()
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const { data: assetsResponse, loading, error } = useFetch(api.fetch.fetchAssets);

  const assets = useMemo(() => {
    if (!Array.isArray(assetsResponse?.data)) return [];
    return assetsResponse.data as assetType[];
  }, [assetsResponse]);

  const departmentOptions = useMemo(() => {
    return Array.from(
      new Set(assets.map((asset) => asset.department_assigned).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [assets]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(assets.map((asset) => asset.status).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (!isWithinRange(asset.date_purchased, filters.dateRange)) return false;
      if (statusFilter !== "all" && asset.status !== statusFilter) return false;
      if (departmentFilter !== "all" && asset.department_assigned !== departmentFilter) {
        return false;
      }
      return true;
    });
  }, [assets, departmentFilter, filters.dateRange, statusFilter]);

  const procurementTrend = useMemo(
    () =>
      buildSeries(
        filteredAssets,
        (asset) => asset.date_purchased,
        () => 1,
        filters.groupBy,
        filters.dateRange
      ),
    [filteredAssets, filters.groupBy, filters.dateRange]
  );

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    filteredAssets.forEach((asset) => {
      const key = asset.status || "Unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [filteredAssets]);

  const valueByDepartment = useMemo(() => {
    const map = new Map<string, number>();

    filteredAssets.forEach((asset) => {
      const department = asset.department_assigned || "Unassigned";
      map.set(department, (map.get(department) ?? 0) + toNumber(asset.price));
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredAssets]);

  const ageDistribution = useMemo(() => {
    const buckets = {
      "0-1 years": 0,
      "1-3 years": 0,
      "3-5 years": 0,
      "5+ years": 0,
      Unknown: 0,
    };

    filteredAssets.forEach((asset) => {
      const ageYears = getAssetAgeYears(asset.date_purchased);
      if (ageYears === null) {
        buckets.Unknown += 1;
        return;
      }

      if (ageYears < 1) buckets["0-1 years"] += 1;
      else if (ageYears < 3) buckets["1-3 years"] += 1;
      else if (ageYears < 5) buckets["3-5 years"] += 1;
      else buckets["5+ years"] += 1;
    });

    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  }, [filteredAssets]);

  const totalAssetValue = useMemo(
    () => filteredAssets.reduce((acc, asset) => acc + toNumber(asset.price), 0),
    [filteredAssets]
  );

  const statItems = useMemo(
    () => [
      {
        label: "Assets",
        value: numberFormatter.format(filteredAssets.length),
      },
      {
        label: "Portfolio Value",
        value: currencyFormatter.format(totalAssetValue),
      },
      {
        label: "Departments",
        value: numberFormatter.format(valueByDepartment.length),
      },
      {
        label: "Statuses",
        value: numberFormatter.format(statusBreakdown.length),
      },
    ],
    [filteredAssets.length, statusBreakdown.length, totalAssetValue, valueByDepartment.length]
  );

  const resetFilters = () => {
    setFilters(createDefaultAnalyticsFilters());
    setStatusFilter("all");
    setDepartmentFilter("all");
  };

  return (
    <PageOutline>
      <div className="space-y-6">
        <HeaderControls
          title="Assets Analytics"
          subtitle="Asset portfolio value, status profile, lifecycle, and procurement trend"
        />

        <AnalyticsDateFilters
          value={filters}
          onChange={setFilters}
          onReset={resetFilters}
          extra={
            <>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Status</label>
                <select
                  className="h-10 border rounded px-3 w-full"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Department</label>
                <select
                  className="h-10 border rounded px-3 w-full"
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                >
                  <option value="all">All departments</option>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
            </>
          }
        />

        <AnalyticsStatCards stats={statItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Procurement Trend</h3>
            <div className="h-72 mt-3">
              <Line
                data={{
                  labels: procurementTrend.labels,
                  datasets: [
                    {
                      label: "Assets acquired",
                      data: procurementTrend.values,
                      borderColor: "#2563EB",
                      backgroundColor: "rgba(37, 99, 235, 0.2)",
                      tension: 0.3,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Status Mix</h3>
            <div className="h-72 mt-3">
              <Doughnut
                data={{
                  labels: statusBreakdown.map((item) => item.label),
                  datasets: [
                    {
                      data: statusBreakdown.map((item) => item.value),
                      backgroundColor: ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#6B7280"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <h3 className="font-semibold text-primary">Asset Value by Department</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: valueByDepartment.map((item) => item.label),
                  datasets: [
                    {
                      label: "Value (GHS)",
                      data: valueByDepartment.map((item) => item.value),
                      backgroundColor: "#2563EB",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <h3 className="font-semibold text-primary">Asset Age Distribution</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: ageDistribution.map((item) => item.label),
                  datasets: [
                    {
                      label: "Assets",
                      data: ageDistribution.map((item) => item.value),
                      backgroundColor: "#0EA5E9",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>

        <AnalyticsContractsPanel contract={assetsContract} />

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load assets analytics.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded border px-4 py-3 text-sm text-gray-600">Loading assets analytics...</div>
        ) : null}
      </div>
    </PageOutline>
  );
};

export default AssetsAnalytics;
