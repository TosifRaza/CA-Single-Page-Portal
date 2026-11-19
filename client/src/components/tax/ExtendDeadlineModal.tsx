import React, { useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { TaxFilingItem } from '../../types';

interface ExtendDeadlineModalProps {
  filing: TaxFilingItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExtendDeadlineModal: React.FC<ExtendDeadlineModalProps> = ({
  filing,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [extendedDueDate, setExtendedDueDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionReference, setExtensionReference] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentDueDate = filing.effectiveDueDate || filing.originalDueDate;
  const currentDueDateStr = new Date(currentDueDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendedDueDate) {
      toast.error('Please specify a new extended due date.');
      return;
    }
    if (!extensionReason || extensionReason.length < 3) {
      toast.error('Please provide a valid reason for the extension.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/tax-filings/${filing._id}/extend-deadline`, {
        extendedDueDate,
        extensionReason,
        extensionReference,
      });
      toast.success('Filing deadline extended successfully with audit record!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to extend deadline');
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
            <div className="p-2 rounded-xl bg-status-orange/10 text-status-orange">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-light-textPrimary dark:text-dark-textPrimary">
                Extend Filing Deadline
              </h3>
              <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                Preserves original due date in audit history
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
          {/* Current Due Date Banner */}
          <div className="p-3 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border flex items-center justify-between">
            <span className="text-light-textSecondary dark:text-dark-textSecondary font-medium">
              Current Due Date:
            </span>
            <span className="font-bold text-brand-500">{currentDueDateStr}</span>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
              New Extended Due Date *
            </label>
            <input
              type="date"
              required
              value={extendedDueDate}
              onChange={(e) => setExtendedDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
              Extension Reason / Justification *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Government notification extending GST portal filing window due to system maintenance"
              value={extensionReason}
              onChange={(e) => setExtensionReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
              Extension Reference / Notification Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. CBIC Notification No. 42/2026-CT"
              value={extensionReference}
              onChange={(e) => setExtensionReference(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          {/* Audit History Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-blue-400 text-[13px]">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              This change will be logged in the permanent compliance audit trail. The original statutory deadline ({currentDueDateStr}) will remain intact for reporting.
            </span>
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
              {loading ? 'Extending...' : 'Apply Extension'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
