'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Building2,
  DollarSign,
  User,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Repeat,
  Copy,
  FileText,
} from 'lucide-react';
import { DatabaseEvent, EventStatus, EventRegion, AwarenessEvent } from '@/types/database.types';
import { calculateEventDeadlines } from '@/lib/utils/deadlines';
import { calculateNextOccurrence, generateRecurringDates, RecurrencePattern } from '@/lib/utils/recurring';
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
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  awarenessEvents: AwarenessEvent[];
  initialData?: Partial<DatabaseEvent>;
}

export function AddEventModal({
  open,
  onOpenChange,
  onSave,
  awarenessEvents,
  initialData,
}: AddEventModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [eventDate, setEventDate] = useState(initialData?.event_date || '2026-11-20');
  const [status, setStatus] = useState<EventStatus>(initialData?.status || 'Planning');
  const [locationName, setLocationName] = useState(initialData?.location_name || 'San Francisco');
  const [venueName, setVenueName] = useState(initialData?.venue_name || '');
  const [region, setRegion] = useState<EventRegion>(initialData?.region || 'SF');
  const [costPerPerson, setCostPerPerson] = useState<number>(initialData?.cost_per_person || 0);
  const [primaryHost, setPrimaryHost] = useState(initialData?.primary_host || 'Leighton Gordon');
  const [coHosts, setCoHosts] = useState(
    Array.isArray(initialData?.co_hosts)
      ? initialData.co_hosts.join(', ')
      : initialData?.co_hosts || ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [budgetedSubsidy, setBudgetedSubsidy] = useState<number>(initialData?.budgeted_subsidy || 0);
  const [budgetNotes, setBudgetNotes] = useState(initialData?.budget_notes || '');

  // Recurrence Series State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('monthly_first_friday');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(3);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute preview recurring dates
  const previewRecurringDates = useMemo(() => {
    if (!isRecurring || !eventDate) return [];
    return generateRecurringDates(eventDate, recurrencePattern, recurrenceCount);
  }, [isRecurring, eventDate, recurrencePattern, recurrenceCount]);

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

      // Construct display location
      const combinedLocation = venueName.trim()
        ? `${venueName.trim()} (${locationName.trim() || 'San Francisco'})`
        : locationName.trim() || 'San Francisco';

      if (isRecurring && previewRecurringDates.length > 0) {
        const seriesId = `series-${Date.now()}`;
        for (let i = 0; i < previewRecurringDates.length; i++) {
          const d = previewRecurringDates[i];
          await onSave({
            title: title.trim(),
            event_date: d,
            status,
            location_name: combinedLocation,
            venue_name: venueName.trim() || undefined,
            region,
            cost_per_person: Number(costPerPerson) || 0,
            budgeted_subsidy: Number(budgetedSubsidy) || 0,
            budget_notes: budgetNotes.trim() || undefined,
            primary_host: primaryHost,
            co_hosts: coHostsArray,
            notes: notes.trim(),
            is_recurring: true,
            recurrence_pattern: recurrencePattern,
            recurrence_series_id: seriesId,
            workflow_progress_current: status === 'Submitted' || status === 'Confirmed' ? 14 : status === 'Planning' ? 5 : 0,
            workflow_progress_total: 14,
          });
        }
      } else {
        await onSave({
          title: title.trim(),
          event_date: eventDate,
          status,
          location_name: combinedLocation,
          venue_name: venueName.trim() || undefined,
          region,
          cost_per_person: Number(costPerPerson) || 0,
          budgeted_subsidy: Number(budgetedSubsidy) || 0,
          budget_notes: budgetNotes.trim() || undefined,
          primary_host: primaryHost,
          co_hosts: coHostsArray,
          notes: notes.trim(),
          workflow_progress_current: status === 'Submitted' || status === 'Confirmed' ? 14 : status === 'Planning' ? 5 : 0,
          workflow_progress_total: 14,
        });
      }

      // Reset form
      setTitle('');
      setVenueName('');
      setLocationName('San Francisco');
      setBudgetedSubsidy(0);
      setBudgetNotes('');
      setNotes('');
      setIsRecurring(false);
      setCoHosts('');
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
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-[#57068c]">
            <CalendarIcon className="h-4 w-4" />
          </span>
          <div>
            <DialogTitle>Add New Alumni Event</DialogTitle>
            <DialogDescription>
              Schedule single or recurring club events with automated 8w/6w SLA lead-time compliance and venue conflict radar.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogClose onClose={() => onOpenChange(false)} />

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-3.5 text-xs max-h-[82vh] overflow-y-auto pr-1">
          {/* Row 1: Event Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Event Title *
            </label>
            <Input
              required
              placeholder="e.g. First Friday Happy Hour, Annual Alumni Gala, Founders Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-semibold h-9 bg-white"
            />
          </div>

          {/* Row 2: Event Date & Regional Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5 text-purple-700" />
                <span>Event Date (or Series Start) *</span>
              </label>
              <Input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-xs font-medium h-9 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-purple-700" />
                <span>Regional Zone *</span>
              </label>
              <Select
                value={region}
                onChange={(e) => setRegion(e.target.value as EventRegion)}
                className="h-9 text-xs font-medium"
              >
                <option value="SF">SF (San Francisco)</option>
                <option value="East Bay">East Bay (Oakland / Berkeley)</option>
                <option value="South Bay">South Bay (Silicon Valley / Morgan Hill)</option>
                <option value="Virtual">Virtual / Remote</option>
                <option value="NYC">NYC (Campus / Metro)</option>
              </Select>
            </div>
          </div>

          {/* Row: Recurring Event Series Option */}
          <div className="rounded-xl border border-purple-200/80 bg-purple-50/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="recurring_toggle" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="recurring_toggle"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#57068c] focus:ring-purple-600 cursor-pointer"
                />
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Repeat className="h-3.5 w-3.5 text-[#57068c]" />
                  <span>Make this a Recurring Event Series</span>
                </span>
              </label>
              {isRecurring && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                  {previewRecurringDates.length} Events to Create
                </span>
              )}
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-purple-100 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Recurrence Frequency
                    </label>
                    <Select
                      value={recurrencePattern}
                      onChange={(e) => setRecurrencePattern(e.target.value as RecurrencePattern)}
                      className="h-8 text-xs bg-white font-medium"
                    >
                      <option value="monthly_first_friday">Monthly (First Friday of the Month)</option>
                      <option value="monthly">Monthly (Same Day Each Month)</option>
                      <option value="biweekly">Bi-Weekly (Every 2 Weeks)</option>
                      <option value="quarterly">Quarterly (Every 3 Months)</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Number of Future Occurrences
                    </label>
                    <Select
                      value={recurrenceCount.toString()}
                      onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                      className="h-8 text-xs bg-white font-medium"
                    >
                      <option value="3">Next 3 Occurrences (1 Quarter)</option>
                      <option value="6">Next 6 Occurrences (Half Year)</option>
                      <option value="12">Next 12 Occurrences (Full Year)</option>
                    </Select>
                  </div>
                </div>

                {/* Dates Preview */}
                <div className="rounded-lg bg-white p-2.5 border border-purple-100 text-[11px] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Generated Series Dates:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewRecurringDates.map((dStr, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-100"
                      >
                        #{idx + 1}: {dStr}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    *Each event is saved with SLA compliance deadlines. You can customize the venue or location for individual months at any time.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Automated SLA Lead-Time Pill Banner */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-purple-950">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-700" />
                <span>Automated SLA Lead Times</span>
              </span>
              <span className="text-[10px] font-semibold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded">
                NYU Marketing SLA
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg bg-white p-2 border border-purple-100 shadow-2xs">
                <span className="block text-[10px] uppercase font-bold text-purple-700">
                  8-Week Kickoff (56d prior)
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {deadlines.eightWeekFormatted || 'Select Date'}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-purple-100 shadow-2xs">
                <span className="block text-[10px] uppercase font-bold text-purple-700">
                  6-Week Copy Due (42d prior)
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {deadlines.sixWeekFormatted || 'Select Date'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 4: Awareness Conflict Warning if found */}
          {detectedConflicts.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <span>City Awareness & Conflict Notice:</span>
              </div>
              {detectedConflicts.map((c) => (
                <p key={c.id} className="text-xs text-amber-900/90 pl-5">
                  Overlaps with <strong>{c.title}</strong> ({c.category}). High venue demand expected.
                </p>
              ))}
            </div>
          )}

          {/* Row 5: Location (City) & Venue (Specific Landmark) Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-purple-700" />
                <span>City / Location *</span>
              </label>
              <Input
                required
                placeholder="e.g. San Francisco, Morgan Hill, Berkeley, Palo Alto"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="text-xs font-medium h-9 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-purple-700" />
                <span>Venue / Landmark</span>
              </label>
              <Input
                placeholder="e.g. Oracle Park, Sightglass Coffee, SHACK15"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="text-xs font-medium h-9 bg-white"
              />
            </div>
          </div>

          {/* Row 6: Primary Host & Co-Hosts Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-purple-700" />
                <span>Primary Host *</span>
              </label>
              <Select
                value={primaryHost}
                onChange={(e) => setPrimaryHost(e.target.value)}
                className="h-9 text-xs font-medium"
              >
                <option value="Leighton Gordon">Leighton Gordon (Club Co-Lead)</option>
                <option value="Janice K.">Janice K. (VP Programs)</option>
                <option value="Marcus Vance">Marcus Vance (Tech Lead)</option>
                <option value="Priya Sharma">Priya Sharma (Social Chair)</option>
                <option value="David Chen">David Chen (Finance Lead)</option>
                <option value="Tammy Chen">Tammy Chen (Mentorship Lead)</option>
                <option value="Adi">Adi (Community Lead)</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span>Co-Hosts (Optional)</span>
              </label>
              <Input
                placeholder="e.g. Marcus Vance, Janice K., Adi"
                value={coHosts}
                onChange={(e) => setCoHosts(e.target.value)}
                className="text-xs font-medium h-9 bg-white"
              />
            </div>
          </div>

          {/* Row 7: Status & Cost Per Person Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Lifecycle Stage *
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="h-9 text-xs font-medium"
              >
                <option value="Idea">Idea Pitch</option>
                <option value="Planning">Planning (8w Kickoff)</option>
                <option value="Submitted">Submitted (6w Marketing)</option>
                <option value="Confirmed">Confirmed</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span>Cost Per Person ($)</span>
              </label>
              <Input
                type="number"
                min="0"
                step="5"
                placeholder="0 (Free / Sponsored)"
                value={costPerPerson}
                onChange={(e) => setCostPerPerson(Number(e.target.value))}
                className="text-xs font-medium h-9 bg-white"
              />
            </div>
          </div>

          {/* Row 8: Budget Subsidy Deduction ($5,000 Stipend) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-purple-100 bg-purple-50/40">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-[#57068c]" />
                <span>Budgeted Subsidy ($)</span>
              </label>
              <Input
                type="number"
                min="0"
                step="10"
                placeholder="e.g. 150 (deducted from $5,000)"
                value={budgetedSubsidy || ''}
                onChange={(e) => setBudgetedSubsidy(Number(e.target.value))}
                className="text-xs font-medium h-9 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Subsidy to allocate from annual $5k stipend.
              </span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Budget Notes / Co-Sponsors
              </label>
              <Input
                placeholder="e.g. Catering deposit, shared with Stern"
                value={budgetNotes}
                onChange={(e) => setBudgetNotes(e.target.value)}
                className="text-xs font-medium h-9 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Optional accounting memo.
              </span>
            </div>
          </div>

          {/* Row 9: Notes & Objectives */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Event Notes & Target Audience</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key objectives, catering minimums, venue contact details, or target alumni demographic..."
              className="flex w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 shadow-2xs focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>
        </DialogContent>

        <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="bg-[#57068c] hover:bg-[#460570] text-white font-bold text-xs shadow-xs"
          >
            {isSubmitting ? 'Creating Event...' : 'Create Event'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
