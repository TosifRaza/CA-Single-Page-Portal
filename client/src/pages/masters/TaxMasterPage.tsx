import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  ChevronDown,
  X,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  FileCheck,
  Building,
  Tags,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { TaxMasterItem, TaxFilingItem } from '../../types';
import { TaxRuleModal } from '../../components/tax/TaxRuleModal';
import { ExtendDeadlineModal } from '../../components/tax/ExtendDeadlineModal';
import { ReconciliationModal } from '../../components/tax/ReconciliationModal';

export const TaxMasterPage: React.FC = () => {
  // Main View: 'rules' or 'filings'
  const [mainView, setMainView] = useState<'rules' | 'filings'>('rules');

  // --- Tax Rules State ---
  const [taxes, setTaxes] = useState<TaxMasterItem[]>([]);
  const [loadingTaxes, setLoadingTaxes] = useState(true);
  const [activeTab, setActiveTab] = useState('All Taxes');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // --- Tax Filings State ---
  const [filings, setFilings] = useState<TaxFilingItem[]>([]);
  const [loadingFilings, setLoadingFilings] = useState(false);
  const [filingStatusFilter, setFilingStatusFilter] = useState('All');
  const [reconciliationFilter, setReconciliationFilter] = useState('All');
  const [filingSearch, setFilingSearch] = useState('');
  const [filingPage, setFilingPage] = useState(1);
  const [filingTotalPages, setFilingTotalPages] = useState(1);
  const [filingTotalCount, setFilingTotalCount] = useState(0);

  // --- Modals State ---
  const [isTaxRuleModalOpen, setIsTaxRuleModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxMasterItem | null>(null);

  const [selectedFilingForExtension, setSelectedFilingForExtension] = useState<TaxFilingItem | null>(null);
  const [selectedFilingForRecon, setSelectedFilingForRecon] = useState<TaxFilingItem | null>(null);

  const [dynamicTaxGroups, setDynamicTaxGroups] = useState<string[]>([]);
  const [loadingTaxGroups, setLoadingTaxGroups] = useState(true);

  const fetchTaxGroups = async () => {
    try {
      setLoadingTaxGroups(true);
      const res = await api.get('/tax-groups');
      if (res.data?.data && Array.isArray(res.data.data)) {
        const names = res.data.data.map((g: any) => g.groupName);
        setDynamicTaxGroups(names);
      } else {
        setDynamicTaxGroups([]);
      }
    } catch (err) {
      console.log('Error fetching tax groups for filter:', err);
      setDynamicTaxGroups([]);
    } finally {
      setLoadingTaxGroups(false);
    }
  };

  useEffect(() => {
    fetchTaxGroups();
  }, []);

  // Only show groups that exist in Tax Group Master
  const activeGroupNames = dynamicTaxGroups;

  const tabs = [
    'All Taxes',
    ...Array.from(new Set(activeGroupNames.filter((g) => g !== 'Other' && g !== 'Others'))),
    ...(activeGroupNames.some((g) => g === 'Other' || g === 'Others') ? ['Others'] : []),
  ];
  const groups = ['All Groups', ...Array.from(new Set(activeGroupNames))];
  const statuses = ['All Statuses', 'Active', 'Inactive', 'Archived'];

  const filingStatusOptions = ['All', 'Pending', 'In Progress', 'Ready to File', 'Submitted', 'Filed', 'Rejected'];
  const reconStatusOptions = ['All', 'Reconciled', 'Pending', 'Mismatch', 'Under Review', 'Not Required'];

  // Fetch Tax Rules
  const fetchTaxes = async () => {
    try {
      setLoadingTaxes(true);
      const params: any = {
        page,
        limit: 10,
      };

      if (activeTab !== 'All Taxes') {
        params.group = activeTab;
      } else if (groupFilter !== 'All Groups') {
        params.group = groupFilter;
      }

      if (statusFilter !== 'All Statuses') {
        params.status = statusFilter;
      }

      if (search) {
        params.search = search;
      }

      const res = await api.get('/taxes', { params });
      if (res.data?.data) {
        setTaxes(res.data.data.taxes || []);
        setTotalPages(res.data.data.pagination?.pages || 1);
        setTotalCount(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching taxes:', err);
    } finally {
      setLoadingTaxes(false);
    }
  };

  // Fetch Tax Filings
  const fetchFilings = async () => {
    try {
      setLoadingFilings(true);
      const params: any = {
        page: filingPage,
        limit: 8,
      };

      if (filingStatusFilter !== 'All') {
        params.status = filingStatusFilter;
      }
      if (reconciliationFilter !== 'All') {
        params.reconciliationStatus = reconciliationFilter;
      }
      if (filingSearch) {
        params.search = filingSearch;
      }

      const res = await api.get('/tax-filings', { params });
      if (res.data?.data) {
        setFilings(res.data.data.filings || []);
        setFilingTotalPages(res.data.data.pagination?.pages || 1);
        setFilingTotalCount(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching tax filings:', err);
    } finally {
      setLoadingFilings(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, [activeTab, groupFilter, statusFilter, search, page]);

  useEffect(() => {
    fetchFilings();
  }, [filingStatusFilter, reconciliationFilter, filingSearch, filingPage]);

  const handleDeleteTax = async (id: string) => {
    if (confirm('Are you sure you want to delete this tax rule?')) {
      try {
        await api.delete(`/taxes/${id}`);
        toast.success('Tax rule deleted successfully');
        fetchTaxes();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Error deleting tax rule');
      }
    }
  };

  const openCreateModal = () => {
    setEditingTax(null);
    setIsTaxRuleModalOpen(true);
  };

  const openEditModal = (tax: TaxMasterItem) => {
    setEditingTax(tax);
    setIsTaxRuleModalOpen(true);
  };

  const handleQuickStatusChange = async (filingId: string, newStatus: string) => {
    try {
      await api.patch(`/tax-filings/${filingId}/status`, {
        filingStatus: newStatus,
        actualSubmissionDate: newStatus === 'Filed' ? new Date().toISOString() : undefined,
      });
      toast.success(`Filing marked as ${newStatus}!`);
      fetchFilings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update filing status');
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
      {/* Header with Breadcrumb matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-brand-500 mb-1 flex items-center gap-1.5">
            <NavLink to="/dashboard" className="hover:underline flex items-center gap-0.5">
              <span>«</span> Master Management
            </NavLink>
            <span className="text-light-textMuted dark:text-dark-textMuted">&gt;</span>
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Tax Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Tax Master & Compliance
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Manage tax rules, statutory deadlines, client filings & reconciliations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* View Switcher: Tax Rules vs Tax Filings */}
          <div className="flex items-center gap-1 p-1 bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl">
            <button
              onClick={() => setMainView('rules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mainView === 'rules'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-light-textSecondary dark:text-dark-textSecondary hover:text-light-textPrimary'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tax Rules</span>
            </button>
            <button
              onClick={() => setMainView('filings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mainView === 'filings'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-light-textSecondary dark:text-dark-textSecondary hover:text-light-textPrimary'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Client Filings ({filingTotalCount})</span>
            </button>
          </div>

          <NavLink
            to="/masters/tax-groups"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:bg-light-bg dark:hover:bg-dark-cardSecondary text-light-textPrimary dark:text-dark-textPrimary text-xs font-semibold shadow-sm transition-all"
            title="Configure statutory tax groups & compliance categories"
          >
            <Tags className="w-3.5 h-3.5 text-brand-500" />
            <span>Manage Tax Groups</span>
          </NavLink>

          <button
            onClick={() => {
              if (dynamicTaxGroups.length === 0) {
                toast.error('Cannot add tax rule: Tax Group Master is empty. Please configure a Tax Group first.');
                return;
              }
              openCreateModal();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${
              dynamicTaxGroups.length === 0
                ? 'bg-gray-400 dark:bg-gray-700 text-gray-200 cursor-not-allowed opacity-75'
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20 active:scale-95'
            }`}
            title={dynamicTaxGroups.length === 0 ? 'Tax Group Master is empty. Please add a Tax Group first.' : 'Add New Tax'}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Tax</span>
          </button>
        </div>
      </div>

      {/* Dependency Warning Banner when 0 Tax Groups configured */}
      {dynamicTaxGroups.length === 0 && !loadingTaxGroups && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Dependency Notice: Tax Master strictly depends on Tax Group Master
              </h4>
              <p className="text-[13px] text-amber-700 dark:text-amber-300">
                Currently 0 Tax Groups are configured. You cannot add any Tax Rules until at least one Tax Group is created in Tax Group Master.
              </p>
            </div>
          </div>
          <NavLink
            to="/masters/tax-groups"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 self-start sm:self-auto transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Go to Tax Group Master</span>
          </NavLink>
        </div>
      )}

      {/* VIEW 1: TAX RULES (MASTER CONFIGURATION) matching Screenshot */}
      {mainView === 'rules' && (
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden transition-all">
          {/* Filter Tabs matching Screenshot */}
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
                placeholder="Search tax..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={groupFilter}
                onChange={(e) => {
                  setGroupFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              >
                {groups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-semibold text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                  <th className="py-3 px-3.5 font-semibold w-10">ID</th>
                  <th className="py-3 px-3.5 font-semibold">Tax Group</th>
                  <th className="py-3 px-3.5 font-semibold">Tax Name</th>
                  <th className="py-3 px-3.5 font-semibold">Description</th>
                  <th className="py-3 px-3.5 font-semibold">Frequency</th>
                  <th className="py-3 px-3.5 font-semibold">From Date</th>
                  <th className="py-3 px-3.5 font-semibold">To Date</th>
                  <th className="py-3 px-3.5 font-semibold">Due Date</th>
                  <th className="py-3 px-3.5 font-semibold">Submission Date</th>
                  <th className="py-3 px-3.5 font-semibold">Reconciliation</th>
                  <th className="py-3 px-3.5 font-semibold">Priority</th>
                  <th className="py-3 px-3.5 font-semibold">Status</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
                {loadingTaxes ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-light-textMuted dark:text-dark-textMuted font-medium">
                      Loading tax rules...
                    </td>
                  </tr>
                ) : taxes.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-light-textMuted dark:text-dark-textMuted font-medium">
                      No tax rules found. Click "+ Add Tax Rule" to create one.
                    </td>
                  </tr>
                ) : (
                  taxes.map((tax) => {
                    const displayDueDate = tax.effectiveDueDate
                      ? formatDate(tax.effectiveDueDate)
                      : (tax.dueDateRule || '—');
                    const submissionDate = tax.actualSubmissionDate || tax.submissionDate;

                  return (
                    <tr
                      key={tax._id}
                      className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-light-textMuted dark:text-dark-textMuted whitespace-nowrap">
                        {tax.taxId}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-light-textPrimary dark:text-dark-textPrimary whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[12px] font-bold bg-light-bg dark:bg-dark-cardSecondary border border-light-border dark:border-dark-border">
                          {tax.taxGroup}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-light-textPrimary dark:text-dark-textPrimary">
                          {tax.taxName}
                        </div>
                        {tax.taxCode && (
                          <div className="text-[12px] text-light-textMuted dark:text-dark-textMuted font-mono">
                            {tax.taxCode}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary max-w-[200px]">
                        {tax.description ? (
                          <span
                            className="truncate block cursor-help"
                            title={tax.description}
                          >
                            {tax.description}
                          </span>
                        ) : (
                          <span className="text-light-textMuted dark:text-dark-textMuted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                        {tax.frequency || tax.filingFrequency || 'Monthly'}
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                        {formatDate(tax.periodFrom)}
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                        {formatDate(tax.periodTo)}
                      </td>
                      <td className="py-3 px-3.5 font-medium text-light-textPrimary dark:text-dark-textPrimary whitespace-nowrap">
                        {displayDueDate}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {submissionDate ? (
                          <span className="text-light-textSecondary dark:text-dark-textSecondary font-medium">
                            {formatDate(submissionDate)}
                          </span>
                        ) : (
                          <span className="text-light-textMuted dark:text-dark-textMuted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {tax.reconciliationRequired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-blue-400">
                            <RefreshCw className="w-2.5 h-2.5" /> Required
                          </span>
                        ) : (
                          <span className="text-light-textMuted dark:text-dark-textMuted text-[13px]">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[12px] font-bold ${
                            tax.priority === 'Critical'
                              ? 'bg-status-red/15 text-status-red'
                              : tax.priority === 'High'
                              ? 'bg-status-orange/15 text-status-orange'
                              : tax.priority === 'Low'
                              ? 'bg-light-border dark:bg-dark-border text-light-textMuted'
                              : 'bg-brand-50 dark:bg-brand-500/15 text-brand-500'
                          }`}
                        >
                          {tax.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[13px] font-semibold ${
                            tax.status === 'Active'
                              ? 'bg-status-greenLight dark:bg-status-green/20 text-status-green'
                              : 'bg-light-border dark:bg-dark-border text-light-textMuted'
                          }`}
                        >
                          {tax.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(tax)}
                            className="p-1 text-light-textMuted hover:text-brand-500 transition-colors"
                            title="Edit Tax Rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTax(tax._id)}
                            className="p-1 text-light-textMuted hover:text-status-red transition-colors"
                            title="Delete Tax Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>

          {/* Pagination matching Screenshot */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-light-border dark:border-dark-border text-xs text-light-textSecondary dark:text-dark-textSecondary font-semibold">
            <span>
              Showing {taxes.length > 0 ? (page - 1) * 10 + 1 : 0} -{' '}
              {Math.min(page * 10, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-cardSecondary disabled:opacity-40"
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
                      : 'border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-cardSecondary text-light-textPrimary dark:text-dark-textPrimary'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-cardSecondary disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TAX FILINGS & CLIENT COMPLIANCE TABLE */}
      {mainView === 'filings' && (
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden transition-all">
          {/* Filings Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-light-border/60 dark:border-dark-border/60 bg-light-bg/30 dark:bg-dark-cardSecondary/30">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-light-textMuted dark:text-dark-textMuted" />
              <input
                type="text"
                placeholder="Search by ACK #, client or remarks..."
                value={filingSearch}
                onChange={(e) => setFilingSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <span>Filing:</span>
                <select
                  value={filingStatusFilter}
                  onChange={(e) => {
                    setFilingStatusFilter(e.target.value);
                    setFilingPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                >
                  {filingStatusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <span>Recon:</span>
                <select
                  value={reconciliationFilter}
                  onChange={(e) => {
                    setReconciliationFilter(e.target.value);
                    setFilingPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                >
                  {reconStatusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tax Filings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-semibold text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                  <th className="py-3 px-3.5 font-semibold">Client Name</th>
                  <th className="py-3 px-3.5 font-semibold">Tax Name</th>
                  <th className="py-3 px-3.5 font-semibold">Description / Notes</th>
                  <th className="py-3 px-3.5 font-semibold">From Date</th>
                  <th className="py-3 px-3.5 font-semibold">To Date</th>
                  <th className="py-3 px-3.5 font-semibold">Original Due</th>
                  <th className="py-3 px-3.5 font-semibold">Extended Due</th>
                  <th className="py-3 px-3.5 font-semibold">Effective Due</th>
                  <th className="py-3 px-3.5 font-semibold">Submission Date</th>
                  <th className="py-3 px-3.5 font-semibold">Filing Status</th>
                  <th className="py-3 px-3.5 font-semibold">Reconciliation</th>
                  <th className="py-3 px-3.5 font-semibold">Assignee</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
                {loadingFilings ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-light-textMuted dark:text-dark-textMuted font-medium">
                      Loading client filings...
                    </td>
                  </tr>
                ) : filings.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-light-textMuted dark:text-dark-textMuted font-medium">
                      No client filings found. Create a Tax Rule to generate compliance filings.
                    </td>
                  </tr>
                ) : (
                  filings.map((f) => {
                    const clientName = f.clientId?.businessName || f.clientId?.name || 'Client';
                  const taxName = f.taxRuleId?.taxName || 'Tax Filing';
                  const isExtended = !!f.extendedDueDate;
                  const isOverdue =
                    !['Filed', 'Submitted'].includes(f.filingStatus) &&
                    new Date(f.effectiveDueDate) < new Date();
                  const description = f.filingRemarks || f.taxRuleId?.description || '';

                  return (
                    <tr
                      key={f._id}
                      className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50 transition-colors"
                    >
                      <td className="py-3 px-3.5 font-bold text-light-textPrimary dark:text-dark-textPrimary whitespace-nowrap">
                        {clientName}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-brand-500 whitespace-nowrap">
                        {taxName}
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary max-w-[180px]">
                        {description ? (
                          <span className="truncate block cursor-help" title={description}>
                            {description}
                          </span>
                        ) : (
                          <span className="text-light-textMuted dark:text-dark-textMuted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                        {formatDate(f.periodFrom)}
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                        {formatDate(f.periodTo)}
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                        {formatDate(f.originalDueDate)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {isExtended ? (
                          <span
                            className="inline-flex items-center gap-1 text-[13px] font-bold text-status-orange"
                            title={f.extensionReason}
                          >
                            <Clock className="w-3 h-3" /> {formatDate(f.extendedDueDate)}
                          </span>
                        ) : (
                          <span className="text-light-textMuted dark:text-dark-textMuted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-extrabold text-light-textPrimary dark:text-dark-textPrimary whitespace-nowrap">
                        <span className={isOverdue ? 'text-status-red' : ''}>
                          {formatDate(f.effectiveDueDate)}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                        {formatDate(f.actualSubmissionDate)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[13px] font-semibold ${
                            f.filingStatus === 'Filed'
                              ? 'bg-status-greenLight dark:bg-status-green/20 text-status-green'
                              : f.filingStatus === 'Ready to File'
                              ? 'bg-status-purple/15 text-status-purple'
                              : f.filingStatus === 'In Progress'
                              ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-500'
                              : 'bg-status-orange/15 text-status-orange'
                          }`}
                        >
                          {f.filingStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {f.reconciliationRequired ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                              f.reconciliationStatus === 'Reconciled'
                                ? 'bg-status-greenLight dark:bg-status-green/20 text-status-green'
                                : f.reconciliationStatus === 'Mismatch'
                                ? 'bg-status-redLight dark:bg-status-red/20 text-status-red'
                                : 'bg-status-orange/15 text-status-orange'
                            }`}
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            {f.reconciliationStatus}
                          </span>
                        ) : (
                          <span className="text-light-textMuted dark:text-dark-textMuted text-[13px]">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                        {f.assignedEmployeeId?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Extend Deadline Action */}
                          <button
                            onClick={() => setSelectedFilingForExtension(f)}
                            className="p-1.5 rounded-lg border border-light-border dark:border-dark-border text-light-textMuted hover:text-status-orange hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
                            title="Extend Deadline"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          {/* Reconciliation Action */}
                          <button
                            onClick={() => setSelectedFilingForRecon(f)}
                            className="p-1.5 rounded-lg border border-light-border dark:border-dark-border text-light-textMuted hover:text-status-green hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
                            title="Manage Reconciliation"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Mark as Filed */}
                          {f.filingStatus !== 'Filed' && (
                            <button
                              onClick={() => handleQuickStatusChange(f._id, 'Filed')}
                              className="px-2 py-1 rounded-lg bg-status-greenLight dark:bg-status-green/20 text-status-green hover:bg-status-green hover:text-white font-bold text-[12px] transition-colors"
                              title="Mark as Filed"
                            >
                              File
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>

          {/* Filings Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-light-border dark:border-dark-border text-xs text-light-textSecondary dark:text-dark-textSecondary font-semibold">
            <span>
              Showing {filings.length > 0 ? (filingPage - 1) * 8 + 1 : 0} -{' '}
              {Math.min(filingPage * 8, filingTotalCount)} of {filingTotalCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={filingPage <= 1}
                onClick={() => setFilingPage(filingPage - 1)}
                className="p-1.5 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-cardSecondary disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: filingTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilingPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                    filingPage === p
                      ? 'bg-brand-500 text-white'
                      : 'border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-cardSecondary text-light-textPrimary dark:text-dark-textPrimary'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={filingPage >= filingTotalPages}
                onClick={() => setFilingPage(filingPage + 1)}
                className="p-1.5 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-cardSecondary disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgraded Advanced Tax Rule & Compliance Modal */}
      <TaxRuleModal
        isOpen={isTaxRuleModalOpen}
        onClose={() => {
          setIsTaxRuleModalOpen(false);
          setEditingTax(null);
        }}
        onSuccess={() => {
          fetchTaxes();
          if (mainView === 'filings') fetchFilings();
        }}
        editingTax={editingTax}
        defaultTaxGroup={activeTab !== 'All Taxes' ? activeTab : ''}
      />

      {/* Extend Deadline Modal */}
      {selectedFilingForExtension && (
        <ExtendDeadlineModal
          filing={selectedFilingForExtension}
          isOpen={!!selectedFilingForExtension}
          onClose={() => setSelectedFilingForExtension(null)}
          onSuccess={() => {
            fetchFilings();
          }}
        />
      )}

      {/* Reconciliation Modal */}
      {selectedFilingForRecon && (
        <ReconciliationModal
          filing={selectedFilingForRecon}
          isOpen={!!selectedFilingForRecon}
          onClose={() => setSelectedFilingForRecon(null)}
          onSuccess={() => {
            fetchFilings();
          }}
        />
      )}
    </div>
  );
};
