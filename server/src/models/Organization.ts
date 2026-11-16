import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  logo?: string;
  email: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  settings?: {
    defaultFinancialYear?: string;
    defaultTheme?: 'light' | 'dark' | 'system';
    timeZone?: string;
    dateFormat?: string;
    reminderDaysBefore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    settings: {
      defaultFinancialYear: { type: String, default: '2026-27' },
      defaultTheme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
      timeZone: { type: String, default: 'Asia/Kolkata' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      reminderDaysBefore: { type: Number, default: 3 },
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
