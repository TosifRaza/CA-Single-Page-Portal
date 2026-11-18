import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

interface DocumentOption {
  _id: string;
  name: string;
  code?: string;
  createdAt?: string;
}

const toDocumentCode = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || 'DOCUMENT';

export const DocumentMasterPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [documentName, setDocumentName] = useState('');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/document-categories');
      setDocuments(response.data?.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not load document names');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleAddDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = documentName.trim();
    if (!name) {
      toast.error('Enter a document name.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/document-categories', { name, code: toDocumentCode(name) });
      toast.success('Document name added to the master list.');
      setDocumentName('');
      setIsAddOpen(false);
      await loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not add this document name');
    } finally {
      setSaving(false);
    }
  };

  const filteredDocuments = documents.filter((document) =>
    document.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand-500">
            <NavLink to="/dashboard" className="flex items-center gap-0.5 hover:underline">
              <span>Â«</span> Master Management
            </NavLink>
            <span className="text-light-textMuted dark:text-dark-textMuted">&gt;</span>
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Document Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Document Master
          </h1>
          <p className="mt-1 text-xs font-medium text-light-textSecondary dark:text-dark-textSecondary sm:text-sm">
            Add document names here, then select the required documents in Work Master.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-95 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Document Name</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-light-border bg-white shadow-card-light dark:border-dark-border dark:bg-dark-card dark:shadow-card-dark">
        <div className="flex items-center justify-between border-b border-light-border p-4 dark:border-dark-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-light-textMuted dark:text-dark-textMuted" />
            <input
              type="search"
              placeholder="Search document names..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-light-border bg-light-bg py-1.5 pl-9 pr-3 text-xs text-light-textPrimary focus:outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-textPrimary"
            />
          </div>
          <span className="ml-3 whitespace-nowrap text-xs font-semibold text-light-textMuted dark:text-dark-textMuted">
            {documents.length} document{documents.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-light-border bg-light-bg/40 text-[13px] font-semibold text-light-textSecondary dark:border-dark-border dark:bg-dark-cardSecondary/40 dark:text-dark-textSecondary">
                <th className="w-16 px-4 py-3">#</th>
                <th className="px-4 py-3">Document Name</th>
                <th className="px-4 py-3">Added Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 font-medium dark:divide-dark-border/60">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-light-textMuted dark:text-dark-textMuted">
                    Loading document names...
                  </td>
                </tr>
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((document, index) => (
                  <tr key={document._id} className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50">
                    <td className="px-4 py-3 text-light-textMuted dark:text-dark-textMuted">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                        <FileText className="h-4 w-4 text-brand-500" />
                        {document.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-light-textSecondary dark:text-dark-textSecondary">
                      {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-light-textMuted dark:text-dark-textMuted" />
                    <p className="font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                      {search ? 'No matching document names' : 'No document names added yet'}
                    </p>
                    <p className="mt-1 text-light-textMuted dark:text-dark-textMuted">
                      Add names such as PAN Card, GST Certificate, or Bank Statement.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-light-border bg-white p-6 shadow-2xl dark:border-dark-border dark:bg-dark-card">
            <div className="mb-4 flex items-center justify-between border-b border-light-border pb-3 dark:border-dark-border">
              <div>
                <h3 className="font-bold text-light-textPrimary dark:text-dark-textPrimary">Add Document Name</h3>
                <p className="mt-0.5 text-xs text-light-textMuted dark:text-dark-textMuted">
                  This name will be available in Work Master.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-light-textMuted hover:bg-light-bg dark:hover:bg-dark-cardSecondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                  Document Name *
                </label>
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={documentName}
                  onChange={(event) => setDocumentName(event.target.value)}
                  placeholder="e.g. PAN Card, GST Certificate"
                  className="w-full rounded-xl border border-light-border bg-light-bg px-3 py-2.5 text-light-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-dark-border dark:bg-dark-bg dark:text-dark-textPrimary"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-light-border pt-3 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border border-light-border px-4 py-2 font-semibold text-light-textSecondary dark:border-dark-border dark:text-dark-textSecondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-500 px-4 py-2 font-bold text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving ? 'Adding...' : 'Add Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
