'use client';

import React, { useState } from 'react';
import { Lightbulb, Sparkles, Building2, Globe, Clock, StickyNote, MapPin, Tag } from 'lucide-react';
import { EventIdea, EventRegion } from '@/types/database.types';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface PitchIdeaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newIdea: Omit<EventIdea, 'id' | 'created_at' | 'upvotes' | 'status'>) => Promise<void>;
}

export function PitchIdeaModal({
  open,
  onOpenChange,
  onSave,
}: PitchIdeaModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorWebsite, setVendorWebsite] = useState('');
  const [timePeriod, setTimePeriod] = useState('October 2026');
  const [notes, setNotes] = useState('');
  const [locationName, setLocationName] = useState('');
  const [suggestedRegion, setSuggestedRegion] = useState<EventRegion>('SF');
  const [submittedBy, setSubmittedBy] = useState('Leighton Gordon');
  const [costTier, setCostTier] = useState<'Free' | '$ (Under $25)' | '$$ ($25-$60)' | '$$$ ($60+)'>('Free');
  const [tagsInput, setTagsInput] = useState('Social, Networking');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const avatar = submittedBy.toLowerCase().includes('leighton')
        ? 'L&A'
        : submittedBy.toLowerCase().includes('janice')
        ? 'J'
        : submittedBy.toLowerCase().includes('tammy')
        ? 'T'
        : submittedBy.substring(0, 2).toUpperCase();

      await onSave({
        title,
        description,
        vendor_name: vendorName,
        vendor_website: vendorWebsite,
        time_period: timePeriod,
        notes,
        location_name: locationName,
        suggested_region: suggestedRegion,
        submitted_by: submittedBy,
        submitted_avatar: avatar,
        tags,
        estimated_cost_tier: costTier,
      });

      // Reset
      setTitle('');
      setDescription('');
      setVendorName('');
      setVendorWebsite('');
      setNotes('');
      setLocationName('');
      onOpenChange(false);
    } catch (err) {
      console.error('Save idea error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-100 p-1.5 text-amber-800">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Pitch an Event Idea</DialogTitle>
            <DialogDescription>
              Record potential event concepts with proposed vendor partnerships, target timeframes, and notes.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogClose onClose={() => onOpenChange(false)} />

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          {/* Idea Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Event Idea / Title *
            </label>
            <Input
              required
              placeholder="e.g. Silicon Valley AI Founder Panel, Sunset Rooftop Jazz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-semibold"
            />
          </div>

          {/* Description Pitch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Concept & Event Format *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Describe the format, target alumni audience, or unique draw..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-xs focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Grid: Vendor Name & Vendor Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-purple-700" />
                <span>Vendor / Venue / Company Name</span>
              </label>
              <Input
                placeholder="e.g. SHACK15, Charmaine's, Wayfare Tavern"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Globe className="h-3 w-3 text-purple-700" />
                <span>Vendor Website / Link</span>
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={vendorWebsite}
                onChange={(e) => setVendorWebsite(e.target.value)}
              />
            </div>
          </div>

          {/* Grid: Time Period & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-700" />
                <span>Target Time Period</span>
              </label>
              <Input
                placeholder="e.g. October 2026, Fall 2026, Q1 2027"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Region
              </label>
              <Select
                value={suggestedRegion}
                onChange={(e) => setSuggestedRegion(e.target.value as EventRegion)}
              >
                <option value="SF">SF (San Francisco)</option>
                <option value="East Bay">East Bay (Oakland / Berkeley)</option>
                <option value="South Bay">South Bay (Silicon Valley)</option>
                <option value="Virtual">Virtual / Remote</option>
                <option value="NYC">NYC</option>
              </Select>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <StickyNote className="h-3 w-3 text-amber-700" />
              <span>Notes & Pricing / Catering Details</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Inquired with manager: $35/person minimum, capacity 50, need deposit 4 weeks prior..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-xs focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Grid: Cost Tier & Submitter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Estimated Cost Tier
              </label>
              <Select
                value={costTier}
                onChange={(e) => setCostTier(e.target.value as any)}
              >
                <option value="Free">Free / Club Sponsored</option>
                <option value="$ (Under $25)">$ (Under $25)</option>
                <option value="$$ ($25-$60)">$$ ($25-$60)</option>
                <option value="$$$ ($60+)">$$$ ($60+)</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Pitched By (Club Leader)
              </label>
              <Select
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
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
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Tags (comma separated)
            </label>
            <Input
              placeholder="e.g. Tech & AI, Networking, Live Music, Wine"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
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
            className="bg-[#57068c] hover:bg-[#450570] text-white font-bold"
          >
            {isSubmitting ? 'Saving Idea...' : 'Pitch Idea'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
