import React from 'react';
import { CalendarEvent } from '../utils/CalendaHelpers';

interface Event {
  id: string;
  event_name?: string;
  [key: string]: unknown; // Allows for any additional event properties
}

interface DayCellProps {
  day: number;
  date?: Date;
  dayEvents: Event[];
  isToday: boolean;
  isCurrentMonth: boolean;
  eventsToShow?: number;
  onEventClick: (e: React.MouseEvent<HTMLElement>, event: CalendarEvent) => void;
  onDayClick?: (e: React.MouseEvent<HTMLElement>, dayEvents: CalendarEvent[]) => void;
  className?: string;
  style?: React.CSSProperties;
  renderDay?: (day: number, isToday: boolean) => React.ReactNode;
  renderEvent?: (event: Event, onClick: (e: React.MouseEvent) => void) => React.ReactNode;
  renderMoreEvents?: (count: number, onClick: (e: React.MouseEvent) => void) => React.ReactNode;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  date,
  dayEvents = [],
  isToday,
  isCurrentMonth,
  eventsToShow = 2,
  onEventClick,
  onDayClick,
  className = '',
  style = { height: '15vh' },
  renderDay,
  renderEvent,
  renderMoreEvents,
}) => {
  const visibleEvents = dayEvents.slice(0, eventsToShow);
  const remainingEventsCount = Math.max(dayEvents.length - eventsToShow, 0);

  const handleEventClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    onEventClick?.(e, event);
  };

  const handleDayClick = (e: React.MouseEvent) => {
    onDayClick?.(e, dayEvents);
  };

  const defaultRenderDay = () => (
    isToday ? (
      <div className="h-6 w-6 border rounded-full border-primary flex items-center justify-center text-primary">
        {day}
      </div>
    ) : (
      <span>{day}</span>
    )
  );

  const defaultRenderEvent = (event: Event, onClick: (e: React.MouseEvent) => void) => (
    <div 
      key={event.id} 
      onClick={onClick}
      className="text-sm truncate my-1 p-1 bg-gray-100 rounded"
    >
      {event.event_name}
    </div>
  );

  const defaultRenderMoreEvents = (count: number, onClick: (e: React.MouseEvent) => void) => (
    <div 
      onClick={onClick}
      className="text-xs text-gray-500 mt-1"
    >
      +{count} more
    </div>
  );

  return (
    <div
      className={`border border-[#dcdcdc] p-2 overflow-hidden ${
        isCurrentMonth ? '' : 'text-[#dcdcdc]'
      } ${isToday ? 'relative' : ''} ${className}`}
      style={{ cursor: 'pointer', ...style }}
      onClick={handleDayClick}
    >
      {renderDay ? renderDay(day, isToday) : defaultRenderDay()}
      
      {visibleEvents.map((event) => (
        renderEvent 
          ? renderEvent(event, (e) => handleEventClick(e, event))
          : defaultRenderEvent(event, (e) => handleEventClick(e, event))
      ))}
      
      {remainingEventsCount > 0 && (
        renderMoreEvents
          ? renderMoreEvents(remainingEventsCount, handleDayClick)
          : defaultRenderMoreEvents(remainingEventsCount, handleDayClick)
      )}
    </div>
  );
};

export default DayCell;