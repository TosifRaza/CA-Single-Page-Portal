import mongoose, { Schema, Document } from 'mongoose';

export type FilingStatusType =
  | 'Not Started'
  | 'Pending'
  | 'In Progress'
  | 'Ready to File'
  | 'Submitted'
  | 'Filed'
  | 'Rejected'
  | 'Revised';

export type ReconciliationStatusType =
  | 'Not Required'
  | 'Pending'
  | 'In Progress'
  | 'Reconciled'
  | 'Mismatch'
  | 'Under Review';

export type SubmissionMethodType = 'Portal' | 'Offline' | 'Utility' | 'API' | 'Other';

export interface IExtensionHistory {
  previousDueDate: Date;
  newDueDate: Date;
  reason: string;
  reference?: string;
  changedBy?: string;
  changedAt: Date;
}

export interface ITaxFiling extends Document {
  organizationId: mongoose.Types.ObjectId;
  taxRuleId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  financialYearId?: mongoose.Types.ObjectId;
  financialYear?: string;
  periodFrom: Date;
  periodTo: Date;
  filingPeriod?: string;
  originalDueDate: Date;
  extendedDueDate?: Date;
  effectiveDueDate: Date;
  extensionReason?: string;
  extensionReference?: string;
  extensionHistory: IExtensionHistory[];
  actualSubmissionDate?: Date;
  filingStatus: FilingStatusType;
  acknowledgementNumber?: string;
  submissionMethod?: SubmissionMethodType;
  submittedBy?: string;
  filingRemarks?: string;
  assignedEmployeeId?: mongoose.Types.ObjectId;
  reconciliationRequired: boolean;
  reconciliationType?: string;
  reconciliationStatus: ReconciliationStatusType;
  reconciliationStartDate?: Date;
  reconciliationCompletionDate?: Date;
  amountAsPerBooks: number;
  amountAsPerStatement: number;
  differenceAmount: number;
  reconciledBy?: string;
  reconciliationRemarks?: string;
  documentIds?: mongoose.Types.ObjectId[];
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  approvalRequired: boolean;
  reminderEnabled: boolean;
  reminderDays: number[];
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExtensionHistorySchema = new Schema<IExtensionHistory>(
  {
    previousDueDate: { type: Date, required: true },
    newDueDate: { type: Date, required: true },
    reason: { type: String, required: true },
    reference: { type: String },
    changedBy: { type: String },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TaxFilingSchema = new Schema<ITaxFiling>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    taxRuleId: { type: Schema.Types.ObjectId, ref: 'TaxMaster', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FinancialYear' },
    financialYear: { type: String },
    periodFrom: { type: Date, required: true },
    periodTo: { type: Date, required: true },
    filingPeriod: { type: String },
    originalDueDate: { type: Date, required: true },
    extendedDueDate: { type: Date },
    effectiveDueDate: { type: Date, required: true, index: true },
    extensionReason: { type: String },
    extensionReference: { type: String },
    extensionHistory: [ExtensionHistorySchema],
    actualSubmissionDate: { type: Date },
    filingStatus: {
      type: String,
      enum: ['Not Started', 'Pending', 'In Progress', 'Ready to File', 'Submitted', 'Filed', 'Rejected', 'Revised'],
      default: 'Pending',
      index: true,
    },
    acknowledgementNumber: { type: String, trim: true },
    submissionMethod: {
      type: String,
      enum: ['Portal', 'Offline', 'Utility', 'API', 'Other'],
      default: 'Portal',
    },
    submittedBy: { type: String },
    filingRemarks: { type: String },
    assignedEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    reconciliationRequired: { type: Boolean, default: false },
    reconciliationType: { type: String },
    reconciliationStatus: {
      type: String,
      enum: ['Not Required', 'Pending', 'In Progress', 'Reconciled', 'Mismatch', 'Under Review'],
      default: 'Not Required',
      index: true,
    },
    reconciliationStartDate: { type: Date },
    reconciliationCompletionDate: { type: Date },
    amountAsPerBooks: { type: Number, default: 0 },
    amountAsPerStatement: { type: Number, default: 0 },
    differenceAmount: { type: Number, default: 0 },
    reconciledBy: { type: String },
    reconciliationRemarks: { type: String },
    documentIds: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical', 'Urgent'],
      default: 'Medium',
    },
    approvalRequired: { type: Boolean, default: false },
    reminderEnabled: { type: Boolean, default: true },
    reminderDays: [{ type: Number }],
    internalNotes: { type: String },
  },
  { timestamps: true }
);

// Pre-save hook: auto-calculate effectiveDueDate and differenceAmount
TaxFilingSchema.pre('save', function (next) {
  // Effective Due Date calculation
  if (this.extendedDueDate) {
    this.effectiveDueDate = this.extendedDueDate;
  } else {
    this.effectiveDueDate = this.originalDueDate;
  }

  // Difference Amount calculation
  if (this.reconciliationRequired) {
    const books = Number(this.amountAsPerBooks) || 0;
    const stmt = Number(this.amountAsPerStatement) || 0;
    this.differenceAmount = Math.round((books - stmt) * 100) / 100;
  } else {
    this.differenceAmount = 0;
  }

  next();
});

TaxFilingSchema.index({ organizationId: 1, taxRuleId: 1, clientId: 1, periodFrom: 1, periodTo: 1 });

export const TaxFiling = mongoose.model<ITaxFiling>('TaxFiling', TaxFilingSchema);
