import React from 'react';
import { Breadcrumb } from '@/components/molecules/Breadcrumb';
import { SearchInput } from '@/components/molecules/SearchInput';
import { StatusPill } from '@/components/molecules/StatusPill';
import { UserChip } from '@/components/molecules/UserChip';
import { Button } from '@/components/atoms/Button';

export interface TopbarProps {
  breadcrumbTitle?: string;
  onSync?: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbTitle = 'Dashboard & Kinerja Portofolio',
  onSync,
  className = '',
}) => {
  return (
    <header
      className={`h-[70px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 ${className}`}
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center">
        <Breadcrumb current={breadcrumbTitle} />
      </div>

      {/* Right: Controls (Search, Status, Sync, Notif, User) */}
      <div className="flex items-center gap-3.5">
        {/* Omnisearch */}
        <div className="w-[260px]">
          <SearchInput placeholder="Cari metrik, polis, atau underwriting..." />
        </div>

        {/* Global Live Status Pill */}
        <StatusPill label="Core API v1.2 Online" status="online" />

        {/* Unified Refresh Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onSync}
          className="border-slate-300 text-slate-800 font-semibold"
        >
          <span>🔄</span>
          <span>Refresh Data</span>
        </Button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            aria-label="Notifikasi"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            🔔
          </button>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
            3
          </span>
        </div>

        {/* User Profile Chip */}
        <div className="pl-1 border-l border-slate-200">
          <UserChip name="Bayu Pratama" role="Lead Underwriter" initials="BP" />
        </div>
      </div>
    </header>
  );
};
