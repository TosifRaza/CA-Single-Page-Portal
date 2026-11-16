import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, ShieldCheck, User, Mail, Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { UserRole } from '../../types';

export const UsersRolesPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: 'Employee' as UserRole,
  });

  const roles: UserRole[] = ['Super Admin', 'CA Admin', 'Manager', 'Employee', 'Viewer'];

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/users');
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (e) {
      setUsers([
        { _id: '1', name: 'Tosif Raza', email: 'tosif@rizassociates.com', role: 'CA Admin', status: 'active', lastLogin: new Date() },
        { _id: '2', name: 'Anita Desai', email: 'anita@rizassociates.com', role: 'Manager', status: 'active', lastLogin: new Date() },
        { _id: '3', name: 'Vikram Roy', email: 'vikram@rizassociates.com', role: 'Employee', status: 'active' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/settings/users/${userId}`, { role: newRole });
      toast.success('User role updated');
      loadUsers();
    } catch (err) {
      toast.error('Failed to change role');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/users', formData);
      toast.success('User account created and permissions assigned');
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating user');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Users & Roles Management
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Manage authenticated user access, assign practice roles and enforce permission boundaries
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite User</span>
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-light-textPrimary dark:text-dark-textPrimary">
                      {u.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-blue-400">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-greenLight text-status-green">
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-xl bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary">
                Invite New User
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-light-textMuted" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@rizassociates.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Assigned Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-light-border dark:border-dark-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
