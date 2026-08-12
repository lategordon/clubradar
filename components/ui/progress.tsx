import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorClassName?: string;
}

export function Progress({ value, max = 100, className, indicatorClassName, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-200/80", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-[#57068c] transition-all duration-300", indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
