'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { QuickInsightsSidebar } from '@/components/dashboard/QuickInsightsSidebar';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { ToastContainer, ToastMessage } from '@/components/ui/toast';
import { getEnrichedEvents, toggleTask, updateEvent } from '@/lib/data-service';
import {
  EnrichedEvent,
  TaskItem,
  ActivityLog,
  ClubLeader,
  EventStatus,
} from '@/types/database.types';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  DollarSign,
  MapPin,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [leaders, setLeaders] = useState<ClubLeader[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EnrichedEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    title: string,
    description?: string,
    type: 'success' | 'warning' | 'info' | 'purple' = 'purple'
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadData = async () => {
    try {
      const data = await getEnrichedEvents();
      setEvents(data.enrichedEvents);
      setTasks(data.tasks);
      setActivityLogs(data.activityLogs);
      setLeaders(data.leaders || []);
    } catch (err) {
      console.error('Error loading report data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: EventStatus) => {
    await updateEvent(id, { status: newStatus });
    await loadData();
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    addToast('Status Updated', `Event moved to ${newStatus}.`, 'purple');
  };

  // Analytics Computations
  const totalEvents = events.length;
  const submittedCount = events.filter((e) => e.status === 'Submitted' || e.status === 'Confirmed').length;
  const planningCount = events.filter((e) => e.status === 'Planning').length;
  const ideaCount = events.filter((e) => e.status === 'Idea').length;

  const urgent6wEvents = events.filter((e) => e.deadlines.isSixWeekUrgent);
  const urgent8wEvents = events.filter((e) => e.deadlines.isEightWeekUrgent);

  // Regional breakdown
  const regionalBreakdown = useMemo(() => {
    const counts: Record<string, number> = { SF: 0, 'East Bay': 0, 'South Bay': 0, NYC: 0, Virtual: 0 };
    events.forEach((e) => {
      if (counts[e.region] !== undefined) counts[e.region]++;
    });
    return counts;
  }, [events]);

  // Financial summary
  const financials = useMemo(() => {
    let totalPaidEvents = 0;
    let freeEvents = 0;
    let avgCost = 0;
    let totalCostSum = 0;

    events.forEach((e) => {
      if (e.cost_per_person > 0) {
        totalPaidEvents++;
        totalCostSum += e.cost_per_person;
      } else {
        freeEvents++;
      }
    });

    avgCost = totalPaidEvents > 0 ? Math.round(totalCostSum / totalPaidEvents) : 0;
    return { totalPaidEvents, freeEvents, avgCost };
  }, [events]);

  // Conflict count
  const conflictCount = events.filter((e) => e.conflicts.length > 0).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar activeTab="reports" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-[#57068c]" />
              <span>Workflow & Lead-Time Analytics Suite</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Multi-University Event SLA Compliance, Lead-Time Deadlines & Regional Resource Allocation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>SLA Health: 97.4% Met</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-9 space-y-6">
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Planned Slate
                </span>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{totalEvents}</span>
                  <span className="text-xs font-semibold text-purple-700">Events</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 font-medium">
                  {submittedCount} Submitted • {planningCount} Planning
                </div>
              </div>

              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                  6-Week Copy SLA
                </span>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-purple-950">
                    {Math.round(((totalEvents - urgent6wEvents.length) / (totalEvents || 1)) * 100)}%
                  </span>
                  <span className="text-xs font-semibold text-purple-700">On-Time Rate</span>
                </div>
                <div className="mt-2 text-[11px] text-purple-800 font-medium">
                  {urgent6wEvents.length > 0 ? (
                    <span className="text-amber-800 font-bold flex items-center gap-1">
                      <Flame className="h-3 w-3 text-amber-600" />
                      {urgent6wEvents.length} needs copy submission
                    </span>
                  ) : (
                    'All copy submissions on schedule'
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                  Awareness Conflicts
                </span>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-950">{conflictCount}</span>
                  <span className="text-xs font-semibold text-blue-700">Events Coinciding</span>
                </div>
                <div className="mt-2 text-[11px] text-blue-800 font-medium">
                  SF Tech Week & J.P. Morgan Week
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                  Ticket Tier & Budget
                </span>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-950">
                    ${financials.avgCost}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">Avg / Paid Event</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-800 font-medium">
                  {financials.freeEvents} Free / Sponsored • {financials.totalPaidEvents} Paid
                </div>
              </div>
            </div>

            {/* Regional & University Workload Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Regional Coverage */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 flex items-center justify-between mb-4">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#57068c]" />
                    Regional Event Distribution
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Bay Area Footprint</span>
                </h3>

                <div className="space-y-3 text-xs">
                  {Object.entries(regionalBreakdown).map(([region, count]) => {
                    const pct = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0;
                    return (
                      <div key={region} className="space-y-1">
                        <div className="flex items-center justify-between font-semibold text-slate-700 text-xs">
                          <span>{region}</span>
                          <span className="text-slate-500">
                            {count} events ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              region === 'SF'
                                ? 'bg-[#57068c]'
                                : region === 'East Bay'
                                ? 'bg-blue-600'
                                : region === 'South Bay'
                                ? 'bg-emerald-600'
                                : 'bg-slate-400'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lead-Time Compliance Framework */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[#57068c]" />
                      SLA Lead-Time Rules
                    </span>
                    <Badge variant="purple" className="text-[10px]">
                      Mandatory
                    </Badge>
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-950">
                        <span>8-Week Mark: Kickoff & Venue Lock</span>
                        <span className="text-[10px] text-amber-800 font-extrabold">56 Days Prior</span>
                      </div>
                      <p className="text-[11px] text-amber-900/90 leading-relaxed">
                        Host locks date/venue, completes budget form, and verifies no awareness conflict.
                      </p>
                    </div>

                    <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 space-y-1">
                      <div className="flex items-center justify-between font-bold text-purple-950">
                        <span>6-Week Mark: Marketing Copy Submission</span>
                        <span className="text-[10px] text-purple-800 font-extrabold">42 Days Prior</span>
                      </div>
                      <p className="text-[11px] text-purple-900/90 leading-relaxed">
                        Final copy, graphics, and RSVP ticketing links sent to Alumni Relations for newsletter cycle.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Simulated Reference Anchor:</span>
                  <span className="font-mono font-bold text-slate-700">August 11, 2026</span>
                </div>
              </div>
            </div>

            {/* Events Requiring Immediate Action Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-600" />
                  Upcoming Events SLA Compliance Radar
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {events.length} Total Events in System
                </span>
              </div>

              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80">
                {events.slice(0, 5).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedEvent(evt);
                      setIsDetailsOpen(true);
                    }}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs hover:bg-purple-50/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#57068c] font-black text-xs">
                        {evt.region}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 hover:text-[#57068c] transition-colors">
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Host: {evt.primary_host} • Date: {evt.event_date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {evt.deadlines.urgencyLabel && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-300">
                          {evt.deadlines.urgencyLabel}
                        </span>
                      )}
                      <Badge
                        variant={
                          evt.status === 'Submitted'
                            ? 'submitted'
                            : evt.status === 'Confirmed'
                            ? 'confirmed'
                            : evt.status === 'Planning'
                            ? 'planning'
                            : 'idea'
                        }
                        className="text-[10px]"
                      >
                        {evt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Column: Quick Insights Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
            <QuickInsightsSidebar
              tasks={tasks}
              activityLogs={activityLogs}
              events={events}
              onToggleTask={async (id) => {
                const updated = await toggleTask(id);
                setTasks(updated);
              }}
              onSelectEvent={(evt) => {
                setSelectedEvent(evt);
                setIsDetailsOpen(true);
              }}
            />
          </aside>
        </div>
      </main>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
