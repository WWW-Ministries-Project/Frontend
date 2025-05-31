import { SearchBar } from "@/components/SearchBar";
import DateFilter from "@/pages/HomePage/Components/reusable/DateFilter";

interface IProps {
  onNavigate: (path: string) => void;
  onFilter: (val: { year: number; month: number; date: Date }) => void;
  onSearch: (value: string) => void;
  filterEvents: string;
  viewfilter: boolean;
  filterDate: Date;
  showSearch: boolean;
  showFilter: boolean;
}

export const EventsManagerHeader = (props: IProps) => {
  const handleFilter = (val: { year: number; month: number; date: Date }) => {
    props.onFilter(val);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onSearch(e.target.value);
  };

  return (
    <div className="flex w-full justify-start gap-4 items-end ">
      {/* <div className="flex gap-4"> */}
      {props.viewfilter && props.showFilter && (
        <div>
          <div className="text-primary text-lg font-bold">Filter events</div>
          <DateFilter onChange={handleFilter} value={props.filterDate} />
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
