import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "planning" | "submitted" | "confirmed" | "completed" | "cancelled" | "idea" | "warning" | "community" | "purple" | "emerald";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-purple-700 text-white hover:bg-purple-800",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "text-slate-800 border border-slate-300 dark:text-slate-200 dark:border-slate-700",
    planning: "bg-amber-100 text-amber-900 border border-amber-300/80 font-medium",
    submitted: "bg-purple-100 text-purple-900 border border-purple-300/80 font-medium",
    confirmed: "bg-emerald-100 text-emerald-900 border border-emerald-300/80 font-medium",
    completed: "bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold",
    cancelled: "bg-rose-100 text-rose-900 border border-rose-300 font-bold line-through",
    idea: "bg-slate-100 text-slate-800 border border-slate-300 font-medium",
    warning: "bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5",
    community: "bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium",
    purple: "bg-[#57068c] text-white",
    emerald: "bg-emerald-600 text-white",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2",
        variantStyles,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
