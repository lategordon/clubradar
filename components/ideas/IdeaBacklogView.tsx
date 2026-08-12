'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  GripVertical,
  Columns3,
  SlidersHorizontal,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface VisibleIdeaColumns {
  votes: boolean;
  concept: boolean;
  vendor: boolean;
  timeframe: boolean;
  region: boolean;
  notes: boolean;
  status: boolean;
  submitter: boolean;
  actions: boolean;
}

const DEFAULT_VISIBLE_COLUMNS: VisibleIdeaColumns = {
  votes: true,
  concept: true,
  vendor: true,
  timeframe: true,
  region: true,
  notes: true,
  status: true,
  submitter: true,
  actions: true,
};

export function IdeaBacklogView() {
  const [ideas, setIdeas] = useState<EventIdea[]>(INITIAL_EVENT_IDEAS);
  const [awarenessEvents, setAwarenessEvents] = useState<AwarenessEvent[]>(INITIAL_AWARENESS_EVENTS);
  const [loading, setLoading] = useState(false);

  // View mode: Grid vs. Table (defaults to table view)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modals
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [selectedIdeaForUpgrade, setSelectedIdeaForUpgrade] = useState<EventIdea | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [activeNoteModalIdea, setActiveNoteModalIdea] = useState<EventIdea | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'custom' | 'upvotes' | 'newest' | 'title'>('custom');

  // Drag and Drop state
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);
  const [dragOverIdeaId, setDragOverIdeaId] = useState<string | null>(null);

  // Column visibility state & popover
  const [visibleColumns, setVisibleColumns] = useState<VisibleIdeaColumns>(DEFAULT_VISIBLE_COLUMNS);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  // Inline editing state for table
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<EventIdea>>({});

  // Close column dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
    }
    if (isColumnDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColumnDropdownOpen]);

  // Load Column Customizer from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nyu_alumni_ideas_visible_columns');
      if (saved) {
        setVisibleColumns(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleColumn = (col: keyof VisibleIdeaColumns) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [col]: !prev[col] };
      try {
        localStorage.setItem('nyu_alumni_ideas_visible_columns', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedIdeaId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdeaId !== id) {
      setDragOverIdeaId(id);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggedIdeaId || draggedIdeaId === targetId) {
      setDraggedIdeaId(null);
      setDragOverIdeaId(null);
      return;
    }

    const currentIdeas = [...ideas];
    const sourceIdx = currentIdeas.findIndex((i) => i.id === draggedIdeaId);
    const targetIdx = currentIdeas.findIndex((i) => i.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [movedIdea] = currentIdeas.splice(sourceIdx, 1);
      currentIdeas.splice(targetIdx, 0, movedIdea);
      setIdeas(currentIdeas);
      setSortBy('custom');

      // Persist reordered list
      try {
        localStorage.setItem('nyu_alumni_ideas_store_v2', JSON.stringify(currentIdeas));
      } catch {
        // ignore
      }
    }

    setDraggedIdeaId(null);
    setDragOverIdeaId(null);
  };

  const handleDragEnd = () => {
    setDraggedIdeaId(null);
    setDragOverIdeaId(null);
  };

  // Filtered and Sorted Ideas
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

    if (sortBy === 'upvotes') {
      result.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [ideas, searchQuery, statusFilter, regionFilter, sortBy]);

  const readyCount = ideas.filter((i) => i.status === 'Ready to Plan').length;
  const promotedCount = ideas.filter((i) => i.status === 'Promoted').length;
  const activeColCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="w-full space-y-5">
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
            Capture potential event concepts, vendor partnerships, target time periods, and notes. Drag and drop rows to reorder priorities.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Column Customizer Popover */}
          <div className="relative" ref={columnDropdownRef}>
            <button
              type="button"
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Columns3 className="h-3.5 w-3.5 text-purple-700" />
              <span>Columns ({activeColCount})</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isColumnDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl space-y-1.5">
                <div className="flex items-center justify-between px-2 pb-1.5 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    Toggle Columns
                  </span>
                  <button
                    type="button"
                    onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}
                    className="text-[10px] font-bold text-[#57068c] hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-1 max-h-64 overflow-y-auto pt-1">
                  {[
                    { id: 'votes', label: 'Votes & Ranking' },
                    { id: 'concept', label: 'Idea & Concept' },
                    { id: 'vendor', label: 'Vendor / Venue' },
                    { id: 'timeframe', label: 'Target Timeframe' },
                    { id: 'region', label: 'Region' },
                    { id: 'notes', label: 'Planning Notes' },
                    { id: 'status', label: 'Status' },
                    { id: 'submitter', label: 'Pitched By' },
                    { id: 'actions', label: 'Actions' },
                  ].map((col) => {
                    const colKey = col.id as keyof VisibleIdeaColumns;
                    return (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[colKey]}
                          onChange={() => toggleColumn(colKey)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-[#57068c] focus:ring-[#57068c]"
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
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
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search ideas, vendors, notes, timeframes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs bg-slate-50/50 h-9"
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

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Contacting Vendor">Contacting Vendor</option>
                <option value="Under Consideration">Under Consideration</option>
                <option value="Ready to Plan">Ready to Plan</option>
                <option value="Promoted">Promoted</option>
              </select>
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">Region:</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="All">All Regions</option>
                <option value="SF">SF Only</option>
                <option value="East Bay">East Bay</option>
                <option value="South Bay">South Bay</option>
                <option value="Virtual">Virtual</option>
                <option value="NYC">NYC</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="custom">Custom (Drag Order)</option>
                <option value="upvotes">Most Upvotes</option>
                <option value="newest">Recently Added</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drag Hint */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <GripVertical className="h-3 w-3 text-purple-700" />
            <span>Click and drag any row/card by the grip handle to reprioritize</span>
          </span>
          <span className="font-semibold text-slate-600">
            Showing {filteredIdeas.length} of {ideas.length} ideas
          </span>
        </div>
      </div>

      {/* VIEW 1: CARDS GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onUpvote={handleUpvote}
              onUpgrade={handleStartUpgrade}
              isDraggable={true}
              onDragStart={(e) => handleDragStart(e, idea.id)}
              onDragOver={(e) => handleDragOver(e, idea.id)}
              onDrop={() => handleDrop(idea.id)}
              onDragEnd={handleDragEnd}
              isDragging={draggedIdeaId === idea.id}
              isDragOver={dragOverIdeaId === idea.id}
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

      {/* VIEW 2: COMPACT RESPONSIVE TABLE VIEW (NO HORIZONTAL SCROLL) */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs table-auto">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-2 w-8 text-center" title="Drag to reorder">
                    <span className="sr-only">Drag</span>
                  </th>
                  {visibleColumns.votes && (
                    <th className="py-2.5 px-2.5 w-16 text-center">Votes</th>
                  )}
                  {visibleColumns.concept && (
                    <th className="py-2.5 px-3 min-w-[180px]">Idea & Concept</th>
                  )}
                  {visibleColumns.vendor && (
                    <th className="py-2.5 px-3 min-w-[140px]">Vendor / Venue</th>
                  )}
                  {visibleColumns.timeframe && (
                    <th className="py-2.5 px-2.5 min-w-[110px]">Target Timeframe</th>
                  )}
                  {visibleColumns.region && (
                    <th className="py-2.5 px-2 w-16 text-center">Region</th>
                  )}
                  {visibleColumns.notes && (
                    <th className="py-2.5 px-3 min-w-[140px]">Notes</th>
                  )}
                  {visibleColumns.status && (
                    <th className="py-2.5 px-2.5 w-24">Status</th>
                  )}
                  {visibleColumns.submitter && (
                    <th className="py-2.5 px-2.5 w-24">Pitched By</th>
                  )}
                  {visibleColumns.actions && (
                    <th className="py-2.5 px-3 w-28 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIdeas.map((idea) => {
                  const isEditing = editingIdeaId === idea.id;
                  const isPromoted = idea.status === 'Promoted';
                  const hasUpvoted = (idea.upvoters || []).includes('Leighton');
                  const isDragging = draggedIdeaId === idea.id;
                  const isDragOver = dragOverIdeaId === idea.id;

                  return (
                    <tr
                      key={idea.id}
                      draggable={!isEditing}
                      onDragStart={(e) => handleDragStart(e, idea.id)}
                      onDragOver={(e) => handleDragOver(e, idea.id)}
                      onDrop={() => handleDrop(idea.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "transition-all group",
                        isDragging && "opacity-30 bg-purple-100 border-2 border-dashed border-purple-400",
                        isDragOver && "border-t-2 border-t-[#57068c] bg-purple-50/70",
                        !isDragging && !isDragOver && isPromoted
                          ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                          : "hover:bg-slate-50/80"
                      )}
                    >
                      {/* Drag Grip Handle */}
                      <td className="py-2.5 px-2 text-center align-middle cursor-grab active:cursor-grabbing">
                        <div
                          className="text-slate-300 group-hover:text-slate-600 transition-colors p-1"
                          title="Click & drag to reorder"
                        >
                          <GripVertical className="h-4 w-4 mx-auto" />
                        </div>
                      </td>

                      {/* Upvote column */}
                      {visibleColumns.votes && (
                        <td className="py-2.5 px-2.5 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleUpvote(idea.id)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition-all cursor-pointer select-none",
                              hasUpvoted
                                ? "bg-[#57068c] text-white hover:bg-[#460570]"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            )}
                            title="Upvote idea"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span>{idea.upvotes}</span>
                          </button>
                        </td>
                      )}

                      {/* Idea Title & Description */}
                      {visibleColumns.concept && (
                        <td className="py-2.5 px-3 align-middle">
                          {isEditing ? (
                            <div className="space-y-1">
                              <Input
                                value={editFormData.title ?? idea.title}
                                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                className="h-7 text-xs font-bold"
                              />
                              <textarea
                                value={editFormData.description ?? idea.description}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                rows={2}
                                className="w-full text-xs p-1 border rounded border-slate-300"
                              />
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900 leading-snug block">
                                {idea.title}
                              </span>
                              {idea.description && (
                                <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                                  {idea.description}
                                </p>
                              )}
                              {!visibleColumns.region && (
                                <span className="inline-block text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded mt-0.5">
                                  {idea.suggested_region}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Vendor / Venue & Website */}
                      {visibleColumns.vendor && (
                        <td className="py-2.5 px-3 align-middle">
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
                                <span className="font-semibold text-slate-800 flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-purple-700 shrink-0" />
                                  <span className="truncate">{idea.vendor_name}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Not specified</span>
                              )}
                              {idea.vendor_website && (
                                <a
                                  href={idea.vendor_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[10px] text-[#57068c] font-semibold hover:underline mt-0.5"
                                >
                                  <span>Website</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Target Timeframe */}
                      {visibleColumns.timeframe && (
                        <td className="py-2.5 px-2.5 align-middle">
                          {isEditing ? (
                            <Input
                              value={editFormData.time_period ?? idea.time_period ?? ''}
                              onChange={(e) => setEditFormData({ ...editFormData, time_period: e.target.value })}
                              className="h-7 text-xs"
                            />
                          ) : (
                            <span className="inline-flex items-center gap-1 text-purple-950 font-semibold bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-100">
                              <Clock className="h-3 w-3 text-purple-600 shrink-0" />
                              <span className="truncate">{idea.time_period || 'Flexible'}</span>
                            </span>
                          )}
                        </td>
                      )}

                      {/* Region */}
                      {visibleColumns.region && (
                        <td className="py-2.5 px-2 align-middle text-center">
                          <span className="text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {idea.suggested_region}
                          </span>
                        </td>
                      )}

                      {/* Notes */}
                      {visibleColumns.notes && (
                        <td className="py-2.5 px-3 align-middle">
                          {isEditing ? (
                            <textarea
                              value={editFormData.notes ?? idea.notes ?? ''}
                              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                              rows={2}
                              className="w-full text-xs p-1 border rounded border-slate-300"
                            />
                          ) : (
                            <div
                              onClick={() => idea.notes && setActiveNoteModalIdea(idea)}
                              className={cn(
                                "cursor-pointer group/note max-w-[200px]",
                                idea.notes ? "hover:text-[#57068c]" : ""
                              )}
                              title={idea.notes || 'No notes added'}
                            >
                              <p className="text-slate-600 text-[11px] leading-snug line-clamp-2">
                                {idea.notes || <span className="text-slate-400 italic">No notes</span>}
                              </p>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <td className="py-2.5 px-2.5 align-middle">
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
                      )}

                      {/* Pitched By */}
                      {visibleColumns.submitter && (
                        <td className="py-2.5 px-2.5 align-middle">
                          <div className="flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded-full bg-slate-800 text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                              {idea.submitted_avatar || idea.submitted_by.substring(0, 2).toUpperCase()}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-700 truncate">
                              {idea.submitted_by}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Actions */}
                      {visibleColumns.actions && (
                        <td className="py-2.5 px-3 text-right align-middle whitespace-nowrap">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveInlineEdit(idea.id)}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
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
                                className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              {!isPromoted && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartUpgrade(idea)}
                                  className="h-7 px-2.5 bg-[#57068c] hover:bg-[#460570] text-white text-[11px] font-bold gap-1 shadow-2xs cursor-pointer"
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
                                className="p-1 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                                title="Edit Idea"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteIdea(idea.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Idea"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note View Modal (When clicking notes in compact table) */}
      {activeNoteModalIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Info className="h-4 w-4 text-[#57068c]" />
                <span>Planning Notes: {activeNoteModalIdea.title}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveNoteModalIdea(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">
              {activeNoteModalIdea.notes}
            </div>
            {activeNoteModalIdea.vendor_name && (
              <p className="text-xs text-slate-500 font-medium">
                Vendor: <strong className="text-slate-800">{activeNoteModalIdea.vendor_name}</strong>
              </p>
            )}
            <div className="text-right">
              <Button
                size="sm"
                onClick={() => setActiveNoteModalIdea(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs"
              >
                Close
              </Button>
            </div>
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
