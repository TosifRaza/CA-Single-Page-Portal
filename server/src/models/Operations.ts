import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  organizationId: mongoose.Types.ObjectId;
  paymentCode: string;
  clientId: mongoose.Types.ObjectId;
  workAssignmentId?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  amount: number;
  paidAmount: number;
  paymentDate: Date;
  paymentMethod: 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash' | 'Credit Card' | 'Other';
  status: 'Pending' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    paymentCode: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    workAssignmentId: { type: Schema.Types.ObjectId, ref: 'WorkAssignment' },
    invoiceNumber: { type: String },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'UPI', 'Cheque', 'Cash', 'Credit Card', 'Other'],
      default: 'Bank Transfer',
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    reference: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ organizationId: 1, paymentCode: 1 }, { unique: true });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export interface INotification extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  relatedEntity?: {
    entityType: 'client' | 'work' | 'payment' | 'document' | 'tax';
    entityId: string;
  };
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    type: { type: String, enum: ['info', 'warning', 'success', 'alert'], default: 'info' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntity: {
      entityType: { type: String, enum: ['client', 'work', 'payment', 'document', 'tax'] },
      entityId: { type: String },
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export interface IActivityLog extends Document {
  organizationId: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  action: string;
  entityType: 'Client' | 'Work' | 'Tax' | 'Payment' | 'Employee' | 'Document' | 'System';
  entityId?: string;
  details?: string;
  icon?: string;
  color?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, required: true, default: 'System' },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['Client', 'Work', 'Tax', 'Payment', 'Employee', 'Document', 'System'],
      required: true,
    },
    entityId: { type: String },
    details: { type: String },
    icon: { type: String, default: 'check' },
    color: { type: String, default: 'blue' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ organizationId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
