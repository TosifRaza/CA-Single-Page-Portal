import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export const FinancialYearPage: React.FC = () => {
  const [years, setYears] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    yearName: '2027-28',
    assessmentYear: '2028-29',
    startDate: '2027-04-01',
    endDate: '2028-03-31',
    isCurrent: false,
  });

  const loadYears = async () => {
    try {
      const res = await api.get('/financial-years');
      if (res.data?.data) setYears(res.data.data);
    } catch (e) {
      setYears([
        { _id: '1', yearName: '2026-27', assessmentYear: '2027-28', startDate: '2026-04-01', endDate: '2027-03-31', isCurrent: true, status: 'active' },
        { _id: '2', yearName: '2025-26', assessmentYear: '2026-27', startDate: '2025-04-01', endDate: '2026-03-31', isCurrent: false, status: 'active' },
      ]);
    }
  };

  useEffect(() => {
    loadYears();
  }, []);

  const handleActivate = async (id: string) => {
    try {
      await api.patch(`/financial-years/${id}/activate`, {});
      toast.success('Active financial year changed');
      loadYears();
    } catch (e) {
      toast.error('Failed to update active year');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/financial-years', formData);
      toast.success('Financial year added');
      setIsModalOpen(false);
      loadYears();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating year');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-brand-500 mb-1 flex items-center gap-1.5">
            <NavLink to="/dashboard" className="hover:underline flex items-center gap-0.5">
              <span>«</span> Master Management
            </NavLink>
            <span className="text-light-textMuted dark:text-dark-textMuted">&gt;</span>
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Financial Year</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Financial Year Master
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Configure firm operational and statutory assessment periods
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Financial Year</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {years.map((y) => (
          <div
            key={y._id}
            className={`p-5 rounded-2xl border transition-all ${
              y.isCurrent
                ? 'bg-brand-50/50 dark:bg-brand-500/10 border-brand-500 shadow-sm'
                : 'bg-white dark:bg-dark-card border-light-border dark:border-dark-border'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-500" />
                <span className="text-base font-bold text-light-textPrimary dark:text-dark-textPrimary">
                  FY {y.yearName}
                </span>
              </div>
              {y.isCurrent ? (
                <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-brand-500 text-white">
                  Active Year
                </span>
              ) : (
                <button
                  onClick={() => handleActivate(y._id)}
                  className="text-xs font-semibold text-brand-500 hover:underline"
                >
                  Set as Active
                </button>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-light-textSecondary dark:text-dark-textSecondary font-medium">
              <div>Assessment Year: <span className="font-bold text-light-textPrimary dark:text-dark-textPrimary">AY {y.assessmentYear}</span></div>
              <div>Start Date: {new Date(y.startDate).toLocaleDateString()}</div>
              <div>End Date: {new Date(y.endDate).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary">
                Add Financial Year
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-light-textMuted" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Financial Year Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027-28"
                  value={formData.yearName}
                  onChange={(e) => setFormData({ ...formData, yearName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Assessment Year *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2028-29"
                  value={formData.assessmentYear}
                  onChange={(e) => setFormData({ ...formData, assessmentYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-light-border dark:border-dark-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white font-bold"
                >
                  Save Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
