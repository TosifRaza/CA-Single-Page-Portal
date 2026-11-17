import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building2,
  UserCheck,
  X,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  Filter,
  Eye,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { EmployeeItem, WorkMasterItem, ClientItem, WorkAssignmentItem } from '../../types';

interface ClientWorkSummary {
  clientId: string;
  clientName: string;
  clientCode: string;
  pan: string;
  mobile?: string;
  email?: string;
  worksCount: number;
  works: any[];
}

export const EmployeeMasterPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);

  // Dropdown data for assignment
  const [workMastersList, setWorkMastersList] = useState<WorkMasterItem[]>([]);
  const [clientsList, setClientsList] = useState<ClientItem[]>([]);

  // Assigned Works Modal/Drawer state
  const [selectedEmpForWorks, setSelectedEmpForWorks] = useState<EmployeeItem | null>(null);
  const [isWorksModalOpen, setIsWorksModalOpen] = useState(false);
  const [loadingAssignedWorks, setLoadingAssignedWorks] = useState(false);
  const [assignedWorksList, setAssignedWorksList] = useState<any[]>([]);
  const [clientSummaries, setClientSummaries] = useState<ClientWorkSummary[]>([]);
  const [worksStats, setWorksStats] = useState({
    totalWorks: 0,
    uniqueClients: 0,
    pending: 0,
    completed: 0,
  });
  const [worksViewMode, setWorksViewMode] = useState<'clientGrouped' | 'allList'>('clientGrouped');

  // Quick Assign Form in Works Modal
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [assignFormData, setAssignFormData] = useState({
    clientId: '',
    workMasterId: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    remarks: '',
  });

  // Employee Add/Edit Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    designation: '',
    department: 'Indirect Tax',
    status: 'active' as 'active' | 'inactive' | 'archived',
    // Optional initial work assignment during employee onboarding
    assignInitialWork: false,
    initialClientId: '',
    initialWorkMasterId: '',
    initialDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    initialPriority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    initialRemarks: '',
  });

  const departments = ['All', 'Direct Tax', 'Indirect Tax', 'Corporate & Regulatory', 'Audit & Accounts', 'Legal Research'];

  // Load masters & clients for dropdowns
  const loadDropdownOptions = async () => {
    try {
      const [wRes, cRes] = await Promise.all([
        api.get('/work-masters?limit=100'),
        api.get('/clients?limit=100'),
      ]);
      if (wRes.data?.data?.works) {
        setWorkMastersList(wRes.data.data.works);
      }
      if (cRes.data?.data?.clients) {
        setClientsList(cRes.data.data.clients);
      }
    } catch (e) {
      console.error('Failed to load dropdown options:', e);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/employees?search=${encodeURIComponent(search)}&department=${departmentFilter}`);
      if (res.data?.data?.employees) {
        setEmployees(res.data.data.employees);
      }
    } catch (e) {
      console.error('Failed to fetch employees:', e);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    loadDropdownOptions();
  }, [search, departmentFilter]);

  // Open Assigned Works Modal for an employee
  const handleOpenAssignedWorks = async (emp: EmployeeItem) => {
    setSelectedEmpForWorks(emp);
    setIsWorksModalOpen(true);
    setShowAssignForm(false);
    setLoadingAssignedWorks(true);

    try {
      const res = await api.get(`/employees/${emp._id}/works`);
      if (res.data) {
        setAssignedWorksList(res.data.data || []);
        setClientSummaries(res.data.clientSummary || []);
        setWorksStats(res.data.stats || {
          totalWorks: res.data.data?.length || 0,
          uniqueClients: res.data.clientSummary?.length || 0,
          pending: (res.data.data || []).filter((w: any) => ['Pending', 'In Progress', 'Under Review'].includes(w.status)).length,
          completed: (res.data.data || []).filter((w: any) => ['Completed', 'Filed'].includes(w.status)).length,
        });
      }
    } catch (err) {
      console.error('Failed to load employee assigned works:', err);
      toast.error('Could not load assigned works');
    } finally {
      setLoadingAssignedWorks(false);
    }
  };

  // Quick Assign Work from inside the modal
  const handleAssignWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForWorks) return;
    if (!assignFormData.clientId || !assignFormData.workMasterId) {
      toast.error('Please select both a Client and a Work template');
      return;
    }

    try {
      setSubmittingAssign(true);
      await api.post(`/employees/${selectedEmpForWorks._id}/assign-work`, assignFormData);
      toast.success('Work assigned successfully to ' + selectedEmpForWorks.name);

      // Reset assign form and refresh modal data
      setAssignFormData((prev) => ({
        ...prev,
        remarks: '',
      }));
      setShowAssignForm(false);

      // Re-fetch employee assigned works
      const res = await api.get(`/employees/${selectedEmpForWorks._id}/works`);
      if (res.data) {
        setAssignedWorksList(res.data.data || []);
        setClientSummaries(res.data.clientSummary || []);
        setWorksStats(res.data.stats || {
          totalWorks: res.data.data?.length || 0,
          uniqueClients: res.data.clientSummary?.length || 0,
          pending: 0,
          completed: 0,
        });
      }

      // Refresh parent table
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign work');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          designation: formData.designation,
          department: formData.department,
          status: formData.status,
        });
        toast.success('Employee updated');
      } else {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          designation: formData.designation,
          department: formData.department,
          status: formData.status,
        };

        if (formData.assignInitialWork && formData.initialClientId && formData.initialWorkMasterId) {
          payload.initialAssignments = [
            {
              clientId: formData.initialClientId,
              workMasterId: formData.initialWorkMasterId,
              dueDate: formData.initialDueDate,
              priority: formData.initialPriority,
              remarks: formData.initialRemarks || `Assigned during onboarding of ${formData.name}`,
            },
          ];
        }

        await api.post('/employees', payload);
        toast.success('Employee registered successfully' + (payload.initialAssignments ? ' with assigned work!' : ''));
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
      assignInitialWork: false,
      initialClientId: clientsList[0]?._id || '',
      initialWorkMasterId: workMastersList[0]?._id || '',
      initialDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      initialPriority: 'Medium',
      initialRemarks: '',
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
      assignInitialWork: false,
      initialClientId: '',
      initialWorkMasterId: '',
      initialDueDate: '',
      initialPriority: 'Medium',
      initialRemarks: '',
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
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
            Manage practice personnel, view assigned client works, and allocate responsibilities
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

      {/* Main Table Card */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-light-border/60 dark:border-dark-border/60">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-light-textMuted dark:text-dark-textMuted" />
            <input
              type="text"
              placeholder="Search employee by name, code, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary focus:outline-none w-full sm:w-auto"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/40 text-[13px] font-semibold text-light-textSecondary dark:text-dark-textSecondary">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Email / Mobile</th>
                <th className="py-3 px-4">Assigned Works & Clients</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-light-textMuted">
                    Loading personnel...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-light-textMuted">
                    No employees found matching filter.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const worksCount = emp.assignedWorksCount ?? 0;
                  const clientsCount = emp.assignedClientsCount ?? 0;

                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-light-bg/50 dark:hover:bg-dark-cardSecondary/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-brand-500 font-mono">
                        {emp.employeeCode}
                      </td>
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
                        <div>{emp.email}</div>
                        <div className="text-[12px] text-light-textMuted dark:text-dark-textMuted font-mono">
                          {emp.mobile}
                        </div>
                      </td>

                      {/* Work Assign Field / Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenAssignedWorks(emp)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 transition-all cursor-pointer group"
                            title="Click to view client work breakdown"
                          >
                            <Briefcase className="w-3.5 h-3.5 text-brand-500" />
                            <span>
                              {worksCount} {worksCount === 1 ? 'Work' : 'Works'}
                            </span>
                            <span className="text-[12px] opacity-75 font-normal">
                              ({clientsCount} {clientsCount === 1 ? 'Client' : 'Clients'})
                            </span>
                            <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedEmpForWorks(emp);
                              setIsWorksModalOpen(true);
                              setShowAssignForm(true);
                              setAssignFormData({
                                clientId: clientsList[0]?._id || '',
                                workMasterId: workMastersList[0]?._id || '',
                                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                priority: 'Medium',
                                remarks: '',
                              });
                              handleOpenAssignedWorks(emp);
                            }}
                            className="p-1 rounded-md text-light-textMuted hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-dark-card transition-colors"
                            title="Assign New Work"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[13px] font-semibold ${
                            emp.status === 'active'
                              ? 'bg-status-greenLight text-status-green dark:bg-status-green/20'
                              : 'bg-light-border dark:bg-dark-border text-light-textMuted'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAssignedWorks(emp)}
                            className="p-1.5 rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:text-brand-500 hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
                            title="View Assigned Works"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:text-brand-500 hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
                            title="Edit Employee"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp._id)}
                            className="p-1.5 rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:text-status-red hover:bg-light-bg dark:hover:bg-dark-cardSecondary transition-colors"
                            title="Archive Employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW ASSIGNED WORKS & CLIENTS BREAKDOWN FOR EMPLOYEE */}
      {/* ========================================================================= */}
      {isWorksModalOpen && selectedEmpForWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-cardSecondary/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
                  {selectedEmpForWorks.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary">
                      {selectedEmpForWorks.name}
                    </h3>
                    <span className="font-mono text-[13px] font-semibold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-500/20">
                      {selectedEmpForWorks.employeeCode}
                    </span>
                  </div>
                  <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                    {selectedEmpForWorks.designation} • {selectedEmpForWorks.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAssignForm(!showAssignForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAssignForm ? 'Close Form' : 'Assign Work'}</span>
                </button>
                <button
                  onClick={() => setIsWorksModalOpen(false)}
                  className="p-1.5 rounded-lg text-light-textMuted hover:text-light-textPrimary dark:hover:text-dark-textPrimary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Quick KPI Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-light-bg dark:bg-dark-cardSecondary border border-light-border dark:border-dark-border">
                  <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary font-medium flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-brand-500" />
                    Total Works
                  </div>
                  <div className="text-xl font-bold text-light-textPrimary dark:text-dark-textPrimary mt-1">
                    {worksStats.totalWorks}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-light-bg dark:bg-dark-cardSecondary border border-light-border dark:border-dark-border">
                  <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary font-medium flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    Clients Serviced
                  </div>
                  <div className="text-xl font-bold text-light-textPrimary dark:text-dark-textPrimary mt-1">
                    {worksStats.uniqueClients}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-light-bg dark:bg-dark-cardSecondary border border-light-border dark:border-dark-border">
                  <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Pending / Active
                  </div>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {worksStats.pending}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-light-bg dark:bg-dark-cardSecondary border border-light-border dark:border-dark-border">
                  <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                    Completed / Filed
                  </div>
                  <div className="text-xl font-bold text-status-green mt-1">
                    {worksStats.completed}
                  </div>
                </div>
              </div>

              {/* Collapsible Assign Work Form */}
              {showAssignForm && (
                <form
                  onSubmit={handleAssignWorkSubmit}
                  className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-500/5 border border-brand-200 dark:border-brand-500/20 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      Assign New Work to {selectedEmpForWorks.name}
                    </h4>
                    <span className="text-[13px] text-light-textMuted">Fields marked with * are required</span>
                  </div>

                  {workMastersList.length === 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                      <strong>Dependency Notice:</strong> Work assignment depends on Work Master templates (which depend on Tax Master). Currently no Work Templates exist. Please create a Work Template in Work Master first.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                        Client *
                      </label>
                      <select
                        required
                        value={assignFormData.clientId}
                        onChange={(e) => setAssignFormData({ ...assignFormData, clientId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      >
                        <option value="">Select Client...</option>
                        {clientsList.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.businessName || c.name} ({c.clientCode || c.pan})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                        Work Template (Work Master) *
                      </label>
                      <select
                        required
                        value={assignFormData.workMasterId}
                        onChange={(e) => setAssignFormData({ ...assignFormData, workMasterId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      >
                        <option value="">Select Work Template...</option>
                        {workMastersList.map((w: any) => {
                          const tName = typeof w.taxId === 'object' && w.taxId?.taxName ? w.taxId.taxName : '';
                          return (
                            <option key={w._id} value={w._id}>
                              {w.workName} {tName ? `[Tax: ${tName}]` : `[${w.category}]`} - {w.timeline}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={assignFormData.dueDate}
                        onChange={(e) => setAssignFormData({ ...assignFormData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                        Priority
                      </label>
                      <select
                        value={assignFormData.priority}
                        onChange={(e) => setAssignFormData({ ...assignFormData, priority: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary text-xs">
                      Remarks / Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Please collect purchase invoices first..."
                      value={assignFormData.remarks}
                      onChange={(e) => setAssignFormData({ ...assignFormData, remarks: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAssignForm(false)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-light-border dark:border-dark-border text-light-textSecondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAssign || workMastersList.length === 0}
                      className="px-4 py-1.5 text-xs rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold disabled:opacity-50 transition-all shadow-sm"
                    >
                      {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                  </div>
                </form>
              )}

              {/* View Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-light-border/60 dark:border-dark-border/60">
                <div className="text-xs font-bold text-light-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                  <span>Assigned Work Details</span>
                  <span className="text-[13px] font-normal text-light-textSecondary">
                    (Breakdown of which clients' works are assigned and their counts)
                  </span>
                </div>

                <div className="inline-flex p-0.5 rounded-lg bg-light-bg dark:bg-dark-cardSecondary border border-light-border dark:border-dark-border text-xs">
                  <button
                    onClick={() => setWorksViewMode('clientGrouped')}
                    className={`px-3 py-1 rounded-md text-[13px] font-semibold transition-all ${
                      worksViewMode === 'clientGrouped'
                        ? 'bg-white dark:bg-dark-card shadow-sm text-brand-600 dark:text-brand-300'
                        : 'text-light-textSecondary dark:text-dark-textSecondary'
                    }`}
                  >
                    Group by Client ({clientSummaries.length})
                  </button>
                  <button
                    onClick={() => setWorksViewMode('allList')}
                    className={`px-3 py-1 rounded-md text-[13px] font-semibold transition-all ${
                      worksViewMode === 'allList'
                        ? 'bg-white dark:bg-dark-card shadow-sm text-brand-600 dark:text-brand-300'
                        : 'text-light-textSecondary dark:text-dark-textSecondary'
                    }`}
                  >
                    All Works List ({assignedWorksList.length})
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loadingAssignedWorks ? (
                <div className="py-12 text-center text-xs text-light-textMuted">
                  Loading assigned works for this employee...
                </div>
              ) : assignedWorksList.length === 0 ? (
                <div className="py-12 text-center rounded-xl bg-light-bg/40 dark:bg-dark-cardSecondary/30 border border-dashed border-light-border dark:border-dark-border">
                  <Briefcase className="w-8 h-8 text-light-textMuted mx-auto mb-2" />
                  <p className="text-xs font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                    No works assigned to {selectedEmpForWorks.name} yet.
                  </p>
                  <p className="text-[13px] text-light-textMuted mt-1">
                    Click "Assign Work" above to assign a client work to this employee.
                  </p>
                </div>
              ) : worksViewMode === 'clientGrouped' ? (
                /* Grouped By Client View */
                <div className="space-y-3">
                  {clientSummaries.map((cs) => (
                    <div
                      key={cs.clientId}
                      className="rounded-xl border border-light-border dark:border-dark-border bg-light-bg/30 dark:bg-dark-cardSecondary/20 overflow-hidden"
                    >
                      {/* Client Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-light-bg/60 dark:bg-dark-cardSecondary/40 border-b border-light-border/60 dark:border-dark-border/60 gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                            <Building className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-light-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                              <span>{cs.clientName}</span>
                              <span className="font-mono text-[12px] text-light-textMuted dark:text-dark-textMuted">
                                {cs.clientCode}
                              </span>
                            </div>
                            <div className="text-[12px] text-light-textSecondary">
                              PAN: <span className="font-mono font-semibold">{cs.pan}</span>
                              {cs.mobile && <span> • Mobile: {cs.mobile}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs font-semibold text-brand-600 dark:text-brand-300 self-start sm:self-auto">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                          <span>
                            {cs.worksCount} {cs.worksCount === 1 ? 'Work' : 'Works'} Assigned
                          </span>
                        </div>
                      </div>

                      {/* Works Under This Client */}
                      <div className="divide-y divide-light-border/40 dark:divide-dark-border/40 text-xs">
                        {cs.works.map((w: any) => {
                          const workName = w.workMasterId?.workName || 'General Work';
                          const category = w.workMasterId?.category || 'Compliance';

                          return (
                            <div
                              key={w._id}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-light-bg/60 dark:hover:bg-dark-cardSecondary/40 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-light-textPrimary dark:text-dark-textPrimary">
                                    {workName}
                                  </span>
                                  {w.taxName && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300 border border-brand-200/60 dark:border-brand-500/20">
                                      Tax: {w.taxName}
                                    </span>
                                  )}
                                  <span className="font-mono text-[12px] text-light-textMuted">
                                    ({w.workCode})
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[12px] font-bold bg-light-border/60 dark:bg-dark-border text-light-textSecondary">
                                    {category}
                                  </span>
                                </div>
                                {w.remarks && (
                                  <p className="text-[13px] text-light-textSecondary italic">
                                    "{w.remarks}"
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-[13px]">
                                <div className="flex items-center gap-1 text-light-textSecondary">
                                  <Calendar className="w-3.5 h-3.5 text-light-textMuted" />
                                  <span>Due: {new Date(w.dueDate).toLocaleDateString()}</span>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded text-[12px] font-bold ${
                                    w.priority === 'Urgent'
                                      ? 'bg-status-red/10 text-status-red'
                                      : w.priority === 'High'
                                      ? 'bg-amber-500/10 text-amber-600'
                                      : 'bg-light-border dark:bg-dark-border text-light-textSecondary'
                                  }`}
                                >
                                  {w.priority}
                                </span>

                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[12px] font-bold ${
                                    ['Completed', 'Filed'].includes(w.status)
                                      ? 'bg-status-greenLight text-status-green'
                                      : w.status === 'In Progress'
                                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300'
                                      : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'
                                  }`}
                                >
                                  {w.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Flat All Works List View */
                <div className="overflow-x-auto border border-light-border dark:border-dark-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-cardSecondary/50 text-[13px] font-semibold text-light-textSecondary">
                        <th className="py-2.5 px-3">Work Code</th>
                        <th className="py-2.5 px-3">Work Name</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 font-medium">
                      {assignedWorksList.map((w: any) => (
                        <tr key={w._id} className="hover:bg-light-bg/40 dark:hover:bg-dark-cardSecondary/40">
                          <td className="py-2.5 px-3 font-mono text-brand-500 font-semibold">{w.workCode}</td>
                          <td className="py-2.5 px-3 font-bold text-light-textPrimary dark:text-dark-textPrimary">
                            {w.workMasterId?.workName || 'General Work'}
                          </td>
                          <td className="py-2.5 px-3 text-light-textSecondary">
                            <div className="font-semibold">{w.clientId?.businessName || w.clientId?.name}</div>
                            <div className="text-[12px] text-light-textMuted font-mono">{w.clientId?.pan}</div>
                          </td>
                          <td className="py-2.5 px-3 text-light-textSecondary">
                            {new Date(w.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[12px] font-bold ${
                                w.priority === 'Urgent'
                                  ? 'bg-status-red/10 text-status-red'
                                  : w.priority === 'High'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-light-border dark:bg-dark-border text-light-textSecondary'
                              }`}
                            >
                              {w.priority}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${
                                ['Completed', 'Filed'].includes(w.status)
                                  ? 'bg-status-greenLight text-status-green'
                                  : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-cardSecondary/30 flex items-center justify-between">
              <span className="text-[13px] text-light-textSecondary">
                Total {worksStats.totalWorks} assigned tasks across {worksStats.uniqueClients} clients
              </span>
              <button
                type="button"
                onClick={() => setIsWorksModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-xs font-semibold hover:bg-light-border/40 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT EMPLOYEE WITH OPTIONAL WORK ASSIGN FIELD */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-bold text-base text-light-textPrimary dark:text-dark-textPrimary">
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-light-textMuted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@rizassociates.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                    Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tax Associate"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                    Department
                  </label>
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
              </div>

              {/* Status field */}
              {editingEmployee && (
                <div>
                  <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}

              {/* ========================================================= */}
              {/* ASSIGN WORK FIELD SECTION DURING EMPLOYEE CREATION */}
              {/* ========================================================= */}
              {!editingEmployee && (
                <div className="pt-2 border-t border-light-border dark:border-dark-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignInitialWork}
                        onChange={(e) => setFormData({ ...formData, assignInitialWork: e.target.checked })}
                        className="rounded text-brand-500 focus:ring-brand-500"
                      />
                      <span className="font-bold text-light-textPrimary dark:text-dark-textPrimary">
                        Assign Initial Work (Work Master Allocation)
                      </span>
                    </label>
                    <span className="text-[12px] text-light-textMuted">Optional</span>
                  </div>

                  {formData.assignInitialWork && (
                    <div className="p-3.5 rounded-xl bg-brand-50/50 dark:bg-brand-500/5 border border-brand-200 dark:border-brand-500/20 space-y-2.5 animate-in fade-in">
                      <div>
                        <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                          Select Client *
                        </label>
                        <select
                          value={formData.initialClientId}
                          onChange={(e) => setFormData({ ...formData, initialClientId: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                        >
                          <option value="">Select a Client...</option>
                          {clientsList.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.businessName || c.name} ({c.clientCode || c.pan})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                          Work Template (Work Master) *
                        </label>
                        <select
                          value={formData.initialWorkMasterId}
                          onChange={(e) => setFormData({ ...formData, initialWorkMasterId: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                        >
                          <option value="">Select Work Template...</option>
                          {workMastersList.map((w) => (
                            <option key={w._id} value={w._id}>
                              {w.workName} [{w.category}] - {w.timeline}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={formData.initialDueDate}
                            onChange={(e) => setFormData({ ...formData, initialDueDate: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1 text-light-textPrimary dark:text-dark-textPrimary">
                            Priority
                          </label>
                          <select
                            value={formData.initialPriority}
                            onChange={(e) => setFormData({ ...formData, initialPriority: e.target.value as any })}
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-light-border dark:border-dark-border text-light-textSecondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all shadow-sm"
                >
                  {editingEmployee ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
