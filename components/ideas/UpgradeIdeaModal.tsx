'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, Calendar, MapPin, DollarSign, User, AlertCircle, ArrowRight } from 'lucide-react';
import { EventIdea, EventRegion, AwarenessEvent, DatabaseEvent } from '@/types/database.types';
import { calculateEventDeadlines } from '@/lib/utils/deadlines';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface UpgradeIdeaModalProps {
  idea: EventIdea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmUpgrade: (ideaId: string, eventData: {
    eventDate: string;
    primaryHost: string;
    locationName: string;
    region: EventRegion;
    cost: number;
  }) => Promise<void>;
  awarenessEvents: AwarenessEvent[];
}

export function UpgradeIdeaModal({
  idea,
  open,
  onOpenChange,
  onConfirmUpgrade,
  awarenessEvents,
}: UpgradeIdeaModalProps) {
  const [eventDate, setEventDate] = useState('2026-11-12');
  const [primaryHost, setPrimaryHost] = useState('Leighton Gordon');
  const [locationName, setLocationName] = useState('San Francisco');
  const [region, setRegion] = useState<EventRegion>('SF');
  const [cost, setCost] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (idea) {
      setPrimaryHost(idea.submitted_by || 'Leighton Gordon');
      setRegion(idea.suggested_region || 'SF');
      setLocationName(idea.vendor_name || idea.location_name || (idea.suggested_region === 'South Bay' ? 'Palo Alto' : 'San Francisco'));
      setCost(idea.estimated_cost_tier?.includes('$') ? 25 : 0);
    }
  }, [idea]);

  // Calculated deadlines
  const deadlines = useMemo(() => {
    return calculateEventDeadlines(eventDate);
  }, [eventDate]);

  // Conflicts
  const detectedConflicts = useMemo(() => {
    if (!eventDate) return [];
    return awarenessEvents.filter(
      (a) => eventDate >= a.start_date && eventDate <= a.end_date
    );
  }, [eventDate, awarenessEvents]);

  if (!idea) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate) return;

    setIsSubmitting(true);
    try {
      await onConfirmUpgrade(idea.id, {
        eventDate,
        primaryHost,
        locationName,
        region,
        cost: Number(cost) || 0,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Upgrade error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-purple-100 p-1.5 text-purple-800">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Upgrade Idea to Official Event</DialogTitle>
            <DialogDescription>
              Assign a calendar date and lead host to transition <strong>"{idea.title}"</strong> into active planning.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogClose onClose={() => onOpenChange(false)} />

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          {/* Idea Pitch Summary Box */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 block">Idea Concept & Vendor:</span>
              {idea.time_period && (
                <span className="text-[11px] font-bold text-purple-800 bg-purple-100/90 px-2 py-0.5 rounded">
                  {idea.time_period}
                </span>
              )}
            </div>
            <p className="text-slate-700">{idea.description}</p>
            {idea.vendor_name && (
              <div className="text-[11px] font-semibold text-slate-800 pt-0.5">
                Vendor: <strong>{idea.vendor_name}</strong> {idea.vendor_website && `(${idea.vendor_website})`}
              </div>
            )}
            {idea.notes && (
              <div className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200/60 font-medium">
                Note: {idea.notes}
              </div>
            )}
            <div className="pt-0.5 text-[11px] text-purple-900 font-medium">
              Pitched by <strong>{idea.submitted_by}</strong> • {idea.upvotes} Upvotes
            </div>
          </div>

          {/* Grid: Event Date & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Official Event Date *
              </label>
              <Input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Region *
              </label>
              <Select
                value={region}
                onChange={(e) => setRegion(e.target.value as EventRegion)}
              >
                <option value="SF">SF (San Francisco)</option>
                <option value="East Bay">East Bay (Oakland / Berkeley)</option>
                <option value="South Bay">South Bay (Silicon Valley)</option>
                <option value="Virtual">Virtual / Remote</option>
                <option value="NYC">NYC</option>
              </Select>
            </div>
          </div>

          {/* Live Deadlines Calculation Card */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs space-y-1.5">
            <span className="font-bold text-purple-950 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-700" />
              Automated Lead-Time Milestones:
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1 text-purple-900 font-medium">
              <div className="rounded-md bg-white p-2 border border-purple-100">
                <span className="block text-[10px] uppercase font-bold text-purple-700">
                  8-Week Mark (Kickoff)
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {deadlines.eightWeekFormatted}
                </span>
              </div>
              <div className="rounded-md bg-white p-2 border border-purple-100">
                <span className="block text-[10px] uppercase font-bold text-purple-700">
                  6-Week Mark (Marketing Copy)
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {deadlines.sixWeekFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Conflicts notice if found */}
          {detectedConflicts.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                Awareness Conflict:
              </span>
              {detectedConflicts.map((c) => (
                <p key={c.id} className="text-[11px] text-amber-900/90 pl-5">
                  Overlaps with <strong>{c.title}</strong> ({c.category}).
                </p>
              ))}
            </div>
          )}

          {/* Location & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Venue / Location
              </label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Cost Per Person ($)
              </label>
              <Input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Primary Host */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Lead Committee Host
            </label>
            <Input
              value={primaryHost}
              onChange={(e) => setPrimaryHost(e.target.value)}
            />
          </div>
        </DialogContent>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#57068c] hover:bg-[#460570] text-white font-bold gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>{isSubmitting ? 'Promoting to Schedule...' : 'Promote to Schedule'}</span>
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
