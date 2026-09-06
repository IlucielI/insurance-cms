import React from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Topbar } from '@/components/organisms/Topbar';

export interface CMSLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  currentPath?: string;
  onSync?: () => void;
}

export const CMSLayout: React.FC<CMSLayoutProps> = ({
  children,
  pageTitle = 'Dashboard & Kinerja Portofolio',
  currentPath = '/',
  onSync,
}) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar (260px fixed width) */}
      <Sidebar currentPath={currentPath} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar breadcrumbTitle={pageTitle} onSync={onSync} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};
