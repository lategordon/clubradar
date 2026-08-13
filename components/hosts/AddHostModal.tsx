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
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ClubLeader } from '@/types/database.types';
import { User, Mail, FileText, UserPlus } from 'lucide-react';

interface AddHostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newLeader: Omit<ClubLeader, 'id' | 'created_at'>) => Promise<void>;
}

export function AddHostModal({ open, onOpenChange, onSave }: AddHostModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Event Host & Coordinator');
  const [email, setEmail] = useState('');
  const [badge, setBadge] = useState('Event Host');
  const [bio, setBio] = useState('');
  const [capacity, setCapacity] = useState('2 / 3 Planned');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase() || 'VL';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        role,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        avatar_initials: getInitials(name),
        badge,
        bio,
        assigned_events_count: 0,
        sla_compliance_rate: '100%',
        active_quarter_capacity: capacity,
      });

      // Reset form
      setName('');
      setEmail('');
      setBio('');
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving volunteer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-[#57068c]">
            <UserPlus className="h-4 w-4" />
          </span>
          <span>Add Group Volunteer</span>
        </DialogTitle>
        <DialogDescription>
          Add a volunteer or team member to your group roster.
        </DialogDescription>
      </DialogHeader>
      <DialogClose onClose={() => onOpenChange(false)} />

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-3.5 text-xs max-h-[80vh] overflow-y-auto pr-1">
          {/* Volunteer Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Volunteer Full Name *
            </label>
            <Input
              required
              placeholder="e.g. Leighton Gordon, Janice K., Marcus Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm font-semibold h-9 bg-white"
            />
          </div>

          {/* Role & Role Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Volunteer Role *
              </label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 text-xs font-medium"
              >
                <option value="Club Co-Lead & Operations">Club Co-Lead & Operations</option>
                <option value="VP of Programs & Events">VP of Programs & Events</option>
                <option value="Event Host & Coordinator">Event Host & Coordinator</option>
                <option value="Tech & Logistics Lead">Tech & Logistics Lead</option>
                <option value="Social & Community Chair">Social & Community Chair</option>
                <option value="Finance & Sponsorship Lead">Finance & Sponsorship Lead</option>
                <option value="Marketing & Outreach Lead">Marketing & Outreach Lead</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Badge Tag
              </label>
              <Input
                placeholder="e.g. Co-Lead, Event Host, Logistics, Social"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="text-xs font-medium h-9 bg-white"
              />
            </div>
          </div>

          {/* Email & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-purple-700" />
                <span>Email Address</span>
              </label>
              <Input
                type="email"
                placeholder="volunteer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs font-medium h-9 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Quarterly Target Capacity
              </label>
              <Input
                placeholder="e.g. 2 / 3 Planned"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="text-xs font-medium h-9 bg-white"
              />
            </div>
          </div>

          {/* Bio / Responsibilities */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Bio & Responsibilities</span>
            </label>
            <textarea
              rows={2}
              placeholder="Describe focus areas, venues, or responsibilities..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-purple-600 focus:outline-none"
            />
          </div>
        </DialogContent>

        <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="bg-[#57068c] hover:bg-[#460570] text-white font-bold text-xs"
          >
            {isSubmitting ? 'Saving...' : 'Add Volunteer'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
