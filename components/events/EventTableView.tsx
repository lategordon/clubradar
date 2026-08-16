'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  RotateCcw,
  Copy,
  Repeat,
} from 'lucide-react';
import { EnrichedEvent, AwarenessEvent, EventStatus, EventRegion, DatabaseEvent } from '@/types/database.types';
import { DEFAULT_CURRENT_DATE, calculateEventDeadlines } from '@/lib/utils/deadlines';
import { updateAwarenessEvent, deleteAwarenessEvent } from '@/lib/data-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: { label: string; value: string; count?: number }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOption = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((item) => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const handleClear = () => {
    onChange([]);
  };

  // Determine button label text
  const getButtonText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const match = options.find((o) => o.value === selected[0]);
      return match ? match.label : selected[0];
    }
    if (selected.length === options.length) return `All ${label}s`;
    return `${selected.length} ${label}s`;
  };

  const isFiltered = selected.length > 0;

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={dropdownRef}>
      <span className="text-slate-500 font-medium text-xs">{label}:</span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer select-none shadow-2xs',
          isFiltered
            ? 'border-purple-400 bg-purple-50 text-[#57068c] ring-2 ring-purple-200'
            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
        )}
      >
        <span className="truncate max-w-[130px]">{getButtonText()}</span>
        {isFiltered && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#57068c] text-[9px] font-black text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform text-slate-400',
            isOpen && 'rotate-180 text-purple-700'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-8 z-30 min-w-[200px] max-w-[280px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 px-1">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
              {label} Filter ({selected.length}/{options.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[10px] font-semibold text-[#57068c] hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
            {options.map((opt) => {
              const isChecked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors select-none',
                    isChecked ? 'bg-purple-50 text-[#57068c] font-bold' : 'hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleOption(opt.value)}
                      className="rounded border-slate-300 text-purple-700 focus:ring-purple-600 h-3.5 w-3.5"
                    />
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {opt.count !== undefined && (
                    <span className="text-[10px] text-slate-400 font-normal px-1">
                      {opt.count}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function getQuarterInfo(dateString: string) {
  try {
    const d = parseISO(dateString);
    if (!isValid(d)) return { quarterKey: 'Q4 2026', quarterNum: 'Q4', quarterTitle: 'Quarter 4', quarterRange: 'Oct - Dec 2026' };
    const month = d.getMonth(); // 0-11
    const year = d.getFullYear();

    if (month >= 9 && month <= 11) {
      return {
        quarterKey: `Q4 ${year}`,
        quarterNum: 'Q4',
        quarterTitle: `Quarter 4`,
        quarterRange: `Oct - Dec ${year}`,
      };
    } else if (month >= 0 && month <= 2) {
      return {
        quarterKey: `Q1 ${year}`,
        quarterNum: 'Q1',
        quarterTitle: `Quarter 1`,
        quarterRange: `Jan - Mar ${year}`,
      };
    } else if (month >= 3 && month <= 5) {
      return {
        quarterKey: `Q2 ${year}`,
        quarterNum: 'Q2',
        quarterTitle: `Quarter 2`,
        quarterRange: `Apr - Jun ${year}`,
      };
    } else {
      return {
        quarterKey: `Q3 ${year}`,
        quarterNum: 'Q3',
        quarterTitle: `Quarter 3`,
        quarterRange: `Jul - Sep ${year}`,
      };
    }
  } catch {
    return { quarterKey: 'Q4 2026', quarterNum: 'Q4', quarterTitle: 'Quarter 4', quarterRange: 'Oct - Dec 2026' };
  }
}

export interface TableRowItem {
  id: string;
  isAwareness: boolean;
  startDate: string;
  endDate?: string;
  monthFormatted: string; // "October"
  fullDateFormatted: string; // "October 16, 2026" or "Oct 5 - 11, 2026"
  quarterKey: string;
  quarterNum: string;
  quarterTitle: string;
  quarterRange: string;
  weeksFromToday: number;
  weeksLabel: string;
  isUrgent6w?: boolean;
  isUrgent8w?: boolean;
  title: string;
  location: string;
  cost: number;
  status: EventStatus | 'Awareness' | 'Holiday' | 'Conference' | 'City Event' | 'Local Event' | string;
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
  onDuplicateEvent?: (id: string) => Promise<void>;
  onUpdateAwarenessEvent?: (id: string, updates: Partial<AwarenessEvent>) => Promise<void>;
  onDeleteEvent?: (id: string) => Promise<void>;
  onDeleteAwarenessEvent?: (id: string) => Promise<void>;
  onOpenAddModal?: () => void;
  onSelectAwareness?: (awareness: AwarenessEvent) => void;
  onOpenAddEvent?: () => void;
  currentDate?: Date;
}

export function EventTableView({
  events,
  awarenessEvents,
  onSelectEvent,
  onUpdateEvent,
  onDuplicateEvent,
  onUpdateAwarenessEvent,
  onDeleteEvent,
  onDeleteAwarenessEvent,
  onOpenAddModal,
  onSelectAwareness,
  onOpenAddEvent,
  currentDate = parseISO(DEFAULT_CURRENT_DATE),
}: EventTableViewProps) {
  // Search & Multi-Select Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [eventScope, setEventScope] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
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

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    startDate: string;
    location: string;
    cost: number;
    status: string;
    primaryHost: string;
    coHosts: string;
    isAwareness?: boolean;
    category?: string;
  }>({
    title: '',
    startDate: '',
    location: '',
    cost: 0,
    status: 'Planning',
    primaryHost: '',
    coHosts: '',
    isAwareness: false,
    category: 'Alumni Event',
  });

  const tableData: TableRowItem[] = useMemo(() => {
    const rows: TableRowItem[] = [];

    events.forEach((evt) => {
      const evtDate = parseISO(evt.event_date);
      const daysDiff = isValid(evtDate) ? differenceInCalendarDays(evtDate, currentDate) : 0;
      const weeksExact = daysDiff / 7;
      const weeksRounded = Math.ceil(weeksExact);
      const monthOnly = isValid(evtDate) ? format(evtDate, 'MMMM') : 'Unknown';
      const fullDateStr = isValid(evtDate) ? format(evtDate, 'MMMM d, yyyy') : evt.event_date;
      const quarter = getQuarterInfo(evt.event_date);

      rows.push({
        id: evt.id,
        isAwareness: false,
        startDate: evt.event_date,
        monthFormatted: monthOnly,
        fullDateFormatted: fullDateStr,
        quarterKey: quarter.quarterKey,
        quarterNum: quarter.quarterNum,
        quarterTitle: quarter.quarterTitle,
        quarterRange: quarter.quarterRange,
        weeksFromToday: weeksRounded,
        weeksLabel: weeksRounded > 0 ? `${weeksRounded} wks` : 'Past',
        isUrgent6w: evt.deadlines.isSixWeekUrgent,
        isUrgent8w: evt.deadlines.isEightWeekUrgent,
        title: evt.title,
        location: evt.location_name,
        cost: evt.cost_per_person,
        status: evt.status,
        category: 'Alumni Event',
        primaryHost: evt.primary_host,
        coHosts: evt.co_hosts_list,
        notes: evt.notes,
        rawEvent: evt,
      });
    });

    awarenessEvents.forEach((awr) => {
      const startDateObj = parseISO(awr.start_date);
      const daysDiff = isValid(startDateObj) ? differenceInCalendarDays(startDateObj, currentDate) : 0;
      const weeksExact = daysDiff / 7;
      const weeksRounded = Math.ceil(weeksExact);
      const monthOnly = isValid(startDateObj) ? format(startDateObj, 'MMMM') : 'Unknown';

      let fullDateStr = awr.start_date;
      if (isValid(startDateObj)) {
        if (awr.end_date && awr.end_date !== awr.start_date) {
          const endDateObj = parseISO(awr.end_date);
          if (isValid(endDateObj)) {
            fullDateStr = `${format(startDateObj, 'MMM d')} – ${format(endDateObj, 'MMM d, yyyy')}`;
          } else {
            fullDateStr = format(startDateObj, 'MMMM d, yyyy');
          }
        } else {
          fullDateStr = format(startDateObj, 'MMMM d, yyyy');
        }
      }

      const quarter = getQuarterInfo(awr.start_date);

      rows.push({
        id: awr.id,
        isAwareness: true,
        startDate: awr.start_date,
        endDate: awr.end_date,
        monthFormatted: monthOnly,
        fullDateFormatted: fullDateStr,
        quarterKey: quarter.quarterKey,
        quarterNum: quarter.quarterNum,
        quarterTitle: quarter.quarterTitle,
        quarterRange: quarter.quarterRange,
        weeksFromToday: weeksRounded,
        weeksLabel: weeksRounded > 0 ? `${weeksRounded} wks` : 'Past',
        isUrgent6w: false,
        isUrgent8w: false,
        title: awr.title,
        location: awr.location || 'San Francisco',
        cost: 0,
        status:
          (awr.category || '').toLowerCase().includes('conference') || (awr.title || '').toLowerCase().includes('conference') || (awr.title || '').toLowerCase().includes('summit')
            ? 'Conference'
            : (awr.category || '').toLowerCase().includes('holiday') || (awr.category || '').toLowerCase().includes('civic')
            ? 'Holiday'
            : 'City Event',
        category: awr.category,
        primaryHost: '',
        coHosts: [],
        notes: awr.notes,
        rawAwareness: awr,
      });
    });

    return rows;
  }, [events, awarenessEvents, currentDate]);

  const monthFilterOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    tableData.forEach((r) => {
      if (r.monthFormatted) counts[r.monthFormatted] = (counts[r.monthFormatted] || 0) + 1;
    });
    return Object.keys(counts).map((m) => ({
      label: m,
      value: m,
      count: counts[m],
    }));
  }, [tableData]);

  const statusFilterOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    tableData.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    const statuses = ['Submitted', 'Planning', 'Idea', 'Confirmed', 'Completed', 'Conference', 'Holiday'];
    return statuses.map((s) => ({
      label: s === 'Holiday' ? 'Holiday / Civic' : s,
      value: s,
      count: counts[s] || 0,
    }));
  }, [tableData]);

  const categoryFilterOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    tableData.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    const categories = ['Alumni Event', 'Community / Conference', 'Civic / Holiday', 'Cultural'];
    return categories.map((c) => ({
      label: c,
      value: c,
      count: counts[c] || 0,
    }));
  }, [tableData]);

  const hostFilterOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    tableData.forEach((r) => {
      if (r.primaryHost) counts[r.primaryHost] = (counts[r.primaryHost] || 0) + 1;
    });
    return Object.keys(counts).map((h) => ({
      label: h,
      value: h,
      count: counts[h],
    }));
  }, [tableData]);

  // Counts for scope segment tabs
  const scopeCounts = useMemo(() => {
    const upcoming = tableData.filter(
      (r) => r.status !== 'Completed' && (r.weeksFromToday > 0 || r.isAwareness)
    ).length;
    const completed = tableData.filter(
      (r) => r.status === 'Completed' || (r.weeksFromToday <= 0 && !r.isAwareness)
    ).length;
    return {
      all: tableData.length,
      upcoming,
      completed,
    };
  }, [tableData]);

  const filteredData = useMemo(() => {
    const result = tableData.filter((row) => {
      // Event Scope Filter
      if (eventScope === 'upcoming') {
        if (row.status === 'Completed' || (row.weeksFromToday <= 0 && !row.isAwareness)) {
          return false;
        }
      } else if (eventScope === 'completed') {
        if (row.status !== 'Completed' && row.weeksFromToday > 0) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = row.title.toLowerCase().includes(q);
        const matchLoc = row.location.toLowerCase().includes(q);
        const matchHost =
          row.primaryHost.toLowerCase().includes(q) ||
          row.coHosts.some((h) => h.toLowerCase().includes(q));
        const matchCategory = row.category.toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchHost && !matchCategory) return false;
      }

      if (selectedMonths.length > 0 && !selectedMonths.includes(row.monthFormatted)) {
        return false;
      }

      if (selectedStatuses.length > 0 && !selectedStatuses.includes(row.status)) {
        return false;
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(row.category)) {
        return false;
      }

      if (selectedHosts.length > 0) {
        const hostMatches = selectedHosts.some(
          (h) => row.primaryHost.includes(h) || row.coHosts.some((ch) => ch.includes(h))
        );
        if (!hostMatches) return false;
      }

      return true;
    });

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
  }, [
    tableData,
    searchQuery,
    selectedMonths,
    selectedStatuses,
    selectedCategories,
    selectedHosts,
    sortBy,
    sortOrder,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedMonths.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedCategories.length > 0 ||
    selectedHosts.length > 0;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMonths([]);
    setSelectedStatuses([]);
    setSelectedCategories([]);
    setSelectedHosts([]);
  };

  const handleStartEdit = (row: TableRowItem) => {
    setEditingRowId(row.id);
    setEditFormData({
      title: row.title,
      startDate: row.startDate,
      location: row.location,
      cost: row.cost,
      status: (row.status as EventStatus) || 'Planning',
      primaryHost: row.primaryHost,
      coHosts: row.coHosts.join(', '),
      isAwareness: row.isAwareness,
      category: row.category,
    });
  };

  const handleSaveEdit = async (id: string) => {
    const row = tableData.find((r) => r.id === id);
    if (row?.isAwareness) {
      if (onUpdateAwarenessEvent) {
        let newCategory = editFormData.category || 'City Event';
        if (editFormData.status === 'Conference') newCategory = 'Community / Conference';
        else if (editFormData.status === 'Holiday') newCategory = 'Civic / Holiday';
        else if (editFormData.status === 'City Event') newCategory = 'City Event';

        await onUpdateAwarenessEvent(id, {
          title: editFormData.title,
          start_date: editFormData.startDate,
          end_date: editFormData.startDate,
          location: editFormData.location,
          category: newCategory as any,
        });
      }
    } else {
      const coHostsArray = (editFormData.coHosts || '')
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);

      await onUpdateEvent(id, {
        title: editFormData.title,
        event_date: editFormData.startDate,
        location_name: editFormData.location,
        cost_per_person: Number(editFormData.cost) || 0,
        status: editFormData.status as EventStatus,
        primary_host: editFormData.primaryHost,
        co_hosts: coHostsArray,
      });
    }
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
    }
  };

  const getAvatarBadge = (name: string, coHosts: string[] = []) => {
    if (name.toLowerCase().includes('leighton')) return 'L&A';
    if (name.toLowerCase().includes('janice')) return 'J';
    if (name.toLowerCase().includes('tammy')) {
      return coHosts.length > 0 ? 'T T&B' : 'T';
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRowStyling = (row: TableRowItem) => {
    if (row.isAwareness) {
      let statusLabel = 'City Event';
      const cat = (row.category || '').toLowerCase();
      const st = (String(row.status) || '').toLowerCase();

      if (st.includes('conference') || cat.includes('conference') || cat.includes('summit')) {
        statusLabel = 'Conference';
      } else if (st.includes('holiday') || cat.includes('holiday') || cat.includes('civic')) {
        statusLabel = 'Holiday';
      } else {
        statusLabel = 'City Event';
      }

      return {
        bg: 'bg-purple-100/75 hover:bg-purple-200/60 border-l-[5px] border-l-[#57068c] text-slate-900',
        dot: 'bg-[#57068c]',
        badgeVariant: 'secondary' as const,
        badgeClass: 'bg-purple-200 text-[#57068c] border-purple-300/90 font-extrabold text-[10px] uppercase tracking-wider shadow-2xs',
        statusText: statusLabel,
      };
    }

    switch (row.status) {
      case 'Confirmed':
        return {
          bg: 'bg-emerald-50/50 hover:bg-emerald-100/70 border-l-[5px] border-l-emerald-600 text-slate-900',
          dot: 'bg-emerald-600',
          badgeVariant: 'confirmed' as const,
        };
      case 'Submitted':
        return {
          bg: 'bg-purple-50/60 hover:bg-purple-100/80 border-l-[5px] border-l-[#57068c] text-slate-900',
          dot: 'bg-[#57068c]',
          badgeVariant: 'submitted' as const,
        };
      case 'Planning':
        return {
          bg: 'bg-sky-50/50 hover:bg-sky-100/70 border-l-[5px] border-l-sky-500 text-slate-900',
          dot: 'bg-sky-600',
          badgeVariant: 'planning' as const,
        };
      case 'Idea':
        return {
          bg: 'bg-amber-50/50 hover:bg-amber-100/70 border-l-[5px] border-l-amber-500 text-slate-900',
          dot: 'bg-amber-500',
          badgeVariant: 'idea' as const,
        };
      case 'Completed':
        return {
          bg: 'bg-slate-100/60 hover:bg-slate-200/60 border-l-[5px] border-l-slate-400 text-slate-600',
          dot: 'bg-slate-400',
          badgeVariant: 'secondary' as const,
        };
      default:
        return {
          bg: 'bg-white hover:bg-slate-50 border-l-[5px] border-l-slate-300 text-slate-900',
          dot: 'bg-slate-400',
          badgeVariant: 'secondary' as const,
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
        {/* Scope Segment Tabs: All, Upcoming, Completed */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEventScope('all')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none',
                eventScope === 'all'
                  ? 'bg-[#57068c] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              )}
            >
              <span>All Events</span>
              <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-bold', eventScope === 'all' ? 'bg-purple-800 text-purple-100' : 'bg-slate-200 text-slate-600')}>
                {scopeCounts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setEventScope('upcoming')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none',
                eventScope === 'upcoming'
                  ? 'bg-[#57068c] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              )}
            >
              <span>Upcoming & Planning</span>
              <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-bold', eventScope === 'upcoming' ? 'bg-purple-800 text-purple-100' : 'bg-emerald-100 text-emerald-800')}>
                {scopeCounts.upcoming}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setEventScope('completed')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none',
                eventScope === 'completed'
                  ? 'bg-[#57068c] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              )}
            >
              <span>Completed & Past Events</span>
              <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-bold', eventScope === 'completed' ? 'bg-purple-800 text-purple-100' : 'bg-slate-200 text-slate-700')}>
                {scopeCounts.completed}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Showing <strong>{filteredData.length}</strong> {eventScope === 'completed' ? 'completed past' : eventScope === 'upcoming' ? 'upcoming' : 'total'} items
          </div>
        </div>

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

        {/* Filters Row (All Multi-Select) */}
        <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-100 text-xs">
          {/* Month Multi-Select */}
          <MultiSelectDropdown
            label="Month"
            placeholder="All Months"
            options={monthFilterOptions}
            selected={selectedMonths}
            onChange={setSelectedMonths}
          />

          {/* Status Multi-Select */}
          <MultiSelectDropdown
            label="Status"
            placeholder="All Statuses"
            options={statusFilterOptions}
            selected={selectedStatuses}
            onChange={setSelectedStatuses}
          />

          {/* Category Multi-Select */}
          <MultiSelectDropdown
            label="Category"
            placeholder="All Categories"
            options={categoryFilterOptions}
            selected={selectedCategories}
            onChange={setSelectedCategories}
          />

          {/* Host Multi-Select */}
          <MultiSelectDropdown
            label="Host"
            placeholder="All Hosts"
            options={hostFilterOptions}
            selected={selectedHosts}
            onChange={setSelectedHosts}
          />

          {/* Reset Filters Pill when active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}

          {/* Result Count */}
          <div className="ml-auto text-xs text-slate-500 font-medium">
            Showing <strong>{filteredData.length}</strong> events
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[880px] min-h-[500px]">
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
                            {editFormData.isAwareness ? (
                              <span className="text-slate-400 text-xs italic">—</span>
                            ) : (
                              <Input
                                type="number"
                                value={editFormData.cost}
                                onChange={(e) => setEditFormData({ ...editFormData, cost: Number(e.target.value) })}
                                className="h-8 text-xs w-20 bg-white"
                              />
                            )}
                          </td>
                        )}

                        {/* Status Dropdown */}
                        {visibleColumns.status && (
                          <td className="py-2.5 px-3.5">
                            {editFormData.isAwareness ? (
                              <select
                                value={
                                  editFormData.category?.toLowerCase().includes('conference') || editFormData.status === 'Conference'
                                    ? 'Conference'
                                    : editFormData.category?.toLowerCase().includes('holiday') || editFormData.category?.toLowerCase().includes('civic') || editFormData.status === 'Holiday'
                                    ? 'Holiday'
                                    : 'City Event'
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  let newCat = 'City Event';
                                  if (val === 'Conference') newCat = 'Community / Conference';
                                  else if (val === 'Holiday') newCat = 'Civic / Holiday';
                                  else newCat = 'City Event';
                                  setEditFormData({ ...editFormData, category: newCat, status: val as any });
                                }}
                                className="h-8 rounded-md border border-purple-300 bg-white px-2 text-xs font-bold text-[#57068c] focus:ring-1 focus:ring-purple-600"
                              >
                                <option value="Holiday">Holiday</option>
                                <option value="Conference">Conference</option>
                                <option value="City Event">City Event</option>
                              </select>
                            ) : (
                              <select
                                value={editFormData.status}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as EventStatus })}
                                className="h-8 rounded-md border border-purple-300 bg-white px-2 text-xs font-medium focus:ring-1 focus:ring-purple-600"
                              >
                                <option value="Idea">Idea</option>
                                <option value="Planning">Planning</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Completed">Completed</option>
                              </select>
                            )}
                          </td>
                        )}

                        {/* Hosts Input */}
                        {visibleColumns.host && (
                          <td className="py-2.5 px-3.5">
                            {editFormData.isAwareness ? null : (
                              <Input
                                placeholder="Primary Host"
                                value={editFormData.primaryHost}
                                onChange={(e) => setEditFormData({ ...editFormData, primaryHost: e.target.value })}
                                className="h-8 text-xs bg-white"
                              />
                            )}
                          </td>
                        )}

                        {/* Category */}
                        {visibleColumns.category && (
                          <td className="py-2.5 px-3.5 font-medium text-slate-600">
                            {editFormData.isAwareness ? (
                              <select
                                value={editFormData.category}
                                onChange={(e) => {
                                  const newCat = e.target.value;
                                  let newSt = 'City Event';
                                  if (newCat.includes('Conference')) newSt = 'Conference';
                                  else if (newCat.includes('Holiday') || newCat.includes('Civic')) newSt = 'Holiday';
                                  setEditFormData({ ...editFormData, category: newCat, status: newSt as any });
                                }}
                                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium focus:ring-1 focus:ring-purple-600"
                              >
                                <option value="City Event">City Event</option>
                                <option value="Civic / Holiday">Civic / Holiday</option>
                                <option value="Community / Conference">Community / Conference</option>
                                <option value="Cultural">Cultural</option>
                                <option value="Campus / Sports">Campus / Sports</option>
                              </select>
                            ) : (
                              row.category
                            )}
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="group-hover:text-[#57068c] transition-colors">{row.title}</span>
                              {row.rawEvent?.is_recurring && (
                                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wide bg-purple-100 text-[#57068c] border border-purple-200" title="Recurring Series">
                                  <Repeat className="h-2.5 w-2.5" />
                                  <span>Series</span>
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Location */}
                        {visibleColumns.location && (
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span>{row.location}</span>
                            </span>
                          </td>
                        )}

                        {/* Cost (Togglable) */}
                        {visibleColumns.cost && (
                          <td className="py-3 px-3.5 whitespace-nowrap font-bold text-slate-800">
                            {row.isAwareness ? (
                              <span className="text-slate-400 font-normal italic">—</span>
                            ) : row.cost > 0 ? (
                              `$${row.cost}`
                            ) : (
                              'Free'
                            )}
                          </td>
                        )}

                        {/* Status */}
                        {visibleColumns.status && (
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {row.isAwareness ? (
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider select-none",
                                  styling.badgeClass || "bg-purple-200 text-[#57068c] border border-purple-300 shadow-2xs"
                                )}
                              >
                                {styling.statusText || row.status}
                              </span>
                            ) : (
                              <Badge
                                variant={styling.badgeVariant}
                                className="text-[10px] shadow-2xs font-bold"
                              >
                                {row.status}
                              </Badge>
                            )}
                          </td>
                        )}

                        {/* Host(s) */}
                        {visibleColumns.host && (
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {row.isAwareness ? null : (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-white shadow-2xs">
                                  {getAvatarBadge(row.primaryHost, row.coHosts)}
                                </span>
                                <span className="text-slate-700 font-semibold">{row.primaryHost}</span>
                                {row.coHosts.length > 0 && (
                                  <span className="text-slate-400 text-[10px]">+ {row.coHosts.length}</span>
                                )}
                              </div>
                            )}
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
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {!row.isAwareness && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (onDuplicateEvent) {
                                    await onDuplicateEvent(row.id);
                                  }
                                }}
                                className="rounded p-1 text-slate-400 hover:bg-purple-100 hover:text-[#57068c] transition-colors cursor-pointer"
                                title="Duplicate / Copy Event to Next Month"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(row)}
                              className="rounded p-1 text-slate-400 hover:bg-purple-100 hover:text-[#57068c] transition-colors cursor-pointer"
                              title={row.isAwareness ? "Edit Conference / Awareness" : "Edit Event / Location"}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete "${row.title}"?`)) {
                                  if (row.isAwareness) {
                                    if (onDeleteAwarenessEvent) {
                                      await onDeleteAwarenessEvent(row.id);
                                    } else {
                                      await deleteAwarenessEvent(row.id);
                                    }
                                  } else if (onDeleteEvent) {
                                    await onDeleteEvent(row.id);
                                  }
                                }
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                              title={row.isAwareness ? "Delete Conference / Awareness" : "Delete Event"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
