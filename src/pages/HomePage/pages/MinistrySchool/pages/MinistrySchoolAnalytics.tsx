import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import { ProgramResponse } from "@/utils/api/ministrySchool/interfaces";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo, useState } from "react";
import { schoolOfMinistryContract } from "../../Analytics/contracts";
import { ensureAnalyticsChartsRegistered } from "../../Analytics/chartSetup";
import { AnalyticsContractsPanel } from "../../Analytics/components/AnalyticsContractsPanel";
import { AnalyticsDateFilters } from "../../Analytics/components/AnalyticsDateFilters";
import { AnalyticsStatCards } from "../../Analytics/components/AnalyticsStatCards";
import { AnalyticsFilters } from "../../Analytics/types";
import {
  buildSeries,
  createDefaultAnalyticsFilters,
  isWithinRange,
  numberFormatter,
  toPercent,
} from "../../Analytics/utils";

ensureAnalyticsChartsRegistered();

type GenericRecord = Record<string, unknown>;

type CourseRecord = {
  name: string;
  capacity: number;
  enrolled: number;
  instructorName: string;
  createdAt: string;
};

const safeString = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isRecord = (value: unknown): value is GenericRecord => {
  return typeof value === "object" && value !== null;
};

const toCourseRecord = (raw: unknown): CourseRecord | null => {
  if (!isRecord(raw)) return null;

  const instructor = isRecord(raw.instructor)
    ? raw.instructor
    : isRecord(raw.facilitator)
    ? raw.facilitator
    : null;

  return {
    name: safeString(raw.name || raw.title || "Unnamed class"),
    capacity: safeNumber(raw.capacity),
    enrolled: safeNumber(raw.enrolled),
    instructorName: safeString(instructor?.name || raw.instructorName || "Unassigned"),
    createdAt: safeString(raw.createdAt || raw.startDate || raw.updatedAt),
  };
};

export const MinistrySchoolAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    createDefaultAnalyticsFilters()
  );

  const [cohortStatusFilter, setCohortStatusFilter] = useState("all");

  const { data: programsResponse, loading, error } = useFetch(api.fetch.fetchAllPrograms, {
    page: 1,
    take: 1000,
  });
  const { data: cohortsResponse } = useFetch(api.fetch.fetchAllCohorts, {
    page: 1,
    take: 2000,
  });
  const { data: coursesResponse } = useFetch(api.fetch.fetchAllCourses, {
    page: 1,
    take: 4000,
  });

  const programs = useMemo(() => {
    if (!Array.isArray(programsResponse?.data)) return [];
    return programsResponse.data as ProgramResponse[];
  }, [programsResponse]);

  const cohorts = useMemo(() => {
    if (!Array.isArray(cohortsResponse?.data)) return [];
    return cohortsResponse.data as GenericRecord[];
  }, [cohortsResponse]);

  const courses = useMemo(() => {
    const extracted: CourseRecord[] = [];

    if (Array.isArray(coursesResponse?.data)) {
      coursesResponse.data.forEach((row) => {
        const course = toCourseRecord(row);
        if (course) extracted.push(course);
      });
    }

    programs.forEach((program) => {
      if (!Array.isArray(program.cohorts)) return;

      program.cohorts.forEach((cohort) => {
        const cohortRecord = cohort as unknown as GenericRecord;
        if (!Array.isArray(cohortRecord.courses)) return;

        cohortRecord.courses.forEach((row) => {
          const course = toCourseRecord(row);
          if (course) extracted.push(course);
        });
      });
    });

    const uniqueByName = new Map<string, CourseRecord>();
    extracted.forEach((course) => {
      const key = `${course.name}|${course.instructorName}|${course.capacity}|${course.enrolled}`;
      uniqueByName.set(key, course);
    });

    return Array.from(uniqueByName.values());
  }, [coursesResponse, programs]);

  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      const cohortDate = safeString(cohort.startDate || cohort.createdAt || cohort.updatedAt);
      if (cohortDate && !isWithinRange(cohortDate, filters.dateRange)) return false;

      if (cohortStatusFilter !== "all") {
        const status = safeString(cohort.status);
        if (status !== cohortStatusFilter) return false;
      }

      return true;
    });
  }, [cohorts, cohortStatusFilter, filters.dateRange]);

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(cohorts.map((cohort) => safeString(cohort.status)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [cohorts]);

  const enrollmentTrend = useMemo(
    () =>
      buildSeries(
        courses,
        (course) => course.createdAt,
        (course) => Math.max(0, course.enrolled),
        filters.groupBy,
        filters.dateRange
      ),
    [courses, filters.groupBy, filters.dateRange]
  );

  const cohortStatusMix = useMemo(() => {
    const map = new Map<string, number>();

    filteredCohorts.forEach((cohort) => {
      const status = safeString(cohort.status || "Unknown");
      map.set(status, (map.get(status) ?? 0) + 1);
    });

    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [filteredCohorts]);

  const capacityTotals = useMemo(() => {
    return courses.reduce(
      (acc, course) => {
        acc.capacity += Math.max(0, course.capacity);
        acc.enrolled += Math.max(0, course.enrolled);
        return acc;
      },
      { capacity: 0, enrolled: 0 }
    );
  }, [courses]);

  const completionRate = useMemo(() => {
    if (!programs.length) return 0;
    const completed = programs.filter((program) => Boolean(program.completed)).length;
    return toPercent(completed, programs.length);
  }, [programs]);

  const instructorLoad = useMemo(() => {
    const map = new Map<string, number>();

    courses.forEach((course) => {
      const instructor = course.instructorName || "Unassigned";
      map.set(instructor, (map.get(instructor) ?? 0) + Math.max(0, course.enrolled));
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [courses]);

  const statItems = useMemo(
    () => [
      {
        label: "Programs",
        value: numberFormatter.format(programs.length),
      },
      {
        label: "Cohorts",
        value: numberFormatter.format(filteredCohorts.length),
      },
      {
        label: "Classes",
        value: numberFormatter.format(courses.length),
      },
      {
        label: "Capacity Utilization",
        value: `${toPercent(capacityTotals.enrolled, capacityTotals.capacity || 1).toFixed(1)}%`,
        hint: `${numberFormatter.format(capacityTotals.enrolled)} / ${numberFormatter.format(capacityTotals.capacity)} seats`,
      },
    ],
    [capacityTotals.capacity, capacityTotals.enrolled, courses.length, filteredCohorts.length, programs.length]
  );

  const resetFilters = () => {
    setFilters(createDefaultAnalyticsFilters());
    setCohortStatusFilter("all");
  };

  return (
    <PageOutline>
      <div className="space-y-6">
        <HeaderControls
          title="School of Ministry Analytics"
          subtitle="Program footprint, cohort dynamics, utilization, and outcomes"
        />

        <AnalyticsDateFilters
          value={filters}
          onChange={setFilters}
          onReset={resetFilters}
          extra={
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Cohort status</label>
              <select
                className="h-10 border rounded px-3 w-full"
                value={cohortStatusFilter}
                onChange={(event) => setCohortStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <AnalyticsStatCards stats={statItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Enrollment Trend</h3>
            <div className="h-72 mt-3">
              <Line
                data={{
                  labels: enrollmentTrend.labels,
                  datasets: [
                    {
                      label: "Enrolled",
                      data: enrollmentTrend.values,
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
            <h3 className="font-semibold text-primary">Cohort Status Mix</h3>
            <div className="h-72 mt-3">
              <Doughnut
                data={{
                  labels: cohortStatusMix.map((item) => item.label),
                  datasets: [
                    {
                      data: cohortStatusMix.map((item) => item.value),
                      backgroundColor: ["#2563EB", "#16A34A", "#F59E0B", "#6B7280"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <h3 className="font-semibold text-primary">Instructor Load</h3>
            <p className="text-xs text-gray-600">
              Based on enrolled students across discovered classes. Completion rate: {completionRate.toFixed(1)}%
            </p>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: instructorLoad.map((item) => item.label),
                  datasets: [
                    {
                      label: "Students",
                      data: instructorLoad.map((item) => item.value),
                      backgroundColor: "#0EA5E9",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>

        <AnalyticsContractsPanel contract={schoolOfMinistryContract} />

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load school of ministry analytics data.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded border px-4 py-3 text-sm text-gray-600">
            Loading school of ministry analytics...
          </div>
        ) : null}
      </div>
    </PageOutline>
  );
};

export default MinistrySchoolAnalytics;
