'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import type { NotificationItem } from '@/server/repositories/notification.repository.interface';
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from './actions';

export interface NotificationsWorkbenchProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export const NotificationsWorkbench: React.FC<NotificationsWorkbenchProps> = ({
  initialNotifications,
  initialUnreadCount,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    startTransition(async () => {
      try {
        await markNotificationAsReadAction(id);
      } catch (err) {
        console.error('Failed to mark notification as read', err);
      }
    });
  };

  const handleMarkAllAsRead = () => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now }))
    );
    setUnreadCount(0);

    startTransition(async () => {
      try {
        await markAllNotificationsAsReadAction();
      } catch (err) {
        console.error('Failed to mark all as read', err);
      }
    });
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread' && item.isRead) return false;
    if (activeFilter === 'warning' && !['WARNING', 'CRITICAL'].includes(item.severity.toUpperCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        (item.type && item.type.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'WARNING':
        return {
          icon: '⚠️',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'SLA Warning',
        };
      case 'CRITICAL':
        return {
          icon: '🚨',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Critical',
        };
      case 'SUCCESS':
        return {
          icon: '✅',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Sukses',
        };
      case 'INFO':
      default:
        return {
          icon: 'ℹ️',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Info',
        };
    }
  };

  const warningCount = notifications.filter((n) =>
    ['WARNING', 'CRITICAL'].includes(n.severity.toUpperCase())
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pusat Notifikasi &amp; Peringatan SLA
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau pengajuan baru, alert eskalasi SLA dokumen, dan aktivitas sistem underwriting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
            >
              ✓ Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Notifikasi</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{notifications.length}</div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
            🔔
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Dibaca</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{unreadCount}</div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
            📬
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Peringatan SLA</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{warningCount}</div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
            ⚠️
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'unread'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Dibaca ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('warning')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'warning'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            SLA Warning ({warningCount})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, pesan, atau ID..."
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada notifikasi</h3>
            <p className="text-xs text-slate-500 mt-1">
              Semua aktivitas terkini dan peringatan SLA telah ditinjau dengan baik.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const badge = getSeverityBadge(item.severity);
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.isRead
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-blue-50/40 border-blue-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="text-2xl shrink-0 mt-0.5">{badge.icon}</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{item.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                        >
                          {badge.label}
                        </span>
                        {!item.isRead && (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {item.message}
                      </p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                        <span suppressHydrationWarning>
                          {new Date(item.createdAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {item.type && (
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 uppercase">
                            {item.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => {
                          if (!item.isRead) handleMarkAsRead(item.id);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Buka Detail
                      </Link>
                    )}
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Tandai telah dibaca"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
