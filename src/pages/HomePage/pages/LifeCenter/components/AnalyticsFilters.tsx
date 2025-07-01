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
}: IProps) => (
  <div className="border p-4 rounded-xl sticky top-10 bg-white w-full">
    <div>Filter</div>
    <div className="flex gap-x-8">
      <div>
        Year
        <div>
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
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
      </div>
      <div>
        Month
        <div>
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {getMonthOptions().map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        Week
        <div>
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
          >
            {getWeekOptions(selectedMonth, selectedYear).map((week) => (
              <option key={week.value} value={week.value}>
                {week.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  </div>
);
