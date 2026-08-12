'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { PitchIdeaModal } from '@/components/ideas/PitchIdeaModal';
import { UpgradeIdeaModal } from '@/components/ideas/UpgradeIdeaModal';
import {
  getEnrichedEvents,
  createEventIdea,
  upvoteEventIdea,
  promoteIdeaToEvent,
  deleteEventIdea,
  updateEventIdea,
} from '@/lib/data-service';
import { INITIAL_EVENT_IDEAS, INITIAL_AWARENESS_EVENTS } from '@/lib/mock-data';
import { EventIdea, AwarenessEvent, EventRegion } from '@/types/database.types';
import {
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  X,
  Building2,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  ExternalLink,
  ThumbsUp,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function IdeaBacklogView() {
  const [ideas, setIdeas] = useState<EventIdea[]>(INITIAL_EVENT_IDEAS);
  const [awarenessEvents, setAwarenessEvents] = useState<AwarenessEvent[]>(INITIAL_AWARENESS_EVENTS);
  const [loading, setLoading] = useState(false);

  // View mode: Grid vs. Table
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [selectedIdeaForUpgrade, setSelectedIdeaForUpgrade] = useState<EventIdea | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'upvotes' | 'newest' | 'title'>('upvotes');

  // Inline editing state for table
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<EventIdea>>({});

  // Load Data
  const loadData = async () => {
    try {
      const data = await getEnrichedEvents();
      setIdeas(data.ideas || []);
      setAwarenessEvents(data.awarenessEvents || []);
    } catch (err) {
      console.error('Error loading ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handlePitchIdea = async (newIdeaData: Omit<EventIdea, 'id' | 'created_at' | 'upvotes' | 'status'>) => {
    await createEventIdea(newIdeaData);
    await loadData();
  };

  const handleUpvote = async (ideaId: string) => {
    await upvoteEventIdea(ideaId, 'Leighton');
    await loadData();
  };

  const handleStartUpgrade = (idea: EventIdea) => {
    setSelectedIdeaForUpgrade(idea);
    setIsUpgradeModalOpen(true);
  };

  const handleConfirmUpgrade = async (
    ideaId: string,
    eventData: {
      eventDate: string;
      primaryHost: string;
      locationName: string;
      region: EventRegion;
      cost: number;
    }
  ) => {
    await promoteIdeaToEvent(
      ideaId,
      eventData.eventDate,
      eventData.primaryHost,
      eventData.cost,
      eventData.locationName,
      eventData.region
    );
    await loadData();
  };

  const handleDeleteIdea = async (id: string) => {
    if (confirm('Are you sure you want to remove this idea from the backlog?')) {
      await deleteEventIdea(id);
      await loadData();
    }
  };

  const handleSaveInlineEdit = async (id: string) => {
    await updateEventIdea(id, editFormData);
    setEditingIdeaId(null);
    setEditFormData({});
    await loadData();
  };

  // Filtered Ideas
  const filteredIdeas = useMemo(() => {
    const result = ideas.filter((idea) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (idea.title || '').toLowerCase().includes(q);
        const matchDesc = (idea.description || '').toLowerCase().includes(q);
        const matchVendor = (idea.vendor_name || '').toLowerCase().includes(q);
        const matchTime = (idea.time_period || '').toLowerCase().includes(q);
        const matchNotes = (idea.notes || '').toLowerCase().includes(q);
        const matchSubmitter = (idea.submitted_by || '').toLowerCase().includes(q);
        const matchTag = (idea.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchVendor && !matchTime && !matchNotes && !matchSubmitter && !matchTag) {
          return false;
        }
      }
      if (statusFilter !== 'All' && idea.status !== statusFilter) return false;
      if (regionFilter !== 'All' && idea.suggested_region !== regionFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
      if (sortBy === 'newest') return b.created_at.localeCompare(a.created_at);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [ideas, searchQuery, statusFilter, regionFilter, sortBy]);

  const readyCount = ideas.filter((i) => i.status === 'Ready to Plan').length;
  const promotedCount = ideas.filter((i) => i.status === 'Promoted').length;

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shadow-2xs">
              <Lightbulb className="h-5 w-5" />
            </span>
            <span>Event Ideas & Brainstorming Incubator</span>
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Capture potential event concepts, vendor partnerships, target time periods, and notes. Vote and upgrade ideas to the official calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer",
                viewMode === 'grid'
                  ? "bg-[#57068c] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
              title="Cards Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer",
                viewMode === 'table'
                  ? "bg-[#57068c] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
              title="Spreadsheet Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Button
            onClick={() => setIsPitchModalOpen(true)}
            className="bg-[#57068c] hover:bg-[#460570] text-white font-bold gap-1.5 text-xs shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Pitch New Idea</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Total Idea Backlog
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{ideas.length}</span>
            <span className="text-xs text-slate-500 font-semibold">Active concepts</span>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-purple-800">
            Ready to Plan (High Interest)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-950">{readyCount}</span>
            <span className="text-xs text-purple-700 font-semibold">Top voted</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
            Upgraded to Official Events
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950">{promotedCount}</span>
            <span className="text-xs text-emerald-700 font-semibold">On Calendar</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by idea, vendor, website, timeframe, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-purple-600"
              >
                <option value="All">All Statuses</option>
                <option value="Ready to Plan">Ready to Plan</option>
                <option value="Under Consideration">Under Consideration</option>
                <option value="Draft">Draft</option>
                <option value="Promoted">Promoted</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Region:</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-purple-600"
              >
                <option value="All">All Regions</option>
                <option value="SF">SF (San Francisco)</option>
                <option value="East Bay">East Bay</option>
                <option value="South Bay">South Bay</option>
                <option value="Virtual">Virtual</option>
                <option value="NYC">NYC</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-purple-600"
              >
                <option value="upvotes">Most Upvoted 👍</option>
                <option value="newest">Newest First</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: CARDS GRID */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onUpvote={handleUpvote}
              onUpgrade={handleStartUpgrade}
            />
          ))}

          {filteredIdeas.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Lightbulb className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No event ideas found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No ideas match your current search or filter criteria. Pitch a new event idea with a vendor or timeframe!
              </p>
              <Button
                onClick={() => setIsPitchModalOpen(true)}
                size="sm"
                className="mt-4 bg-[#57068c] hover:bg-[#460570] text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Pitch an Idea
              </Button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">Votes</th>
                  <th className="py-3 px-3 min-w-[200px]">Idea & Concept</th>
                  <th className="py-3 px-3 min-w-[160px]">Vendor / Venue</th>
                  <th className="py-3 px-3 min-w-[130px]">Target Timeframe</th>
                  <th className="py-3 px-3 min-w-[80px]">Region</th>
                  <th className="py-3 px-3 min-w-[180px]">Notes</th>
                  <th className="py-3 px-3 min-w-[90px]">Status</th>
                  <th className="py-3 px-3 min-w-[110px]">Pitched By</th>
                  <th className="py-3 px-3 min-w-[140px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIdeas.map((idea) => {
                  const isEditing = editingIdeaId === idea.id;
                  const isPromoted = idea.status === 'Promoted';
                  const hasUpvoted = (idea.upvoters || []).includes('Leighton');

                  return (
                    <tr
                      key={idea.id}
                      className={cn(
                        "transition-colors hover:bg-slate-50/70",
                        isPromoted ? "bg-emerald-50/20" : ""
                      )}
                    >
                      {/* Upvote column */}
                      <td className="py-3 px-3 text-center align-top">
                        <button
                          type="button"
                          onClick={() => handleUpvote(idea.id)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition-all cursor-pointer select-none",
                            hasUpvoted
                              ? "bg-[#57068c] text-white hover:bg-[#460570]"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          )}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>{idea.upvotes}</span>
                        </button>
                      </td>

                      {/* Idea Title & Description */}
                      <td className="py-3 px-3 align-top">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <Input
                              value={editFormData.title ?? idea.title}
                              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                              className="h-7 text-xs font-bold"
                            />
                            <textarea
                              value={editFormData.description ?? idea.description}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                              rows={2}
                              className="w-full text-xs p-1.5 border rounded border-slate-300"
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 block leading-snug">
                              {idea.title}
                            </span>
                            <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">
                              {idea.description}
                            </p>
                            {idea.tags && idea.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {idea.tags.map((t) => (
                                  <span key={t} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Vendor / Venue & Website */}
                      <td className="py-3 px-3 align-top">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input
                              placeholder="Vendor name"
                              value={editFormData.vendor_name ?? idea.vendor_name ?? ''}
                              onChange={(e) => setEditFormData({ ...editFormData, vendor_name: e.target.value })}
                              className="h-7 text-xs"
                            />
                            <Input
                              placeholder="Website URL"
                              value={editFormData.vendor_website ?? idea.vendor_website ?? ''}
                              onChange={(e) => setEditFormData({ ...editFormData, vendor_website: e.target.value })}
                              className="h-7 text-xs"
                            />
                          </div>
                        ) : (
                          <div>
                            {idea.vendor_name ? (
                              <span className="font-semibold text-slate-800 block flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-purple-700 shrink-0" />
                                <span>{idea.vendor_name}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Not specified</span>
                            )}
                            {idea.vendor_website && (
                              <a
                                href={idea.vendor_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-[#57068c] font-semibold hover:underline mt-0.5"
                              >
                                <span>Website</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Target Timeframe */}
                      <td className="py-3 px-3 align-top">
                        {isEditing ? (
                          <Input
                            value={editFormData.time_period ?? idea.time_period ?? ''}
                            onChange={(e) => setEditFormData({ ...editFormData, time_period: e.target.value })}
                            className="h-7 text-xs"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-purple-50 text-purple-900 px-2 py-0.5 rounded text-[11px]">
                            <Clock className="h-3 w-3 text-purple-600" />
                            <span>{idea.time_period || 'Flexible'}</span>
                          </span>
                        )}
                      </td>

                      {/* Region */}
                      <td className="py-3 px-3 align-top">
                        <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {idea.suggested_region}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3 align-top">
                        {isEditing ? (
                          <textarea
                            value={editFormData.notes ?? idea.notes ?? ''}
                            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                            rows={2}
                            className="w-full text-xs p-1.5 border rounded border-slate-300"
                          />
                        ) : (
                          <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">
                            {idea.notes || <span className="text-slate-400 italic">No notes added</span>}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 align-top">
                        <Badge
                          variant={
                            isPromoted
                              ? 'emerald'
                              : idea.status === 'Ready to Plan'
                              ? 'purple'
                              : idea.status === 'Under Consideration'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[10px] font-bold whitespace-nowrap"
                        >
                          {idea.status}
                        </Badge>
                      </td>

                      {/* Pitched By */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full bg-slate-800 text-[9px] font-bold text-white flex items-center justify-center">
                            {idea.submitted_avatar || idea.submitted_by.substring(0, 2).toUpperCase()}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 truncate">
                            {idea.submitted_by}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right align-top space-x-1 whitespace-nowrap">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(idea.id)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              title="Save changes"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingIdeaId(null);
                                setEditFormData({});
                              }}
                              className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            {!isPromoted && (
                              <Button
                                size="sm"
                                onClick={() => handleStartUpgrade(idea)}
                                className="h-7 px-2 bg-[#57068c] hover:bg-[#460570] text-white text-[11px] font-bold gap-1"
                              >
                                <Sparkles className="h-3 w-3 text-amber-300" />
                                <span>Upgrade</span>
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingIdeaId(idea.id);
                                setEditFormData({
                                  title: idea.title,
                                  description: idea.description,
                                  vendor_name: idea.vendor_name,
                                  vendor_website: idea.vendor_website,
                                  time_period: idea.time_period,
                                  notes: idea.notes,
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-purple-600 transition-colors"
                              title="Edit Idea"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteIdea(idea.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Idea"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pitch Idea Modal */}
      <PitchIdeaModal
        open={isPitchModalOpen}
        onOpenChange={setIsPitchModalOpen}
        onSave={handlePitchIdea}
      />

      {/* Upgrade Idea Modal */}
      <UpgradeIdeaModal
        idea={selectedIdeaForUpgrade}
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
        onConfirmUpgrade={handleConfirmUpgrade}
        awarenessEvents={awarenessEvents}
      />
    </div>
  );
}
