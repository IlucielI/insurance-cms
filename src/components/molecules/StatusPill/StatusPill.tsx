import React from 'react';
import { StatusDot } from '@/components/atoms/StatusDot';

export interface StatusPillProps {
  label?: string;
  status?: 'online' | 'busy' | 'offline';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label = 'Core API v1.2 • Live',
  status = 'online',
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold ${className}`}
    >
      <StatusDot status={status} />
      <span>{label}</span>
    </div>
  );
};
