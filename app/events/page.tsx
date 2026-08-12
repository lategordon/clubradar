'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { WorkflowPipeline } from '@/components/dashboard/WorkflowPipeline';
import { QuickInsightsSidebar } from '@/components/dashboard/QuickInsightsSidebar';
import { AddEventModal } from '@/components/events/AddEventModal';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { getEnrichedEvents, createEvent, updateEvent, toggleTask } from '@/lib/data-service';
import { EnrichedEvent, AwarenessEvent, TaskItem, ActivityLog, EventStatus, DatabaseEvent } from '@/types/database.types';

export default function EventsPage() {
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [awarenessEvents, setAwarenessEvents] = useState<AwarenessEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EnrichedEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const loadData = async () => {
    try {
      const data = await getEnrichedEvents();
      setEvents(data.enrichedEvents);
      setAwarenessEvents(data.awarenessEvents);
      setTasks(data.tasks);
      setActivityLogs(data.activityLogs);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEvent = async (newEventData: Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'>) => {
    await createEvent(newEventData);
    await loadData();
  };

  const handleUpdateStatus = async (id: string, newStatus: EventStatus) => {
    await updateEvent(id, { status: newStatus });
    await loadData();
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const updated = await toggleTask(taskId);
    setTasks(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar
        activeTab="events"
        onOpenAddEvent={() => setIsAddEventOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Event Pipelines
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Stage-by-Stage Workflow Progression & Task Completion
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-9 space-y-4">
            <WorkflowPipeline
              events={events}
              onSelectEvent={(e) => {
                setSelectedEvent(e);
                setIsDetailsOpen(true);
              }}
              onStatusChange={handleUpdateStatus}
            />
          </section>

          <aside className="lg:col-span-3 space-y-4">
            <QuickInsightsSidebar
              tasks={tasks}
              activityLogs={activityLogs}
              events={events}
              onToggleTask={handleToggleTask}
              onSelectEvent={(e) => {
                setSelectedEvent(e);
                setIsDetailsOpen(true);
              }}
            />
          </aside>
        </div>
      </main>

      <AddEventModal
        open={isAddEventOpen}
        onOpenChange={setIsAddEventOpen}
        onSave={handleCreateEvent}
        awarenessEvents={awarenessEvents}
      />

      <EventDetailsModal
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
