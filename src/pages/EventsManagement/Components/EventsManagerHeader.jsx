import Button from "/src/components/Button";
import Filter from "/src/pages/HomePage/Components/reusable/Filter";
import PropTypes from 'prop-types';


const EventsManagerHeader = (props) => {
    return (
        <div  className="flex justify-between items-center my-4">
            <div className="flex gap-4">
                <Filter />
                <Filter />
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
};

export default EventsManagerHeader;
