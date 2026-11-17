import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Upload, Download, Trash2, Search, FileText, FileSpreadsheet, File, FolderLock, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export const DocumentMasterPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    clientId: '',
    categoryId: '',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, cRes, clRes] = await Promise.all([
        api.get(`/documents?search=${encodeURIComponent(search)}`),
        api.get('/document-categories'),
        api.get('/clients?limit=50'),
      ]);
      if (dRes.data?.data) setDocuments(dRes.data.data.documents || []);
      if (cRes.data?.data) setCategories(cRes.data.data || []);
      if (clRes.data?.data) setClients(clRes.data.data.clients || []);
    } catch (e) {
      // Fallback sample data
      setDocuments([
        { _id: '1', originalName: 'Certificate_of_Incorporation.pdf', fileSize: 1048576, mimeType: 'application/pdf', createdAt: new Date().toISOString(), categoryId: { name: 'Registration Certificates' }, clientId: { businessName: 'XYZ Pvt Ltd' } },
        { _id: '2', originalName: 'GSTR1_Oct_Sales_Invoices.xlsx', fileSize: 2097152, mimeType: 'application/vnd.ms-excel', createdAt: new Date().toISOString(), categoryId: { name: 'Sales & Purchase Invoices' }, clientId: { businessName: 'ABC Traders' } },
      ]);
      setCategories([
        { _id: 'c1', name: 'Registration Certificates', code: 'REG_CERT' },
        { _id: 'c2', name: 'Sales & Purchase Invoices', code: 'INV_SALES' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please choose a file to upload');
      return;
    }

    const data = new FormData();
    data.append('file', selectedFile);
    if (uploadData.clientId) data.append('clientId', uploadData.clientId);
    if (uploadData.categoryId) data.append('categoryId', uploadData.categoryId);
    if (uploadData.description) data.append('description', uploadData.description);

    try {
      await api.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded to vault successfully');
      setIsUploadOpen(false);
      setSelectedFile(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this document?')) {
      try {
        await api.delete(`/documents/${id}`);
        toast.success('Document deleted');
        loadData();
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime?.includes('pdf')) return <FileText className="w-4 h-4 text-status-red" />;
    if (mime?.includes('excel') || mime?.includes('sheet')) return <FileSpreadsheet className="w-4 h-4 text-status-green" />;
    return <File className="w-4 h-4 text-brand-500" />;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-brand-500 mb-1 flex items-center gap-1.5">
            <NavLink to="/dashboard" className="hover:underline flex items-center gap-0.5">
              <span>«</span> Master Management
            </NavLink>
            <span className="text-light-textMuted dark:text-dark-textMuted">&gt;</span>
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Document Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Document Master
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Centralized document vault with role-based access and category management
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="p-4 border-b border-light-border dark:border-dark-border flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-light-textMuted dark:text-dark-textMuted" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {getFileIcon(doc.mimeType)}
                      <span className="font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                        {doc.originalName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary font-semibold">
                    {doc.categoryId?.name || 'General'}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {doc.clientId?.businessName || doc.clientId?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <a
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/documents/${doc._id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded text-light-textSecondary hover:text-brand-500 hover:bg-light-bg"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 rounded text-light-textSecondary hover:text-status-red hover:bg-light-bg"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary">
                Upload New Document
              </h3>
              <button onClick={() => setIsUploadOpen(false)}>
                <X className="w-4 h-4 text-light-textMuted" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Client</label>
                <select
                  value={uploadData.clientId}
                  onChange={(e) => setUploadData({ ...uploadData, clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                >
                  <option value="">Optional: Select Client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>{c.businessName || c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={uploadData.categoryId}
                  onChange={(e) => setUploadData({ ...uploadData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                >
                  <option value="">Optional: Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-light-border dark:border-dark-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white font-bold"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
