import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxGroup extends Document {
  organizationId: mongoose.Types.ObjectId;
  groupName: string;
  groupCode: string;
  description?: string;
  defaultFrequency: string;
  dueDate?: string;
  applicableClientTypes?: string[];
  reconciliationTypes?: string[];
  status: 'active' | 'inactive';
  isSystemDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaxGroupSchema = new Schema<ITaxGroup>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    groupName: { type: String, required: true, trim: true },
    groupCode: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    defaultFrequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One Time', 'Custom'],
      default: 'Monthly',
    },
    dueDate: { type: String, trim: true },
    applicableClientTypes: [{ type: String }],
    reconciliationTypes: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    isSystemDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TaxGroupSchema.index({ organizationId: 1, groupCode: 1 }, { unique: true });
TaxGroupSchema.index({ organizationId: 1, groupName: 1 });

export const TaxGroup = mongoose.model<ITaxGroup>('TaxGroup', TaxGroupSchema);
