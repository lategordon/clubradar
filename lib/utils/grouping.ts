import { parseISO, getQuarter, getYear, format } from 'date-fns';
import { EnrichedEvent, AwarenessEvent } from '@/types/database.types';

export interface MonthGroup {
  monthKey: string; // e.g. "2026-10"
  monthTitle: string; // e.g. "OCTOBER 2026"
  monthShort: string; // e.g. "Oct"
  communityEvents: AwarenessEvent[];
  alumniEvents: EnrichedEvent[];
  cityContextEvents: AwarenessEvent[];
}

export interface QuarterGroup {
  quarterKey: string; // e.g. "2026-Q4"
  quarterTitle: string; // e.g. "Q4 2026 (OCT - DEC)"
  year: number;
  quarterNum: number;
  months: MonthGroup[];
}

export function getQuarterRangeLabel(quarterNum: number): string {
  switch (quarterNum) {
    case 1:
      return 'JAN - MAR';
    case 2:
      return 'APR - JUN';
    case 3:
      return 'JUL - SEP';
    case 4:
      return 'OCT - DEC';
    default:
      return '';
  }
}

export function groupEventsByQuarter(
  events: EnrichedEvent[],
  awarenessEvents: AwarenessEvent[]
): QuarterGroup[] {
  // Collect all distinct dates to discover relevant quarters and months
  const dateSet = new Set<string>();

  events.forEach((e) => {
    if (e.event_date) dateSet.add(e.event_date.substring(0, 7)); // "YYYY-MM"
  });

  awarenessEvents.forEach((a) => {
    if (a.start_date) dateSet.add(a.start_date.substring(0, 7));
    if (a.end_date) dateSet.add(a.end_date.substring(0, 7));
  });

  // Ensure default Q4 2026 and Q1 2027 exist
  ['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03'].forEach((m) =>
    dateSet.add(m)
  );

  const sortedMonthKeys = Array.from(dateSet).sort();

  const quarterMap = new Map<string, QuarterGroup>();

  sortedMonthKeys.forEach((monthKey) => {
    const [yearStr, monthNumStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10); // 1-12
    const sampleDate = parseISO(`${monthKey}-01`);

    const qNum = getQuarter(sampleDate);
    const qKey = `${year}-Q${qNum}`;

    if (!quarterMap.has(qKey)) {
      quarterMap.set(qKey, {
        quarterKey: qKey,
        quarterTitle: `Q${qNum} ${year} (${getQuarterRangeLabel(qNum)})`,
        year,
        quarterNum: qNum,
        months: [],
      });
    }

    const monthTitle = format(sampleDate, 'MMMM yyyy').toUpperCase();
    const monthShort = format(sampleDate, 'MMM');

    // Filter items belonging to this month
    const matchingAlumni = events
      .filter((e) => e.event_date.startsWith(monthKey))
      .sort((a, b) => a.event_date.localeCompare(b.event_date));

    const matchingCommunity = awarenessEvents
      .filter(
        (a) =>
          a.category === 'Community / Conference' &&
          (a.start_date.startsWith(monthKey) || a.end_date.startsWith(monthKey))
      )
      .sort((a, b) => a.start_date.localeCompare(b.start_date));

    const matchingCityContext = awarenessEvents
      .filter(
        (a) =>
          a.category !== 'Community / Conference' &&
          (a.start_date.startsWith(monthKey) || a.end_date.startsWith(monthKey))
      )
      .sort((a, b) => a.start_date.localeCompare(b.start_date));

    // Only add if there are events or if it's in the primary range
    quarterMap.get(qKey)!.months.push({
      monthKey,
      monthTitle,
      monthShort,
      communityEvents: matchingCommunity,
      alumniEvents: matchingAlumni,
      cityContextEvents: matchingCityContext,
    });
  });

  return Array.from(quarterMap.values()).sort((a, b) =>
    a.quarterKey.localeCompare(b.quarterKey)
  );
}
