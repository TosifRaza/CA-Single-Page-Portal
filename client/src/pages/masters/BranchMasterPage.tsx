import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Building2, Phone, Mail, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export const BranchMasterPage: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    city: '',
    state: '',
    phone: '',
    email: '',
  });

  const loadBranches = async () => {
    try {
      const res = await api.get('/branches');
      if (res.data?.data) setBranches(res.data.data);
    } catch (e) {
      setBranches([
        { _id: '1', branchName: 'Head Office - Kolkata', branchCode: 'KOL-HQ', city: 'Kolkata', state: 'West Bengal', phone: '+91 33 2289 1000', email: 'kolkata@rizassociates.com', status: 'active' },
        { _id: '2', branchName: 'Mumbai West Branch', branchCode: 'MUM-01', city: 'Mumbai', state: 'Maharashtra', phone: '+91 22 2876 5432', email: 'mumbai@rizassociates.com', status: 'active' },
        { _id: '3', branchName: 'Delhi NCR Branch', branchCode: 'DEL-01', city: 'New Delhi', state: 'Delhi', phone: '+91 11 2345 6789', email: 'delhi@rizassociates.com', status: 'active' },
      ]);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/branches', formData);
      toast.success('Branch created');
      setIsModalOpen(false);
      loadBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating branch');
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
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Branch Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Branch Master
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Manage multi-city office branches and regional practice centers
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {branches.map((b) => (
          <div
            key={b._id}
            className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-blue-400">
                {b.branchCode}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold bg-status-greenLight text-status-green">
                {b.status}
              </span>
            </div>

            <h3 className="text-base font-bold text-light-textPrimary dark:text-dark-textPrimary mb-3">
              {b.branchName}
            </h3>

            <div className="space-y-2 text-xs text-light-textSecondary dark:text-dark-textSecondary font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-light-textMuted" />
                <span>{b.city}, {b.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-light-textMuted" />
                <span>{b.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-light-textMuted" />
                <span>{b.email || '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary">
                Add Branch
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-light-textMuted" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai West Branch"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Branch Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MUM-01"
                  value={formData.branchCode}
                  onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
