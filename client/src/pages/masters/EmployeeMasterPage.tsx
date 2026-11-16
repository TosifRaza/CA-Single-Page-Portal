import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Mail, Phone, Building2, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { EmployeeItem } from '../../types';

export const EmployeeMasterPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    designation: '',
    department: 'Indirect Tax',
    status: 'active',
  });

  const departments = ['All', 'Direct Tax', 'Indirect Tax', 'Corporate & Regulatory', 'Audit & Accounts', 'Legal Research'];

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/employees?search=${encodeURIComponent(search)}&department=${departmentFilter}`);
      if (res.data?.data) {
        setEmployees(res.data.data.employees);
      }
    } catch (e) {
      setEmployees([
        { _id: '1', employeeCode: 'EMP-0001', name: 'Tosif Raza', email: 'tosif@rizassociates.com', mobile: '9876543210', designation: 'CA Admin', department: 'Direct & Indirect Tax', status: 'active', createdAt: '' },
        { _id: '2', employeeCode: 'EMP-0002', name: 'Anita Desai', email: 'anita@rizassociates.com', mobile: '9876543211', designation: 'GST Manager', department: 'Indirect Tax', status: 'active', createdAt: '' },
        { _id: '3', employeeCode: 'EMP-0003', name: 'Vikram Roy', email: 'vikram@rizassociates.com', mobile: '9876543212', designation: 'Tax Senior', department: 'Direct Tax', status: 'active', createdAt: '' },
        { _id: '4', employeeCode: 'EMP-0004', name: 'Priya Nair', email: 'priya@rizassociates.com', mobile: '9876543213', designation: 'Compliance Officer', department: 'Corporate & Regulatory', status: 'active', createdAt: '' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, departmentFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, formData);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', formData);
        toast.success('Employee registered');
      }
      setIsModalOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving employee');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Archive this employee?')) {
      try {
        await api.delete(`/employees/${id}`);
        toast.success('Employee archived');
        fetchEmployees();
      } catch (err) {
        toast.error('Failed to archive');
      }
    }
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      mobile: '',
      designation: '',
      department: 'Indirect Tax',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      mobile: emp.mobile,
      designation: emp.designation,
      department: emp.department,
      status: emp.status,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-brand-500 mb-1 flex items-center gap-1.5">
            <NavLink to="/dashboard" className="hover:underline flex items-center gap-0.5">
              <span>«</span> Master Management
            </NavLink>
            <span className="text-light-textMuted dark:text-dark-textMuted">&gt;</span>
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Employee Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Employee Master
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Manage practice personnel, assign roles and work responsibilities
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-light-border/60 dark:border-dark-border/60">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-light-textMuted dark:text-dark-textMuted" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none w-full sm:w-auto"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50">
                  <td className="py-3 px-4 font-semibold text-brand-500">{emp.employeeCode}</td>
                  <td className="py-3 px-4 font-bold text-light-textPrimary dark:text-dark-textPrimary">
                    {emp.name}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary font-semibold">
                    {emp.designation}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {emp.department}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {emp.email}
                  </td>
                  <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                    {emp.mobile}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-status-greenLight text-status-green">
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1 rounded text-light-textSecondary hover:text-brand-500"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp._id)}
                        className="p-1 rounded text-light-textSecondary hover:text-status-red"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-light-textMuted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Mobile *</label>
                <input
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Designation *</label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                >
                  <option value="Direct Tax">Direct Tax</option>
                  <option value="Indirect Tax">Indirect Tax</option>
                  <option value="Corporate & Regulatory">Corporate & Regulatory</option>
                  <option value="Audit & Accounts">Audit & Accounts</option>
                  <option value="Legal Research">Legal Research</option>
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
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
