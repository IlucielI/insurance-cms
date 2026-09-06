export interface DashboardKpiItem {
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  subtitle: string;
  note?: string;
  icon: string;
  color: string;
}

export interface DashboardKpis {
  totalApplications: DashboardKpiItem;
  inReview: DashboardKpiItem;
  approvalRate: DashboardKpiItem;
  activePolicies: DashboardKpiItem;
}

export interface RecentQueueItem {
  id: string;
  applicantName: string;
  nik: string;
  productName: string;
  sumAssured: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'rfi_requested';
  statusLabel: string;
  slaMinutesLeft: number;
  slaText: string;
}

export interface StatusDistributionItem {
  label: string;
  countText: string;
  percentage: number;
  color: string;
}

export interface SlaDistribution {
  averageSlaMinutes: number;
  averageSlaText: string;
  targetMinutes: number;
  complianceRateText: string;
  statuses: StatusDistributionItem[];
}

export interface TopProductContributor {
  rank: number;
  rankBadge: string;
  rankBadgeBg: string;
  rankBadgeColor: string;
  category: string;
  categoryColor: string;
  name: string;
  volumeFormatted: string;
  activePoliciesCount: number;
  lossRatioText: string;
  lossRatioStatus: string;
  lossRatioColor: string;
  slug: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  recentQueue: RecentQueueItem[];
  slaDistribution: SlaDistribution;
  topProducts: TopProductContributor[];
}

export interface IDashboardRepository {
  getDashboardData(): Promise<DashboardData>;
}
