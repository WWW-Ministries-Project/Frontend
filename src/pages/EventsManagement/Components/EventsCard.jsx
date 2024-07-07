import PropTypes from 'prop-types';
import CardWrapper from '/src/Wrappers/CardWrapper';
import calendar from "/src/assets/calendar.svg";
import time from "/src/assets/clock.svg";
import defaultImage from "/src/assets/images/earth.png"
import defaultImage1 from "/src/assets/image.svg"
import edit from "/src/assets/edit.svg";
import location from "/src/assets/location.svg";
import { formatTime } from '/src/utils/helperFunctions';
import Button from '/src/components/Button';
import { compareDates } from '@/utils/helperFunctions';


const EventsCard = (props) => {
    const handleNavigation = (path) => {
        props.onNavigate(path);
    }

    return (
        // <div className="authForm  rounded-xl shadow-lg mx-auto ">
        //     <div className='relative top-2'>
        //         <img className='rounded-xl' src={props.event.poster||defaultImage1} alt="" />
        //     </div>
        //     <div className='pb-1 rounded-xl bg-primaryViolet'>
        <div className="authForm bg-white  rounded-xl shadow-lg md:mx-auto border-[#6539C3] border-b-4">
            <div className='relative top cursor-pointer' onClick={() => handleNavigation(`/home/events/view-event?event_id=${props.event.id}`)}>
            <div className='absolute bg-[#00000050] w-full h-[20vh] rounded-xl shadow-sm'></div>
                <div className={`text-xs absolute right-0 m-4 rounded-md text-lighterBlack w-1/4 text-center ${props.event.status=== "ASSIGNED"? "bg-green "
            : "bg-neutralGray text-lighterBlack"}`}>{props.event.status=== "ASSIGNED" ? "Confirmed" : "Tentative"}</div>
            
                <img className='rounded-xl w-[70vw] h-[20vh]' src={props.event.poster || defaultImage1} alt="poster for event" />
                
                
            </div>
            {/* <div className='pb-1 rounded-xl bg-primaryViolet'> */}
        <CardWrapper className={"flex-col text-gray rounded-b-xl "}>
            <div className="flex gap-1 items-center font-bold cursor-pointer" onClick={() => handleNavigation(`/home/events/view-event?event_id=${props.event.id}`)}>
                <div className={`w-2 h-2 ${compareDates(props.event.start_date)?'bg-[#FF5765]':"bg-green"} rounded rounded-full ${props.indicatorClass}`}/>
                <p>{props.event.name}</p>
            </div>
            {/* <div className="flex gap-1 text-sm">
                <img src={time} alt="clock icon" />
                <p><span className="text-sm">{props.event.start_time}</span><span className="text-sm">- {props.event.end_time} (GMT)</span></p>
            </div> */}
            <div className="flex gap-1 items-center text-sm">
                <img src={calendar} alt="clock icon" />
                <p>{formatTime(props.event.start_date) || "TBD"} | 
                <span className="text-sm">{props.event.start_time}</span><span className="text-sm">- {props.event.end_time} </span></p>
            </div>
            <div className="flex gap-1 text-sm">
                <img src={location} alt="location" />
                <p>{props.event.location}</p>
            </div>
            <hr className='text-[lightGray]'/>
            <div className="flex gap-x-2 items-center justify-between  border-1 border-lightGray ">
                
                <div className='flex  gap-x-1 text-dark900  cursor-pointer' onClick={() => handleNavigation(`/home/manage-event?event_id=${props.event.id}`)} >

                    <Button value="Edit" className=" px-2 border-0 border-primaryViolet text-primaryViolet text-xs   " onClick={() => handleNavigation(`/home/manage-event?event_id=${props.event.id}`)}/>
                </div>
                <div className='flex  text-dark900  cursor-pointer' onClick={() => handleNavigation(`/home/events/view-event?event_id=${props.event.id}`)} >
                
                    <Button value="View" className=" px-2  text-primaryViolet text-xs   bg-primaryVioletk " onClick={() => handleNavigation(`/home/events/view-event?event_id=${props.event.id}`)}/>
                </div>
            </div>
            
        </CardWrapper>
        {/* </div> */}
        </div>
    );
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

}

export default EventsCard;
