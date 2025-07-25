export const MONTHS: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_OF_WEEK: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_OF_WEEK_SHORT: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const BREAKPOINTS: { sm: number; md: number; lg: number; xl: number } = {
  sm: 600,
  md: 900,
  lg: 1600,
  xl: 1900
};

export const VIEW_TYPES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
} as const;

export type ViewType = typeof VIEW_TYPES[keyof typeof VIEW_TYPES];

export function getEventsToShow(width: number): number {
  if (width < BREAKPOINTS.sm) return 1;
  if (width < BREAKPOINTS.md) return 2;
  if (width < BREAKPOINTS.lg) return 3;
  if (width < BREAKPOINTS.xl) return 3;
  return 4;
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatDate(year: number, month: number, day: number): string {
  return new Date(year, month, day).toISOString().split('T')[0];
}

export function formatTime(timeString: string): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getWeekDates(date: Date): Date[] {
  const week: Date[] = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }

  return week;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export interface EventPosition {
  top: number;
  height: number;
  startHour: number;
}

export function calculateEventPosition(
  startTime: string,
  endTime: string,
  slotHeight = 60
): EventPosition {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  const startHour = Math.floor(startMinutes / 60);
  const startMinutesInHour = startMinutes % 60;
  const duration = endMinutes - startMinutes;

  const top = (startMinutesInHour / 60) * slotHeight;
  const height = Math.max((duration / 60) * slotHeight, 20); // Minimum 20px height

  return { top, height, startHour };
}

export interface CalendarEvent {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  [key: string]: unknown;
}

export interface OverlapGroup {
  size: number;
  index: number;
  width: number;
  left: number;
}

export type PositionedEvent = CalendarEvent & { overlapGroup: OverlapGroup };

export function resolveEventOverlaps(events: CalendarEvent[]): PositionedEvent[] {
  if (!events.length) return [];

  // Sort events by start time
  const sortedEvents = [...events].sort(
    (a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)
  );

  // Group overlapping events
  const eventGroups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [sortedEvents[0]];

  for (let i = 1; i < sortedEvents.length; i++) {
    const currentEvent = sortedEvents[i];
    const hasOverlap = currentGroup.some(groupEvent =>
      eventsOverlap(groupEvent, currentEvent)
    );

    if (hasOverlap) {
      currentGroup.push(currentEvent);
    } else {
      eventGroups.push(currentGroup);
      currentGroup = [currentEvent];
    }
  }
  eventGroups.push(currentGroup);

  // Calculate positions for each group
  const eventsWithPositions: PositionedEvent[] = [];

  eventGroups.forEach(group => {
    const groupSize = group.length;

    group.forEach((event, index) => {
      eventsWithPositions.push({
        ...event,
        overlapGroup: {
          size: groupSize,
          index: index,
          width: 100 / groupSize, // Percentage width
          left: (100 / groupSize) * index // Percentage left position
        }
      });
    });
  });

  return eventsWithPositions;
}

export function eventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
  const start1 = parseTimeToMinutes(event1.start_time);
  const end1 = parseTimeToMinutes(event1.end_time);
  const start2 = parseTimeToMinutes(event2.start_time);
  const end2 = parseTimeToMinutes(event2.end_time);

  return start1 < end2 && start2 < end1;
}

export interface ModalDimensions {
  width: number;
  height: number;
}

export type PreferredPosition = 'auto' | 'bottom' | 'top' | 'left' | 'right' | 'center';

export interface ModalOptions {
  preferredPosition?: PreferredPosition;
  offset?: number;
  avoidOverlap?: boolean;
  centerIfNoSpace?: boolean;
}

export function calculateDynamicModalPosition(
  triggerElement: HTMLElement,
  modalDimensions: ModalDimensions = { width: 300, height: 300 },
  options: ModalOptions = {}
): { top: string; left: string; placement: PreferredPosition } {
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

  const position = { top: 0, left: 0 };
  let placement: PreferredPosition = 'bottom';

  if (preferredPosition === 'auto') {
    const canFitBelow = spaceBelow >= modalDimensions.height + offset;
    const canFitAbove = spaceAbove >= modalDimensions.height + offset;
    const canFitRight = spaceRight >= modalDimensions.width + offset;
    const canFitLeft = spaceLeft >= modalDimensions.width + offset;

    // Choose position with most available space
    const maxVerticalSpace = Math.max(spaceAbove, spaceBelow);
    const maxHorizontalSpace = Math.max(spaceLeft, spaceRight);

    if (maxVerticalSpace >= modalDimensions.height + offset) {
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

      // Center horizontally
      position.left = triggerRect.left + (triggerRect.width - modalDimensions.width) / 2 + scrollX;
      position.left = Math.max(offset, Math.min(position.left, viewportWidth - modalDimensions.width - offset));

    } else if (maxHorizontalSpace >= modalDimensions.width + offset) {
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

      position.top = triggerRect.top + (triggerRect.height - modalDimensions.height) / 2 + scrollY;
      position.top = Math.max(offset, Math.min(position.top, viewportHeight - modalDimensions.height - offset));

    } else if (centerIfNoSpace) {
      position.top = Math.max(offset, (viewportHeight - modalDimensions.height) / 2) + scrollY;
      position.left = Math.max(offset, (viewportWidth - modalDimensions.width) / 2) + scrollX;
      placement = 'center';
    } else {
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
}

// export function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
//   let timeout: ReturnType<typeof setTimeout>;

//   return (...args: Parameters<T>): void => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => {
//       func(...args);
//     }, wait);
//   };
// }

// CalendaHelpers.ts

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait: number
) {
  let timeoutId: number | null = null;

  // the actual debounced function
  function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, wait);
  }

  // add a cancel method
  debounced.cancel = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}



