import React from 'react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';

export type PillarStatus = 'PASSED' | 'FLAGGED' | 'FAILED' | 'WAIVED';

export interface FindingItem {
  id?: string;
  label: string;
  value: string;
  status?: 'normal' | 'warning' | 'danger';
}

export interface PillarReviewCardProps {
  pillarNumber: number;
  pillarName: string;
  engineName: string;
  status: PillarStatus;
  isManualOverride?: boolean;
  findings: FindingItem[];
  note?: string;
  onOverrideClick?: () => void;
  className?: string;
}

export const PillarReviewCard: React.FC<PillarReviewCardProps> = ({
  pillarNumber,
  pillarName,
  engineName,
  status,
  isManualOverride = false,
  findings,
  note,
  onOverrideClick,
  className = '',
}) => {
  const statusConfigMap: Record<
    PillarStatus,
    {
      badgeText: string;
      badgeClass: string;
      borderClass: string;
      icon: string;
    }
  > = {
    PASSED: {
      badgeText: 'PASSED',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      borderClass: 'border-l-4 border-l-emerald-500',
      icon: '🟢',
    },
    FLAGGED: {
      badgeText: 'FLAGGED / BUTUH BERKAS',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      borderClass: 'border-l-4 border-l-amber-500',
      icon: '🟡',
    },
    FAILED: {
      badgeText: 'FAILED / GAGAL',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      borderClass: 'border-l-4 border-l-rose-500',
      icon: '🔴',
    },
    WAIVED: {
      badgeText: 'WAIVED / DIKECUALIKAN',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      borderClass: 'border-l-4 border-l-slate-400',
      icon: '⚪',
    },
  };

  const statusConfig = statusConfigMap[status];

  return (
    <Card className={`p-5 transition-all hover:shadow-md ${statusConfig.borderClass} ${className}`}>
      {/* Top Header: Pillar Title & Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pilar {pillarNumber}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium font-mono">
              {engineName}
            </span>
            {isManualOverride && (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Manual Override
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            {pillarName}
          </h4>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}
          >
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.badgeText}</span>
          </span>

          {onOverrideClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOverrideClick}
              className="text-xs h-7 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300 shadow-none font-semibold"
            >
              Ubah Status ⚙️
            </Button>
          )}
        </div>
      </div>

      {/* Findings Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-3">
        {findings.map((item) => {
          const valColor =
            item.status === 'warning'
              ? 'text-amber-700 bg-amber-50/60 border-amber-200'
              : item.status === 'danger'
              ? 'text-rose-700 bg-rose-50/60 border-rose-200'
              : 'text-slate-800 bg-slate-50/80 border-slate-100';

          return (
            <div key={item.id ?? item.label} className={`p-2.5 rounded-lg border text-xs ${valColor}`}>
              <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                {item.label}
              </span>
              <span className="font-semibold text-xs mt-0.5 block truncate">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Optional Note / Underwriter Remarks */}
      {note && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-2 bg-slate-50/50 p-2.5 rounded-lg">
          <span className="text-slate-400 shrink-0">📝</span>
          <p className="leading-relaxed italic">{note}</p>
        </div>
      )}
    </Card>
  );
};
