import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { TaxGroupItem } from '../../types';

export const TaxGroupMasterPage: React.FC = () => {
  const [taxGroups, setTaxGroups] = useState<TaxGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TaxGroupItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State with Date Option
  const [formData, setFormData] = useState({
    groupName: '',
    groupCode: '',
    dueDate: '',
    status: 'active' as 'active' | 'inactive',
  });

  const fetchTaxGroups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await api.get(`/tax-groups?${params.toString()}`);
      if (res.data?.data) {
        setTaxGroups(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching tax groups:', err);
      toast.error('Failed to load tax groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxGroups();
  }, [search, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingGroup(null);
    setFormData({
      groupName: '',
      groupCode: '',
      dueDate: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (group: TaxGroupItem) => {
    setEditingGroup(group);
    setFormData({
      groupName: group.groupName,
      groupCode: group.groupCode,
      dueDate: group.dueDate || '',
      status: group.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupName.trim()) {
      toast.error('Tax Group Name is required.');
      return;
    }

    const autoCode =
      formData.groupCode.trim() ||
      formData.groupName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase() ||
      'GRP';

    const payload = {
      groupName: formData.groupName.trim(),
      groupCode: autoCode,
      dueDate: formData.dueDate || undefined,
      defaultFrequency: 'Monthly',
      status: formData.status,
    };

    try {
      setSubmitting(true);
      if (editingGroup) {
        await api.put(`/tax-groups/${editingGroup._id}`, payload);
        toast.success(`Tax Group "${formData.groupName}" updated successfully!`);
      } else {
        await api.post('/tax-groups', payload);
        toast.success(`Tax Group "${formData.groupName}" created successfully!`);
      }
      setIsModalOpen(false);
      fetchTaxGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving tax group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (group: TaxGroupItem) => {
    if (!window.confirm(`Are you sure you want to delete Tax Group "${group.groupName}"?`)) return;

    try {
      const res = await api.delete(`/tax-groups/${group._id}`);
      toast.success(res.data?.message || 'Tax group deleted successfully');
      fetchTaxGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete tax group');
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header with Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-brand-500 mb-1 flex items-center gap-1.5">
            <NavLink to="/dashboard" className="hover:underline flex items-center gap-0.5">
              <span>«</span> Master Management
            </NavLink>
            <span className="text-light-textMuted dark:text-dark-textMuted">&gt;</span>
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Tax Group Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Tax Group Master
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Define and manage statutory tax categories and compliance groups
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NavLink
            to="/masters/tax"
            className="px-3.5 py-2 rounded-xl border border-light-border dark:border-dark-border text-xs font-semibold text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
          >
            « Back to Tax Master
          </NavLink>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tax Group</span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-light-border dark:border-dark-border bg-light-bg/30 dark:bg-dark-cardSecondary/30">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-light-textMuted dark:text-dark-textMuted" />
              <input
                type="text"
                placeholder="Search by Group Name, Code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-light-textSecondary">
              <span className="font-semibold text-light-textMuted hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-light-textMuted dark:text-dark-textMuted font-semibold">
            Showing {taxGroups.length} configured Tax Groups
          </div>
        </div>

        {/* Tax Groups Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4 w-14">#</th>
                <th className="py-3 px-4">Tax Group Name</th>
                <th className="py-3 px-4">Group Code</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-light-textMuted font-medium">
                    Loading tax groups...
                  </td>
                </tr>
              ) : taxGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-light-textMuted font-medium">
                    No tax groups found. Click "+ Add Tax Group" to create one.
                  </td>
                </tr>
              ) : (
                taxGroups.map((g, index) => (
                  <tr
                    key={g._id}
                    className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-light-textMuted font-mono">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-light-textPrimary dark:text-dark-textPrimary">
                      {g.groupName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      <span className="px-2.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-[11px]">
                        {g.groupCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                      {g.dueDate ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                          <Calendar className="w-3.5 h-3.5 text-brand-500" />
                          {formatDate(g.dueDate)}
                        </span>
                      ) : (
                        <span className="text-light-textMuted">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {g.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-status-greenLight dark:bg-status-green/20 text-status-green">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-status-redLight dark:bg-status-red/20 text-status-red">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(g)}
                          title="Edit Tax Group"
                          className="p-1.5 rounded-lg hover:bg-light-bg dark:hover:bg-dark-cardSecondary text-light-textMuted hover:text-brand-500 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(g)}
                          title="Delete Tax Group"
                          className="p-1.5 rounded-lg hover:bg-light-bg dark:hover:bg-dark-cardSecondary text-light-textMuted hover:text-status-red transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Tax Group Modal (Tax Group Name + Date Option + Status) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-light-bg/40 dark:bg-dark-cardSecondary/40">
              <div>
                <h2 className="text-base font-bold text-light-textPrimary dark:text-dark-textPrimary">
                  {editingGroup ? 'Edit Tax Group' : 'Add New Tax Group'}
                </h2>
                <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
                  Enter statutory tax category name and statutory due date
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-light-textMuted hover:text-light-textPrimary hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Field 1: Tax Group Name */}
              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Tax Group Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. GST, Income Tax, TDS, Customs, etc."
                  value={formData.groupName}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoCode = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
                    setFormData({ ...formData, groupName: name, groupCode: autoCode });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-semibold text-xs"
                />
                <span className="text-[10px] text-light-textMuted dark:text-dark-textMuted mt-1 block">
                  Name of statutory tax category
                </span>
              </div>

              {/* Field 2: Date Option (Due Date / Statutory Date) */}
              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary flex items-center justify-between">
                  <span>Due Date / Statutory Date *</span>
                  <span className="text-[10px] text-light-textMuted font-normal">Select date</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-semibold text-xs cursor-pointer"
                />
                <span className="text-[10px] text-light-textMuted dark:text-dark-textMuted mt-1 block">
                  Statutory compliance due date for this tax group
                </span>
              </div>

              {/* Field 3: Status */}
              <div className="flex items-center gap-2 pt-1">
                <label className="font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                  Status:
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                  }
                  className="px-3 py-1.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border font-semibold text-xs text-light-textPrimary dark:text-dark-textPrimary cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-light-border dark:border-dark-border text-light-textSecondary font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingGroup ? 'Update Group' : 'Save Tax Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
