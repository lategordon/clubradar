'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { QuickInsightsSidebar } from '@/components/dashboard/QuickInsightsSidebar';
import { getEnrichedEvents, toggleTask } from '@/lib/data-service';
import { EnrichedEvent, TaskItem, ActivityLog } from '@/types/database.types';
import { User, Calendar, MapPin, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HostsPage() {
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    getEnrichedEvents().then((data) => {
      setEvents(data.enrichedEvents);
      setTasks(data.tasks);
      setActivityLogs(data.activityLogs);
    });
  }, []);

  const hostsSummary = [
    { name: 'Leighton Gordon', role: 'Club Co-Lead & Operations', avatar: 'L&A', count: 3, badge: 'Lead' },
    { name: 'Janice K.', role: 'Programs & Cultural Liaison', avatar: 'J', count: 3, badge: 'Lead' },
    { name: 'Tammy Chen', role: 'Networking & Young Alumni', avatar: 'T', count: 2, badge: 'Organizer' },
    { name: 'Adi', role: 'Community & Communications', avatar: 'A', count: 4, badge: 'Co-Host' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar activeTab="hosts" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Host Directory & Assignments
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Committee Lead Assignments and Workload Distribution
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hostsSummary.map((host) => (
              <div key={host.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#57068c] text-sm font-bold text-white shadow-xs">
                    {host.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {host.name}
                      <Badge variant="purple" className="text-[10px]">
                        {host.badge}
                      </Badge>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{host.role}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Assigned Events:</span>
                  <span className="font-bold text-[#57068c] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {host.count} Active Events
                  </span>
                </div>
              </div>
            ))}
          </section>

          <aside className="lg:col-span-3 space-y-4">
            <QuickInsightsSidebar
              tasks={tasks}
              activityLogs={activityLogs}
              events={events}
              onToggleTask={async (id) => {
                const updated = await toggleTask(id);
                setTasks(updated);
              }}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
