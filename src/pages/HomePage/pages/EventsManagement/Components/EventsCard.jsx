import Action from '@/components/Action';
import { compareDates } from '@/utils/helperFunctions';
import PropTypes from 'prop-types';
import CardWrapper from '/src/Wrappers/CardWrapper';
import calendar from "/src/assets/calendar.svg";
import Elipse from '/src/assets/ellipse.svg';
import defaultImage1 from "/src/assets/image.svg";
import location from "/src/assets/location.svg";
import { formatTime } from '/src/utils/helperFunctions';
import { eventTypeColors } from '../utils/eventHelpers';


const EventsCard = (props) => {
    const handleNavigation = (path) => {
        props.onNavigate(path);
    }

    const handleDelete = (e) => {
        e.stopPropagation()
        props.onDelete(props.event)
    }
    const handleShowOptions = (e) => {
        e.stopPropagation()
        props.onShowOptions(props.event.id)
    }


    return (
        <div className={`rounded-xl pb-1 ` } style={{ backgroundColor: props.event.event_type ? eventTypeColors[props.event.event_type] : '#00000050' }}>
            <CardWrapper className={"text-gray gap-2 pb-2 flex flex-col rounded-xl relative"}>
                <div className={`rounded-xl bg-[#00000050] border-b `} style={{ borderColor: props.event.event_type ? eventTypeColors[props.event.event_type] : '#00000050' }}>
                    <img className='max-w-[70vw] rounded-xl w-full h-32' src={props.event.poster || defaultImage1} alt="poster for event" />
                </div>
                <div className="flex px-3 gap-1 items-center font-bold cursor-pointer" onClick={() => handleNavigation(`/home/events/view-event?event_id=${props.event.id}`)}>
                    <div className={`w-2 h-2 ${compareDates(props.event.start_date) ? 'bg-[#FF5765]' : "bg-green"} rounded rounded-full ${props.indicatorClass}`} />
                    <p>{props.event.name}</p>
                </div>
                <div className="flex px-3 gap-1 items-center text-sm">
                    <img src={calendar} alt="clock icon" />
                    <p>{formatTime(props.event.start_date) || "TBD"} |
                        <span className="text-sm">{props.event.start_time}</span><span className="text-sm">- {props.event.end_time} </span></p>
                </div>
                <div className="flex px-3 gap-1 text-sm">
                    <img src={location} alt="location" />
                    <p>{props.event.location}</p>
                </div>
                <div className={`absolute right-0 flex flex-col items-end m-4 rounded-md w-1/4 text-center`} onClick={handleShowOptions}>
                    <img src={Elipse} alt="options" className='cursor-pointer' />
                    {props.showOptions && <Action onDelete={handleDelete} onView={() => handleNavigation(`/home/events/view-event?event_id=${props.event.id}`)} onEdit={() => handleNavigation(`/home/manage-event?event_id=${props.event.id}`)} />}
                </div>
            </CardWrapper>
        </div>
    )

}

EventsCard.propTypes = {
    className: PropTypes.string,
    indicatorClass: PropTypes.string,
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
    showOptions: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number
    ]),
    onShowOptions: PropTypes.func,
    // onNavigate: PropTypes.func,
    // onDelete: PropTypes.func

}

export default EventsCard;
