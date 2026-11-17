import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Upload,
  RefreshCw,
  Bell,
  Clock,
  ShieldAlert,
  Layers,
  FolderTree,
  Building,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { TaxMasterItem, EmployeeItem, TaxGroupItem } from '../../types';

interface TaxRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTax?: TaxMasterItem | null;
  defaultTaxGroup?: string;
}

interface MonthlyFilingPeriod {
  periodFrom: string;
  periodTo: string;
  filingDate: string;
  extendedDate: string;
}

const buildMonthlyFilingPeriods = (financialYear: string): MonthlyFilingPeriod[] => {
  const startYear = Number(financialYear.match(/\d{4}/)?.[0]) || new Date().getFullYear();

  return Array.from({ length: 12 }, (_, index) => {
    const monthIndex = (3 + index) % 12;
    const year = startYear + (index >= 9 ? 1 : 0);
    const month = String(monthIndex + 1).padStart(2, '0');
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();

    return {
      periodFrom: `${year}-${month}-01`,
      periodTo: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
      filingDate: '',
      extendedDate: '',
    };
  });
};

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
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [financialYears, setFinancialYears] = useState<any[]>([]);
  const [availableTaxGroups, setAvailableTaxGroups] = useState<TaxGroupItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Section A: Basic Tax Information
  const [taxGroup, setTaxGroup] = useState<string>('');
  const [taxName, setTaxName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('Monthly');
  const [financialYear, setFinancialYear] = useState<string>('2026-27');
  const [monthlyFilingPeriods, setMonthlyFilingPeriods] = useState<MonthlyFilingPeriod[]>(() =>
    buildMonthlyFilingPeriods('2026-27').slice(0, 1)
  );
  const [remainingSavedMonthlyPeriods, setRemainingSavedMonthlyPeriods] = useState<MonthlyFilingPeriod[]>([]);
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
  const [reconciliationDate, setReconciliationDate] = useState<string>('');
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
        api.get('/employees?limit=50'),
        api.get('/financial-years'),
        api.get('/tax-groups'),
      ])
        .then(([eRes, fyRes, tgRes]) => {
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
    setMonthlyFilingPeriods(buildMonthlyFilingPeriods(financialYear).slice(0, 1));
    setRemainingSavedMonthlyPeriods([]);
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
      const savedSchedule = editingTax.filingSchedule?.map((period) => ({
        periodFrom: period.periodFrom?.slice(0, 10) || '',
        periodTo: period.periodTo?.slice(0, 10) || '',
        filingDate: period.filingDate?.slice(0, 10) || '',
        extendedDate: period.extendedDate?.slice(0, 10) || '',
      }));
      setMonthlyFilingPeriods(
        savedSchedule?.length
          ? savedSchedule.slice(0, 1)
          : buildMonthlyFilingPeriods(editingTax.applicableFinancialYear || '2026-27').slice(0, 1)
      );
      setRemainingSavedMonthlyPeriods(savedSchedule?.slice(1) || []);
      setStatus(editingTax.status || 'Active');
      if (editingTax.applicableClientTypes) {
        setApplicableClientTypes(editingTax.applicableClientTypes);
      }
      if (editingTax.reconciliationRequired !== undefined) {
        setReconciliationRequired(editingTax.reconciliationRequired);
      }
      setReconciliationDate(
        editingTax.reconciliationDate
          ? new Date(editingTax.reconciliationDate).toISOString().split('T')[0]
          : ''
      );
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
      setIsDirty(false);
    } else {
      // Clean start - no hardcoded values
      const initialGroup = defaultTaxGroup && defaultTaxGroup !== 'All' && defaultTaxGroup !== 'All Taxes' ? defaultTaxGroup : '';
      setTaxGroup(initialGroup);
      setTaxName('');
      setDescription('');
      setFrequency('Monthly');
      setFinancialYear('2026-27');
      setMonthlyFilingPeriods(buildMonthlyFilingPeriods('2026-27').slice(0, 1));
      setRemainingSavedMonthlyPeriods([]);
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
      setReconciliationDate('');
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

    if (frequency === 'Monthly') {
      const invalidPeriod = monthlyFilingPeriods.some(
        (period) =>
          !period.periodFrom ||
          !period.periodTo ||
          !period.filingDate ||
          new Date(period.periodFrom) > new Date(period.periodTo) ||
          (period.extendedDate && new Date(period.extendedDate) < new Date(period.filingDate))
      );
      if (invalidPeriod) {
        toast.error('Check each monthly period, filing date, and any extended date.');
        return;
      }
    } else if (periodFrom && periodTo && new Date(periodFrom) > new Date(periodTo)) {
      toast.error('From Date cannot be later than To Date.');
      return;
    }

    if (
      frequency !== 'Monthly' &&
      hasExtension &&
      (!extendedDueDate || !extensionReason || extensionReason.trim().length < 3)
    ) {
      toast.error('Please enter the extended date and a valid extension reason.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Save or Update Reusable Tax Master Rule
      const isMonthly = frequency === 'Monthly';
      const completeMonthlySchedule = [
        ...monthlyFilingPeriods,
        ...remainingSavedMonthlyPeriods,
      ];
      const firstMonthlyPeriod = completeMonthlySchedule[0];
      const lastMonthlyPeriod = completeMonthlySchedule[completeMonthlySchedule.length - 1];
      const taxRulePayload = {
        taxGroup,
        taxName,
        taxCode: `TAX-${taxGroup.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        description: description || undefined,
        frequency,
        filingFrequency: frequency,
        dueDateRule: isMonthly
          ? 'Monthly Filing Schedule'
          : originalDueDate
          ? `Due on ${originalDueDate}`
          : 'Statutory Due Date',
        applicableFinancialYear: financialYear,
        applicableClientTypes,
        periodFrom: isMonthly ? firstMonthlyPeriod?.periodFrom : periodFrom || undefined,
        periodTo: isMonthly ? lastMonthlyPeriod?.periodTo : periodTo || undefined,
        filingPeriod: isMonthly ? 'Monthly Schedule' : filingPeriod || undefined,
        originalDueDate: isMonthly ? firstMonthlyPeriod?.filingDate : originalDueDate || undefined,
        extendedDueDate: isMonthly
          ? firstMonthlyPeriod?.extendedDate || null
          : hasExtension && extendedDueDate
          ? extendedDueDate
          : null,
        effectiveDueDate: isMonthly
          ? firstMonthlyPeriod?.extendedDate || firstMonthlyPeriod?.filingDate || undefined
          : effectiveDueDate || undefined,
        filingSchedule: isMonthly
          ? completeMonthlySchedule.map((period) => ({
              ...period,
              extendedDate: period.extendedDate || undefined,
            }))
          : undefined,
        actualSubmissionDate: selectedClientId ? actualSubmissionDate || null : null,
        submissionDate: selectedClientId ? actualSubmissionDate || null : null,
        submissionMethod: selectedClientId ? submissionMethod : undefined,
        filingStatus: selectedClientId ? filingStatus : 'Pending',
        acknowledgementNumber: selectedClientId ? acknowledgementNumber || undefined : undefined,
        reconciliationRequired,
        reconciliationDate: reconciliationDate || null,
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
          reconciliationStartDate: reconciliationDate || null,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden">
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
            </div>

            {/* Keep the tax group selector in place while the rest of the form opens below it. */}
            <div className="bg-light-bg/40 dark:bg-dark-cardSecondary/40 p-3.5 rounded-xl border border-light-border dark:border-dark-border">
              <label className="block text-xs font-bold text-light-textPrimary dark:text-dark-textPrimary mb-1.5 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-brand-500" />
                <span>Select Tax Group *</span>
              </label>
              <select
                required
                value={taxGroup}
                onChange={(e) => handleTaxGroupChange(e.target.value)}
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
                    if (frequency === 'Monthly') {
                      setMonthlyFilingPeriods(buildMonthlyFilingPeriods(e.target.value).slice(0, 1));
                      setRemainingSavedMonthlyPeriods([]);
                    }
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

            {frequency === 'Monthly' ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-light-textPrimary dark:text-dark-textPrimary">
                      Monthly Filing Schedule
                    </h4>
                    <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
                      Select period dates, filing dates, and any extended dates for each month.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={monthlyFilingPeriods.length >= 12}
                    onClick={() => {
                      if (remainingSavedMonthlyPeriods.length > 0) {
                        setMonthlyFilingPeriods((periods) => [
                          ...periods,
                          remainingSavedMonthlyPeriods[0],
                        ]);
                        setRemainingSavedMonthlyPeriods((periods) => periods.slice(1));
                      } else {
                        setMonthlyFilingPeriods((periods) => {
                          const nextPeriod = buildMonthlyFilingPeriods(financialYear)[periods.length];
                          return nextPeriod ? [...periods, nextPeriod] : periods;
                        });
                      }
                      setIsDirty(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-300 font-semibold hover:bg-brand-100 dark:hover:bg-brand-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add More
                  </button>
                </div>

                <div className="space-y-3">
                  {monthlyFilingPeriods.map((period, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-light-bg/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-border"
                    >
                      <h5 className="text-xs font-bold text-light-textPrimary dark:text-dark-textPrimary mb-2">
                        {period.periodFrom
                          ? new Date(`${period.periodFrom}T00:00:00`).toLocaleDateString('en-IN', {
                              month: 'long',
                              year: 'numeric',
                            })
                          : `Additional Period ${index - 11}`}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            From Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={period.periodFrom}
                            onChange={(e) => {
                              const value = e.target.value;
                              setMonthlyFilingPeriods((periods) =>
                                periods.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, periodFrom: value } : item
                                )
                              );
                              setIsDirty(true);
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            To Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={period.periodTo}
                            onChange={(e) => {
                              const value = e.target.value;
                              setMonthlyFilingPeriods((periods) =>
                                periods.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, periodTo: value } : item
                                )
                              );
                              setIsDirty(true);
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Filing Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={period.filingDate}
                            onChange={(e) => {
                              const value = e.target.value;
                              setMonthlyFilingPeriods((periods) =>
                                periods.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, filingDate: value } : item
                                )
                              );
                              setIsDirty(true);
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Extended Date
                          </label>
                          <input
                            type="date"
                            value={period.extendedDate}
                            onChange={(e) => {
                              const value = e.target.value;
                              setMonthlyFilingPeriods((periods) =>
                                periods.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, extendedDate: value } : item
                                )
                              );
                              setIsDirty(true);
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
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
