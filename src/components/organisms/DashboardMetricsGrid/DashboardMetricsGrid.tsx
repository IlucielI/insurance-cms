import React from 'react';
import { StatCard } from '@/components/molecules/StatCard';

export interface DashboardMetricsData {
  totalApplications: {
    value: string | number;
    trend: string;
    trendDirection: 'up' | 'down' | 'neutral';
    subtitle: string;
  };
  averageSla: {
    value: string;
    trend: string;
    trendDirection: 'up' | 'down' | 'neutral';
    subtitle: string;
  };
  approvalRate: {
    value: string;
    trend: string;
    trendDirection: 'up' | 'down' | 'neutral';
    subtitle: string;
  };
  riskRatio: {
    value: string;
    trend: string;
    trendDirection: 'up' | 'down' | 'neutral';
    subtitle: string;
  };
}

export interface DashboardMetricsGridProps {
  metrics?: Partial<DashboardMetricsData>;
  className?: string;
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({
  metrics,
  className = '',
}) => {
  const defaultMetrics: DashboardMetricsData = {
    totalApplications: {
      value: '142',
      trend: '+12.4%',
      trendDirection: 'up',
      subtitle: 'Target harian: 120 polis',
    },
    averageSla: {
      value: '2.4 Jam',
      trend: '-18.5%',
      trendDirection: 'up', // SLA down is positive (faster)
      subtitle: 'Batas SLA OJK: < 24 Jam',
    },
    approvalRate: {
      value: '88.5%',
      trend: '+2.1%',
      trendDirection: 'up',
      subtitle: '92 disetujui / 12 ditolak',
    },
    riskRatio: {
      value: '3.1%',
      trend: '-0.4%',
      trendDirection: 'up',
      subtitle: 'Toleransi aktuaris: < 5.0%',
    },
  };

  const data = { ...defaultMetrics, ...metrics };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
      {/* 1. Total Aplikasi */}
      <StatCard
        title="Total Pengajuan Hari Ini"
        value={data.totalApplications.value}
        subtitle={data.totalApplications.subtitle}
        trend={{
          value: data.totalApplications.trend,
          direction: data.totalApplications.trendDirection,
          label: 'vs kemarin',
        }}
        iconBgColor="bg-blue-50 text-blue-600"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      />

      {/* 2. SLA Keputusan */}
      <StatCard
        title="Rata-rata SLA Keputusan"
        value={data.averageSla.value}
        subtitle={data.averageSla.subtitle}
        trend={{
          value: data.averageSla.trend,
          direction: data.averageSla.trendDirection,
          label: 'lebih cepat',
        }}
        iconBgColor="bg-emerald-50 text-emerald-600"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* 3. Tingkat Persetujuan */}
      <StatCard
        title="Rasio Persetujuan Polis"
        value={data.approvalRate.value}
        subtitle={data.approvalRate.subtitle}
        trend={{
          value: data.approvalRate.trend,
          direction: data.approvalRate.trendDirection,
          label: 'vs bulan lalu',
        }}
        iconBgColor="bg-indigo-50 text-indigo-600"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* 4. Rasio Risiko */}
      <StatCard
        title="Tingkat Risiko Portofolio"
        value={data.riskRatio.value}
        subtitle={data.riskRatio.subtitle}
        trend={{
          value: data.riskRatio.trend,
          direction: data.riskRatio.trendDirection,
          label: 'risiko terjaga',
        }}
        iconBgColor="bg-purple-50 text-purple-600"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />
    </div>
  );
};
