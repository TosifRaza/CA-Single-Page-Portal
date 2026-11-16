import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Receipt,
  Clock,
  Calendar,
  CheckCircle2,
  Tag,
  RefreshCw,
  PlusCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { WorkMasterItem, TaxMasterItem } from '../../types';

export const WorkMasterPage: React.FC = () => {
  const [works, setWorks] = useState<WorkMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Works');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(4);

  // Available Tax Masters for dropdown
  const [availableTaxes, setAvailableTaxes] = useState<TaxMasterItem[]>([]);
  const [loadingTaxes, setLoadingTaxes] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkMasterItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const [formData, setFormData] = useState({
    workName: '',
    taxId: '',
    category: 'GST' as 'GST' | 'Income Tax' | 'TDS' | 'Compliance' | 'Advisory' | 'Others',
    timeline: '2 Days',
    defaultPriority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    description: '',
    defaultChecklist: [
      'Collect transaction invoices & vouchers from client',
      'Reconcile with government portal / 2B / 26AS data',
      'Draft computation and review tax liability',
      'Obtain client review & sign-off approval',
      'Final submission on portal & ARN generation',
    ] as string[],
    status: 'Active' as 'Active' | 'Inactive' | 'Archived',
  });

  const tabs = ['All Works', 'Tax Related', 'Compliance', 'Advisory', 'Others'];
  const categories = ['All Categories', 'GST', 'Income Tax', 'TDS', 'Compliance', 'Advisory', 'Others'];
  const statuses = ['All', 'Active', 'Inactive'];

  // Fetch Tax Masters for the dropdown (strictly from Tax Master in DB)
  const fetchAvailableTaxes = async () => {
    try {
      setLoadingTaxes(true);
      const res = await api.get('/taxes?limit=100');
      if (res.data?.data?.taxes) {
        setAvailableTaxes(res.data.data.taxes);
      }
    } catch (err) {
      console.error('Error fetching taxes for Work Master:', err);
    } finally {
      setLoadingTaxes(false);
    }
  };

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'All Works') params.append('tab', activeTab);
      if (categoryFilter !== 'All Categories') params.append('category', categoryFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await api.get(`/work-masters?${params.toString()}`);
      if (res.data?.data) {
        setWorks(res.data.data.works);
        setTotalPages(res.data.data.pagination.pages);
        setTotalCount(res.data.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching works:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
    fetchAvailableTaxes();
  }, [activeTab, categoryFilter, statusFilter, search, page]);

  // Selected Tax details object
  const selectedTax = availableTaxes.find((t) => t._id === formData.taxId);

  // When user selects a Tax Name
  const handleTaxSelect = (taxId: string) => {
    const selected = availableTaxes.find((t) => t._id === taxId);
    if (selected) {
      // Automatically map statutory category from taxGroup
      let mappedCat: any = 'Others';
      const tg = selected.taxGroup || '';
      if (['GST', 'Income Tax', 'TDS', 'Compliance', 'Advisory', 'Others'].includes(tg)) {
        mappedCat = tg;
      } else if (tg.includes('GST')) {
        mappedCat = 'GST';
      } else if (tg.includes('Income Tax') || tg === 'IT') {
        mappedCat = 'Income Tax';
      } else if (tg.includes('TDS')) {
        mappedCat = 'TDS';
      } else {
        mappedCat = 'Compliance';
      }

      setFormData((prev) => ({
        ...prev,
        taxId,
        category: mappedCat,
        defaultPriority: (selected.priority as any) || prev.defaultPriority || 'Medium',
        description: selected.description || prev.description || '',
        // If workName is empty, auto-suggest a professional title
        workName: prev.workName.trim() ? prev.workName : `${selected.taxName} Filing`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, taxId: '' }));
    }
  };

  const handleAddChecklist = () => {
    if (!newChecklistItem.trim()) return;
    setFormData((prev) => ({
      ...prev,
      defaultChecklist: [...prev.defaultChecklist, newChecklistItem.trim()],
    }));
    setNewChecklistItem('');
  };

  const handleRemoveChecklist = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      defaultChecklist: prev.defaultChecklist.filter((_, i) => i !== index),
    }));
  };

  const openCreateModal = () => {
    setEditingWork(null);
    setNewChecklistItem('');
    setFormData({
      workName: '',
      taxId: '',
      category: 'GST',
      timeline: '2 Days',
      defaultPriority: 'Medium',
      description: '',
      defaultChecklist: [
        'Collect transaction invoices & vouchers from client',
        'Reconcile with government portal / 2B / 26AS data',
        'Draft computation and review tax liability',
        'Obtain client review & sign-off approval',
        'Final submission on portal & ARN generation',
      ],
      status: 'Active',
    });
    fetchAvailableTaxes();
    setIsModalOpen(true);
  };

  const openEditModal = (work: WorkMasterItem) => {
    setEditingWork(work);
    setNewChecklistItem('');
    const matchedTaxId =
      typeof work.taxId === 'object' && work.taxId?._id
        ? work.taxId._id
        : typeof work.taxId === 'string'
        ? work.taxId
        : '';

    setFormData({
      workName: work.workName || '',
      taxId: matchedTaxId,
      category: work.category || 'GST',
      timeline: work.timeline || '2 Days',
      defaultPriority: work.defaultPriority || 'Medium',
      description: work.description || '',
      defaultChecklist:
        work.defaultChecklist && work.defaultChecklist.length > 0
          ? work.defaultChecklist
          : [
              'Collect transaction invoices & vouchers from client',
              'Reconcile with government portal / 2B / 26AS data',
              'Draft computation and review tax liability',
              'Obtain client review & sign-off approval',
              'Final submission on portal & ARN generation',
            ],
      status: work.status || 'Active',
    });
    fetchAvailableTaxes();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workName.trim()) {
      toast.error('Work Name is required.');
      return;
    }
    if (!formData.taxId && !editingWork) {
      toast.error('Please select an associated Tax Name from Tax Master.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingWork) {
        await api.put(`/work-masters/${editingWork._id}`, formData);
        toast.success(`Work template "${formData.workName}" updated successfully!`);
      } else {
        await api.post('/work-masters', formData);
        toast.success(`Work template "${formData.workName}" created successfully!`);
      }
      setIsModalOpen(false);
      setEditingWork(null);
      fetchWorks();
    } catch (err: any) {
      console.error('Error saving work template:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error saving work template';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this work template?')) {
      try {
        await api.delete(`/work-masters/${id}`);
        toast.success('Work template deleted successfully');
        fetchWorks();
      } catch (err: any) {
        console.error('Error deleting work:', err);
        toast.error(err.response?.data?.message || 'Error deleting work template');
      }
    }
  };

  const formatDate = (d?: string | Date) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-brand-500 mb-1 flex items-center gap-1.5">
            <NavLink to="/dashboard" className="hover:underline flex items-center gap-0.5">
              <span>«</span> Master Management
            </NavLink>
            <span className="text-light-textMuted dark:text-dark-textMuted">&gt;</span>
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Work Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Work Master
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Define compliance works & standardize statutory task templates linked to Tax Master
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Work</span>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
        {/* Filter Tabs */}
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-light-border dark:border-dark-border overflow-x-auto text-xs font-semibold">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`pb-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-500 font-bold'
                  : 'border-transparent text-light-textSecondary dark:text-dark-textSecondary hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-light-border/60 dark:border-dark-border/60 bg-light-bg/30 dark:bg-dark-cardSecondary/30">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-light-textMuted dark:text-dark-textMuted" />
            <input
              type="text"
              placeholder="Search work..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4 font-semibold w-12">ID</th>
                <th className="py-3 px-4 font-semibold">Work Name</th>
                <th className="py-3 px-4 font-semibold">Associated Tax (Tax Master)</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Timeline</th>
                <th className="py-3 px-4 font-semibold">Due Date Rule</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-light-textMuted">
                    Loading work templates...
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-light-textMuted">
                    No work templates found. Click "+ Add New Work" to create one.
                  </td>
                </tr>
              ) : (
                works.map((work) => {
                  const associatedTax =
                    typeof work.taxId === 'object' && work.taxId
                      ? work.taxId
                      : availableTaxes.find((t) => t._id === work.taxId);

                  return (
                    <tr
                      key={work._id}
                      className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-light-textMuted dark:text-dark-textMuted font-mono">
                        {work.workId}
                      </td>
                      <td className="py-3 px-4 text-light-textPrimary dark:text-dark-textPrimary font-bold">
                        {work.workName}
                      </td>
                      <td className="py-3 px-4">
                        {associatedTax ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-500/10 border border-brand-200/80 dark:border-brand-500/20 text-brand-700 dark:text-brand-300 font-semibold text-[11px]">
                            <Receipt className="w-3 h-3 text-brand-500" />
                            <span>{associatedTax.taxName}</span>
                            <span className="text-[10px] opacity-75 font-normal">
                              ({associatedTax.taxGroup})
                            </span>
                          </div>
                        ) : (
                          <span className="text-light-textMuted dark:text-dark-textMuted italic text-[11px]">
                            Not linked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-light-border/60 dark:bg-dark-border/60 text-[10px] font-bold">
                          {work.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary font-semibold">
                        {work.timeline}
                      </td>
                      <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary text-[11px]">
                        {associatedTax?.dueDateRule || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            work.status === 'Active'
                              ? 'bg-status-greenLight dark:bg-status-green/20 text-status-green'
                              : 'bg-light-border dark:bg-dark-border text-light-textMuted'
                          }`}
                        >
                          {work.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(work)}
                            className="p-1 rounded text-light-textSecondary dark:text-dark-textSecondary hover:text-brand-500 hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
                            title="Edit Work"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(work._id)}
                            className="p-1 rounded text-light-textSecondary dark:text-dark-textSecondary hover:text-status-red hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
                            title="Delete Work"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-light-border dark:border-dark-border text-xs text-light-textSecondary dark:text-dark-textSecondary">
          <div>
            Showing {works.length > 0 ? (page - 1) * 10 + 1 : 0} -{' '}
            {Math.min(page * 10, totalCount)} of {totalCount}
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-card disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                  page === p
                    ? 'bg-brand-500 text-white'
                    : 'border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-card text-light-textPrimary dark:text-dark-textPrimary'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-card disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Work Modal (Step 1: 2 Fields -> Step 2: Full Tax Details Expand) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40">
              <div>
                <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-500" />
                  <span>{editingWork ? 'Edit Work Template' : 'Add New Work Template'}</span>
                </h3>
                <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
                  Select a tax from Tax Master to link statutory compliance parameters
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-light-textMuted hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="workMasterForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* --- STEP 1: INITIAL 2 FIELDS (Work Name & Select Tax Name) --- */}
              <div className="p-4 rounded-xl border border-brand-200/80 dark:border-brand-500/20 bg-brand-50/30 dark:bg-brand-500/5 space-y-4">
                <div className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">1</span>
                  Basic Work & Tax Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 1: Work Name */}
                  <div>
                    <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                      Work Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GSTR-1 Monthly Return Filing"
                      value={formData.workName}
                      onChange={(e) => setFormData({ ...formData, workName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-xs shadow-2xs"
                    />
                    <span className="text-[10px] text-light-textMuted dark:text-dark-textMuted mt-1 block">
                      Name of the job / assignment
                    </span>
                  </div>

                  {/* Field 2: Select Tax Name (From Tax Master in DB) */}
                  <div>
                    <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary flex items-center justify-between">
                      <span>Select Tax Name *</span>
                      <NavLink
                        to="/masters/tax"
                        target="_blank"
                        className="text-[10px] font-semibold text-brand-500 hover:underline"
                      >
                        + View Tax Master
                      </NavLink>
                    </label>
                    <select
                      required
                      value={formData.taxId}
                      onChange={(e) => handleTaxSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-xs cursor-pointer shadow-2xs"
                    >
                      <option value="">-- Select Tax Name (From Tax Master) --</option>
                      {availableTaxes.length > 0 ? (
                        availableTaxes.map((tax) => (
                          <option key={tax._id} value={tax._id}>
                            {tax.taxName} ({tax.taxGroup})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {loadingTaxes ? 'Loading taxes...' : 'No taxes saved in Tax Master'}
                        </option>
                      )}
                    </select>
                    <span className="text-[10px] text-light-textMuted dark:text-dark-textMuted mt-1 block">
                      Populated exclusively from your Tax Master rules
                    </span>
                  </div>
                </div>
              </div>

              {/* --- IF NO TAX SELECTED AND NOT EDITING: Prompt User to Select --- */}
              {!formData.taxId && !editingWork ? (
                <div className="py-10 px-6 text-center border-2 border-dashed border-light-border dark:border-dark-border rounded-2xl bg-light-bg/40 dark:bg-dark-cardSecondary/20 animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-center mx-auto mb-3 text-brand-600 dark:text-brand-400">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary">
                    Select a Tax Name Above
                  </h4>
                  <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1 max-w-sm mx-auto">
                    Once you select a Tax Name from Tax Master, its full statutory details (Category, Due Date, Frequency, and Reconciliation) will automatically open below.
                  </p>
                </div>
              ) : (
                /* --- STEP 2: FULL DETAILS REVEALED WHEN TAX IS SELECTED OR WHEN EDITING --- */
                <div className="space-y-5 animate-in fade-in slide-in-from-top-3 duration-200">
                  {/* Full Details of Selected Tax Card */}
                  {selectedTax ? (
                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-500/5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 dark:border-blue-500/20 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-bold text-xs text-blue-900 dark:text-blue-300">
                            Statutory Tax Details: {selectedTax.taxName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                            Group: {selectedTax.taxGroup}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                            {selectedTax.frequency || selectedTax.filingFrequency || 'Monthly'}
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-dark-bg/60 border border-blue-100 dark:border-blue-500/20">
                          <span className="text-light-textMuted dark:text-dark-textMuted block text-[10px] font-semibold">
                            Due Date Rule
                          </span>
                          <span className="font-bold text-light-textPrimary dark:text-dark-textPrimary mt-0.5 block">
                            {selectedTax.dueDateRule || 'Standard cycle'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-dark-bg/60 border border-blue-100 dark:border-blue-500/20">
                          <span className="text-light-textMuted dark:text-dark-textMuted block text-[10px] font-semibold">
                            Reconciliation
                          </span>
                          <span className="font-bold text-light-textPrimary dark:text-dark-textPrimary mt-0.5 block flex items-center gap-1">
                            {selectedTax.reconciliationRequired ? (
                              <span className="text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5" /> Required
                              </span>
                            ) : (
                              <span className="text-light-textMuted dark:text-dark-textMuted">Optional</span>
                            )}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-dark-bg/60 border border-blue-100 dark:border-blue-500/20">
                          <span className="text-light-textMuted dark:text-dark-textMuted block text-[10px] font-semibold">
                            Statutory Priority
                          </span>
                          <span className="font-bold text-light-textPrimary dark:text-dark-textPrimary mt-0.5 block">
                            {selectedTax.priority || 'Medium'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-dark-bg/60 border border-blue-100 dark:border-blue-500/20">
                          <span className="text-light-textMuted dark:text-dark-textMuted block text-[10px] font-semibold">
                            Reporting Cycle
                          </span>
                          <span className="font-bold text-light-textPrimary dark:text-dark-textPrimary mt-0.5 block truncate">
                            {selectedTax.periodFrom && selectedTax.periodTo
                              ? `${formatDate(selectedTax.periodFrom)} - ${formatDate(selectedTax.periodTo)}`
                              : selectedTax.filingPeriod || 'Active FY'}
                          </span>
                        </div>
                      </div>

                      {/* Description / Instructions */}
                      {selectedTax.description && (
                        <div className="text-[11px] text-light-textSecondary dark:text-dark-textSecondary bg-white/60 dark:bg-dark-bg/40 p-2.5 rounded-lg border border-blue-100/80 dark:border-blue-500/10">
                          <span className="font-semibold text-blue-900 dark:text-blue-300">Regulatory Notes: </span>
                          {selectedTax.description}
                        </div>
                      )}
                    </div>
                  ) : editingWork ? (
                    <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>No Tax currently linked to this template. You can select an active Tax from the dropdown above to link statutory deadlines, or edit template settings directly.</span>
                    </div>
                  ) : null}

                  {/* Work Execution Settings */}
                  <div className="space-y-4 pt-2">
                    <div className="text-[11px] font-bold text-light-textSecondary dark:text-dark-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">2</span>
                      Work Execution & Template Settings
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Category */}
                      <div>
                        <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                          className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none text-xs font-semibold"
                        >
                          <option value="GST">GST</option>
                          <option value="Income Tax">Income Tax</option>
                          <option value="TDS">TDS</option>
                          <option value="Compliance">Compliance</option>
                          <option value="Advisory">Advisory</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>

                      {/* Expected Timeline */}
                      <div>
                        <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                          Expected Timeline *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2 Days, 5 Days"
                          value={formData.timeline}
                          onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                          className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none text-xs font-semibold"
                        />
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {['1 Day', '2 Days', '3 Days', '5 Days', '7 Days'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormData({ ...formData, timeline: t })}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                formData.timeline === t
                                  ? 'bg-brand-500 text-white border-brand-500'
                                  : 'bg-light-bg dark:bg-dark-card border-light-border dark:border-dark-border text-light-textMuted hover:text-light-textPrimary'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                          Default Priority
                        </label>
                        <select
                          value={formData.defaultPriority}
                          onChange={(e) =>
                            setFormData({ ...formData, defaultPriority: e.target.value as any })
                          }
                          className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none text-xs font-semibold"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {/* Status & Remarks */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none text-xs font-semibold"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                          Work Description / Instructions
                        </label>
                        <input
                          type="text"
                          placeholder="Standard instructions for staff or article trainees..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none text-xs"
                        />
                      </div>
                    </div>

                    {/* Standard Checklist Steps */}
                    <div className="space-y-2 pt-1">
                      <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                        Standard Checklist & Execution Steps ({formData.defaultChecklist.length})
                      </label>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {formData.defaultChecklist.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-light-bg/60 dark:bg-dark-bg/60 border border-light-border dark:border-dark-border text-xs"
                          >
                            <div className="flex items-center gap-2 text-light-textPrimary dark:text-dark-textPrimary">
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                              <span className="font-medium">{step}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveChecklist(idx)}
                              className="text-light-textMuted hover:text-status-red p-0.5 rounded transition-colors"
                              title="Remove step"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add new checklist step */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add custom checklist step..."
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddChecklist();
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-xs text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddChecklist}
                          className="px-3 py-1.5 rounded-lg bg-light-border dark:bg-dark-border hover:bg-brand-500 hover:text-white text-light-textPrimary dark:text-dark-textPrimary text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-light-border dark:border-dark-border bg-white dark:bg-dark-card">
              <div className="text-[11px] text-light-textMuted dark:text-dark-textMuted">
                {formData.taxId ? (
                  <span className="font-semibold text-brand-600 dark:text-brand-400">
                    Linked to Tax Master: {selectedTax?.taxName || 'Selected Tax'}
                  </span>
                ) : editingWork ? (
                  <span className="text-light-textSecondary dark:text-dark-textSecondary font-medium">
                    Editing existing work template
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Please select a tax name first
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-light-border dark:border-dark-border text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-cardSecondary font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="workMasterForm"
                  disabled={submitting || (!formData.taxId && !editingWork)}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingWork ? 'Update Work Template' : 'Save Work Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
