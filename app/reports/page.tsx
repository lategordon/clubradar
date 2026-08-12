'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { QuickInsightsSidebar } from '@/components/dashboard/QuickInsightsSidebar';
import { getEnrichedEvents, toggleTask } from '@/lib/data-service';
import { EnrichedEvent, TaskItem, ActivityLog } from '@/types/database.types';
import { BarChart3, TrendingUp, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
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

  const totalEvents = events.length;
  const submittedCount = events.filter((e) => e.status === 'Submitted').length;
  const planningCount = events.filter((e) => e.status === 'Planning').length;
  const ideaCount = events.filter((e) => e.status === 'Idea').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar activeTab="reports" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Workflow & Lead-Time Analytics
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Quarterly Performance, 8-Week / 6-Week Compliance, and Budget Summary
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-9 space-y-6">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-bold uppercase text-slate-500">Total Planned Events</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{totalEvents}</span>
                  <span className="text-xs font-semibold text-emerald-600">Q4 2026 / Q1 2027</span>
                </div>
              </div>

              <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 shadow-xs">
                <span className="text-xs font-bold uppercase text-purple-800">Submitted & On Schedule</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-purple-950">{submittedCount}</span>
                  <span className="text-xs font-semibold text-purple-700">100% 6w compliance</span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
                <span className="text-xs font-bold uppercase text-amber-800">In Active Planning</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-950">{planningCount}</span>
                  <span className="text-xs font-semibold text-amber-700">2 warnings flagged</span>
                </div>
              </div>
            </div>

            {/* Workflow Lead-Time SLA Guidelines */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#57068c]" />
                NYU Bay Area Alumni Workflow Lead-Time SLA
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-1.5">
                  <span className="font-bold text-amber-950 text-sm">8-Week Mark: Begin Process</span>
                  <p className="text-slate-600 leading-relaxed">
                    Event host initiates venue outreach, locks budget / tickets, and drafts initial concept sheet.
                  </p>
                  <div className="text-[11px] font-semibold text-amber-900 pt-1">
                    Triggered 56 days before event date.
                  </div>
                </div>

                <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-1.5">
                  <span className="font-bold text-purple-950 text-sm">6-Week Mark: Submit Event Copy</span>
                  <p className="text-slate-600 leading-relaxed">
                    Host submits final marketing copy, RSVP form link, and ticketing details to NYU Alumni Relations for newsletter promotion.
                  </p>
                  <div className="text-[11px] font-semibold text-purple-900 pt-1">
                    Triggered 42 days before event date.
                  </div>
                </div>
              </div>
            </div>
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
