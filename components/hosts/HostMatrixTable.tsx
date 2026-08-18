'use client';

import React from 'react';
import { ClubLeader, EnrichedEvent } from '@/types/database.types';
import { Mail, ShieldCheck, Plus, Trash2, Edit2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HostMatrixTableProps {
  leaders: ClubLeader[];
  events: EnrichedEvent[];
  onSelectLeader: (leader: ClubLeader) => void;
  onAssignEvent: (leader: ClubLeader) => void;
  onDeleteLeader: (id: string, name: string) => void;
  onSelectEvent: (event: EnrichedEvent) => void;
  onCopyEmail?: (email: string, name: string) => void;
}

export function HostMatrixTable({
  leaders,
  events,
  onSelectLeader,
  onAssignEvent,
  onDeleteLeader,
  onSelectEvent,
  onCopyEmail,
}: HostMatrixTableProps) {
  const getLeaderEvents = (leaderName: string) => {
    return events.filter(
      (e) =>
        e.primary_host.toLowerCase().includes(leaderName.toLowerCase()) ||
        e.co_hosts_list.some((h) => h.toLowerCase().includes(leaderName.toLowerCase()))
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <th className="py-3 px-4">Volunteer</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Assigned Events Slate</th>
              <th className="py-3 px-4">Workload Capacity</th>
              <th className="py-3 px-4 text-center">SLA Compliance</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {leaders.map((leader) => {
              const assigned = getLeaderEvents(leader.name);
              const eventCount = assigned.length;

              return (
                <tr
                  key={leader.id}
                  onClick={() => onSelectLeader(leader)}
                  className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                >
                  {/* Leader Name & Avatar */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-2xs bg-[#57068c]">
                        {leader.avatar_initials}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 group-hover:text-[#57068c] transition-colors flex items-center gap-1.5">
                          <span>{leader.name}</span>
                          {leader.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-[#57068c] border border-purple-200 shadow-2xs">
                              {leader.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <a
                            href={`mailto:${leader.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-slate-500 hover:text-[#57068c] hover:underline flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{leader.email}</span>
                          </a>
                          {onCopyEmail && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyEmail(leader.email, leader.name);
                              }}
                              className="p-0.5 rounded text-slate-400 hover:text-[#57068c] hover:bg-purple-50 transition-all hover:scale-110 active:scale-95"
                              title="Copy email address"
                            >
                              <Copy className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{leader.role}</div>
                  </td>

                  {/* Assigned Events Slate */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {assigned.length > 0 ? (
                        assigned.map((evt) => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvent(evt);
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-950 px-2 py-1 text-[10px] font-bold text-slate-800 border border-slate-200 transition-colors shadow-2xs"
                            title={`${evt.title} (${evt.event_date}) - ${evt.status}`}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                evt.status === 'Submitted'
                                  ? 'bg-purple-600'
                                  : evt.status === 'Planning'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                              )}
                            />
                            <span className="truncate max-w-[130px]">{evt.title}</span>
                          </button>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No active events</span>
                      )}
                    </div>
                  </td>

                  {/* Workload Capacity 3-Segment Meter */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="w-32 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className={cn(
                          eventCount >= 3
                            ? 'text-amber-800 font-extrabold'
                            : eventCount >= 1
                            ? 'text-emerald-800'
                            : 'text-slate-500'
                        )}>
                          {eventCount} / 3 Planned
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {eventCount >= 3 ? 'Full' : eventCount >= 1 ? 'Optimal' : 'Open'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className={cn(
                          "h-1.5 rounded-full transition-colors",
                          eventCount >= 1 ? "bg-emerald-500" : "bg-slate-200"
                        )} />
                        <div className={cn(
                          "h-1.5 rounded-full transition-colors",
                          eventCount >= 2 ? "bg-emerald-500" : "bg-slate-200"
                        )} />
                        <div className={cn(
                          "h-1.5 rounded-full transition-colors",
                          eventCount >= 3 ? "bg-amber-500" : "bg-slate-200"
                        )} />
                      </div>
                    </div>
                  </td>

                  {/* SLA Compliance */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{leader.sla_compliance_rate || '100%'}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3.5 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAssignEvent(leader)}
                        className="flex items-center gap-1 rounded-md bg-purple-50 hover:bg-purple-100 text-[#57068c] font-bold text-[10px] px-2 py-1 border border-purple-200 shadow-2xs transition-colors cursor-pointer"
                        title="Assign Event to Volunteer"
                      >
                        <Plus className="h-3 w-3 stroke-[2.5]" />
                        <span>Assign</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectLeader(leader)}
                        className="rounded p-1 text-slate-400 hover:text-[#57068c] hover:bg-purple-50 transition-colors cursor-pointer"
                        title="View Profile"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteLeader(leader.id, leader.name)}
                        className="rounded p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove Volunteer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
