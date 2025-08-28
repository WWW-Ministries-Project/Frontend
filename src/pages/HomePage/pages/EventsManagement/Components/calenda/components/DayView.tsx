import React, { useMemo } from 'react'
import {
  calculateEventPosition,
  resolveEventOverlaps,
  formatTime,
  DAYS_OF_WEEK,
  MONTHS,
} from '../utils/CalendaHelpers'

export interface EventData {
  id: string
  event_name: string
  start_time: string
  end_time: string
  description?: string
}

export interface DayViewProps {
  /** Date to display */
  currentDate: Date
  /** Map of ISO date string (YYYY-MM-DD) to events on that day */
  eventsByDate: Record<string, EventData[]>
  /** Click handler for an event */
  onEventClick: (e: React.MouseEvent, event: EventData) => void
  /** ISO date string for today (YYYY-MM-DD) to highlight header */
  todayString: string
  /** Height of each hourly slot in pixels */
  slotHeight?: number
  /** Fixed width of the time column in pixels */
  timeColumnWidth?: number
  /** Additional wrapper classes */
  className?: string
}

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  eventsByDate,
  onEventClick,
  todayString,
  slotHeight = 80,
  timeColumnWidth = 96,
  className = '',
}) => {
  const isoDate = currentDate.toISOString().split('T')[0]
  const dayEvents = eventsByDate[isoDate] || []
  const isToday = isoDate === todayString

  // Generate hourly slots
  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`)
  }, [])

  // Compute positions and resolve overlaps
  const positionedEvents = useMemo(() => {
    const valid = dayEvents
      .filter(e => e.start_time && e.end_time)
      .map(e => ({
        ...e,
        ...calculateEventPosition(e.start_time, e.end_time, slotHeight),
      }))
    return resolveEventOverlaps(valid)
  }, [dayEvents, slotHeight])

  return (
    <div className={`bg-white shadow-lg rounded-xl overflow-hidden ${className}`}>      
      {/* Header */}
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

      {/* Timeline */}
      <div className="max-h-[70vh] overflow-y-auto relative">
        {timeSlots.map(time => (
          <div
            key={time}
            className="flex border-b relative"
            style={{ height: `${slotHeight}px` }}
          >
            <div
              className="flex-shrink-0 w-[96px] p-4 text-sm text-gray-500 border-r bg-gray-50 flex items-center"
              style={{ width: `${timeColumnWidth}px` }}
            >
              {formatTime(time)}
            </div>
            <div className="flex-1 hover:bg-gray-50 relative" />
          </div>
        ))}

        {/* Events */}
        <div className="absolute inset-0" style={{ left: `${timeColumnWidth}px` }}>
          {positionedEvents.map((evt, idx) => (
            <div
              key={`evt-${evt.id}-${idx}`}
              className="absolute"
              style={{
                left: `${evt.overlapGroup.left}%`,                
                width: `${evt.overlapGroup.width}%`,                
                top: `${evt.startHour * slotHeight + evt.top}px`,                
                height: `${evt.height}px`,                
                zIndex: 20 + evt.overlapGroup.index,
                paddingLeft: evt.overlapGroup.index > 0 ? '4px' : '0',
                paddingRight: evt.overlapGroup.index < evt.overlapGroup.size - 1 ? '4px' : '0',
              }}
            >
              <div
                className={`h-full w-full bg-primary text-white p-3 rounded-lg cursor-pointer hover:bg-opacity-80 transition-colors overflow-hidden
                  ${evt.overlapGroup.size > 1 ? 'border border-white' : ''}`}
                onClick={e => onEventClick(e, evt)}
                title={`${evt.event_name} (${formatTime(evt.start_time)} - ${formatTime(evt.end_time)})`}
              >
                <div className="font-medium truncate">{evt.event_name}</div>
                <div className="text-sm opacity-90 mt-1 truncate">
                  {formatTime(evt.start_time)} - {formatTime(evt.end_time)}
                </div>
                {evt.height > 60 && evt.description && (
                  <div className="text-sm opacity-80 mt-2 line-clamp-2">
                    {evt.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DayView
