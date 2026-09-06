import React from 'react';
import { Badge } from '@/components/atoms/Badge';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'REQUIRE_DOCUMENTS'
  | 'APPROVED'
  | 'REJECTED';

export interface ApplicationListItemProps {
  id: string;
  applicantName: string;
  nik?: string;
  productName: string;
  premium: string;
  sumAssured?: string;
  status: ApplicationStatus;
  submittedAt: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ApplicationListItem: React.FC<ApplicationListItemProps> = ({
  id,
  applicantName,
  nik,
  productName,
  premium,
  sumAssured,
  status,
  submittedAt,
  isSelected = false,
  onClick,
  className = '',
}) => {
  const statusBadgeMap: Record<
    ApplicationStatus,
    { label: string; variant: 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo' }
  > = {
    SUBMITTED: { label: 'Baru Masuk', variant: 'indigo' },
    IN_REVIEW: { label: 'Sedang Ditinjau', variant: 'amber' },
    REQUIRE_DOCUMENTS: { label: 'Butuh Berkas', variant: 'amber' },
    APPROVED: { label: 'Disetujui', variant: 'emerald' },
    REJECTED: { label: 'Ditolak', variant: 'rose' },
  };

  const statusConfig = statusBadgeMap[status] || { label: status, variant: 'slate' };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative ${
        isSelected
          ? 'bg-blue-50/50 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
      } ${className}`}
    >
      {/* Top row: ID & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
            #{id}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {submittedAt}
          </span>
        </div>
        <Badge variant={statusConfig.variant} size="sm">
          {statusConfig.label}
        </Badge>
      </div>

      {/* Middle row: Applicant Name & Product */}
      <div className="mt-2.5">
        <h4 className="text-sm font-bold text-slate-900 truncate">
          {applicantName}
        </h4>
        {nik && <p className="text-[11px] text-slate-400 font-mono mt-0.5">NIK: {nik}</p>}
        <p className="text-xs text-slate-600 font-medium mt-1 truncate">
          {productName}
        </p>
      </div>

      {/* Bottom row: Premium & Sum Assured */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Premi</span>
          <p className="font-bold text-slate-900 font-mono">{premium}</p>
        </div>
        {sumAssured && (
          <div className="text-right space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">U. Pertanggungan</span>
            <p className="font-semibold text-slate-700 font-mono">{sumAssured}</p>
          </div>
        )}
      </div>
    </div>
  );
};
