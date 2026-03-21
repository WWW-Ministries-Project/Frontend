import { Button } from "@/components";
import { SearchBar } from "@/components/SearchBar";
import DateFilter from "@/pages/HomePage/Components/reusable/DateFilter";

interface IProps {
  onNavigate: (path: string) => void;
  onFilter: (val: { year: number; month: number; date: Date }) => void;
  onSearch: (value: string) => void;
  onEventChange?: (value: string) => void;
  filterEvents: string;
  viewfilter: boolean;
  filterDate: Date | null;
  selectedEventId?: string;
  eventOptions?: Array<{ value: string; label: string }>;
  showSearch: boolean;
  showFilter: boolean;
  onResetFilters: () => void;
}

export const EventsManagerHeader = (props: IProps) => {
  const handleFilter = (val: { year: number; month: number; date: Date }) => {
    props.onFilter(val);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onSearch(e.target.value);
  };

  return (
    <div className="flex w-full flex-wrap items-end gap-4">
      {props.viewfilter && props.showFilter && (
        <div>
          <div className="text-primary text-sm font-bold">Filter events</div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex min-w-[220px] flex-col">
              <label className="mb-1 text-xs text-primaryGray">Event</label>
              <select
                className="h-10 rounded-lg border border-lightGray px-3"
                value={props.selectedEventId ?? ""}
                onChange={(event) => props.onEventChange?.(event.target.value)}
              >
                <option value="">All events</option>
                {(props.eventOptions ?? []).map((event) => (
                  <option key={event.value} value={event.value}>
                    {event.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-[180px] flex-col">
              <label className="mb-1 text-xs text-primaryGray">Month</label>
              <DateFilter onChange={handleFilter} value={props.filterDate} />
            </div>

            <Button
              value="Reset filter"
              variant="secondary"
              onClick={props.onResetFilters}
            />
          </div>
        </div>
      )}

      {props.viewfilter && props.showSearch && (
        <SearchBar
          className="max-w-[40.9%] min-w-[100px] h-10 "
          placeholder="Search events here..."
          value={props.filterEvents}
          onChange={handleSearchChange}
          id="searchMembers"
        />
      )}
    </div>

    // <Button
    //   value="Create Event"
    //   className={"primary"}
    //   onClick={() => {
    //     props.onNavigate("/home/manage-event");
    //   }}
    // />
    // </div>
  );
};
