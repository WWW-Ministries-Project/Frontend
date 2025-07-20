export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];



export const BREAKPOINTS = {
  sm: 600,
  md: 900,
  lg: 1600,
  xl: 1900
};

export const VIEW_TYPES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
};

// Utility functions
export const getEventsToShow = (width) => {
  if (width < BREAKPOINTS.sm) return 1;
  if (width < BREAKPOINTS.md) return 2;
  if (width < BREAKPOINTS.lg) return 3;
  if (width < BREAKPOINTS.xl) return 3;
  return 4;
};

export const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
export const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

export const formatDate = (year, month, day) => 
  new Date(year, month, day).toISOString().split('T')[0];

export const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const getWeekDates = (date) => {
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

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

export const calculateEventPosition = (startTime, endTime, slotHeight = 60) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  
  const startHour = Math.floor(startMinutes / 60);
  const startMinutesInHour = startMinutes % 60;
  const duration = endMinutes - startMinutes;
  
  const top = (startMinutesInHour / 60) * slotHeight;
  const height = Math.max((duration / 60) * slotHeight, 20); // Minimum 20px height
  
  return { top, height, startHour };
};

// Function to detect and resolve overlapping events
export const resolveEventOverlaps = (events) => {
  if (!events.length) return [];
  
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)
  );
  
  // Group overlapping events
  const eventGroups = [];
  let currentGroup = [sortedEvents[0]];
  
  for (let i = 1; i < sortedEvents.length; i++) {
    const currentEvent = sortedEvents[i];
    const lastEventInGroup = currentGroup[currentGroup.length - 1];
    
    // Check if current event overlaps with any event in the current group
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
  const eventsWithPositions = [];
  
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
};

// Helper function to check if two events overlap
export const eventsOverlap = (event1, event2) => {
  const start1 = parseTimeToMinutes(event1.start_time);
  const end1 = parseTimeToMinutes(event1.end_time);
  const start2 = parseTimeToMinutes(event2.start_time);
  const end2 = parseTimeToMinutes(event2.end_time);
  
  return start1 < end2 && start2 < end1;
};