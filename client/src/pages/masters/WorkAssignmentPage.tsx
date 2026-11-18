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
    dueDate: '',
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
      }
      if (wRes.data?.data?.works) {
        setWorkMasters(wRes.data.data.works);
      }
      if (eRes.data?.data?.employees) {
        setEmployees(eRes.data.data.employees);
      }
      if (aRes.data?.data?.works) {
        setRecentAssignments(aRes.data.data.works);
      }
    } catch (e) {
      console.error('Error loading dropdown data:', e);
      setClients([]);
      setWorkMasters([]);
      setEmployees([]);
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
      setFormData({
        clientId: '',
        workMasterId: '',
        employeeId: '',
        dueDate: '',
        remarks: '',
        priority: 'Medium',
      });
      loadDropdownData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error assigning work';
      toast.error(msg);
    }
  };

  const handleReset = () => {
    setFormData({
      clientId: '',
      workMasterId: '',
      employeeId: '',
      dueDate: '',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Work Assignment
          </h1>
          <p className="text-xs sm:text-sm text-light-textSecondary dark:text-dark-textSecondary font-normal">
            Assign works to clients and employees
          </p>
        </div>
      </div>

      {/* Dependency Warning if no work templates configured */}
      {workMasters.length === 0 && !loading && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-normal text-amber-900 dark:text-amber-200">
                Dependency Notice: Work Assignment requires configured Work Templates
              </h4>
              <p className="text-[13px] text-amber-700 dark:text-amber-300">
                Work assignment depends on Work Master (which depends on Tax Master). Currently 0 Work Templates exist. Please configure Work Templates first.
              </p>
            </div>
          </div>
          <NavLink
            to="/masters/work"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-normal shrink-0 self-start sm:self-auto transition-all shadow-sm"
          >
            <span>Go to Work Master</span>
          </NavLink>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* New Work Assignment */}
        <div className="w-full xl:col-span-5 p-5 sm:p-7 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark transition-colors">
          <div className="flex items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-500">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-normal text-light-textPrimary dark:text-dark-textPrimary">New Work Assignment</h2>
                <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-0.5">Choose a client, work template, assignee, and due date.</p>
              </div>
            </div>
            <span className="hidden sm:inline text-xs text-light-textMuted dark:text-dark-textMuted">* Required fields</span>
          </div>

          <form onSubmit={handleAssignWork} className="space-y-5 text-xs font-normal">
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-x-6 gap-y-4">
            {/* Client Dropdown */}
            <div>
              <label className="block font-bold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
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
              <label className="block font-bold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
                Work *
              </label>
              <select
                required
                value={formData.workMasterId}
                onChange={(e) => setFormData({ ...formData, workMasterId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">Select Work</option>
                {workMasters.map((w: any) => {
                  const tName = typeof w.taxId === 'object' && w.taxId?.taxName ? w.taxId.taxName : '';
                  return (
                    <option key={w._id} value={w._id}>
                      {w.workName} {tName ? `[Tax: ${tName}]` : `[${w.category}]`} - {w.timeline}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Assign To Employee Dropdown */}
            <div>
              <label className="block font-bold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
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
              <label className="block font-bold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
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
            </div>

            {/* Remarks Multiline */}
            <div>
              <label className="block font-bold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
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
                className="px-5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-transparent text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-cardSecondary font-normal transition-colors"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={workMasters.length === 0}
                className={`px-6 py-2.5 rounded-xl font-normal transition-all ${
                  workMasters.length === 0
                    ? 'bg-gray-400 dark:bg-gray-700 text-gray-200 cursor-not-allowed opacity-75'
                    : 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 active:scale-95'
                }`}
              >
                Assign Work
              </button>
            </div>
          </form>
        </div>

        {/* Live Active Work Assignment List */}
        <div className="w-full min-w-0 xl:col-span-7 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-500" />
                <span className="font-normal text-sm text-light-textPrimary dark:text-dark-textPrimary">
                  Active Work Assignments
                </span>
              </div>
              <NavLink to="/works" className="text-xs font-normal text-brand-500 hover:underline">
                View All Works →
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-normal text-light-textSecondary dark:text-dark-textSecondary">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Work / Client</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-normal">
                  {recentAssignments.map((a: any) => (
                    <tr key={a._id} className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50">
                      <td className="py-3 px-4 font-normal text-brand-500">{a.workCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-normal text-light-textPrimary dark:text-dark-textPrimary">
                          {a.workMasterId?.workName || 'Tax Filing'}
                        </div>
                        {(a.taxName || a.workMasterId?.taxId?.taxName) && (
                          <div className="text-[12px] text-brand-600 dark:text-brand-400 font-normal flex items-center gap-1 mt-0.5">
                            <span>Tax: {a.taxName || a.workMasterId?.taxId?.taxName}</span>
                          </div>
                        )}
                        <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary">
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
                          className={`px-2.5 py-0.5 rounded-full text-[13px] font-normal ${
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-status-green/10 text-status-green hover:bg-status-green/20 text-[13px] font-normal transition-colors"
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

