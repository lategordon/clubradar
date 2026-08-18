'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { QuickInsightsSidebar } from '@/components/dashboard/QuickInsightsSidebar';
import { AddHostModal } from '@/components/hosts/AddHostModal';
import { HostDetailsModal } from '@/components/hosts/HostDetailsModal';
import { AssignEventModal } from '@/components/hosts/AssignEventModal';
import { HostMatrixTable } from '@/components/hosts/HostMatrixTable';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { ToastContainer, ToastMessage } from '@/components/ui/toast';
import {
  getEnrichedEvents,
  getClubLeaders,
  createClubLeader,
  updateClubLeader,
  deleteClubLeader,
  toggleTask,
  updateEvent,
} from '@/lib/data-service';
import {
  EnrichedEvent,
  TaskItem,
  ActivityLog,
  ClubLeader,
  EventStatus,
} from '@/types/database.types';
import {
  User,
  Plus,
  Search,
  Mail,
  Trash2,
  Table as TableIcon,
  LayoutGrid,
  Copy,
  Users,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function VolunteersPage() {
  const [leaders, setLeaders] = useState<ClubLeader[]>([]);
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  // Modals & Details
  const [isAddHostOpen, setIsAddHostOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<ClubLeader | null>(null);
  const [isLeaderDetailsOpen, setIsLeaderDetailsOpen] = useState(false);
  const [assignLeader, setAssignLeader] = useState<ClubLeader | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EnrichedEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    title: string,
    description?: string,
    type: 'success' | 'warning' | 'info' | 'purple' = 'purple'
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadData = async () => {
    try {
      const data = await getEnrichedEvents();
      setLeaders(data.leaders || []);
      setEvents(data.enrichedEvents || []);
      setTasks(data.tasks || []);
      setActivityLogs(data.activityLogs || []);
    } catch (err) {
      console.error('Error loading volunteer data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLeader = async (
    newLeaderData: Omit<ClubLeader, 'id' | 'created_at'>
  ) => {
    await createClubLeader(newLeaderData);
    await loadData();
    addToast(
      'Volunteer Added',
      `${newLeaderData.name} was added to your club volunteers.`,
      'success'
    );
  };

  const handleUpdateLeader = async (id: string, updates: Partial<ClubLeader>) => {
    await updateClubLeader(id, updates);
    await loadData();
    if (selectedLeader && selectedLeader.id === id) {
      setSelectedLeader((prev) => (prev ? { ...prev, ...updates } : null));
    }
    addToast('Profile Updated', 'Volunteer details saved successfully.', 'info');
  };

  const handleDeleteLeader = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from volunteers?`)) {
      await deleteClubLeader(id);
      await loadData();
      addToast('Volunteer Removed', `${name} was removed.`, 'warning');
    }
  };

  const handleAssignEvent = async (eventId: string, assignmentType: 'primary' | 'cohost') => {
    if (!assignLeader) return;
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    if (assignmentType === 'primary') {
      await updateEvent(eventId, { primary_host: assignLeader.name });
    } else {
      const currentCoHosts = targetEvent.co_hosts_list || [];
      if (!currentCoHosts.includes(assignLeader.name)) {
        const updatedCoHosts = [...currentCoHosts, assignLeader.name];
        await updateEvent(eventId, { co_hosts: updatedCoHosts });
      }
    }

    await loadData();
    addToast(
      'Event Assigned',
      `"${targetEvent.title}" assigned to ${assignLeader.name}.`,
      'success'
    );
  };

  const handleUpdateStatus = async (id: string, newStatus: EventStatus) => {
    await updateEvent(id, { status: newStatus });
    await loadData();
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    addToast('Status Advanced', `Event status moved to ${newStatus}.`, 'purple');
  };

  const getLeaderAssignedEvents = (leaderName: string) => {
    return events.filter(
      (e) =>
        e.primary_host.toLowerCase().includes(leaderName.toLowerCase()) ||
        e.co_hosts_list.some((h) => h.toLowerCase().includes(leaderName.toLowerCase()))
    );
  };

  // Filtered Leaders by Search
  const filteredLeaders = useMemo(() => {
    if (!searchQuery.trim()) return leaders;
    const q = searchQuery.toLowerCase();
    return leaders.filter((l) => {
      const matchName = l.name.toLowerCase().includes(q);
      const matchRole = l.role.toLowerCase().includes(q);
      const matchEmail = l.email.toLowerCase().includes(q);
      return matchName || matchRole || matchEmail;
    });
  }, [leaders, searchQuery]);

  // Copy email broadcast list
  const handleCopyEmailList = () => {
    const emailList = filteredLeaders
      .map((l) => l.email)
      .filter(Boolean)
      .join(', ');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailList);
      addToast(
        'Email List Copied',
        `Copied ${filteredLeaders.length} volunteer email addresses to clipboard.`,
        'success'
      );
    }
  };

  // Copy individual email
  const handleCopyIndividualEmail = (email: string, name: string) => {
    if (navigator.clipboard && email) {
      navigator.clipboard.writeText(email);
      addToast(
        'Email Copied',
        `${name}'s email (${email}) copied to clipboard.`,
        'success'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar activeTab="volunteers" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#57068c] text-white shadow-sm">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  <span>Volunteers</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100/90 px-2 py-0.5 rounded-full border border-purple-200">
                    {leaders.length} Active
                  </span>
                </h1>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Manage club volunteers, assign event slates, and track workload capacity meters.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyEmailList}
              className="text-xs font-bold text-slate-700 gap-1.5 shadow-2xs hover:bg-purple-50 hover:text-[#57068c] hover:border-purple-200 transition-all"
              title="Copy all volunteer emails"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Email List</span>
            </Button>

            <Button
              onClick={() => setIsAddHostOpen(true)}
              className="bg-[#57068c] hover:bg-[#460570] text-white font-bold text-xs gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Volunteer</span>
            </Button>
          </div>
        </div>

        {/* Search & View Toolbar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search volunteers by name, role, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-white text-[#57068c] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Compact Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer',
                viewMode === 'matrix'
                  ? 'bg-white text-[#57068c] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Workload Matrix Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Matrix</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Area: Compact Cards or Matrix Table */}
          <section className="lg:col-span-9">
            {viewMode === 'matrix' ? (
              <HostMatrixTable
                leaders={filteredLeaders}
                events={events}
                onSelectLeader={(leader) => {
                  setSelectedLeader(leader);
                  setIsLeaderDetailsOpen(true);
                }}
                onAssignEvent={(leader) => {
                  setAssignLeader(leader);
                  setIsAssignOpen(true);
                }}
                onDeleteLeader={handleDeleteLeader}
                onSelectEvent={(evt) => {
                  setSelectedEvent(evt);
                  setIsDetailsOpen(true);
                }}
                onCopyEmail={handleCopyIndividualEmail}
              />
            ) : (
              /* Compact, Simple 3-Column Volunteer Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredLeaders.map((leader) => {
                  const assignedEvents = getLeaderAssignedEvents(leader.name);
                  const count = assignedEvents.length;

                  return (
                    <div
                      key={leader.id}
                      onClick={() => {
                        setSelectedLeader(leader);
                        setIsLeaderDetailsOpen(true);
                      }}
                      className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between cursor-pointer space-y-3"
                    >
                      <div>
                        {/* Top: Avatar, Name & Role Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-2xs bg-[#57068c]">
                              {leader.avatar_initials}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-extrabold text-slate-900 text-xs truncate group-hover:text-[#57068c] transition-colors">
                                {leader.name}
                              </h3>
                              <p className="text-[11px] font-semibold text-slate-500 truncate">
                                {leader.role}
                              </p>
                            </div>
                          </div>

                          {leader.badge && (
                            <span className="rounded px-1.5 py-0.2 text-[9px] font-extrabold text-[#57068c] bg-purple-50 border border-purple-200 shrink-0 shadow-2xs">
                              {leader.badge}
                            </span>
                          )}
                        </div>

                        {/* Email with One-Click Copy */}
                        <div className="mt-2.5 text-[11px] text-slate-600 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <a
                              href={`mailto:${leader.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="truncate text-[#57068c] hover:underline font-medium"
                            >
                              {leader.email}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyIndividualEmail(leader.email, leader.name);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-[#57068c] hover:bg-purple-50 transition-all hover:scale-110 active:scale-95 shrink-0"
                            title="Copy email address"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Visual 3-Segment Capacity Meter */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-600">Quarterly Workload</span>
                            <span className={cn(
                              count >= 3
                                ? 'text-amber-800 font-extrabold'
                                : count >= 1
                                ? 'text-emerald-800 font-bold'
                                : 'text-slate-500'
                            )}>
                              {count} / 3 Planned {count >= 3 ? '(Full)' : count >= 1 ? '(Optimal)' : '(Available)'}
                            </span>
                          </div>
                          {/* Segmented meter bar */}
                          <div className="grid grid-cols-3 gap-1">
                            <div className={cn(
                              "h-1.5 rounded-full transition-colors",
                              count >= 1 ? "bg-emerald-500" : "bg-slate-200"
                            )} />
                            <div className={cn(
                              "h-1.5 rounded-full transition-colors",
                              count >= 2 ? "bg-emerald-500" : "bg-slate-200"
                            )} />
                            <div className={cn(
                              "h-1.5 rounded-full transition-colors",
                              count >= 3 ? "bg-amber-500" : "bg-slate-200"
                            )} />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Footer: Event Count Pill & Quick Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Calendar className="h-3 w-3 text-purple-700" />
                          <span>
                            {count} {count === 1 ? 'Event' : 'Events'}
                          </span>
                        </span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setAssignLeader(leader);
                              setIsAssignOpen(true);
                            }}
                            className="flex items-center gap-1 rounded bg-purple-50 hover:bg-purple-100 text-[#57068c] text-[10px] font-bold px-2 py-0.5 border border-purple-200 transition-colors cursor-pointer"
                            title="Assign Event"
                          >
                            <Plus className="h-2.5 w-2.5 stroke-[2.5]" />
                            <span>Assign</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLeader(leader.id, leader.name)}
                            className="rounded p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove volunteer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredLeaders.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
                <Users className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No volunteers found</h4>
                <p className="text-xs text-slate-500">
                  No volunteers match your search query.
                </p>
                <Button
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  className="text-xs"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </section>

          {/* Right Column: Quick Insights Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
            <QuickInsightsSidebar
              tasks={tasks}
              activityLogs={activityLogs}
              events={events}
              onToggleTask={async (id) => {
                const updated = await toggleTask(id);
                setTasks(updated);
              }}
              onSelectEvent={(evt) => {
                setSelectedEvent(evt);
                setIsDetailsOpen(true);
              }}
            />
          </aside>
        </div>
      </main>

      {/* Add Host / Volunteer Modal */}
      <AddHostModal
        open={isAddHostOpen}
        onOpenChange={setIsAddHostOpen}
        onSave={handleCreateLeader}
      />

      {/* Leader Profile Details Modal */}
      <HostDetailsModal
        leader={selectedLeader}
        open={isLeaderDetailsOpen}
        onOpenChange={setIsLeaderDetailsOpen}
        events={events}
        onSelectEvent={(evt) => {
          setSelectedEvent(evt);
          setIsDetailsOpen(true);
        }}
        onUpdateLeader={handleUpdateLeader}
      />

      {/* Assign Event Modal */}
      <AssignEventModal
        leader={assignLeader}
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        events={events}
        onAssign={handleAssignEvent}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
