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
  Trash2,
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

interface FilingPeriodScheduleItem {
  periodFrom: string;
  periodTo: string;
  filingDate: string;
  extendedDate: string;
  submissionDate: string;
  reconciliationDate: string;
}

const BUSINESS_CATEGORY_GROUPS = [
  {
    label: 'Individual & Family',
    options: ['Individual', 'Sole Proprietorship', 'Hindu Undivided Family (HUF)'],
  },
  {
    label: 'Partnership & Non-Corporate',
    options: [
      'Partnership Firm (Registered)',
      'Partnership Firm (Unregistered)',
      'Limited Liability Partnership (LLP)',
      'Association of Persons (AOP)',
      'Body of Individuals (BOI)',
      'Joint Venture (JV)',
      'Consortium',
    ],
  },
  {
    label: 'Companies',
    options: [
      'One Person Company (OPC)',
      'Private Limited Company',
      'Public Limited Company',
      'Listed Public Company',
      'Unlisted Public Company',
      'Section 8 Company',
      'Government Company',
      'Foreign Company',
      'Subsidiary Company',
      'Holding Company',
      'Producer Company',
      'Nidhi Company',
      'Dormant Company',
    ],
  },
  {
    label: 'Trust & Non-Profit Organizations',
    options: [
      'Private Trust',
      'Public Trust',
      'Charitable Trust',
      'Religious Trust',
      'Registered Society',
      'NGO',
      'Cooperative Society',
      'Multi-State Cooperative Society',
    ],
  },
  {
    label: 'Government & Other Entities',
    options: [
      'Central Government Department',
      'State Government Department',
      'Local Authority',
      'Municipal Corporation',
      'Government Body',
      'Public Sector Undertaking (PSU)',
      'Statutory Corporation',
      'Educational Institution',
      'Religious Institution',
      'Foreign LLP',
      'Foreign Partnership Firm',
      'Branch Office (Foreign Company)',
      'Liaison Office',
      'Project Office',
    ],
  },
  {
    label: 'Other',
    options: [
      'Artificial Juridical Person (AJP)',
      'Unincorporated Association',
      'Other Legal Entity',
    ],
  },
];

const getFilingPeriodLimit = (frequency: string): number => {
  if (frequency === 'Monthly') return 12;
  if (frequency === 'Quarterly') return 4;
  if (frequency === 'Half-Yearly') return 2;
  if (frequency === 'Custom') return 12;
  return 1;
};

const formatScheduleDate = (value: string): string => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const buildFilingPeriodSchedule = (
  frequency: string,
  financialYear: string
): FilingPeriodScheduleItem[] => {
  if (!frequency) return [];
  const startYear = Number(financialYear.match(/\d{4}/)?.[0]) || new Date().getFullYear();
  const monthsPerPeriod =
    frequency === 'Monthly' ? 1 : frequency === 'Quarterly' ? 3 : frequency === 'Half-Yearly' ? 6 : 12;

  if (frequency === 'Custom') {
    return [{
      periodFrom: '',
      periodTo: '',
      filingDate: '',
      extendedDate: '',
      submissionDate: '',
      reconciliationDate: '',
    }];
  }

  return Array.from({ length: getFilingPeriodLimit(frequency) }, (_, index) => {
    const startOffset = 3 + index * monthsPerPeriod;
    const endOffset = startOffset + monthsPerPeriod - 1;
    const startDateYear = startYear + Math.floor(startOffset / 12);
    const startMonthIndex = startOffset % 12;
    const endDateYear = startYear + Math.floor(endOffset / 12);
    const endMonthIndex = endOffset % 12;
    const fromMonth = String(startMonthIndex + 1).padStart(2, '0');
    const toMonth = String(endMonthIndex + 1).padStart(2, '0');
    const lastDay = new Date(endDateYear, endMonthIndex + 1, 0).getDate();

    return {
      periodFrom: `${startDateYear}-${fromMonth}-01`,
      periodTo: `${endDateYear}-${toMonth}-${String(lastDay).padStart(2, '0')}`,
      filingDate: '',
      extendedDate: '',
      submissionDate: '',
      reconciliationDate: '',
    };
  });
};

const savedScheduleHasChanges = (
  schedule: FilingPeriodScheduleItem[],
  frequency: string,
  financialYear: string
): boolean => {
  const generatedSchedule = buildFilingPeriodSchedule(frequency, financialYear);
  return schedule.some((period, index) => {
    const generatedPeriod = generatedSchedule[index];
    return (
      !generatedPeriod ||
      period.periodFrom !== generatedPeriod.periodFrom ||
      period.periodTo !== generatedPeriod.periodTo ||
      Boolean(period.filingDate) ||
      Boolean(period.extendedDate) ||
      Boolean(period.submissionDate) ||
      Boolean(period.reconciliationDate)
    );
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
    allowedFrequencies: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One Time'],
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
    allowedFrequencies: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One Time', 'Custom'],
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
  const [frequency, setFrequency] = useState<string>('');
  const [financialYear, setFinancialYear] = useState<string>('2026-27');
  const [filingPeriodSchedule, setFilingPeriodSchedule] = useState<FilingPeriodScheduleItem[]>([]);
  const [savedFilingPeriodFlags, setSavedFilingPeriodFlags] = useState<boolean[]>([]);
  const [hasEditedFilingSchedule, setHasEditedFilingSchedule] = useState(false);
  const [applicableClientTypes, setApplicableClientTypes] = useState<string[]>([]);
  const [otherBusinessCategory, setOtherBusinessCategory] = useState('');
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
    if (
      newGroup !== taxGroup &&
      hasEditedFilingSchedule &&
      !window.confirm('Changing the Tax Group will clear the current filing schedule. Continue?')
    ) {
      return;
    }

    setTaxGroup(newGroup);
    setFrequency('');
    setFilingPeriodSchedule([]);
    setSavedFilingPeriodFlags([]);
    setHasEditedFilingSchedule(false);
    setOtherBusinessCategory('');
    setIsDirty(true);
    if (!newGroup) return;

    const matchedGroup = availableTaxGroups.find(
      (g) =>
        g.groupName.toLowerCase() === newGroup.toLowerCase() ||
        g.groupCode.toLowerCase() === newGroup.toLowerCase()
    );

    if (matchedGroup) {
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
    setFilingPeriodSchedule(buildFilingPeriodSchedule(sug.freq, financialYear).slice(0, 1));
    setSavedFilingPeriodFlags([false]);
    setHasEditedFilingSchedule(false);
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
      const editingFrequency = editingTax.frequency || editingTax.filingFrequency || '';
      const editingFinancialYear = editingTax.applicableFinancialYear || '2026-27';
      setFrequency(editingFrequency);
      setFinancialYear(editingFinancialYear);
      const savedSchedule = editingTax.filingSchedule?.map((period) => ({
        periodFrom: period.periodFrom?.slice(0, 10) || '',
        periodTo: period.periodTo?.slice(0, 10) || '',
        filingDate: period.filingDate?.slice(0, 10) || '',
        extendedDate: period.extendedDate?.slice(0, 10) || '',
        submissionDate: period.submissionDate?.slice(0, 10) || '',
        reconciliationDate: period.reconciliationDate?.slice(0, 10) || '',
      }));
      const generatedSchedule = buildFilingPeriodSchedule(editingFrequency, editingFinancialYear);
      const mergedSchedule = savedSchedule?.length
        ? savedSchedule.map((period, index) => ({
            ...(generatedSchedule[index] || {
              periodFrom: '',
              periodTo: '',
              filingDate: '',
              extendedDate: '',
              submissionDate: '',
              reconciliationDate: '',
            }),
            ...period,
          }))
        : generatedSchedule.slice(0, 1);
      setFilingPeriodSchedule(mergedSchedule);
      setSavedFilingPeriodFlags(
        mergedSchedule.map(() => Boolean(savedSchedule?.length))
      );
      setHasEditedFilingSchedule(
        savedScheduleHasChanges(savedSchedule || [], editingFrequency, editingFinancialYear)
      );
      setStatus(editingTax.status || 'Active');
      if (editingTax.applicableClientTypes) {
        setApplicableClientTypes(editingTax.applicableClientTypes);
      }
      setOtherBusinessCategory(editingTax.applicableBusinessCategoryOther || '');
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
      setFrequency('');
      setFinancialYear('2026-27');
      setFilingPeriodSchedule([]);
      setSavedFilingPeriodFlags([]);
      setHasEditedFilingSchedule(false);
      setStatus('Active');
      setApplicableClientTypes([]);
      setOtherBusinessCategory('');
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

  const reminderOptions = [30, 15, 7, 3, 1];
  const selectedBusinessCategory = applicableClientTypes[0] || '';
  const requiresCustomBusinessCategory =
    selectedBusinessCategory === 'Other Legal Entity' || selectedBusinessCategory === 'Other';
  const hasLegacyBusinessCategory =
    selectedBusinessCategory &&
    !BUSINESS_CATEGORY_GROUPS.some((group) => group.options.includes(selectedBusinessCategory));

  const toggleReminderDay = (day: number) => {
    setIsDirty(true);
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    );
  };

  const confirmScheduleRegeneration = (changedSetting: string): boolean => {
    if (!hasEditedFilingSchedule) return true;
    return window.confirm(
      `Changing ${changedSetting} will replace the current filing schedule and its edited dates. Continue?`
    );
  };

  const updateFilingPeriod = (
    index: number,
    field: keyof FilingPeriodScheduleItem,
    value: string
  ) => {
    setFilingPeriodSchedule((periods) =>
      periods.map((period, periodIndex) =>
        periodIndex === index ? { ...period, [field]: value } : period
      )
    );
    setSavedFilingPeriodFlags((flags) =>
      flags.map((isSaved, periodIndex) => (periodIndex === index ? false : isSaved))
    );
    setHasEditedFilingSchedule(true);
    setIsDirty(true);
  };

  const saveFilingPeriod = (index: number) => {
    const period = filingPeriodSchedule[index];
    if (!period?.periodFrom || !period.periodTo || !period.filingDate) {
      toast.error('Enter Period From, Period To, and Filing Date before saving this period.');
      return;
    }

    const fromDate = new Date(`${period.periodFrom}T00:00:00`);
    const toDate = new Date(`${period.periodTo}T00:00:00`);
    const filingDate = new Date(`${period.filingDate}T00:00:00`);
    const extendedDate = period.extendedDate
      ? new Date(`${period.extendedDate}T00:00:00`)
      : null;

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate >= toDate) {
      toast.error('Period From must be earlier than Period To.');
      return;
    }
    if (Number.isNaN(filingDate.getTime())) {
      toast.error('Enter a valid Filing Date.');
      return;
    }
    if (extendedDate && (Number.isNaN(extendedDate.getTime()) || extendedDate < filingDate)) {
      toast.error('Extended Due Date must be on or after the Filing Date.');
      return;
    }

    const overlapsAnotherPeriod = filingPeriodSchedule.some((otherPeriod, otherIndex) => {
      if (otherIndex === index || !otherPeriod.periodFrom || !otherPeriod.periodTo) return false;
      return (
        period.periodFrom <= otherPeriod.periodTo &&
        otherPeriod.periodFrom <= period.periodTo
      );
    });
    if (overlapsAnotherPeriod) {
      toast.error('Filing periods cannot overlap. Adjust the dates before saving this period.');
      return;
    }

    setSavedFilingPeriodFlags((flags) =>
      flags.map((isSaved, periodIndex) => (periodIndex === index ? true : isSaved))
    );
    setIsDirty(true);
    toast.success('Period saved. You can add the next period.');
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

    if (!frequency) {
      toast.error('Please select a filing frequency.');
      return;
    }

    if (
      savedFilingPeriodFlags.length !== filingPeriodSchedule.length ||
      savedFilingPeriodFlags.some((isSaved) => !isSaved)
    ) {
      toast.error('Save each filing period before saving the Tax Rule.');
      return;
    }

    if (requiresCustomBusinessCategory && !otherBusinessCategory.trim()) {
      toast.error('Please specify the other business category.');
      return;
    }

    const invalidPeriod = filingPeriodSchedule.some((period) => {
      const fromDate = new Date(`${period.periodFrom}T00:00:00`);
      const toDate = new Date(`${period.periodTo}T00:00:00`);
      const filingDate = period.filingDate ? new Date(`${period.filingDate}T00:00:00`) : null;
      const extendedDate = period.extendedDate
        ? new Date(`${period.extendedDate}T00:00:00`)
        : null;
      return (
        !period.periodFrom ||
        !period.periodTo ||
        !period.filingDate ||
        Number.isNaN(fromDate.getTime()) ||
        Number.isNaN(toDate.getTime()) ||
        fromDate >= toDate ||
        (extendedDate &&
          (Number.isNaN(extendedDate.getTime()) ||
            !filingDate ||
            extendedDate < filingDate))
      );
    });
    if (filingPeriodSchedule.length === 0 || invalidPeriod) {
      toast.error(
        'Each period needs valid From and To dates, a Filing Date, and any Extended Due Date must be on or after the Filing Date.'
      );
      return;
    }

    const orderedPeriods = [...filingPeriodSchedule].sort((a, b) =>
      a.periodFrom.localeCompare(b.periodFrom)
    );
    const hasOverlappingPeriods = orderedPeriods.some((period, index) => {
      if (index === 0) return false;
      return period.periodFrom <= orderedPeriods[index - 1].periodTo;
    });
    if (hasOverlappingPeriods) {
      toast.error('Filing periods cannot overlap. Adjust the From and To dates before saving.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Save or Update Reusable Tax Master Rule
      const completeFilingSchedule = filingPeriodSchedule;
      const firstFilingPeriod = completeFilingSchedule[0];
      const lastFilingPeriod = completeFilingSchedule[completeFilingSchedule.length - 1];
      const taxRulePayload = {
        taxGroup,
        taxName,
        taxCode: `TAX-${taxGroup.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        description: description || undefined,
        frequency,
        filingFrequency: frequency,
        dueDateRule: firstFilingPeriod?.filingDate
          ? `Due on ${firstFilingPeriod.filingDate}`
          : `${frequency} Filing Schedule`,
        applicableFinancialYear: financialYear,
        applicableClientTypes,
        applicableBusinessCategoryOther: otherBusinessCategory.trim() || undefined,
        periodFrom: firstFilingPeriod?.periodFrom || undefined,
        periodTo: lastFilingPeriod?.periodTo || undefined,
        filingPeriod: `${frequency} Schedule`,
        originalDueDate: firstFilingPeriod?.filingDate || undefined,
        extendedDueDate: firstFilingPeriod?.extendedDate || null,
        effectiveDueDate:
          firstFilingPeriod?.extendedDate || firstFilingPeriod?.filingDate || undefined,
        filingSchedule: completeFilingSchedule.map((period) => ({
          ...period,
          extendedDate: period.extendedDate || undefined,
          submissionDate: period.submissionDate || undefined,
          reconciliationDate: period.reconciliationDate || undefined,
        })),
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
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl max-w-7xl w-full flex flex-col max-h-[92vh] overflow-hidden">
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
                  Tax Name *
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

              {/* Applicable Business Category */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                    Applicable Business Category
                  </label>
                  {taxGroup === 'ROC' && (
                    <span className="text-[12px] text-amber-600 dark:text-amber-400 font-semibold">
                      (ROC applies strictly to Companies & LLPs)
                    </span>
                  )}
                </div>
                <select
                  value={selectedBusinessCategory}
                  onChange={(e) => {
                    const category = e.target.value;
                    setApplicableClientTypes(category ? [category] : []);
                    if (category !== 'Other Legal Entity' && category !== 'Other') {
                      setOtherBusinessCategory('');
                    }
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                >
                  <option value="">-- Select Business Category --</option>
                  {hasLegacyBusinessCategory && (
                    <optgroup label="Previously Saved Category">
                      <option value={selectedBusinessCategory}>{selectedBusinessCategory}</option>
                    </optgroup>
                  )}
                  {BUSINESS_CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((category) => {
                        const isRestrictedForRoc =
                          taxGroup === 'ROC' &&
                          group.label !== 'Companies' &&
                          category !== 'Limited Liability Partnership (LLP)';

                        return (
                          <option
                            key={category}
                            value={category}
                            disabled={isRestrictedForRoc}
                          >
                            {category}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
                {requiresCustomBusinessCategory && (
                  <div className="mt-3">
                    <label className="mb-1 block font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                      Specify Business Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={otherBusinessCategory}
                      onChange={(e) => {
                        setOtherBusinessCategory(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Enter the business category"
                      className="w-full rounded-xl border border-light-border bg-light-bg px-3.5 py-2.5 font-medium text-light-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-dark-border dark:bg-dark-bg dark:text-dark-textPrimary"
                    />
                  </div>
                )}
              </div>

              {/* Description / Regulatory Instructions */}
              <div className="space-y-3 sm:col-span-2">
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Description
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

              {/* Filing Frequency - Logically filtered by Tax Group! */}
              <div className="sm:col-start-1">
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Filing Frequency *
                </label>
                <select
                  required
                  value={frequency}
                  onChange={(e) => {
                    const nextFrequency = e.target.value;
                    if (
                      nextFrequency !== frequency &&
                      !confirmScheduleRegeneration('Filing Frequency')
                    ) {
                      return;
                    }
                    setFrequency(nextFrequency);
                    setFilingPeriodSchedule(
                      buildFilingPeriodSchedule(nextFrequency, financialYear).slice(0, 1)
                    );
                    setSavedFilingPeriodFlags(nextFrequency ? [false] : []);
                    setHasEditedFilingSchedule(false);
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">-- Select Filing Frequency --</option>
                  {currentConfig.allowedFrequencies.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Financial Year */}
              <div className="sm:col-start-2">
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Financial Year
                </label>
                <select
                  value={financialYear}
                  onChange={(e) => {
                    const nextFinancialYear = e.target.value;
                    if (
                      nextFinancialYear !== financialYear &&
                      !confirmScheduleRegeneration('Financial Year')
                    ) {
                      return;
                    }
                    setFinancialYear(nextFinancialYear);
                    if (frequency) {
                      setFilingPeriodSchedule(
                        buildFilingPeriodSchedule(frequency, nextFinancialYear).slice(0, 1)
                      );
                      setSavedFilingPeriodFlags([false]);
                      setHasEditedFilingSchedule(false);
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

          </div>

          {frequency && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-light-border/60 dark:border-dark-border/60">
                <span className="w-2 h-2 rounded-full bg-status-orange" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-light-textPrimary dark:text-dark-textPrimary">
                  Section B: Timeline & Due Date
                </h3>
              </div>

              <div className="space-y-3">
                {filingPeriodSchedule.some((_, index) => savedFilingPeriodFlags[index]) && (
                  <div className="overflow-x-auto rounded-xl border border-light-border dark:border-dark-border">
                    <table className="w-full min-w-[1120px] text-left text-xs">
                      <thead className="bg-light-bg/70 dark:bg-dark-bg/70 text-light-textMuted dark:text-dark-textMuted">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold">Period</th>
                          <th className="px-3 py-2.5 font-semibold">Period From</th>
                          <th className="px-3 py-2.5 font-semibold">Period To</th>
                          <th className="px-3 py-2.5 font-semibold">Filing Date</th>
                          <th className="px-3 py-2.5 font-semibold">Submission Date</th>
                          <th className="px-3 py-2.5 font-semibold">Reconciliation Date</th>
                          <th className="px-3 py-2.5 font-semibold">Extended Due Date</th>
                          <th className="px-3 py-2.5 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-border dark:divide-dark-border">
                        {filingPeriodSchedule.map((period, index) => {
                          if (!savedFilingPeriodFlags[index]) return null;
                          const periodTitle =
                            frequency === 'Monthly' && period.periodFrom
                              ? new Date(`${period.periodFrom}T00:00:00`).toLocaleDateString('en-IN', {
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : `Period ${index + 1}`;

                          return (
                            <tr key={index} className="bg-white dark:bg-dark-card">
                              <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                                {periodTitle}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-light-textSecondary dark:text-dark-textSecondary">
                                {formatScheduleDate(period.periodFrom)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-light-textSecondary dark:text-dark-textSecondary">
                                {formatScheduleDate(period.periodTo)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-light-textPrimary dark:text-dark-textPrimary">
                                {formatScheduleDate(period.filingDate)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-light-textSecondary dark:text-dark-textSecondary">
                                {formatScheduleDate(period.submissionDate)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-light-textSecondary dark:text-dark-textSecondary">
                                {formatScheduleDate(period.reconciliationDate)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-light-textSecondary dark:text-dark-textSecondary">
                                {formatScheduleDate(period.extendedDate)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSavedFilingPeriodFlags((flags) =>
                                        flags.map((isSaved, periodIndex) =>
                                          periodIndex === index ? false : isSaved
                                        )
                                      );
                                      setIsDirty(true);
                                    }}
                                    className="rounded-md px-2 py-1 font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
                                  >
                                    Edit
                                  </button>
                                  {index > 0 && index === filingPeriodSchedule.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFilingPeriodSchedule((periods) =>
                                          periods.filter((_, periodIndex) => periodIndex !== index)
                                        );
                                        setSavedFilingPeriodFlags((flags) => flags.slice(0, -1));
                                        setHasEditedFilingSchedule(true);
                                        setIsDirty(true);
                                      }}
                                      className="rounded-md px-2 py-1 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="space-y-3">
                  {filingPeriodSchedule.map((period, index) => (
                    savedFilingPeriodFlags[index] ? null : (
                    <div
                      key={index}
                      className="p-2.5 rounded-xl bg-light-bg/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-border"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h5 className="text-xs font-bold text-light-textPrimary dark:text-dark-textPrimary">
                          {period.periodFrom && period.periodTo
                            ? frequency === 'Monthly'
                              ? new Date(`${period.periodFrom}T00:00:00`).toLocaleDateString('en-IN', {
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : `Period ${index + 1} (${period.periodFrom} to ${period.periodTo})`
                          : `Period ${index + 1}`}
                        </h5>
                        {index > 0 && index === filingPeriodSchedule.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilingPeriodSchedule((periods) =>
                                periods.filter((_, periodIndex) => periodIndex !== index)
                              );
                              setSavedFilingPeriodFlags((flags) => flags.slice(0, -1));
                              setHasEditedFilingSchedule(true);
                              setIsDirty(true);
                            }}
                            aria-label={`Remove filing period ${index + 1}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Period From *
                          </label>
                          <input
                            type="date"
                            required
                            value={period.periodFrom}
                            onChange={(e) => updateFilingPeriod(index, 'periodFrom', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Period To *
                          </label>
                          <input
                            type="date"
                            required
                            value={period.periodTo}
                            min={period.periodFrom || undefined}
                            onChange={(e) => updateFilingPeriod(index, 'periodTo', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Filing Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={period.filingDate}
                            onChange={(e) => updateFilingPeriod(index, 'filingDate', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Submission Date
                          </label>
                          <input
                            type="date"
                            value={period.submissionDate}
                            onChange={(e) => updateFilingPeriod(index, 'submissionDate', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Reconciliation Date
                          </label>
                          <input
                            type="date"
                            value={period.reconciliationDate}
                            onChange={(e) => updateFilingPeriod(index, 'reconciliationDate', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Extended Due Date
                          </label>
                          <input
                            type="date"
                            value={period.extendedDate}
                            onChange={(e) => updateFilingPeriod(index, 'extendedDate', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveFilingPeriod(index)}
                          disabled={savedFilingPeriodFlags[index]}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-default ${
                            savedFilingPeriodFlags[index]
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                          }`}
                        >
                          {savedFilingPeriodFlags[index] ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Saved
                            </>
                          ) : (
                            'Save Period'
                          )}
                        </button>
                      </div>
                    </div>
                    )
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={
                      filingPeriodSchedule.length >= getFilingPeriodLimit(frequency) ||
                      savedFilingPeriodFlags.length !== filingPeriodSchedule.length ||
                      savedFilingPeriodFlags.some((isSaved) => !isSaved)
                    }
                    onClick={() => {
                      setFilingPeriodSchedule((periods) => {
                        const generatedPeriod = buildFilingPeriodSchedule(
                          frequency,
                          financialYear
                        )[periods.length];
                        return [
                          ...periods,
                          generatedPeriod || {
                            periodFrom: '',
                            periodTo: '',
                            filingDate: '',
                            extendedDate: '',
                            submissionDate: '',
                            reconciliationDate: '',
                          },
                        ];
                      });
                      setSavedFilingPeriodFlags((flags) => [...flags, false]);
                      setHasEditedFilingSchedule(true);
                      setIsDirty(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-300 font-semibold hover:bg-brand-100 dark:hover:bg-brand-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add More Filing Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
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
            ) : !frequency ? (
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Please select a filing frequency
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
              disabled={submitting || !taxGroup || !frequency || availableTaxGroups.length === 0}
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
