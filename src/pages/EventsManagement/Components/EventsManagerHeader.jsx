import Button from "/src/components/Button";
import Filter from "/src/pages/HomePage/Components/reusable/Filter";
import PropTypes from 'prop-types';
import { months, years } from "../utils/eventHelpers";


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
        <div  className="flex justify-between items-center my-4">
            <div className="flex gap-4">
                <Filter options={monthsOptions} name="month" onChange={handleChange} />
                <Filter options={yearOptions} name="year" onChange={handleChange} />
                <Button value="Filter" onClick={handleFilter} className={"text-white h-10 p-2 "} />
            </div>
            <Button
                value="Create Event"
                className={" text-white h-10 p-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 transition duration-300 hover:bg-gradient-to-l hover:scale-105"}
                onClick={() => {props.onNavigate("/home/manage-event")}}
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
