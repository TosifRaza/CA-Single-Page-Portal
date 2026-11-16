import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Search, IndianRupee, CreditCard, CheckCircle2, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { PaymentItem, ClientItem } from '../../types';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [summary, setSummary] = useState({ totalBilled: 0, totalCollected: 0, pendingAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    invoiceNumber: '',
    amount: 5000,
    paidAmount: 5000,
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    reference: '',
    notes: '',
  });

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        api.get(`/payments?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        api.get('/clients?limit=50'),
      ]);

      if (pRes.data?.data) {
        setPayments(pRes.data.data.payments);
        if (pRes.data.data.summary) setSummary(pRes.data.data.summary);
      }
      if (cRes.data?.data) {
        setClients(cRes.data.data.clients);
        if (cRes.data.data.clients.length > 0 && !formData.clientId) {
          setFormData((prev) => ({ ...prev, clientId: cRes.data.data.clients[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter, search]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payments', formData);
      toast.success('Payment recorded successfully');
      setIsModalOpen(false);
      loadPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error recording payment');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Payments & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Manage practice fee invoices, record collections and track outstanding balances
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark">
          <span className="text-xs font-semibold text-light-textSecondary dark:text-dark-textSecondary">
            Total Billed Fees
          </span>
          <div className="text-2xl font-extrabold text-light-textPrimary dark:text-dark-textPrimary mt-1">
            ₹{summary.totalBilled.toLocaleString()}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark">
          <span className="text-xs font-semibold text-status-green">
            Total Collections
          </span>
          <div className="text-2xl font-extrabold text-status-green mt-1">
            ₹{summary.totalCollected.toLocaleString()}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark">
          <span className="text-xs font-semibold text-status-orange">
            Outstanding Receivables
          </span>
          <div className="text-2xl font-extrabold text-status-orange mt-1">
            ₹{summary.pendingAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-light-border dark:border-dark-border">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-light-textMuted" />
            <input
              type="text"
              placeholder="Search reference, invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4">Payment Code</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {payments.map((p: any) => (
                <tr key={p._id} className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50">
                  <td className="py-3 px-4 font-mono font-semibold text-brand-500">{p.paymentCode}</td>
                  <td className="py-3 px-4 font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                    {p.clientId?.businessName || p.clientId?.name || 'Client'}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {p.invoiceNumber || '-'}
                  </td>
                  <td className="py-3 px-4 font-bold text-light-textPrimary dark:text-dark-textPrimary">
                    ₹{p.amount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-status-green">
                    ₹{p.paidAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary font-semibold">
                    {p.paymentMethod}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        p.status === 'Paid'
                          ? 'bg-status-greenLight text-status-green'
                          : p.status === 'Partial'
                          ? 'bg-status-orangeLight text-status-orange'
                          : 'bg-status-redLight text-status-red'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary">
                Record Payment
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-light-textMuted" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                >
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>{c.businessName || c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Total Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reference / UTR / Cheque No</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-98213749"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border font-mono"
                />
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
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
