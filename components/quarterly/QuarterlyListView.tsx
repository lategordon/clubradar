'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Filter, Layers, CheckCircle, AlertTriangle, Building2 } from 'lucide-react';
import { EnrichedEvent, AwarenessEvent, EventStatus, EventRegion } from '@/types/database.types';
import { groupEventsByQuarter, QuarterGroup } from '@/lib/utils/grouping';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface QuarterlyListViewProps {
  events: EnrichedEvent[];
  awarenessEvents: AwarenessEvent[];
  onSelectEvent: (event: EnrichedEvent) => void;
  onSelectAwareness?: (awareness: AwarenessEvent) => void;
}

export function QuarterlyListView({
  events,
  awarenessEvents,
  onSelectEvent,
  onSelectAwareness,
}: QuarterlyListViewProps) {
  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({
    '2026-10': true,
    '2026-11': true,
    '2026-12': true,
    '2027-01': true,
    '2027-02': true,
    '2027-03': true,
  });

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedStatus !== 'All' && e.status !== selectedStatus) return false;
      if (selectedLocation !== 'All' && e.region !== selectedLocation) return false;
      if (selectedAssignee !== 'All') {
        const matchHost = e.primary_host.toLowerCase().includes(selectedAssignee.toLowerCase());
        const matchCoHost = e.co_hosts_list.some((h) => h.toLowerCase().includes(selectedAssignee.toLowerCase()));
        if (!matchHost && !matchCoHost) return false;
      }
      return true;
    });
  }, [events, selectedStatus, selectedLocation, selectedAssignee]);

  // Group by quarters
  const quarters: QuarterGroup[] = useMemo(() => {
    return groupEventsByQuarter(filteredEvents, awarenessEvents);
  }, [filteredEvents, awarenessEvents]);

  const getAvatarBadge = (primaryHost: string, coHosts: string[] = []) => {
    if (primaryHost.toLowerCase().includes('leighton')) return 'L&A';
    if (primaryHost.toLowerCase().includes('janice')) return 'J';
    if (primaryHost.toLowerCase().includes('tammy')) {
      return coHosts.length > 0 ? 'T T&B' : 'T';
    }
    return primaryHost.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Controls Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="text-slate-500 font-medium">View:</span>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-800">
              List View (Quarterly) ▾
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Filter by Status */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Filter by Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value="All">(All)</option>
              <option value="Idea">Idea</option>
              <option value="Planning">Planning</option>
              <option value="Submitted">Submitted</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Location</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value="All">(All)</option>
              <option value="SF">SF</option>
              <option value="East Bay">East Bay</option>
              <option value="South Bay">South Bay</option>
              <option value="Virtual">Virtual</option>
              <option value="NYC">NYC</option>
            </select>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Assignee</span>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value="All">(All)</option>
              <option value="Leighton">Leighton</option>
              <option value="Janice">Janice K.</option>
              <option value="Tammy">Tammy Chen</option>
              <option value="Adi">Adi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quarters Container */}
      <div className="space-y-6">
        {quarters.map((quarter) => (
          <div key={quarter.quarterKey} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {/* Quarter Header */}
            <div className="flex items-center justify-between bg-slate-100/90 px-4 py-3 border-b border-slate-200">
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                {quarter.quarterTitle}
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                  Today ▾
                </div>
                <button type="button" className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Months Accordions */}
            <div className="divide-y divide-slate-100">
              {quarter.months.map((month) => {
                const isExpanded = expandedMonths[month.monthKey] !== false;
                const totalItems =
                  month.communityEvents.length +
                  month.alumniEvents.length +
                  month.cityContextEvents.length;

                return (
                  <div key={month.monthKey} className="transition-colors">
                    {/* Month Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleMonth(month.monthKey)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50/80 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <span>{month.monthTitle}</span>
                    </button>

                    {/* Month Content Body */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-4">
                        {/* 1. Community Events (Green Banner Multi-days & Single days) */}
                        {month.communityEvents.length > 0 && (
                          <div className="grid grid-cols-12 gap-3 items-start">
                            <div className="col-span-12 sm:col-span-3 text-xs font-bold text-slate-800 pt-1">
                              Community Events
                            </div>
                            <div className="col-span-12 sm:col-span-9 space-y-1.5">
                              {month.communityEvents.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => onSelectAwareness && onSelectAwareness(item)}
                                  className="flex items-center justify-between rounded-lg bg-emerald-100/80 px-3 py-1.5 text-xs text-emerald-950 hover:bg-emerald-200/80 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 font-medium">
                                    <span className="font-bold">
                                      {item.is_multi_day ? '[Multi-day]' : '[Single Day]'}
                                    </span>
                                    <span>{item.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-emerald-900">
                                      {item.is_multi_day
                                        ? `${item.start_date.substring(5)} - ${item.end_date.substring(8)}`
                                        : item.start_date.substring(5)}
                                    </span>
                                    {item.title.includes('Social Event') && (
                                      <Badge variant="warning" className="text-[10px]">
                                        8 week warning
                                      </Badge>
                                    )}
                                    {item.title.includes('Happy Hour') && (
                                      <Badge variant="planning" className="text-[10px]">
                                        Planning
                                      </Badge>
                                    )}
                                    {item.title.includes('SOCAP') && (
                                      <Badge variant="planning" className="text-[10px]">
                                        Planning
                                      </Badge>
                                    )}
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-white">
                                      {item.title.includes('SOCAP') ? 'T T&R' : item.title.includes('Social') ? 'L&A' : 'J'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. Alumni Events */}
                        {month.alumniEvents.length > 0 && (
                          <div className="grid grid-cols-12 gap-3 items-start border-t border-slate-100 pt-3">
                            <div className="col-span-12 sm:col-span-3 text-xs font-bold text-slate-800 pt-1">
                              Alumni Events
                            </div>
                            <div className="col-span-12 sm:col-span-9 space-y-2">
                              {month.alumniEvents.map((evt) => {
                                const isConcept = evt.status === 'Idea';
                                const isSubmitted = evt.status === 'Submitted';

                                return (
                                  <div
                                    key={evt.id}
                                    onClick={() => onSelectEvent(evt)}
                                    className="flex items-center justify-between rounded-lg bg-slate-50/90 hover:bg-slate-100/90 px-3 py-2 text-xs text-slate-900 border border-slate-200/70 transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 font-semibold">
                                      <span
                                        className={cn(
                                          'h-2 w-2 rounded-full shrink-0',
                                          isConcept
                                            ? 'bg-amber-500'
                                            : isSubmitted
                                            ? 'bg-purple-600'
                                            : 'bg-sky-500'
                                        )}
                                      />
                                      <span>{evt.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-slate-600 font-medium">
                                        {evt.event_date.substring(5)}
                                      </span>
                                      <Badge
                                        variant={
                                          evt.status === 'Completed'
                                            ? 'completed'
                                            : evt.status === 'Cancelled'
                                            ? 'cancelled'
                                            : isSubmitted
                                            ? 'submitted'
                                            : isConcept
                                            ? 'idea'
                                            : 'planning'
                                        }
                                        className="text-[10px]"
                                      >
                                        {isConcept ? 'Concept' : evt.status}
                                      </Badge>
                                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-white">
                                        {getAvatarBadge(evt.primary_host, evt.co_hosts_list)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. City Context & Awareness */}
                        {month.cityContextEvents.length > 0 && (
                          <div className="grid grid-cols-12 gap-3 items-start border-t border-slate-100 pt-3">
                            <div className="col-span-12 sm:col-span-3 text-xs font-bold text-slate-800 pt-1">
                              City Context & Awareness
                            </div>
                            <div className="col-span-12 sm:col-span-9 space-y-1.5">
                              {month.cityContextEvents.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => onSelectAwareness && onSelectAwareness(item)}
                                  className="flex items-center justify-between rounded-lg bg-blue-50/50 px-3 py-1.5 text-xs text-slate-800 hover:bg-blue-100/60 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 font-medium">
                                    <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                    <span>{item.title}</span>
                                  </div>
                                  <span className="font-semibold text-slate-600">
                                    {item.start_date.substring(5)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {totalItems === 0 && (
                          <p className="text-xs text-slate-400 italic">No events scheduled for this month.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
