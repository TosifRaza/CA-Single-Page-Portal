export { User } from './prismaModels.js';
export type UserRole = 'Super Admin' | 'CA Admin' | 'Manager' | 'Employee' | 'Viewer';
export interface IUser {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  [key: string]: any;
}
