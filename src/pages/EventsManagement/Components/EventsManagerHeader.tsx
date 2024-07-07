import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";
import DateFilter from "@/pages/HomePage/Components/reusable/DateFilter";
import React from "react";

interface EventsManagerHeaderProps {
    onNavigate: (path: string) => void
    onChange: (val: { year: number, month: number }) => void;
    onSearch: (value: string) => void
    filterEvents: string
    onFilter: () => void
    viewfilter: boolean
    filterByDate: Date
}


const EventsManagerHeader:React.FC<EventsManagerHeaderProps> = (props) => {

    function handleChange(val: { year: number, month: number }) {
        props.onChange(val);
    }

    const handleFilter = () => {
        props.onFilter();
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.onSearch(e.target.value);
    }

    return (
        <div className="flex w-full justify-between items-center ">
            <div className="flex gap-4">
                {/* {props.viewfilter && <><Filter options={monthsOptions} name="month" onChange={handleChange} />
                <Filter options={yearOptions} name="year" onChange={handleChange} />
                <Button value="Filter" onClick={handleFilter} className={" h-10 p-2 "} /></>} */}
                <DateFilter onChange={handleChange} value={props.filterByDate} />
            </div>
            {props.viewfilter && <SearchBar
              className="max-w-[40.9%] min-w-[100px] h-10"
              placeholder="Search events here..."
              value={props.filterEvents}
              onChange={handleSearchChange}
              id="searchMembers"
            />}
            <Button
                value="Create Event"
                className={" text-white h-10 p-2 gradientBtn"}
                onClick={() => { props.onNavigate("/home/manage-event") }}
            />
        </div>
    );
}

export default EventsManagerHeader;
