import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { ComplianceDonut } from '../../components/ui/ComplianceDonut';
import { UpcomingDeadlinesWidget } from '../../components/ui/UpcomingDeadlinesWidget';
import { PromotionalCard } from '../../components/ui/PromotionalCard';
import { QuickActions } from '../../components/ui/QuickActions';
import { RecentActivitiesWidget } from '../../components/ui/RecentActivitiesWidget';
import api from '../../services/api';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [dateRange, setDateRange] = useState('Last 6 Months');
  const [rangeDropdownOpen, setRangeDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<any>({
    kpi: {
      totalClients: { value: 0, changePercent: 0, trend: 'stable' },
      pendingWorks: { value: 0, changePercent: 0, trend: 'stable' },
      completedFilings: { value: 0, changePercent: 0, trend: 'stable' },
      upcomingDeadlines: { value: 0, changePercent: 0, trend: 'stable' },
    },
    compliance: {
      rate: 0,
      label: 'No Data',
      completedPercent: 0,
      pendingPercent: 0,
      overduePercent: 0,
    },
    upcomingDeadlines: [],
    recentActivities: [],
    taxCompliance: {
      pendingFilings: 0,
      completedFilings: 0,
      upcomingDeadlines: 0,
      overdueFilings: 0,
      extendedDeadlines: 0,
      pendingReconciliations: 0,
      reconciliationMismatches: 0,
    },
  });

  const rangeOptions = [
    'Last 7 Days',
    'Last 30 Days',
    'Last 3 Months',
    'Last 6 Months',
    'This Financial Year',
    'Custom Range',
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/stats?range=${encodeURIComponent(dateRange)}`);
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.log('Using seeded fallback dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Dashboard Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium mt-0.5">
            Welcome back, {user?.name || 'Tosif Raza'}! Here's your practice overview.
          </p>
        </div>

        {/* Date Range Selector Pill */}
        <div className="relative self-start sm:self-auto">
          <button
            onClick={() => setRangeDropdownOpen(!rangeDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs font-semibold text-light-textPrimary dark:text-dark-textPrimary shadow-sm hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-brand-500" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-light-textMuted dark:text-dark-textMuted" />
          </button>

          {rangeDropdownOpen && (
            <div className="absolute right-0 top-11 w-48 p-1.5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-xl z-40 animate-in fade-in slide-in-from-top-1">
              {rangeOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateRange(opt);
                    setRangeDropdownOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    dateRange === opt
                      ? 'bg-brand-500 text-white font-semibold'
                      : 'text-light-textPrimary dark:text-dark-textPrimary hover:bg-light-bg dark:hover:bg-dark-cardSecondary'
                  }`}
                >
                  <span>{opt}</span>
                  {dateRange === opt && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Clients"
          value={stats.kpi?.totalClients?.value ?? 0}
          changePercent={stats.kpi?.totalClients?.changePercent ?? 0}
          trend={stats.kpi?.totalClients?.trend ?? 'stable'}
          color="blue"
          sparklineData={stats.kpi?.totalClients?.sparkline}
        />

        <StatCard
          title="Pending Works"
          value={stats.kpi?.pendingWorks?.value ?? 0}
          changePercent={stats.kpi?.pendingWorks?.changePercent ?? 0}
          trend={stats.kpi?.pendingWorks?.trend ?? 'stable'}
          color="green"
          sparklineData={stats.kpi?.pendingWorks?.sparkline}
        />

        <StatCard
          title="Completed Filings"
          value={stats.kpi?.completedFilings?.value ?? 0}
          changePercent={stats.kpi?.completedFilings?.changePercent ?? 0}
          trend={stats.kpi?.completedFilings?.trend ?? 'stable'}
          color="purple"
          sparklineData={stats.kpi?.completedFilings?.sparkline}
        />

        <StatCard
          title="Upcoming Deadlines"
          value={stats.kpi?.upcomingDeadlines?.value ?? 0}
          changePercent={stats.kpi?.upcomingDeadlines?.changePercent ?? 0}
          trend={stats.kpi?.upcomingDeadlines?.trend ?? 'stable'}
          color="orange"
          sparklineData={stats.kpi?.upcomingDeadlines?.sparkline}
        />
      </div>

      {/* Tax & Filing Compliance Health Metric Strip */}
      <div className="p-4 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-light-border/70 dark:border-dark-border/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-light-textPrimary dark:text-dark-textPrimary">
              Tax & Reconciliation Compliance Health
            </h3>
          </div>
          <NavLink
            to="/masters/tax"
            className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Manage Tax Rules & Filings</span>
            <span>&rarr;</span>
          </NavLink>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3">
          <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border">
            <span className="text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary block">
              Pending Filings
            </span>
            <span className="text-base font-extrabold text-light-textPrimary dark:text-dark-textPrimary">
              {stats.taxCompliance?.pendingFilings ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border">
            <span className="text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary block">
              Completed Filings
            </span>
            <span className="text-base font-extrabold text-status-green">
              {stats.taxCompliance?.completedFilings ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border">
            <span className="text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary block">
              Upcoming Deadlines
            </span>
            <span className="text-base font-extrabold text-brand-500">
              {stats.taxCompliance?.upcomingDeadlines ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border">
            <span className="text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary block">
              Overdue Filings
            </span>
            <span className="text-base font-extrabold text-status-red">
              {stats.taxCompliance?.overdueFilings ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border">
            <span className="text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary block">
              Extended Deadlines
            </span>
            <span className="text-base font-extrabold text-status-orange">
              {stats.taxCompliance?.extendedDeadlines ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border">
            <span className="text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary block">
              Pending Recons
            </span>
            <span className="text-base font-extrabold text-status-purple">
              {stats.taxCompliance?.pendingReconciliations ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border">
            <span className="text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary block">
              Recon Mismatches
            </span>
            <span className="text-base font-extrabold text-status-red">
              {stats.taxCompliance?.reconciliationMismatches ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Compliance Overview, Upcoming Deadlines, Promotional Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 min-h-[220px]">
          <ComplianceDonut
            completedPercent={stats.compliance?.completedPercent ?? 92}
            pendingPercent={stats.compliance?.pendingPercent ?? 6}
            overduePercent={stats.compliance?.overduePercent ?? 2}
            label={stats.compliance?.label ?? 'On Track'}
          />
        </div>

        <div className="lg:col-span-5 min-h-[220px]">
          <UpcomingDeadlinesWidget deadlines={stats.upcomingDeadlines} />
        </div>

        <div className="lg:col-span-3 min-h-[220px]">
          <PromotionalCard />
        </div>
      </div>

      {/* Row 3: Quick Actions, Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <QuickActions />
        </div>

        <div className="lg:col-span-5">
          <RecentActivitiesWidget activities={stats.recentActivities} />
        </div>
      </div>
    </div>
  );
};
