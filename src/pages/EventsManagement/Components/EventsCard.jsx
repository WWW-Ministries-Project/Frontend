import PropTypes from 'prop-types';
import CardWrapper from '/src/Wrappers/CardWrapper';
import calendar from "/src/assets/calendar.svg";
import time from "/src/assets/clock.svg";
import edit from "/src/assets/edit.svg";
import location from "/src/assets/location.svg";
import { formatTime } from '/src/utils/helperFunctions';

const EventsCard = (props) => {
    const handleNavigation = (path) => {
        props.onNavigate(path);
    }

    return (
        <CardWrapper className={"flex-col text-gray text-xs"}>
            <div className="flex gap-1 items-center font-bold">
                <div className={'w-4 h-4 bg-green rounded-full ' + props.className}></div>
                <p>{props.event.name}</p>
            </div>
            <div className="flex gap-1">
                <img src={time} alt="clock icon" />
                <p><span className="text-green">{props.event.start_time}</span><span className="text-red-400">- {props.event.end_time} (GMT)</span></p>
            </div>
            <div className="flex gap-1 items-center">
                <img src={calendar} alt="clock icon" />
                <p>{formatTime(props.event.start_date) || "TBD"}</p>
            </div>
            <div className="flex gap-1">
                <img src={location} alt="location" />
                <p>{props.event.location}</p>
            </div>
            <div className="flex gap-1 items-center justify-between border-1 border-lightGray border-t-2 py-2 text-xxs">
                <div className='flex gap-1 text-dark900 font-bold cursor-pointer' onClick={() => handleNavigation(`/home/manage-event?event_id=${props.event.id}`)} >
                    <img src={edit} alt="edit icon" className='w-3' />
                    <p>Edit</p>
                </div>
                <div className='flex gap-1 text-dark900 font-bold cursor-pointer' onClick={() => handleNavigation(`/home/events/view-event?event_id=${props.event.id}`)} >
                    <img src={edit} alt="view icon" className='w-3' />
                    <p>View</p>
                </div>
            </div>

        </CardWrapper>
    );
}

EventsCard.propTypes = {
    className: PropTypes.string,
    event: PropTypes.shape({
        name: PropTypes.string,
        start_date: PropTypes.string,
        end_date: PropTypes.string,
        location: PropTypes.string,
        description: PropTypes.string,
        id: PropTypes.number,
        start_time: PropTypes.string,
        end_time: PropTypes.string,
    }),
    onNavigate: PropTypes.func

}

export default EventsCard;
