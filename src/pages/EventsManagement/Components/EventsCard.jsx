import PropTypes from 'prop-types';
import CardWrapper from '/src/Wrappers/CardWrapper';
import calendar from "/src/assets/calendar.svg";
import time from "/src/assets/clock.svg";
import defaultImage from "/src/assets/images/earth.png"
import edit from "/src/assets/edit.svg";
import location from "/src/assets/location.svg";
import { formatTime } from '/src/utils/helperFunctions';


const EventsCard = (props) => {
    const handleNavigation = (path) => {
        props.onNavigate(path);
    }

    return (
        <CardWrapper className={"flex-col text-gray text-xs"+"border border border-[#FF576550]"}>
            <div className=''>
                <img className='rounded-xl' src={props.event.poster||defaultImage} alt="" />
            </div>
            <div className="flex gap-1 items-center font-bold">
                <div className={'w-2 h-2 bg-[#FF5765] rounded rounded-full' + props.className}/>
                <p>{props.event.name}</p>
            </div>
            <div className="flex gap-1 text-sm">
                <img src={time} alt="clock icon" />
                <p><span className="text-sm">{props.event.start_time}</span><span className="text-sm">- {props.event.end_time} (GMT)</span></p>
            </div>
            <div className="flex gap-1 items-center text-sm">
                <img src={calendar} alt="clock icon" />
                <p>{formatTime(props.event.start_date) || "TBD"}</p>
            </div>
            <div className="flex gap-1 text-sm">
                <img src={location} alt="location" />
                <p>{props.event.location}</p>
            </div>
            <div className="flex gap-1 items-center justify-between border-1 border-lightGray border-t py-2 text-xxs">
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
    onNavigate: PropTypes.func,
    calendarView: PropTypes.bool,

}

export default EventsCard;
