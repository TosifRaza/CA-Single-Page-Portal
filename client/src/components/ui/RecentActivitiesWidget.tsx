import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, CheckCircle2, UserPlus, DollarSign, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  details?: string;
  createdAt: string | Date;
  color?: string;
  icon?: string;
}

interface RecentActivitiesWidgetProps {
  activities?: ActivityItem[];
}

export const RecentActivitiesWidget: React.FC<RecentActivitiesWidgetProps> = ({
  activities = [
    {
      id: '1',
      action: 'GSTR-1 filed for ABC Traders',
      createdAt: '2 hours ago',
      color: 'green',
      icon: 'check',
    },
    {
      id: '2',
      action: 'New client registered: XYZ Pvt Ltd',
      createdAt: '3 hours ago',
      color: 'blue',
      icon: 'user',
    },
    {
      id: '3',
      action: 'Payment received from Global Solutions',
      createdAt: '5 hours ago',
      color: 'orange',
      icon: 'payment',
    },
  ],
}) => {
  const getIcon = (type?: string, color?: string) => {
    if (color === 'green' || type === 'check') {
      return (
        <div className="p-1.5 rounded-full bg-status-greenLight dark:bg-status-green/20 text-status-green">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    }
    if (color === 'blue' || type === 'user') {
      return (
        <div className="p-1.5 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-blue-400">
          <UserPlus className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="p-1.5 rounded-full bg-status-orangeLight dark:bg-status-orange/20 text-status-orange">
        <DollarSign className="w-4 h-4" />
      </div>
    );
  };

  const formatTime = (t: string | Date) => {
    if (typeof t === 'string' && t.includes('ago')) return t;
    const date = new Date(t);
    const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours <= 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-light-textPrimary dark:text-dark-textPrimary">
          Recent Activities
        </h3>
        <NavLink
          to="/works"
          className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>

      {/* List */}
      <div className="space-y-3 font-medium">
        {activities.map((act) => (
          <div key={act.id} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              {getIcon(act.icon, act.color)}
              <span className="font-semibold text-light-textPrimary dark:text-dark-textPrimary truncate">
                {act.action}
              </span>
            </div>
            <span className="text-[11px] font-medium text-light-textMuted dark:text-dark-textMuted flex-shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(act.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
