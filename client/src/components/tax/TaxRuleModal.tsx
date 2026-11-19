import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Plus,
  AlertCircle,
  Layers,
  FolderTree,
  Check,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { TaxMasterItem, TaxGroupItem } from '../../types';
import { PeriodDueDatePicker } from './PeriodDueDatePicker';

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
  extensionReason: string;
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

const hasFixedFinancialYearPeriods = (frequency: string): boolean =>
  ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'].includes(frequency);

const formatScheduleDate = (value: string): string => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getFilingPeriodTitle = (
  frequency: string,
  index: number,
  period: Pick<FilingPeriodScheduleItem, 'periodFrom' | 'periodTo'>,
  financialYear: string
): string => {
  if (!period.periodFrom || !period.periodTo) return `Period ${index + 1}`;
  if (frequency === 'Monthly') {
    return new Date(`${period.periodFrom}T00:00:00`).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  }
  if (frequency === 'Quarterly' || frequency === 'Half-Yearly') {
    const fromMonth = new Date(`${period.periodFrom}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' });
    const toMonth = new Date(`${period.periodTo}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' });
    const prefix = frequency === 'Quarterly' ? 'Q' : 'H';
    return `${prefix}${index + 1} (${fromMonth}–${toMonth})`;
  }
  if (frequency === 'Yearly') return `FY ${financialYear}`;
  return `Period ${index + 1}`;
};

const shiftScheduleDate = (value: string | undefined, days: number): string | undefined => {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const getFinancialYearDateBounds = (financialYear: string) => {
  const match = financialYear.match(/(\d{4})\s*-\s*(\d{2}|\d{4})/);
  const startYear = Number(match?.[1] || financialYear.match(/\d{4}/)?.[0]);
  if (!startYear) return undefined;

  const endYearToken = match?.[2];
  let endYear = endYearToken
    ? Number(endYearToken.length === 2
        ? `${String(startYear).slice(0, 2)}${endYearToken}`
        : endYearToken)
    : startYear + 1;
  if (endYear <= startYear) endYear += 100;

  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`,
  };
};

const previousScheduleDate = (values: Array<string | undefined>): string | undefined => {
  const firstDate = values.filter((value): value is string => Boolean(value)).sort()[0];
  return shiftScheduleDate(firstDate, -1);
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
      extensionReason: '',
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
      extensionReason: '',
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
      Boolean(period.extensionReason) ||
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
  },
  TDS: {
    defaultFrequency: 'Quarterly',
    allowedFrequencies: ['Quarterly'],
    defaultClientTypes: ['Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: [
      'TDS Deducted in Books vs Challan 281 Paid',
      'TDS in Books vs Form 26AS / TRACES',
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
  },
  ROC: {
    defaultFrequency: 'Yearly',
    allowedFrequencies: ['Yearly', 'One Time'],
    defaultClientTypes: ['Company', 'LLP'], // ONLY Corporate!
    reconciliationTypes: [
      'Audited Financial Statements vs Form AOC-4',
      'Secretarial Records vs Form MGT-7',
    ],
  },
  'PF / ESI': {
    defaultFrequency: 'Monthly',
    allowedFrequencies: ['Monthly'],
    defaultClientTypes: ['Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: ['Payroll Register vs ECR Challan Paid'],
  },
  Other: {
    defaultFrequency: 'Monthly',
    allowedFrequencies: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One Time', 'Custom'],
    defaultClientTypes: ['Individual', 'Business', 'Company', 'Partnership', 'LLP', 'Trust', 'Other'],
    reconciliationTypes: ['Bank Reconciliation', 'Books vs Third-Party Statement', 'Custom Reconciliation'],
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
  const [financialYears, setFinancialYears] = useState<any[]>([]);
  const [availableTaxGroups, setAvailableTaxGroups] = useState<TaxGroupItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [scrollToScheduleIndex, setScrollToScheduleIndex] = useState<number | null>(null);
  const scheduleCardRefs = useRef<Record<number, HTMLDivElement | null>>({});

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
  const [isBusinessCategoryOpen, setIsBusinessCategoryOpen] = useState(false);
  const businessCategoryPickerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Active');
  const financialYearDateBounds = getFinancialYearDateBounds(financialYear);

  useEffect(() => {
    if (scrollToScheduleIndex === null) return;
    const scheduleCard = scheduleCardRefs.current[scrollToScheduleIndex];
    scheduleCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setScrollToScheduleIndex(null);
  }, [scrollToScheduleIndex, filingPeriodSchedule.length]);

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
  const submittedBy = 'Tosif Raza';
  const filingRemarks = '';

  // Section D: Reconciliation Management
  const [reconciliationRequired, setReconciliationRequired] = useState<boolean>(false);
  const [reconciliationDate, setReconciliationDate] = useState<string>('');
  const [reconciliationType, setReconciliationType] = useState<string>(
    'GSTR-2B vs Purchase Register'
  );
  const reconciliationStatus = 'Pending';
  const [amountAsPerBooks, setAmountAsPerBooks] = useState<number | string>(0);
  const [amountAsPerStatement, setAmountAsPerStatement] = useState<number | string>(0);
  const reconciledBy = '';
  const reconciliationRemarks = '';

  // Section E: Reminders & Compliance
  const reminderEnabled = true;
  const reminderDays = [7, 3, 1];
  const [priority, setPriority] = useState<string>('Medium');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const approvalRequired = false;
  const internalNotes = '';

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
        extensionReason: period.extensionReason || '',
        submissionDate: period.submissionDate?.slice(0, 10) || '',
        reconciliationDate: period.reconciliationDate?.slice(0, 10) || '',
      }));
      const generatedSchedule = buildFilingPeriodSchedule(editingFrequency, editingFinancialYear);
      const mergedSchedule = savedSchedule?.length
        ? savedSchedule
            .slice(0, getFilingPeriodLimit(editingFrequency))
            .map((period, index) => {
              const generatedPeriod = generatedSchedule[index];
              return {
                ...(generatedPeriod || {
                  periodFrom: '',
                  periodTo: '',
                  filingDate: '',
                  extendedDate: '',
                  extensionReason: '',
                  submissionDate: '',
                  reconciliationDate: '',
                }),
                ...period,
              };
            })
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
      setShowDiscardConfirmation(false);
    }
  }, [editingTax, defaultTaxGroup, isOpen]);

  useEffect(() => {
    if (!isBusinessCategoryOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!businessCategoryPickerRef.current?.contains(event.target as Node)) {
        setIsBusinessCategoryOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isBusinessCategoryOpen]);

  if (!isOpen) return null;

  const selectedBusinessCategory = applicableClientTypes[0] || '';
  const requiresCustomBusinessCategory =
    selectedBusinessCategory === 'Other Legal Entity' || selectedBusinessCategory === 'Other';
  const hasLegacyBusinessCategory =
    selectedBusinessCategory &&
    !BUSINESS_CATEGORY_GROUPS.some((group) => group.options.includes(selectedBusinessCategory));

  const selectBusinessCategory = (category: string) => {
    setApplicableClientTypes(category ? [category] : []);
    if (category !== 'Other Legal Entity' && category !== 'Other') {
      setOtherBusinessCategory('');
    }
    setIsBusinessCategoryOpen(false);
    setIsDirty(true);
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
    const period = filingPeriodSchedule[index];
    if (!period) return;
    const fixedPeriods = hasFixedFinancialYearPeriods(frequency);
    const expectedPeriods = fixedPeriods
      ? buildFilingPeriodSchedule(frequency, financialYear)
      : [];

    if (field === 'periodFrom' && value) {
      if (period.periodTo && value >= period.periodTo) {
        toast.error('Period From must be earlier than Period To.');
        return;
      }
      if (
        fixedPeriods &&
        financialYearDateBounds &&
        (value < financialYearDateBounds.start || value > financialYearDateBounds.end)
      ) {
        toast.error('Period From must be within the selected Financial Year.');
        return;
      }
      if (fixedPeriods && index > 0) {
        const previousPeriod = filingPeriodSchedule[index - 1];
        const previousPeriodTo = shiftScheduleDate(value, -1);
        const previousExpected = expectedPeriods[index - 1];
        const previousDueDates = [
          previousPeriod.filingDate,
          previousPeriod.submissionDate,
          previousPeriod.reconciliationDate,
        ].filter(Boolean);
        if (
          !previousPeriodTo ||
          previousPeriodTo <= previousPeriod.periodFrom ||
          (previousExpected && previousPeriodTo > previousExpected.periodTo) ||
          previousDueDates.some((date) => previousPeriodTo >= date)
        ) {
          toast.error('This period must start after the previous period and its due dates.');
          return;
        }
      }
    }
    if (field === 'periodTo' && value) {
      if (period.periodFrom && value <= period.periodFrom) {
        toast.error('Period To must be later than Period From.');
        return;
      }
      if (
        financialYearDateBounds &&
        (value < financialYearDateBounds.start || value > financialYearDateBounds.end)
      ) {
        toast.error('Period To must be within the selected Financial Year.');
        return;
      }
      const expectedPeriod = expectedPeriods[index];
      if (fixedPeriods && expectedPeriod && value > expectedPeriod.periodTo) {
        toast.error(`This period cannot end after ${formatScheduleDate(expectedPeriod.periodTo)}.`);
        return;
      }
      const laterDates = [period.filingDate, period.submissionDate, period.reconciliationDate]
        .filter(Boolean);
      if (laterDates.some((date) => value >= date)) {
        toast.error('Period To must be earlier than the filing, submission, and reconciliation dates.');
        return;
      }
      const nextPeriod = filingPeriodSchedule[index + 1];
      if (fixedPeriods && nextPeriod) {
        const nextPeriodFrom = shiftScheduleDate(value, 1);
        if (!nextPeriodFrom || nextPeriodFrom >= nextPeriod.periodTo) {
          toast.error('Leave at least one valid day for the next period.');
          return;
        }
      }
    }
    if (field === 'filingDate' && value) {
      if (period.periodTo && value <= period.periodTo) {
        toast.error('Filing Date must be after Period To.');
        return;
      }
      if (period.extendedDate && value > period.extendedDate) {
        toast.error('Filing Date must be on or before Extended Due Date.');
        return;
      }
    }
    if ((field === 'submissionDate' || field === 'reconciliationDate') && value && period.periodTo && value <= period.periodTo) {
      toast.error(`${field === 'submissionDate' ? 'Submission' : 'Reconciliation'} Date must be after Period To.`);
      return;
    }
    if (field === 'extendedDate' && value && period.filingDate && value < period.filingDate) {
      toast.error('Extended Due Date must be on or after Filing Date.');
      return;
    }

    const changedIndexes = new Set([index]);
    if (fixedPeriods && field === 'periodFrom' && index > 0) {
      changedIndexes.add(index - 1);
    }
    if (fixedPeriods && field === 'periodTo' && index + 1 < filingPeriodSchedule.length) {
      changedIndexes.add(index + 1);
    }
    setFilingPeriodSchedule((periods) => {
      const nextPeriods = [...periods];
      if (fixedPeriods && field === 'periodFrom' && index > 0) {
        const previousPeriodTo = shiftScheduleDate(value, -1);
        if (previousPeriodTo) {
          nextPeriods[index - 1] = {
            ...nextPeriods[index - 1],
            periodTo: previousPeriodTo,
          };
        }
      }
      nextPeriods[index] = {
        ...nextPeriods[index],
        [field]: value,
        ...(field === 'extendedDate' && !value ? { extensionReason: '' } : {}),
      };
      if (fixedPeriods && field === 'periodTo' && nextPeriods[index + 1]) {
        const nextPeriodFrom = shiftScheduleDate(value, 1);
        if (nextPeriodFrom) {
          nextPeriods[index + 1] = {
            ...nextPeriods[index + 1],
            periodFrom: nextPeriodFrom,
          };
        }
      }
      return nextPeriods;
    });
    setSavedFilingPeriodFlags((flags) =>
      flags.map((isSaved, periodIndex) => (changedIndexes.has(periodIndex) ? false : isSaved))
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
    if (hasFixedFinancialYearPeriods(frequency)) {
      const expectedPeriod = buildFilingPeriodSchedule(frequency, financialYear)[index];
      if (
        !expectedPeriod ||
        period.periodFrom !== expectedPeriod.periodFrom ||
        period.periodTo !== expectedPeriod.periodTo
      ) {
        toast.error('This period must match the selected frequency and Financial Year.');
        return;
      }
    }
    if (period.extendedDate && !period.extensionReason.trim()) {
      toast.error('Enter a reason for the extended due date.');
      return;
    }

    const fromDate = new Date(`${period.periodFrom}T00:00:00`);
    const toDate = new Date(`${period.periodTo}T00:00:00`);
    const filingDate = new Date(`${period.filingDate}T00:00:00`);
    const submissionDate = period.submissionDate
      ? new Date(`${period.submissionDate}T00:00:00`)
      : null;
    const reconciliationDate = period.reconciliationDate
      ? new Date(`${period.reconciliationDate}T00:00:00`)
      : null;
    const extendedDate = period.extendedDate
      ? new Date(`${period.extendedDate}T00:00:00`)
      : null;

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate >= toDate) {
      toast.error('Period From must be earlier than Period To.');
      return;
    }
    if (
      financialYearDateBounds &&
      (period.periodTo < financialYearDateBounds.start || period.periodTo > financialYearDateBounds.end)
    ) {
      toast.error('Period To must be within the selected Financial Year.');
      return;
    }
    if (Number.isNaN(filingDate.getTime())) {
      toast.error('Enter a valid Filing Date.');
      return;
    }
    if (filingDate <= toDate) {
      toast.error('Filing Date must be after Period To.');
      return;
    }
    if (submissionDate && (Number.isNaN(submissionDate.getTime()) || submissionDate <= toDate)) {
      toast.error('Submission Date must be after Period To.');
      return;
    }
    if (reconciliationDate && (Number.isNaN(reconciliationDate.getTime()) || reconciliationDate <= toDate)) {
      toast.error('Reconciliation Date must be after Period To.');
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
      setShowDiscardConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowDiscardConfirmation(false);
    setIsDirty(false);
    onClose();
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

    if (requiresCustomBusinessCategory && !otherBusinessCategory.trim()) {
      toast.error('Please specify the other business category.');
      return;
    }

    const invalidPeriod = filingPeriodSchedule.some((period) => {
      const fromDate = new Date(`${period.periodFrom}T00:00:00`);
      const toDate = new Date(`${period.periodTo}T00:00:00`);
      const filingDate = period.filingDate ? new Date(`${period.filingDate}T00:00:00`) : null;
      const submissionDate = period.submissionDate
        ? new Date(`${period.submissionDate}T00:00:00`)
        : null;
      const reconciliationDate = period.reconciliationDate
        ? new Date(`${period.reconciliationDate}T00:00:00`)
        : null;
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
        Boolean(
          financialYearDateBounds &&
          (period.periodTo < financialYearDateBounds.start ||
            period.periodTo > financialYearDateBounds.end)
        ) ||
        !filingDate ||
        Number.isNaN(filingDate.getTime()) ||
        filingDate <= toDate ||
        (period.extendedDate && !period.extensionReason.trim()) ||
        (submissionDate &&
          (Number.isNaN(submissionDate.getTime()) || submissionDate <= toDate)) ||
        (reconciliationDate &&
          (Number.isNaN(reconciliationDate.getTime()) || reconciliationDate <= toDate)) ||
        (extendedDate &&
          (Number.isNaN(extendedDate.getTime()) ||
            !filingDate ||
            extendedDate < filingDate))
      );
    });
    if (filingPeriodSchedule.length === 0 || invalidPeriod) {
      toast.error(
        'Each period needs valid dates: Period From before Period To, Period To within the Financial Year, filing/submission/reconciliation after Period To, and any Extended Due Date on or after Filing Date.'
      );
      return;
    }
    if (filingPeriodSchedule.length > getFilingPeriodLimit(frequency)) {
      toast.error(`A ${frequency} schedule cannot have more than ${getFilingPeriodLimit(frequency)} periods.`);
      return;
    }
    if (
      hasFixedFinancialYearPeriods(frequency) &&
      filingPeriodSchedule.some((period, index) => {
        const expectedPeriod = buildFilingPeriodSchedule(frequency, financialYear)[index];
        return (
          !expectedPeriod ||
          period.periodFrom !== expectedPeriod.periodFrom ||
          period.periodTo !== expectedPeriod.periodTo
        );
      })
    ) {
      toast.error('Reporting periods are fixed to the selected frequency and Financial Year.');
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
        extendedDueDate:
          firstFilingPeriod?.extendedDate
            ? firstFilingPeriod.extendedDate
            : null,
        effectiveDueDate:
          firstFilingPeriod?.extendedDate ||
          firstFilingPeriod?.filingDate ||
          undefined,
        filingSchedule: completeFilingSchedule.map((period) => ({
          ...period,
          extendedDate: period.extendedDate || undefined,
          extensionReason: period.extendedDate ? period.extensionReason.trim() || undefined : undefined,
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
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl w-[calc(100vw-24px)] max-w-[1800px] flex flex-col max-h-[94vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-card px-6 py-4 border-b border-light-border dark:border-dark-border flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-bold text-light-textPrimary dark:text-dark-textPrimary">
              {editingTax ? 'Edit Tax Rule & Compliance' : 'Add New Tax Rule & Compliance'}
            </h2>
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
              <label className="block text-xs font-normal text-light-textPrimary dark:text-dark-textPrimary mb-1.5 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-brand-500" />
                <span>Select Tax Group *</span>
              </label>
              <select
                required
                value={taxGroup}
                onChange={(e) => handleTaxGroupChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary font-normal focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer text-xs transition-all shadow-2xs"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-normal text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all"
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
                <label className="block font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-normal"
                />
              </div>

              {/* Applicable Business Category */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-normal text-light-textPrimary dark:text-dark-textPrimary">
                    Applicable Business Category
                  </label>
                  {taxGroup === 'ROC' && (
                    <span className="text-[12px] text-amber-600 dark:text-amber-400 font-normal">
                      (ROC applies strictly to Companies & LLPs)
                    </span>
                  )}
                </div>
                <div
                  ref={businessCategoryPickerRef}
                  className="relative"
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setIsBusinessCategoryOpen(false);
                  }}
                >
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isBusinessCategoryOpen}
                    onClick={() => setIsBusinessCategoryOpen((open) => !open)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-light-border bg-light-bg px-3.5 py-2.5 text-left text-light-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-dark-border dark:bg-dark-bg dark:text-dark-textPrimary"
                  >
                    <span className="truncate text-xs font-normal">
                      {selectedBusinessCategory || '-- Select Business Category --'}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isBusinessCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isBusinessCategoryOpen && (
                    <div
                      role="listbox"
                      aria-label="Applicable Business Category"
                      className="absolute left-0 right-0 top-full z-[70] mt-1 max-h-64 overflow-y-auto rounded-xl border border-light-border bg-white py-1 shadow-xl dark:border-dark-border dark:bg-dark-card"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={!selectedBusinessCategory}
                        onClick={() => selectBusinessCategory('')}
                        className="w-full px-3.5 py-2 text-left text-xs font-normal text-light-textMuted hover:bg-light-bg dark:text-dark-textMuted dark:hover:bg-dark-cardSecondary"
                      >
                        -- Select Business Category --
                      </button>

                      {hasLegacyBusinessCategory && (
                        <div role="group" aria-label="Previously Saved Category">
                          <div className="sticky top-0 bg-light-bg px-3.5 py-1.5 text-[11px] font-medium text-light-textMuted dark:bg-dark-cardSecondary dark:text-dark-textMuted">
                            Previously Saved Category
                          </div>
                          <button
                            type="button"
                            role="option"
                            aria-selected="true"
                            onClick={() => selectBusinessCategory(selectedBusinessCategory)}
                            className="w-full px-3.5 py-2 text-left text-xs font-normal text-light-textPrimary hover:bg-light-bg dark:text-dark-textPrimary dark:hover:bg-dark-cardSecondary"
                          >
                            {selectedBusinessCategory}
                          </button>
                        </div>
                      )}

                      {BUSINESS_CATEGORY_GROUPS.map((group) => (
                        <div key={group.label} role="group" aria-label={group.label}>
                          <div className="sticky top-0 bg-light-bg px-3.5 py-1.5 text-[11px] font-medium text-light-textMuted dark:bg-dark-cardSecondary dark:text-dark-textMuted">
                            {group.label}
                          </div>
                          {group.options.map((category) => {
                            const isRestrictedForRoc =
                              taxGroup === 'ROC' &&
                              group.label !== 'Companies' &&
                              category !== 'Limited Liability Partnership (LLP)';

                            return (
                              <button
                                key={category}
                                type="button"
                                role="option"
                                aria-selected={selectedBusinessCategory === category}
                                disabled={isRestrictedForRoc}
                                onClick={() => selectBusinessCategory(category)}
                                className="w-full px-3.5 py-2 text-left text-xs font-normal text-light-textPrimary hover:bg-light-bg disabled:cursor-not-allowed disabled:opacity-40 dark:text-dark-textPrimary dark:hover:bg-dark-cardSecondary"
                              >
                                {category}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {requiresCustomBusinessCategory && (
                  <div className="mt-3">
                    <label className="mb-1 block font-normal text-light-textPrimary dark:text-dark-textPrimary">
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
                      className="w-full rounded-xl border border-light-border bg-light-bg px-3.5 py-2.5 font-normal text-light-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-dark-border dark:bg-dark-bg dark:text-dark-textPrimary"
                    />
                  </div>
                )}
              </div>

              {/* Description / Regulatory Instructions */}
              <div className="space-y-3 sm:col-span-2">
                <label className="block font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
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
                  className="w-full px-3.5 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none font-normal"
                />
              </div>

              {/* Filing Frequency - Logically filtered by Tax Group! */}
              <div className="sm:col-start-1">
                <label className="block font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
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
                <label className="block font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
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
                          <th className="px-3 py-2.5 font-bold">Period</th>
                          <th className="px-3 py-2.5 font-bold">Period From</th>
                          <th className="px-3 py-2.5 font-bold">Period To</th>
                          <th className="px-3 py-2.5 font-bold">Filing Date</th>
                          <th className="px-3 py-2.5 font-bold">Submission Date</th>
                          <th className="px-3 py-2.5 font-bold">Reconciliation Date</th>
                          <th className="px-3 py-2.5 font-bold">Extended Due Date / Reason</th>
                          <th className="px-3 py-2.5 text-right font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-border dark:divide-dark-border">
                        {filingPeriodSchedule.map((period, index) => {
                          if (!savedFilingPeriodFlags[index]) return null;
                          const periodTitle = getFilingPeriodTitle(
                            frequency,
                            index,
                            period,
                            financialYear
                          );

                          return (
                            <tr key={index} className="bg-white dark:bg-dark-card">
                              <td className="whitespace-nowrap px-3 py-2.5 font-normal text-light-textPrimary dark:text-dark-textPrimary">
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
                              <td className="max-w-[240px] px-3 py-2.5 text-light-textSecondary dark:text-dark-textSecondary">
                                {period.extendedDate ? (
                                  <div className="space-y-0.5">
                                    <div className="whitespace-nowrap">{formatScheduleDate(period.extendedDate)}</div>
                                    {period.extensionReason && (
                                      <div className="whitespace-normal text-[11px] text-light-textMuted dark:text-dark-textMuted">
                                        Reason: {period.extensionReason}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  '—'
                                )}
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
                                    className="rounded-md px-2 py-1 font-normal text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
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
                                        setScrollToScheduleIndex(null);
                                        setHasEditedFilingSchedule(true);
                                        setIsDirty(true);
                                      }}
                                      className="rounded-md px-2 py-1 font-normal text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
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
                      ref={(element) => {
                        scheduleCardRefs.current[index] = element;
                      }}
                      className="p-2.5 rounded-xl bg-light-bg/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-border"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h5 className="text-xs font-bold text-light-textPrimary dark:text-dark-textPrimary">
                          {getFilingPeriodTitle(frequency, index, period, financialYear)}
                        </h5>
                        {index > 0 && index === filingPeriodSchedule.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilingPeriodSchedule((periods) =>
                                periods.filter((_, periodIndex) => periodIndex !== index)
                              );
                              setSavedFilingPeriodFlags((flags) => flags.slice(0, -1));
                              setScrollToScheduleIndex(null);
                              setHasEditedFilingSchedule(true);
                              setIsDirty(true);
                            }}
                            aria-label={`Remove filing period ${index + 1}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-normal text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                      <div className={`grid grid-cols-1 sm:grid-cols-2 ${period.extendedDate ? 'xl:grid-cols-8' : 'xl:grid-cols-6'} gap-2`}>
                        <div>
                          <label className="block text-xs font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Period From *
                          </label>
                          <input
                            type="date"
                            required
                            value={period.periodFrom}
                            min={hasFixedFinancialYearPeriods(frequency)
                              ? buildFilingPeriodSchedule(frequency, financialYear)[index]?.periodFrom
                              : undefined}
                            max={hasFixedFinancialYearPeriods(frequency)
                              ? buildFilingPeriodSchedule(frequency, financialYear)[index]?.periodFrom
                              : shiftScheduleDate(period.periodTo, -1)}
                            onChange={(e) => updateFilingPeriod(index, 'periodFrom', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Period To *
                          </label>
                          <input
                            type="date"
                            required
                            value={period.periodTo}
                            min={hasFixedFinancialYearPeriods(frequency)
                              ? buildFilingPeriodSchedule(frequency, financialYear)[index]?.periodTo
                              : (() => {
                                  const afterFrom = shiftScheduleDate(period.periodFrom, 1);
                                  const financialYearStart = financialYearDateBounds?.start;
                                  if (!afterFrom) return financialYearStart;
                                  if (!financialYearStart || afterFrom > financialYearStart) return afterFrom;
                                  return financialYearStart;
                                })()}
                            max={hasFixedFinancialYearPeriods(frequency)
                              ? buildFilingPeriodSchedule(frequency, financialYear)[index]?.periodTo
                              : (() => {
                                  const beforeDueDates = previousScheduleDate([
                                    period.filingDate,
                                    period.submissionDate,
                                    period.reconciliationDate,
                                  ]);
                                  const financialYearEnd = financialYearDateBounds?.end;
                                  if (!beforeDueDates) return financialYearEnd;
                                  if (!financialYearEnd || beforeDueDates < financialYearEnd) return beforeDueDates;
                                  return financialYearEnd;
                                })()}
                            onChange={(e) => updateFilingPeriod(index, 'periodTo', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Filing Date *
                          </label>
                          <PeriodDueDatePicker
                            value={period.filingDate}
                            periodTo={period.periodTo}
                            max={period.extendedDate || undefined}
                            onChange={(value) => updateFilingPeriod(index, 'filingDate', value)}
                            ariaLabel="Filing Date"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Submission Date
                          </label>
                          <PeriodDueDatePicker
                            value={period.submissionDate}
                            periodTo={period.periodTo}
                            onChange={(value) => updateFilingPeriod(index, 'submissionDate', value)}
                            ariaLabel="Submission Date"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-normal mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Reconciliation Date
                          </label>
                          <PeriodDueDatePicker
                            value={period.reconciliationDate}
                            periodTo={period.periodTo}
                            onChange={(value) => updateFilingPeriod(index, 'reconciliationDate', value)}
                            ariaLabel="Reconciliation Date"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-light-textPrimary dark:text-dark-textPrimary">
                            Extended Due Date
                          </label>
                          <input
                            type="date"
                            value={period.extendedDate}
                            min={period.filingDate || undefined}
                            onChange={(e) => updateFilingPeriod(index, 'extendedDate', e.target.value)}
                            className="w-full rounded-lg border border-light-border bg-white px-2 py-1.5 text-xs text-light-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-dark-border dark:bg-dark-card dark:text-dark-textPrimary"
                          />
                        </div>
                        {period.extendedDate && (
                          <div className="xl:col-span-2">
                            <label className="mb-1 block text-xs text-light-textPrimary dark:text-dark-textPrimary">
                              Reason for Extension *
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={period.extensionReason}
                              onChange={(e) => updateFilingPeriod(index, 'extensionReason', e.target.value)}
                              placeholder="Explain why the filing deadline was extended..."
                              className="w-full resize-y rounded-lg border border-light-border bg-white px-2.5 py-2 text-xs text-light-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-dark-border dark:bg-dark-card dark:text-dark-textPrimary"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveFilingPeriod(index)}
                          disabled={savedFilingPeriodFlags[index]}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-normal transition-colors disabled:cursor-default ${
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-light-textMuted dark:text-dark-textMuted">
                    {filingPeriodSchedule.length} of {getFilingPeriodLimit(frequency)} periods added.
                    {filingPeriodSchedule.length >= getFilingPeriodLimit(frequency)
                      ? ` Maximum reached for ${frequency}.`
                      : ` ${frequency} periods follow the selected Financial Year.`}
                  </p>
                  <button
                    type="button"
                    disabled={
                      filingPeriodSchedule.length >= getFilingPeriodLimit(frequency) ||
                      savedFilingPeriodFlags.length !== filingPeriodSchedule.length ||
                      savedFilingPeriodFlags.some((isSaved) => !isSaved)
                    }
                    onClick={() => {
                      if (filingPeriodSchedule.length >= getFilingPeriodLimit(frequency)) return;
                      const newPeriodIndex = filingPeriodSchedule.length;
                      setFilingPeriodSchedule((periods) => {
                        const generatedPeriod = buildFilingPeriodSchedule(
                          frequency,
                          financialYear
                        )[periods.length];
                        if (hasFixedFinancialYearPeriods(frequency) && !generatedPeriod) {
                          return periods;
                        }
                        return [
                          ...periods,
                          generatedPeriod || {
                            periodFrom: '',
                            periodTo: '',
                            filingDate: '',
                            extendedDate: '',
                            extensionReason: '',
                            submissionDate: '',
                            reconciliationDate: '',
                          },
                        ];
                      });
                      setSavedFilingPeriodFlags((flags) => [...flags, false]);
                      setScrollToScheduleIndex(newPeriodIndex);
                      setHasEditedFilingSchedule(true);
                      setIsDirty(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-300 font-normal hover:bg-brand-100 dark:hover:bg-brand-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className="font-normal text-amber-600 dark:text-amber-400">
                Please select a tax group first
              </span>
            ) : !frequency ? (
              <span className="font-normal text-amber-600 dark:text-amber-400">
                Please select a filing frequency
              </span>
            ) : selectedClientId ? (
              <span className="font-normal text-purple-600 dark:text-purple-400">
                Saving as Client Filing ({taxGroup})
              </span>
            ) : (
              <span className="font-normal text-brand-600 dark:text-brand-400">
                Saving as Master Rule Template ({taxGroup})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2 rounded-xl border border-light-border dark:border-dark-border text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-cardSecondary font-normal transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="taxRuleForm"
              disabled={submitting || !taxGroup || !frequency || availableTaxGroups.length === 0}
              className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-normal shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTax ? 'Update Tax Rule' : 'Save Tax'}
            </button>
          </div>
        </div>
      </div>
    </div>
    {showDiscardConfirmation && (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(event) => {
          if (event.target === event.currentTarget) setShowDiscardConfirmation(false);
        }}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="discard-tax-title"
          aria-describedby="discard-tax-description"
          className="w-full max-w-md overflow-hidden rounded-2xl border border-light-border bg-white shadow-2xl dark:border-dark-border dark:bg-dark-card"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h3 id="discard-tax-title" className="text-base font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                  Discard unsaved changes?
                </h3>
                <p id="discard-tax-description" className="mt-1.5 text-sm leading-5 text-light-textSecondary dark:text-dark-textSecondary">
                  Your tax rule and filing schedule edits will be lost if you close this form now.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-light-border bg-light-bg/50 px-5 py-3 dark:border-dark-border dark:bg-dark-cardSecondary/30 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={() => setShowDiscardConfirmation(false)}
              className="rounded-xl border border-light-border px-4 py-2 text-sm font-medium text-light-textSecondary transition-colors hover:bg-white dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-card"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
            >
              Discard changes
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
