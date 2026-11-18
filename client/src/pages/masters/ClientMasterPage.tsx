import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  ListFilter,
  FileSpreadsheet,
  Layers,
  Building,
  Info,
  X,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { ClientItem } from '../../types';

export const ClientMasterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Form Fields - All completely empty by default
  const emptyForm = {
    groupName: '',
    businessType: 'Proprietorship',
    name: '',
    businessName: '',
    pan: '',
    gstin: '',
    cin: '',
    mobile: '',
    email: '',
    city: '',
    state: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (groupFilter !== 'All') params.append('group', groupFilter);
      if (typeFilter !== 'All') params.append('clientType', typeFilter);
      params.append('limit', '50');

      const res = await api.get(`/clients?${params.toString()}`);
      if (res.data?.data?.clients) {
        setClients(res.data.data.clients);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchClients();
    }
  }, [activeTab, search, groupFilter, typeFilter]);

  // Extract unique group names for suggestions & dropdown
  const uniqueGroups = Array.from(
    new Set(clients.map((c) => c.groupName).filter(Boolean))
  ) as string[];

  const isCorporate =
    formData.businessType === 'Private Limited' ||
    formData.businessType === 'Public Limited' ||
    formData.businessType === 'LLP';

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        groupName: formData.groupName.trim() || undefined,
        businessType: formData.businessType,
        clientType:
          formData.businessType === 'Private Limited' || formData.businessType === 'Public Limited'
            ? 'Company'
            : formData.businessType === 'LLP'
            ? 'LLP'
            : formData.businessType === 'Partnership'
            ? 'Partnership'
            : 'Individual',
        name: formData.name.trim(),
        businessName: formData.businessName.trim() || undefined,
        pan: formData.pan.trim().toUpperCase(),
        gstin: formData.gstin.trim().toUpperCase() || undefined,
        cin: formData.cin.trim().toUpperCase() || undefined,
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || undefined,
        address: {
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          country: 'India',
        },
      };

      if (editingClientId) {
        await api.put(`/clients/${editingClientId}`, payload);
        toast.success('Client updated successfully!');
        setEditingClientId(null);
      } else {
        await api.post('/clients', payload);
        toast.success(`Client "${formData.businessName || formData.name}" registered successfully!`);
      }

      setFormData(emptyForm);
      setActiveTab('list');
      fetchClients();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error saving client';
      toast.error(msg);
    }
  };

  const handleEditClient = (client: ClientItem) => {
    setEditingClientId(client._id);
    setFormData({
      groupName: client.groupName || '',
      businessType: client.businessType || 'Proprietorship',
      name: client.name || '',
      businessName: client.businessName || '',
      pan: client.pan || '',
      gstin: client.gstin || '',
      cin: client.cin || '',
      mobile: client.mobile || '',
      email: client.email || '',
      city: client.address?.city || '',
      state: client.address?.state || '',
    });
    setActiveTab('form');
    toast.info(`Editing client: ${client.businessName || client.name}`);
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete / archive "${name}"?`)) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success(`Client "${name}" removed`);
      fetchClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete client');
    }
  };

  const handleResetForm = () => {
    setEditingClientId(null);
    setFormData(emptyForm);
    toast.info('Form cleared');
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/clients/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ca_proflow_clients.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Exported clients to CSV');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Client Master
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Register new clients and view directory
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'form' ? (
            <button
              onClick={() => {
                setActiveTab('list');
                setEditingClientId(null);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary text-xs font-semibold hover:bg-light-bg dark:hover:bg-dark-cardSecondary shadow-sm transition-colors"
            >
              <ListFilter className="w-4 h-4 text-brand-500" />
              <span>View Directory ({clients.length})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveTab('form');
                handleResetForm();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Client</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary text-xs font-semibold hover:bg-light-bg dark:hover:bg-dark-cardSecondary shadow-sm transition-colors"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-status-green" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {activeTab === 'form' ? (
        /* Simple, Clean, Single-Card Registration Form */
        <div className="w-full p-6 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark transition-colors">
          {/* Header indicator when editing */}
          {editingClientId && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
              <span>
                <strong>Editing Client:</strong> Update fields below and click "Update Client".
              </span>
              <button
                type="button"
                onClick={handleResetForm}
                className="text-amber-900 dark:text-amber-200 hover:underline font-bold"
              >
                Cancel Edit
              </button>
            </div>
          )}

          <div className="border-b border-light-border dark:border-dark-border pb-3 mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-500" />
              <span>{editingClientId ? 'Update Client Details' : 'New Client Registration'}</span>
            </h2>
            <span className="text-[13px] text-light-textMuted dark:text-dark-textMuted">
              * Required fields
            </span>
          </div>

          <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
            {/* ROW 1: Group Name & Constitution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  Client Group / Parent Umbrella
                  <span className="ml-1 text-[13px] font-normal text-light-textMuted dark:text-dark-textMuted">
                    (Optional - e.g. Singhania Group)
                  </span>
                </label>
                <input
                  type="text"
                  list="client-groups-datalist"
                  placeholder="e.g. Singhania Group (Leave blank if single firm)"
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                />
                <datalist id="client-groups-datalist">
                  {uniqueGroups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  Business Type / Constitution *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                >
                  <option value="Proprietorship">Proprietorship (Sole Owner)</option>
                  <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="LLP">LLP (Limited Liability Partnership)</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="Other">Other / Individual</option>
                </select>
              </div>
            </div>

            {/* ROW 2: Legal Name & Trade Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  Legal Name (As per PAN Card) *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isCorporate
                      ? 'e.g. Singhania Logistics Private Limited'
                      : 'e.g. Ajay Singhania (Proprietor Personal Name)'
                  }
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                />
                <span className="text-[12px] text-light-textMuted dark:text-dark-textMuted block mt-1">
                  Name as registered on PAN Card
                </span>
              </div>

              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  Trade / Business / Firm Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Singhania Traders (Shop or Brand Name)"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                />
                <span className="text-[12px] text-light-textMuted dark:text-dark-textMuted block mt-1">
                  Operating firm name used for billing/invoicing
                </span>
              </div>
            </div>

            {/* ROW 3: PAN & GSTIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  PAN Number *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  GSTIN (If Any)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 22ABCDE1234F1Z5"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-mono font-medium"
                />
              </div>
            </div>

            {/* DYNAMIC ROW: CIN (Shown ONLY when Company/LLP is selected) */}
            {isCorporate && (
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <label className="block font-semibold text-brand-600 dark:text-brand-400 mb-1.5">
                  CIN / LLPIN (Corporate Identification Number)
                </label>
                <input
                  type="text"
                  placeholder="e.g. U60200CT2021PTC012345 (21 Digits)"
                  value={formData.cin}
                  onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary font-mono font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            )}

            {/* ROW 4: Mobile & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. contact@business.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                />
              </div>
            </div>

            {/* ROW 5: City & State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raipur, Mumbai, Delhi"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chhattisgarh, Maharashtra"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-transparent text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-cardSecondary text-xs font-semibold transition-colors"
              >
                {editingClientId ? 'Cancel Edit' : 'Clear Form'}
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all"
              >
                {editingClientId ? 'Update Client' : 'Save Client'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Client Directory Table */
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
          <div className="p-4 border-b border-light-border dark:border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-light-textMuted dark:text-dark-textMuted" />
                <input
                  type="text"
                  placeholder="Search by Name, PAN, GSTIN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                />
              </div>

              {/* Group Filter */}
              {uniqueGroups.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-light-textMuted dark:text-dark-textMuted font-medium">Group:</span>
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary font-semibold text-xs focus:outline-none"
                  >
                    <option value="All">All Groups</option>
                    {uniqueGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-light-textMuted dark:text-dark-textMuted font-medium">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary font-semibold text-xs focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Individual">Individual / Proprietorship</option>
                  <option value="Company">Company / Pvt Ltd</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLP">LLP</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-light-textMuted dark:text-dark-textMuted font-medium flex items-center gap-2">
              <span>Showing {clients.length} clients</span>
              <button
                onClick={() => {
                  setActiveTab('form');
                  handleResetForm();
                }}
                className="text-brand-500 hover:underline font-bold"
              >
                + Register Client
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Group</th>
                  <th className="py-3 px-4">Trade / Business Name</th>
                  <th className="py-3 px-4">Legal Name (PAN Holder)</th>
                  <th className="py-3 px-4">Constitution</th>
                  <th className="py-3 px-4">PAN / CIN</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-light-textMuted dark:text-dark-textMuted">
                      {loading ? 'Loading clients...' : 'No clients found.'}
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-brand-500 font-semibold">{c.clientCode}</td>
                      <td className="py-3 px-4">
                        {c.groupName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            <Layers className="w-2.5 h-2.5" />
                            {c.groupName}
                          </span>
                        ) : (
                          <span className="text-light-textMuted dark:text-dark-textMuted text-[13px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                        {c.businessName || c.name}
                      </td>
                      <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                        {c.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[12px] font-medium bg-light-bg dark:bg-dark-cardSecondary border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary">
                          {c.businessType || c.clientType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="text-light-textPrimary dark:text-dark-textPrimary">{c.pan}</div>
                        {c.cin && (
                          <div className="text-[12px] text-brand-600 dark:text-brand-400 font-mono tracking-tighter">
                            CIN: {c.cin}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-light-textSecondary dark:text-dark-textSecondary">
                        {c.gstin || '-'}
                      </td>
                      <td className="py-3 px-4">{c.mobile}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditClient(c)}
                            title="Edit Client"
                            className="p-1 rounded-lg hover:bg-light-bg dark:hover:bg-dark-cardSecondary text-light-textMuted hover:text-brand-500 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(c._id, c.businessName || c.name)}
                            title="Delete Client"
                            className="p-1 rounded-lg hover:bg-light-bg dark:hover:bg-dark-cardSecondary text-light-textMuted hover:text-status-red transition-colors"
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
      )}
    </div>
  );
};
