import { isArray } from '@/pages/HomePage/utils';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventsCard } from './EventsCard';

const Calendar = ({ events, ...props }) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState();
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [modalPosition, setModalPosition] = useState({ top: '50%', left: '50%' });
  const [eventsToShow, setEventsToShow] = useState(5);
  const modalRef = useRef();
  const eventModalRef = useRef();

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setEventsToShow(1);
      } else if (window.innerWidth < 900) {
        setEventsToShow(2);
      } else if (window.innerWidth < 1600) {
        setEventsToShow(3);
      } else if (window.innerWidth < 1900) {
        setEventsToShow(3);
      } else {
        setEventsToShow(4);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setModalIsOpen(false);
      }
      if (eventModalRef.current && !eventModalRef.current.contains(event.target)) {
        setEventModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
  };

  const handleDayClick = (event, dayEvents) => {
    const rect = event.target.getBoundingClientRect();
    const modalHeight = 300; // Example height of the modal
    const modalWidth = 300; // Example width of the modal
    let top = rect.top + window.scrollY;
    let left = rect.left + window.scrollX;

    if (rect.bottom + modalHeight > window.innerHeight) {
      top = rect.bottom + window.scrollY - modalHeight;
    }

    if (rect.right + modalWidth > window.innerWidth) {
      left = rect.right + window.scrollX - modalWidth;
    }

    setModalPosition({ top: `${top}px`, left: `${left}px` });
    setSelectedDayEvents(dayEvents);
    setEventModalOpen(false);
    setModalIsOpen(true);
  };

  const handleEventClick = (event, dayEvent) => {
    const rect = event.target.getBoundingClientRect();
    const modalHeight = 300; // Example height of the modal
    const modalWidth = 300; // Example width of the modal
    let top = rect.top + window.scrollY;
    let left = rect.left + window.scrollX;

    if (rect.bottom + modalHeight > window.innerHeight) {
      top = rect.bottom + window.scrollY - modalHeight;
    }

    if (rect.right + modalWidth > window.innerWidth) {
      left = rect.right + window.scrollX - modalWidth;
    }

    setModalPosition({ top: `${top}px`, left: `${left}px` });
    setSelectedEvent(dayEvent);
    setModalIsOpen(false);
    setEventModalOpen(true);
  };

  const handleCloseEventModal = (value) => {
    setSelectedEvent();
    setEventModalOpen(value);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const renderDays = () => {
    const days = [];
    const daysInCurrentMonth = daysInMonth(currentMonth, currentYear);
    const firstDay = firstDayOfMonth(currentMonth, currentYear);

    // Previous month's days at the start of the week
    const prevMonthDays = firstDay;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = daysInMonth(prevMonth, prevMonthYear);

    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(prevMonthYear, prevMonth, day).toISOString().split('T')[0];
      const dayEvents = isArray(events) ? events?.filter(event => event.start_date.startsWith(date)) : [];
      days.push(
        <div key={`prev-${day}`} className="border border-[#dcdcdc] p-2 text-[#dcdcdc]" style={{ height: '15vh', cursor: 'pointer' }}>
          {day}
          {dayEvents.slice(0, eventsToShow).map((event, index) => (
            <div key={index} className="flex text-xs gap-1 my-1 items-center " onClick={(e) => handleEventClick(e, event)}>
              <div className='h-2 w-2 border rounded-full border-primary bg-primary  text-primary'></div>
              <p className=''>{event.start_time}</p>
              <p className='truncate'>{event.name}</p>
            </div>
          ))}
          {(dayEvents.length >= eventsToShow) && (
            <div className="text-primary text-xs font-bold" onClick={(e) => handleDayClick(e, dayEvents)}>
              {dayEvents.length - eventsToShow} more event{dayEvents.length - eventsToShow > 1 ? 's' : ''}
            </div>
          )}
        </div>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
      const dayEvents = isArray(events) ? events?.filter(event => event.start_date.startsWith(date)) : [];
      const isToday = date === todayString;

      days.push(
        <div
          key={day}
          className={`border border-[#dcdcdc] p-2 overflow-hidden ${isToday ? 'relative' : ''}`}
          style={{ height: '15vh', cursor: 'pointer' }}
        >
          {isToday && (
            <div className="h-6 w-6 border rounded-full border-primary flex items-center justify-center text-primary">
              {day}
            </div>
          )}
          {!isToday && day}
          {dayEvents.slice(0, eventsToShow).map((event, index) => (
            <div key={index} className="flex text-xs gap-1 my-1 items-center " onClick={(e) => handleEventClick(e, event)}>
              <div className='h-2 w-2 border rounded-full border-primary bg-primary  text-primary'></div>
              <p className=''>{event.start_time}</p>
              <p className='truncate'>{event.name}</p>
            </div>
          ))}
          {dayEvents.length > eventsToShow && (
            <div className="text-primary text-xs font-bold"
              onClick={(e) => handleDayClick(e, dayEvents)}>
              {dayEvents.length - eventsToShow} more event{dayEvents.length - eventsToShow > 1 ? 's' : ''}
            </div>
          )}
        </div>
      );
    }

    // Next month's days at the end of the week
    const nextMonthDays = 7 - ((prevMonthDays + daysInCurrentMonth) % 7);
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(nextMonthYear, nextMonth, day).toISOString().split('T')[0];
      const dayEvents = isArray(events) ? events?.filter(event => event.start_date.startsWith(date)) : [];
      days.push(
        <div key={`next-${day}`} className="border border-[#dcdcdc] p-2 text-[#dcdcdc] " style={{ height: '15vh', cursor: 'pointer' }}>
          {day}
          {dayEvents.slice(0, eventsToShow).map((event, index) => (
            <div key={index} className="flex text-xs gap-1 my-1 items-center " onClick={(e) => handleEventClick(e, event)}>
              <div className='h-2 w-2 border rounded-full border-primary bg-primary  text-primary'></div>
              <p className=''>{event.start_time}</p>
              <p className='truncate'>{event.name}</p>
            </div>
          ))}
          {dayEvents.length > eventsToShow && (
            <div className="text-primary text-xs font-bold" onClick={(e) => handleDayClick(e, dayEvents)}>
              {dayEvents.length - eventsToShow} more event{dayEvents.length - eventsToShow > 1 ? 's' : ''}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="rounded-xl mx-auto  ">
      <div className="flex justify-between items-center my-2">
        <div className='flex'>
          <button className='px-4 py-1 me-4 border border-primary rounded-lg' onClick={handleToday}>Today</button>
          <button className='px-4 py-1 border border-primary rounded-lg' onClick={handlePrevMonth}>&lt;</button>
          <h2 className="text-lg font-sm ms-4">{months[currentMonth]} {currentYear}</h2>
          <button className='px-4 py-1 ms-4 border border-primary rounded-lg' onClick={handleNextMonth}>&gt;</button>

        </div>
      </div>
      <div className="bg-white shadow-lg rounded-xl grid grid-cols-7 gap-[0.5] hideScrollbar  overflow-y-auto  ">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="border border-[#dcdcdc] p-2 bg-gray-100 text-center text-primary font-bold">{day}</div>
        ))}
        {renderDays()}
      </div>

      {modalIsOpen && (
        <div className="z-1 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
              className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle"
              style={{ position: 'absolute', top: modalPosition.top, left: modalPosition.left }}
              ref={modalRef}
            >
              <div className="bg-white p-6">
                <h2 className="text font-bold text-center">Events</h2>
                <button
                  className="absolute top-0 right-0 p-2"
                  onClick={() => setModalIsOpen(false)}
                >
                  &times;
                </button>
                <ul>
                  {selectedDayEvents.map(event => (
                    <li key={event.id} className="my-2">
                      <div className="flex text-xs gap-1 cursor-pointer hover:text-primary items-center " onClick={(e) => handleEventClick(e, event)}>
                        <div className='h-2 w-2 border rounded-full border-primary bg-primary text-primary '></div>
                        <p className=''>{event.start_time} - {event.end_time}</p>
                        <p>{event.name}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      {eventModalOpen &&
        <div className="z-1 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle"
              style={{ position: 'absolute', top: modalPosition.top, left: modalPosition.left, transform: 'scale(0.7)' }}
              ref={eventModalRef}
            >
              {/* <button
                className="flex items-center justify-center border-2 border-white text-white w-6 h-6 rounded-full absolute right-0 m-5 z-10"
                onClick={() => handleCloseEventModal(false)}
              >
                <div className='text-center'>&times;</div>
              </button> */}
              <div className='w-[25vw]'>
                <EventsCard event={selectedEvent} key={Math.random()} onNavigate={handleNavigation} calendarView={true} onDelete={props.onDelete} onShowOptions={(val) => props.onShowOptions(val)} showOptions={props.showOptions} />
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default Calendar;
