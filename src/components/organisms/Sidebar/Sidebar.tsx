import React from 'react';
import Link from 'next/link';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  active?: boolean;
}

export interface SidebarProps {
  currentPath?: string;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath = '/', className = '' }) => {
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: '📊', active: currentPath === '/' },
    { label: 'Underwriting Queue', href: '/queue', icon: '📋', active: currentPath === '/queue' },
    { label: 'Manajemen Produk', href: '/products', icon: '🛡️', active: currentPath === '/products' },
    { label: 'Knowledge Base AI', href: '/knowledge', icon: '🧠', active: currentPath === '/knowledge' },
    { label: 'System Health & Audit', href: '/health', icon: '⚡', active: currentPath === '/health' },
  ];

  return (
    <aside
      className={`w-[260px] bg-[#090d16] text-white flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 z-40 select-none ${className}`}
    >
      {/* Top Brand & Menu */}
      <div className="p-5 flex flex-col gap-6">
        {/* Logo Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-sm tracking-tight text-white shadow-lg shadow-blue-500/20">
            BI
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white tracking-tight">Bayu Insurance</span>
            <span className="text-[11px] text-slate-400 font-medium">Core CMS Admin</span>
          </div>
        </div>

        {/* API Telemetry Badge */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
          <span className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Core API v1.2.0 • Online
          </span>
        </div>

        {/* Navigation Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-2 mb-1">
            Menu Utama
          </span>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                item.active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.active ? 'bg-white text-blue-600' : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom User Profile Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-700">
            BP
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">Bayu Pratama</span>
            <span className="text-[10px] font-medium text-slate-400 truncate">Lead Underwriter</span>
            <span className="text-[9px] font-mono text-slate-500 truncate">NIP: UW-2026-042</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
