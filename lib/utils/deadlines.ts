import { subDays, parseISO, format, differenceInCalendarDays, isValid } from 'date-fns';
import { DatabaseEvent, EventDeadlines, EnrichedEvent, AwarenessEvent } from '@/types/database.types';

// Reference date for the 2026 Fall cycle (August 11, 2026 by default)
export const DEFAULT_CURRENT_DATE = '2026-08-11';

export function calculateEventDeadlines(
  eventDateStr: string,
  currentDateStr: string = DEFAULT_CURRENT_DATE
): EventDeadlines {
  const eventDate = parseISO(eventDateStr);
  const currentDate = parseISO(currentDateStr);

  if (!isValid(eventDate) || !isValid(currentDate)) {
    return {
      eightWeekDate: '',
      eightWeekFormatted: '',
      isEightWeekUrgent: false,
      isEightWeekPast: false,
      sixWeekDate: '',
      sixWeekFormatted: '',
      isSixWeekUrgent: false,
      isSixWeekPast: false,
      daysUntilEvent: 0,
      daysUntilSixWeek: 0,
      daysUntilEightWeek: 0,
    };
  }

  // 8-week mark: 56 days before event
  const eightWeekDate = subDays(eventDate, 56);
  // 6-week mark: 42 days before event
  const sixWeekDate = subDays(eventDate, 42);

  const daysUntilEvent = differenceInCalendarDays(eventDate, currentDate);
  const daysUntilEightWeek = differenceInCalendarDays(eightWeekDate, currentDate);
  const daysUntilSixWeek = differenceInCalendarDays(sixWeekDate, currentDate);

  const isEightWeekPast = daysUntilEightWeek < 0;
  // Urgent if within 7 days of 8-week mark (or up to 7 days overdue)
  const isEightWeekUrgent = Math.abs(daysUntilEightWeek) <= 7 || (isEightWeekPast && daysUntilSixWeek > 7);

  const isSixWeekPast = daysUntilSixWeek < 0;
  // Urgent if within 7 days of 6-week mark
  const isSixWeekUrgent = Math.abs(daysUntilSixWeek) <= 7 || (isSixWeekPast && daysUntilEvent > 0);

  let urgencyLabel: string | undefined = undefined;
  if (isSixWeekUrgent) {
    urgencyLabel = '6 week warning';
  } else if (isEightWeekUrgent) {
    urgencyLabel = '8 week warning';
  }

  return {
    eightWeekDate: format(eightWeekDate, 'yyyy-MM-dd'),
    eightWeekFormatted: format(eightWeekDate, 'MMM d, yyyy'),
    isEightWeekUrgent,
    isEightWeekPast,
    sixWeekDate: format(sixWeekDate, 'yyyy-MM-dd'),
    sixWeekFormatted: format(sixWeekDate, 'MMM d, yyyy'),
    isSixWeekUrgent,
    isSixWeekPast,
    daysUntilEvent,
    daysUntilSixWeek,
    daysUntilEightWeek,
    urgencyLabel,
  };
}

export function enrichEvent(
  event: DatabaseEvent,
  awarenessEvents: AwarenessEvent[] = [],
  currentDateStr: string = DEFAULT_CURRENT_DATE
): EnrichedEvent {
  const deadlines = calculateEventDeadlines(event.event_date, currentDateStr);

  const co_hosts_list: string[] = Array.isArray(event.co_hosts)
    ? event.co_hosts
    : typeof event.co_hosts === 'string' && event.co_hosts.length > 0
    ? event.co_hosts.split(',').map((h) => h.trim())
    : [];

  // Find overlapping conflicts
  const conflicts = awarenessEvents.filter((awareness) => {
    const evtDate = event.event_date;
    return evtDate >= awareness.start_date && evtDate <= awareness.end_date;
  });

  return {
    ...event,
    deadlines,
    conflicts,
    co_hosts_list,
  };
}
