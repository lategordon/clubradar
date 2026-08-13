'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  Sparkles,
  Calendar,
  MapPin,
  DollarSign,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowRight,
  Send,
  PartyPopper,
  Copy,
} from 'lucide-react';
import { EnrichedEvent, EventStatus } from '@/types/database.types';
import { WorkflowLeadTimeStepper } from '@/components/events/WorkflowLeadTimeStepper';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventDetailsModalProps {
  event: EnrichedEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, newStatus: EventStatus) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
}

export function EventDetailsModal({
  event,
  open,
  onOpenChange,
  onUpdateStatus,
  onDuplicate,
}: EventDetailsModalProps) {
  if (!event) return null;

  const formattedDate = format(parseISO(event.event_date), 'EEEE, MMMM d, yyyy');

  // Determine next stage
  const getNextStage = (current: EventStatus): EventStatus | null => {
    if (current === 'Idea') return 'Planning';
    if (current === 'Planning') return 'Submitted';
    if (current === 'Submitted') return 'Confirmed';
    if (current === 'Confirmed') return 'Completed';
    return null;
  };

  const nextStage = getNextStage(event.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center justify-between pr-6">
          <Badge
            variant={
              event.status === 'Submitted'
                ? 'submitted'
                : event.status === 'Planning'
                ? 'planning'
                : event.status === 'Confirmed'
                ? 'confirmed'
                : 'idea'
            }
            className="text-xs font-bold"
          >
            {event.status}
          </Badge>
          <span className="text-xs text-slate-500 font-semibold">{event.region} Region</span>
        </div>
        <DialogTitle className="text-xl font-extrabold text-slate-900 mt-1">
          {event.title}
        </DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-[#57068c]" />
            <span>{formattedDate}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[#57068c]" />
            <span>{event.location_name}</span>
          </span>
        </DialogDescription>
      </DialogHeader>
      <DialogClose onClose={() => onOpenChange(false)} />

      <DialogContent className="space-y-4 text-xs">
        {/* Visual 5-Stage Lead-Time Milestone Stepper */}
        <WorkflowLeadTimeStepper event={event} />

        {/* Action Bar: Next Stage Promotion */}
        {nextStage && (
          <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/70 p-3 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-purple-950">Next Stage in Pipeline:</span>
              <p className="text-[11px] text-purple-800 font-medium">
                {nextStage === 'Submitted'
                  ? 'Submit marketing copy to NYU Alumni Relations for promotion blast'
                  : nextStage === 'Confirmed'
                  ? 'RSVP link active and venue reservation locked'
                  : `Advance stage to ${nextStage}`}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onUpdateStatus(event.id, nextStage)}
              className="bg-[#57068c] hover:bg-[#460570] text-white font-bold text-xs gap-1.5 shadow-xs"
            >
              <span>Advance to {nextStage}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Conflicts / Awareness overlaps */}
        {event.conflicts.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Potential Awareness Synergy / Conflict
            </span>
            {event.conflicts.map((c) => (
              <div key={c.id} className="pl-5 text-xs text-amber-900">
                • <strong>{c.title}</strong> ({c.start_date} to {c.end_date}): {c.notes || c.category}
              </div>
            ))}
          </div>
        )}

        {/* Host & Cost Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Hosts</span>
            <p className="font-bold text-slate-900 mt-0.5">{event.primary_host}</p>
            {event.co_hosts_list.length > 0 && (
              <p className="text-[11px] text-slate-600">Co-hosts: {event.co_hosts_list.join(', ')}</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Cost Per Person</span>
            <p className="font-bold text-slate-900 mt-0.5">
              {event.cost_per_person > 0 ? `$${event.cost_per_person.toFixed(2)}` : 'Free / Club Sponsored'}
            </p>
          </div>
        </div>

        {/* Annual Stipend Subsidy Details */}
        {(event.budgeted_subsidy !== undefined || event.actual_subsidy !== undefined) && (
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-purple-950">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-[#57068c]" />
                <span>Annual $5,000 Stipend Allocation</span>
              </span>
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-purple-200 text-[#57068c]">
                Fiscal Year Budget
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Budgeted Subsidy:</span>
                <span className="font-mono font-bold text-slate-900">
                  ${(event.budgeted_subsidy || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Actual Subsidy Used:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {event.actual_subsidy !== null && event.actual_subsidy !== undefined
                    ? `$${Number(event.actual_subsidy).toFixed(2)}`
                    : 'Pending / In Progress'}
                </span>
              </div>
            </div>
            {event.budget_notes && (
              <p className="text-[11px] text-slate-600 italic pt-1 border-t border-purple-100">
                Note: {event.budget_notes}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Notes & Details</span>
            <p className="text-slate-700 leading-relaxed">{event.notes}</p>
          </div>
        )}

        {/* Manual Status Override */}
        <div className="pt-2 border-t border-slate-100">
          <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
            Set Specific Status
          </span>
          <div className="flex flex-wrap gap-2">
            {(['Idea', 'Planning', 'Submitted', 'Confirmed'] as EventStatus[]).map((st) => (
              <Button
                key={st}
                size="sm"
                variant={event.status === st ? 'nyu' : 'outline'}
                onClick={() => onUpdateStatus(event.id, st)}
                className="text-xs h-7"
              >
                {st}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>

      <DialogFooter className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {onDuplicate && (
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await onDuplicate(event.id);
              onOpenChange(false);
            }}
            className="text-xs font-bold text-purple-900 border-purple-200 hover:bg-purple-50 gap-1.5"
          >
            <Copy className="h-3.5 w-3.5 text-[#57068c]" />
            <span>Duplicate / Copy Event</span>
          </Button>
        )}
        <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
