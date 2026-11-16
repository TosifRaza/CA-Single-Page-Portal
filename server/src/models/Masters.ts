import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialYear extends Document {
  organizationId: mongoose.Types.ObjectId;
  yearName: string; // e.g. "2026-27"
  assessmentYear: string; // e.g. "2027-28"
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const FinancialYearSchema = new Schema<IFinancialYear>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    yearName: { type: String, required: true, trim: true },
    assessmentYear: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

FinancialYearSchema.index({ organizationId: 1, yearName: 1 }, { unique: true });

export const FinancialYear = mongoose.model<IFinancialYear>('FinancialYear', FinancialYearSchema);

export interface IBranch extends Document {
  organizationId: mongoose.Types.ObjectId;
  branchName: string;
  branchCode: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  managerId?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    branchName: { type: String, required: true, trim: true },
    branchCode: { type: String, required: true, uppercase: true, trim: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    phone: { type: String },
    email: { type: String, lowercase: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

BranchSchema.index({ organizationId: 1, branchCode: 1 }, { unique: true });

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);

export interface IService extends Document {
  organizationId: mongoose.Types.ObjectId;
  serviceName: string;
  category: string;
  description?: string;
  defaultPrice: number;
  estimatedDuration: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    serviceName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String },
    defaultPrice: { type: Number, default: 0 },
    estimatedDuration: { type: String, default: '3 Days' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>('Service', ServiceSchema);
