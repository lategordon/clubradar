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
  MapPin,
  Clock,
  Building2,
  Users,
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

  // Count events in this month
  const monthEventCount = useMemo(() => {
    const startStr = format(startOfMonth(currentMonthDate), 'yyyy-MM-dd');
    const endStr = format(endOfMonth(currentMonthDate), 'yyyy-MM-dd');
    return events.filter((e) => e.event_date >= startStr && e.event_date <= endStr).length;
  }, [events, currentMonthDate]);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-[#57068c]">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <span>Month Conflict Radar</span>
            <span className="text-sm font-bold text-[#57068c] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              {monthLabel}
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Overlays multi-day awareness dates, tech conferences, and alumni event workflow lead times.
          </p>
        </div>

        {/* Calendar Nav Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToOctober}
            className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-[#57068c] hover:bg-purple-100 transition-all cursor-pointer shadow-2xs"
            title="Reset to Q4 2026 Launch (Oct 2026)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset (Oct 2026)</span>
          </button>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-black text-slate-900 min-w-[110px] text-center select-none">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers (Bigger & Clearer) */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-700 uppercase tracking-wider py-2 bg-slate-50/80 rounded-xl border border-slate-200">
        <div className="text-rose-600">Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div className="text-purple-700">Sat</div>
      </div>

      {/* Calendar Matrix View (Bigger Cells: min-h-[135px]) */}
      <div className="flex-1 space-y-2">
        {weeks.map((week, weekIdx) => (
          <div key={`week-${weekIdx}`} className="grid grid-cols-7 gap-2">
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
                    'relative rounded-xl border p-2 flex flex-col justify-between transition-all min-h-[135px] sm:min-h-[145px]',
                    isCurrMonth
                      ? 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs'
                      : 'border-slate-100 bg-slate-50/40 text-slate-400 opacity-50',
                    isTodayDate && 'ring-2 ring-[#57068c] bg-purple-50/30',
                    hasConflict && 'border-rose-400 bg-rose-50/50 ring-1 ring-rose-300'
                  )}
                >
                  {/* Top Day Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                          isTodayDate
                            ? 'bg-[#57068c] text-white font-black shadow-xs'
                            : isCurrMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {isTodayDate && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-full">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Conflict Alert Badge */}
                    {hasConflict && (
                      <span className="flex items-center gap-0.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white tracking-wider animate-pulse shadow-xs">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        <span>CONFLICT</span>
                      </span>
                    )}
                  </div>

                  {/* Day Content Area (Awareness + Events) */}
                  <div className="mt-1.5 flex-1 space-y-1.5 overflow-hidden">
                    {/* Awareness Events on this Day */}
                    {dayAwareness.map((awr) => {
                      const isMulti = awr.start_date !== awr.end_date;
                      const isStart = dateStr === awr.start_date;

                      let badgeBg = 'bg-indigo-600 text-white';
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
                            'truncate rounded-lg px-2 py-1 text-[10px] sm:text-xs font-bold transition-opacity hover:opacity-90 cursor-default shadow-2xs flex items-center gap-1',
                            badgeBg
                          )}
                        >
                          <span className="truncate">{isMulti ? (isStart ? awr.title : `• ${awr.title}`) : awr.title}</span>
                        </div>
                      );
                    })}

                    {/* Alumni Events on this Day */}
                    {dayEvents.map((evt) => {
                      const isPlanning = evt.status === 'Planning';
                      const isSubmitted = evt.status === 'Submitted' || evt.status === 'Confirmed';
                      const isIdea = evt.status === 'Idea';

                      let eventBg = 'bg-[#57068c] text-white border-[#460570]';
                      let statusBadgeBg = 'bg-purple-900/60 text-purple-100';

                      if (evt.status === 'Confirmed') {
                        eventBg = 'bg-emerald-700 text-white border-emerald-800';
                        statusBadgeBg = 'bg-emerald-900/60 text-emerald-100';
                      } else if (isPlanning) {
                        eventBg = 'bg-amber-400 text-slate-950 border-amber-500';
                        statusBadgeBg = 'bg-amber-500/80 text-slate-950 font-black';
                      } else if (isIdea) {
                        eventBg = 'bg-slate-200 text-slate-800 border-slate-300';
                        statusBadgeBg = 'bg-slate-300 text-slate-800';
                      }

                      return (
                        <div
                          key={evt.id}
                          onClick={() => onSelectEvent(evt)}
                          title={`Click to view: ${evt.title} (${evt.status}) - Host: ${evt.primary_host}`}
                          className={cn(
                            'group cursor-pointer rounded-xl p-1.5 text-[11px] leading-tight border transition-all hover:scale-[1.02] hover:shadow-md shadow-xs flex flex-col justify-between space-y-1',
                            eventBg
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black truncate text-xs">{evt.title}</span>
                            <span className="shrink-0 h-4 w-4 rounded-full bg-slate-900 text-[9px] font-bold text-white flex items-center justify-center shadow-2xs">
                              {getAvatarBadge(evt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[9px] pt-0.5">
                            <span className={cn("px-1.5 py-0.2 rounded font-bold uppercase tracking-wider", statusBadgeBg)}>
                              {evt.status}
                            </span>
                            {evt.deadlines.urgencyLabel && (
                              <span className="font-bold bg-rose-600 text-white px-1 py-0.2 rounded shadow-2xs">
                                {evt.deadlines.urgencyLabel}
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

      {/* Spacious Legend Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 text-xs font-medium text-slate-600 border-t border-slate-100 bg-slate-50/50 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-indigo-600 shadow-2xs" />
            <span className="font-semibold text-slate-700">Tech Week / Conference</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-amber-400 shadow-2xs" />
            <span className="font-semibold text-slate-700">Alumni Event (Planning)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-[#57068c] shadow-2xs" />
            <span className="font-semibold text-slate-700">Submitted / Confirmed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-blue-600 shadow-2xs" />
            <span className="font-semibold text-slate-700">Civic / Holiday</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-semibold">
          Click any event card to view 8-week & 6-week milestones
        </span>
      </div>
    </div>
  );
}
