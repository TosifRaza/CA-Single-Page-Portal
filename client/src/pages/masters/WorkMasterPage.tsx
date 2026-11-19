import React, { useState, useEffect, useRef } from 'react';
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
  Calendar,
  CheckCircle2,
  FileText,
  AlertCircle,
  Users,
  Briefcase,
  Building,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { WorkMasterItem, TaxMasterItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const WorkMasterPage: React.FC = () => {
  const { user } = useAuth();
  const canDeleteAssignments = ['Super Admin', 'CA Admin'].includes(user?.role || '');
  const [works, setWorks] = useState<WorkMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Available Tax Masters for dropdown
  const [availableTaxes, setAvailableTaxes] = useState<TaxMasterItem[]>([]);
  const [loadingTaxes, setLoadingTaxes] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<{ _id: string; name: string }[]>([]);
  const [documentToAdd, setDocumentToAdd] = useState('');
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [uploadingRequiredDocument, setUploadingRequiredDocument] = useState(false);
  const requiredDocumentFileInputRef = useRef<HTMLInputElement>(null);

  // Assignments Modal State (View employees assigned to this work)
  const [selectedWorkForAssignments, setSelectedWorkForAssignments] = useState<WorkMasterItem | null>(null);
  const [isAssignmentsModalOpen, setIsAssignmentsModalOpen] = useState(false);
  const [loadingWorkAssignments, setLoadingWorkAssignments] = useState(false);
  const [workAssignmentsList, setWorkAssignmentsList] = useState<any[]>([]);
  const [employeeSummaries, setEmployeeSummaries] = useState<any[]>([]);
  const [totalWorkAssignmentsCount, setTotalWorkAssignmentsCount] = useState(0);
  const [assignmentsViewMode, setAssignmentsViewMode] = useState<'employeeGrouped' | 'allList'>('employeeGrouped');

  // Quick Assign form state inside assignments modal
  const [showQuickAssignForm, setShowQuickAssignForm] = useState(false);
  const [allEmployeesList, setAllEmployeesList] = useState<any[]>([]);
  const [allClientsList, setAllClientsList] = useState<any[]>([]);
  const [submittingQuickAssign, setSubmittingQuickAssign] = useState(false);
  const [quickAssignData, setQuickAssignData] = useState({
    employeeId: '',
    clientId: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    remarks: '',
  });

  const loadDropdownEmployeesAndClients = async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        api.get('/employees?limit=100'),
        api.get('/clients?limit=100'),
      ]);
      if (eRes.data?.data?.employees) setAllEmployeesList(eRes.data.data.employees);
      if (cRes.data?.data?.clients) setAllClientsList(cRes.data.data.clients);
    } catch (e) {
      console.error('Error loading employees/clients dropdown:', e);
    }
  };

  const handleOpenWorkAssignments = async (work: WorkMasterItem) => {
    setSelectedWorkForAssignments(work);
    setIsAssignmentsModalOpen(true);
    setShowQuickAssignForm(false);
    setLoadingWorkAssignments(true);
    loadDropdownEmployeesAndClients();

    try {
      const res = await api.get(`/work-masters/${work._id}/assignments`);
      if (res.data) {
        setWorkAssignmentsList(res.data.data || []);
        setEmployeeSummaries(res.data.employeeSummary || []);
        setTotalWorkAssignmentsCount(res.data.totalAssignments || 0);
      }
    } catch (err) {
      console.error('Failed to load work assignments:', err);
      toast.error('Could not load assigned team');
    } finally {
      setLoadingWorkAssignments(false);
    }
  };

  const handleDeleteWorkAssignment = async (assignmentId: string, workCode: string) => {
    if (!selectedWorkForAssignments || !canDeleteAssignments) return;
    if (!window.confirm(`Delete assignment ${workCode}? This cannot be undone.`)) return;

    try {
      await api.delete(`/work-assignments/${assignmentId}`);
      const response = await api.get(
        `/work-masters/${selectedWorkForAssignments._id}/assignments`
      );
      setWorkAssignmentsList(response.data?.data || []);
      setEmployeeSummaries(response.data?.employeeSummary || []);
      setTotalWorkAssignmentsCount(response.data?.totalAssignments || 0);
      toast.success(`Assignment ${workCode} deleted.`);
      fetchWorks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not delete this assignment');
    }
  };

  const handleOpenQuickAssign = (work: WorkMasterItem) => {
    if (availableTaxes.length === 0) {
      toast.error('Cannot assign work: Tax Master & Compliance has 0 active taxes. Work assignment strictly depends on active taxes.');
      return;
    }
    setSelectedWorkForAssignments(work);
    setIsAssignmentsModalOpen(true);
    setShowQuickAssignForm(true);
    loadDropdownEmployeesAndClients();
    setQuickAssignData({
      employeeId: allEmployeesList[0]?._id || '',
      clientId: allClientsList[0]?._id || '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: work.defaultPriority || 'Medium',
      remarks: '',
    });
  };

  const handleQuickAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkForAssignments) return;
    if (!quickAssignData.employeeId || !quickAssignData.clientId) {
      toast.error('Please select both an Employee and a Client');
      return;
    }

    try {
      setSubmittingQuickAssign(true);
      await api.post(`/work-masters/${selectedWorkForAssignments._id}/assign`, quickAssignData);
      toast.success('Work template assigned successfully');
      setShowQuickAssignForm(false);

      // Re-fetch assignments
      const res = await api.get(`/work-masters/${selectedWorkForAssignments._id}/assignments`);
      if (res.data) {
        setWorkAssignmentsList(res.data.data || []);
        setEmployeeSummaries(res.data.employeeSummary || []);
        setTotalWorkAssignmentsCount(res.data.totalAssignments || 0);
      }
      // Re-fetch parent works list
      fetchWorks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign work');
    } finally {
      setSubmittingQuickAssign(false);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkMasterItem | null>(null);
  const [isEditingTaxNotes, setIsEditingTaxNotes] = useState(false);
  const [taxNotesDraft, setTaxNotesDraft] = useState('');
  const [savingTaxNotes, setSavingTaxNotes] = useState(false);
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
    defaultDocuments: [] as string[],
    defaultDocumentFiles: [] as { documentName: string; documentId: string; fileName: string }[],
    status: 'Active' as 'Active' | 'Inactive' | 'Archived',
  });

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

  const fetchAvailableDocuments = async () => {
    try {
      const res = await api.get('/document-categories');
      setAvailableDocuments(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching required document names:', err);
      toast.error('Could not load Document Master names');
    }
  };

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
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
  }, [categoryFilter, statusFilter, search, page]);

  // Selected Tax details object
  const selectedTax = availableTaxes.find((t) => t._id === formData.taxId);
  const selectedTaxScheduleRows = selectedTax?.filingSchedule?.length
    ? selectedTax.filingSchedule
    : selectedTax &&
        (selectedTax.periodFrom || selectedTax.periodTo || selectedTax.originalDueDate)
      ? [
          {
            periodFrom: selectedTax.periodFrom || '',
            periodTo: selectedTax.periodTo || '',
            filingDate: selectedTax.originalDueDate || '',
            extendedDate: selectedTax.extendedDueDate,
            submissionDate: selectedTax.submissionDate,
            reconciliationDate: selectedTax.reconciliationDate,
          },
        ]
      : [];
  const selectedWorkTax =
    selectedWorkForAssignments &&
    (typeof selectedWorkForAssignments.taxId === 'object' && selectedWorkForAssignments.taxId
      ? (selectedWorkForAssignments.taxId as any)
      : availableTaxes.find((t) => t._id === selectedWorkForAssignments?.taxId));
  const selectedWorkRequiredDocuments = Array.from(
    new Set([
      ...(selectedWorkForAssignments?.defaultDocuments || []),
      ...(selectedWorkForAssignments?.defaultDocumentFiles || []).map((file) => file.documentName),
    ])
  );

  // When user selects a Tax Name
  const handleTaxSelect = (taxId: string) => {
    setIsEditingTaxNotes(false);
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

  const handleSaveTaxNotes = async () => {
    if (!selectedTax) return;

    try {
      setSavingTaxNotes(true);
      const response = await api.put(`/taxes/${selectedTax._id}`, {
        description: taxNotesDraft,
      });
      const savedTax = response.data?.data;
      const description = savedTax?.description ?? taxNotesDraft;
      setAvailableTaxes((taxes) =>
        taxes.map((tax) =>
          tax._id === selectedTax._id ? { ...tax, ...savedTax, description } : tax
        )
      );
      setTaxNotesDraft(description);
      setIsEditingTaxNotes(false);
      toast.success('Regulatory notes updated.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Could not update regulatory notes.');
    } finally {
      setSavingTaxNotes(false);
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

  const handleRemoveRequiredDocument = (documentName: string) => {
    setFormData((prev) => ({
      ...prev,
      defaultDocuments: prev.defaultDocuments.filter((name) => name !== documentName),
      defaultDocumentFiles: prev.defaultDocumentFiles.filter(
        (file) => file.documentName !== documentName
      ),
    }));
  };

  const handleUploadRequiredDocument = async (selectedFile?: File) => {
    const selectedDocument = availableDocuments.find((document) => document.name === documentToAdd);
    const fileToUpload = selectedFile || selectedDocumentFile;
    if (!selectedDocument || !fileToUpload) {
      toast.error('Select a document name and choose a file to upload.');
      return;
    }

    const uploadPayload = new FormData();
    uploadPayload.append('file', fileToUpload);
    uploadPayload.append('categoryId', selectedDocument._id);
    uploadPayload.append('description', `Work Master required document: ${selectedDocument.name}`);

    try {
      setUploadingRequiredDocument(true);
      const response = await api.post('/documents/upload', uploadPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedFile = response.data?.data;
      if (!uploadedFile?._id) {
        throw new Error('Upload response did not include a document record.');
      }

      setFormData((prev) => ({
        ...prev,
        defaultDocuments: prev.defaultDocuments.includes(selectedDocument.name)
          ? prev.defaultDocuments
          : [...prev.defaultDocuments, selectedDocument.name],
        defaultDocumentFiles: [
          ...prev.defaultDocumentFiles.filter(
            (file) => file.documentName !== selectedDocument.name
          ),
          {
            documentName: selectedDocument.name,
            documentId: uploadedFile._id,
            fileName: uploadedFile.originalName || fileToUpload.name,
          },
        ],
      }));
      setDocumentToAdd('');
      setSelectedDocumentFile(null);
      toast.success(`${selectedDocument.name} uploaded and added to this work.`);
    } catch (error: any) {
      setSelectedDocumentFile(null);
      if (requiredDocumentFileInputRef.current) {
        requiredDocumentFileInputRef.current.value = '';
      }
      toast.error(error.response?.data?.message || error.message || 'Document upload failed');
    } finally {
      setUploadingRequiredDocument(false);
    }
  };

  const handleOpenRequiredDocument = async (file: {
    documentName: string;
    documentId: string;
    fileName: string;
  }) => {
    const previewWindow = window.open('', '_blank');
    try {
      const response = await api.get(`/documents/${file.documentId}/download`, {
        responseType: 'blob',
      });
      const fileUrl = URL.createObjectURL(response.data);
      if (previewWindow) {
        previewWindow.location.href = fileUrl;
      } else {
        const link = window.document.createElement('a');
        link.href = fileUrl;
        link.download = file.fileName || file.documentName;
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } catch (error: any) {
      previewWindow?.close();
      toast.error(error.response?.data?.message || 'Could not open this document');
    }
  };

  const openCreateModal = () => {
    setEditingWork(null);
    setIsEditingTaxNotes(false);
    setNewChecklistItem('');
    setDocumentToAdd('');
    setSelectedDocumentFile(null);
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
      defaultDocuments: [],
      defaultDocumentFiles: [],
      status: 'Active',
    });
    fetchAvailableTaxes();
    fetchAvailableDocuments();
    setIsModalOpen(true);
  };

  const openEditModal = (work: WorkMasterItem) => {
    setEditingWork(work);
    setIsEditingTaxNotes(false);
    setNewChecklistItem('');
    setDocumentToAdd('');
    setSelectedDocumentFile(null);
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
      defaultDocuments: work.defaultDocuments || [],
      defaultDocumentFiles: work.defaultDocumentFiles || [],
      status: work.status || 'Active',
    });
    fetchAvailableTaxes();
    fetchAvailableDocuments();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Work Master
          </h1>
        </div>

        <button
          onClick={() => {
            if (availableTaxes.length === 0) {
              toast.error('Cannot add work template: Tax Master has 0 taxes. Please add a Tax in Tax Master first.');
              return;
            }
            openCreateModal();
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto ${
            availableTaxes.length === 0
              ? 'bg-gray-400 dark:bg-gray-700 text-gray-200 cursor-not-allowed opacity-75'
              : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20 active:scale-95'
          }`}
          title={availableTaxes.length === 0 ? 'Tax Master is empty. Please add a Tax first.' : 'Add New Work'}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Work</span>
        </button>
      </div>

      {/* Dependency Warning Banner when 0 Taxes configured in Tax Master */}
      {availableTaxes.length === 0 && !loadingTaxes && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Dependency Notice: Work Master strictly depends on Tax Master & Compliance
              </h4>
              <p className="text-[13px] text-amber-700 dark:text-amber-300">
                Currently 0 active Taxes are configured in Tax Master. You cannot create work templates or assign works until at least one Tax is added.
              </p>
            </div>
          </div>
          <NavLink
            to="/masters/tax"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 self-start sm:self-auto transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Go to Tax Master</span>
          </NavLink>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
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
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-semibold text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                <th className="py-3 px-4 font-semibold w-12">ID</th>
                <th className="py-3 px-4 font-semibold">Work Name</th>
                <th className="py-3 px-4 font-normal">Tax Name</th>
                <th className="py-3 px-4 font-normal">Tax Group</th>
                <th className="py-3 px-4 font-semibold">Timeline</th>
                <th className="py-3 px-4 font-semibold">Due Date Rule</th>
                <th className="py-3 px-4 font-semibold">Assigned Team</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-light-textMuted">
                    Loading work templates...
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-light-textMuted">
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
                      {/* Explicit Tax Name Column matching Tax Master */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {associatedTax?.taxName ? (
                          <span className="text-xs font-normal text-light-textPrimary dark:text-dark-textPrimary whitespace-nowrap">
                            {associatedTax.taxName}
                          </span>
                        ) : (
                          <span className="text-light-textMuted dark:text-dark-textMuted italic text-[13px]">
                            Not linked
                          </span>
                        )}
                      </td>
                      {/* Tax Group Column */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs font-normal text-light-textPrimary dark:text-dark-textPrimary">
                          {associatedTax?.taxGroup || work.category || 'GST'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary font-semibold whitespace-nowrap">
                        {work.timeline}
                      </td>
                      <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary text-[13px] whitespace-nowrap">
                        {associatedTax?.dueDateRule || '—'}
                      </td>

                      {/* Assigned Team & Client Allocations */}
                      <td className="py-3 px-4">
                        {(work.assignedEmployeesCount ?? 0) > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenWorkAssignments(work)}
                            className="inline-flex min-w-[132px] max-w-full items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[13px] font-normal bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 transition-all cursor-pointer group"
                            title="Click to view assigned employees and clients"
                          >
                            <Users className="w-3.5 h-3.5 text-purple-500" />
                            <span className="flex min-w-0 flex-col items-start gap-0.5 leading-tight whitespace-nowrap">
                              {work.assignedEmployeesCount}{' '}
                              {work.assignedEmployeesCount === 1 ? 'Employee' : 'Employees'}
                              <span className="text-[11px] opacity-75">
                                {work.totalAssignmentsCount} {work.totalAssignmentsCount === 1 ? 'task' : 'tasks'}
                              </span>
                            </span>
                            <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-light-textMuted dark:text-dark-textMuted italic text-[13px]">
                              Unassigned
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenQuickAssign(work)}
                              className="text-[12px] text-brand-500 hover:underline font-semibold"
                            >
                              + Assign
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ${
                            work.status === 'Active'
                              ? 'bg-status-greenLight dark:bg-status-green/20 text-status-green'
                              : 'bg-light-border dark:bg-dark-border text-light-textMuted'
                          }`}
                        >
                          {work.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenWorkAssignments(work)}
                            className="p-1.5 rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                            title="View Assigned Team & Clients"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(work)}
                            className="p-1.5 rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:text-brand-500 hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
                            title="Edit Work"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(work._id)}
                            className="p-1.5 rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:text-status-red hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-7xl max-h-[94vh] flex flex-col bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40">
              <div>
                <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-500" />
                  <span>{editingWork ? 'Edit Work Template' : 'Add New Work Template'}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-light-textMuted hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="workMasterForm" onSubmit={handleSubmit} className="flex-1 min-h-0 p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Warning if no taxes configured in Tax Master */}
              {availableTaxes.length === 0 && !loadingTaxes && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-xs">Work Master strictly depends on Tax Master & Compliance</div>
                    <div className="text-[13px] leading-relaxed">
                      Currently 0 active Taxes are configured in Tax Master. You cannot create a work template without linking to an active Tax.
                    </div>
                    <NavLink
                      to="/masters/tax"
                      onClick={() => setIsModalOpen(false)}
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                    >
                      <span>+ Go to Tax Master</span>
                    </NavLink>
                  </div>
                </div>
              )}

              {/* --- STEP 1: INITIAL 2 FIELDS (Work Name & Select Tax Name) --- */}
              <div className="p-4 rounded-xl border border-brand-200/80 dark:border-brand-500/20 bg-brand-50/30 dark:bg-brand-500/5 space-y-4">
                <div className="text-[13px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[12px]">1</span>
                  Basic Work & Tax Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 1: Work Name */}
                  <div>
                    <label className="block font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                      Work Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GSTR-1 Monthly Return Filing"
                      value={formData.workName}
                      onChange={(e) => setFormData({ ...formData, workName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary !font-normal focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-xs shadow-2xs"
                    />
                    <span className="text-[12px] text-light-textMuted dark:text-dark-textMuted mt-1 block">
                      Name of the job / assignment
                    </span>
                  </div>

                  {/* Field 2: Select Tax Name (From Tax Master in DB) */}
                  <div>
                    <label className="block font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary flex items-center justify-between">
                      <span>Select Tax Name *</span>
                      <NavLink
                        to="/masters/tax"
                        target="_blank"
                        className="text-[12px] font-normal text-brand-500 hover:underline"
                      >
                        + View Tax Master
                      </NavLink>
                    </label>
                    <select
                      required
                      value={formData.taxId}
                      onChange={(e) => handleTaxSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary !font-normal focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-xs cursor-pointer shadow-2xs"
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
                    <span className="text-[12px] text-light-textMuted dark:text-dark-textMuted mt-1 block">
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
                  <h4 className="text-sm font-normal text-light-textPrimary dark:text-dark-textPrimary">
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
                          <span className="px-2 py-0.5 rounded-full text-[12px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                            Group: {selectedTax.taxGroup}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[12px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                            {selectedTax.frequency || selectedTax.filingFrequency || 'Monthly'}
                          </span>
                        </div>
                      </div>

                      {/* Compact Filing Schedule Dates */}
                      <div className="rounded-lg border border-blue-100 dark:border-blue-500/20 bg-white/70 dark:bg-dark-bg/40 p-2">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="text-[12px] font-bold text-blue-900 dark:text-blue-300">
                            Filing Schedule Dates
                          </span>
                          <span className="text-[11px] font-semibold text-light-textMuted dark:text-dark-textMuted">
                            {selectedTaxScheduleRows.length} period{selectedTaxScheduleRows.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        {selectedTaxScheduleRows.length > 0 ? (
                          <div className="overflow-x-auto rounded-md border border-blue-100/80 dark:border-blue-500/15">
                            <table className="w-full min-w-[620px] text-left text-[11px]">
                              <thead className="sticky top-0 bg-blue-50/90 dark:bg-dark-cardSecondary text-light-textMuted dark:text-dark-textMuted">
                                <tr>
                                  <th className="px-2 py-1.5 font-semibold">Period</th>
                                  <th className="px-2 py-1.5 font-semibold">Filing Date</th>
                                  <th className="px-2 py-1.5 font-semibold">Submission Date</th>
                                  <th className="px-2 py-1.5 font-semibold">Reconciliation Date</th>
                                  <th className="px-2 py-1.5 font-semibold">Extended Due Date / Reason</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100/80 dark:divide-blue-500/15">
                                {selectedTaxScheduleRows.map((period, index) => {
                                  const periodName = period.periodFrom
                                    ? new Date(`${period.periodFrom.slice(0, 10)}T00:00:00`).toLocaleDateString(
                                        'en-IN',
                                        { month: 'short', year: 'numeric' }
                                      )
                                    : `Period ${index + 1}`;

                                  return (
                                    <tr key={`${period.periodFrom}-${period.periodTo}-${index}`}>
                                      <td className="whitespace-nowrap px-2 py-1.5 font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                                        <span>{periodName}</span>
                                        {period.periodFrom && period.periodTo && (
                                          <span className="ml-1 font-normal text-light-textMuted dark:text-dark-textMuted">
                                            {formatDate(period.periodFrom)} – {formatDate(period.periodTo)}
                                          </span>
                                        )}
                                      </td>
                                      <td className="whitespace-nowrap px-2 py-1.5">{formatDate(period.filingDate)}</td>
                                      <td className="whitespace-nowrap px-2 py-1.5">{formatDate(period.submissionDate)}</td>
                                      <td className="whitespace-nowrap px-2 py-1.5">{formatDate(period.reconciliationDate)}</td>
                                      <td className="max-w-[200px] px-2 py-1.5">
                                        {period.extendedDate ? (
                                          <div className="space-y-0.5">
                                            <div className="whitespace-nowrap">{formatDate(period.extendedDate)}</div>
                                            {period.extensionReason && (
                                              <div className="whitespace-normal text-[10px] text-light-textMuted dark:text-dark-textMuted">
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
                          <p className="text-[11px] text-light-textMuted dark:text-dark-textMuted">
                            No filing schedule dates configured.
                          </p>
                        )}
                      </div>

                      {/* Description / Instructions */}
                      {isEditingTaxNotes ? (
                        <div className="space-y-2 rounded-lg border border-blue-100/80 bg-white/60 p-3 dark:border-blue-500/10 dark:bg-dark-bg/40">
                          <label className="block text-[13px] font-semibold text-blue-900 dark:text-blue-300">
                            Regulatory Notes
                          </label>
                          <textarea
                            rows={3}
                            autoFocus
                            value={taxNotesDraft}
                            onChange={(event) => setTaxNotesDraft(event.target.value)}
                            disabled={savingTaxNotes}
                            placeholder="Add regulatory notes..."
                            className="w-full resize-y rounded-lg border border-light-border bg-white px-3 py-2 text-[13px] text-light-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60 dark:border-dark-border dark:bg-dark-card dark:text-dark-textPrimary"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingTaxNotes(false)}
                              disabled={savingTaxNotes}
                              className="rounded-md border border-light-border px-3 py-1.5 text-xs text-light-textSecondary hover:bg-light-bg disabled:opacity-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-cardSecondary"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveTaxNotes}
                              disabled={savingTaxNotes}
                              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                            >
                              {savingTaxNotes ? 'Saving...' : 'Save Notes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-100/80 bg-white/60 p-2.5 text-[13px] text-light-textSecondary dark:border-blue-500/10 dark:bg-dark-bg/40 dark:text-dark-textSecondary">
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-blue-900 dark:text-blue-300">Regulatory Notes: </span>
                            <span>{selectedTax.description || 'No regulatory notes added.'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTaxNotesDraft(selectedTax.description || '');
                              setIsEditingTaxNotes(true);
                            }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-normal text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
                            title="Edit regulatory notes here"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  ) : editingWork ? (
                    <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>No Tax currently linked to this template. You can select an active Tax from the dropdown above to link statutory deadlines, or edit template settings directly.</span>
                    </div>
                  ) : null}

                  {/* Required Documents from Document Master */}
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="block font-normal text-light-textPrimary dark:text-dark-textPrimary">
                        Required Documents
                      </label>
                      <span className="text-[11px] font-normal text-light-textMuted dark:text-dark-textMuted">
                        Select the documents this work needs
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={documentToAdd}
                        onChange={(event) => {
                          setDocumentToAdd(event.target.value);
                          setSelectedDocumentFile(null);
                          if (requiredDocumentFileInputRef.current) {
                            requiredDocumentFileInputRef.current.value = '';
                          }
                        }}
                        disabled={availableDocuments.length === 0}
                        className="min-w-0 flex-1 rounded-xl border border-light-border bg-light-bg px-3 py-2 text-xs !font-normal text-light-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60 dark:border-dark-border dark:bg-dark-bg dark:text-dark-textPrimary"
                      >
                        <option value="">
                          {availableDocuments.length > 0
                            ? '-- Select a document --'
                            : 'No document names in Document Master'}
                        </option>
                        {availableDocuments
                          .filter(
                            (document) =>
                              !formData.defaultDocumentFiles.some(
                                (file) => file.documentName === document.name
                              )
                          )
                          .map((document) => (
                            <option key={document._id} value={document.name}>
                              {document.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {documentToAdd && (
                      <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 dark:border-brand-500/30 dark:bg-brand-500/5">
                        <label className="mb-1.5 block font-normal text-light-textPrimary dark:text-dark-textPrimary">
                          Upload {documentToAdd} *
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            ref={requiredDocumentFileInputRef}
                            type="file"
                            disabled={uploadingRequiredDocument}
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              setSelectedDocumentFile(file);
                              if (file) void handleUploadRequiredDocument(file);
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-light-border bg-white px-2 py-1.5 text-xs text-light-textSecondary dark:border-dark-border dark:bg-dark-bg dark:text-dark-textSecondary"
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-light-textMuted dark:text-dark-textMuted">
                          {uploadingRequiredDocument
                            ? 'Uploading and attaching file...'
                            : 'The file uploads and attaches as soon as you select it.'}
                        </p>
                      </div>
                    )}

                    {formData.defaultDocuments.length > 0 ? (
                      <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-xl border border-light-border/70 bg-light-bg/40 p-2 dark:border-dark-border dark:bg-dark-bg/40">
                        {formData.defaultDocuments.map((documentName) => {
                          const uploadedFile = formData.defaultDocumentFiles.find(
                            (file) => file.documentName === documentName
                          );

                          return (
                            <span
                              key={documentName}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-xs font-normal text-light-textPrimary dark:border-brand-500/30 dark:bg-dark-card dark:text-dark-textPrimary"
                            >
                              <button
                                type="button"
                                disabled={!uploadedFile}
                                onClick={() =>
                                  uploadedFile && handleOpenRequiredDocument(uploadedFile)
                                }
                                title={uploadedFile ? `Open ${uploadedFile.fileName}` : 'No file uploaded'}
                                className="flex flex-col text-left disabled:cursor-default"
                              >
                                <span className={uploadedFile ? 'text-brand-600 underline decoration-brand-300 underline-offset-2 dark:text-brand-300' : ''}>
                                  {documentName}
                                </span>
                                <span className="text-[10px] font-normal text-light-textMuted dark:text-dark-textMuted">
                                  {uploadedFile?.fileName || 'No file uploaded'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRequiredDocument(documentName)}
                                aria-label={`Remove ${documentName}`}
                                className="rounded p-0.5 text-light-textMuted hover:bg-rose-50 hover:text-status-red dark:hover:bg-rose-500/10"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-light-textMuted dark:text-dark-textMuted">
                        No required documents selected.{' '}
                        {availableDocuments.length === 0 && (
                          <NavLink to="/masters/documents" className="font-normal text-brand-600 hover:underline dark:text-brand-300">
                            Add document names in Document Master.
                          </NavLink>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Work Execution Settings */}
                  <div className="space-y-4 pt-2">
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
                              <span className="font-normal">{step}</span>
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
                          className="flex-1 px-3 py-1.5 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-xs !font-normal text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddChecklist}
                          className="px-3 py-1.5 rounded-lg bg-light-border dark:bg-dark-border hover:bg-brand-500 hover:text-white text-light-textPrimary dark:text-dark-textPrimary text-xs font-normal transition-colors flex items-center gap-1"
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
              <div className="text-[13px] text-light-textMuted dark:text-dark-textMuted">
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
                  disabled={submitting || (!formData.taxId && !editingWork) || availableTaxes.length === 0}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingWork ? 'Update Work Template' : 'Save Work Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 2: WORK MASTER ASSIGNMENTS & TEAM ALLOCATIONS */}
      {/* ========================================================================= */}
      {isAssignmentsModalOpen && selectedWorkForAssignments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-6xl max-h-[90vh] flex flex-col bg-white dark:bg-dark-card rounded-xl shadow-xl border border-light-border dark:border-dark-border overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border bg-white dark:bg-dark-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-light-bg dark:bg-dark-cardSecondary text-light-textSecondary dark:text-dark-textSecondary flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-light-textPrimary dark:text-dark-textPrimary">
                      {selectedWorkForAssignments.workName}
                  </h3>
                  {selectedWorkTax?.taxName && (
                    <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                      {selectedWorkTax.taxName} · {selectedWorkTax.taxGroup || selectedWorkForAssignments.category}
                    </p>
                  )}
                  <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                    Timeline: {selectedWorkForAssignments.timeline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAssignForm(!showQuickAssignForm)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showQuickAssignForm ? 'Close Form' : 'Assign to Team Member'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAssignmentsModalOpen(false)}
                  className="p-1.5 rounded-lg text-light-textMuted hover:text-light-textPrimary dark:hover:text-dark-textPrimary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Quick KPI Stats Row */}
              <div className="grid grid-cols-3 divide-x divide-light-border rounded-lg border border-light-border dark:divide-dark-border dark:border-dark-border">
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-light-textMuted" />
                    Total Active Tasks
                  </div>
                  <div className="text-lg text-light-textPrimary dark:text-dark-textPrimary">
                    {totalWorkAssignmentsCount}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-light-textMuted" />
                    Assigned Employees
                  </div>
                  <div className="text-lg text-light-textPrimary dark:text-dark-textPrimary">
                    {employeeSummaries.length}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-light-textMuted" />
                    Unique Clients
                  </div>
                  <div className="text-lg text-light-textPrimary dark:text-dark-textPrimary">
                    {new Set(workAssignmentsList.map((w: any) => w.clientId?._id || w.clientId)).size}
                  </div>
                </div>
              </div>

              {/* Collapsible Assign Form */}
              {showQuickAssignForm && (
                <form
                  onSubmit={handleQuickAssignSubmit}
                  className="p-4 rounded-lg bg-light-bg/40 dark:bg-dark-cardSecondary/30 border border-light-border dark:border-dark-border space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-light-textPrimary dark:text-dark-textPrimary flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-brand-500" />
                      Assign "{selectedWorkForAssignments.workName}" to an Employee
                    </h4>
                    <span className="text-[13px] text-light-textMuted">Fields marked with * are required</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                        Employee (Assignee) *
                      </label>
                      <select
                        required
                        value={quickAssignData.employeeId}
                        onChange={(e) => setQuickAssignData({ ...quickAssignData, employeeId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      >
                        <option value="">Select Employee...</option>
                        {allEmployeesList.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.employeeCode} - {emp.designation})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                        Client *
                      </label>
                      <select
                        required
                        value={quickAssignData.clientId}
                        onChange={(e) => setQuickAssignData({ ...quickAssignData, clientId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      >
                        <option value="">Select Client...</option>
                        {allClientsList.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.businessName || c.name} ({c.clientCode || c.pan})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickAssignForm(false)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-light-border dark:border-dark-border text-light-textSecondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingQuickAssign}
                      className="px-4 py-1.5 text-xs rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-50 transition-colors"
                    >
                      {submittingQuickAssign ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                  </div>
                </form>
              )}

              {/* View Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-light-border/60 dark:border-dark-border/60">
                <div className="text-sm font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                  Assignments
                </div>

                <div className="inline-flex p-0.5 rounded-lg border border-light-border dark:border-dark-border text-xs">
                  <button
                    type="button"
                    onClick={() => setAssignmentsViewMode('employeeGrouped')}
                    className={`px-3 py-1 rounded-md text-[13px] font-normal transition-colors ${
                      assignmentsViewMode === 'employeeGrouped'
                        ? 'bg-light-bg dark:bg-dark-cardSecondary text-brand-600 dark:text-brand-300'
                        : 'text-light-textSecondary dark:text-dark-textSecondary'
                    }`}
                  >
                    Group by Employee ({employeeSummaries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentsViewMode('allList')}
                    className={`px-3 py-1 rounded-md text-[13px] font-normal transition-colors ${
                      assignmentsViewMode === 'allList'
                        ? 'bg-light-bg dark:bg-dark-cardSecondary text-brand-600 dark:text-brand-300'
                        : 'text-light-textSecondary dark:text-dark-textSecondary'
                    }`}
                  >
                    All Tasks ({workAssignmentsList.length})
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loadingWorkAssignments ? (
                <div className="py-12 text-center text-xs text-light-textMuted">
                  Loading assigned team members...
                </div>
              ) : workAssignmentsList.length === 0 ? (
                <div className="py-12 text-center rounded-lg bg-light-bg/30 dark:bg-dark-cardSecondary/20 border border-light-border dark:border-dark-border">
                  <Users className="w-8 h-8 text-light-textMuted mx-auto mb-2" />
                  <p className="text-xs text-light-textPrimary dark:text-dark-textPrimary">
                    No employees have been assigned this work template yet.
                  </p>
                  <p className="text-[13px] text-light-textMuted mt-1">
                    Click "Assign to Team Member" above to assign it to an employee for a client.
                  </p>
                </div>
              ) : assignmentsViewMode === 'employeeGrouped' ? (
                /* Grouped by Employee */
                <div className="space-y-3">
                  {employeeSummaries.map((es) => (
                    <div
                      key={es.employeeId}
                      className="rounded-lg border border-light-border dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden"
                    >
                      {/* Employee Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-light-bg/40 dark:bg-dark-cardSecondary/30 border-b border-light-border/60 dark:border-dark-border/60 gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-light-bg dark:bg-dark-cardSecondary text-light-textSecondary dark:text-dark-textSecondary flex items-center justify-center text-xs">
                            {es.employeeName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-xs text-light-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                              <span>{es.employeeName}</span>
                            </div>
                            <div className="text-[12px] text-light-textSecondary">
                              {es.designation} • {es.department}
                            </div>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-xs text-light-textSecondary dark:text-dark-textSecondary self-start sm:self-auto">
                          <Briefcase className="w-3.5 h-3.5 text-light-textMuted" />
                          <span>
                            {es.assignmentsCount} {es.assignmentsCount === 1 ? 'assignment' : 'assignments'} · {es.clients.length} {es.clients.length === 1 ? 'client' : 'clients'}
                          </span>
                        </div>
                      </div>

                      {/* Tasks under this employee */}
                      <div className="divide-y divide-light-border/40 dark:divide-dark-border/40 text-xs">
                        {es.assignments.map((a: any) => {
                          const clientName = a.clientId?.businessName || a.clientId?.name || 'Client';
                          const pan = a.clientId?.pan || 'N/A';

                          return (
                            <div
                              key={a._id}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-light-bg/30 dark:hover:bg-dark-cardSecondary/20 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-normal text-light-textPrimary dark:text-dark-textPrimary">
                                    {clientName}
                                  </span>
                                  <span className="font-mono text-[12px] text-light-textMuted">
                                    (PAN: {pan})
                                  </span>
                                </div>
                                {a.remarks && (
                                  <p className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary">
                                    {a.remarks}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-[13px]">
                                <div className="flex items-center gap-1 text-light-textSecondary">
                                  <Calendar className="w-3.5 h-3.5 text-light-textMuted" />
                                  <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                                </div>

                                <span
                                  className="text-xs text-light-textSecondary dark:text-dark-textSecondary"
                                >
                                  {a.status}
                                </span>
                                {canDeleteAssignments && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWorkAssignment(a._id, a.workCode)}
                                    title="Delete assignment"
                                    aria-label={`Delete assignment ${a.workCode}`}
                                    className="rounded-md p-1.5 text-light-textMuted transition-colors hover:bg-rose-50 hover:text-status-red dark:hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Flat All List View */
                <div className="overflow-x-auto border border-light-border dark:border-dark-border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/30 text-[13px] font-medium text-light-textSecondary">
                        <th className="py-2.5 px-3">Assigned Employee</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        {canDeleteAssignments && <th className="py-2.5 px-3 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
                      {workAssignmentsList.map((a: any) => (
                        <tr key={a._id} className="hover:bg-light-bg/40 dark:hover:bg-dark-cardSecondary/40">
                          <td className="py-2.5 px-3">
                            <div className="font-normal text-light-textPrimary dark:text-dark-textPrimary">
                              {a.employeeId?.name || 'Employee'}
                            </div>
                            <div className="text-[12px] text-light-textMuted dark:text-dark-textMuted">
                              {a.employeeId?.designation}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-light-textSecondary">
                            <div className="font-normal">{a.clientId?.businessName || a.clientId?.name}</div>
                            <div className="text-[12px] text-light-textMuted dark:text-dark-textMuted font-mono">{a.clientId?.pan}</div>
                          </td>
                          <td className="py-2.5 px-3 text-light-textSecondary">
                            {new Date(a.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-light-textSecondary dark:text-dark-textSecondary">{a.status}</span>
                          </td>
                          {canDeleteAssignments && (
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteWorkAssignment(a._id, a.workCode)}
                                title="Delete assignment"
                                aria-label={`Delete assignment ${a.workCode}`}
                                className="rounded-md p-1.5 text-light-textMuted transition-colors hover:bg-light-bg hover:text-light-textPrimary dark:hover:bg-dark-cardSecondary dark:hover:text-dark-textPrimary"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedWorkRequiredDocuments.length > 0 && (
                <div className="border-b border-light-border pb-3 dark:border-dark-border">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                      Required Documents
                    </div>
                    <span className="text-[11px] text-light-textMuted dark:text-dark-textMuted">
                      {selectedWorkRequiredDocuments.length} document{selectedWorkRequiredDocuments.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <ol className="list-decimal space-y-1 pl-5 text-xs text-light-textSecondary marker:text-light-textMuted dark:text-dark-textSecondary">
                    {selectedWorkRequiredDocuments.map((documentName) => {
                      const uploadedFile = selectedWorkForAssignments?.defaultDocumentFiles?.find(
                        (file) => file.documentName === documentName
                      );

                      return (
                        <li key={documentName} className="pl-1">
                          {uploadedFile ? (
                            <button
                              type="button"
                              onClick={() => handleOpenRequiredDocument(uploadedFile)}
                              title={`Open ${uploadedFile.fileName}`}
                              className="inline-flex max-w-full items-center gap-1.5 py-1 text-left transition-colors hover:text-brand-600 hover:underline dark:hover:text-brand-300"
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="flex min-w-0 flex-col">
                                <span className="truncate">{documentName}</span>
                                <span className="truncate text-[10px] text-light-textMuted dark:text-dark-textMuted">
                                  {uploadedFile.fileName}
                                </span>
                              </span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 py-1">
                              <FileText className="h-4 w-4 shrink-0" />
                              <span>{documentName} — file not uploaded</span>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-light-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between">
              <span className="text-[13px] text-light-textSecondary">
                {totalWorkAssignmentsCount} active {totalWorkAssignmentsCount === 1 ? 'task' : 'tasks'} · {employeeSummaries.length} team {employeeSummaries.length === 1 ? 'member' : 'members'}
              </span>
              <button
                type="button"
                onClick={() => setIsAssignmentsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-xs font-semibold hover:bg-light-border/40 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
