import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { WorkAssignmentItem, ClientItem, WorkMasterItem, EmployeeItem } from '../../types';

export const WorkAssignmentPage: React.FC = () => {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [workMasters, setWorkMasters] = useState<WorkMasterItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<WorkAssignmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Fields matching screenshot
  const [formData, setFormData] = useState({
    clientId: '',
    workMasterId: '',
    employeeId: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: '',
    priority: 'Medium',
  });

  const loadDropdownData = async () => {
    try {
      setLoading(true);
      const [cRes, wRes, eRes, aRes] = await Promise.all([
        api.get('/clients?limit=50'),
        api.get('/work-masters?limit=50'),
        api.get('/employees?limit=50'),
        api.get('/work-assignments?limit=6'),
      ]);

      if (cRes.data?.data?.clients) {
        setClients(cRes.data.data.clients);
        if (cRes.data.data.clients.length > 0 && !formData.clientId) {
          setFormData((prev) => ({ ...prev, clientId: cRes.data.data.clients[0]._id }));
        }
      }
      if (wRes.data?.data?.works) {
        setWorkMasters(wRes.data.data.works);
        if (wRes.data.data.works.length > 0 && !formData.workMasterId) {
          setFormData((prev) => ({ ...prev, workMasterId: wRes.data.data.works[0]._id }));
        }
      }
      if (eRes.data?.data?.employees) {
        setEmployees(eRes.data.data.employees);
        if (eRes.data.data.employees.length > 0 && !formData.employeeId) {
          setFormData((prev) => ({ ...prev, employeeId: eRes.data.data.employees[0]._id }));
        }
      }
      if (aRes.data?.data?.works) {
        setRecentAssignments(aRes.data.data.works);
      }
    } catch (e) {
      // Fallback options
      setClients([
        { _id: 'c1', name: 'ABC Traders', businessName: 'ABC Traders', clientCode: 'CL-0001', pan: 'AABCA1234F', mobile: '9830112233', status: 'active', clientType: 'Business', businessType: 'Proprietorship', createdAt: '' },
        { _id: 'c2', name: 'XYZ Pvt Ltd', businessName: 'XYZ Pvt Ltd', clientCode: 'CL-0002', pan: 'AAACX5678G', mobile: '9820556677', status: 'active', clientType: 'Company', businessType: 'Private Limited', createdAt: '' },
        { _id: 'c3', name: 'Global Solutions', businessName: 'Global Solutions', clientCode: 'CL-0003', pan: 'AABCG9999K', mobile: '9811889900', status: 'active', clientType: 'Company', businessType: 'Public Limited', createdAt: '' },
      ]);
      setWorkMasters([
        { _id: 'w1', workId: 1, workName: 'GSTR-1 Filing', category: 'GST', timeline: '2 Days', defaultPriority: 'High', status: 'Active', createdAt: '' },
        { _id: 'w2', workId: 2, workName: 'ITR Filing', category: 'Income Tax', timeline: '5 Days', defaultPriority: 'Medium', status: 'Active', createdAt: '' },
        { _id: 'w3', workId: 3, workName: 'TDS Return Filing', category: 'TDS', timeline: '3 Days', defaultPriority: 'Medium', status: 'Active', createdAt: '' },
      ]);
      setEmployees([
        { _id: 'e1', employeeCode: 'EMP-0001', name: 'Tosif Raza', email: 'tosif@rizassociates.com', mobile: '9876543210', designation: 'CA Admin', department: 'Tax', status: 'active', createdAt: '' },
        { _id: 'e2', employeeCode: 'EMP-0002', name: 'Anita Desai', email: 'anita@rizassociates.com', mobile: '9876543211', designation: 'GST Manager', department: 'Indirect Tax', status: 'active', createdAt: '' },
        { _id: 'e3', employeeCode: 'EMP-0003', name: 'Vikram Roy', email: 'vikram@rizassociates.com', mobile: '9876543212', designation: 'Tax Senior', department: 'Direct Tax', status: 'active', createdAt: '' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  const handleAssignWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.workMasterId || !formData.employeeId) {
      toast.error('Please select Client, Work, and Employee.');
      return;
    }

    try {
      const res = await api.post('/work-assignments', formData);
      toast.success('Work assigned successfully! Assignment ID created.');
      setFormData((prev) => ({ ...prev, remarks: '' }));
      loadDropdownData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error assigning work';
      toast.error(msg);
    }
  };

  const handleReset = () => {
    setFormData({
      clientId: clients[0]?._id || '',
      workMasterId: workMasters[0]?._id || '',
      employeeId: employees[0]?._id || '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remarks: '',
      priority: 'Medium',
    });
    toast.info('Assignment form cleared.');
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/work-assignments/${id}/status`, { status: newStatus });
      toast.success(`Work status updated to ${newStatus}`);
      loadDropdownData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Breadcrumb matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-brand-500 mb-1 flex items-center gap-1.5">
            <NavLink to="/dashboard" className="hover:underline flex items-center gap-0.5">
              <span>«</span> Master Management
            </NavLink>
            <span className="text-light-textMuted dark:text-dark-textMuted">&gt;</span>
            <span className="text-light-textPrimary dark:text-dark-textPrimary">Work Assignment</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Work Assignment
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Assign works to clients and employees
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assignment Form Card matching screenshot exactly */}
        <div className="lg:col-span-5 p-6 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark transition-colors">
          <form onSubmit={handleAssignWork} className="space-y-4 text-xs font-medium">
            {/* Client Dropdown */}
            <div>
              <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                Client *
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.businessName || c.name} ({c.clientCode || c.pan})
                  </option>
                ))}
              </select>
            </div>

            {/* Work Dropdown */}
            <div>
              <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                Work *
              </label>
              <select
                required
                value={formData.workMasterId}
                onChange={(e) => setFormData({ ...formData, workMasterId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">Select Work</option>
                {workMasters.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.workName} ({w.category}) - {w.timeline}
                  </option>
                ))}
              </select>
            </div>

            {/* Assign To Employee Dropdown */}
            <div>
              <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                Assign To *
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} — {emp.designation}
                  </option>
                ))}
              </select>
            </div>

            {/* Due On Date Picker */}
            <div>
              <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                Due On *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            {/* Remarks Multiline */}
            <div>
              <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                Remarks
              </label>
              <textarea
                rows={4}
                placeholder="Enter remarks..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
              />
            </div>

            {/* Buttons matching screenshot: Reset & Assign Work */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-transparent text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-cardSecondary font-semibold transition-colors"
              >
                Reset
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
              >
                Assign Work
              </button>
            </div>
          </form>
        </div>

        {/* Live Active Work Assignment List */}
        <div className="lg:col-span-7 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-500" />
                <span className="font-bold text-sm text-light-textPrimary dark:text-dark-textPrimary">
                  Active Work Assignments
                </span>
              </div>
              <NavLink to="/works" className="text-xs font-semibold text-brand-500 hover:underline">
                View All Works →
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[11px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Work / Client</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
                  {recentAssignments.map((a: any) => (
                    <tr key={a._id} className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50">
                      <td className="py-3 px-4 font-semibold text-brand-500">{a.workCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-light-textPrimary dark:text-dark-textPrimary">
                          {a.workMasterId?.workName || 'Tax Filing'}
                        </div>
                        <div className="text-[11px] text-light-textSecondary dark:text-dark-textSecondary">
                          {a.clientId?.businessName || a.clientId?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary">
                        {a.employeeId?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-light-textSecondary dark:text-dark-textSecondary whitespace-nowrap">
                        {new Date(a.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            a.status === 'Completed' || a.status === 'Filed'
                              ? 'bg-status-greenLight text-status-green'
                              : a.status === 'In Progress'
                              ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-blue-400'
                              : 'bg-status-orangeLight text-status-orange'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {a.status !== 'Completed' && a.status !== 'Filed' && (
                          <button
                            onClick={() => handleStatusUpdate(a._id, 'Completed')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-status-green/10 text-status-green hover:bg-status-green/20 text-[11px] font-semibold transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Mark Done</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

