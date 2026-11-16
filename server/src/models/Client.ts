import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  organizationId: mongoose.Types.ObjectId;
  clientCode: string;
  clientType: 'Individual' | 'Business' | 'Company' | 'Partnership' | 'LLP' | 'Trust' | 'Other';
  businessType: 'Proprietorship' | 'Partnership' | 'Private Limited' | 'Public Limited' | 'LLP' | 'Other';
  groupName?: string;
  cin?: string;
  incorporationDate?: Date;
  name: string;
  businessName?: string;
  pan: string;
  gstin?: string;
  email: string;
  mobile: string;
  secondaryEmail?: string;
  alternateMobile?: string;
  contactPerson?: string;
  designation?: string;
  businessRegNo?: string;
  businessCategory?: string;
  industry?: string;
  businessStartDate?: Date;
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
  financialYearId?: mongoose.Types.ObjectId;
  assignedEmployeeId?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'archived';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientCode: { type: String, required: true },
    groupName: { type: String, trim: true, index: true },
    cin: { type: String, uppercase: true, trim: true },
    incorporationDate: { type: Date },
    clientType: {
      type: String,
      enum: ['Individual', 'Business', 'Company', 'Partnership', 'LLP', 'Trust', 'Other'],
      default: 'Individual',
      required: true,
    },
    businessType: {
      type: String,
      enum: ['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other'],
      default: 'Proprietorship',
      required: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    businessName: { type: String, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    gstin: { type: String, uppercase: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    secondaryEmail: { type: String, lowercase: true, trim: true },
    alternateMobile: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    designation: { type: String, trim: true },
    businessRegNo: { type: String, trim: true },
    businessCategory: { type: String, trim: true },
    industry: { type: String, trim: true },
    businessStartDate: { type: Date },
    gstUsername: { type: String, trim: true },
    itUsername: { type: String, trim: true },
    tracesUsername: { type: String, trim: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FinancialYear' },
    assignedEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

ClientSchema.index({ organizationId: 1, clientCode: 1 }, { unique: true });
ClientSchema.index({ organizationId: 1, pan: 1 });
ClientSchema.index({ organizationId: 1, name: 'text', businessName: 'text', pan: 'text' });

export const Client = mongoose.model<IClient>('Client', ClientSchema);
