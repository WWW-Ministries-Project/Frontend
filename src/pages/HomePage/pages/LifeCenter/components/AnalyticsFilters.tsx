import { getMonthOptions, getWeekOptions, getYearOptions } from "@/utils";

interface IProps {
  selectedYear: string;
  setSelectedYear: (v: string) => void;
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  selectedWeek: string;
  setSelectedWeek: (v: string) => void;
}

export const AnalyticsFilters = ({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedWeek,
  setSelectedWeek,
}: IProps) => {
  const weeks = getWeekOptions(selectedMonth, selectedYear);
  const weekDisabled = selectedMonth === "all";

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 text-sm font-semibold text-gray-700">Filters</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="analytics-year" className="text-sm text-gray-600">
            Year
          </label>
          <select
            id="analytics-year"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {getYearOptions().map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="analytics-month" className="text-sm text-gray-600">
            Month
          </label>
          <select
            id="analytics-month"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
            value={selectedMonth}
            onChange={(e) => {
              const month = e.target.value;
              setSelectedMonth(month);
              setSelectedWeek("all");
            }}
          >
            {getMonthOptions().map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="analytics-week" className="text-sm text-gray-600">
            Week
          </label>
          <select
            id="analytics-week"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-100"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            disabled={weekDisabled}
          >
            {weeks.map((week) => (
              <option key={week.value} value={week.value}>
                {week.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
