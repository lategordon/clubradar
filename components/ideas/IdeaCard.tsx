'use client';

import React from 'react';
import {
  ThumbsUp,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  ExternalLink,
  Building2,
  StickyNote,
  GripVertical,
} from 'lucide-react';
import { EventIdea } from '@/types/database.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IdeaCardProps {
  idea: EventIdea;
  onUpvote: (id: string) => void;
  onUpgrade: (idea: EventIdea) => void;
  onEdit?: (idea: EventIdea) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function IdeaCard({
  idea,
  onUpvote,
  onUpgrade,
  onEdit,
  isDraggable = true,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: IdeaCardProps) {
  const isPromoted = idea.status === 'Promoted';
  const hasUpvoted = (idea.upvoters || []).includes('Leighton');

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5",
        isDragging && "opacity-40 scale-[0.98] border-purple-400 ring-2 ring-purple-400 bg-purple-50/50",
        isDragOver && "ring-2 ring-[#57068c] border-purple-500 scale-[1.01] bg-purple-50/30",
        isPromoted
          ? "border-emerald-200 bg-emerald-50/20 opacity-90"
          : idea.status === 'Ready to Plan'
          ? "border-purple-200 bg-linear-to-b from-purple-50/40 to-white"
          : "border-slate-200"
      )}
    >
      <div className="space-y-3">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Drag Handle */}
            <div
              className="text-slate-300 group-hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing p-0.5"
              title="Click and drag to reorder idea"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <Badge
              variant={
                isPromoted
                  ? 'emerald'
                  : idea.status === 'Ready to Plan'
                  ? 'purple'
                  : idea.status === 'Under Consideration'
                  ? 'warning'
                  : 'secondary'
              }
              className="text-[10px] font-bold"
            >
              {idea.status}
            </Badge>

            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {idea.suggested_region}
            </span>

            {idea.estimated_cost_tier && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded">
                {idea.estimated_cost_tier}
              </span>
            )}
          </div>

          {/* Upvote Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpvote(idea.id);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer select-none",
              hasUpvoted
                ? "bg-[#57068c] text-white ring-2 ring-purple-300 hover:bg-[#460570]"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
            title="Upvote this idea to show interest"
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", hasUpvoted ? "fill-current" : "")} />
            <span>{idea.upvotes}</span>
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#57068c] transition-colors">
            {idea.title}
          </h3>

          {/* Target Time Period */}
          {idea.time_period && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md w-fit">
              <Clock className="h-3.5 w-3.5 text-purple-700" />
              <span>{idea.time_period}</span>
            </div>
          )}
        </div>

        {/* Description Pitch */}
        <p className="text-xs text-slate-600 leading-relaxed">
          {idea.description}
        </p>

        {/* Vendor / Company Info Box */}
        {(idea.vendor_name || idea.vendor_website) && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#57068c]" />
                <span>{idea.vendor_name || 'Proposed Venue / Vendor'}</span>
              </span>
              {idea.vendor_website && (
                <a
                  href={idea.vendor_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#57068c] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Visit website</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {idea.location_name && (
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>{idea.location_name}</span>
              </p>
            )}
          </div>
        )}

        {/* Notes Section */}
        {idea.notes && (
          <div className="rounded-lg border border-amber-200/70 bg-amber-50/40 p-2.5 text-xs text-amber-950/90 flex items-start gap-2">
            <StickyNote className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug">{idea.notes}</p>
          </div>
        )}

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
            {idea.submitted_avatar || idea.submitted_by.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-[11px] leading-tight">
            <span className="font-semibold text-slate-800 block">Pitched by {idea.submitted_by}</span>
          </div>
        </div>

        {/* Upgrade / Promote Button */}
        {isPromoted ? (
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Scheduled Event</span>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => onUpgrade(idea)}
            className="h-8 bg-[#57068c] hover:bg-[#460570] text-white text-xs font-bold gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Upgrade to Event</span>
          </Button>
        )}
      </div>
    </div>
  );
}
