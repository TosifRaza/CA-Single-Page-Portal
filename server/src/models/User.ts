import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'Super Admin' | 'CA Admin' | 'Manager' | 'Employee' | 'Viewer';

export interface IUser extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  employeeId?: mongoose.Types.ObjectId;
  avatar?: string;
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['Super Admin', 'CA Admin', 'Manager', 'Employee', 'Viewer'],
      default: 'Employee',
      required: true,
    },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    avatar: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', UserSchema);
