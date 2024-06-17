import PropTypes from 'prop-types';
import CardWrapper from '/src/Wrappers/CardWrapper';
import calendar from "/src/assets/calendar.svg";
import time from "/src/assets/clock.svg";
import defaultImage from "/src/assets/images/earth.png"
import defaultImage1 from "/src/assets/images/default.png"
import edit from "/src/assets/edit.svg";
import location from "/src/assets/location.svg";
import { formatTime } from '/src/utils/helperFunctions';
import Button from '/src/components/Button';


const EventsCard = (props) => {
    const handleNavigation = (path) => {
        props.onNavigate(path);
    }

    return (
        <div className="authForm  rounded-xl shadow-lg mx-auto ">
            <div className='relative top-2'>
                <img className='rounded-xl' src={props.event.poster||defaultImage1} alt="" />
            </div>
            <div className='pb-1 rounded-xl bg-primaryViolet'>
        <CardWrapper className={"flex-col text-gray rounded-b-xl"}>
            <div className="flex pt-2 gap-1 items-center font-bold">
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
            <div className="flex gap-3 items-center  border-1 border-lightGray border-t pt-3 text-xxs">
                <div className='flex gap-1 text-dark900  cursor-pointer' onClick={() => handleNavigation(`/home/manage-event?event_id=${props.event.id}`)} >

                    <Button value="Edit" className=" p-2 border border-primaryViolet text-primaryViolet text-xs   " onClick={() => handleNavigation(`/home/manage-event?event_id=${props.event.id}`)}/>
                </div>
                <div className='flex  text-dark900  cursor-pointer' onClick={() => handleNavigation(`/home/events/view-event?event_id=${props.event.id}`)} >
                
                    <Button value="View" className=" p-2  text-white text-xs  bg-primaryViolet " onClick={() => handleNavigation(`/home/events/view-event?event_id=${props.event.id}`)}/>
                </div>
            </div>
            
        </CardWrapper>
        </div>
        </div>
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
