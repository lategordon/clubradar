'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BudgetItem } from '@/types/database.types';
import {
  DollarSign,
  Trash2,
  Check,
  X,
  Ban,
  RotateCcw,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

interface BudgetTableProps {
  items: BudgetItem[];
  onUpdateItem: (id: string, updates: Partial<BudgetItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export function BudgetTable({ items, onUpdateItem, onDeleteItem }: BudgetTableProps) {
  // Cell-level inline editing: { id, field }
  const [activeCell, setActiveCell] = useState<{
    id: string;
    field: 'actual' | 'budgeted' | 'notes' | 'eventName' | 'date';
  } | null>(null);

  const [tempVal, setTempVal] = useState<string>('');
  const [savedCellId, setSavedCellId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  const startCellEdit = (
    item: BudgetItem,
    field: 'actual' | 'budgeted' | 'notes' | 'eventName' | 'date'
  ) => {
    let currentVal = '';
    if (field === 'actual') {
      currentVal = item.actual !== null && item.actual !== undefined ? item.actual.toString() : '';
    } else if (field === 'budgeted') {
      currentVal = item.budgeted.toString();
    } else if (field === 'notes') {
      currentVal = item.notes || '';
    } else if (field === 'eventName') {
      currentVal = item.event_name;
    } else if (field === 'date') {
      currentVal = item.date;
    }

    setActiveCell({ id: item.id, field });
    setTempVal(currentVal);
  };

  const commitCellEdit = async () => {
    if (!activeCell) return;
    const { id, field } = activeCell;
    const targetItem = items.find((i) => i.id === id);
    if (!targetItem) {
      setActiveCell(null);
      return;
    }

    const updates: Partial<BudgetItem> = {};

    if (field === 'actual') {
      const parsed = tempVal.trim() === '' ? null : parseFloat(tempVal);
      updates.actual = isNaN(parsed as number) ? null : parsed;
    } else if (field === 'budgeted') {
      const parsed = parseFloat(tempVal);
      updates.budgeted = isNaN(parsed) ? 0 : parsed;
    } else if (field === 'notes') {
      updates.notes = tempVal.trim() || undefined;
    } else if (field === 'eventName') {
      if (tempVal.trim()) updates.event_name = tempVal.trim();
    } else if (field === 'date') {
      if (tempVal.trim()) updates.date = tempVal.trim();
    }

    setActiveCell(null);
    await onUpdateItem(id, updates);

    // Flash save feedback
    setSavedCellId(`${id}-${field}`);
    setTimeout(() => setSavedCellId(null), 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitCellEdit();
    } else if (e.key === 'Escape') {
      setActiveCell(null);
    }
  };

  const toggleCancelled = async (item: BudgetItem) => {
    await onUpdateItem(item.id, {
      is_cancelled: !item.is_cancelled,
    });
  };

  // Format currency helper
  const fmtCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    const isNeg = val < 0;
    const absStr = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isNeg ? `-$${absStr}` : `$${absStr}`;
  };

  // Format date helper
  const fmtDate = (dStr: string) => {
    try {
      const d = parseISO(dStr);
      if (isValid(d)) return format(d, 'M/d/yyyy');
      return dStr;
    } catch {
      return dStr;
    }
  };

  // Totals for table footer
  const totalBudgeted = items
    .filter((i) => !i.is_cancelled)
    .reduce((sum, i) => sum + (Number(i.budgeted) || 0), 0);

  const totalActual = items
    .filter((i) => !i.is_cancelled && i.actual !== null && i.actual !== undefined)
    .reduce((sum, i) => sum + Number(i.actual), 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Click-to-edit tip bar */}
      <div className="bg-purple-50/60 border-b border-purple-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-purple-950 font-medium">
        <span className="flex items-center gap-1.5">
          <Edit3 className="h-3.5 w-3.5 text-purple-700" />
          <span><strong>Quick Edit:</strong> Click directly into any <strong>Actual</strong>, <strong>Budgeted</strong>, or <strong>Notes</strong> cell to type and update numbers instantly.</span>
        </span>
        <span className="text-[10px] text-purple-700/80 hidden sm:inline">Press Enter or click away to save</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <th className="py-3 px-4 w-[280px]">Event / Expense Name</th>
              <th className="py-3 px-3 w-[110px]">Date</th>
              <th className="py-3 px-3 w-[120px] text-right">Budgeted ($)</th>
              <th className="py-3 px-3 w-[130px] text-right bg-purple-50/40 border-x border-purple-100/80 text-purple-950">
                Actual ($) <span className="text-[9px] font-normal text-purple-700">(Click to Edit)</span>
              </th>
              <th className="py-3 px-3 w-[100px] text-right">Variance</th>
              <th className="py-3 px-4">Notes / Annotations</th>
              <th className="py-3 px-3 text-right w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {items.map((item) => {
              const isPastFY = item.is_paid_past_fy || item.notes?.toLowerCase().includes('past fiscal year');
              const isCancelled = item.is_cancelled;
              const hasActual = item.actual !== null && item.actual !== undefined;
              const variance = hasActual ? (item.budgeted - (item.actual || 0)) : null;

              const isEditingActual = activeCell?.id === item.id && activeCell?.field === 'actual';
              const isEditingBudgeted = activeCell?.id === item.id && activeCell?.field === 'budgeted';
              const isEditingNotes = activeCell?.id === item.id && activeCell?.field === 'notes';
              const isEditingName = activeCell?.id === item.id && activeCell?.field === 'eventName';
              const isEditingDate = activeCell?.id === item.id && activeCell?.field === 'date';

              return (
                <tr
                  key={item.id}
                  className={cn(
                    'transition-colors group',
                    isPastFY
                      ? 'bg-amber-50/70 hover:bg-amber-100/60'
                      : isCancelled
                      ? 'bg-slate-50/80 text-slate-400'
                      : 'hover:bg-purple-50/30'
                  )}
                >
                  {/* Event Name (Click to edit) */}
                  <td
                    onClick={() => startCellEdit(item, 'eventName')}
                    className="py-2 px-4 font-semibold text-slate-900 cursor-pointer hover:bg-purple-100/40 rounded transition-colors"
                    title="Click to edit event name"
                  >
                    {isEditingName ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={tempVal}
                        onChange={(e) => setTempVal(e.target.value)}
                        onBlur={commitCellEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded border-2 border-purple-600 bg-white px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none shadow-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-bold',
                            isCancelled && 'line-through text-slate-400',
                            isPastFY && 'text-amber-950'
                          )}
                        >
                          {item.event_name}
                        </span>
                        {isPastFY && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200/90 text-amber-900 border border-amber-300 shrink-0">
                            Past FY Rollover
                          </span>
                        )}
                        {isCancelled && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 border border-slate-300 shrink-0">
                            Cancelled
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Date (Click to edit) */}
                  <td
                    onClick={() => startCellEdit(item, 'date')}
                    className="py-2 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px] cursor-pointer hover:bg-purple-100/40 rounded transition-colors"
                    title="Click to edit date"
                  >
                    {isEditingDate ? (
                      <input
                        ref={inputRef}
                        type="date"
                        value={tempVal}
                        onChange={(e) => setTempVal(e.target.value)}
                        onBlur={commitCellEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded border-2 border-purple-600 bg-white px-1 py-0.5 text-[11px] font-mono shadow-sm focus:outline-none"
                      />
                    ) : (
                      <span className={cn(isCancelled && 'line-through text-slate-400')}>
                        {fmtDate(item.date)}
                      </span>
                    )}
                  </td>

                  {/* Budgeted ($) (Click to edit) */}
                  <td
                    onClick={() => startCellEdit(item, 'budgeted')}
                    className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap cursor-pointer hover:bg-purple-100/50 rounded transition-colors"
                    title="Click to edit budgeted amount"
                  >
                    {isEditingBudgeted ? (
                      <input
                        ref={inputRef}
                        type="number"
                        step="0.01"
                        value={tempVal}
                        onChange={(e) => setTempVal(e.target.value)}
                        onBlur={commitCellEdit}
                        onKeyDown={handleKeyDown}
                        className="w-24 text-right rounded border-2 border-purple-600 bg-white px-1.5 py-0.5 text-xs font-mono font-bold shadow-sm focus:outline-none"
                      />
                    ) : (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded transition-all',
                          savedCellId === `${item.id}-budgeted` && 'bg-emerald-200 text-emerald-950 font-black ring-2 ring-emerald-400',
                          isCancelled && 'line-through text-slate-400'
                        )}
                      >
                        {fmtCurrency(item.budgeted)}
                      </span>
                    )}
                  </td>

                  {/* ACTUAL ($) (Direct Click-to-Edit Cell!) */}
                  <td
                    onClick={() => startCellEdit(item, 'actual')}
                    className={cn(
                      'py-2 px-3 text-right font-mono font-bold whitespace-nowrap cursor-pointer border-x border-purple-100/80 transition-all',
                      isEditingActual
                        ? 'bg-purple-100/80 ring-2 ring-purple-500'
                        : 'bg-purple-50/25 hover:bg-purple-100/70'
                    )}
                    title="Click to enter or change actual amount"
                  >
                    {isEditingActual ? (
                      <input
                        ref={inputRef}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={tempVal}
                        onChange={(e) => setTempVal(e.target.value)}
                        onBlur={commitCellEdit}
                        onKeyDown={handleKeyDown}
                        className="w-24 text-right rounded border-2 border-[#57068c] bg-white px-1.5 py-0.5 text-xs font-mono font-black text-purple-950 shadow-md focus:outline-none"
                      />
                    ) : hasActual ? (
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 rounded font-extrabold transition-all',
                          savedCellId === `${item.id}-actual`
                            ? 'bg-emerald-200 text-emerald-950 font-black ring-2 ring-emerald-400'
                            : item.actual! > item.budgeted && item.budgeted > 0
                            ? 'text-amber-700 bg-amber-50 group-hover:bg-amber-100/80'
                            : 'text-emerald-800 bg-emerald-50 group-hover:bg-emerald-100/80',
                          isCancelled && 'line-through text-slate-400'
                        )}
                      >
                        {fmtCurrency(item.actual)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-950 bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200 shadow-2xs">
                        <span>+ Enter Actual</span>
                      </span>
                    )}
                  </td>

                  {/* Variance (Budgeted - Actual) */}
                  <td className="py-2 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                    {hasActual && !isCancelled ? (
                      <span
                        className={cn(
                          'font-bold inline-block px-1.5 py-0.5 rounded',
                          variance! >= 0
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-rose-700 bg-rose-50'
                        )}
                      >
                        {variance! >= 0 ? `+${fmtCurrency(variance)}` : fmtCurrency(variance)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Notes & Annotations (Click to edit) */}
                  <td
                    onClick={() => startCellEdit(item, 'notes')}
                    className="py-2 px-4 text-[11px] text-slate-600 cursor-pointer hover:bg-purple-100/40 rounded transition-colors"
                    title="Click to edit notes"
                  >
                    {isEditingNotes ? (
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Add notes..."
                        value={tempVal}
                        onChange={(e) => setTempVal(e.target.value)}
                        onBlur={commitCellEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded border-2 border-purple-600 bg-white px-2 py-1 text-xs shadow-sm focus:outline-none"
                      />
                    ) : (
                      <span
                        className={cn(
                          item.notes ? 'text-slate-700 font-medium' : 'text-slate-400 italic',
                          savedCellId === `${item.id}-notes` && 'bg-emerald-100 text-emerald-950 px-1 rounded',
                          isCancelled && 'line-through text-slate-400'
                        )}
                      >
                        {item.notes || '—'}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => toggleCancelled(item)}
                        className={cn(
                          'rounded p-1 transition-colors cursor-pointer',
                          isCancelled
                            ? 'text-purple-600 hover:bg-purple-50'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        )}
                        title={isCancelled ? 'Restore Item' : 'Mark as Cancelled'}
                      >
                        {isCancelled ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete "${item.event_name}" from budget ledger?`)) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="rounded p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer Totals */}
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-black text-slate-900 text-xs">
              <td className="py-3 px-4 uppercase tracking-wider text-slate-700">
                Total FY Line Items ({items.filter((i) => !i.is_cancelled).length})
              </td>
              <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">All Dates</td>
              <td className="py-3 px-3 text-right font-mono text-xs font-black text-purple-950">
                {fmtCurrency(totalBudgeted)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-xs font-black text-emerald-900 bg-purple-100/60 border-x border-purple-200">
                {fmtCurrency(totalActual)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-700">
                {fmtCurrency(totalBudgeted - totalActual)}
              </td>
              <td colSpan={2} className="py-3 px-4 text-right text-[11px] text-slate-500 font-normal">
                *Remaining Stipend Forecast accounts for both finalized actuals and upcoming planned budgets
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
