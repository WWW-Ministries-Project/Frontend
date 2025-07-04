import { isArray } from '@/pages/HomePage/utils';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventsCard } from './EventsCard';
import EventDetailsModal from './EventDetailsModal';

// Constants
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MODAL_DIMENSIONS = {
  height: 300,
  width: 300
};

const BREAKPOINTS = {
  sm: 600,
  md: 900,
  lg: 1600,
  xl: 1900
};

const VIEW_TYPES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
};

// Utility functions
const getEventsToShow = (width) => {
  if (width < BREAKPOINTS.sm) return 1;
  if (width < BREAKPOINTS.md) return 2;
  if (width < BREAKPOINTS.lg) return 3;
  if (width < BREAKPOINTS.xl) return 3;
  return 4;
};

const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

const formatDate = (year, month, day) => 
  new Date(year, month, day).toISOString().split('T')[0];

const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const getWeekDates = (date) => {
  const week = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }
  
  return week;
};

// const calculateModalPosition = (rect, dimensions) => {
//   let top = rect.top + window.scrollY;
//   let left = rect.left + window.scrollX;

//   if (rect.bottom + dimensions.height > window.innerHeight) {
//     top = rect.bottom + window.scrollY - dimensions.height;
//   }
//   if (rect.right + dimensions.width > window.innerWidth) {
//     left = rect.right + window.scrollX - dimensions.width;
//   }

//   return { top: `${top}px`, left: `${left}px` };
// };

// Custom hooks
const useResponsiveEventsToShow = () => {
  const [eventsToShow, setEventsToShow] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      setEventsToShow(getEventsToShow(window.innerWidth));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return eventsToShow;
};

const useClickOutside = (refs, callbacks) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      refs.forEach((ref, index) => {
        if (ref.current && !ref.current.contains(event.target)) {
          callbacks[index]();
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [refs, callbacks]);
};

// Event components
const EventItem = ({ event, onClick, showTime = true, className = "" }) => (
  <div 
    className={`flex text-xs gap-1 my-1 items-center cursor-pointer hover:opacity-80 ${className}`}
    onClick={onClick}
  >
    <div className="h-2 w-2 border rounded-full border-primary bg-primary flex-shrink-0" />
    {showTime && <span className="text-gray-600">{event.start_time}</span>}
    <span className="truncate">{event.name}</span>
  </div>
);

const TimeSlotEvent = ({ event, onClick }) => (
  <div
    className="bg-primary text-white text-xs p-1 rounded mb-1 cursor-pointer hover:bg-opacity-80 transition-colors"
    onClick={onClick}
  >
    <div className="font-medium truncate">{event.name}</div>
    <div className="text-xs opacity-90">
      {formatTime(event.start_time)} - {formatTime(event.end_time)}
    </div>
  </div>
);

const MoreEventsIndicator = ({ count, onClick }) => (
  <div 
    className="text-primary text-xs font-bold cursor-pointer hover:underline" 
    onClick={onClick}
  >
    {count} more event{count > 1 ? 's' : ''}
  </div>
);

// Day cell component for month view
const DayCell = ({ 
  day, 
  date, 
  dayEvents, 
  isToday, 
  isCurrentMonth, 
  eventsToShow, 
  onEventClick, 
  onDayClick 
}) => {
  const visibleEvents = dayEvents.slice(0, eventsToShow);
  const remainingEventsCount = dayEvents.length - eventsToShow;

  return (
    <div
      className={`border border-[#dcdcdc] p-2 overflow-hidden ${
        isCurrentMonth ? '' : 'text-[#dcdcdc]'
      } ${isToday ? 'relative' : ''}`}
      style={{ height: '15vh', cursor: 'pointer' }}
    >
      {isToday ? (
        <div className="h-6 w-6 border rounded-full border-primary flex items-center justify-center text-primary">
          {day}
        </div>
      ) : (
        day
      )}
      
      {visibleEvents.map((event, index) => (
        <EventItem
          key={`${event.id}-${index}`}
          event={event}
          onClick={(e) => onEventClick(e, event)}
        />
      ))}
      
      {remainingEventsCount > 0 && (
        <MoreEventsIndicator
          count={remainingEventsCount}
          onClick={(e) => onDayClick(e, dayEvents)}
        />
      )}
    </div>
  );
};

// Week view component
const WeekView = ({ 
  currentDate, 
  eventsByDate, 
  onEventClick, 
  onDayClick,
  todayString 
}) => {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-4 border-r bg-gray-50"></div>
        {weekDates.map((date, index) => {
          const dateString = date.toISOString().split('T')[0];
          const isToday = dateString === todayString;
          return (
            <div 
              key={index} 
              className={`p-4 text-center border-r ${isToday ? 'bg-primary text-white' : 'bg-gray-50'}`}
            >
              <div className="font-medium">{DAYS_OF_WEEK_SHORT[index]}</div>
              <div className={`text-lg ${isToday ? 'font-bold' : ''}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time slots */}
      <div className="max-h-[70vh] overflow-y-auto">
        {timeSlots.map((time, timeIndex) => (
          <div key={time} className="grid grid-cols-8 border-b min-h-[60px]">
            <div className="p-2 text-xs text-gray-500 border-r bg-gray-50 flex items-center">
              {formatTime(time)}
            </div>
            {weekDates.map((date, dayIndex) => {
              const dateString = date.toISOString().split('T')[0];
              const dayEvents = eventsByDate[dateString] || [];
              const timeEvents = dayEvents.filter(event => 
                event.start_time && event.start_time.startsWith(time.substring(0, 2))
              );
              
              return (
                <div 
                  key={`${dateString}-${time}`}
                  className="p-1 border-r hover:bg-gray-50 cursor-pointer min-h-[60px]"
                  onClick={(e) => dayEvents.length > 0 && onDayClick(e, dayEvents)}
                >
                  {timeEvents.map((event, eventIndex) => (
                    <TimeSlotEvent
                      key={`${event.id}-${eventIndex}`}
                      event={event}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(e, event);
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Day view component
const DayView = ({ 
  currentDate, 
  eventsByDate, 
  onEventClick,
  todayString 
}) => {
  const dateString = currentDate.toISOString().split('T')[0];
  const dayEvents = eventsByDate[dateString] || [];
  const isToday = dateString === todayString;
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      {/* Day header */}
      <div className={`p-6 text-center border-b ${isToday ? 'bg-primary text-white' : 'bg-gray-50'}`}>
        <div className="text-sm opacity-80">{DAYS_OF_WEEK[currentDate.getDay()]}</div>
        <div className="text-2xl font-bold">
          {currentDate.getDate()} {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        {dayEvents.length > 0 && (
          <div className="text-sm mt-2 opacity-80">
            {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''} scheduled
          </div>
        )}
      </div>

      {/* Time slots */}
      <div className="max-h-[70vh] overflow-y-auto">
        {timeSlots.map((time) => {
          const timeEvents = dayEvents.filter(event => 
            event.start_time && event.start_time.startsWith(time.substring(0, 2))
          );
          
          return (
            <div key={time} className="flex border-b min-h-[80px]">
              <div className="w-24 p-4 text-sm text-gray-500 border-r bg-gray-50 flex items-center">
                {formatTime(time)}
              </div>
              <div className="flex-1 p-2 hover:bg-gray-50">
                {timeEvents.map((event, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className="bg-primary text-white p-3 rounded-lg mb-2 cursor-pointer hover:bg-opacity-80 transition-colors"
                    onClick={(e) => onEventClick(e, event)}
                  >
                    <div className="font-medium">{event.name}</div>
                    <div className="text-sm opacity-90 mt-1">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </div>
                    {event.description && (
                      <div className="text-sm opacity-80 mt-2 line-clamp-2">
                        {event.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



const calculateDynamicModalPosition = (
  triggerElement, 
  modalDimensions = { width: 300, height: 300 },
  options = {}
) => {
  const {
    preferredPosition = 'auto',
    offset = 8,
    avoidOverlap = true,
    centerIfNoSpace = true
  } = options;

  const triggerRect = triggerElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  // Available space in each direction
  const spaceAbove = triggerRect.top;
  const spaceBelow = viewportHeight - triggerRect.bottom;
  const spaceLeft = triggerRect.left;
  const spaceRight = viewportWidth - triggerRect.right;
  
  let position = { top: 0, left: 0 };
  let placement = 'bottom';
  
  // Smart positioning logic
  const canFitBelow = spaceBelow >= modalDimensions.height + offset;
  const canFitAbove = spaceAbove >= modalDimensions.height + offset;
  const canFitRight = spaceRight >= modalDimensions.width + offset;
  const canFitLeft = spaceLeft >= modalDimensions.width + offset;
  
  if (preferredPosition === 'auto') {
    // Choose position with most available space
    const maxVerticalSpace = Math.max(spaceAbove, spaceBelow);
    const maxHorizontalSpace = Math.max(spaceLeft, spaceRight);
    
    if (maxVerticalSpace >= modalDimensions.height + offset) {
      // Position vertically (above or below)
      if (spaceBelow >= spaceAbove && canFitBelow) {
        position.top = triggerRect.bottom + offset + scrollY;
        placement = 'bottom';
      } else if (canFitAbove) {
        position.top = triggerRect.top - modalDimensions.height - offset + scrollY;
        placement = 'top';
      } else {
        position.top = triggerRect.bottom + offset + scrollY;
        placement = 'bottom';
      }
      
      // Center horizontally relative to trigger
      position.left = triggerRect.left + (triggerRect.width - modalDimensions.width) / 2 + scrollX;
      
      // Keep within viewport bounds
      position.left = Math.max(offset, Math.min(position.left, viewportWidth - modalDimensions.width - offset));
      
    } else if (maxHorizontalSpace >= modalDimensions.width + offset) {
      // Position horizontally (left or right)
      if (spaceRight >= spaceLeft && canFitRight) {
        position.left = triggerRect.right + offset + scrollX;
        placement = 'right';
      } else if (canFitLeft) {
        position.left = triggerRect.left - modalDimensions.width - offset + scrollX;
        placement = 'left';
      } else {
        position.left = triggerRect.right + offset + scrollX;
        placement = 'right';
      }
      
      // Center vertically relative to trigger
      position.top = triggerRect.top + (triggerRect.height - modalDimensions.height) / 2 + scrollY;
      
      // Keep within viewport bounds
      position.top = Math.max(offset, Math.min(position.top, viewportHeight - modalDimensions.height - offset));
      
    } else if (centerIfNoSpace) {
      // Center on screen if no good position available
      position.top = Math.max(offset, (viewportHeight - modalDimensions.height) / 2) + scrollY;
      position.left = Math.max(offset, (viewportWidth - modalDimensions.width) / 2) + scrollX;
      placement = 'center';
    } else {
      // Fallback: position below with boundary constraints
      position.top = Math.min(triggerRect.bottom + offset, viewportHeight - modalDimensions.height - offset) + scrollY;
      position.left = Math.max(offset, Math.min(triggerRect.left, viewportWidth - modalDimensions.width - offset)) + scrollX;
      placement = 'bottom';
    }
  }
  
  return {
    top: `${position.top}px`,
    left: `${position.left}px`,
    placement
  };
};

// Enhanced EnhancedModal component for your Calendar
const EnhancedModal = ({ 
  isOpen, 
  onClose, 
  triggerElement, 
  children, 
  modalRef,
  dimensions = { width: 300, height: 300 },
  className = ""
}) => {
  const [position, setPosition] = useState({ top: '50%', left: '50%' });
  const [placement, setPlacement] = useState('bottom');
  const [isPositioned, setIsPositioned] = useState(false);
  
  // Update position when EnhancedModal opens or trigger changes
  useEffect(() => {
    if (isOpen && triggerElement) {
      const positionData = calculateDynamicModalPosition(triggerElement, dimensions, {
        preferredPosition: 'auto',
        offset: 12,
        centerIfNoSpace: true
      });
      
      setPosition({ top: positionData.top, left: positionData.left });
      setPlacement(positionData.placement);
      setIsPositioned(true);
    } else {
      setIsPositioned(false);
    }
  }, [isOpen, triggerElement, dimensions]);
  
  // Handle repositioning on scroll/resize
  useEffect(() => {
    if (!isOpen || !triggerElement) return;
    
    const handleReposition = () => {
      const positionData = calculateDynamicModalPosition(triggerElement, dimensions, {
        preferredPosition: 'auto',
        offset: 12,
        centerIfNoSpace: true
      });
      setPosition({ top: positionData.top, left: positionData.left });
    };
    
    const debouncedReposition = debounce(handleReposition, 50);
    
    window.addEventListener('resize', debouncedReposition);
    window.addEventListener('scroll', debouncedReposition, true);
    
    return () => {
      window.removeEventListener('resize', debouncedReposition);
      window.removeEventListener('scroll', debouncedReposition, true);
    };
  }, [isOpen, triggerElement, dimensions]);
  
  if (!isOpen) return null;
  
  const modalClasses = `
    inline-block align-bottom bg-white rounded-xl text-left overflow-hidden 
    shadow-xl transform transition-all duration-200 ease-out
    ${className}
    ${isPositioned ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
  `.trim();
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className={`fixed inset-0 bg-gray-500 transition-opacity duration-200 ${
            isPositioned ? 'opacity-75' : 'opacity-0'
          }`} 
          onClick={onClose} 
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div
          className={modalClasses}
          style={{ 
            position: 'absolute', 
            ...position,
            maxWidth: '90vw',
            maxHeight: '90vh',
            zIndex: 60
          }}
          ref={modalRef}
          data-placement={placement}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10 
                     w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100
                     transition-colors duration-150"
            onClick={onClose}
            aria-label="Close EnhancedModal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};


// Main Calendar component
const Calendar = ({ events = [], onDelete, onShowOptions, showOptions, ...props }) => {
  const navigate = useNavigate();
  
  // State management
  const [currentView, setCurrentView] = useState(VIEW_TYPES.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  
  // Store trigger elements for better positioning
  const [dayModalTrigger, setDayModalTrigger] = useState(null);
  const [eventModalTrigger, setEventModalTrigger] = useState(null);
  
  // Refs
  const modalRef = useRef();
  const eventModalRef = useRef();
  
  // Custom hooks
  const eventsToShow = useResponsiveEventsToShow();
  
  useClickOutside(
    [modalRef, eventModalRef],
    [
      () => setModalIsOpen(false),
      () => setEventModalOpen(false)
    ]
  );

  // Memoized values
  const today = useMemo(() => new Date(), []);
  const todayString = useMemo(() => today.toISOString().split('T')[0], [today]);
  
  const eventsByDate = useMemo(() => {
    if (!isArray(events)) return {};
    
    return events.reduce((acc, event) => {
      const date = event.start_date.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {});
  }, [events]);

  // Calendar calculations for month view
  const calendarData = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInCurrentMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    return {
      currentMonth,
      currentYear,
      daysInCurrentMonth,
      firstDay,
      prevMonth,
      prevMonthYear,
      nextMonth,
      nextMonthYear,
      daysInPrevMonth: getDaysInMonth(prevMonth, prevMonthYear)
    };
  }, [currentDate]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case VIEW_TYPES.DAY:
        newDate.setDate(newDate.getDate() - 1);
        break;
      case VIEW_TYPES.WEEK:
        newDate.setDate(newDate.getDate() - 7);
        break;
      case VIEW_TYPES.MONTH:
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      default:
        break;
    }
    
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const handleNext = useCallback(() => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case VIEW_TYPES.DAY:
        newDate.setDate(newDate.getDate() + 1);
        break;
      case VIEW_TYPES.WEEK:
        newDate.setDate(newDate.getDate() + 7);
        break;
      case VIEW_TYPES.MONTH:
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      default:
        break;
    }
    
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleModalOpen = useCallback((event, data, isEventModal = false) => {
    event.stopPropagation(); // Prevent event bubbling
    
    if (isEventModal) {
      setSelectedEvent(data);
      setEventModalTrigger(event.target);
      setModalIsOpen(false);
      setEventModalOpen(true);
    } else {
      setSelectedDayEvents(data);
      setDayModalTrigger(event.target);
      setEventModalOpen(false);
      setModalIsOpen(true);
    }
  }, []);

  const handleDayClick = useCallback((event, dayEvents) => {
    handleModalOpen(event, dayEvents, false);
  }, [handleModalOpen]);

  const handleEventClick = useCallback((event, dayEvent) => {
    event.stopPropagation();
    handleModalOpen(event, dayEvent, true);
  }, [handleModalOpen]);

  const handleCloseEventModal = useCallback(() => {
    setSelectedEvent(null);
    setEventModalOpen(false);
  }, []);

  const handleNavigation = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  // Get current view title
  const getViewTitle = useCallback(() => {
    switch (currentView) {
      case VIEW_TYPES.DAY:
        return `${DAYS_OF_WEEK[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      case VIEW_TYPES.WEEK: {
        const weekDates = getWeekDates(currentDate);
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        const startMonth = MONTHS[startDate.getMonth()];
        const endMonth = MONTHS[endDate.getMonth()];
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        
        if (startYear === endYear && startMonth === endMonth) {
          return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${startYear}`;
        } else if (startYear === endYear) {
          return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startYear}`;
        } else {
          return `${startMonth} ${startDate.getDate()}, ${startYear} - ${endMonth} ${endDate.getDate()}, ${endYear}`;
        }
      }
      case VIEW_TYPES.MONTH:
      default:
        return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  }, [currentDate, currentView]);

  // Render days function for month view
  const renderDays = useCallback(() => {
    const days = [];
    const {
      currentMonth,
      currentYear,
      daysInCurrentMonth,
      firstDay,
      prevMonth,
      prevMonthYear,
      nextMonth,
      nextMonthYear,
      daysInPrevMonth
    } = calendarData;

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = formatDate(prevMonthYear, prevMonth, day);
      const dayEvents = eventsByDate[date] || [];
      
      days.push(
        <DayCell
          key={`prev-${day}`}
          day={day}
          date={date}
          dayEvents={dayEvents}
          isToday={false}
          isCurrentMonth={false}
          eventsToShow={eventsToShow}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />
      );
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = formatDate(currentYear, currentMonth, day);
      const dayEvents = eventsByDate[date] || [];
      const isToday = date === todayString;
      
      days.push(
        <DayCell
          key={day}
          day={day}
          date={date}
          dayEvents={dayEvents}
          isToday={isToday}
          isCurrentMonth={true}
          eventsToShow={eventsToShow}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />
      );
    }

    // Next month days
    const nextMonthDays = 7 - ((firstDay + daysInCurrentMonth) % 7);
    if (nextMonthDays < 7) {
      for (let day = 1; day <= nextMonthDays; day++) {
        const date = formatDate(nextMonthYear, nextMonth, day);
        const dayEvents = eventsByDate[date] || [];
        
        days.push(
          <DayCell
            key={`next-${day}`}
            day={day}
            date={date}
            dayEvents={dayEvents}
            isToday={false}
            isCurrentMonth={false}
            eventsToShow={eventsToShow}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        );
      }
    }

    return days;
  }, [
    calendarData,
    eventsByDate,
    eventsToShow,
    todayString,
    handleEventClick,
    handleDayClick
  ]);

  return (
    <div className="rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center my-4">
        <div className="flex items-center gap-4">
          <button 
            className="px-4 py-2 border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors" 
            onClick={handleToday}
          >
            Today
          </button>
          <div className="flex items-center gap-2">
            <button 
              className="px-4 py-2 border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors" 
              onClick={handlePrevious}
            >
              &larr;
            </button>
            <h2 className="text-xl font-medium min-w-[300px] text-center">
              {getViewTitle()}
            </h2>
            <button 
              className="px-4 py-2 border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors" 
              onClick={handleNext}
            >
              &rarr;
            </button>
          </div>
        </div>
        
        {/* View Switcher */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          {Object.entries(VIEW_TYPES).map(([key, value]) => (
            <button
              key={value}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                currentView === value
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setCurrentView(value)}
            >
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Views */}
      {currentView === VIEW_TYPES.MONTH && (
        <div className="bg-white shadow-lg rounded-xl grid grid-cols-7 gap-[0.5px] hideScrollbar overflow-y-auto">
          {/* Day headers */}
          {DAYS_OF_WEEK_SHORT.map((day, index) => (
            <div 
              key={index} 
              className="border border-[#dcdcdc] p-2 bg-gray-100 text-center text-primary font-bold"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {renderDays()}
        </div>
      )}

      {currentView === VIEW_TYPES.WEEK && (
        <WeekView
          currentDate={currentDate}
          eventsByDate={eventsByDate}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
          todayString={todayString}
        />
      )}

      {currentView === VIEW_TYPES.DAY && (
        <DayView
          currentDate={currentDate}
          eventsByDate={eventsByDate}
          onEventClick={handleEventClick}
          todayString={todayString}
        />
      )}

      {/* Day Events Modal */}
      <EnhancedModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        triggerElement={dayModalTrigger}
        modalRef={modalRef}
        dimensions={{ width: 320, height: Math.min(400, selectedDayEvents.length * 60 + 100) }}
      >
        <div className="bg-white p-6 min-w-[300px]">
          <h2 className="text-lg font-bold text-center mb-4">Events</h2>
          <ul className="space-y-2 max-h-[300px] overflow-y-auto">
            {selectedDayEvents.map(event => (
              <li key={event.id}>
                <div 
                  className="flex text-sm gap-2 cursor-pointer hover:text-primary items-center p-2 rounded hover:bg-gray-50 transition-colors"
                  onClick={(e) => handleEventClick(e, event)}
                >
                  <div className="h-3 w-3 border rounded-full border-primary bg-primary flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{event.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </EnhancedModal>

      {/* Event Details EnhancedModal */}
      <EnhancedModal
        isOpen={eventModalOpen}
        onClose={handleCloseEventModal}
        triggerElement={eventModalTrigger}
        modalRef={eventModalRef}
        dimensions={{ width: 350, height: 400 }}
      >
        <div className="w-full">
          {/* <EventsCard 
            event={selectedEvent}
            onNavigate={handleNavigation}
            calendarView={true}
            onDelete={onDelete}
            onShowOptions={onShowOptions}
            showOptions={showOptions}
          /> */}
          <EventDetailsModal
      event={selectedEvent}
      isOpen={true}
        onClose={handleCloseEventModal}
        // position={modalPosition}
        modalRef={eventModalRef}
        onNavigate={handleNavigation}
            calendarView={true}
            onDelete={onDelete}
            onShowOptions={onShowOptions}
            showOptions={showOptions}
      />
        </div>
      </EnhancedModal>
      {/* <EnhancedModal
        isOpen={eventModalOpen}
        onClose={handleCloseEventModal}
        position={modalPosition}
        modalRef={eventModalRef}
      >
        <div className="w-[25vw] min-w-[300px]">
          <EventDetailsModal
          event={selectedEvent}
          isOpen={true}
          />
          <EventsCard 
            event={selectedEvent}
            onNavigate={handleNavigation}
            calendarView={true}
            onDelete={onDelete}
            onShowOptions={onShowOptions}
            showOptions={showOptions}
          />
        </div>
      </EnhancedModal> */}
    </div>
  );
};

export default Calendar;