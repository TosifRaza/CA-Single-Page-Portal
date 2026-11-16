import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { TaxFilingItem } from '../../types';

interface ReconciliationModalProps {
  filing: TaxFilingItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  filing,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reconciliationStatus, setReconciliationStatus] = useState(
    filing.reconciliationStatus || 'Pending'
  );
  const [reconciliationType, setReconciliationType] = useState(
    filing.reconciliationType || 'GSTR-2B vs Purchase Register'
  );
  const [amountAsPerBooks, setAmountAsPerBooks] = useState<number | string>(
    filing.amountAsPerBooks || 0
  );
  const [amountAsPerStatement, setAmountAsPerStatement] = useState<number | string>(
    filing.amountAsPerStatement || 0
  );
  const [reconciledBy, setReconciledBy] = useState(filing.reconciledBy || 'Tosif Raza');
  const [reconciliationRemarks, setReconciliationRemarks] = useState(
    filing.reconciliationRemarks || ''
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const booksVal = parseFloat(String(amountAsPerBooks)) || 0;
  const stmtVal = parseFloat(String(amountAsPerStatement)) || 0;
  const difference = Math.round((booksVal - stmtVal) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.patch(`/tax-filings/${filing._id}/reconciliation`, {
        reconciliationStatus,
        reconciliationType,
        amountAsPerBooks: booksVal,
        amountAsPerStatement: stmtVal,
        reconciledBy,
        reconciliationRemarks,
        reconciliationCompletionDate:
          reconciliationStatus === 'Reconciled' ? new Date().toISOString() : undefined,
      });
      toast.success('Reconciliation updated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update reconciliation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-status-green/10 text-status-green">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-light-textPrimary dark:text-dark-textPrimary">
                Update Tax Reconciliation
              </h3>
              <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                Books vs Portal Statement matching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-light-textMuted hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
              Reconciliation Type
            </label>
            <select
              value={reconciliationType}
              onChange={(e) => setReconciliationType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="GSTR-2B vs Purchase Register">GSTR-2B vs Purchase Register</option>
              <option value="GSTR-1 vs Sales Register">GSTR-1 vs Sales Register</option>
              <option value="Books vs Filed Return">Books vs Filed Return</option>
              <option value="TDS vs Form 26AS">TDS vs Form 26AS</option>
              <option value="Bank Reconciliation">Bank Reconciliation</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
              Reconciliation Status
            </label>
            <select
              value={reconciliationStatus}
              onChange={(e) => setReconciliationStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Reconciled">Reconciled</option>
              <option value="Mismatch">Mismatch</option>
              <option value="Under Review">Under Review</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                Amount in Books (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={amountAsPerBooks}
                onChange={(e) => setAmountAsPerBooks(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                Amount in Portal (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={amountAsPerStatement}
                onChange={(e) => setAmountAsPerStatement(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          {/* Difference Banner */}
          <div className="p-3 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border flex items-center justify-between">
            <span className="font-semibold text-light-textSecondary dark:text-dark-textSecondary">
              Difference (Books − Portal):
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono font-bold ${
                  difference === 0 ? 'text-status-green' : 'text-status-red'
                }`}
              >
                ₹ {difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              {difference === 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-greenLight dark:bg-status-green/20 text-status-green">
                  Matched
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-redLight dark:bg-status-red/20 text-status-red">
                  Mismatch
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
              Reconciled By
            </label>
            <input
              type="text"
              value={reconciledBy}
              onChange={(e) => setReconciledBy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
              Reconciliation Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Explaining any pending supplier invoices or credit notes..."
              value={reconciliationRemarks}
              onChange={(e) => setReconciliationRemarks(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-light-border dark:border-dark-border text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-cardSecondary font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Reconciliation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
