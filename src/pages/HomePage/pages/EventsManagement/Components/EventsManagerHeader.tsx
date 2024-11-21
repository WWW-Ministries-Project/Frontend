import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";
import DateFilter from "@/pages/HomePage/Components/reusable/DateFilter";
import React from "react";

interface EventsManagerHeaderProps {
  onNavigate: (path: string) => void;
  onFilter: (val: { year: number; month: number; date: Date }) => void;
  onSearch: (value: string) => void;
  filterEvents: string;
  viewfilter: boolean;
  filterDate: Date;
}

const EventsManagerHeader: React.FC<EventsManagerHeaderProps> = (props) => {
  const handleFilter = (val: { year: number; month: number; date: Date }) => {
    props.onFilter(val);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onSearch(e.target.value);
  };

  return (
    <div className="flex w-full justify-between items-center ">
      <div className="flex gap-4">
        {props.viewfilter && (
          <DateFilter onChange={handleFilter} value={props.filterDate} />
        )}

        {props.viewfilter && (
          <SearchBar
            className="max-w-[40.9%] min-w-[100px] h-10"
            placeholder="Search events here..."
            value={props.filterEvents}
            onChange={handleSearchChange}
            id="searchMembers"
          />
        )}
      </div>

      <Button
        value="Create Event"
        className={" text-white h-10 p-2 gradientBtn"}
        onClick={() => {
          props.onNavigate("/home/manage-event");
        }}
      />
    </div>
  );
};

export default EventsManagerHeader;
