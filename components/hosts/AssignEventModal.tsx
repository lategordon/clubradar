'use client';

import React, { useState } from 'react';
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
import { Select } from '@/components/ui/select';
import { ClubLeader, EnrichedEvent } from '@/types/database.types';
import { Calendar, User, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignEventModalProps {
  leader: ClubLeader | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: EnrichedEvent[];
  onAssign: (eventId: string, assignmentType: 'primary' | 'cohost') => Promise<void>;
}

export function AssignEventModal({
  leader,
  open,
  onOpenChange,
  events,
  onAssign,
}: AssignEventModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'primary' | 'cohost'>('primary');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!leader) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    setIsSubmitting(true);
    try {
      await onAssign(selectedEventId, assignmentType);
      setSelectedEventId('');
      onOpenChange(false);
    } catch (err) {
      console.error('Assign error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white shadow-2xs bg-[#57068c]">
            {leader.avatar_initials}
          </div>
          <div>
            <DialogTitle>Assign Event to {leader.name}</DialogTitle>
            <DialogDescription>
              Allocate an active alumni event to this volunteer as Primary Host or Co-Host.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogClose onClose={() => onOpenChange(false)} />

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4 text-xs">
          {/* Leader Summary Pill */}
          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-slate-900 text-xs">{leader.name}</span>
              <p className="text-[11px] text-slate-600 font-medium">{leader.role}</p>
            </div>
            {leader.badge && (
              <span className="rounded-md px-2 py-0.5 text-[10px] font-extrabold text-[#57068c] bg-purple-100 border border-purple-200">
                {leader.badge}
              </span>
            )}
          </div>

          {/* Select Event */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-purple-700" />
              <span>Select Event to Assign *</span>
            </label>
            <Select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="text-xs h-9 font-medium"
            >
              <option value="">-- Choose an event from the schedule --</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.event_date}) — Current Host: {evt.primary_host} [{evt.status}]
                </option>
              ))}
            </Select>
          </div>

          {/* Assignment Role */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-purple-700" />
              <span>Assignment Role *</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setAssignmentType('primary')}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all cursor-pointer',
                  assignmentType === 'primary'
                    ? 'border-[#57068c] bg-purple-50/80 ring-2 ring-purple-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <span className="block font-bold text-slate-900 text-xs">Primary Host</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Takes lead on venue lock, 8w kickoff, and 6w copy submission.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentType('cohost')}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all cursor-pointer',
                  assignmentType === 'cohost'
                    ? 'border-[#57068c] bg-purple-50/80 ring-2 ring-purple-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <span className="block font-bold text-slate-900 text-xs">Co-Host / Support</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Assists with on-site check-in, marketing amplification, and logistics.
                </span>
              </button>
            </div>
          </div>
        </DialogContent>

        <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedEventId}
            className="bg-[#57068c] hover:bg-[#460570] text-white font-bold text-xs"
          >
            {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
