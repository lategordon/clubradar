'use client';

import React, { useState, useMemo } from 'react';
import { Sparkles, Calendar, MapPin, DollarSign, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DatabaseEvent, EventStatus, EventRegion, AwarenessEvent } from '@/types/database.types';
import { calculateEventDeadlines } from '@/lib/utils/deadlines';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  awarenessEvents: AwarenessEvent[];
}

export function AddEventModal({
  open,
  onOpenChange,
  onSave,
  awarenessEvents,
}: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-11-20');
  const [status, setStatus] = useState<EventStatus>('Planning');
  const [locationName, setLocationName] = useState('San Francisco');
  const [region, setRegion] = useState<EventRegion>('SF');
  const [costPerPerson, setCostPerPerson] = useState<number>(0);
  const [primaryHost, setPrimaryHost] = useState('Leighton Gordon');
  const [coHosts, setCoHosts] = useState('Adi');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute 8w and 6w deadlines dynamically
  const deadlines = useMemo(() => {
    return calculateEventDeadlines(eventDate);
  }, [eventDate]);

  // Check for conflicts with awareness events
  const detectedConflicts = useMemo(() => {
    if (!eventDate) return [];
    return awarenessEvents.filter(
      (a) => eventDate >= a.start_date && eventDate <= a.end_date
    );
  }, [eventDate, awarenessEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    setIsSubmitting(true);
    try {
      const coHostsArray = coHosts
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);

      await onSave({
        title,
        event_date: eventDate,
        status,
        location_name: locationName,
        region,
        cost_per_person: Number(costPerPerson) || 0,
        primary_host: primaryHost,
        co_hosts: coHostsArray,
        notes,
        workflow_progress_current: status === 'Submitted' ? 14 : status === 'Planning' ? 5 : 0,
        workflow_progress_total: 14,
      });

      // Reset form
      setTitle('');
      setNotes('');
      onOpenChange(false);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Add New Alumni Event</DialogTitle>
        <DialogDescription>
          Plan a new NYU Bay Area alumni event. 8-week and 6-week workflow deadlines will be computed automatically.
        </DialogDescription>
      </DialogHeader>
      <DialogClose onClose={() => onOpenChange(false)} />

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          {/* Event Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Event Title *
            </label>
            <Input
              required
              placeholder="e.g. SF Tech Week Happy Hour, Young Alumni Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-medium"
            />
          </div>

          {/* Grid: Event Date & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Event Date *
              </label>
              <Input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-sm font-medium"
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
                <option value="NYC">NYC (Campus / Quad)</option>
              </Select>
            </div>
          </div>

          {/* Computed Deadlines Banner */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-purple-950">
              <Sparkles className="h-4 w-4 text-purple-700" />
              <span>Automated Workflow Deadlines:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-purple-900 font-medium">
              <div className="rounded-md bg-white p-2 border border-purple-100 shadow-2xs">
                <span className="block text-[10px] uppercase font-bold text-purple-700">
                  8-Week Mark (Begin Process)
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {deadlines.eightWeekFormatted || 'Select Date'}
                </span>
              </div>
              <div className="rounded-md bg-white p-2 border border-purple-100 shadow-2xs">
                <span className="block text-[10px] uppercase font-bold text-purple-700">
                  6-Week Mark (Submit Copy)
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {deadlines.sixWeekFormatted || 'Select Date'}
                </span>
              </div>
            </div>
          </div>

          {/* Awareness Conflict Warning if found */}
          {detectedConflicts.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <span>Awareness & Conflict Notice:</span>
              </div>
              {detectedConflicts.map((c) => (
                <p key={c.id} className="text-xs text-amber-900/90 pl-5">
                  Overlaps with <strong>{c.title}</strong> ({c.category}). Consider synergy or high venue demand.
                </p>
              ))}
            </div>
          )}

          {/* Grid: Status & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Status
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
              >
                <option value="Idea">Idea</option>
                <option value="Planning">Planning</option>
                <option value="Submitted">Submitted (Marketing)</option>
                <option value="Confirmed">Confirmed</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Cost Per Person ($)
              </label>
              <Input
                type="number"
                min="0"
                step="5"
                placeholder="0"
                value={costPerPerson}
                onChange={(e) => setCostPerPerson(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Location / Venue
            </label>
            <Input
              placeholder="e.g. Sightglass Coffee, Mission Dolores Park, FiDi Penthouse"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          {/* Hosts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Primary Host
              </label>
              <Input
                value={primaryHost}
                onChange={(e) => setPrimaryHost(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Co-hosts (comma separated)
              </label>
              <Input
                placeholder="Adi, Brian T."
                value={coHosts}
                onChange={(e) => setCoHosts(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Event Notes & Target Audience
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key objectives, venue contact info, or catering requirements..."
              className="flex w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
            className="bg-[#57068c] hover:bg-[#460570] text-white"
          >
            {isSubmitting ? 'Creating Event...' : 'Create Event'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
