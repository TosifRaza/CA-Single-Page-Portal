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
  Clock,
  RefreshCw,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { TaxMasterItem, TaxFilingItem } from '../../types';
import { TaxRuleModal } from '../../components/tax/TaxRuleModal';
import { ExtendDeadlineModal } from '../../components/tax/ExtendDeadlineModal';
import { ReconciliationModal } from '../../components/tax/ReconciliationModal';

const EXPECTED_FILING_PERIODS: Record<string, number> = {
  Monthly: 12,
  Quarterly: 4,
  'Half-Yearly': 2,
  Yearly: 1,
  'One Time': 1,
};

const getFinancialYearMonths = (financialYear?: string) => {
  const startYear = Number(financialYear?.match(/\d{4}/)?.[0]) || new Date().getFullYear();

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(startYear, index + 3, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });

    return { key, label };
  });
};

const countConfiguredSchedulePeriods = (
  periods: NonNullable<TaxMasterItem['filingSchedule']>,
  frequency: string
) => {
  const configuredPeriods = periods.filter(
    (period) => Boolean(period.periodFrom && period.periodTo && period.filingDate)
  );

  return frequency === 'Monthly'
    ? new Set(configuredPeriods.map((period) => period.periodFrom.slice(0, 7))).size
    : configuredPeriods.length;
};

export const TaxMasterPage: React.FC = () => {
  // Main View: 'rules' or 'filings'
  const [mainView] = useState<'rules' | 'filings'>('rules');

  // --- Tax Rules State ---
  const [taxes, setTaxes] = useState<TaxMasterItem[]>([]);
  const [loadingTaxes, setLoadingTaxes] = useState(true);
  const [activeTab] = useState('All Taxes');
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
  const [selectedTaxSchedule, setSelectedTaxSchedule] = useState<TaxMasterItem | null>(null);
  const [scheduleClientFilings, setScheduleClientFilings] = useState<TaxFilingItem[]>([]);
  const [loadingScheduleClientFilings, setLoadingScheduleClientFilings] = useState(false);
  const [scheduleClientFilingsError, setScheduleClientFilingsError] = useState('');

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

  const openTaxSchedule = async (tax: TaxMasterItem) => {
    setSelectedTaxSchedule(tax);
    setScheduleClientFilings([]);
    setScheduleClientFilingsError('');
    setLoadingScheduleClientFilings(true);

    try {
      const firstPage = await api.get('/tax-filings', {
        params: { taxRuleId: tax._id, page: 1, limit: 100 },
      });
      const firstData = firstPage.data?.data;
      const pages = firstData?.pagination?.pages || 1;
      const allFilings: TaxFilingItem[] = firstData?.filings || [];

      if (pages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: pages - 1 }, (_, index) =>
            api.get('/tax-filings', {
              params: { taxRuleId: tax._id, page: index + 2, limit: 100 },
            })
          )
        );
        remainingPages.forEach((response) => {
          allFilings.push(...(response.data?.data?.filings || []));
        });
      }

      setScheduleClientFilings(allFilings);
    } catch (err: any) {
      setScheduleClientFilingsError(
        err.response?.data?.message || 'Could not load client submission and reconciliation dates.'
      );
    } finally {
      setLoadingScheduleClientFilings(false);
    }
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

  const selectedTaxScheduleRows: NonNullable<TaxMasterItem['filingSchedule']> = selectedTaxSchedule
    ? selectedTaxSchedule.filingSchedule?.length
      ? selectedTaxSchedule.filingSchedule
      : selectedTaxSchedule.periodFrom ||
          selectedTaxSchedule.periodTo ||
          selectedTaxSchedule.originalDueDate
        ? [
            {
              periodFrom: selectedTaxSchedule.periodFrom || '',
              periodTo: selectedTaxSchedule.periodTo || '',
              filingDate: selectedTaxSchedule.originalDueDate || '',
              extendedDate: selectedTaxSchedule.extendedDueDate,
            },
          ]
        : []
    : [];

  const selectedTaxFrequency = selectedTaxSchedule
    ? selectedTaxSchedule.frequency || selectedTaxSchedule.filingFrequency || 'Monthly'
    : '';
  const expectedSelectedSchedulePeriods = EXPECTED_FILING_PERIODS[selectedTaxFrequency] || 0;
  const configuredSelectedSchedulePeriods = countConfiguredSchedulePeriods(
    selectedTaxScheduleRows,
    selectedTaxFrequency
  );
  const missingMonthlyPeriods =
    selectedTaxFrequency === 'Monthly'
      ? getFinancialYearMonths(selectedTaxSchedule?.applicableFinancialYear).filter((month) =>
          !selectedTaxScheduleRows.some(
            (period) =>
              period.periodFrom &&
              period.periodTo &&
              period.filingDate &&
              period.periodFrom.slice(0, 7) === month.key
          )
        )
      : [];
  const remainingSelectedSchedulePeriods = Math.max(
    0,
    expectedSelectedSchedulePeriods - configuredSelectedSchedulePeriods
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Tax Master & Compliance
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
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
                  <th className="py-3 px-3.5 font-semibold">Filing Dates</th>
                  <th className="py-3 px-3.5 font-semibold">Status</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
                {loadingTaxes ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-light-textMuted dark:text-dark-textMuted font-medium">
                      Loading tax rules...
                    </td>
                  </tr>
                ) : taxes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-light-textMuted dark:text-dark-textMuted font-medium">
                      No tax rules found. Click "+ Add Tax Rule" to create one.
                    </td>
                  </tr>
                ) : (
                  taxes.map((tax) => {
                    const taxFrequency = tax.frequency || tax.filingFrequency || 'Monthly';
                    const taxScheduleRows: NonNullable<TaxMasterItem['filingSchedule']> = tax.filingSchedule?.length
                      ? tax.filingSchedule
                      : tax.periodFrom || tax.periodTo || tax.originalDueDate
                        ? [{
                            periodFrom: tax.periodFrom || '',
                            periodTo: tax.periodTo || '',
                            filingDate: tax.originalDueDate || '',
                          }]
                        : [];
                    const scheduleCount = taxScheduleRows.length;
                    const configuredScheduleCount = countConfiguredSchedulePeriods(
                      taxScheduleRows,
                      taxFrequency
                    );
                    const expectedScheduleCount = EXPECTED_FILING_PERIODS[taxFrequency] || 0;
                    const remainingScheduleCount = Math.max(
                      0,
                      expectedScheduleCount - configuredScheduleCount
                    );

                  return (
                    <tr
                      key={tax._id}
                      className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-light-textMuted dark:text-dark-textMuted whitespace-nowrap">
                        {tax.taxId}
                      </td>
                      <td className="py-3 px-3.5 font-normal text-light-textPrimary dark:text-dark-textPrimary whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[12px] font-normal bg-light-bg dark:bg-dark-cardSecondary border border-light-border dark:border-dark-border">
                          {tax.taxGroup}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-normal text-light-textPrimary dark:text-dark-textPrimary">
                          {tax.taxName}
                        </div>
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
                        {taxFrequency}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <button
                            type="button"
                            onClick={() => openTaxSchedule(tax)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 font-semibold text-brand-600 transition-colors hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Show Dates
                            <span className="text-[11px] opacity-75">({scheduleCount})</span>
                          </button>
                          {remainingScheduleCount > 0 && (
                            <span className="text-[11px] leading-tight text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="mr-1 inline h-3 w-3" />
                              {configuredScheduleCount}/{expectedScheduleCount} set · {remainingScheduleCount} due
                            </span>
                          )}
                        </div>
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

      {selectedTaxSchedule && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-5">
          <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-light-border bg-white shadow-2xl dark:border-dark-border dark:bg-dark-card">
            <div className="flex items-start justify-between gap-4 border-b border-light-border px-5 py-4 dark:border-dark-border sm:px-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-normal text-light-textPrimary dark:text-dark-textPrimary">
                    Filing Schedule Dates
                  </h2>
                  <p className="mt-0.5 text-xs font-normal text-light-textSecondary dark:text-dark-textSecondary">
                    {selectedTaxSchedule.taxName} ·{' '}
                    {selectedTaxSchedule.frequency || selectedTaxSchedule.filingFrequency || 'Monthly'}
                    {selectedTaxSchedule.applicableFinancialYear
                      ? ` · FY ${selectedTaxSchedule.applicableFinancialYear}`
                      : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaxSchedule(null)}
                aria-label="Close filing schedule dates"
                className="rounded-lg p-1.5 text-light-textMuted transition-colors hover:bg-light-bg hover:text-light-textPrimary dark:hover:bg-dark-cardSecondary dark:hover:text-dark-textPrimary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6">
              {remainingSelectedSchedulePeriods > 0 && expectedSelectedSchedulePeriods > 0 && (
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm">
                        {configuredSelectedSchedulePeriods} of {expectedSelectedSchedulePeriods}{' '}
                        {selectedTaxFrequency.toLowerCase()} filing periods have dates; {remainingSelectedSchedulePeriods} still need dates.
                      </p>
                      {missingMonthlyPeriods.length > 0 && (
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                          Dates due for: {missingMonthlyPeriods.map((month) => month.label).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const taxToEdit = selectedTaxSchedule;
                      if (!taxToEdit) return;
                      setSelectedTaxSchedule(null);
                      openEditModal(taxToEdit);
                    }}
                    className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs text-white transition-colors hover:bg-amber-700"
                  >
                    Fill remaining dates
                  </button>
                </div>
              )}

              {selectedTaxScheduleRows.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-light-border dark:border-dark-border">
                  <table className="w-full table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[15%]" />
                      <col className="w-[25%]" />
                      <col className="w-[14%]" />
                      <col className="w-[14%]" />
                      <col className="w-[17%]" />
                      <col className="w-[15%]" />
                    </colgroup>
                    <thead className="bg-light-bg/60 text-xs font-normal text-light-textSecondary dark:bg-dark-cardSecondary/60 dark:text-dark-textSecondary">
                      <tr>
                        <th className="break-words px-2 py-3 sm:px-3">Period</th>
                        <th className="break-words px-2 py-3 sm:px-3">Reporting Period</th>
                        <th className="break-words px-2 py-3 sm:px-3">Filing Date</th>
                        <th className="break-words px-2 py-3 sm:px-3">Submission Date</th>
                        <th className="break-words px-2 py-3 sm:px-3">Reconciliation Date</th>
                        <th className="break-words px-2 py-3 sm:px-3">Extended Due Date / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border/70 dark:divide-dark-border/70">
                      {selectedTaxScheduleRows.map((period, index) => {
                        const periodFrom = period.periodFrom
                          ? formatDate(period.periodFrom)
                          : '—';
                        const periodTo = period.periodTo ? formatDate(period.periodTo) : '—';
                        const isMonthly =
                          (selectedTaxSchedule.frequency || selectedTaxSchedule.filingFrequency) ===
                          'Monthly';
                        const periodLabel =
                          isMonthly && period.periodFrom
                            ? new Date(`${period.periodFrom.slice(0, 10)}T00:00:00`).toLocaleDateString(
                                'en-IN',
                                { month: 'long', year: 'numeric' }
                              )
                            : `Period ${index + 1}`;
                        const periodClientFilings = scheduleClientFilings.filter(
                          (filing) =>
                            filing.periodFrom?.slice(0, 10) === period.periodFrom?.slice(0, 10) &&
                            filing.periodTo?.slice(0, 10) === period.periodTo?.slice(0, 10)
                        );
                        const periodReconciliations = periodClientFilings.filter(
                          (filing) => filing.reconciliationRequired
                        );

                        return (
                          <tr
                            key={`${period.periodFrom}-${period.periodTo}-${index}`}
                            className="text-light-textPrimary dark:text-dark-textPrimary"
                          >
                            <td className="break-words px-2 py-3 font-normal sm:px-3">{periodLabel}</td>
                            <td className="break-words px-2 py-3 sm:px-3">{periodFrom} – {periodTo}</td>
                            <td className="break-words px-2 py-3 font-normal sm:px-3">
                              {period.filingDate ? formatDate(period.filingDate) : 'Not set'}
                            </td>

                            <td className="break-words px-2 py-3 text-xs sm:px-3">
                              {period.submissionDate ? (
                                <span className="font-medium">{formatDate(period.submissionDate)}</span>
                              ) : loadingScheduleClientFilings ? (
                                <span className="text-light-textMuted dark:text-dark-textMuted">Loading...</span>
                              ) : scheduleClientFilingsError ? (
                                <span className="text-status-red">Unavailable</span>
                              ) : periodClientFilings.length > 0 ? (
                                <div className="max-h-20 min-w-0 space-y-1 overflow-y-auto">
                                  {periodClientFilings.map((filing) => (
                                    <div key={filing._id} className="break-words">
                                      <span className="font-normal">
                                        {filing.clientId?.businessName || filing.clientId?.name || 'Client'}:
                                      </span>{' '}
                                      {filing.actualSubmissionDate
                                        ? formatDate(filing.actualSubmissionDate)
                                        : 'Not submitted'}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-light-textMuted dark:text-dark-textMuted">—</span>
                              )}
                            </td>
                            <td className="break-words px-2 py-3 text-xs sm:px-3">
                              {period.reconciliationDate ? (
                                <span className="font-medium">{formatDate(period.reconciliationDate)}</span>
                              ) : loadingScheduleClientFilings ? (
                                <span className="text-light-textMuted dark:text-dark-textMuted">Loading...</span>
                              ) : scheduleClientFilingsError ? (
                                <span className="text-status-red">Unavailable</span>
                              ) : periodReconciliations.length > 0 ? (
                                <div className="max-h-20 min-w-0 space-y-1 overflow-y-auto">
                                  {periodReconciliations.map((filing) => (
                                    <div key={filing._id} className="break-words">
                                      <span className="font-normal">
                                        {filing.clientId?.businessName || filing.clientId?.name || 'Client'}:
                                      </span>{' '}
                                      Start {filing.reconciliationStartDate
                                        ? formatDate(filing.reconciliationStartDate)
                                        : '—'}
                                      {' · '}Complete {filing.reconciliationCompletionDate
                                        ? formatDate(filing.reconciliationCompletionDate)
                                        : '—'}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-light-textMuted dark:text-dark-textMuted">—</span>
                              )}
                            </td>
                            <td className="break-words px-2 py-3 text-light-textSecondary dark:text-dark-textSecondary sm:px-3">
                              {period.extendedDate ? (
                                <div className="space-y-1">
                                  <div>{formatDate(period.extendedDate)}</div>
                                  {period.extensionReason && (
                                    <div className="text-xs text-light-textMuted dark:text-dark-textMuted">
                                      {period.extensionReason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-light-border px-5 py-12 text-center dark:border-dark-border">
                  <Calendar className="mx-auto mb-3 h-8 w-8 text-light-textMuted dark:text-dark-textMuted" />
                  <p className="font-normal text-light-textPrimary dark:text-dark-textPrimary">
                    No filing dates configured yet
                  </p>
                  <p className="mt-1 text-sm text-light-textSecondary dark:text-dark-textSecondary">
                    Edit this tax rule to add its filing schedule.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-light-border px-5 py-3 dark:border-dark-border sm:px-6">
              <span className="text-xs font-normal text-light-textSecondary dark:text-dark-textSecondary">
                {selectedTaxScheduleRows.length} filing period{selectedTaxScheduleRows.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedTaxSchedule(null)}
                className="rounded-xl border border-light-border px-4 py-2 text-sm font-normal text-light-textPrimary hover:bg-light-bg dark:border-dark-border dark:text-dark-textPrimary dark:hover:bg-dark-cardSecondary"
              >
                Close
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
