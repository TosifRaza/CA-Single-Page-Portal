import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, Briefcase, CheckCircle2, Calendar } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
  color: 'blue' | 'green' | 'purple' | 'orange';
  sparklineData?: Array<{ v: number }>;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  changePercent = 0,
  trend = 'up',
  color,
  sparklineData = [{ v: 10 }, { v: 15 }, { v: 12 }, { v: 18 }, { v: 24 }, { v: 22 }, { v: 28 }],
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-brand-500/10 dark:bg-brand-500/15',
      iconColor: 'text-brand-500',
      stroke: '#1675FF',
      gradientId: 'statBlue',
      icon: Users,
    },
    green: {
      bg: 'bg-status-green/10 dark:bg-status-green/15',
      iconColor: 'text-status-green',
      stroke: '#0BC58C',
      gradientId: 'statGreen',
      icon: Briefcase,
    },
    purple: {
      bg: 'bg-status-purple/10 dark:bg-status-purple/15',
      iconColor: 'text-status-purple',
      stroke: '#8B5CF6',
      gradientId: 'statPurple',
      icon: CheckCircle2,
    },
    orange: {
      bg: 'bg-status-orange/10 dark:bg-status-orange/15',
      iconColor: 'text-status-orange',
      stroke: '#FF9F2E',
      gradientId: 'statOrange',
      icon: Calendar,
    },
  };

  const current = colorMap[color];
  const Icon = current.icon;

  return (
    <div className="relative overflow-hidden p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark transition-all duration-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${current.bg} ${current.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-light-textSecondary dark:text-dark-textSecondary">
              {title}
            </div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
              {value}
            </div>
          </div>
        </div>

        {/* Percentage Badge */}
        {changePercent !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend === 'down'
                ? 'text-status-red bg-status-red/10'
                : 'text-status-green bg-status-green/10'
            }`}
          >
            {trend === 'down' ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5" />
            )}
            <span>
              {changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`}
            </span>
          </div>
        )}
      </div>

      {/* Miniature Area Sparkline */}
      <div className="h-14 mt-2 -mb-2 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData}>
            <defs>
              <linearGradient id={current.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={current.stroke} stopOpacity={0.25} />
                <stop offset="100%" stopColor={current.stroke} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={current.stroke}
              strokeWidth={2}
              fill={`url(#${current.gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
