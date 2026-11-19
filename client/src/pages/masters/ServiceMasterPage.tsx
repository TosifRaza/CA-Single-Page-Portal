import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export const ServiceMasterPage: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    serviceName: '',
    category: 'GST',
    description: '',
    defaultPrice: 4999,
    estimatedDuration: '3 Days',
  });

  const loadServices = async () => {
    try {
      const res = await api.get('/services');
      if (res.data?.data) setServices(res.data.data);
    } catch (e) {
      setServices([
        { _id: '1', serviceName: 'Monthly GST Compliance', category: 'GST', defaultPrice: 4999, estimatedDuration: '2 Days', status: 'active' },
        { _id: '2', serviceName: 'Income Tax Return (Corporate)', category: 'Income Tax', defaultPrice: 15000, estimatedDuration: '5 Days', status: 'active' },
        { _id: '3', serviceName: 'TDS Quarterly Filing', category: 'TDS', defaultPrice: 3500, estimatedDuration: '3 Days', status: 'active' },
        { _id: '4', serviceName: 'Company Incorporation', category: 'ROC', defaultPrice: 12000, estimatedDuration: '7 Days', status: 'active' },
      ]);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/services', formData);
      toast.success('Service catalog updated');
      setIsModalOpen(false);
      loadServices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving service');
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
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Service Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Service Master
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Define compliance, tax and advisory services with SLA timelines and standard billing rates
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {services.map((s) => (
          <div
            key={s._id}
            className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-blue-400">
                  {s.category}
                </span>
                <span className="text-xs font-semibold text-status-green flex items-center">
                  ₹{s.defaultPrice?.toLocaleString()}
                </span>
              </div>

              <h3 className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary mt-1 mb-2">
                {s.serviceName}
              </h3>

              <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-light-textMuted" />
                <span>Duration: {s.estimatedDuration}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-light-border/60 dark:border-dark-border/60 flex items-center justify-between text-[13px]">
              <span className="text-light-textMuted font-medium">Status</span>
              <span className="font-semibold text-status-green">Active</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary">
                Add New Service
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-light-textMuted" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST Audit"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                >
                  <option value="GST">GST</option>
                  <option value="Income Tax">Income Tax</option>
                  <option value="TDS">TDS</option>
                  <option value="ROC">ROC</option>
                  <option value="Audit">Audit</option>
                  <option value="Advisory">Advisory</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Standard Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.defaultPrice}
                    onChange={(e) => setFormData({ ...formData, defaultPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Timeline</label>
                  <input
                    type="text"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
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
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
