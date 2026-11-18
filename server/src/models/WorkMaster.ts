import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkMaster extends Document {
  organizationId: mongoose.Types.ObjectId;
  workId: number;
  workName: string;
  category: 'GST' | 'Income Tax' | 'TDS' | 'Compliance' | 'Advisory' | 'Others';
  taxId?: mongoose.Types.ObjectId;
  timeline: string;
  description?: string;
  defaultPriority: 'Low' | 'Medium' | 'High' | 'Urgent';
  defaultChecklist?: string[];
  defaultDocuments?: string[];
  defaultDocumentFiles?: Array<{
    documentName: string;
    documentId: mongoose.Types.ObjectId;
    fileName: string;
  }>;
  status: 'Active' | 'Inactive' | 'Archived';
  createdAt: Date;
  updatedAt: Date;
}

const WorkMasterSchema = new Schema<IWorkMaster>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    workId: { type: Number, required: true },
    workName: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: ['GST', 'Income Tax', 'TDS', 'Compliance', 'Advisory', 'Others'],
      required: true,
      index: true,
    },
    taxId: { type: Schema.Types.ObjectId, ref: 'TaxMaster' },
    timeline: { type: String, required: true, trim: true },
    description: { type: String },
    defaultPriority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    defaultChecklist: [{ type: String }],
    defaultDocuments: [{ type: String }],
    defaultDocumentFiles: [
      {
        documentName: { type: String, required: true },
        documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
        fileName: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
      index: true,
    },
  },
  { timestamps: true }
);

WorkMasterSchema.index({ organizationId: 1, workId: 1 }, { unique: true });

export const WorkMaster = mongoose.model<IWorkMaster>('WorkMaster', WorkMasterSchema);
