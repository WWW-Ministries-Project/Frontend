import CardWrapper from '/src/Wrappers/CardWrapper';
import PropTypes from 'prop-types';
import time from "/src/assets/clock.svg";
import calendar from "/src/assets/calendar.svg";
import location from "/src/assets/location.svg";
import edit from "/src/assets/edit.svg";
import { useNavigate } from 'react-router-dom';

const EventsCard = (props) => {
    const navigate = useNavigate();
    const handleNavigation = (path) => {
        navigate(path);
    }

    return (
        <CardWrapper className={"flex-col text-gray text-xs"}>
            <div className="flex gap-1 items-center font-bold">
                <div className={'w-4 h-4 bg-green rounded-full ' + props.className}></div>
                <p>Event Name</p>
            </div>
            <div className="flex gap-1">
                <img src={time} alt="clock icon" />
                <p><span className="text-green">12:30 PM </span><span className="text-red-400">- 01:30 PM (GMT)</span></p>
            </div>
            <div className="flex gap-1 items-center">
                <img src={calendar} alt="clock icon" />
                <p>{"props.date"}</p>
            </div>
            <div className="flex gap-1">
                <img src={location} alt="location" />
                <p>Location</p>
            </div>
            <div className="flex gap-1 items-center justify-between border-1 border-lightGray border-t-2 py-2 text-xxs">
                <div className='flex gap-1 text-dark900 font-bold cursor-pointer'>
                    <img src={edit} alt="edit icon" className='w-3' />
                    <p>Edit</p>
                </div>
                <div className='flex gap-1 text-dark900 font-bold cursor-pointer' onClick={handleNavigation()}>
                    <img src={edit} alt="view icon" className='w-3' />
                    <p>View</p>
                </div>
            </div>

        </CardWrapper>
    );
}

EventsCard.propTypes = {
    className: PropTypes.string,
    date: PropTypes.string

}

export default EventsCard;
