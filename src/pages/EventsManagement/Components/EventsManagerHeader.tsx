import Button from "@/components/Button";
import Filter from "@/pages/HomePage/Components/reusable/Filter";
import { months, years } from "../utils/eventHelpers";

interface EventsManagerHeaderProps {
    onNavigate: (path: string) => void
    onChange: (name: string, value: string) => void
    onFilter: () => void
    viewfilter: boolean
}


const EventsManagerHeader:React.FC<EventsManagerHeaderProps> = (props) => {
    const monthsOptions = months;
    const yearOptions = years;

    function handleChange(name: string, value: string) {
        props.onChange(name, value);
    }

    const handleFilter = () => {
        props.onFilter();
    }

    return (
        <div className="flex w-full justify-between items-center ">
            <div className="flex gap-4 ">
                {props.viewfilter && <><Filter options={monthsOptions} name="month" onChange={handleChange} />
                <Filter options={yearOptions} name="year" onChange={handleChange} />
                <Button value="Filter" onClick={handleFilter} className={" h-10 p-2 "} /></>}
            </div>
            <Button
                value="Create Event"
                className={" text-white h-10 p-2 gradientBtn"}
                onClick={() => { props.onNavigate("/home/manage-event") }}
            />
        </div>
    );
}

export default EventsManagerHeader;
