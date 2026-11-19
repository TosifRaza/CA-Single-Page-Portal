import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const clientSchema = z.object({
  name: z.string().min(2, 'Legal name is required'),
  groupName: z.string().optional(),
  clientType: z.enum(['Individual', 'Business', 'Company', 'Partnership', 'LLP', 'Trust', 'Other']),
  businessType: z.enum(['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other']),
  cin: z.string().optional(),
  incorporationDate: z.string().optional(),
  pan: z.string().toUpperCase().regex(panRegex, 'Invalid PAN format (e.g. ABCDE1234F)'),
  gstin: z.string().toUpperCase().regex(gstinRegex, 'Invalid GSTIN format').optional().or(z.literal('')),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  businessName: z.string().optional(),
  contactPerson: z.string().optional(),
  designation: z.string().optional(),
  secondaryEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  alternateMobile: z.string().optional(),
  businessRegNo: z.string().optional(),
  businessCategory: z.string().optional(),
  industry: z.string().optional(),
  businessStartDate: z.string().optional(),
  gstUsername: z.string().optional(),
  itUsername: z.string().optional(),
  tracesUsername: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India').optional(),
  }).optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active').optional(),
});

export const taxGroupSchema = z.object({
  groupName: z.string().trim().min(2, 'Group name must be at least 2 characters'),
  groupCode: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  defaultFrequency: z.enum(['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One Time', 'Custom']).default('Monthly').optional(),
  applicableClientTypes: z.array(z.string()).optional(),
  reconciliationTypes: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).default('active').optional(),
});

const taxMasterFieldsSchema = z.object({
  taxGroup: z.string().min(2, 'Tax group is required'),
  taxName: z.string().min(2, 'Tax name is required'),
  taxCode: z.string().optional(),
  frequency: z.enum(['Monthly', 'Quarterly', 'Yearly', 'Half-Yearly', 'One Time', 'One-Time', 'Custom']).optional(),
  filingFrequency: z.enum(['Monthly', 'Quarterly', 'Yearly', 'Half-Yearly', 'One Time', 'One-Time', 'Custom']).optional(),
  dueDateRule: z.string().min(1, 'Due date rule is required').default('11th Next Month'),
  description: z.string().optional(),
  applicableFinancialYear: z.string().optional(),
  applicableClientTypes: z.array(z.string()).optional(),
  applicableBusinessCategoryOther: z.string().optional(),
  periodFrom: z.string().optional().nullable(),
  periodTo: z.string().optional().nullable(),
  filingPeriod: z.string().optional(),
  originalDueDate: z.string().optional().nullable(),
  extendedDueDate: z.string().optional().nullable(),
  effectiveDueDate: z.string().optional().nullable(),
  submissionDate: z.string().optional().nullable(),
  actualSubmissionDate: z.string().optional().nullable(),
  submissionMethod: z.string().optional(),
  filingStatus: z.string().optional(),
  acknowledgementNumber: z.string().optional(),
  reconciliationRequired: z.boolean().optional(),
  reconciliationDate: z.string().optional().nullable(),
  defaultReconciliationType: z.string().optional(),
  filingSchedule: z
    .array(
      z.object({
        periodFrom: z.string().min(1),
        periodTo: z.string().min(1),
        filingDate: z.string().min(1),
        extendedDate: z.string().optional().nullable(),
        extensionReason: z.string().trim().optional().nullable(),
        submissionDate: z.string().optional().nullable(),
        reconciliationDate: z.string().optional().nullable(),
      })
    )
    .optional(),
  reminderSettings: z
    .object({
      enabled: z.boolean().default(true),
      daysBeforeDueDate: z.array(z.number()).default([7, 3, 1]),
    })
    .optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium').optional(),
  status: z.enum(['Active', 'Inactive', 'Archived']).default('Active'),
});

type TaxMasterScheduleValidationInput = {
  applicableFinancialYear?: string | null;
  frequency?: string | null;
  filingFrequency?: string | null;
  applicableClientTypes?: string[];
  applicableBusinessCategoryOther?: string | null;
  filingSchedule?: {
    periodFrom: string;
    periodTo: string;
    filingDate: string;
    extendedDate?: string | null;
    extensionReason?: string | null;
    submissionDate?: string | null;
    reconciliationDate?: string | null;
  }[];
};

const isValidCalendarDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const getFinancialYearDateBounds = (financialYear?: string | null) => {
  if (!financialYear) return undefined;
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

const getExpectedFinancialYearPeriods = (
  frequency?: string | null,
  financialYear?: string | null
) => {
  const monthsPerPeriod =
    frequency === 'Monthly'
      ? 1
      : frequency === 'Quarterly'
        ? 3
        : frequency === 'Half-Yearly'
          ? 6
          : frequency === 'Yearly'
            ? 12
            : undefined;
  const bounds = getFinancialYearDateBounds(financialYear);
  if (!monthsPerPeriod || !bounds) return undefined;

  const count = 12 / monthsPerPeriod;
  const startYear = Number(bounds.start.slice(0, 4));
  return Array.from({ length: count }, (_, index) => {
    const periodStart = new Date(Date.UTC(startYear, 3 + index * monthsPerPeriod, 1));
    const periodEnd = new Date(Date.UTC(startYear, 3 + (index + 1) * monthsPerPeriod, 0));
    return {
      periodFrom: periodStart.toISOString().slice(0, 10),
      periodTo: periodEnd.toISOString().slice(0, 10),
    };
  });
};

const getFrequencyPeriodLimit = (frequency?: string | null) => {
  if (frequency === 'Monthly') return 12;
  if (frequency === 'Quarterly') return 4;
  if (frequency === 'Half-Yearly') return 2;
  if (frequency === 'Yearly') return 1;
  if (frequency === 'One Time' || frequency === 'One-Time') return 1;
  if (frequency === 'Custom') return 12;
  return undefined;
};

const validateTaxMasterSchedule = (
  data: TaxMasterScheduleValidationInput,
  context: z.RefinementCtx
) => {
  if (
    data.applicableClientTypes?.includes('Other Legal Entity') &&
    !data.applicableBusinessCategoryOther?.trim()
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['applicableBusinessCategoryOther'],
      message: 'Please specify the other business category',
    });
  }

  const schedule = data.filingSchedule;
  if (!schedule) return;

  const financialYearBounds = getFinancialYearDateBounds(data.applicableFinancialYear);
  const frequency = data.frequency || data.filingFrequency;
  const periodLimit = getFrequencyPeriodLimit(frequency);
  const expectedPeriods = getExpectedFinancialYearPeriods(
    frequency,
    data.applicableFinancialYear
  );
  if (periodLimit && schedule.length > periodLimit) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['filingSchedule'],
      message: `${frequency} schedules cannot exceed ${periodLimit} periods in a financial year`,
    });
  }
  const validRanges: { index: number; from: number; to: number }[] = [];
  schedule.forEach((period, index) => {
    const fromValid = isValidCalendarDate(period.periodFrom);
    const toValid = isValidCalendarDate(period.periodTo);
    const filingDateValid = isValidCalendarDate(period.filingDate);
    const extendedDateValid = !period.extendedDate || isValidCalendarDate(period.extendedDate);
    const submissionDateValid = !period.submissionDate || isValidCalendarDate(period.submissionDate);
    const reconciliationDateValid =
      !period.reconciliationDate || isValidCalendarDate(period.reconciliationDate);

    if (!fromValid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'periodFrom'],
        message: 'Period From must be a valid calendar date',
      });
    }
    if (!toValid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'periodTo'],
        message: 'Period To must be a valid calendar date',
      });
    }
    if (!filingDateValid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'filingDate'],
        message: 'Filing Date must be a valid calendar date',
      });
    }
    if (!extendedDateValid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'extendedDate'],
        message: 'Extended Due Date must be a valid calendar date',
      });
    }
    if (period.extendedDate && !period.extensionReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'extensionReason'],
        message: 'A reason is required when an extended due date is set',
      });
    }
    if (!period.extendedDate && period.extensionReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'extensionReason'],
        message: 'An extended due date is required when an extension reason is provided',
      });
    }
    if (!submissionDateValid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'submissionDate'],
        message: 'Submission Date must be a valid calendar date',
      });
    }
    if (!reconciliationDateValid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'reconciliationDate'],
        message: 'Reconciliation Date must be a valid calendar date',
      });
    }
    const expectedPeriod = expectedPeriods?.[index];
    if (expectedPeriod && period.periodFrom !== expectedPeriod.periodFrom) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'periodFrom'],
        message: `${data.frequency || data.filingFrequency} period ${index + 1} must start on ${expectedPeriod.periodFrom}`,
      });
    }
    if (expectedPeriod && period.periodTo !== expectedPeriod.periodTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'periodTo'],
        message: `${data.frequency || data.filingFrequency} period ${index + 1} must end on ${expectedPeriod.periodTo}`,
      });
    }
    if (
      toValid &&
      financialYearBounds &&
      (period.periodTo < financialYearBounds.start || period.periodTo > financialYearBounds.end)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'periodTo'],
        message: 'Period To must be within the selected financial year',
      });
    }
    if (toValid && filingDateValid && period.filingDate <= period.periodTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'filingDate'],
        message: 'Filing Date must be after Period To',
      });
    }
    if (toValid && submissionDateValid && period.submissionDate && period.submissionDate <= period.periodTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'submissionDate'],
        message: 'Submission Date must be after Period To',
      });
    }
    if (
      toValid &&
      reconciliationDateValid &&
      period.reconciliationDate &&
      period.reconciliationDate <= period.periodTo
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'reconciliationDate'],
        message: 'Reconciliation Date must be after Period To',
      });
    }
    if (
      extendedDateValid &&
      filingDateValid &&
      period.extendedDate &&
      period.extendedDate < period.filingDate
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', index, 'extendedDate'],
        message: 'Extended Due Date must be on or after the Filing Date',
      });
    }

    if (fromValid && toValid) {
      const from = Date.parse(`${period.periodFrom}T00:00:00.000Z`);
      const to = Date.parse(`${period.periodTo}T00:00:00.000Z`);
      if (from >= to) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['filingSchedule', index, 'periodTo'],
          message: 'Period From must be earlier than Period To',
        });
      } else {
        validRanges.push({ index, from, to });
      }
    }
  });

  validRanges.sort((a, b) => a.from - b.from);
  validRanges.forEach((range, index) => {
    if (index > 0 && range.from <= validRanges[index - 1].to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filingSchedule', range.index, 'periodFrom'],
        message: 'Filing periods cannot overlap',
      });
    }
  });
};

export const taxMasterSchema = taxMasterFieldsSchema.superRefine(validateTaxMasterSchedule);
export const taxMasterUpdateSchema = taxMasterFieldsSchema
  .partial()
  .superRefine(validateTaxMasterSchedule);

export const taxFilingSchema = z.object({
  taxRuleId: z.string().min(1, 'Tax Rule is required'),
  clientId: z.string().min(1, 'Client is required'),
  financialYearId: z.string().optional(),
  periodFrom: z.string().min(1, 'From Date is required'),
  periodTo: z.string().min(1, 'To Date is required'),
  filingPeriod: z.string().optional(),
  originalDueDate: z.string().min(1, 'Original Due Date is required'),
  extendedDueDate: z.string().optional().nullable(),
  extensionReason: z.string().optional(),
  extensionReference: z.string().optional(),
  actualSubmissionDate: z.string().optional().nullable(),
  filingStatus: z
    .enum(['Not Started', 'Pending', 'In Progress', 'Ready to File', 'Submitted', 'Filed', 'Rejected', 'Revised'])
    .default('Pending'),
  acknowledgementNumber: z.string().optional(),
  submissionMethod: z.enum(['Portal', 'Offline', 'Utility', 'API', 'Other']).default('Portal').optional(),
  submittedBy: z.string().optional(),
  filingRemarks: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
  reconciliationRequired: z.boolean().default(false),
  reconciliationType: z.string().optional(),
  reconciliationStatus: z
    .enum(['Not Required', 'Pending', 'In Progress', 'Reconciled', 'Mismatch', 'Under Review'])
    .default('Not Required'),
  reconciliationStartDate: z.string().optional().nullable(),
  reconciliationCompletionDate: z.string().optional().nullable(),
  amountAsPerBooks: z.number().default(0),
  amountAsPerStatement: z.number().default(0),
  reconciledBy: z.string().optional(),
  reconciliationRemarks: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  approvalRequired: z.boolean().default(false),
  reminderEnabled: z.boolean().default(true),
  reminderDays: z.array(z.number()).default([7, 3, 1]),
  internalNotes: z.string().optional(),
}).refine((data) => {
  if (data.periodFrom && data.periodTo) {
    return new Date(data.periodFrom) <= new Date(data.periodTo);
  }
  return true;
}, {
  message: 'From Date cannot be after To Date',
  path: ['periodTo'],
});

export const extendDeadlineSchema = z.object({
  extendedDueDate: z.string().min(1, 'Extended due date is required'),
  extensionReason: z.string().min(3, 'Extension reason is required (min 3 chars)'),
  extensionReference: z.string().optional(),
});

export const updateFilingStatusSchema = z.object({
  filingStatus: z.enum([
    'Not Started',
    'Pending',
    'In Progress',
    'Ready to File',
    'Submitted',
    'Filed',
    'Rejected',
    'Revised',
  ]),
  actualSubmissionDate: z.string().optional(),
  acknowledgementNumber: z.string().optional(),
  submissionMethod: z.enum(['Portal', 'Offline', 'Utility', 'API', 'Other']).optional(),
  submittedBy: z.string().optional(),
  filingRemarks: z.string().optional(),
});

export const updateReconciliationSchema = z.object({
  reconciliationStatus: z.enum([
    'Not Required',
    'Pending',
    'In Progress',
    'Reconciled',
    'Mismatch',
    'Under Review',
  ]),
  reconciliationType: z.string().optional(),
  amountAsPerBooks: z.number().optional(),
  amountAsPerStatement: z.number().optional(),
  reconciliationStartDate: z.string().optional(),
  reconciliationCompletionDate: z.string().optional(),
  reconciledBy: z.string().optional(),
  reconciliationRemarks: z.string().optional(),
});

export const workMasterSchema = z.object({
  workName: z.string().min(2, 'Work name is required'),
  category: z.enum(['GST', 'Income Tax', 'TDS', 'Compliance', 'Advisory', 'Others']),
  taxId: z.string().optional().nullable().or(z.literal('')),
  timeline: z.string().min(1, 'Timeline is required (e.g. 2 Days)'),
  description: z.string().optional(),
  defaultPriority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  defaultChecklist: z.array(z.string()).optional(),
  defaultDocuments: z.array(z.string()).optional(),
  defaultDocumentFiles: z.array(z.object({
    documentName: z.string().min(1),
    documentId: z.string().min(1),
    fileName: z.string().min(1),
  })).optional(),
  status: z.enum(['Active', 'Inactive', 'Archived']).default('Active'),
});

export const workAssignmentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  workMasterId: z.string().min(1, 'Work template is required'),
  employeeId: z.string().min(1, 'Assignee employee is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  remarks: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium').optional(),
  status: z.enum(['Pending', 'In Progress', 'Under Review', 'Completed', 'Filed', 'Overdue', 'Cancelled']).default('Pending').optional(),
});

export const employeeSchema = z.object({
  name: z.string().min(2, 'Employee name is required'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
  designation: z.string().min(2, 'Designation is required'),
  department: z.string().min(2, 'Department is required'),
  branchId: z.string().optional(),
  managerId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  initialAssignments: z.array(z.object({
    clientId: z.string(),
    workMasterId: z.string(),
    dueDate: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
    remarks: z.string().optional(),
  })).optional(),
});

export const paymentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  workAssignmentId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  paidAmount: z.number().min(0).default(0),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(['Bank Transfer', 'UPI', 'Cheque', 'Cash', 'Credit Card', 'Other']).default('Bank Transfer'),
  status: z.enum(['Pending', 'Partial', 'Paid', 'Overdue', 'Cancelled']).default('Pending'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
