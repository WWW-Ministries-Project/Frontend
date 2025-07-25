import { calculateEventPosition, formatTime } from "../utils/CalendaHelpers";

// Event components
export const EventItem = ({ event, onClick, showTime = true, className = "" }) => (
  <div 
    className={`flex text-xs gap-1 my-1 items-center cursor-pointer hover:opacity-80 ${className}`}
    onClick={onClick}
  >
    <div className="h-2 w-2 border rounded-full border-primary bg-primary flex-shrink-0" />
    {showTime && <span className="text-gray-600">{event.start_time}</span>}
    <span className="truncate">{event.name}</span>
  </div>
);

export const TimeSlotEvent = ({ event, onClick }) => (
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

// Enhanced TimeSlotEvent component that spans duration
export const SpanningTimeSlotEvent = ({ event, onClick, slotHeight = 60 }) => {
    const { top, height } = calculateEventPosition(event.start_time, event.end_time, slotHeight);
  
  return (
    <div
      className="absolute left-1 right-1 bg-primary text-white text-xs p-1 rounded cursor-pointer hover:bg-opacity-80 transition-colors z-10 overflow-hidden"
      style={{ 
        top: `${top}px`, 
        height: `${height}px`,
        minHeight: '20px'
      }}
      onClick={onClick}
    >
      <div className="font-medium truncate">{event.name}</div>
      <div className="text-xs opacity-90 truncate">
        {formatTime(event.start_time)} - {formatTime(event.end_time)}
      </div>
      {height > 40 && event.description && (
        <div className="text-xs opacity-80 mt-1 line-clamp-2">
          {event.description}
        </div>
      )}
    </div>
  );
};



// Day cell component for month view
