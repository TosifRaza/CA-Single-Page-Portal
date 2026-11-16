import mongoose, { Schema, Document } from 'mongoose';

export type TaxGroupType = string;
export type FilingFrequencyType = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'One Time' | 'One-Time' | 'Custom';
export type TaxPriorityType = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaxStatusType = 'Active' | 'Inactive' | 'Archived';

export interface ITaxMaster extends Document {
  organizationId: mongoose.Types.ObjectId;
  taxId: number;
  taxCode?: string;
  taxGroup: TaxGroupType;
  taxName: string;
  description?: string;
  frequency: FilingFrequencyType;
  filingFrequency?: FilingFrequencyType;
  dueDateRule: string;
  applicableFinancialYear?: string;
  applicableClientTypes?: string[];
  periodFrom?: Date;
  periodTo?: Date;
  filingPeriod?: string;
  originalDueDate?: Date;
  extendedDueDate?: Date;
  effectiveDueDate?: Date;
  submissionDate?: Date;
  actualSubmissionDate?: Date;
  submissionMethod?: string;
  filingStatus?: string;
  acknowledgementNumber?: string;
  reconciliationRequired?: boolean;
  defaultReconciliationType?: string;
  reminderSettings?: {
    enabled: boolean;
    daysBeforeDueDate: number[];
  };
  priority?: TaxPriorityType;
  status: TaxStatusType;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaxMasterSchema = new Schema<ITaxMaster>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    taxId: { type: Number, required: true },
    taxCode: { type: String, trim: true },
    taxGroup: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    taxName: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    frequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Yearly', 'Half-Yearly', 'One Time', 'One-Time', 'Custom'],
      required: true,
    },
    filingFrequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Yearly', 'Half-Yearly', 'One Time', 'One-Time', 'Custom'],
    },
    dueDateRule: { type: String, required: true, trim: true },
    applicableFinancialYear: { type: String },
    applicableClientTypes: [{ type: String }],
    periodFrom: { type: Date },
    periodTo: { type: Date },
    filingPeriod: { type: String, trim: true },
    originalDueDate: { type: Date },
    extendedDueDate: { type: Date },
    effectiveDueDate: { type: Date },
    submissionDate: { type: Date },
    actualSubmissionDate: { type: Date },
    submissionMethod: { type: String, default: 'Portal' },
    filingStatus: { type: String, default: 'Active' },
    acknowledgementNumber: { type: String, trim: true },
    reconciliationRequired: { type: Boolean, default: false },
    defaultReconciliationType: { type: String },
    reminderSettings: {
      enabled: { type: Boolean, default: true },
      daysBeforeDueDate: [{ type: Number }],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

TaxMasterSchema.pre('save', function (next) {
  if (this.frequency && !this.filingFrequency) {
    this.filingFrequency = this.frequency;
  } else if (this.filingFrequency && !this.frequency) {
    this.frequency = this.filingFrequency;
  }

  if (this.extendedDueDate) {
    this.effectiveDueDate = this.extendedDueDate;
  } else if (this.originalDueDate) {
    this.effectiveDueDate = this.originalDueDate;
  }

  if (this.actualSubmissionDate && !this.submissionDate) {
    this.submissionDate = this.actualSubmissionDate;
  } else if (this.submissionDate && !this.actualSubmissionDate) {
    this.actualSubmissionDate = this.submissionDate;
  }

  next();
});

TaxMasterSchema.index({ organizationId: 1, taxId: 1 }, { unique: true });

export const TaxMaster = mongoose.model<ITaxMaster>('TaxMaster', TaxMasterSchema);
export const TaxRule = TaxMaster;
