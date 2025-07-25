import React, { useMemo } from 'react'
import { calculateEventPosition, DAYS_OF_WEEK_SHORT, formatTime, getWeekDates, resolveEventOverlaps } from '../utils/CalendaHelpers'


export interface EventData {
  id: string
  event_name: string
  start_time: string
  end_time: string
  description?: string
}

export interface WeekViewProps {
  /** Date used to compute the week range */
  currentDate: Date
  /** Map of ISO date string (YYYY-MM-DD) to events occurring that day */
  eventsByDate: Record<string, EventData[]>
  /** Handler when a time-slot with events is clicked */
  onDayClick: (e: React.MouseEvent<HTMLElement>, events: EventData[]) => void
  /** Handler when an individual event is clicked */
  onEventClick: (e: React.MouseEvent<HTMLElement>, event: EventData) => void;
  /** ISO date string for today (YYYY-MM-DD) for highlighting */
  todayString: string
  /** Height of each hourly slot in pixels (default: 60) */
  slotHeight?: number
  /** Extra container classes */
  className?: string
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  eventsByDate,
  onDayClick,
  onEventClick,
  todayString,
  slotHeight = 60,
  className = '',
}) => {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])

  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => `${hour.toString().padStart(2, '0')}:00`)
  }, [])

  const eventsWithPositions = useMemo(() => {
    const positioned: Record<string, ReturnType<typeof resolveEventOverlaps>> = {}

    weekDates.forEach((date, dayIndex) => {
      const iso = date.toISOString().split('T')[0]
      const dayEvents = eventsByDate[iso] || []

      const validPositions = dayEvents
        .filter(e => e.start_time && e.end_time)
        .map(e => ({
          ...e,
          ...calculateEventPosition(e.start_time, e.end_time, slotHeight),
        }))

      positioned[iso] = resolveEventOverlaps(validPositions)
    })

    return positioned
  }, [weekDates, eventsByDate, slotHeight])

  return (
    <div className={`bg-white shadow-lg rounded-xl overflow-hidden ${className}`}>      
      {/* Header row: empty corner + weekdays */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-4 border-r bg-gray-50" />
        {weekDates.map((date, idx) => {
          const iso = date.toISOString().split('T')[0]
          const isToday = iso === todayString
          return (
            <div
              key={iso}
              className={`p-4 text-center border-r ${
                isToday ? 'bg-primary text-white' : 'bg-gray-50'
              }`}
            >
              <div className="font-medium">{DAYS_OF_WEEK_SHORT[idx]}</div>
              <div className={`${isToday ? 'font-bold text-lg' : 'text-lg'}`}>
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid + events */}
      <div className="max-h-[70vh] overflow-y-auto relative">
        {/* Time slots and day-clickable cells */}
        {timeSlots.map((slot) => (
          <div
            key={slot}
            className="grid grid-cols-8 border-b"
            style={{ height: `${slotHeight}px` }}
          >
            <div className="p-2 text-xs text-gray-500 border-r bg-gray-50 flex items-center">
              {formatTime(slot)}
            </div>
            {weekDates.map((date) => {
              const iso = date.toISOString().split('T')[0]
              const dayEvents = eventsByDate[iso] || []
              return (
                <div
                  key={`${iso}-${slot}`}
                  className="border-r hover:bg-gray-50 cursor-pointer"
                  style={{ height: `${slotHeight}px` }}
                  onClick={(e) => dayEvents.length && onDayClick(e, dayEvents)}
                />
              )
            })}
          </div>
        ))}

        {/* Positioned events */}
        {weekDates.map((date, dayIdx) => {
          const iso = date.toISOString().split('T')[0]
          const positioned = eventsWithPositions[iso] || []

          return positioned.map((evt, idx) => {
            const colPct = 100 / 8
            const widthPct = (colPct * evt.overlapGroup.width) / 100
            const leftPct = ((dayIdx + 1) / 8) * 100 +
              (colPct * evt.overlapGroup.left) / 100

            return (
              <div
                key={`evt-${evt.id}-${idx}`}
                className="absolute"
                style={{
                  left: `${leftPct}%`,                
                  width: `${widthPct}%`,                
                  top: `${evt.startHour * slotHeight + evt.top}px`,                
                  height: `${evt.height}px`,                
                  zIndex: 20 + evt.overlapGroup.index,
                }}
              >
                <div
                  className={`mx-1 h-full bg-primary text-white text-xs p-1 rounded cursor-pointer hover:bg-opacity-80 transition-colors overflow-hidden
                    ${evt.overlapGroup.size > 1 ? 'border border-white' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(e, evt)
                  }}
                  title={`${evt.event_name} (${formatTime(evt.start_time)} - ${formatTime(evt.end_time)})`}
                >
                  <div className="font-medium truncate">{evt.event_name}</div>
                  {evt.height > 30 && (
                    <div className="text-xs opacity-90 truncate">
                      {formatTime(evt.start_time)} - {formatTime(evt.end_time)}
                    </div>
                  )}
                  {evt.height > 50 && evt.description && (
                    <div className="text-xs opacity-80 mt-1 line-clamp-2">
                      {evt.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        })}
      </div>
    </div>
  )
}

export default WeekView
