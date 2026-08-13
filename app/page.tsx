'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { WorkflowPipeline } from '@/components/dashboard/WorkflowPipeline';
import { ConflictRadarCalendar } from '@/components/dashboard/ConflictRadarCalendar';
import { QuickInsightsSidebar } from '@/components/dashboard/QuickInsightsSidebar';
import { AddEventModal } from '@/components/events/AddEventModal';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { QuarterlyListView } from '@/components/quarterly/QuarterlyListView';
import { EventTableView } from '@/components/events/EventTableView';
import { IdeaBacklogView } from '@/components/ideas/IdeaBacklogView';
import { ToastContainer, ToastMessage } from '@/components/ui/toast';
import {
  getEnrichedEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleTask,
} from '@/lib/data-service';
import {
  EnrichedEvent,
  AwarenessEvent,
  TaskItem,
  ActivityLog,
  EventStatus,
  DatabaseEvent,
} from '@/types/database.types';
import {
  Sparkles,
  AlertCircle,
  User,
  MapPin,
  Calendar as CalendarIcon,
  Table as TableIcon,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterChipId = 'all' | 'urgent' | 'my-events' | 'sf' | 'east-bay' | 'south-bay' | 'q4-2026' | 'q1-2027';
type CalendarViewMode = 'grid' | 'table' | 'quarterly';

interface FilterChipItem {
  id: FilterChipId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  urgent?: boolean;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('table');
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [awarenessEvents, setAwarenessEvents] = useState<AwarenessEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Filter Pills State
  const [quickFilter, setQuickFilter] = useState<FilterChipId>('all');

  // Toast Notifications State
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

  // Modal States
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EnrichedEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Load data
  const loadData = async () => {
    try {
      const data = await getEnrichedEvents();
      setEvents(data.enrichedEvents);
      setAwarenessEvents(data.awarenessEvents);
      setTasks(data.tasks);
      setActivityLogs(data.activityLogs);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Events for Dashboard & Calendar
  const filteredDashboardEvents = useMemo(() => {
    return events.filter((evt) => {
      if (quickFilter === 'urgent') {
        return (
          evt.deadlines.isSixWeekUrgent ||
          evt.deadlines.isEightWeekUrgent ||
          evt.deadlines.urgencyLabel !== undefined
        );
      }
      if (quickFilter === 'my-events') {
        return (
          evt.primary_host.toLowerCase().includes('leighton') ||
          evt.co_hosts_list.some((h) => h.toLowerCase().includes('leighton'))
        );
      }
      if (quickFilter === 'sf') return evt.region === 'SF';
      if (quickFilter === 'east-bay') return evt.region === 'East Bay';
      if (quickFilter === 'south-bay') return evt.region === 'South Bay';
      if (quickFilter === 'q4-2026') {
        return (
          evt.event_date.startsWith('2026-10') ||
          evt.event_date.startsWith('2026-11') ||
          evt.event_date.startsWith('2026-12')
        );
      }
      if (quickFilter === 'q1-2027') {
        return (
          evt.event_date.startsWith('2027-01') ||
          evt.event_date.startsWith('2027-02') ||
          evt.event_date.startsWith('2027-03')
        );
      }
      return true;
    });
  }, [events, quickFilter]);

  // Handlers
  const handleCreateEvent = async (
    newEventData: Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'>
  ) => {
    await createEvent(newEventData);
    await loadData();
    addToast(
      '🎉 Event Created Successfully',
      `"${newEventData.title}" is now added to the workflow pipeline.`,
      'success'
    );
  };

  const handleUpdateStatus = async (id: string, newStatus: EventStatus) => {
    await updateEvent(id, { status: newStatus });
    await loadData();
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    const targetEvent = events.find((e) => e.id === id);
    addToast(
      '⚡ Workflow Status Advanced',
      `"${targetEvent?.title || 'Event'}" moved to ${newStatus}.`,
      'purple'
    );
  };

  const handleToggleTask = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const updated = await toggleTask(taskId);
    setTasks(updated);
    addToast(
      targetTask?.completed ? 'Task Reopened' : '✓ Task Completed',
      targetTask?.title,
      targetTask?.completed ? 'info' : 'success'
    );
  };

  const handleOpenEventDetails = (event: EnrichedEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const filterChips: FilterChipItem[] = [
    { id: 'all', label: 'All Events', icon: Sparkles, count: events.length },
    {
      id: 'urgent',
      label: 'Needs Attention (SLA)',
      icon: Flame,
      count: events.filter(
        (e) => e.deadlines.isSixWeekUrgent || e.deadlines.isEightWeekUrgent
      ).length,
      urgent: true,
    },
    {
      id: 'my-events',
      label: 'My Events (Leighton)',
      icon: User,
      count: events.filter((e) => e.primary_host.includes('Leighton')).length,
    },
    { id: 'sf', label: 'SF City', icon: MapPin, count: events.filter((e) => e.region === 'SF').length },
    {
      id: 'east-bay',
      label: 'East Bay',
      icon: MapPin,
      count: events.filter((e) => e.region === 'East Bay').length,
    },
    {
      id: 'south-bay',
      label: 'South Bay',
      icon: MapPin,
      count: events.filter((e) => e.region === 'South Bay').length,
    },
    { id: 'q4-2026', label: 'Q4 2026', icon: CalendarIcon },
    { id: 'q1-2027', label: 'Q1 2027', icon: CalendarIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenAddEvent={() => setIsAddEventOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        {activeTab !== 'ideas' && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {activeTab === 'calendar' ? 'Events & Calendar Timeline' : 'Main Dashboard'}
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                NYU Bay Area Alumni Club • Pipeline tracking, 8w/6w lead times & conflict radar
              </p>
            </div>

          {/* If on calendar tab, show view mode switcher */}
          {activeTab === 'calendar' && (
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setCalendarViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer select-none',
                  calendarViewMode === 'table'
                    ? 'bg-[#57068c] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Timeline Table</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarViewMode('grid')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer select-none',
                  calendarViewMode === 'grid'
                    ? 'bg-[#57068c] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>Month Radar</span>
              </button>
            </div>
          )}
        </div>
        )}

        {/* Quick Filter Chips Strip (Dashboard & Calendar Views) */}
        {(activeTab === 'dashboard' || activeTab === 'calendar') && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span>Filters:</span>
            </span>

            {filterChips.map((chip) => {
              const isSelected = quickFilter === chip.id;
              const Icon = chip.icon;

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setQuickFilter(chip.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs select-none',
                    isSelected
                      ? 'bg-[#57068c] text-white ring-2 ring-purple-300'
                      : chip.urgent && (chip.count || 0) > 0
                      ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200/80'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5',
                      isSelected
                        ? 'text-white'
                        : chip.urgent
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    )}
                  />
                  <span>{chip.label}</span>
                  {chip.count !== undefined && (
                    <span
                      className={cn(
                        'ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold',
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {chip.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'dashboard' ? (
          /* View 1: Main Dashboard (3-Column Layout) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Event Workflow Progress */}
            <section className="lg:col-span-4 space-y-4">
              <WorkflowPipeline
                events={filteredDashboardEvents}
                onSelectEvent={handleOpenEventDetails}
                onStatusChange={handleUpdateStatus}
              />
            </section>

            {/* Middle Column: Context & Conflicts (Multi-day Awareness Radar) */}
            <section className="lg:col-span-5 space-y-4">
              <ConflictRadarCalendar
                events={filteredDashboardEvents}
                awarenessEvents={awarenessEvents}
                onSelectEvent={handleOpenEventDetails}
              />
            </section>

            {/* Right Column: Quick Insights Sidebar */}
            <aside className="lg:col-span-3 space-y-4">
              <QuickInsightsSidebar
                tasks={tasks}
                activityLogs={activityLogs}
                events={events}
                onToggleTask={handleToggleTask}
                onSelectEvent={handleOpenEventDetails}
              />
            </aside>
          </div>
        ) : activeTab === 'calendar' ? (
          /* View 2: Calendar Tab with View Mode Switcher */
          calendarViewMode === 'grid' ? (
            <div className="w-full">
              <ConflictRadarCalendar
                events={filteredDashboardEvents}
                awarenessEvents={awarenessEvents}
                onSelectEvent={handleOpenEventDetails}
              />
            </div>
          ) : (
            <div className="w-full space-y-4">
              <EventTableView
                events={filteredDashboardEvents}
                awarenessEvents={awarenessEvents}
                onSelectEvent={handleOpenEventDetails}
                onUpdateEvent={async (id, updates) => {
                  await updateEvent(id, updates);
                  await loadData();
                  addToast('Event Updated', 'Changes saved successfully.', 'info');
                }}
                onDeleteEvent={async (id) => {
                  await deleteEvent(id);
                  await loadData();
                  addToast('Event Deleted', 'Event was removed from the schedule.', 'warning');
                }}
                onOpenAddModal={() => setIsAddEventOpen(true)}
              />
            </div>
          )
        ) : activeTab === 'ideas' ? (
          /* View: Event Ideas & Brainstorming Incubator */
          <div className="w-full">
            <IdeaBacklogView />
          </div>
        ) : (
          /* Other Tabs: Events / Hosts / Reports */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <section className="lg:col-span-9 space-y-4">
              <QuarterlyListView
                events={filteredDashboardEvents}
                awarenessEvents={awarenessEvents}
                onSelectEvent={handleOpenEventDetails}
              />
            </section>
            <aside className="lg:col-span-3 space-y-4">
              <QuickInsightsSidebar
                tasks={tasks}
                activityLogs={activityLogs}
                events={events}
                onToggleTask={handleToggleTask}
                onSelectEvent={handleOpenEventDetails}
              />
            </aside>
          </div>
        )}
      </main>

      {/* Add Event Modal */}
      <AddEventModal
        open={isAddEventOpen}
        onOpenChange={setIsAddEventOpen}
        onSave={handleCreateEvent}
        awarenessEvents={awarenessEvents}
      />

      {/* Event Details & Status Modal with Stepper */}
      <EventDetailsModal
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
