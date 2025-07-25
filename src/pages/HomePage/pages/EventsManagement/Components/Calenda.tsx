import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  RefObject,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { isArray } from '@/pages/HomePage/utils';
import {
  VIEW_TYPES,
  MONTHS,
  DAYS_OF_WEEK,
  DAYS_OF_WEEK_SHORT,
  getEventsToShow,
  getDaysInMonth,
  getFirstDayOfMonth,
  getWeekDates,
  formatDate,
  formatTime,
  parseTimeToMinutes,
  CalendarEvent,
} from './calenda/utils/CalendaHelpers';
import DayCell from './calenda/components/DayCell';
import MoreEventsIndicator from './calenda/components/MoreEventsIndicator';
import EventItem from './calenda/components/EventItem';
import WeekView from './calenda/components/WeekView';
import DayView from './calenda/components/DayView';
import EnhancedModal from './calenda/components/EnhancedModal';
import EventDetailsModal from './EventDetailsModal';

interface CalendarProps {
  events?: CalendarEvent[];
  onDelete: (event: CalendarEvent) => void;
  onShowOptions: (event: CalendarEvent) => void;
  showOptions: boolean;
}

interface CalendarData {
  currentMonth: number;
  currentYear: number;
  daysInCurrentMonth: number;
  firstDay: number;
  prevMonth: number;
  prevMonthYear: number;
  nextMonth: number;
  nextMonthYear: number;
  daysInPrevMonth: number;
}

function useResponsiveEventsToShow(): number {
  const [eventsToShow, setEventsToShow] = useState<number>(5);

  useEffect(() => {
    const handleResize = () => {
      setEventsToShow(getEventsToShow(window.innerWidth));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return eventsToShow;
}

function useClickOutside(
  refs: RefObject<HTMLElement>[],
  callbacks: Array<() => void>
): void {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      refs.forEach((ref, i) => {
        if (
          ref.current &&
          !ref.current.contains(event.target as Node)
        ) {
          callbacks[i]();
        }
      });
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, [refs, callbacks]);
}

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onDelete,
  onShowOptions,
  showOptions,
  ...props
}) => {
  const navigate = useNavigate();

  // State
  const [currentView, setCurrentView] = useState<(typeof VIEW_TYPES)[keyof typeof VIEW_TYPES]>(
    VIEW_TYPES.MONTH
  );
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<
    CalendarEvent[]
  >([]);

  const [dayModalTrigger, setDayModalTrigger] =
    useState<HTMLElement | null>(null);
  const [eventModalTrigger, setEventModalTrigger] =
    useState<HTMLElement | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const eventModalRef = useRef<HTMLDivElement>(null);

  const eventsToShow = useResponsiveEventsToShow();

  useClickOutside(
    [modalRef, eventModalRef],
    [
      () => setModalIsOpen(false),
      () => setEventModalOpen(false),
    ]
  );

  const today = useMemo(() => new Date(), []);
  const todayString = useMemo(
    () => today.toISOString().split('T')[0],
    [today]
  );

  const eventsByDate = useMemo<Record<string, CalendarEvent[]>>(() => {
    if (!isArray(events)) return {};
    return events.reduce((acc, ev) => {
      const dateKey = ev.start_date.split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(ev);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events]);

  const calendarData = useMemo<CalendarData>(() => {
    const m = currentDate.getMonth();
    const y = currentDate.getFullYear();
    const daysInCurrent = getDaysInMonth(m, y);
    const first = getFirstDayOfMonth(m, y);

    const prevM = m === 0 ? 11 : m - 1;
    const prevY = m === 0 ? y - 1 : y;
    const nextM = m === 11 ? 0 : m + 1;
    const nextY = m === 11 ? y + 1 : y;

    return {
      currentMonth: m,
      currentYear: y,
      daysInCurrentMonth: daysInCurrent,
      firstDay: first,
      prevMonth: prevM,
      prevMonthYear: prevY,
      nextMonth: nextM,
      nextMonthYear: nextY,
      daysInPrevMonth: getDaysInMonth(prevM, prevY),
    };
  }, [currentDate]);

  const handlePrevious = useCallback(() => {
    const d = new Date(currentDate);
    switch (currentView) {
      case VIEW_TYPES.DAY:
        d.setDate(d.getDate() - 1);
        break;
      case VIEW_TYPES.WEEK:
        d.setDate(d.getDate() - 7);
        break;
      case VIEW_TYPES.MONTH:
        d.setMonth(d.getMonth() - 1);
        break;
    }
    setCurrentDate(d);
  }, [currentDate, currentView]);

  const handleNext = useCallback(() => {
    const d = new Date(currentDate);
    switch (currentView) {
      case VIEW_TYPES.DAY:
        d.setDate(d.getDate() + 1);
        break;
      case VIEW_TYPES.WEEK:
        d.setDate(d.getDate() + 7);
        break;
      case VIEW_TYPES.MONTH:
        d.setMonth(d.getMonth() + 1);
        break;
    }
    setCurrentDate(d);
  }, [currentDate, currentView]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleModalOpen = useCallback(
    (
      e: React.MouseEvent<HTMLElement>,
      data: CalendarEvent[] | CalendarEvent,
      isEvent: boolean = false
    ) => {
      e.stopPropagation();
      if (isEvent) {
        setSelectedEvent(data as CalendarEvent);
        setEventModalTrigger(e.currentTarget);
        setModalIsOpen(false);
        setEventModalOpen(true);
      } else {
        setSelectedDayEvents(data as CalendarEvent[]);
        setDayModalTrigger(e.currentTarget);
        setEventModalOpen(false);
        setModalIsOpen(true);
      }
    },
    []
  );

  const handleDayClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, dayEvents: CalendarEvent[]) =>
      handleModalOpen(e, dayEvents, false),
    [handleModalOpen]
  );

  const handleEventClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, ev: CalendarEvent) => {
      e.stopPropagation();
      handleModalOpen(e, ev, true);
    },
    [handleModalOpen]
  );

  const handleCloseEventModal = useCallback(() => {
    setSelectedEvent(null);
    setEventModalOpen(false);
  }, []);

  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const getViewTitle = useCallback((): string => {
    switch (currentView) {
      case VIEW_TYPES.DAY:
        return `${DAYS_OF_WEEK[currentDate.getDay()]}, ${
          MONTHS[currentDate.getMonth()]
        } ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      case VIEW_TYPES.WEEK: {
        const wk = getWeekDates(currentDate);
        const s = wk[0],
          e = wk[6];
        const sMonth = MONTHS[s.getMonth()],
          eMonth = MONTHS[e.getMonth()];
        const sYr = s.getFullYear(),
          eYr = e.getFullYear();
        if (sYr === eYr && sMonth === eMonth) {
          return `${sMonth} ${s.getDate()} - ${e.getDate()}, ${sYr}`;
        } else if (sYr === eYr) {
          return `${sMonth} ${s.getDate()} - ${eMonth} ${e.getDate()}, ${sYr}`;
        } else {
          return `${sMonth} ${s.getDate()}, ${sYr} - ${eMonth} ${e.getDate()}, ${eYr}`;
        }
      }
      default:
        return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  }, [currentDate, currentView]);

  const renderDays = useCallback((): JSX.Element[] => {
    const days: JSX.Element[] = [];
    const {
      currentMonth,
      currentYear,
      daysInCurrentMonth,
      firstDay,
      prevMonth,
      prevMonthYear,
      nextMonth,
      nextMonthYear,
      daysInPrevMonth,
    } = calendarData;

    // Prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateKey = formatDate(prevMonthYear, prevMonth, d);
      const evs = eventsByDate[dateKey] || [];
      days.push(
        <DayCell
          key={`prev-${d}`}
          day={d}
          date={new Date(dateKey)}
          dayEvents={evs}
          isToday={false}
          isCurrentMonth={false}
          eventsToShow={eventsToShow}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
          renderEvent={(ev, onClick) => (
            <EventItem label={ev.event_name ?? ''} event={ev} onClick={onClick} />
          )}
          renderMoreEvents={(cnt, onClick) => (
            <MoreEventsIndicator count={cnt} onClick={onClick} />
          )}
        />
      );
    }

    // Current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateKey = formatDate(currentYear, currentMonth, d);
      const evs = eventsByDate[dateKey] || [];
      const isToday = dateKey === todayString;
      days.push(
        <DayCell
          key={d}
          day={d}
          date={new Date(dateKey)}
          dayEvents={evs}
          isToday={isToday}
          isCurrentMonth
          eventsToShow={eventsToShow}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
          renderEvent={(ev, onClick) => (
            <EventItem label={ev.event_name??""} event={ev} onClick={onClick} />
          )}
          renderMoreEvents={(cnt, onClick) => (
            <MoreEventsIndicator count={cnt} onClick={onClick} />
          )}
        />
      );
    }

    // Next month
    const nextCount = (7 - ((firstDay + daysInCurrentMonth) % 7)) % 7;
    for (let d = 1; d <= nextCount; d++) {
      const dateKey = formatDate(nextMonthYear, nextMonth, d);
      const evs = eventsByDate[dateKey] || [];
      days.push(
        <DayCell
          key={`next-${d}`}
          day={d}
          date={new Date(dateKey)}
          dayEvents={evs}
          isToday={false}
          isCurrentMonth={false}
          eventsToShow={eventsToShow}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
          renderEvent={(ev, onClick) => (
            <EventItem label={ev.event_name??""} event={ev} onClick={onClick} />
          )}
          renderMoreEvents={(cnt, onClick) => (
            <MoreEventsIndicator count={cnt} onClick={onClick} />
          )}
        />
      );
    }

    return days;
  }, [
    calendarData,
    eventsByDate,
    eventsToShow,
    todayString,
    handleEventClick,
    handleDayClick,
  ]);

  return (
    <div {...props} className="rounded-xl">
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
              onClick={() => setCurrentView(value as (typeof VIEW_TYPES)[keyof typeof VIEW_TYPES])}
            >
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {currentView === VIEW_TYPES.MONTH && (
        <div className="bg-white shadow-lg rounded-xl grid grid-cols-7 gap-[0.5px] hideScrollbar overflow-y-auto">
          {DAYS_OF_WEEK_SHORT.map((day, i) => (
            <div
              key={i}
              className="border border-[#dcdcdc] p-2 bg-gray-100 text-center text-primary font-bold"
            >
              {day}
            </div>
          ))}
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

      {/* Day Modal */}
      <EnhancedModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        triggerElement={dayModalTrigger}
        modalRef={modalRef}
        dimensions={{
          width: 320,
          height: Math.min(400, selectedDayEvents.length * 60 + 100),
        }}
      >
        <div className="bg-white p-6 min-w-[300px]">
          <h2 className="text-lg font-bold text-center mb-4">Events</h2>
          <ul className="space-y-2 max-h-[300px] overflow-y-auto">
            {selectedDayEvents.map((ev) => (
              <li key={ev.id}>
                <div
                  className="flex text-sm gap-2 cursor-pointer hover:text-primary items-center p-2 rounded hover:bg-gray-50 transition-colors"
                  onClick={(e) => handleEventClick(e, ev)}
                >
                  <div className="h-3 w-3 border rounded-full border-primary bg-primary flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{ev.event_name}</div>
                    <div className="text-xs text-gray-500">
                      {formatTime(ev.start_time)} - {formatTime(ev.end_time)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </EnhancedModal>

      {/* Event Modal */}
      <EnhancedModal
        isOpen={eventModalOpen}
        onClose={handleCloseEventModal}
        triggerElement={eventModalTrigger}
        modalRef={eventModalRef}
        dimensions={{ width: 350, height: 400 }}
      >
        {selectedEvent! && (
          <EventDetailsModal
            event={selectedEvent!}
            isOpen
            onClose={handleCloseEventModal}
            modalRef={eventModalRef}
            onNavigate={handleNavigation}
            calendarView
            onDelete={onDelete}
            onShowOptions={onShowOptions}
            showOptions={showOptions}
          />
        )}
      </EnhancedModal>
    </div>
  );
};

export default Calendar;
