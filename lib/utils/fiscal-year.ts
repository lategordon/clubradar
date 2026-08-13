import { parseISO, getMonth, getYear, isValid } from 'date-fns';
import { BudgetItem, FiscalYearSummary } from '@/types/database.types';

export const ANNUAL_STIPEND_DEFAULT = 5000.0;

/**
 * Calculates the NYU Fiscal Year for a given date (Sept 1 - Aug 31).
 * E.g., Sept 1, 2025 to Aug 31, 2026 is FY26.
 */
export function getFiscalYear(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return 'FY26';

  const month = getMonth(date); // 0 = Jan, 8 = Sept, 11 = Dec
  const year = getYear(date);

  // If September (8) or later, it belongs to next calendar year's FY
  if (month >= 8) {
    const fyNum = (year + 1) % 100;
    return `FY${fyNum < 10 ? '0' : ''}${fyNum}`;
  } else {
    const fyNum = year % 100;
    return `FY${fyNum < 10 ? '0' : ''}${fyNum}`;
  }
}

/**
 * Returns human-readable label and date range for a given fiscal year.
 * E.g. 'FY26' -> 'FY26 (Sept 1, 2025 – Aug 31, 2026)'
 */
export function getFiscalYearDetails(fy: string): {
  fiscal_year: string;
  label: string;
  start_date: string;
  end_date: string;
  start_year: number;
  end_year: number;
} {
  const fyDigits = parseInt(fy.replace(/\D/g, ''), 10);
  const endYear = 2000 + (isNaN(fyDigits) ? 26 : fyDigits);
  const startYear = endYear - 1;

  return {
    fiscal_year: fy,
    label: `${fy} (Sept 1, ${startYear} – Aug 31, ${endYear})`,
    start_date: `${startYear}-09-01`,
    end_date: `${endYear}-08-31`,
    start_year: startYear,
    end_year: endYear,
  };
}

/**
 * Calculates the summary metrics for a fiscal year based on the active budget items.
 * Uses the exact accounting rule from the club spreadsheet:
 * Remaining = Stipend ($5,000) - (Actual where actual exists, else Budgeted estimate)
 */
export function calculateFiscalYearSummary(
  fy: string,
  items: BudgetItem[],
  stipend: number = ANNUAL_STIPEND_DEFAULT,
  currentDateStr: string = '2026-08-11'
): FiscalYearSummary {
  const fyDetails = getFiscalYearDetails(fy);
  const currentFY = getFiscalYear(currentDateStr);

  const validItems = items.filter(
    (item) => !item.is_cancelled && item.fiscal_year === fy
  );

  let budgetedTotal = 0;
  let actualTotal = 0;
  let allocatedBurden = 0;

  for (const item of validItems) {
    const budgetedVal = Number(item.budgeted) || 0;
    budgetedTotal += budgetedVal;

    if (item.actual !== null && item.actual !== undefined) {
      const actualVal = Number(item.actual);
      actualTotal += actualVal;
      allocatedBurden += actualVal;
    } else {
      allocatedBurden += budgetedVal;
    }
  }

  const remaining = stipend - allocatedBurden;

  return {
    fiscal_year: fy,
    label: fyDetails.label,
    stipend,
    budgeted_total: Math.round(budgetedTotal * 100) / 100,
    actual_total: Math.round(actualTotal * 100) / 100,
    remaining_stipend: Math.round(remaining * 100) / 100,
    is_current: fy === currentFY,
  };
}
