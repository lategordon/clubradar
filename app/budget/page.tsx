'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BudgetTable } from '@/components/budget/BudgetTable';
import { AddBudgetItemModal } from '@/components/budget/AddBudgetItemModal';
import { ToastContainer, ToastMessage } from '@/components/ui/toast';
import {
  getBudgetItems,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
} from '@/lib/data-service';
import { BudgetItem } from '@/types/database.types';
import {
  calculateFiscalYearSummary,
  getFiscalYear,
  getFiscalYearDetails,
  ANNUAL_STIPEND_DEFAULT,
} from '@/lib/utils/fiscal-year';
import {
  Wallet,
  Plus,
  Search,
  Copy,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function BudgetPage() {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  
  // Fiscal Year state (Default to current FY26)
  const [selectedFY, setSelectedFY] = useState<string>('FY26');
  const [stipendAmount, setStipendAmount] = useState<number>(ANNUAL_STIPEND_DEFAULT);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'actuals' | 'pending' | 'rollover'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
      const items = await getBudgetItems();
      setBudgetItems(items || []);
    } catch (err) {
      console.error('Error loading budget data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBudgetItem = async (
    newItemData: Omit<BudgetItem, 'id' | 'created_at'>
  ) => {
    await createBudgetItem(newItemData);
    await loadData();
    addToast(
      'Budget Line Item Added',
      `"${newItemData.event_name}" ($${newItemData.budgeted}) added to ${newItemData.fiscal_year || selectedFY}.`,
      'success'
    );
  };

  const handleUpdateBudgetItem = async (id: string, updates: Partial<BudgetItem>) => {
    await updateBudgetItem(id, updates);
    await loadData();
    addToast('Line Item Updated', 'Budget entry changes saved.', 'info');
  };

  const handleDeleteBudgetItem = async (id: string) => {
    await deleteBudgetItem(id);
    await loadData();
    addToast('Line Item Removed', 'Entry removed from budget ledger.', 'warning');
  };

  // Fiscal Year Summary Calculation
  const fySummary = useMemo(() => {
    return calculateFiscalYearSummary(selectedFY, budgetItems, stipendAmount);
  }, [selectedFY, budgetItems, stipendAmount]);

  // Filtered Budget Items for Selected FY & Search & Filter Tabs
  const filteredItems = useMemo(() => {
    return budgetItems
      .filter((item) => item.fiscal_year === selectedFY)
      .filter((item) => {
        if (filterType === 'actuals' && (item.actual === null || item.actual === undefined)) {
          return false;
        }
        if (filterType === 'pending' && (item.actual !== null && item.actual !== undefined)) {
          return false;
        }
        if (filterType === 'rollover' && !item.is_paid_past_fy && !item.notes?.toLowerCase().includes('past fiscal year')) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.event_name.toLowerCase().includes(q);
          const matchNotes = (item.notes || '').toLowerCase().includes(q);
          const matchDate = item.date.includes(q);
          return matchName || matchNotes || matchDate;
        }
        return true;
      });
  }, [budgetItems, selectedFY, filterType, searchQuery]);

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const summaryText = [
      `=== NYU Alumni Club Budget Summary: ${selectedFY} ===`,
      `Annual Stipend: $${fySummary.stipend.toLocaleString()}`,
      `Budgeted Used to Date: $${fySummary.budgeted_total.toLocaleString()}`,
      `Actual Used to Date: $${fySummary.actual_total.toLocaleString()}`,
      `Remaining Stipend Forecast: $${fySummary.remaining_stipend.toLocaleString()}`,
      `Total Line Items: ${filteredItems.length}`,
      `Cycle: ${fySummary.label}`,
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      addToast('Summary Copied', `Copied ${selectedFY} budget summary to clipboard.`, 'success');
    }
  };

  const availableFYs = ['FY26', 'FY27', 'FY25'];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar activeTab="budget" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Header: Title & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#57068c] text-white shadow-sm">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  <span>Fiscal Year Budget</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100/90 px-2 py-0.5 rounded-full border border-purple-200">
                    {selectedFY}
                  </span>
                </h1>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  NYU Fiscal Year Cycle (Sept 1 – Aug 31) • Annual $5,000 Stipend Subsidy Ledger
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="text-xs font-bold text-slate-700 gap-1.5 shadow-2xs"
              title="Copy budget summary numbers"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Summary</span>
            </Button>

            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#57068c] hover:bg-[#460570] text-white font-bold text-xs gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>+ Add Line Item</span>
            </Button>
          </div>
        </div>

        {/* Fiscal Year Switcher & Cycle Notice Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* FY Switcher Tabs */}
            <div className="flex items-center gap-1.5">
              {availableFYs.map((fy) => {
                const isSelected = selectedFY === fy;
                const details = getFiscalYearDetails(fy);
                return (
                  <button
                    key={fy}
                    type="button"
                    onClick={() => setSelectedFY(fy)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs',
                      isSelected
                        ? 'bg-[#57068c] text-white ring-2 ring-purple-300'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    )}
                  >
                    <span>{fy}</span>
                    <span
                      className={cn(
                        'text-[10px] font-medium hidden sm:inline',
                        isSelected ? 'text-purple-200' : 'text-slate-500'
                      )}
                    >
                      (Sept {details.start_year} – Aug {details.end_year})
                    </span>
                    {fy === 'FY26' && (
                      <span
                        className={cn(
                          'text-[9px] font-extrabold px-1.5 py-0.2 rounded-full',
                          isSelected
                            ? 'bg-purple-800 text-purple-100'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        )}
                      >
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Reset Notice */}
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-purple-50/70 border border-purple-100 px-3 py-1.5 rounded-xl">
              <Clock className="h-4 w-4 text-purple-700 shrink-0" />
              <span>
                <strong>Annual Reset:</strong> Budget resets to <strong>$5,000.00</strong> every <strong>Sept 1st</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* 4 Top KPI Cards (Matching the user's spreadsheet summary) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          {/* 1. FY Stipend */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>{selectedFY} Annual Stipend</span>
                <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-bold">
                  Baseline
                </span>
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  ${fySummary.stipend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 font-medium">
              NYU Alumni Relations annual allocation
            </p>
          </div>

          {/* 2. Budgeted Used to Date */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Budgeted Used to Date</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                  Planned
                </span>
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  ${fySummary.budgeted_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 font-medium">
              Sum of all planned event subsidies
            </p>
          </div>

          {/* 3. Actual Used to Date */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center justify-between">
                <span>Actual Used to Date</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                  Realized
                </span>
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-950">
                  ${fySummary.actual_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-emerald-800/80 font-medium">
              Finalized reimbursements recorded
            </p>
          </div>

          {/* 4. Remaining Stipend* (Highlighted Purple matching the spreadsheet formula) */}
          <div className="rounded-2xl border border-purple-300 bg-purple-100/70 p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-950 flex items-center justify-between">
                <span>Remaining Stipend*</span>
                <span
                  className={cn(
                    'text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs',
                    fySummary.remaining_stipend >= 0
                      ? 'bg-purple-700 text-white'
                      : 'bg-rose-600 text-white'
                  )}
                >
                  {fySummary.remaining_stipend >= 0 ? 'On Track' : 'Over Budget'}
                </span>
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-3xl font-black font-mono tracking-tight',
                    fySummary.remaining_stipend >= 0 ? 'text-[#57068c]' : 'text-rose-700'
                  )}
                >
                  ${fySummary.remaining_stipend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Visual Stipend Utilization Progress Bar */}
            <div className="space-y-1.5 pt-1 border-t border-purple-200/80">
              <div className="flex items-center justify-between text-[10px] font-bold text-purple-950">
                <span>$5k Stipend Utilization</span>
                <span className="font-mono">
                  {Math.min(100, Math.max(0, ((5000 - fySummary.remaining_stipend) / 5000) * 100)).toFixed(1)}% Used
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-purple-200/80 overflow-hidden flex shadow-inner">
                {/* Realized Actuals segment */}
                <div
                  className="bg-[#57068c] h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (fySummary.actual_total / 5000) * 100))}%`,
                  }}
                  title={`Actuals Spent: $${fySummary.actual_total.toFixed(2)}`}
                />
                {/* Planned Future Subsidies segment */}
                <div
                  className="bg-purple-400 h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100 - Math.min(100, Math.max(0, (fySummary.actual_total / 5000) * 100)),
                      Math.max(0, ((5000 - fySummary.remaining_stipend - fySummary.actual_total) / 5000) * 100)
                    )}%`,
                  }}
                  title="Planned Future Subsidies"
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-purple-900 font-semibold">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#57068c]" />
                  <span>Realized</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  <span>Planned</span>
                </span>
                <span className="font-mono text-slate-500">$5,000 Cap</span>
              </div>
            </div>

            <p className="text-[10px] text-purple-900/80 italic font-medium leading-tight">
              *Calculated by subtracting actual past expenses + budgeted future expenses
            </p>
          </div>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs',
                filterType === 'all'
                  ? 'bg-[#57068c] text-white'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              )}
            >
              All Line Items ({budgetItems.filter((i) => i.fiscal_year === selectedFY).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('actuals')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs',
                filterType === 'actuals'
                  ? 'bg-[#57068c] text-white'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              )}
            >
              Finalized Actuals
            </button>
            <button
              type="button"
              onClick={() => setFilterType('pending')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs',
                filterType === 'pending'
                  ? 'bg-[#57068c] text-white'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              )}
            >
              Pending Forecasts
            </button>
            <button
              type="button"
              onClick={() => setFilterType('rollover')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs',
                filterType === 'rollover'
                  ? 'bg-[#57068c] text-white'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              )}
            >
              Past FY Rollover
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search expenses by event or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50"
            />
          </div>
        </div>

        {/* Main Budget Spreadsheet Table (Full Width) */}
        <section className="w-full space-y-4">
          <BudgetTable
            items={filteredItems}
            onUpdateItem={handleUpdateBudgetItem}
            onDeleteItem={handleDeleteBudgetItem}
          />

          {filteredItems.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <Wallet className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No budget items for {selectedFY}</h4>
              <p className="text-xs text-slate-500">
                Click below to add your first expense or subsidy line item.
              </p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#57068c] hover:bg-[#460570] text-white text-xs font-bold"
              >
                + Add Line Item
              </Button>
            </div>
          )}
        </section>
      </main>

      {/* Add Budget Item Modal */}
      <AddBudgetItemModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        currentFY={selectedFY}
        onSave={handleCreateBudgetItem}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
