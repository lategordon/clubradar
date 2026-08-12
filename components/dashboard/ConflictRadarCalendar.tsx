'use client';

import React, { useState, useMemo } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isValid,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar as CalendarIcon,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { EnrichedEvent, AwarenessEvent } from '@/types/database.types';
import { DEFAULT_CURRENT_DATE } from '@/lib/utils/deadlines';
import { cn } from '@/lib/utils';

interface ConflictRadarCalendarProps {
  events: EnrichedEvent[];
  awarenessEvents: AwarenessEvent[];
  onSelectEvent: (event: EnrichedEvent) => void;
  onSelectAwareness?: (awareness: AwarenessEvent) => void;
}

export function ConflictRadarCalendar({
  events,
  awarenessEvents,
  onSelectEvent,
  onSelectAwareness,
}: ConflictRadarCalendarProps) {
  // Calendar month state: Defaults to October 2026 (Fall Launch Cycle)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => parseISO('2026-10-01'));
  const referenceCurrentDate = parseISO(DEFAULT_CURRENT_DATE);

  // Generate calendar grid for current selected month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Saturday

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonthDate]);

  // Group days into weeks
  const weeks = useMemo(() => {
    const weekChunks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weekChunks.push(calendarDays.slice(i, i + 7));
    }
    return weekChunks;
  }, [calendarDays]);

  // Helpers
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => addMonths(prev, 1));
  };

  const handleResetToOctober = () => {
    setCurrentMonthDate(parseISO('2026-10-01'));
  };

  // Helper for host initials
  const getAvatarBadge = (event: EnrichedEvent) => {
    if (event.primary_host.toLowerCase().includes('leighton')) {
      return 'L&A';
    }
    if (event.primary_host.toLowerCase().includes('janice')) {
      return 'J';
    }
    if (event.primary_host.toLowerCase().includes('tammy')) {
      return event.co_hosts_list.length > 0 ? 'T&B' : 'T';
    }
    return event.primary_host.substring(0, 2).toUpperCase();
  };

  const monthLabel = format(currentMonthDate, 'MMMM yyyy');

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Context & Conflicts
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Multi-day Awareness & Event Radar ({monthLabel})
          </p>
        </div>

        {/* Calendar Nav Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetToOctober}
            className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-semibold text-[#57068c] hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs"
            title="Reset to Q4 2026 Launch (Oct 2026)"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Oct 2026</span>
          </button>

          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs">
            {monthLabel}
          </div>

          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1 pt-3 pb-2 text-center text-xs font-bold text-slate-600 border-b border-slate-100">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Matrix View */}
      <div className="flex-1 min-h-[460px] space-y-1.5 pt-2">
        {weeks.map((week, weekIdx) => (
          <div key={`week-${weekIdx}`} className="grid grid-cols-7 gap-1.5 min-h-[85px]">
            {week.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrMonth = isSameMonth(day, currentMonthDate);
              const isTodayDate = isValid(referenceCurrentDate) && isSameDay(day, referenceCurrentDate);

              // Find alumni events on this date
              const dayEvents = events.filter((e) => e.event_date === dateStr);

              // Find awareness events active on this date
              const dayAwareness = awarenessEvents.filter(
                (a) => dateStr >= a.start_date && dateStr <= a.end_date
              );

              // Check for conflicts: alumni event present + awareness event present
              const hasConflict =
                dayEvents.length > 0 &&
                dayAwareness.some(
                  (a) =>
                    a.category.includes('Conference') ||
                    a.category.includes('Community') ||
                    a.is_multi_day
                );

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'relative rounded-lg border p-1 flex flex-col justify-between transition-all text-xs',
                    isCurrMonth
                      ? 'border-slate-200 bg-white hover:border-purple-300'
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60',
                    isTodayDate && 'ring-2 ring-purple-500 bg-purple-50/30 font-bold',
                    hasConflict && 'border-red-300 bg-red-50/40'
                  )}
                >
                  {/* Top Day Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-[11px] font-bold',
                        isCurrMonth ? 'text-slate-800' : 'text-slate-400',
                        isTodayDate && 'text-[#57068c] font-black'
                      )}
                    >
                      {format(day, 'd')}
                      {isTodayDate && <span className="ml-1 text-[9px] font-bold text-purple-700">(Today)</span>}
                    </span>

                    {/* Conflict Badge */}
                    {hasConflict && (
                      <span className="rounded bg-red-600 px-1 text-[8px] font-black text-white tracking-wider animate-pulse shadow-2xs">
                        CONFLICT!
                      </span>
                    )}
                  </div>

                  {/* Day Content Area */}
                  <div className="mt-1 flex-1 space-y-1 overflow-hidden">
                    {/* Awareness Events on this Day */}
                    {dayAwareness.map((awr) => {
                      const isMulti = awr.start_date !== awr.end_date;
                      const isStart = dateStr === awr.start_date;

                      let badgeBg = 'bg-emerald-600 text-white';
                      if (awr.color_tag === 'blue' || awr.category.includes('Civic') || awr.category.includes('Holiday')) {
                        badgeBg = 'bg-blue-600 text-white';
                      } else if (awr.color_tag === 'rose' || awr.category.includes('Cultural')) {
                        badgeBg = 'bg-rose-600 text-white';
                      } else if (awr.color_tag === 'amber') {
                        badgeBg = 'bg-amber-600 text-white';
                      }

                      return (
                        <div
                          key={`${awr.id}-${dateStr}`}
                          onClick={() => onSelectAwareness && onSelectAwareness(awr)}
                          title={`${awr.title} (${awr.start_date} to ${awr.end_date || awr.start_date}) - ${awr.notes || ''}`}
                          className={cn(
                            'truncate rounded px-1 py-0.5 text-[9px] font-semibold transition-opacity hover:opacity-90 cursor-default shadow-2xs',
                            badgeBg
                          )}
                        >
                          {isMulti ? (isStart ? `🚩 ${awr.title}` : awr.title) : awr.title}
                        </div>
                      );
                    })}

                    {/* Alumni Events on this Day */}
                    {dayEvents.map((evt) => {
                      const isPlanning = evt.status === 'Planning';
                      const isSubmitted = evt.status === 'Submitted' || evt.status === 'Confirmed';
                      const isIdea = evt.status === 'Idea';

                      let eventStyle = 'bg-[#57068c] text-white border-[#4a0577]';
                      if (isPlanning) {
                        eventStyle = 'bg-amber-400 text-slate-950 border-amber-500 font-bold';
                      } else if (isIdea) {
                        eventStyle = 'bg-slate-200 text-slate-800 border-slate-300';
                      }

                      return (
                        <div
                          key={evt.id}
                          onClick={() => onSelectEvent(evt)}
                          title={`Click to view: ${evt.title} (${evt.status}) - Host: ${evt.primary_host}`}
                          className={cn(
                            'group cursor-pointer rounded p-1 text-[9px] leading-tight border transition-transform hover:scale-[1.03] shadow-xs flex flex-col justify-between',
                            eventStyle
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-extrabold">{evt.title}</span>
                            <span className="shrink-0 h-3.5 w-3.5 rounded-full bg-slate-900 text-[8px] font-bold text-white flex items-center justify-center">
                              {getAvatarBadge(evt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] opacity-90 mt-0.5">
                            <span className="uppercase font-semibold tracking-wider">{evt.status}</span>
                            {evt.deadlines.urgencyLabel && (
                              <span className="text-[7px] font-black bg-red-600 text-white px-0.5 rounded">
                                !
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-600 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
            <span>Tech Week / Conference</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
            <span>Alumni Event (Planning)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#57068c]" />
            <span>Submitted / Confirmed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
            <span>Civic / Holiday</span>
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          Click any event card to view 8w & 6w milestones
        </span>
      </div>
    </div>
  );
}
