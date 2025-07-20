import React from 'react';

export interface Event {
  start_date?: string;
  // add other event properties as needed
}

export interface EventItemProps {
  event: Event;
  /** The label to display (e.g. event.name) */
  label: string;
  /** The time to display (e.g. event.start_time) */
  time?: string;
  /** Whether to show the time */
  showTime?: boolean;
  /** Click handler for the entire item */
  onClick?: () => void;
  /** Additional classes to apply to the wrapper */
  className?: string;
  /** Tailwind classes for the little marker dot */
  markerClassName?: string;
}

const EventItem: React.FC<EventItemProps> = ({
  event,
  label,
  time = "",
  showTime = true,
  onClick,
  className = "",
  markerClassName = "h-2 w-2 border rounded-full border-primary bg-primary flex-shrink-0 items-center",
}) => {
  return (
    <div
      className={`
        flex items-center gap-2 text-sm truncate my-1 p-1 bg-gray-100 rounded
        cursor-pointer hover:opacity-80
        ${className}
      `}
      onClick={onClick}
    >
      <div className={markerClassName} />
      {showTime && time && (
        <span className="text-gray-600">{event.start_date}</span>
      )}
      <span className="truncate">{label}</span>
    </div>
  );
};

export default EventItem;
