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
import { Badge } from '@/components/ui/badge';
import { ClubLeader, EnrichedEvent } from '@/types/database.types';
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HostDetailsModalProps {
  leader: ClubLeader | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: EnrichedEvent[];
  onSelectEvent: (event: EnrichedEvent) => void;
  onUpdateLeader: (id: string, updates: Partial<ClubLeader>) => Promise<void>;
}

export function HostDetailsModal({
  leader,
  open,
  onOpenChange,
  events,
  onSelectEvent,
  onUpdateLeader,
}: HostDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!leader) return null;

  const assignedEvents = events.filter(
    (e) =>
      e.primary_host.toLowerCase().includes(leader.name.toLowerCase()) ||
      e.co_hosts_list.some((h) => h.toLowerCase().includes(leader.name.toLowerCase()))
  );

  const startEdit = () => {
    setEditRole(leader.role);
    setEditBadge(leader.badge || '');
    setEditEmail(leader.email);
    setEditBio(leader.bio || '');
    setEditCapacity(leader.active_quarter_capacity || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateLeader(leader.id, {
        role: editRole,
        badge: editBadge,
        email: editEmail,
        bio: editBio,
        active_quarter_capacity: editCapacity,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Update leader error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-md bg-[#57068c]">
              {leader.avatar_initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-black text-slate-900">
                  {leader.name}
                </DialogTitle>
                {leader.badge && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold border-purple-200 text-[#57068c] bg-purple-50"
                  >
                    {leader.badge}
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-slate-600 font-semibold mt-0.5">
                {leader.role}
              </DialogDescription>
            </div>
          </div>
        </div>
      </DialogHeader>
      <DialogClose onClose={() => onOpenChange(false)} />

      <DialogContent className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase text-slate-500">
              SLA Compliance
            </span>
            <span className="text-base font-black text-emerald-700 mt-0.5 block">
              {leader.sla_compliance_rate || '100%'}
            </span>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase text-purple-900">
              Active Events
            </span>
            <span className="text-base font-black text-purple-950 mt-0.5 block">
              {assignedEvents.length} Planned
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase text-slate-500">
              Capacity Target
            </span>
            <span className="text-xs font-bold text-slate-800 mt-1 block truncate">
              {leader.active_quarter_capacity || 'Balanced'}
            </span>
          </div>
        </div>

        {/* Profile Details (View or Edit Mode) */}
        {isEditing ? (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950">
              Edit Volunteer Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Volunteer Role
                </label>
                <Input
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Badge Tag
                </label>
                <Input
                  value={editBadge}
                  onChange={(e) => setEditBadge(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Capacity Target
                </label>
                <Input
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Bio & Notes
              </label>
              <textarea
                rows={2}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:ring-1 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-7 text-xs bg-[#57068c] hover:bg-[#460570] text-white font-bold"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Volunteer Information
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={startEdit}
                className="h-7 text-xs text-purple-700 hover:text-purple-950 hover:bg-purple-50"
              >
                <Edit2 className="h-3 w-3 mr-1" /> Edit Info
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Role</span>
                <p className="font-bold text-slate-800">{leader.role}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                <a
                  href={`mailto:${leader.email}`}
                  className="font-bold text-[#57068c] hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{leader.email}</span>
                </a>
              </div>
            </div>

            {leader.bio && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                  Bio & Notes
                </span>
                <p className="text-slate-700 leading-relaxed">{leader.bio}</p>
              </div>
            )}
          </div>
        )}

        {/* Assigned Events Roster */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#57068c]" />
              <span>Assigned Events ({assignedEvents.length})</span>
            </span>
          </div>

          {assignedEvents.length > 0 ? (
            <div className="space-y-2">
              {assignedEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => {
                    onSelectEvent(evt);
                    onOpenChange(false);
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-3 hover:bg-purple-50/50 transition-all cursor-pointer shadow-2xs flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 group-hover:text-[#57068c] transition-colors">
                        {evt.title}
                      </span>
                      <Badge
                        variant={
                          evt.status === 'Submitted'
                            ? 'submitted'
                            : evt.status === 'Planning'
                            ? 'planning'
                            : 'confirmed'
                        }
                        className="text-[9px]"
                      >
                        {evt.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {evt.event_date} • {evt.location_name}
                    </p>
                  </div>

                  <span className="text-[11px] font-bold text-[#57068c] group-hover:underline flex items-center gap-1 shrink-0">
                    <span>View Event</span>
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-slate-500">
              <p className="text-xs italic">No events currently assigned to {leader.name}.</p>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
        <a
          href={`mailto:${leader.email}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#57068c] hover:underline"
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Send Direct Email</span>
        </a>
        <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
