'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  ThumbsUp,
  HelpCircle,
  ChevronRight,
  AlertCircle,
  Clock,
  MapPin,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { EnrichedEvent, EventStatus } from '@/types/database.types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WorkflowPipelineProps {
  events: EnrichedEvent[];
  onSelectEvent: (event: EnrichedEvent) => void;
  onStatusChange?: (id: string, newStatus: EventStatus) => void;
}

export function WorkflowPipeline({
  events,
  onSelectEvent,
  onStatusChange,
}: WorkflowPipelineProps) {
  // Group events by status
  const planningEvents = events.filter((e) => e.status === 'Planning');
  const submittedEvents = events.filter((e) => e.status === 'Submitted');
  const ideaEvents = events.filter((e) => e.status === 'Idea');
  const confirmedEvents = events.filter((e) => e.status === 'Confirmed' || e.status === 'Completed');

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

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Event Workflow Progress
        </h2>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
          {events.length} Total Events
        </span>
      </div>

      {/* Stage: Idea (Overview Header) */}
      <div className="rounded-xl bg-slate-100/90 p-3 flex items-center justify-between border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          <span className="text-sm font-bold text-slate-800">Idea Backlog</span>
        </div>
        <a
          href="/ideas"
          className="text-xs font-bold text-[#57068c] hover:underline bg-white px-2.5 py-1 rounded-md shadow-2xs border border-purple-100 flex items-center gap-1"
        >
          <span>{ideaEvents.length + 5} in Incubator</span>
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      {/* Stage: Planning */}
      <div className="rounded-xl border border-amber-200/90 bg-amber-50/40 p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
            <span className="text-sm font-black text-amber-950">
              Planning: {planningEvents.length} Events
            </span>
          </div>
          <span className="text-xs font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-200">
            {planningEvents.length} Active
          </span>
        </div>

        <div className="space-y-2.5">
          {planningEvents.map((event) => {
            const dateFormatted = format(parseISO(event.event_date), 'MMM d');
            const progressCurrent = event.workflow_progress_current || 9;
            const progressTotal = event.workflow_progress_total || 13;
            const progressPercent = Math.min((progressCurrent / progressTotal) * 100, 100);

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="group relative cursor-pointer rounded-xl bg-linear-to-r from-amber-400 to-amber-500 p-3.5 text-slate-900 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 border border-amber-500/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5">
                      {event.title} ({dateFormatted})
                    </h4>
                    <p className="text-xs text-amber-950/80 font-semibold mt-0.5">
                      {dateFormatted} • {event.location_name.replace(/\(.*\)/, '').trim() || 'San Francisco'} • {event.region}
                    </p>
                  </div>

                  {/* Host Avatar Badge */}
                  <div className="flex -space-x-1 shrink-0">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white ring-2 ring-amber-200 shadow-2xs">
                      {getAvatarBadge(event)}
                    </span>
                  </div>
                </div>

                {/* Workflow Progress Bar */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-950/90 mb-1">
                    <span className="flex items-center gap-1">
                      👍 Workflow progress
                    </span>
                    <span>
                      {progressCurrent} / {progressTotal} steps
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200/90 shadow-inner">
                    <div
                      className="h-full rounded-full bg-[#57068c] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Urgent Warning if applicable */}
                {event.deadlines.urgencyLabel && (
                  <div className="mt-2.5 flex items-center justify-between text-[10px] font-black text-red-950 bg-amber-200/95 px-2 py-1 rounded-md border border-amber-300">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-red-700 shrink-0" />
                      <span>{event.deadlines.urgencyLabel.toUpperCase()} (Due {event.deadlines.sixWeekFormatted})</span>
                    </span>
                  </div>
                )}

                {/* Quick Advance Action Button */}
                {onStatusChange && (
                  <div className="mt-2.5 pt-2 border-t border-amber-500/30 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(event.id, 'Submitted');
                      }}
                      className="flex items-center gap-1 text-[11px] font-extrabold text-[#57068c] bg-white/90 hover:bg-white px-2 py-0.5 rounded shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>Submit Copy</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage: Submitted */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-purple-200/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#57068c] ring-2 ring-purple-200" />
            <span className="text-sm font-black text-purple-950">
              Submitted : {submittedEvents.length} Events
            </span>
          </div>
          <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
            {submittedEvents.length} Ready
          </span>
        </div>

        <div className="space-y-2.5">
          {submittedEvents.map((event) => {
            const dateFormatted = format(parseISO(event.event_date), 'MMM d');
            const progressCurrent = event.workflow_progress_current || 20;
            const progressTotal = event.workflow_progress_total || 15;
            const progressPercent = Math.min((progressCurrent / progressTotal) * 100, 100);

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="group relative cursor-pointer rounded-xl bg-purple-200/90 p-3.5 text-purple-950 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 border border-purple-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-purple-950">
                      {event.title} ({dateFormatted})
                    </h4>
                    <p className="text-xs text-purple-900 font-semibold mt-0.5">
                      {dateFormatted} • {event.location_name.replace(/\(.*\)/, '').trim() || 'San Francisco'} • {event.region}
                    </p>
                  </div>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white ring-2 ring-purple-300 shadow-2xs">
                    {getAvatarBadge(event)}
                  </span>
                </div>

                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-950 mb-1">
                    <span className="flex items-center gap-1">👍 Marketing Approved</span>
                    <span>100% Ready</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-purple-300/80 shadow-inner">
                    <div
                      className="h-full rounded-full bg-[#57068c] transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Advance to Confirmed */}
                {onStatusChange && (
                  <div className="mt-2.5 pt-2 border-t border-purple-300/60 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(event.id, 'Confirmed');
                      }}
                      className="flex items-center gap-1 text-[11px] font-extrabold text-[#57068c] bg-white/90 hover:bg-white px-2 py-0.5 rounded shadow-2xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Confirm & Lock</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage: Confirmed & Completed */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          <span className="text-sm font-bold text-emerald-950">Confirmed / Live Events</span>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
          {confirmedEvents.length} Events
        </span>
      </div>
    </div>
  );
}
