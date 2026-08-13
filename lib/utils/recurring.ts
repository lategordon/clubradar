import { parseISO, format, addMonths, addWeeks, setDate, getDay, addDays, startOfMonth } from 'date-fns';

export type RecurrencePattern = 'monthly_first_friday' | 'monthly' | 'biweekly' | 'quarterly';

/**
 * Finds the first Friday of a given month
 */
export function getFirstFridayOfMonth(year: number, monthZeroIndexed: number): Date {
  let date = new Date(year, monthZeroIndexed, 1);
  // Day of week: 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  while (date.getDay() !== 5) {
    date = addDays(date, 1);
  }
  return date;
}

/**
 * Calculates the next recurring date based on pattern
 */
export function calculateNextOccurrence(
  startDateStr: string,
  pattern: RecurrencePattern,
  iterationIndex: number = 1
): string {
  const baseDate = parseISO(startDateStr);

  switch (pattern) {
    case 'monthly_first_friday': {
      const targetMonthDate = addMonths(baseDate, iterationIndex);
      const firstFriday = getFirstFridayOfMonth(
        targetMonthDate.getFullYear(),
        targetMonthDate.getMonth()
      );
      return format(firstFriday, 'yyyy-MM-dd');
    }

    case 'monthly': {
      const nextMonth = addMonths(baseDate, iterationIndex);
      return format(nextMonth, 'yyyy-MM-dd');
    }

    case 'biweekly': {
      const nextDate = addWeeks(baseDate, 2 * iterationIndex);
      return format(nextDate, 'yyyy-MM-dd');
    }

    case 'quarterly': {
      const nextDate = addMonths(baseDate, 3 * iterationIndex);
      return format(nextDate, 'yyyy-MM-dd');
    }

    default:
      return startDateStr;
  }
}

/**
 * Generates an array of upcoming recurring dates
 */
export function generateRecurringDates(
  startDateStr: string,
  pattern: RecurrencePattern,
  count: number = 3
): string[] {
  const dates: string[] = [startDateStr];
  for (let i = 1; i <= count; i++) {
    dates.push(calculateNextOccurrence(startDateStr, pattern, i));
  }
  return dates;
}
