export type UserRole = 'Super Admin' | 'CA Admin' | 'Manager' | 'Employee' | 'Viewer';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive';
}

export interface Organization {
  id: string;
  _id?: string;
  name: string;
  logo?: string;
  settings?: {
    defaultFinancialYear?: string;
    defaultTheme?: 'light' | 'dark' | 'system';
    timeZone?: string;
    dateFormat?: string;
    reminderDaysBefore?: number;
  };
}

export interface TaxGroupItem {
  _id: string;
  groupName: string;
  groupCode: string;
  description?: string;
  defaultFrequency: string;
  dueDate?: string;
  applicableClientTypes?: string[];
  reconciliationTypes?: string[];
  status: 'active' | 'inactive';
  isSystemDefault: boolean;
  createdAt: string;
  updatedAt?: string;
  linkedTaxesCount?: number;
}

export interface TaxMasterItem {
  _id: string;
  taxId: number;
  taxCode?: string;
  taxGroup: string;
  taxName: string;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly' | 'Half-Yearly' | 'One Time' | 'One-Time' | 'Custom';
  filingFrequency?: string;
  dueDateRule: string;
  description?: string;
  applicableFinancialYear?: string;
  applicableClientTypes?: string[];
  periodFrom?: string;
  periodTo?: string;
  filingPeriod?: string;
  originalDueDate?: string;
  extendedDueDate?: string;
  effectiveDueDate?: string;
  submissionDate?: string;
  actualSubmissionDate?: string;
  submissionMethod?: string;
  filingStatus?: string;
  acknowledgementNumber?: string;
  reconciliationRequired?: boolean;
  defaultReconciliationType?: string;
  reminderSettings?: {
    enabled: boolean;
    daysBeforeDueDate: number[];
  };
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Active' | 'Inactive' | 'Archived';
  createdAt: string;
  updatedAt?: string;
}

export interface ExtensionHistoryItem {
  previousDueDate: string;
  newDueDate: string;
  reason: string;
  reference?: string;
  changedBy?: string;
  changedAt: string;
}

export interface TaxFilingItem {
  _id: string;
  organizationId: string;
  taxRuleId: any;
  clientId: any;
  financialYearId?: any;
  periodFrom: string;
  periodTo: string;
  filingPeriod?: string;
  originalDueDate: string;
  extendedDueDate?: string;
  effectiveDueDate: string;
  extensionReason?: string;
  extensionReference?: string;
  extensionHistory: ExtensionHistoryItem[];
  actualSubmissionDate?: string;
  filingStatus: 'Not Started' | 'Pending' | 'In Progress' | 'Ready to File' | 'Submitted' | 'Filed' | 'Rejected' | 'Revised';
  acknowledgementNumber?: string;
  submissionMethod?: 'Portal' | 'Offline' | 'Utility' | 'API' | 'Other';
  submittedBy?: string;
  filingRemarks?: string;
  assignedEmployeeId?: any;
  reconciliationRequired: boolean;
  reconciliationType?: string;
  reconciliationStatus: 'Not Required' | 'Pending' | 'In Progress' | 'Reconciled' | 'Mismatch' | 'Under Review';
  reconciliationStartDate?: string;
  reconciliationCompletionDate?: string;
  amountAsPerBooks: number;
  amountAsPerStatement: number;
  differenceAmount: number;
  reconciledBy?: string;
  reconciliationRemarks?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  approvalRequired: boolean;
  reminderEnabled: boolean;
  reminderDays: number[];
  internalNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkMasterItem {
  _id: string;
  workId: number;
  workName: string;
  category: 'GST' | 'Income Tax' | 'TDS' | 'Compliance' | 'Advisory' | 'Others';
  taxId?: any;
  timeline: string;
  description?: string;
  defaultPriority: 'Low' | 'Medium' | 'High' | 'Urgent';
  defaultChecklist?: string[];
  defaultDocuments?: string[];
  status: 'Active' | 'Inactive' | 'Archived';
  createdAt: string;
  totalAssignmentsCount?: number;
  assignedClientsCount?: number;
  assignedEmployeesCount?: number;
  assignedEmployees?: Array<{
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    designation?: string;
    count: number;
    clientsCount: number;
  }>;
}

export interface ClientItem {
  _id: string;
  clientCode: string;
  groupName?: string;
  clientType: 'Individual' | 'Business' | 'Company' | 'Partnership' | 'LLP' | 'Trust' | 'Other';
  businessType: 'Proprietorship' | 'Partnership' | 'Private Limited' | 'Public Limited' | 'LLP' | 'Other';
  cin?: string;
  incorporationDate?: string;
  name: string;
  businessName?: string;
  pan: string;
  gstin?: string;
  email?: string;
  mobile: string;
  contactPerson?: string;
  designation?: string;
  industry?: string;
  gstUsername?: string;
  itUsername?: string;
  tracesUsername?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  assignedEmployeeId?: any;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
}

export interface EmployeeItem {
  _id: string;
  employeeCode: string;
  name: string;
  email: string;
  mobile: string;
  designation: string;
  department: string;
  branchId?: any;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  assignedWorksCount?: number;
  assignedClientsCount?: number;
  pendingWorksCount?: number;
  completedWorksCount?: number;
}

export interface WorkAssignmentItem {
  _id: string;
  workCode: string;
  clientId: any;
  workMasterId: any;
  employeeId: any;
  assignedBy?: any;
  startDate: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Under Review' | 'Completed' | 'Filed' | 'Overdue' | 'Cancelled';
  remarks?: string;
  checklist?: Array<{ title: string; completed: boolean; completedAt?: string }>;
  filingReference?: string;
  createdAt: string;
}

export interface PaymentItem {
  _id: string;
  paymentCode: string;
  clientId: any;
  workAssignmentId?: any;
  invoiceNumber?: string;
  amount: number;
  paidAmount: number;
  paymentDate: string;
  paymentMethod: 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash' | 'Credit Card' | 'Other';
  status: 'Pending' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';
  reference?: string;
  notes?: string;
}

export interface NotificationItem {
  _id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  isRead: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  details?: string;
  actor: string;
  icon?: string;
  color?: string;
  createdAt: string;
}
