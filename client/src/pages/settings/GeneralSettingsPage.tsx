import React, { useState, useEffect } from 'react';
import { Building2, Save, Globe } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const GeneralSettingsPage: React.FC = () => {
  const { refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: 'RIZ & Associates',
    email: 'contact@rizassociates.com',
    phone: '+91 98765 43210',
    address: {
      line1: 'Suite 401, Commerce Tower',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700016',
    },
    settings: {
      defaultFinancialYear: '2026-27',
      timeZone: 'Asia/Kolkata',
      reminderDaysBefore: 3,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/general');
        if (res.data?.data) {
          setFormData({
            name: res.data.data.name || 'RIZ & Associates',
            email: res.data.data.email || '',
            phone: res.data.data.phone || '',
            address: {
              line1: res.data.data.address?.line1 || '',
              city: res.data.data.address?.city || '',
              state: res.data.data.address?.state || '',
              pincode: res.data.data.address?.pincode || '',
            },
            settings: {
              defaultFinancialYear: res.data.data.settings?.defaultFinancialYear || '2026-27',
              timeZone: res.data.data.settings?.timeZone || 'Asia/Kolkata',
              reminderDaysBefore: res.data.data.settings?.reminderDaysBefore || 3,
            },
          });
        }
      } catch (e) {}
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings/general', formData);
      toast.success('Practice settings updated successfully');
      refreshUser();
    } catch (err: any) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
          General Practice Settings
        </h1>
        <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
          Configure firm organization branding, default financial years and notification rules
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Practice Identity */}
        <div className="p-6 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-light-border dark:border-dark-border">
            <Building2 className="w-5 h-5 text-brand-500" />
            <h2 className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary">
              Organization Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <label className="block font-semibold mb-1">Firm Legal Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Official Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Address</label>
              <input
                type="text"
                value={formData.address.line1}
                onChange={(e) =>
                  setFormData({ ...formData, address: { ...formData.address, line1: e.target.value } })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Practice Preferences */}
        <div className="p-6 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-light-border dark:border-dark-border">
            <Globe className="w-5 h-5 text-brand-500" />
            <h2 className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary">
              System & Regulatory Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
            <div>
              <label className="block font-semibold mb-1">Default Financial Year</label>
              <input
                type="text"
                value={formData.settings.defaultFinancialYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, defaultFinancialYear: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Time Zone</label>
              <input
                type="text"
                value={formData.settings.timeZone}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary opacity-70"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Deadline Reminder (Days Ahead)</label>
              <input
                type="number"
                value={formData.settings.reminderDaysBefore}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, reminderDaysBefore: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
