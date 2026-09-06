import React from 'react';

export interface TimelineItemProps {
  timestamp: string;
  actorName: string;
  actorRole?: string;
  title: string;
  description?: string;
  status?: 'normal' | 'success' | 'warning' | 'danger';
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  timestamp,
  actorName,
  actorRole,
  title,
  description,
  status = 'normal',
  isLast = false,
}) => {
  const dotColorMap = {
    normal: 'bg-blue-600 ring-blue-100',
    success: 'bg-emerald-600 ring-emerald-100',
    warning: 'bg-amber-500 ring-amber-100',
    danger: 'bg-rose-600 ring-rose-100',
  };

  return (
    <div className="relative flex items-start gap-4 text-xs group">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-2.5 top-5 bottom-0 w-0.5 bg-slate-200 group-last:hidden" />
      )}

      {/* Bullet Dot */}
      <div
        className={`mt-1 h-5 w-5 rounded-full ring-4 shrink-0 flex items-center justify-center ${dotColorMap[status]}`}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-white" />
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">{actorName}</span>
            {actorRole && (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {actorRole}
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400">{timestamp}</span>
        </div>

        <p className="font-semibold text-slate-800 mt-1">{title}</p>
        {description && (
          <p className="text-slate-500 mt-0.5 leading-relaxed italic bg-slate-50 p-2 rounded-md border border-slate-100">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
