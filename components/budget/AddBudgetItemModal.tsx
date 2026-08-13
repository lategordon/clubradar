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
import { BudgetItem } from '@/types/database.types';
import { Wallet, Calendar, DollarSign, FileText, Plus } from 'lucide-react';
import { getFiscalYear } from '@/lib/utils/fiscal-year';

interface AddBudgetItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFY: string;
  onSave: (item: Omit<BudgetItem, 'id' | 'created_at'>) => Promise<void>;
}

export function AddBudgetItemModal({
  open,
  onOpenChange,
  currentFY,
  onSave,
}: AddBudgetItemModalProps) {
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('2026-05-15');
  const [budgeted, setBudgeted] = useState<string>('150.00');
  const [actual, setActual] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isPaidPastFY, setIsPaidPastFY] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !date) return;

    setIsSubmitting(true);
    try {
      const fy = getFiscalYear(date);
      await onSave({
        event_name: eventName.trim(),
        date,
        budgeted: parseFloat(budgeted) || 0,
        actual: actual.trim() !== '' ? parseFloat(actual) : null,
        notes: notes.trim() || undefined,
        is_paid_past_fy: isPaidPastFY,
        fiscal_year: fy,
      });

      // Reset
      setEventName('');
      setBudgeted('150.00');
      setActual('');
      setNotes('');
      setIsPaidPastFY(false);
      onOpenChange(false);
    } catch (err) {
      console.error('Save budget item error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-[#57068c]">
            <Wallet className="h-4 w-4" />
          </span>
          <span>Add Budget Expense / Subsidy Item</span>
        </DialogTitle>
        <DialogDescription>
          Record an event subsidy or club expense deducted from your annual $5,000 stipend.
        </DialogDescription>
      </DialogHeader>
      <DialogClose onClose={() => onOpenChange(false)} />

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-3.5 text-xs max-h-[80vh] overflow-y-auto pr-1">
          {/* Event / Line Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Event / Expense Line Item Name *
            </label>
            <Input
              required
              placeholder="e.g. First Friday Happy Hour, Holiday Gala Deposit, Top Golf Subsidy"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="text-sm font-semibold h-9 bg-white"
            />
          </div>

          {/* Date & Fiscal Year Auto-Detection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-purple-700" />
                <span>Date of Expense *</span>
              </label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs font-medium h-9 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Fiscal Year Cycle
              </label>
              <div className="flex items-center h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-bold text-purple-900 text-xs">
                {getFiscalYear(date)} (Sept 1 – Aug 31)
              </div>
            </div>
          </div>

          {/* Budgeted vs Actual Subsidy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-purple-100 bg-purple-50/40">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-purple-700" />
                <span>Budgeted Subsidy ($) *</span>
              </label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 150.00"
                value={budgeted}
                onChange={(e) => setBudgeted(e.target.value)}
                className="text-xs font-semibold h-9 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Estimated allocation from $5k stipend.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span>Actual Subsidy Used ($)</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Leave blank if pending"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                className="text-xs font-semibold h-9 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Finalized amount after event wraps up.
              </span>
            </div>
          </div>

          {/* Notes & Special Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Notes & Annotations</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Shared 50% with Stern, catering deposit, ticket revenue offset..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          {/* Paid for past fiscal year checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="past_fy_cb"
              checked={isPaidPastFY}
              onChange={(e) => setIsPaidPastFY(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="past_fy_cb" className="text-xs font-semibold text-slate-700 select-none">
              Mark as expense paid for previous fiscal year rollover
            </label>
          </div>
        </DialogContent>

        <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !eventName.trim()}
            className="bg-[#57068c] hover:bg-[#460570] text-white font-bold text-xs"
          >
            {isSubmitting ? 'Saving...' : 'Add Line Item'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
