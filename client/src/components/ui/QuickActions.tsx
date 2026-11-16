import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Briefcase, Layers, BarChart3 } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Add New Client',
      icon: UserPlus,
      color: 'text-brand-500 bg-brand-500/10 dark:bg-brand-500/15',
      route: '/masters/clients',
    },
    {
      title: 'Create Work',
      icon: Briefcase,
      color: 'text-status-green bg-status-green/10 dark:bg-status-green/15',
      route: '/masters/work-assignment',
    },
    {
      title: 'Manage Masters',
      icon: Layers,
      color: 'text-status-purple bg-status-purple/10 dark:bg-status-purple/15',
      route: '/masters/tax',
    },
    {
      title: 'View Reports',
      icon: BarChart3,
      color: 'text-status-orange bg-status-orange/10 dark:bg-status-orange/15',
      route: '/reports',
    },
  ];

  return (
    <div className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark h-full flex flex-col justify-between">
      <h3 className="font-bold text-sm text-light-textPrimary dark:text-dark-textPrimary mb-3">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              onClick={() => navigate(act.route)}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-light-bg/70 dark:bg-dark-cardSecondary/70 hover:bg-light-border/50 dark:hover:bg-dark-border/40 border border-light-border/60 dark:border-dark-border/60 text-center transition-all duration-150 hover:shadow-sm active:scale-95 group"
            >
              <div
                className={`p-2.5 rounded-xl ${act.color} mb-2 group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                {act.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
