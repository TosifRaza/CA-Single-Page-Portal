import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Printer } from 'lucide-react';
import api from '../../services/api';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any>({
    statusBreakdown: [],
    categoryBreakdown: [],
    employeeProductivity: [],
    paymentsSummary: [],
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports/overview');
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (e) {
        // Fallback demo data
        setData({
          statusBreakdown: [
            { status: 'Completed', count: 602 },
            { status: 'Pending', count: 86 },
            { status: 'Overdue', count: 15 },
          ],
          categoryBreakdown: [
            { category: 'GST', count: 320 },
            { category: 'Income Tax', count: 240 },
            { category: 'TDS', count: 95 },
            { category: 'ROC', count: 48 },
          ],
          employeeProductivity: [
            { employee: 'Tosif Raza', totalAssigned: 190, completed: 180, pending: 10, completionRate: 95 },
            { employee: 'Anita Desai', totalAssigned: 175, completed: 160, pending: 15, completionRate: 91 },
            { employee: 'Vikram Roy', totalAssigned: 140, completed: 125, pending: 15, completionRate: 89 },
            { employee: 'Priya Nair', totalAssigned: 110, completed: 95, pending: 15, completionRate: 86 },
            { employee: 'Arjun Maitra', totalAssigned: 88, completed: 78, pending: 10, completionRate: 89 },
          ],
        });
      }
    };

    fetchReports();
  }, []);

  const COLORS = ['#1675FF', '#0BC58C', '#8B5CF6', '#FF9F2E', '#FF525E'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Practice Analytics & Compliance Reports
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Aggregated performance metrics, staff productivity, and regulatory compliance rate
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs font-semibold text-light-textPrimary dark:text-dark-textPrimary shadow-sm hover:bg-light-bg transition-colors"
          >
            <Printer className="w-4 h-4 text-brand-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Row 1: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-7 p-6 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark">
          <h3 className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary mb-4">
            Filings by Service Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#182238',
                    borderColor: '#293750',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#1675FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie */}
        <div className="lg:col-span-5 p-6 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark">
          <h3 className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary mb-4">
            Work Status Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, count }) => `${status}: ${count}`}
                  labelLine={false}
                >
                  {data.statusBreakdown.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Staff Productivity Leaderboard */}
      <div className="p-6 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark">
        <h3 className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary mb-4">
          Employee Productivity & Completion Rates
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Total Assigned</th>
                <th className="py-3 px-4">Completed Filings</th>
                <th className="py-3 px-4">Active / Pending</th>
                <th className="py-3 px-4">SLA Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {data.employeeProductivity.map((emp: any) => (
                <tr key={emp.employee} className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50">
                  <td className="py-3 px-4 font-bold text-light-textPrimary dark:text-dark-textPrimary">
                    {emp.employee}
                  </td>
                  <td className="py-3 px-4 font-semibold">{emp.totalAssigned}</td>
                  <td className="py-3 px-4 font-bold text-status-green">{emp.completed}</td>
                  <td className="py-3 px-4 font-semibold text-status-orange">{emp.pending}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${emp.completionRate}%` }}
                        />
                      </div>
                      <span className="font-bold">{emp.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
