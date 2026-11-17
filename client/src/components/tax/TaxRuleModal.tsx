import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Upload,
  RefreshCw,
  Bell,
  Clock,
  ShieldAlert,
  Sparkles,
  Layers,
  FolderTree,
  Building,
  Info,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { TaxMasterItem, ClientItem, EmployeeItem, TaxGroupItem } from '../../types';

interface TaxRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTax?: TaxMasterItem | null;
  defaultTaxGroup?: string;
}

// Domain-Specific Intelligence for CA Compliance
const TAX_GROUP_CONFIG: Record<
  string,
  {
    defaultFrequency: string;
    allowedFrequencies: string[];
    defaultClientTypes: string[];
    reconciliationTypes: string[];
    suggestions: Array<{
      name: string;
      desc: string;
      freq: string;
      periodDesc: string;
      dueRule: string;
      clientTypes?: string[];
    }>;
  }
> = {
  GST: {
    defaultFrequency: 'Monthly',
    allowedFrequencies: ['Monthly', 'Quarterly', 'Yearly', 'One Time'],
    defaultClientTypes: ['Individual', 'Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: [
      'GSTR-2B vs Purchase Register',
      'GSTR-1 vs Sales Register',
      'Books vs Filed GSTR-3B',
      'Custom GST Reconciliation',
    ],
    suggestions: [
      {
        name: 'GSTR-1',
        desc: 'Outward supplies statement (Sales)',
        freq: 'Monthly',
        periodDesc: 'Monthly (e.g. Nov 2026)',
        dueRule: 'Due on 11th Next Month',
      },
      {
        name: 'GSTR-3B',
        desc: 'Monthly summary return & tax payment',
        freq: 'Monthly',
        periodDesc: 'Monthly (e.g. Nov 2026)',
        dueRule: 'Due on 20th Next Month',
      },
      {
        name: 'GSTR-9',
        desc: 'Annual return for regular taxpayers',
        freq: 'Yearly',
        periodDesc: 'Financial Year',
        dueRule: 'Due on 31st Dec',
      },
    ],
  },
  'Income Tax': {
    defaultFrequency: 'Yearly',
    allowedFrequencies: ['Yearly', 'Quarterly'],
    defaultClientTypes: ['Individual', 'Business', 'Company', 'Partnership', 'LLP', 'Trust'],
    reconciliationTypes: [
      'TDS / TCS as per Books vs Form 26AS / AIS / TIS',
      'Advance Tax Paid vs Portal Challans',
      'Books Balance Sheet vs ITR Financials',
    ],
    suggestions: [
      {
        name: 'ITR-1 (Sahaj)',
        desc: 'Salaried individuals with income up to ₹50 Lakh',
        freq: 'Yearly',
        periodDesc: 'FY 2026-27 (AY 2027-28)',
        dueRule: 'Due on 31st July',
        clientTypes: ['Individual'],
      },
      {
        name: 'ITR-4 (Sugam)',
        desc: 'Presumptive business & profession (44AD / 44ADA)',
        freq: 'Yearly',
        periodDesc: 'FY 2026-27 (AY 2027-28)',
        dueRule: 'Due on 31st July',
        clientTypes: ['Individual', 'Partnership'],
      },
      {
        name: 'ITR-6 (Corporate)',
        desc: 'Companies other than claiming exemption u/s 11',
        freq: 'Yearly',
        periodDesc: 'FY 2026-27 (AY 2027-28)',
        dueRule: 'Due on 31st Oct',
        clientTypes: ['Company'],
      },
      {
        name: 'Tax Audit 44AB',
        desc: 'Mandatory audit report for turnover > threshold',
        freq: 'Yearly',
        periodDesc: 'FY 2026-27 (AY 2027-28)',
        dueRule: 'Due on 30th Sep',
        clientTypes: ['Business', 'Company', 'Partnership'],
      },
    ],
  },
  TDS: {
    defaultFrequency: 'Quarterly',
    allowedFrequencies: ['Quarterly'],
    defaultClientTypes: ['Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: [
      'TDS Deducted in Books vs Challan 281 Paid',
      'TDS in Books vs Form 26AS / TRACES',
    ],
    suggestions: [
      {
        name: 'Form 24Q (Salary)',
        desc: 'Quarterly TDS return for Salary payments',
        freq: 'Quarterly',
        periodDesc: 'Quarter (Q1/Q2/Q3/Q4)',
        dueRule: 'Due on 31st of following month',
      },
      {
        name: 'Form 26Q (Non-Salary)',
        desc: 'Quarterly TDS return for Contractors/Rent/Prof. fees',
        freq: 'Quarterly',
        periodDesc: 'Quarter (Q1/Q2/Q3/Q4)',
        dueRule: 'Due on 31st of following month',
      },
    ],
  },
  TCS: {
    defaultFrequency: 'Quarterly',
    allowedFrequencies: ['Quarterly'],
    defaultClientTypes: ['Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: [
      'TCS Collected in Books vs Challan 281 Paid',
      'TCS in Books vs Form 26AS',
    ],
    suggestions: [
      {
        name: 'Form 27EQ (TCS)',
        desc: 'Quarterly return for tax collected at source',
        freq: 'Quarterly',
        periodDesc: 'Quarter (Q1/Q2/Q3/Q4)',
        dueRule: 'Due on 15th of following month',
      },
    ],
  },
  ROC: {
    defaultFrequency: 'Yearly',
    allowedFrequencies: ['Yearly', 'One Time'],
    defaultClientTypes: ['Company', 'LLP'], // ONLY Corporate!
    reconciliationTypes: [
      'Audited Financial Statements vs Form AOC-4',
      'Secretarial Records vs Form MGT-7',
    ],
    suggestions: [
      {
        name: 'AOC-4 (Financials)',
        desc: 'Filing of audited balance sheet & P&L with MCA',
        freq: 'Yearly',
        periodDesc: 'FY 2026-27 (Post AGM)',
        dueRule: 'Due on 30th Oct (Within 30 days of AGM)',
        clientTypes: ['Company'],
      },
      {
        name: 'MGT-7 (Annual Return)',
        desc: 'Annual return filing with ROC under Companies Act',
        freq: 'Yearly',
        periodDesc: 'FY 2026-27 (Post AGM)',
        dueRule: 'Due on 29th Nov (Within 60 days of AGM)',
        clientTypes: ['Company'],
      },
      {
        name: 'DIR-3 KYC',
        desc: 'Annual Director KYC verification with MCA portal',
        freq: 'Yearly',
        periodDesc: 'Annual KYC',
        dueRule: 'Due on 30th Sep Every Year',
        clientTypes: ['Company', 'LLP'],
      },
    ],
  },
  'PF / ESI': {
    defaultFrequency: 'Monthly',
    allowedFrequencies: ['Monthly'],
    defaultClientTypes: ['Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: ['Payroll Register vs ECR Challan Paid'],
    suggestions: [
      {
        name: 'ECR (EPF Monthly)',
        desc: 'Electronic Challan cum Return for Provident Fund',
        freq: 'Monthly',
        periodDesc: 'Monthly',
        dueRule: 'Due on 15th Next Month',
      },
      {
        name: 'ESI Monthly Return',
        desc: 'Employees State Insurance monthly contribution',
        freq: 'Monthly',
        periodDesc: 'Monthly',
        dueRule: 'Due on 15th Next Month',
      },
    ],
  },
  Other: {
    defaultFrequency: 'Monthly',
    allowedFrequencies: ['Monthly', 'Quarterly', 'Yearly', 'One Time', 'Custom'],
    defaultClientTypes: ['Individual', 'Business', 'Company', 'Partnership', 'LLP', 'Trust', 'Other'],
    reconciliationTypes: ['Bank Reconciliation', 'Books vs Third-Party Statement', 'Custom Reconciliation'],
    suggestions: [
      {
        name: 'Professional Tax (PT)',
        desc: 'State professional tax monthly/annual return',
        freq: 'Monthly',
        periodDesc: 'Monthly',
        dueRule: 'Due on 10th Next Month',
      },
    ],
  },
};

export const TaxRuleModal: React.FC<TaxRuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingTax,
  defaultTaxGroup = '',
}) => {
  // Dropdown options
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [financialYears, setFinancialYears] = useState<any[]>([]);
  const [availableTaxGroups, setAvailableTaxGroups] = useState<TaxGroupItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Section A: Basic Tax Information
  const [taxGroup, setTaxGroup] = useState<string>('');
  const [showGroupSelect, setShowGroupSelect] = useState<boolean>(false);
  const [taxName, setTaxName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('Monthly');
  const [financialYear, setFinancialYear] = useState<string>('2026-27');
  const [applicableClientTypes, setApplicableClientTypes] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('Active');

  // Section B: Timeline & Due Date
  const [periodFrom, setPeriodFrom] = useState<string>('');
  const [periodTo, setPeriodTo] = useState<string>('');
  const [filingPeriod, setFilingPeriod] = useState<string>('');
  const [originalDueDate, setOriginalDueDate] = useState<string>('');
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [extendedDueDate, setExtendedDueDate] = useState<string>('');
  const [extensionReason, setExtensionReason] = useState<string>('');
  const [extensionReference, setExtensionReference] = useState<string>('');

  // Section C: Client Filing & Submission Details (Only when a client is selected)
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [filingStatus, setFilingStatus] = useState<string>('Pending');
  const [actualSubmissionDate, setActualSubmissionDate] = useState<string>('');
  const [acknowledgementNumber, setAcknowledgementNumber] = useState<string>('');
  const [submissionMethod, setSubmissionMethod] = useState<string>('Portal');
  const [submittedBy, setSubmittedBy] = useState<string>('Tosif Raza');
  const [filingRemarks, setFilingRemarks] = useState<string>('');

  // Section D: Reconciliation Management
  const [reconciliationRequired, setReconciliationRequired] = useState<boolean>(false);
  const [reconciliationType, setReconciliationType] = useState<string>(
    'GSTR-2B vs Purchase Register'
  );
  const [reconciliationStatus, setReconciliationStatus] = useState<string>('Pending');
  const [amountAsPerBooks, setAmountAsPerBooks] = useState<number | string>(0);
  const [amountAsPerStatement, setAmountAsPerStatement] = useState<number | string>(0);
  const [reconciledBy, setReconciledBy] = useState<string>('');
  const [reconciliationRemarks, setReconciliationRemarks] = useState<string>('');

  // Section E: Reminders & Compliance
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [reminderDays, setReminderDays] = useState<number[]>([7, 3, 1]);
  const [priority, setPriority] = useState<string>('Medium');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const [approvalRequired, setApprovalRequired] = useState<boolean>(false);
  const [internalNotes, setInternalNotes] = useState<string>('');

  // Helper to map dynamic/verbose tax group names to statutory config keys
  const getCanonicalGroup = (grp: string): string => {
    if (!grp) return 'Other';
    if (TAX_GROUP_CONFIG[grp]) return grp;
    if (grp.includes('GST')) return 'GST';
    if (grp.includes('Income Tax') || grp === 'IT') return 'Income Tax';
    if (grp.includes('TDS')) return 'TDS';
    if (grp.includes('TCS')) return 'TCS';
    if (grp.includes('ROC') || grp.includes('MCA')) return 'ROC';
    if (grp.includes('PF') || grp.includes('ESI')) return 'PF / ESI';
    return 'Other';
  };

  // Dynamic configuration based on current Tax Group
  const currentConfig = TAX_GROUP_CONFIG[getCanonicalGroup(taxGroup)] || TAX_GROUP_CONFIG.Other;

  // Auto-calculated Effective Due Date
  const effectiveDueDate = hasExtension && extendedDueDate ? extendedDueDate : originalDueDate;

  // Auto-calculated Difference Amount
  const booksVal = parseFloat(String(amountAsPerBooks)) || 0;
  const stmtVal = parseFloat(String(amountAsPerStatement)) || 0;
  const differenceAmount = Math.round((booksVal - stmtVal) * 100) / 100;

  // Fetch dropdowns
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.get('/clients?limit=100'),
        api.get('/employees?limit=50'),
        api.get('/financial-years'),
        api.get('/tax-groups'),
      ])
        .then(([cRes, eRes, fyRes, tgRes]) => {
          if (cRes.data?.data?.clients) setClients(cRes.data.data.clients);
          if (eRes.data?.data?.employees) {
            setEmployees(eRes.data.data.employees);
            if (!assignedEmployeeId && eRes.data.data.employees.length > 0) {
              setAssignedEmployeeId(eRes.data.data.employees[0]._id);
            }
          }
          if (fyRes.data?.data) {
            const list = Array.isArray(fyRes.data.data)
              ? fyRes.data.data
              : fyRes.data.data.financialYears || [];
            setFinancialYears(list);
          }
          if (tgRes.data?.data) {
            setAvailableTaxGroups(tgRes.data.data);
          }
        })
        .catch((err) => console.log('Dropdown fetch error:', err));
    }
  }, [isOpen]);

  // Handle Tax Group Change - strictly dynamic from Database Tax Group configuration
  const handleTaxGroupChange = (newGroup: string) => {
    setTaxGroup(newGroup);
    setIsDirty(true);
    if (!newGroup) return;

    const matchedGroup = availableTaxGroups.find(
      (g) =>
        g.groupName.toLowerCase() === newGroup.toLowerCase() ||
        g.groupCode.toLowerCase() === newGroup.toLowerCase()
    );

    if (matchedGroup) {
      if (matchedGroup.defaultFrequency) setFrequency(matchedGroup.defaultFrequency);
      if (matchedGroup.applicableClientTypes && matchedGroup.applicableClientTypes.length > 0) {
        setApplicableClientTypes(matchedGroup.applicableClientTypes);
      }
      if (matchedGroup.reconciliationTypes && matchedGroup.reconciliationTypes.length > 0) {
        setReconciliationType(matchedGroup.reconciliationTypes[0]);
      }
      if (matchedGroup.dueDate) {
        setOriginalDueDate(matchedGroup.dueDate);
      }
    }
  };

  // 1-Click Suggestion Preset Handler
  const applyTaxSuggestion = (sug: {
    name: string;
    desc: string;
    freq: string;
    periodDesc: string;
    dueRule: string;
    clientTypes?: string[];
  }) => {
    setTaxName(sug.name);
    setDescription(sug.desc);
    setFrequency(sug.freq);
    setFilingPeriod(sug.periodDesc);
    if (sug.clientTypes) {
      setApplicableClientTypes(sug.clientTypes);
    }
    // Set typical due date
    if (sug.name.includes('GSTR-1')) setOriginalDueDate('2026-12-11');
    else if (sug.name.includes('GSTR-3B')) setOriginalDueDate('2026-12-20');
    else if (sug.name.includes('ITR-1') || sug.name.includes('ITR-4'))
      setOriginalDueDate('2027-07-31');
    else if (sug.name.includes('ITR-6') || sug.name.includes('AOC-4'))
      setOriginalDueDate('2027-10-31');
    else if (sug.name.includes('24Q') || sug.name.includes('26Q')) setOriginalDueDate('2027-01-31');
    else if (sug.name.includes('ECR') || sug.name.includes('ESI')) setOriginalDueDate('2026-12-15');

    setIsDirty(true);
    toast.success(`Configured for ${sug.name}`);
  };

  // Populate when editing
  useEffect(() => {
    if (editingTax) {
      setTaxGroup(editingTax.taxGroup || 'GST');
      setTaxName(editingTax.taxName || '');
      setDescription(editingTax.description || '');
      setFrequency(editingTax.frequency || editingTax.filingFrequency || 'Monthly');
      setFinancialYear(editingTax.applicableFinancialYear || '2026-27');
      setStatus(editingTax.status || 'Active');
      if (editingTax.applicableClientTypes) {
        setApplicableClientTypes(editingTax.applicableClientTypes);
      }
      if (editingTax.reconciliationRequired !== undefined) {
        setReconciliationRequired(editingTax.reconciliationRequired);
      }
      if (editingTax.defaultReconciliationType) {
        setReconciliationType(editingTax.defaultReconciliationType);
      }
      if (editingTax.priority) setPriority(editingTax.priority);
      if (editingTax.periodFrom)
        setPeriodFrom(new Date(editingTax.periodFrom).toISOString().split('T')[0]);
      if (editingTax.periodTo)
        setPeriodTo(new Date(editingTax.periodTo).toISOString().split('T')[0]);
      if (editingTax.filingPeriod) setFilingPeriod(editingTax.filingPeriod);
      if (editingTax.originalDueDate)
        setOriginalDueDate(new Date(editingTax.originalDueDate).toISOString().split('T')[0]);
      if (editingTax.extendedDueDate) {
        setHasExtension(true);
        setExtendedDueDate(new Date(editingTax.extendedDueDate).toISOString().split('T')[0]);
      } else {
        setHasExtension(false);
        setExtendedDueDate('');
      }
      if (editingTax.actualSubmissionDate || editingTax.submissionDate) {
        const subDate = editingTax.actualSubmissionDate || editingTax.submissionDate;
        setActualSubmissionDate(new Date(subDate!).toISOString().split('T')[0]);
      }
      if (editingTax.submissionMethod) setSubmissionMethod(editingTax.submissionMethod);
      const validStatuses = [
        'Not Started',
        'Pending',
        'In Progress',
        'Ready to File',
        'Submitted',
        'Filed',
        'Rejected',
        'Revised',
      ];
      if (editingTax.filingStatus && validStatuses.includes(editingTax.filingStatus)) {
        setFilingStatus(editingTax.filingStatus);
      } else {
        setFilingStatus('Pending');
      }
      if (editingTax.acknowledgementNumber)
        setAcknowledgementNumber(editingTax.acknowledgementNumber);
      setShowGroupSelect(false);
      setIsDirty(false);
    } else {
      // Clean start - no hardcoded values
      const initialGroup = defaultTaxGroup && defaultTaxGroup !== 'All' && defaultTaxGroup !== 'All Taxes' ? defaultTaxGroup : '';
      setTaxGroup(initialGroup);
      setShowGroupSelect(false);
      setTaxName('');
      setDescription('');
      setFrequency('Monthly');
      setFinancialYear('2026-27');
      setStatus('Active');
      setApplicableClientTypes([]);
      setPeriodFrom('');
      setPeriodTo('');
      setFilingPeriod('');
      setOriginalDueDate('');
      setHasExtension(false);
      setExtendedDueDate('');
      setExtensionReason('');
      setExtensionReference('');
      setSelectedClientId('');
      setFilingStatus('Pending');
      setActualSubmissionDate('');
      setAcknowledgementNumber('');
      setReconciliationRequired(false);
      setReconciliationType('');
      setAmountAsPerBooks(0);
      setAmountAsPerStatement(0);
      setIsDirty(false);
    }
  }, [editingTax, defaultTaxGroup, isOpen]);

  if (!isOpen) return null;

  const clientTypesList = [
    'Individual',
    'Business',
    'Company',
    'Partnership',
    'LLP',
    'Trust',
    'Other',
  ];
  const reminderOptions = [30, 15, 7, 3, 1];

  const toggleClientType = (type: string) => {
    setIsDirty(true);
    setApplicableClientTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleReminderDay = (day: number) => {
    setIsDirty(true);
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    );
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('Discard unsaved changes in this tax configuration?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taxGroup) {
      toast.error('Please select a Tax Group first.');
      return;
    }

    if (!taxName.trim()) {
      toast.error('Tax / Service Name is required.');
      return;
    }

    if (new Date(periodFrom) > new Date(periodTo)) {
      toast.error('From Date cannot be later than To Date.');
      return;
    }

    if (hasExtension && (!extendedDueDate || !extensionReason || extensionReason.trim().length < 3)) {
      toast.error('Please enter the extended date and a valid extension reason.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Save or Update Reusable Tax Master Rule
      const taxRulePayload = {
        taxGroup,
        taxName,
        taxCode: `TAX-${taxGroup.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        description: description || undefined,
        frequency,
        filingFrequency: frequency,
        dueDateRule: originalDueDate ? `Due on ${originalDueDate}` : 'Statutory Due Date',
        applicableFinancialYear: financialYear,
        applicableClientTypes,
        periodFrom: periodFrom || undefined,
        periodTo: periodTo || undefined,
        filingPeriod: filingPeriod || undefined,
        originalDueDate: originalDueDate || undefined,
        extendedDueDate: hasExtension && extendedDueDate ? extendedDueDate : null,
        effectiveDueDate: effectiveDueDate || undefined,
        actualSubmissionDate: selectedClientId ? actualSubmissionDate || null : null,
        submissionDate: selectedClientId ? actualSubmissionDate || null : null,
        submissionMethod: selectedClientId ? submissionMethod : undefined,
        filingStatus: selectedClientId ? filingStatus : 'Pending',
        acknowledgementNumber: selectedClientId ? acknowledgementNumber || undefined : undefined,
        reconciliationRequired,
        defaultReconciliationType: reconciliationRequired ? reconciliationType : undefined,
        priority,
        status,
        reminderSettings: {
          enabled: reminderEnabled,
          daysBeforeDueDate: reminderDays,
        },
      };

      let savedTaxRuleId = editingTax?._id;

      if (editingTax) {
        await api.put(`/taxes/${editingTax._id}`, taxRulePayload);
        toast.success(`Tax Rule "${taxName}" updated successfully!`);
      } else {
        const taxRes = await api.post('/taxes', taxRulePayload);
        savedTaxRuleId = taxRes.data?.data?._id;
        toast.success(`Tax Rule "${taxName}" created successfully!`);
      }

      // 2. If a specific client was linked, create client-specific Tax Filing record
      if (selectedClientId && savedTaxRuleId) {
        const fyObj = financialYears.find(
          (f: any) => f.yearName === financialYear || f._id === financialYear
        );

        const filingPayload = {
          taxRuleId: savedTaxRuleId,
          clientId: selectedClientId,
          financialYearId: fyObj?._id || undefined,
          financialYear,
          periodFrom,
          periodTo,
          filingPeriod,
          originalDueDate,
          extendedDueDate: hasExtension && extendedDueDate ? extendedDueDate : null,
          extensionReason: hasExtension ? extensionReason || undefined : undefined,
          extensionReference: hasExtension ? extensionReference || undefined : undefined,
          actualSubmissionDate: actualSubmissionDate || null,
          filingStatus,
          acknowledgementNumber: acknowledgementNumber || undefined,
          submissionMethod,
          submittedBy,
          filingRemarks,
          assignedEmployeeId: assignedEmployeeId || undefined,
          reconciliationRequired,
          reconciliationType: reconciliationRequired ? reconciliationType : undefined,
          reconciliationStatus: reconciliationRequired ? reconciliationStatus : 'Not Required',
          amountAsPerBooks: Number(amountAsPerBooks) || 0,
          amountAsPerStatement: Number(amountAsPerStatement) || 0,
          reconciledBy,
          reconciliationRemarks,
          priority,
          approvalRequired,
          reminderEnabled,
          reminderDays,
          internalNotes,
        };

        await api.post('/tax-filings', filingPayload);
        toast.success(`Tax compliance filing registered for selected client!`);
      }

      setIsDirty(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.message || 'Error saving tax configuration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl max-w-[750px] w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-card px-6 py-4 border-b border-light-border dark:border-dark-border flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-bold text-light-textPrimary dark:text-dark-textPrimary">
              {editingTax ? 'Edit Tax Rule & Compliance' : 'Add New Tax Rule & Compliance'}
            </h2>
            <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary font-medium">
              Configure statutory compliance rules, filing timelines & reconciliations
            </p>
          </div>
          <button
            onClick={handleCancel}
            type="button"
            className="p-1.5 rounded-xl text-light-textMuted hover:text-light-textPrimary dark:hover:text-dark-textPrimary hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form
          id="taxRuleForm"
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-5 space-y-6 text-xs"
        >
          {/* SECTION A: BASIC TAX INFORMATION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-light-border/60 dark:border-dark-border/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-light-textPrimary dark:text-dark-textPrimary">
                  Section A: Basic Tax Information
                </h3>
              </div>
              {taxGroup && (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-950/40 px-2.5 py-0.5 rounded-md border border-brand-200 dark:border-brand-800">
                    Tax Group: {taxGroup}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGroupSelect((prev) => !prev)}
                    className="text-[13px] text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                  >
                    {showGroupSelect ? 'Cancel' : 'Change'}
                  </button>
                </div>
              )}
            </div>

            {/* Tax Group Selector - ONLY shown when no group selected, or if user explicitly clicked 'Change' */}
            {(!taxGroup || showGroupSelect) && (
              <div className="bg-light-bg/40 dark:bg-dark-cardSecondary/40 p-3.5 rounded-xl border border-light-border dark:border-dark-border">
                <label className="block text-xs font-bold text-light-textPrimary dark:text-dark-textPrimary mb-1.5 flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-brand-500" />
                  <span>Select Tax Group *</span>
                </label>
                <select
                  required
                  value={taxGroup}
                  onChange={(e) => {
                    handleTaxGroupChange(e.target.value);
                    if (e.target.value) setShowGroupSelect(false);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer text-xs transition-all shadow-2xs"
                >
                  <option value="">-- Select a Tax Group --</option>
                  {availableTaxGroups && availableTaxGroups.length > 0 ? (
                    availableTaxGroups.map((g) => (
                      <option key={g._id || g.groupName} value={g.groupName}>
                        {g.groupName} {g.groupCode ? `(${g.groupCode})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No Tax Groups available (Create in Tax Group Master first)</option>
                  )}
                </select>
              </div>
            )}
          </div>

          {!taxGroup ? (
            <div className="py-12 px-6 text-center border-2 border-dashed border-light-border dark:border-dark-border rounded-2xl bg-light-bg/30 dark:bg-dark-cardSecondary/20 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-center mx-auto mb-3 text-brand-600 dark:text-brand-400">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary">
                {availableTaxGroups.length === 0 ? 'Tax Group Master is Empty' : 'First, Select a Tax Group'}
              </h4>
              <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1 max-w-sm mx-auto">
                {availableTaxGroups.length === 0
                  ? 'Tax Master strictly depends on Tax Group Master. There are 0 Tax Groups currently configured. You cannot add a Tax until at least one Tax Group is created.'
                  : 'Every tax master must be under a tax group. Select a tax group above to enter tax name and configure statutory details.'}
              </p>
              {availableTaxGroups.length === 0 && (
                <div className="mt-4">
                  <NavLink
                    to="/masters/tax-groups"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all"
                  >
                    <span>+ Go to Tax Group Master</span>
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tax Name & Specifications */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tax Name */}
                  <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Tax / Form Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    taxGroup === 'GST'
                      ? 'e.g. GSTR-3B or GSTR-1'
                      : taxGroup === 'Income Tax'
                      ? 'e.g. ITR-4 or ITR-6'
                      : taxGroup === 'TDS'
                      ? 'e.g. Form 26Q'
                      : taxGroup === 'ROC'
                      ? 'e.g. AOC-4 or MGT-7'
                      : 'e.g. Form / Return Name'
                  }
                  value={taxName}
                  onChange={(e) => {
                    setTaxName(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                />
              </div>

              {/* Dynamic Suggestions for this Tax Group */}
              {currentConfig?.suggestions && currentConfig.suggestions.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[13px] font-semibold text-brand-600 dark:text-brand-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Common Statutory Forms for {taxGroup} (Click to auto-configure):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentConfig.suggestions.map((sug) => (
                      <button
                        key={sug.name}
                        type="button"
                        onClick={() => applyTaxSuggestion(sug)}
                        className={`px-2.5 py-1 rounded-lg text-[13px] font-medium border transition-colors flex items-center gap-1 ${
                          taxName === sug.name
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                            : 'bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border text-light-textSecondary dark:text-dark-textSecondary hover:border-brand-500/50'
                        }`}
                        title={sug.desc}
                      >
                        <span>{sug.name}</span>
                        <span className="text-[11px] opacity-75">({sug.freq})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filing Frequency - Logically filtered by Tax Group! */}
              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Filing Frequency *
                </label>
                <select
                  required
                  value={frequency}
                  onChange={(e) => {
                    setFrequency(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  {currentConfig.allowedFrequencies.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <span className="text-[12px] text-light-textMuted dark:text-dark-textMuted mt-1 block">
                  {taxGroup === 'Income Tax'
                    ? 'Income Tax returns are filed annually'
                    : taxGroup === 'TDS' || taxGroup === 'TCS'
                    ? 'TDS/TCS returns are filed quarterly'
                    : 'Standard statutory cycle'}
                </span>
              </div>

              {/* Financial Year */}
              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Financial Year
                </label>
                <select
                  value={financialYear}
                  onChange={(e) => {
                    setFinancialYear(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  {financialYears.length > 0 ? (
                    financialYears.map((fy: any) => (
                      <option key={fy._id} value={fy.yearName}>
                        {fy.yearName} {fy.isCurrent ? '(Current FY)' : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="2026-27">2026-27 (Current FY)</option>
                      <option value="2025-26">2025-26 (Previous FY)</option>
                      <option value="2027-28">2027-28 (Upcoming FY)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Applicable Client Types - Logically Restricted for ROC/Corporate! */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                  Applicable Business / Client Types
                </label>
                {taxGroup === 'ROC' && (
                  <span className="text-[12px] text-amber-600 dark:text-amber-400 font-semibold">
                    (ROC applies strictly to Companies & LLPs)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {clientTypesList.map((type) => {
                  const selected = applicableClientTypes.includes(type);
                  const isRestricted =
                    taxGroup === 'ROC' && type !== 'Company' && type !== 'LLP';

                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={isRestricted}
                      onClick={() => toggleClientType(type)}
                      className={`px-3 py-1 rounded-lg text-[13px] font-semibold border transition-all ${
                        selected
                          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                          : isRestricted
                          ? 'opacity-30 cursor-not-allowed bg-light-bg dark:bg-dark-bg text-light-textMuted border-dashed'
                          : 'bg-light-bg dark:bg-dark-bg text-light-textSecondary dark:text-dark-textSecondary border-light-border dark:border-dark-border hover:border-brand-500/50'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                Description / Regulatory Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Statutory filing notes or rules for article staff..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none font-medium"
              />
            </div>
          </div>

          {/* SECTION B: TIMELINE & STATUTORY DUE DATE */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-light-border/60 dark:border-dark-border/60">
              <span className="w-2 h-2 rounded-full bg-status-orange" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-light-textPrimary dark:text-dark-textPrimary">
                Section B: Timeline & Due Date
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Reporting Period From *
                </label>
                <input
                  type="date"
                  required
                  value={periodFrom}
                  onChange={(e) => {
                    setPeriodFrom(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Reporting Period To *
                </label>
                <input
                  type="date"
                  required
                  value={periodTo}
                  onChange={(e) => {
                    setPeriodTo(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Filing / Assessment Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nov 2026, Q3, FY 2026-27"
                  value={filingPeriod}
                  onChange={(e) => {
                    setFilingPeriod(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Original Statutory Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={originalDueDate}
                  onChange={(e) => {
                    setOriginalDueDate(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                />
              </div>

              {/* Govt Deadline Extension Toggle (Clean & Uncluttered!) */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={hasExtension}
                    onChange={(e) => {
                      setHasExtension(e.target.checked);
                      if (!e.target.checked) setExtendedDueDate('');
                      setIsDirty(true);
                    }}
                    className="w-4 h-4 text-brand-500 rounded border-light-border"
                  />
                  <span className="font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                    Statutory Deadline Extended by Govt?
                  </span>
                </label>
              </div>
            </div>

            {/* Extended Due Date & Circular Reference (Only shown if Govt extended!) */}
            {hasExtension && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 animate-in fade-in duration-200">
                <div>
                  <label className="block font-semibold mb-1 text-amber-900 dark:text-amber-200">
                    Extended Due Date *
                  </label>
                  <input
                    type="date"
                    required={hasExtension}
                    value={extendedDueDate}
                    onChange={(e) => {
                      setExtendedDueDate(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-amber-900 dark:text-amber-200">
                    Extension Reason *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Portal glitch / Floods / Notification"
                    value={extensionReason}
                    onChange={(e) => {
                      setExtensionReason(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-amber-900 dark:text-amber-200">
                    Govt Notification No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Notif No. 42/2026-CT"
                    value={extensionReference}
                    onChange={(e) => {
                      setExtensionReference(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Calculated Due Date Pill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
              <span className="text-light-textSecondary dark:text-dark-textSecondary font-semibold">
                Effective Due Date (Calculated):
              </span>
              <span className="font-extrabold text-brand-500 text-xs px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30">
                {effectiveDueDate
                  ? new Date(effectiveDueDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Not set'}
              </span>
            </div>
          </div>

          {/* SECTION C: FILING & SUBMISSION (LOGICALLY CONDITIONAL!) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-light-border/60 dark:border-dark-border/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-purple" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-light-textPrimary dark:text-dark-textPrimary">
                  Section C: Client Filing & Submission
                </h3>
              </div>
              <span className="text-[13px] text-light-textMuted dark:text-dark-textMuted">
                {selectedClientId ? 'Client Linked (Filing Mode)' : 'Master Template Mode'}
              </span>
            </div>

            {/* Link Client Selector */}
            <div>
              <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                Link Client (Choose a client to record a specific return submission)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
              >
                <option value="">
                  -- Reusable Master Rule (No Client - Template for all clients) --
                </option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.businessName || c.name} ({c.groupName ? `${c.groupName} - ` : ''}
                    {c.pan})
                  </option>
                ))}
              </select>
            </div>

            {/* If NO client is selected, show helpful explanation and hide submission clutter! */}
            {!selectedClientId ? (
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-[13px] text-brand-700 dark:text-brand-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-brand-500" />
                <div>
                  <strong>Reusable Master Rule Mode:</strong> You are creating a reusable statutory rule
                  for <strong>{taxName || taxGroup}</strong>. Submission dates, ARN numbers, and filing
                  receipts are tracked individually when returns are filed for specific clients in the{' '}
                  <em>Client Filings</em> tab.
                </div>
              </div>
            ) : (
              /* If client IS selected, show actual filing details! */
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                      Filing Status *
                    </label>
                    <select
                      value={filingStatus}
                      onChange={(e) => {
                        setFilingStatus(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Ready to File">Ready to File</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Filed">Filed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                      Actual Submission Date
                    </label>
                    <input
                      type="date"
                      value={actualSubmissionDate}
                      onChange={(e) => {
                        setActualSubmissionDate(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                      Filing Reference / ARN / Ack #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ARN-AA2611260012948"
                      value={acknowledgementNumber}
                      onChange={(e) => {
                        setAcknowledgementNumber(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                      Submission Method
                    </label>
                    <select
                      value={submissionMethod}
                      onChange={(e) => {
                        setSubmissionMethod(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                    >
                      <option value="Portal">Government Portal Direct</option>
                      <option value="Utility">Offline JSON / Utility</option>
                      <option value="API">API Gateway</option>
                      <option value="Offline">Paper / Facilitation Center</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                      Submitted By
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tosif Raza (CA Admin)"
                      value={submittedBy}
                      onChange={(e) => {
                        setSubmittedBy(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION D: RECONCILIATION MANAGEMENT (LOGICALLY FILTERED BY TAX GROUP!) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-light-border/60 dark:border-dark-border/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-green" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-light-textPrimary dark:text-dark-textPrimary">
                  Section D: Reconciliation Management
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reconciliationRequired}
                  onChange={(e) => {
                    setReconciliationRequired(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 text-brand-500 rounded border-light-border"
                />
                <span className="font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                  Reconciliation Required for {taxGroup}?
                </span>
              </label>
            </div>

            {reconciliationRequired && (
              <div className="p-4 rounded-xl bg-light-bg/70 dark:bg-dark-bg/70 border border-light-border dark:border-dark-border space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Reconciliation Type - FILTERED FOR THIS TAX GROUP ONLY! */}
                  <div className={selectedClientId ? '' : 'sm:col-span-2'}>
                    <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                      Reconciliation Scope ({taxGroup}) *
                    </label>
                    <select
                      value={reconciliationType}
                      onChange={(e) => {
                        setReconciliationType(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary font-medium focus:outline-none"
                    >
                      {currentConfig.reconciliationTypes.map((rt) => (
                        <option key={rt} value={rt}>
                          {rt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedClientId && (
                    <div>
                      <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                        Reconciliation Status
                      </label>
                      <select
                        value={reconciliationStatus}
                        onChange={(e) => {
                          setReconciliationStatus(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Reconciled">Reconciled (Matched)</option>
                        <option value="Mismatch">Mismatch (Difference)</option>
                        <option value="Under Review">Under Review</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Amounts are only shown if a client filing is active! */}
                {selectedClientId && (
                  <div className="space-y-4 pt-2 border-t border-light-border/60 dark:border-dark-border/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                          Amount as per Books (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={amountAsPerBooks}
                          onChange={(e) => {
                            setAmountAsPerBooks(e.target.value);
                            setIsDirty(true);
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                          Amount as per Statement / Portal (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={amountAsPerStatement}
                          onChange={(e) => {
                            setAmountAsPerStatement(e.target.value);
                            setIsDirty(true);
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Calculated Difference Indicator */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                          Difference (Books − Portal):
                        </span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            differenceAmount === 0 ? 'text-status-green' : 'text-status-red'
                          }`}
                        >
                          ₹ {differenceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        {differenceAmount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-status-greenLight dark:bg-status-green/20 text-status-green">
                            <CheckCircle2 className="w-3 h-3" /> Fully Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-status-redLight dark:bg-status-red/20 text-status-red">
                            <ShieldAlert className="w-3 h-3" /> Mismatch Detected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION E: REMINDERS & COMPLIANCE ASSIGNMENT */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-light-border/60 dark:border-dark-border/60">
              <span className="w-2 h-2 rounded-full bg-status-red" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-light-textPrimary dark:text-dark-textPrimary">
                Section E: Reminders & Responsibility
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Automated Reminders
                </label>
                <select
                  value={reminderEnabled ? 'Yes' : 'No'}
                  onChange={(e) => {
                    setReminderEnabled(e.target.value === 'Yes');
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                >
                  <option value="Yes">Yes (Enabled)</option>
                  <option value="No">No (Disabled)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Compliance Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Assigned Employee
                </label>
                <select
                  value={assignedEmployeeId}
                  onChange={(e) => {
                    setAssignedEmployeeId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                >
                  <option value="">Select Assignee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reminder Days Selector */}
            {reminderEnabled && (
              <div>
                <label className="block font-semibold mb-1.5 text-light-textPrimary dark:text-dark-textPrimary">
                  Send Reminders Prior to Due Date:
                </label>
                <div className="flex flex-wrap gap-2">
                  {reminderOptions.map((days) => {
                    const active = reminderDays.includes(days);
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => toggleReminderDay(days)}
                        className={`px-3 py-1 rounded-lg text-[13px] font-semibold border transition-all ${
                          active
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                            : 'bg-light-bg dark:bg-dark-bg text-light-textSecondary dark:text-dark-textSecondary border-light-border dark:border-dark-border hover:border-brand-500/40'
                        }`}
                      >
                        {days} Days Before
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approval Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="approvalRequired"
                checked={approvalRequired}
                onChange={(e) => {
                  setApprovalRequired(e.target.checked);
                  setIsDirty(true);
                }}
                className="w-4 h-4 text-brand-500 rounded border-light-border"
              />
              <label
                htmlFor="approvalRequired"
                className="font-semibold text-light-textPrimary dark:text-dark-textPrimary cursor-pointer"
              >
                Requires CA Partner Approval before portal upload
              </label>
            </div>
          </div>
              </>
            )}
        </form>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-dark-card px-6 py-3.5 border-t border-light-border dark:border-dark-border flex items-center justify-between z-10">
          <div className="text-xs text-light-textMuted dark:text-dark-textMuted">
            {!taxGroup ? (
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Please select a tax group first
              </span>
            ) : selectedClientId ? (
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Saving as Client Filing ({taxGroup})
              </span>
            ) : (
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                Saving as Master Rule Template ({taxGroup})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2 rounded-xl border border-light-border dark:border-dark-border text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-cardSecondary font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="taxRuleForm"
              disabled={submitting || !taxGroup || availableTaxGroups.length === 0}
              className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTax ? 'Update Tax Rule' : 'Save Tax'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
