import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            // @ts-expect-error - pass active state to tab children
            currentValue: value,
            onSelect: onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({
  className,
  children,
  currentValue,
  onSelect,
}: {
  className?: string;
  children: React.ReactNode;
  currentValue?: string;
  onSelect?: (val: string) => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            // @ts-expect-error - pass active state
            isActive: child.props.value === currentValue,
            onSelect,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  isActive,
  onSelect,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  onSelect?: (val: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        isActive
          ? "bg-white text-purple-900 shadow-xs font-semibold"
          : "text-slate-600 hover:text-slate-900",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  currentValue,
  children,
  className,
}: {
  value: string;
  currentValue?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (value !== currentValue) return null;
  return <div className={cn("mt-4 focus-visible:outline-none", className)}>{children}</div>;
}
