import mongoose, { Schema, Document } from 'mongoose';

export type WorkStatus = 'Pending' | 'In Progress' | 'Under Review' | 'Completed' | 'Filed' | 'Overdue' | 'Cancelled';
export type WorkPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface IWorkAssignment extends Document {
  organizationId: mongoose.Types.ObjectId;
  workCode: string;
  clientId: mongoose.Types.ObjectId;
  workMasterId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  assignedBy?: mongoose.Types.ObjectId;
  startDate: Date;
  dueDate: Date;
  priority: WorkPriority;
  status: WorkStatus;
  remarks?: string;
  checklist?: Array<{
    title: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  filingReference?: string;
  completedAt?: Date;
  filedAt?: Date;
  financialYearId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkAssignmentSchema = new Schema<IWorkAssignment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    workCode: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    workMasterId: { type: Schema.Types.ObjectId, ref: 'WorkMaster', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Under Review', 'Completed', 'Filed', 'Overdue', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    remarks: { type: String },
    checklist: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    filingReference: { type: String },
    completedAt: { type: Date },
    filedAt: { type: Date },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FinancialYear' },
  },
  { timestamps: true }
);

WorkAssignmentSchema.index({ organizationId: 1, workCode: 1 }, { unique: true });
WorkAssignmentSchema.index({ organizationId: 1, status: 1, dueDate: 1 });

export const WorkAssignment = mongoose.model<IWorkAssignment>('WorkAssignment', WorkAssignmentSchema);
