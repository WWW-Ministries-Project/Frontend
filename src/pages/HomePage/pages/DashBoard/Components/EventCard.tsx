import { useState } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

// Event interface
interface Event {
  id?: string | number;
  event_name?: string;
  description?: string;
  poster?: string;
  start_date: string | Date;
  end_date?: string | Date;
  start_time?: string;
  end_time?: string;
  location?: string;
}

// Component props interface
interface EventCardProps {
  event: Event;
  handleNavigation?: (id: string | number) => void;
  formatDatefull?: (date: string | Date) => string;
  formatTime?: (time: string) => string;
}

// Calendar URL types
interface CalendarUrls {
  google: string;
  outlook: string;
  yahoo: string;
  ics: string;
}

type CalendarType = 'google' | 'outlook' | 'yahoo' | 'ics';

const EventCard: React.FC<EventCardProps> = ({
  event,
  handleNavigation = () => {},
  formatDatefull = (date) => new Date(date).toLocaleDateString(),
  formatTime = (time) => time
}) => {
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  const formatCalendarDate = (date: string | Date, time?: string): string => {
    if (!date) return '';
    const eventDate = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':');
      eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }
    // YYYYMMDDTHHMMSSZ
    return eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const getEndDate = (): string => {
    if (event.end_time) {
      return formatCalendarDate(event.start_date, event.end_time);
    }
    const startDate = new Date(event.start_date);
    if (event.start_time) {
      const [hours, minutes] = event.start_time.split(':');
      startDate.setHours(parseInt(hours, 10) + 2, parseInt(minutes, 10), 0, 0);
    } else {
      startDate.setHours(startDate.getHours() + 2);
    }
    return startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const generateICSFile = (): string => {
    const startDate = formatCalendarDate(event.start_date, event.start_time);
    const endDate = getEndDate();
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Your App//Event//EN',
      'BEGIN:VEVENT',
      `UID:${event.id || Math.random().toString(36)}@yourapp.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.event_name || 'Event'}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsLines.join('\r\n'))}`;
  };

  const generateCalendarUrls = (): CalendarUrls => {
    const startDate = formatCalendarDate(event.start_date, event.start_time);
    const endDate = getEndDate();
    const title = encodeURIComponent(event.event_name || 'Event');
    const description = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || '');

    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${description}&location=${location}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDate}&enddt=${endDate}&body=${description}&location=${location}`,
      yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${startDate}&et=${endDate}&desc=${description}&in_loc=${location}`,
      ics: generateICSFile()
    };
  };

  const handleCalendarClick = (type: CalendarType): void => {
    const urls = generateCalendarUrls();
    if (type === 'ics') {
      const link = document.createElement('a');
      link.href = urls.ics;
      link.download = `${event.event_name || 'event'}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(urls[type], '_blank', 'noopener,noreferrer');
    }
    setShowCalendarOptions(false);
  };

  return (
    <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 p-4 space-y-4">
      {event.poster && (
        <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 relative overflow-hidden rounded-lg">
          <img
            src={event.poster}
            alt={event.event_name || 'Event'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-gray-900">
            {event.event_name || 'Brainstorming session'}
          </h3>
          {event.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              {formatDatefull(event.start_date)}
            </span>
          </div>
          <div className="text-gray-600">|</div>
          {(event.start_time || event.end_time) && (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
                {' (GMT)'}
              </span>
            </div>
          )}
        </div>

        {event.location && (
          <div className="flex items-center gap-2 mb-4">
            <MapPinIcon className="h-4 text-gray-600" />
            <span className="text-sm text-gray-600">{event.location}</span>
          </div>
        )}

        {/* <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => event.id && handleNavigation(event.id)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            disabled={!event.id}
          >
            View Details
          </button>

          <div className="relative">
            <button
              onClick={() => setShowCalendarOptions(!showCalendarOptions)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <CalendarIcon className="h-4 w-4" />
              Add to Calendar
              <ChevronDownIcon className="h-3 w-3" />
            </button>

            {showCalendarOptions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCalendarOptions(false)}
                />

                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[9998]">
                  <div className="py-1">
                    <button
                      onClick={() => handleCalendarClick('google')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <span className="text-blue-600">📅</span>
                      Google Calendar
                    </button>
                    <button
                      onClick={() => handleCalendarClick('outlook')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <span className="text-blue-500">📅</span>
                      Outlook Calendar
                    </button>
                    <button
                      onClick={() => handleCalendarClick('yahoo')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <span className="text-purple-600">📅</span>
                      Yahoo Calendar
                    </button>
                    <button
                      onClick={() => handleCalendarClick('ics')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <span className="text-gray-600">📄</span>
                      Download (.ics)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default EventCard;