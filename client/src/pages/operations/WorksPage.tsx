import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { WorkAssignmentItem } from '../../types';

export const WorksPage: React.FC = () => {
  const [works, setWorks] = useState<WorkAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);
  const [totalCount, setTotalCount] = useState(703);

  const statusTabs = ['All', 'Pending', 'In Progress', 'Under Review', 'Completed', 'Filed', 'Overdue'];

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusTab !== 'All') params.append('status', statusTab);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await api.get(`/work-assignments?${params.toString()}`);
      if (res.data?.data) {
        setWorks(res.data.data.works);
        setTotalPages(res.data.data.pagination.pages);
        setTotalCount(res.data.data.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, [statusTab, search, page]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/work-assignments/${id}/status`, { status: newStatus });
      toast.success(`Work status marked as ${newStatus}`);
      fetchWorks();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Works & Filings Management
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Monitor client casework, statutory due dates, assigned staff, and portal filing progress
          </p>
        </div>

        <NavLink
          to="/masters/work-assignment"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Assign New Work</span>
        </NavLink>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
        {/* Status Tabs */}
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-light-border dark:border-dark-border overflow-x-auto text-xs font-semibold">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusTab(tab);
                setPage(1);
              }}
              className={`pb-3 border-b-2 transition-all whitespace-nowrap ${
                statusTab === tab
                  ? 'border-brand-500 text-brand-500 font-bold'
                  : 'border-transparent text-light-textSecondary dark:text-dark-textSecondary hover:text-light-textPrimary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-light-border dark:border-dark-border bg-light-bg/30 dark:bg-dark-cardSecondary/30">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-light-textMuted dark:text-dark-textMuted" />
            <input
              type="text"
              placeholder="Search work code, remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
            />
          </div>

        </div>

        {/* Works Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4">Work Code</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {works.map((w: any) => (
                <tr key={w._id} className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50">
                  <td className="py-3 px-4 font-mono font-bold text-brand-500">
                    {w.workCode}
                  </td>
                  <td className="py-3 px-4 font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                    {w.clientId?.businessName || w.clientId?.name || 'Client'}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {w.employeeId?.name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                    {new Date(w.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[13px] font-semibold ${
                        w.status === 'Completed' || w.status === 'Filed'
                          ? 'bg-status-greenLight text-status-green'
                          : w.status === 'In Progress'
                          ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-blue-400'
                          : w.status === 'Overdue'
                          ? 'bg-status-redLight text-status-red'
                          : 'bg-status-orangeLight text-status-orange'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={w.status}
                      onChange={(e) => handleUpdateStatus(w._id, e.target.value)}
                      className="px-2 py-1 text-[13px] font-semibold rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Completed">Completed</option>
                      <option value="Filed">Filed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-light-border dark:border-dark-border text-xs text-light-textSecondary dark:text-dark-textSecondary font-medium">
          <div>
            Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, totalCount)} of {totalCount} works
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-bg disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 text-xs">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-bg disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
