import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface DeadlineItem {
  id: string;
  taxWork: string;
  category?: string;
  client: string;
  dueDate: string | Date;
  status: 'Upcoming' | 'Due Today' | 'Overdue' | 'Completed';
}

interface UpcomingDeadlinesWidgetProps {
  deadlines?: DeadlineItem[];
}

export const UpcomingDeadlinesWidget: React.FC<UpcomingDeadlinesWidgetProps> = ({
  deadlines = [],
}) => {
  const formatDate = (d: string | Date) => {
    if (typeof d === 'string' && (d.includes('Nov') || d.includes('Dec'))) {
      return d;
    }
    const dateObj = new Date(d);
    return isNaN(dateObj.getTime())
      ? String(d)
      : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-light-textPrimary dark:text-dark-textPrimary">
          Upcoming Deadlines
        </h3>
        <NavLink
          to="/works"
          className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>

      {/* Table or Empty State */}
      {deadlines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-light-textMuted dark:text-dark-textMuted">
          <p>No upcoming deadlines scheduled.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border/70 dark:border-dark-border/70 text-[11px] font-semibold text-light-textMuted dark:text-dark-textMuted">
                <th className="pb-2.5 font-medium">Tax / Work</th>
                <th className="pb-2.5 font-medium">Client</th>
                <th className="pb-2.5 font-medium">Due Date</th>
                <th className="pb-2.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/40 dark:divide-dark-border/40 font-medium">
              {deadlines.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-light-bg/60 dark:hover:bg-dark-cardSecondary/60 transition-colors"
                >
                  <td className="py-2.5 pr-2 font-semibold text-light-textPrimary dark:text-dark-textPrimary whitespace-nowrap">
                    {item.taxWork}
                  </td>
                  <td className="py-2.5 pr-2 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                    {item.client}
                  </td>
                  <td className="py-2.5 pr-2 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                    {formatDate(item.dueDate)}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.status === 'Completed'
                          ? 'bg-status-greenLight dark:bg-status-green/20 text-status-green'
                          : item.status === 'Overdue'
                          ? 'bg-status-redLight dark:bg-status-red/20 text-status-red'
                          : 'bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-blue-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
