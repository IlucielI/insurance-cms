'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { NotificationItem } from '@/server/repositories/notification.repository.interface';

export interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading?: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading = false,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = filterTab === 'unread'
    ? notifications.filter((item) => !item.isRead)
    : notifications;

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await onMarkAsRead(item.id);
    }
    onClose();
  };

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await onMarkAllAsRead();
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'WARNING':
        return {
          icon: '⚠️',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'SLA Warning',
        };
      case 'CRITICAL':
        return {
          icon: '🚨',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Critical',
        };
      case 'SUCCESS':
        return {
          icon: '✅',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Sukses',
        };
      case 'INFO':
      default:
        return {
          icon: 'ℹ️',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Info',
        };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case 'underwriting':
        return 'Underwriting';
      case 'system':
        return 'Sistem';
      case 'knowledge':
        return 'Knowledge Base';
      case 'policy':
        return 'Polis';
      default:
        return category;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffMin < 1) return 'Baru saja';
      if (diffMin < 60) return `${diffMin}m lalu`;
      if (diffHour < 24) return `${diffHour}j lalu`;
      if (diffDay < 7) return `${diffDay}h lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Panel Notifikasi"
      className="absolute right-0 mt-3 w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-800 tracking-tight">Notifikasi</span>
          {unreadCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {unreadCount} Baru
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
              Semua Terbaca
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={actionLoading}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {actionLoading ? 'Memproses...' : 'Tandai Semua Dibaca'}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-slate-50/60 border-b border-slate-100 flex gap-2">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Semua ({notifications.length})
        </button>
        <button
          onClick={() => setFilterTab('unread')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filterTab === 'unread'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Belum Dibaca ({unreadCount})
        </button>
      </div>

      {/* Content List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/80">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <span className="animate-spin text-xl">⏳</span>
            <span className="text-xs">Memuat notifikasi...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl mb-3">
              🔔
            </div>
            <p className="text-sm font-semibold text-slate-700">Tidak ada notifikasi</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
              {filterTab === 'unread'
                ? 'Seluruh peringatan dan antrean telah Anda periksa.'
                : 'Belum ada rekaman notifikasi operasional pada sistem.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const sev = getSeverityBadge(item.severity);
            const content = (
              <div
                className={`p-3.5 transition-colors cursor-pointer flex gap-3 group relative ${
                  !item.isRead ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Unread indicator dot */}
                {!item.isRead && (
                  <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
                )}

                {/* Left Severity Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-base">{sev.icon}</span>
                </div>

                {/* Main Notification Body */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${sev.bg}`}>
                      {sev.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {getCategoryLabel(item.category)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p className={`text-xs leading-snug line-clamp-1 ${!item.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.message}
                  </p>

                  {item.link && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 mt-1.5 group-hover:underline">
                      <span>Buka detail</span>
                      <span className="text-[9px]">→</span>
                    </span>
                  )}
                </div>
              </div>
            );

            if (item.link) {
              return (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => handleItemClick(item)}
                  className="block no-underline text-inherit"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={item.id} onClick={() => handleItemClick(item)}>
                {content}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Core API Realtime Synced</span>
        </span>
        <button
          onClick={onClose}
          className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
