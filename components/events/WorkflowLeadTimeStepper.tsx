'use client';

import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Check, Clock, AlertTriangle, Sparkles, CheckCircle2, Calendar, FileText, Send, Flag, PartyPopper } from 'lucide-react';
import { EnrichedEvent, EventStatus } from '@/types/database.types';
import { cn } from '@/lib/utils';

interface WorkflowLeadTimeStepperProps {
  event: EnrichedEvent;
  className?: string;
}

export function WorkflowLeadTimeStepper({ event, className }: WorkflowLeadTimeStepperProps) {
  const { status, event_date, deadlines } = event;

  // Determine stage active states
  // 1. Idea Backlog
  // 2. 8-Week Kickoff (56 days)
  // 3. 6-Week Copy Due (42 days)
  // 4. Approved & Live (Submitted / Confirmed)
  // 5. Event Day

  const isSubmittedOrConfirmed = status === 'Submitted' || status === 'Confirmed' || status === 'Completed';
  const isPlanning = status === 'Planning';
  const isIdea = status === 'Idea';
  const isCompleted = status === 'Completed';

  // Step 1: Idea
  const step1Done = true; // Created

  // Step 2: 8w Kickoff
  const step2Done = isSubmittedOrConfirmed || (isPlanning && deadlines.isEightWeekPast);
  const step2Active = isPlanning && !deadlines.isEightWeekPast && deadlines.isEightWeekUrgent;
  const step2Warning = isPlanning && deadlines.isEightWeekPast && !isSubmittedOrConfirmed;

  // Step 3: 6w Marketing Copy Due
  const step3Done = isSubmittedOrConfirmed;
  const step3Active = isPlanning && deadlines.isSixWeekUrgent;
  const step3Warning = isPlanning && deadlines.isSixWeekPast;

  // Step 4: Approved & Live
  const step4Done = isSubmittedOrConfirmed;
  const step4Active = isSubmittedOrConfirmed && !isCompleted;

  // Step 5: Event Day
  const step5Done = isCompleted || deadlines.daysUntilEvent < 0;
  const step5Active = deadlines.daysUntilEvent >= 0 && deadlines.daysUntilEvent <= 3;

  const steps = [
    {
      id: 1,
      title: 'Idea Pitch',
      subtitle: 'Backlog Concept',
      icon: Sparkles,
      isDone: step1Done,
      isActive: isIdea,
      isWarning: false,
      dateLabel: 'Created',
    },
    {
      id: 2,
      title: '8w Kickoff',
      subtitle: 'Venue & Budget',
      icon: Flag,
      isDone: step2Done,
      isActive: step2Active,
      isWarning: step2Warning,
      dateLabel: deadlines.eightWeekFormatted || '56d prior',
      urgentText: deadlines.daysUntilEightWeek < 0 ? `${Math.abs(deadlines.daysUntilEightWeek)}d past` : `In ${deadlines.daysUntilEightWeek}d`,
    },
    {
      id: 3,
      title: '6w Copy Due',
      subtitle: 'NYU Relations SLA',
      icon: FileText,
      isDone: step3Done,
      isActive: step3Active,
      isWarning: step3Warning,
      dateLabel: deadlines.sixWeekFormatted || '42d prior',
      urgentText: deadlines.daysUntilSixWeek < 0 ? `${Math.abs(deadlines.daysUntilSixWeek)}d past SLA` : `In ${deadlines.daysUntilSixWeek}d`,
    },
    {
      id: 4,
      title: 'Submitted',
      subtitle: 'Marketing Live',
      icon: Send,
      isDone: step4Done,
      isActive: step4Active,
      isWarning: false,
      dateLabel: isSubmittedOrConfirmed ? 'Approved' : 'Pending copy',
    },
    {
      id: 5,
      title: 'Event Day',
      subtitle: 'Check-in & Social',
      icon: PartyPopper,
      isDone: step5Done,
      isActive: step5Active,
      isWarning: false,
      dateLabel: format(parseISO(event_date), 'MMM d, yyyy'),
    },
  ];

  return (
    <div className={cn('rounded-2xl border border-purple-100 bg-linear-to-r from-purple-50/70 via-slate-50/90 to-purple-50/70 p-4 shadow-2xs', className)}>
      <div className="flex items-center justify-between pb-3 border-b border-purple-100/80">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#57068c] text-white">
            <Sparkles className="h-3 w-3 text-white" />
          </span>
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-950">
            5-Stage Lead-Time Milestone Stepper
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-700">Status:</span>
          <span className={cn(
            'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border shadow-2xs',
            status === 'Completed'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : status === 'Cancelled'
              ? 'bg-rose-100 text-rose-900 border-rose-300 line-through'
              : isSubmittedOrConfirmed
              ? 'bg-purple-100 text-[#57068c] border-purple-200'
              : isPlanning
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          )}>
            {status}
          </span>
        </div>
      </div>

      {/* Stepper Track */}
      <div className="relative mt-4">
        {/* Connecting Progress Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -translate-y-1/2 z-0">
          <div
            className="h-full bg-[#57068c] transition-all duration-500"
            style={{
              width: isSubmittedOrConfirmed
                ? '80%'
                : isPlanning && deadlines.isEightWeekPast
                ? '50%'
                : isPlanning
                ? '30%'
                : '10%',
            }}
          />
        </div>

        {/* Steps Grid */}
        <div className="relative z-10 grid grid-cols-5 gap-2 text-center">
          {steps.map((step, idx) => {
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center group">
                {/* Step Circle Node */}
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all shadow-2xs text-xs font-bold',
                    step.isDone
                      ? 'border-[#57068c] bg-[#57068c] text-white'
                      : step.isWarning
                      ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-300 animate-bounce'
                      : step.isActive
                      ? 'border-amber-500 bg-amber-400 text-slate-950 ring-2 ring-amber-200'
                      : 'border-slate-300 bg-white text-slate-400'
                  )}
                >
                  {step.isDone ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : step.isWarning ? (
                    <AlertTriangle className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Step Info */}
                <div className="mt-2 space-y-0.5">
                  <span
                    className={cn(
                      'block text-[11px] font-extrabold leading-tight',
                      step.isDone
                        ? 'text-purple-950'
                        : step.isWarning
                        ? 'text-red-700'
                        : step.isActive
                        ? 'text-amber-950'
                        : 'text-slate-500'
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="block text-[9px] text-slate-600 font-medium leading-tight hidden sm:block">
                    {step.subtitle}
                  </span>
                  <span
                    className={cn(
                      'inline-block text-[9px] font-bold mt-0.5 px-1 py-0.2 rounded',
                      step.isWarning
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : step.isActive
                        ? 'bg-amber-100 text-amber-900'
                        : 'text-slate-600'
                    )}
                  >
                    {step.urgentText || step.dateLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
