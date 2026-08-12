'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Plus, User, Sparkles } from 'lucide-react';
import { TaskItem, ActivityLog, EnrichedEvent } from '@/types/database.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickInsightsSidebarProps {
  tasks: TaskItem[];
  activityLogs: ActivityLog[];
  events: EnrichedEvent[];
  onToggleTask: (taskId: string) => void;
  onSelectEvent?: (event: EnrichedEvent) => void;
}

export function QuickInsightsSidebar({
  tasks,
  activityLogs,
  events,
  onToggleTask,
  onSelectEvent,
}: QuickInsightsSidebarProps) {
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Identify events with urgent 6-week or 8-week deadlines
  const urgentEvents = events.filter(
    (e) => e.deadlines.isSixWeekUrgent || e.deadlines.urgencyLabel?.includes('6')
  );

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. Quick Insights & Workflow Alerts */}
      <div>
        <h3 className="text-sm font-bold tracking-tight text-slate-900 mb-2">
          Quick Insights
        </h3>
        <div className="rounded-xl border border-amber-300 bg-[#fef3c7]/90 p-3.5 text-amber-950 shadow-xs">
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-amber-500/20 p-1 mt-0.5">
              <AlertCircle className="h-4 w-4 text-amber-800" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Workflow Alerts: ({urgentEvents.length > 0 ? urgentEvents.length : 2})
                </h4>
                <Badge variant="warning" className="text-[10px] bg-amber-200 text-amber-900 border-amber-300">
                  Action Required
                </Badge>
              </div>
              <p className="text-xs font-semibold text-amber-900 mt-1">
                6-Week Deadlines Approaching!
              </p>
              <ul className="mt-2 space-y-1 text-xs font-medium text-amber-950">
                {urgentEvents.length > 0 ? (
                  urgentEvents.map((evt) => (
                    <li
                      key={evt.id}
                      onClick={() => onSelectEvent && onSelectEvent(evt)}
                      className="cursor-pointer hover:underline flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-700" />
                      <span>{evt.title}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-700" />
                      <span>Dolores Park Picnic</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-700" />
                      <span>Alumni Volunteer Meeting</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2. My Tasks (Leighton) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            My Tasks (Leighton)
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {tasks.filter((t) => !t.completed).length} pending
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {tasks.map((task) => (
            <label
              key={task.id}
              className={cn(
                "flex items-start gap-2.5 rounded-lg p-2 transition-all cursor-pointer select-none",
                task.completed
                  ? "bg-slate-50 opacity-60 line-through text-slate-400"
                  : "bg-slate-50/70 hover:bg-slate-100 text-slate-800"
              )}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask(task.id)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#57068c] focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-xs font-medium leading-tight">
                {task.title}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Recent Activity */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Recent Activity
        </h3>

        <div className="mt-3 space-y-3">
          {activityLogs.slice(0, 5).map((log, idx) => (
            <div key={log.id || idx} className="flex items-start gap-2.5 text-xs">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white shadow-2xs">
                {log.user_avatar_initials}
              </div>
              <div className="flex-1 leading-tight">
                <p className="text-slate-800">
                  <span className="font-semibold">{log.user_name}</span> {log.action}
                </p>
                <span className="text-[10px] text-slate-600 font-medium">
                  {log.relative_time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
