'use client';

import React, { useState, useMemo } from 'react';
import { format, parseISO, differenceInCalendarDays, isValid } from 'date-fns';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  DollarSign,
  User,
  Calendar as CalendarIcon,
  ChevronDown,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';
import { EnrichedEvent, AwarenessEvent, EventStatus, EventRegion, DatabaseEvent } from '@/types/database.types';
import { DEFAULT_CURRENT_DATE, calculateEventDeadlines } from '@/lib/utils/deadlines';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function getQuarterInfo(dateString: string) {
  try {
    const d = parseISO(dateString);
    if (!isValid(d)) return { key: 'Other', title: 'Other Dates', qNum: 'Q', range: '', year: '' };
    const month = d.getMonth(); // 0-11
    const year = d.getFullYear();
    if (month >= 0 && month <= 2) {
      return { key: `Q1-${year}`, title: `Q1 ${year}`, qNum: 'Q1', range: `Jan – Mar ${year}`, year: `${year}` };
    } else if (month >= 3 && month <= 5) {
      return { key: `Q2-${year}`, title: `Q2 ${year}`, qNum: 'Q2', range: `Apr – Jun ${year}`, year: `${year}` };
    } else if (month >= 6 && month <= 8) {
      return { key: `Q3-${year}`, title: `Q3 ${year}`, qNum: 'Q3', range: `Jul – Sep ${year}`, year: `${year}` };
    } else {
      return { key: `Q4-${year}`, title: `Q4 ${year}`, qNum: 'Q4', range: `Oct – Dec ${year}`, year: `${year}` };
    }
  } catch {
    return { key: 'Other', title: 'Other Dates', qNum: 'Q', range: '', year: '' };
  }
}

export interface TableRowItem {
  id: string;
  isAwareness: boolean;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  monthFormatted: string; // e.g. "October" (Month only)
  fullDateFormatted: string; // e.g. "Oct 8, 2026"
  quarterKey: string;
  quarterTitle: string;
  quarterNum: string;
  quarterRange: string;
  weeksFromToday: number; // rounded up whole number
  weeksLabel: string;
  isUrgent6w: boolean;
  isUrgent8w: boolean;
  location: string;
  cost: number;
  costFormatted: string;
  status: EventStatus | 'Awareness' | 'Holiday' | 'Conference';
  category: string;
  primaryHost: string;
  coHosts: string[];
  notes?: string;
  rawEvent?: EnrichedEvent;
  rawAwareness?: AwarenessEvent;
}

interface EventTableViewProps {
  events: EnrichedEvent[];
  awarenessEvents: AwarenessEvent[];
  onSelectEvent: (event: EnrichedEvent) => void;
  onUpdateEvent: (id: string, updates: Partial<DatabaseEvent>) => Promise<void>;
  onDeleteEvent?: (id: string) => Promise<void>;
  onOpenAddModal: () => void;
}

export function EventTableView({
  events,
  awarenessEvents,
  onSelectEvent,
  onUpdateEvent,
  onDeleteEvent,
  onOpenAddModal,
}: EventTableViewProps) {
  // Reference date (Simulation Date: August 11, 2026)
  const currentDate = parseISO(DEFAULT_CURRENT_DATE);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedHostFilter, setSelectedHostFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'weeks' | 'cost' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Column Visibility Customizer (Cost is hidden by default)
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    month: true,
    date: true,
    weeks: true,
    idea: true,
    location: true,
    cost: false, // Default: false as requested
    status: true,
    host: true,
    category: false,
  });

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    startDate: string;
    location: string;
    cost: number;
    status: EventStatus;
    primaryHost: string;
    coHosts: string;
  }>({
    title: '',
    startDate: '',
    location: '',
    cost: 0,
    status: 'Planning',
    primaryHost: '',
    coHosts: '',
  });

  // Transform events and awareness events into unified table rows
  const tableData: TableRowItem[] = useMemo(() => {
    const rows: TableRowItem[] = [];

    // 1. Alumni Events
    events.forEach((evt) => {
      const evtDate = parseISO(evt.event_date);
      const daysDiff = isValid(evtDate) ? differenceInCalendarDays(evtDate, currentDate) : 0;
      // Round up to nearest whole number
      const weeksAway = daysDiff > 0 ? Math.ceil(daysDiff / 7) : Math.floor(daysDiff / 7);

      let weeksLabel = `${weeksAway} wks`;
      if (daysDiff < 0) {
        weeksLabel = `${Math.abs(weeksAway)} wks ago`;
      } else if (daysDiff === 0) {
        weeksLabel = 'Today';
      }

      const isUrgent6w = evt.deadlines?.isSixWeekUrgent || Math.abs(daysDiff - 42) <= 7;
      const isUrgent8w = evt.deadlines?.isEightWeekUrgent || Math.abs(daysDiff - 56) <= 7;

      const qInfo = getQuarterInfo(evt.event_date);

      rows.push({
        id: evt.id,
        isAwareness: false,
        title: evt.title,
        startDate: evt.event_date,
        monthFormatted: isValid(evtDate) ? format(evtDate, 'MMMM') : '', // Month only (no year)
        fullDateFormatted: isValid(evtDate) ? format(evtDate, 'MMM d, yyyy') : evt.event_date,
        quarterKey: qInfo.key,
        quarterTitle: qInfo.title,
        quarterNum: qInfo.qNum,
        quarterRange: qInfo.range,
        weeksFromToday: weeksAway,
        weeksLabel,
        isUrgent6w,
        isUrgent8w,
        location: evt.location_name,
        cost: evt.cost_per_person,
        costFormatted: evt.cost_per_person > 0 ? `$${evt.cost_per_person}` : 'Free',
        status: evt.status,
        category: 'Alumni Event',
        primaryHost: evt.primary_host,
        coHosts: evt.co_hosts_list,
        notes: evt.notes,
        rawEvent: evt,
      });
    });

    // 2. Awareness & Community Events
    awarenessEvents.forEach((awr) => {
      const startDate = parseISO(awr.start_date);
      const daysDiff = isValid(startDate) ? differenceInCalendarDays(startDate, currentDate) : 0;
      // Round up to nearest whole number
      const weeksAway = daysDiff > 0 ? Math.ceil(daysDiff / 7) : Math.floor(daysDiff / 7);

      let fullDate = awr.start_date;
      if (isValid(startDate)) {
        if (awr.end_date && awr.end_date !== awr.start_date) {
          const endDate = parseISO(awr.end_date);
          fullDate = `${format(startDate, 'MMM d')} – ${isValid(endDate) ? format(endDate, 'MMM d, yyyy') : awr.end_date}`;
        } else {
          fullDate = format(startDate, 'MMM d, yyyy');
        }
      }

      let weeksLabel = `${weeksAway} wks`;
      if (daysDiff < 0) {
        weeksLabel = `${Math.abs(weeksAway)} wks ago`;
      } else if (daysDiff === 0) {
        weeksLabel = 'Today';
      }

      const qInfo = getQuarterInfo(awr.start_date);

      rows.push({
        id: awr.id,
        isAwareness: true,
        title: awr.title,
        startDate: awr.start_date,
        endDate: awr.end_date,
        monthFormatted: isValid(startDate) ? format(startDate, 'MMMM') : '', // Month only
        fullDateFormatted: fullDate,
        quarterKey: qInfo.key,
        quarterTitle: qInfo.title,
        quarterNum: qInfo.qNum,
        quarterRange: qInfo.range,
        weeksFromToday: weeksAway,
        weeksLabel,
        isUrgent6w: false,
        isUrgent8w: awr.title.includes('Social Event'),
        location: awr.location,
        cost: 0,
        costFormatted: '—',
        status: awr.category === 'Community / Conference' ? 'Conference' : 'Holiday',
        category: awr.category,
        primaryHost: awr.title.includes('SOCAP') ? 'Tammy Chen' : awr.title.includes('Social') ? 'Leighton Gordon' : 'City / Community',
        coHosts: [],
        notes: awr.notes,
        rawAwareness: awr,
      });
    });

    return rows;
  }, [events, awarenessEvents, currentDate]);

  // Extract unique filter options
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    tableData.forEach((r) => {
      if (r.monthFormatted) set.add(r.monthFormatted);
    });
    return Array.from(set);
  }, [tableData]);

  const hostOptions = useMemo(() => {
    const set = new Set<string>();
    tableData.forEach((r) => {
      if (r.primaryHost) set.add(r.primaryHost);
    });
    return Array.from(set);
  }, [tableData]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    const result = tableData.filter((row) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = row.title.toLowerCase().includes(q);
        const matchLoc = row.location.toLowerCase().includes(q);
        const matchHost = row.primaryHost.toLowerCase().includes(q) || row.coHosts.some((h) => h.toLowerCase().includes(q));
        const matchCategory = row.category.toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchHost && !matchCategory) return false;
      }
      // Month
      if (selectedMonthFilter !== 'All' && row.monthFormatted !== selectedMonthFilter) return false;
      // Status
      if (selectedStatusFilter !== 'All' && row.status !== selectedStatusFilter) return false;
      // Category
      if (selectedCategoryFilter !== 'All' && row.category !== selectedCategoryFilter) return false;
      // Host
      if (selectedHostFilter !== 'All' && !row.primaryHost.includes(selectedHostFilter)) return false;

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = a.startDate.localeCompare(b.startDate);
      } else if (sortBy === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortBy === 'weeks') {
        cmp = a.weeksFromToday - b.weeksFromToday;
      } else if (sortBy === 'cost') {
        cmp = a.cost - b.cost;
      } else if (sortBy === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tableData, searchQuery, selectedMonthFilter, selectedStatusFilter, selectedCategoryFilter, selectedHostFilter, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMonthFilter('All');
    setSelectedStatusFilter('All');
    setSelectedCategoryFilter('All');
    setSelectedHostFilter('All');
  };

  // Start inline editing
  const handleStartEdit = (row: TableRowItem) => {
    if (row.isAwareness) return;
    setEditingRowId(row.id);
    setEditFormData({
      title: row.title,
      startDate: row.startDate,
      location: row.location,
      cost: row.cost,
      status: (row.status as EventStatus) || 'Planning',
      primaryHost: row.primaryHost,
      coHosts: row.coHosts.join(', '),
    });
  };

  // Save inline edit
  const handleSaveEdit = async (id: string) => {
    const coHostsArray = editFormData.coHosts
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    await onUpdateEvent(id, {
      title: editFormData.title,
      event_date: editFormData.startDate,
      location_name: editFormData.location,
      cost_per_person: Number(editFormData.cost) || 0,
      status: editFormData.status,
      primary_host: editFormData.primaryHost,
      co_hosts: coHostsArray,
    });
    setEditingRowId(null);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
  };

  const toggleSort = (field: 'date' | 'title' | 'weeks' | 'cost' | 'status') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Host avatar initials helper
  const getAvatarBadge = (name: string, coHosts: string[] = []) => {
    if (name.toLowerCase().includes('leighton')) return 'L&A';
    if (name.toLowerCase().includes('janice')) return 'J';
    if (name.toLowerCase().includes('tammy')) {
      return coHosts.length > 0 ? 'T T&B' : 'T';
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Row styling based on status / type to differentiate each event with distinct colors
  const getRowStyling = (row: TableRowItem) => {
    if (row.isAwareness) {
      if (row.status === 'Conference' || row.category === 'Community / Conference') {
        return {
          bg: 'bg-indigo-50/40 hover:bg-indigo-100/60 border-l-[5px] border-l-indigo-500 text-slate-900',
          dot: 'bg-indigo-500',
          badgeVariant: 'community' as const,
          icon: '🏛️',
        };
      }
      return {
        bg: 'bg-stone-50/70 hover:bg-stone-100/80 border-l-[5px] border-l-stone-400 text-slate-800',
        dot: 'bg-stone-500',
        badgeVariant: 'secondary' as const,
        icon: '🗓️',
      };
    }

    switch (row.status) {
      case 'Confirmed':
        return {
          bg: 'bg-emerald-50/50 hover:bg-emerald-100/70 border-l-[5px] border-l-emerald-600 text-slate-900',
          dot: 'bg-emerald-600',
          badgeVariant: 'confirmed' as const,
          icon: '✅',
        };
      case 'Submitted':
        return {
          bg: 'bg-purple-50/60 hover:bg-purple-100/80 border-l-[5px] border-l-[#57068c] text-slate-900',
          dot: 'bg-[#57068c]',
          badgeVariant: 'submitted' as const,
          icon: '📨',
        };
      case 'Planning':
        return {
          bg: 'bg-sky-50/50 hover:bg-sky-100/70 border-l-[5px] border-l-sky-500 text-slate-900',
          dot: 'bg-sky-600',
          badgeVariant: 'planning' as const,
          icon: '📝',
        };
      case 'Idea':
        return {
          bg: 'bg-amber-50/50 hover:bg-amber-100/70 border-l-[5px] border-l-amber-500 text-slate-900',
          dot: 'bg-amber-500',
          badgeVariant: 'idea' as const,
          icon: '💡',
        };
      case 'Completed':
        return {
          bg: 'bg-slate-100/60 hover:bg-slate-200/60 border-l-[5px] border-l-slate-400 text-slate-600',
          dot: 'bg-slate-400',
          badgeVariant: 'secondary' as const,
          icon: '🏁',
        };
      default:
        return {
          bg: 'bg-white hover:bg-slate-50 border-l-[5px] border-l-slate-300 text-slate-900',
          dot: 'bg-slate-400',
          badgeVariant: 'secondary' as const,
          icon: '📌',
        };
    }
  };

  const quarterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((r) => {
      counts[r.quarterKey] = (counts[r.quarterKey] || 0) + 1;
    });
    return counts;
  }, [filteredData]);

  const activeColumnsCount = Object.values(visibleColumns).filter(Boolean).length;
  const totalVisibleCols = activeColumnsCount + 1; // +1 for Actions column

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search event idea, location, host, or tag..."
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

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Column Visibility Customizer Toggle */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
                className="h-9 gap-1.5 text-xs text-slate-700 font-medium"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <span>Columns ({activeColumnsCount})</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </Button>

              {/* Column Picker Dropdown Modal / Popover */}
              {isColumnPickerOpen && (
                <div className="absolute right-0 top-10 z-30 w-52 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 px-1">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Customize Columns
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsColumnPickerOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns.month}
                        onChange={() => toggleColumn('month')}
                        className="rounded border-slate-300 text-purple-700"
                      />
                      <span>Month</span>
                    </label>
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns.date}
                        onChange={() => toggleColumn('date')}
                        className="rounded border-slate-300 text-purple-700"
                      />
                      <span>Full Date</span>
                    </label>
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns.weeks}
                        onChange={() => toggleColumn('weeks')}
                        className="rounded border-slate-300 text-purple-700"
                      />
                      <span>Weeks from today</span>
                    </label>
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns.idea}
                        onChange={() => toggleColumn('idea')}
                        className="rounded border-slate-300 text-purple-700"
                      />
                      <span>Event Idea</span>
                    </label>
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns.location}
                        onChange={() => toggleColumn('location')}
                        className="rounded border-slate-300 text-purple-700"
                      />
                      <span>Location</span>
                    </label>
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-purple-50 text-purple-950 font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns.cost}
                        onChange={() => toggleColumn('cost')}
                        className="rounded border-slate-300 text-purple-700"
                      />
                      <span>Cost (Per Person)</span>
                    </label>
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns.status}
                        onChange={() => toggleColumn('status')}
                        className="rounded border-slate-300 text-purple-700"
                      />
                      <span>Status</span>
                    </label>
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns.host}
                        onChange={() => toggleColumn('host')}
                        className="rounded border-slate-300 text-purple-700"
                      />
                      <span>Host(s)</span>
                    </label>
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns.category}
                        onChange={() => toggleColumn('category')}
                        className="rounded border-slate-300 text-purple-700"
                      />
                      <span>Category</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={onOpenAddModal}
              size="sm"
              className="bg-[#57068c] hover:bg-[#450570] text-white gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Event</span>
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Month Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Month:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value="All">All Months</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value="All">All Statuses</option>
              <option value="Idea">Idea</option>
              <option value="Planning">Planning</option>
              <option value="Submitted">Submitted</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Conference">Conference</option>
              <option value="Holiday">Holiday / Civic</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value="All">All Categories</option>
              <option value="Alumni Event">Alumni Event</option>
              <option value="Community / Conference">Community / Conference</option>
              <option value="Civic / Holiday">Civic / Holiday</option>
              <option value="Cultural">Cultural</option>
            </select>
          </div>

          {/* Host Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Host:</span>
            <select
              value={selectedHostFilter}
              onChange={(e) => setSelectedHostFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value="All">All Hosts</option>
              {hostOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Result Count */}
          <div className="ml-auto text-xs text-slate-500 font-medium">
            Showing <strong>{filteredData.length}</strong> events
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header */}
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-md shadow-2xs border-b border-slate-200">
              <tr className="text-slate-700 font-bold select-none">
                {visibleColumns.month && (
                  <th className="py-3 px-3.5 whitespace-nowrap">Month</th>
                )}
                {visibleColumns.date && (
                  <th
                    onClick={() => toggleSort('date')}
                    className="py-3 px-3.5 whitespace-nowrap cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Full Date</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {visibleColumns.weeks && (
                  <th
                    onClick={() => toggleSort('weeks')}
                    className="py-3 px-3.5 whitespace-nowrap cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Weeks from today</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {visibleColumns.idea && (
                  <th
                    onClick={() => toggleSort('title')}
                    className="py-3 px-3.5 min-w-[200px] cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Event Idea</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {visibleColumns.location && (
                  <th className="py-3 px-3.5 whitespace-nowrap">Location</th>
                )}
                {visibleColumns.cost && (
                  <th
                    onClick={() => toggleSort('cost')}
                    className="py-3 px-3.5 whitespace-nowrap cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cost</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {visibleColumns.status && (
                  <th
                    onClick={() => toggleSort('status')}
                    className="py-3 px-3.5 whitespace-nowrap cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {visibleColumns.host && (
                  <th className="py-3 px-3.5 whitespace-nowrap">Host(s)</th>
                )}
                {visibleColumns.category && (
                  <th className="py-3 px-3.5 whitespace-nowrap">Category</th>
                )}
                <th className="py-3 px-3.5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row, index) => {
                const isEditing = editingRowId === row.id;
                const styling = getRowStyling(row);

                // Check if this row begins a new quarter
                const prevRow = index > 0 ? filteredData[index - 1] : null;
                const isNewQuarter = !prevRow || row.quarterKey !== prevRow.quarterKey;

                return (
                  <React.Fragment key={row.id}>
                    {/* Quarter Divider Separator Line */}
                    {isNewQuarter && (
                      <tr className="bg-slate-100/90 border-y-2 border-slate-300">
                        <td
                          colSpan={totalVisibleCols}
                          className="py-2.5 px-4 bg-linear-to-r from-purple-100/80 via-slate-100 to-white"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-5 w-6 items-center justify-center rounded bg-[#57068c] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                                {row.quarterNum}
                              </span>
                              <span className="font-black text-slate-900 text-xs tracking-tight uppercase flex items-center gap-1.5">
                                <span>{row.quarterTitle}</span>
                                <span className="text-slate-400 font-normal">•</span>
                                <span className="text-[11px] font-semibold text-slate-600">
                                  {row.quarterRange}
                                </span>
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-purple-900 bg-purple-100/90 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                              {quarterCounts[row.quarterKey] || 0} events
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {isEditing ? (
                      <tr className="bg-purple-100/70 border-l-[5px] border-l-[#57068c]">
                        {/* Month */}
                        {visibleColumns.month && (
                          <td className="py-2.5 px-3.5 font-bold text-slate-700">
                            {row.monthFormatted}
                          </td>
                        )}

                        {/* Full Date Input */}
                        {visibleColumns.date && (
                          <td className="py-2.5 px-3.5">
                            <Input
                              type="date"
                              value={editFormData.startDate}
                              onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                              className="h-8 text-xs font-medium w-36 bg-white"
                            />
                          </td>
                        )}

                        {/* Weeks from today (calculated live and rounded up) */}
                        {visibleColumns.weeks && (
                          <td className="py-2.5 px-3.5 font-bold text-purple-900">
                            {calculateEventDeadlines(editFormData.startDate).daysUntilEvent > 0
                              ? `${Math.ceil(calculateEventDeadlines(editFormData.startDate).daysUntilEvent / 7)} wks`
                              : 'Past'}
                          </td>
                        )}

                        {/* Event Idea Input */}
                        {visibleColumns.idea && (
                          <td className="py-2.5 px-3.5">
                            <Input
                              value={editFormData.title}
                              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                              className="h-8 text-xs font-bold bg-white"
                            />
                          </td>
                        )}

                        {/* Location Input */}
                        {visibleColumns.location && (
                          <td className="py-2.5 px-3.5">
                            <Input
                              value={editFormData.location}
                              onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                              className="h-8 text-xs bg-white"
                            />
                          </td>
                        )}

                        {/* Cost Input (if visible) */}
                        {visibleColumns.cost && (
                          <td className="py-2.5 px-3.5">
                            <Input
                              type="number"
                              value={editFormData.cost}
                              onChange={(e) => setEditFormData({ ...editFormData, cost: Number(e.target.value) })}
                              className="h-8 text-xs w-20 bg-white"
                            />
                          </td>
                        )}

                        {/* Status Dropdown */}
                        {visibleColumns.status && (
                          <td className="py-2.5 px-3.5">
                            <select
                              value={editFormData.status}
                              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as EventStatus })}
                              className="h-8 rounded-md border border-purple-300 bg-white px-2 text-xs font-medium focus:ring-1 focus:ring-purple-600"
                            >
                              <option value="Idea">Idea</option>
                              <option value="Planning">Planning</option>
                              <option value="Submitted">Submitted</option>
                              <option value="Confirmed">Confirmed</option>
                            </select>
                          </td>
                        )}

                        {/* Hosts Input */}
                        {visibleColumns.host && (
                          <td className="py-2.5 px-3.5">
                            <Input
                              placeholder="Primary Host"
                              value={editFormData.primaryHost}
                              onChange={(e) => setEditFormData({ ...editFormData, primaryHost: e.target.value })}
                              className="h-8 text-xs bg-white"
                            />
                          </td>
                        )}

                        {/* Category */}
                        {visibleColumns.category && (
                          <td className="py-2.5 px-3.5 font-medium text-slate-600">
                            {row.category}
                          </td>
                        )}

                        {/* Actions */}
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(row.id)}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="h-7 px-2 text-[11px]"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        onClick={() => row.rawEvent && onSelectEvent(row.rawEvent)}
                        className={cn(
                          "group transition-all cursor-pointer",
                          styling.bg
                        )}
                      >
                        {/* Month (Month only, e.g. October) */}
                        {visibleColumns.month && (
                          <td className="py-3 px-3.5 whitespace-nowrap font-bold text-slate-800">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={cn("h-2.5 w-2.5 rounded-full shadow-2xs", styling.dot)} />
                              <span>{row.monthFormatted}</span>
                            </span>
                          </td>
                        )}

                        {/* Full Date */}
                        {visibleColumns.date && (
                          <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-700">
                            {row.fullDateFormatted}
                          </td>
                        )}

                        {/* Weeks from today (Rounded up whole number) */}
                        {visibleColumns.weeks && (
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "font-bold text-xs px-2 py-0.5 rounded shadow-2xs",
                                  row.isUrgent6w
                                    ? "bg-amber-200 text-amber-950 border border-amber-400 font-extrabold animate-pulse"
                                    : row.isUrgent8w
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : "bg-white/80 text-slate-700 border border-slate-200"
                                )}
                              >
                                {row.weeksLabel}
                              </span>
                              {row.isUrgent6w && (
                                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-200/80 px-1 rounded">
                                  6w Mark
                                </span>
                              )}
                              {row.isUrgent8w && !row.isUrgent6w && (
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1 rounded">
                                  8w Mark
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Event Idea */}
                        {visibleColumns.idea && (
                          <td className="py-3 px-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{styling.icon}</span>
                              <div>
                                <span className="group-hover:text-[#57068c] transition-colors leading-snug">{row.title}</span>
                                {row.notes && (
                                  <p className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                                    {row.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Location */}
                        {visibleColumns.location && (
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-medium">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span>{row.location}</span>
                            </span>
                          </td>
                        )}

                        {/* Cost (Togglable) */}
                        {visibleColumns.cost && (
                          <td className="py-3 px-3.5 whitespace-nowrap font-bold text-slate-800">
                            {row.costFormatted}
                          </td>
                        )}

                        {/* Status */}
                        {visibleColumns.status && (
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <Badge
                              variant={styling.badgeVariant}
                              className="text-[10px] shadow-2xs font-bold"
                            >
                              {row.status}
                            </Badge>
                          </td>
                        )}

                        {/* Host(s) */}
                        {visibleColumns.host && (
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-white shadow-2xs">
                                {getAvatarBadge(row.primaryHost, row.coHosts)}
                              </span>
                              <span className="text-slate-700 font-semibold">{row.primaryHost}</span>
                              {row.coHosts.length > 0 && (
                                <span className="text-slate-400 text-[10px]">+ {row.coHosts.length}</span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Category (if enabled) */}
                        {visibleColumns.category && (
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-medium">
                            {row.category}
                          </td>
                        )}

                        {/* Actions */}
                        <td
                          className="py-3 px-3.5 whitespace-nowrap text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!row.isAwareness && (
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(row)}
                                className="rounded p-1 text-slate-400 hover:bg-purple-100 hover:text-[#57068c] transition-colors cursor-pointer"
                                title="Edit Event"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              {onDeleteEvent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete "${row.title}"?`)) {
                                      onDeleteEvent(row.id);
                                    }
                                  }}
                                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Delete Event"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={activeColumnsCount + 1} className="py-12 px-4 text-center">
                    <div className="mx-auto max-w-sm flex flex-col items-center justify-center space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-[#57068c] shadow-2xs">
                        <Search className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">No matching events found</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          No events match your current search query or active filter settings.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleResetFilters}
                          className="h-8 text-xs font-semibold"
                        >
                          Reset all filters
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={onOpenAddModal}
                          className="h-8 bg-[#57068c] hover:bg-[#480575] text-white text-xs font-semibold gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Event</span>
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
