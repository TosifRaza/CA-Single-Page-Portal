import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentCategory extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  allowedTypes?: string[];
  maxSizeMb?: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const DocumentCategorySchema = new Schema<IDocumentCategory>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String },
    allowedTypes: [{ type: String }],
    maxSizeMb: { type: Number, default: 10 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

DocumentCategorySchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const DocumentCategory = mongoose.model<IDocumentCategory>('DocumentCategory', DocumentCategorySchema);

export interface IDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  workAssignmentId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    workAssignmentId: { type: Schema.Types.ObjectId, ref: 'WorkAssignment', index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'DocumentCategory' },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    storagePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
