'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Plus,
  Sparkles,
  Calendar,
  LayoutDashboard,
  Users,
  FileBarChart,
  Layers,
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO, addWeeks } from 'date-fns';
import { DEFAULT_CURRENT_DATE } from '@/lib/utils/deadlines';

interface NavbarProps {
  onOpenAddEvent?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  urgentAlertsCount?: number;
  onSelectEventId?: (eventId: string) => void;
}

export function Navbar({
  onOpenAddEvent,
  activeTab,
  onSelectTab,
  urgentAlertsCount = 3,
  onSelectEventId,
}: NavbarProps) {
  const pathname = usePathname();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(urgentAlertsCount);
  const notifRef = useRef<HTMLDivElement>(null);

  // Dynamic Planning Horizon Calculations (8 Weeks & 6 Weeks from Today)
  const baseDate = parseISO(DEFAULT_CURRENT_DATE);
  const sixWeeksDate = addWeeks(baseDate, 6);
  const eightWeeksDate = addWeeks(baseDate, 8);
  const sixWeeksFormatted = format(sixWeeksDate, 'EEEE, MMMM d, yyyy');
  const eightWeeksFormatted = format(eightWeeksDate, 'EEEE, MMMM d, yyyy');

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  const navItems = [
    { label: 'Dashboard', href: '/', id: 'dashboard', icon: LayoutDashboard },
    { label: 'Calendar', href: '/calendar', id: 'calendar', icon: Calendar },
    { label: 'Budget', href: '/budget', id: 'budget', icon: Wallet },
    { label: 'Ideas', href: '/ideas', id: 'ideas', icon: Lightbulb, badge: '6' },
    { label: 'Volunteers', href: '/volunteers', id: 'volunteers', icon: Users },
    { label: 'Reports', href: '/reports', id: 'reports', icon: FileBarChart },
  ];

  const notifications = [
    {
      id: 'notif-1',
      title: '6-Week Marketing Deadline Approaching',
      description: 'Dolores Park Picnic (Oct 8) requires marketing copy submitted for NYU newsletter inclusion.',
      type: 'warning',
      time: 'Action Required • 2 days left',
      href: '/calendar',
    },
    {
      id: 'notif-2',
      title: 'Calendar Conflict Detected',
      description: 'Dolores Park Picnic overlaps with SF Tech Week (Oct 5-11). Consider co-marketing or venue reservation check.',
      type: 'conflict',
      time: 'Radar Alert',
      href: '/',
    },
    {
      id: 'notif-3',
      title: 'Idea Reached Threshold',
      description: '"Silicon Valley AI Founders Roundtable" reached 14 upvotes and is marked Ready to Plan.',
      type: 'idea',
      time: 'Ideas Incubator',
      href: '/ideas',
    },
  ];

  const handleClearNotifications = () => {
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* NYU Torch Logo Symbol */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#57068c] text-white shadow-sm group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M12 2L14.5 7.5L20 8L16 12L17 17.5L12 15L7 17.5L8 12L4 8L9.5 7.5L12 2Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900">
                  ClubRadar
                </span>
                <span className="inline-block text-[10px] font-bold tracking-wide text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                  NYU Bay Area Alumni Club
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 ml-6">
            {navItems.map((item) => {
              const isActive = activeTab
                ? activeTab === item.id || (item.id === 'volunteers' && activeTab === 'hosts') || (item.id === 'hosts' && activeTab === 'volunteers')
                : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) || (item.href === '/volunteers' && pathname.startsWith('/hosts')) || (item.href === '/hosts' && pathname.startsWith('/volunteers'));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md select-none',
                    isActive
                      ? 'text-[#57068c] font-semibold bg-purple-50/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#57068c] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {onOpenAddEvent && (
            <Button
              onClick={onOpenAddEvent}
              size="sm"
              className="bg-[#57068c] hover:bg-[#470573] text-white gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Event</span>
            </Button>
          )}

          {/* Notification Bell Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className={cn(
                'relative rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer',
                isNotifOpen && 'bg-slate-100 text-slate-900'
              )}
              title={`${unreadCount} workflow alerts`}
              aria-label="Workflow Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
            </button>

            {/* Notification Popover Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Workflow & Radar Alerts</span>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                        {unreadCount} new
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        All cleared
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearNotifications}
                      className="text-[11px] font-semibold text-[#57068c] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setIsNotifOpen(false)}
                      className="flex items-start gap-3 p-3 hover:bg-purple-50/50 transition-colors group"
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'warning' ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        ) : n.type === 'conflict' ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-[#57068c]">
                            <Lightbulb className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#57068c] transition-colors truncate">
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-600 font-medium shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">
                          {n.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="p-2.5 border-t border-slate-100 bg-slate-50/60 text-center">
                  <Link
                    href="/reports"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs font-bold text-[#57068c] hover:underline flex items-center justify-center gap-1"
                  >
                    <span>View Lead-Time Compliance Report</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold text-white ring-2 ring-purple-200">
              L&A
            </div>
          </div>
        </div>
      </div>

      {/* Top Planning Lead-Time Horizon Banner (Visible on all tabs) */}
      <div className="border-t border-purple-100 bg-linear-to-r from-purple-50/90 via-slate-50 to-purple-50/90 px-4 py-1.5 shadow-2xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#57068c] text-white shadow-2xs">
              <Clock className="h-3 w-3" />
            </span>
            <span className="font-extrabold text-slate-800 tracking-tight text-[11px] sm:text-xs">
              Planning Horizon from Today:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px]">
            {/* 8 Weeks Milestone */}
            <div className="flex items-center gap-1.5 rounded-lg bg-purple-100/90 border border-purple-200 px-2.5 py-1 text-purple-950 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-[#57068c]" />
              <span className="font-extrabold">8 Weeks from Today:</span>
              <span className="font-black text-[#57068c] underline decoration-purple-300">
                {eightWeeksFormatted}
              </span>
              <span className="hidden lg:inline text-purple-800 font-medium">
                (Begin finding & setting up event)
              </span>
            </div>

            {/* 6 Weeks Deadline */}
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-100/90 border border-amber-300 px-2.5 py-1 text-amber-950 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-extrabold">6 Weeks from Today:</span>
              <span className="font-black text-amber-900 underline decoration-amber-400">
                {sixWeeksFormatted}
              </span>
              <span className="hidden lg:inline text-amber-800 font-medium">
                (Submit Event comms request for events up to this date)
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
