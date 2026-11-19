import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  X,
  FileCheck2,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { ClientItem } from '../../types';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [search, setSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Client Details Modal
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (clientTypeFilter !== 'All') params.append('clientType', clientTypeFilter);
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await api.get(`/clients?${params.toString()}`);
      if (res.data?.data) {
        setClients(res.data.data.clients);
        setTotalPages(res.data.data.pagination.pages);
        setTotalCount(res.data.data.pagination.total);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, clientTypeFilter, page]);

  const viewClientDetails = async (client: ClientItem) => {
    setSelectedClient(client);
    try {
      const res = await api.get(`/clients/${client._id}`);
      if (res.data?.data) {
        setSelectedClient(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/clients/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'clients_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Clients report exported');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Clients Management
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Directory of all {totalCount} registered corporate and individual taxpayer clients
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <NavLink
            to="/masters/clients"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </NavLink>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs font-semibold text-light-textPrimary dark:text-dark-textPrimary shadow-sm hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
          >
            <Download className="w-4 h-4 text-status-green" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-light-border dark:border-dark-border bg-light-bg/30 dark:bg-dark-cardSecondary/30">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-light-textMuted dark:text-dark-textMuted" />
            <input
              type="text"
              placeholder="Search by name, business, PAN, mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-light-textMuted" />
            <select
              value={clientTypeFilter}
              onChange={(e) => {
                setClientTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
            >
              <option value="All">All Client Types</option>
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
              <option value="Company">Company</option>
              <option value="Partnership">Partnership</option>
              <option value="LLP">LLP</option>
            </select>
          </div>
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Client / Business</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">PAN Number</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {clients.map((c) => (
                <tr
                  key={c._id}
                  onClick={() => viewClientDetails(c)}
                  className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-semibold text-brand-500 font-mono">
                    {c.clientCode}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-light-textPrimary dark:text-dark-textPrimary">
                      {c.businessName || c.name}
                    </div>
                    {c.businessName && c.businessName !== c.name && (
                      <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary">
                        Prop: {c.name}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    <span className="px-2 py-0.5 rounded-full bg-light-border/50 dark:bg-dark-border/50 text-[12px] font-semibold">
                      {c.businessType || c.clientType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                    {c.pan}
                  </td>
                  <td className="py-3 px-4 font-mono text-light-textSecondary dark:text-dark-textSecondary">
                    {c.gstin || '-'}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    <div>{c.mobile}</div>
                    {c.email && <div className="text-[12px] text-light-textMuted">{c.email}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[13px] font-semibold bg-status-greenLight text-status-green">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewClientDetails(c);
                      }}
                      className="p-1 rounded text-light-textSecondary hover:text-brand-500 hover:bg-light-bg"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-light-border dark:border-dark-border text-xs text-light-textSecondary dark:text-dark-textSecondary font-medium">
          <div>
            Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, totalCount)} of {totalCount} clients
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

      {/* Client 360 Detail Drawer/Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border">
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-light-border dark:border-dark-border">
              <div>
                <span className="text-xs font-bold font-mono text-brand-500">
                  {selectedClient.client?.clientCode || selectedClient.clientCode}
                </span>
                <h2 className="text-xl font-bold text-light-textPrimary dark:text-dark-textPrimary mt-0.5">
                  {selectedClient.client?.businessName || selectedClient.businessName || selectedClient.name}
                </h2>
                <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary font-medium mt-1">
                  PAN: <span className="font-mono font-bold">{selectedClient.client?.pan || selectedClient.pan}</span>
                  {selectedClient.client?.gstin && (
                    <span className="ml-3">GSTIN: <span className="font-mono font-bold">{selectedClient.client.gstin}</span></span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 rounded-xl text-light-textMuted hover:bg-light-bg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profile Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl bg-light-bg dark:bg-dark-cardSecondary text-xs mb-5 font-medium">
              <div className="min-w-0">
                <span className="text-light-textMuted block text-[13px]">Primary Contact</span>
                <span className="font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                  {selectedClient.client?.contactPerson || selectedClient.contactPerson || selectedClient.name}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-light-textMuted block text-[13px]">Mobile</span>
                <span className="font-semibold">{selectedClient.client?.mobile || selectedClient.mobile}</span>
              </div>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <span className="text-light-textMuted block text-[13px]">Email</span>
                <span className="block min-w-0 break-all font-semibold">{selectedClient.client?.email || selectedClient.email || '-'}</span>
              </div>
            </div>

            {/* Active Works for this client */}
            {selectedClient.works && (
              <div className="mb-5">
                <h3 className="font-bold text-sm text-light-textPrimary dark:text-dark-textPrimary mb-2 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-brand-500" />
                  <span>Work & Filing History ({selectedClient.works.length})</span>
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
                  {selectedClient.works.map((w: any) => (
                    <div
                      key={w._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-light-bg/50 dark:bg-dark-cardSecondary/50 border border-light-border/60 dark:border-dark-border/60"
                    >
                      <div>
                        <span className="font-semibold">{w.workMasterId?.workName || 'Compliance Work'}</span>
                        <span className="text-light-textMuted ml-2">Due: {new Date(w.dueDate).toLocaleDateString()}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[12px] font-bold bg-brand-50 dark:bg-brand-500/20 text-brand-500">
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices/Payments */}
            {selectedClient.payments && (
              <div>
                <h3 className="font-bold text-sm text-light-textPrimary dark:text-dark-textPrimary mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-status-green" />
                  <span>Payments & Invoices ({selectedClient.payments.length})</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {selectedClient.payments.map((p: any) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-light-bg/50 dark:bg-dark-cardSecondary/50 border border-light-border/60 dark:border-dark-border/60"
                    >
                      <div>
                        <span className="font-mono font-semibold">{p.paymentCode}</span>
                        <span className="text-light-textMuted ml-2">{p.paymentMethod}</span>
                      </div>
                      <div className="font-bold text-status-green">
                        ₹{p.amount?.toLocaleString()} ({p.status})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
