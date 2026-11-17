import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';

interface ComplianceDonutProps {
  completedPercent?: number;
  pendingPercent?: number;
  overduePercent?: number;
  label?: string;
  onClose?: () => void;
}

export const ComplianceDonut: React.FC<ComplianceDonutProps> = ({
  completedPercent = 92,
  pendingPercent = 6,
  overduePercent = 2,
  label = 'On Track',
  onClose,
}) => {
  const data = [
    { name: 'Completed', value: completedPercent, color: '#0BC58C' },
    { name: 'Pending', value: pendingPercent, color: '#FF9F2E' },
    { name: 'Overdue', value: overduePercent, color: '#FF525E' },
  ];

  return (
    <div className="relative p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm text-light-textPrimary dark:text-dark-textPrimary">
          Compliance Overview
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-light-textMuted dark:text-dark-textMuted hover:bg-light-bg dark:hover:bg-dark-cardSecondary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Donut Chart + Central Text */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="relative w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-light-textPrimary dark:text-dark-textPrimary tracking-tight">
              {completedPercent}%
            </span>
            <span className="text-[13px] font-semibold text-status-green">
              {label}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col space-y-2.5 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-green flex-shrink-0" />
            <span className="text-light-textSecondary dark:text-dark-textSecondary">
              Completed
            </span>
            <span className="ml-auto font-bold text-light-textPrimary dark:text-dark-textPrimary">
              {completedPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-orange flex-shrink-0" />
            <span className="text-light-textSecondary dark:text-dark-textSecondary">
              Pending
            </span>
            <span className="ml-auto font-bold text-light-textPrimary dark:text-dark-textPrimary">
              {pendingPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-red flex-shrink-0" />
            <span className="text-light-textSecondary dark:text-dark-textSecondary">
              Overdue
            </span>
            <span className="ml-auto font-bold text-light-textPrimary dark:text-dark-textPrimary">
              {overduePercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
