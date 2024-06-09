import React, { useState, useEffect } from 'react';
// import { events } from '../../../utils/events';

const Calendar = ({events}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [modalPosition, setModalPosition] = useState({ top: '50%', left: '50%' });

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  const data = [
    {
      "id": 29,
      "name": "Nissim Campos",
      "start_date": "1976-10-23T00:00:00.000Z",
      "end_date": "2023-04-22T00:00:00.000Z",
      "start_time": "02:05",
      "end_time": "13:28",
      "location": "Ullam voluptatum cul",
      "description": "Labore sit amet est",
      "poster": null,
      "qr_code": "https://res.cloudinary.com/dt8vgj0u3/image/upload/v1717604751/www-ministires/events_qr/qi03g3jknwuxh81o4agd.png",
      "created_by": 1,
      "created_at": "2024-06-05T16:25:52.062Z",
      "updated_by": null,
      "updated_at": null
    },
    {
      "id": 35,
      "name": "Garth Mcdowell",
      "start_date": "2007-05-02T00:00:00.000Z",
      "end_date": "2009-01-17T00:00:00.000Z",
      "start_time": "05:18",
      "end_time": "12:09",
      "location": "Asperiores maiores e",
      "description": "Ea ut quia voluptate",
      "poster": null,
      "qr_code": "https://res.cloudinary.com/dt8vgj0u3/image/upload/v1717606774/www-ministires/events_qr/cuhqmo0gdz7mhqelngvd.png",
      "created_by": 1,
      "created_at": "2024-06-05T16:59:35.167Z",
      "updated_by": null,
      "updated_at": null
    },
    // Add more events here
  ];

  useEffect(() => {
    console.log("Event data", events);
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
    setModalPosition({
      top: rect.top + window.scrollY + rect.height + 10 + 'px',
      left: rect.left + 'px'
    });
    setSelectedDayEvents(dayEvents);
    setModalIsOpen(true);
  };

  const renderDays = () => {
    const days = [];
    const daysInCurrentMonth = daysInMonth(currentMonth, currentYear);
    const firstDay = firstDayOfMonth(currentMonth, currentYear);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="border border-[#dcdcdc] p-2" style={{ height: '20vh' }}></div>);
    }

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
      const dayEvents = events?.filter(event => event.start_date.startsWith(date));
      const isToday = date === todayString;

      days.push(
        <div
          key={day}
          className={`border border-[#dcdcdc] p-2 overflow-hidden ${isToday ? 'relative' : ''}`}
          style={{ height: '20vh', cursor: 'pointer' }}
          onClick={(e) => handleDayClick(e, dayEvents)}
        >
          {isToday && (
            <div className="absolute top-1 left-1 h-6 w-6 border rounded-full border-[#6539C3] flex items-center justify-center text-[#6539C3]">
              {day}
            </div>
          )}
          {!isToday && day}
          {dayEvents.slice(0, 7).map((event, index) => (
            <div key={index} className="text-purple-500 text-xs truncate">
              {event.start_time} {event.name}
            </div>
          ))}
          {dayEvents.length > 7 && (
            <div className="text-purple-500 text-xs">
              {dayEvents.length - 7} more event{dayEvents.length - 7 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="py-4  rounded-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className='flex'>
      <button className='px-4 py-1 me-4 border border-[#dcdcdc] rounded-lg' onClick={handleToday}>Today</button>
        <button className='px-4 py-1 border border-[#dcdcdc] rounded-lg' onClick={handlePrevMonth}>&lt;</button>
        <button className='px-4 py-1 ms-4 border border-[#dcdcdc] rounded-lg' onClick={handleNextMonth}>&gt;</button>
        <h2 className="text-lg font-sm ms-4">{months[currentMonth]} {currentYear}</h2>
       
        </div>
        <button className='px-4 py-1 border border-[#dcdcdc] rounded-lg float-right' onClick={handleToday}>Today</button>
        
      </div>
      <div className="bg-white p-8 rounded-xl grid grid-cols-7 gap-[0.5]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="border border-[#dcdcdc] p-2 bg-gray-100 text-center font-bold">{day}</div>
        ))}
        {renderDays()}
      </div>

      {modalIsOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              style={{ position: 'absolute', top: modalPosition.top, left: modalPosition.left }}
            >
              <div className="bg-white p-6">
                <h2 className="text-xl font-bold">Events</h2>
                <button
                  className="absolute top-0 right-0 p-2"
                  onClick={() => setModalIsOpen(false)}
                >
                  &times;
                </button>
                <ul>
                  {selectedDayEvents.map(event => (
                    <li key={event.id} className="mb-2">
                      <p>{event.start_time} - {event.end_time}</p>
                      <p>{event.name}</p>
                      {/* <p>{event.description}</p>
                      <p>{event.location}</p> */}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
