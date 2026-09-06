import { CMSLayout } from '@/components/templates/CMSLayout';

export default function HomePage() {
  return (
    <CMSLayout pageTitle="Dashboard & Kinerja Portofolio" currentPath="/">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Executive Underwriting Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring performa underwriting, SLA persetujuan polis, dan status integrasi Core API secara real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Health Check API
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xl font-bold text-slate-900">GET /api/health</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Endpoint health mengembalikan format identik dengan insurance-core-api (version, uptime, git_hash).
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Architecture Layer
            </span>
            <div className="mt-2 text-xl font-bold text-slate-900">Clean Architecture</div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Controller ➔ Service ➔ Repository Pattern terstruktur di <code className="text-blue-600">src/server/</code>.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Design System
            </span>
            <div className="mt-2 text-xl font-bold text-slate-900">Atomic UI</div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Atoms, Molecules, Organisms, dan Templates terstruktur rapi di <code className="text-blue-600">src/components/</code>.
            </p>
          </div>
        </div>
      </div>
    </CMSLayout>
  );
}
