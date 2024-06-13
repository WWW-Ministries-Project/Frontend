import PropTypes from 'prop-types';
import { months, years } from "../utils/eventHelpers";
import Button from "/src/components/Button";
import Filter from "/src/pages/HomePage/Components/reusable/Filter";


const EventsManagerHeader = (props) => {
    const monthsOptions = months;
    const yearOptions = years;

    function handleChange(name, value) {
        props.onChange(name, value);
    }

    const handleFilter = () => {
        props.onFilter();
    }

    return (
        <div className="flex w-full justify-between items-center">
            <div className="flex gap-4">
                <Filter options={monthsOptions} name="month" onChange={handleChange} />
                <Filter options={yearOptions} name="year" onChange={handleChange} />
                <Button value="Filter" onClick={handleFilter} className={"text-white h-10 p-2 "} />
            </div>
            <Button
                value="Create Event"
                className={" text-white h-10 p-2 gradientBtn"}
                onClick={() => { props.onNavigate("/home/manage-event") }}
            />
        </div>
    );
}

EventsManagerHeader.propTypes = {
    onNavigate: PropTypes.func,
    onChange: PropTypes.func,
    onFilter: PropTypes.func
};

export default EventsManagerHeader;
