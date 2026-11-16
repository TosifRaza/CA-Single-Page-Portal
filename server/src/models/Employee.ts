import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeCode: string;
  name: string;
  email: string;
  mobile: string;
  designation: string;
  department: string;
  branchId?: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  joiningDate?: Date;
  permissions?: string[];
  status: 'active' | 'inactive' | 'archived';
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeCode: { type: String, required: true },
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    joiningDate: { type: Date, default: Date.now },
    permissions: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

EmployeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });
EmployeeSchema.index({ organizationId: 1, email: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
