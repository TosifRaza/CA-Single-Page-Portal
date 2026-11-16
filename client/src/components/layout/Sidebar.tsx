import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Tags,
  Briefcase,
  Users,
  UserCheck,
  ClipboardList,
  FolderLock,
  Calendar,
  Building2,
  Layers,
  FileCheck2,
  CreditCard,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mastersOpen, setMastersOpen] = useState(true);
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-[240px] bg-light-sidebar dark:bg-dark-sidebar border-r border-light-border dark:border-dark-border transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-light-border/60 dark:border-dark-border/60">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-brand-600 text-white shadow-md shadow-blue-500/20 font-bold text-lg tracking-wider">
            <span>CA</span>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-status-green rounded-full border-2 border-white dark:border-dark-sidebar" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[17px] tracking-tight text-light-textPrimary dark:text-dark-textPrimary leading-tight">
              CA ProFlow
            </span>
            <span className="text-[11px] font-medium text-light-textSecondary dark:text-dark-textSecondary tracking-wide">
              Simplifying Compliance
            </span>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-[13px] font-medium">
          {/* Dashboard Item */}
          <div>
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                isActive('/dashboard')
                  ? 'bg-brand-500 text-white font-semibold shadow-sm shadow-blue-500/30'
                  : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
              }`}
            >
              <LayoutDashboard className="w-[18px] h-[18px]" />
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* Master Management Group */}
          <div>
            <button
              onClick={() => setMastersOpen(!mastersOpen)}
              className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-light-textMuted dark:text-dark-textMuted hover:text-light-textPrimary dark:hover:text-dark-textPrimary"
            >
              <span>Master Management</span>
              {mastersOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {mastersOpen && (
              <div className="mt-1 space-y-0.5">
                <NavLink
                  to="/masters/tax-groups"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/tax-groups')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <Tags className="w-4 h-4" />
                  <span>Tax Group Master</span>
                </NavLink>

                <NavLink
                  to="/masters/tax"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/tax')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Tax Master</span>
                </NavLink>

                <NavLink
                  to="/masters/work"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/work')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Work Master</span>
                </NavLink>

                <NavLink
                  to="/masters/clients"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/clients')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Client Master</span>
                </NavLink>

                <NavLink
                  to="/masters/employees"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/employees')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Employee Master</span>
                </NavLink>

                <NavLink
                  to="/masters/work-assignment"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/work-assignment')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Work Assignment</span>
                </NavLink>

                <NavLink
                  to="/masters/documents"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/documents')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <FolderLock className="w-4 h-4" />
                  <span>Document Master</span>
                </NavLink>

                <NavLink
                  to="/masters/financial-years"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/financial-years')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Financial Year</span>
                </NavLink>

                <NavLink
                  to="/masters/branches"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/branches')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Branch Master</span>
                </NavLink>

                <NavLink
                  to="/masters/services"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/masters/services')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Service Master</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Operations Group */}
          <div>
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-light-textMuted dark:text-dark-textMuted hover:text-light-textPrimary dark:hover:text-dark-textPrimary"
            >
              <span>Operations</span>
              {operationsOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {operationsOpen && (
              <div className="mt-1 space-y-0.5">
                <NavLink
                  to="/clients"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/clients')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Clients</span>
                </NavLink>

                <NavLink
                  to="/works"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/works')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Works & Filings</span>
                </NavLink>

                <NavLink
                  to="/payments"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/payments')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payments</span>
                </NavLink>

                <NavLink
                  to="/reports"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/reports')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Reports</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Settings Group */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-light-textMuted dark:text-dark-textMuted hover:text-light-textPrimary dark:hover:text-dark-textPrimary"
            >
              <span>Settings</span>
              {settingsOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {settingsOpen && (
              <div className="mt-1 space-y-0.5">
                <NavLink
                  to="/settings/general"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/settings/general')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>General Settings</span>
                </NavLink>

                <NavLink
                  to="/settings/users"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    isActive('/settings/users')
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-border/40 dark:hover:bg-dark-card hover:text-light-textPrimary dark:hover:text-dark-textPrimary'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Users & Roles</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="relative p-3 border-t border-light-border dark:border-dark-border bg-light-card/60 dark:bg-dark-card/40">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-light-border/40 dark:hover:bg-dark-card transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                alt={user?.name || 'User'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/30"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-light-textPrimary dark:text-dark-textPrimary truncate">
                  {user?.name || 'Tosif Raza'}
                </span>
                <span className="text-[11px] font-medium text-light-textSecondary dark:text-dark-textSecondary truncate">
                  {user?.role || 'CA Admin'}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-light-textMuted dark:text-dark-textMuted flex-shrink-0" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute bottom-16 left-3 right-3 p-1.5 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-light-border dark:border-dark-border z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  navigate('/settings/general');
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs rounded-lg text-light-textPrimary dark:text-dark-textPrimary hover:bg-light-bg dark:hover:bg-dark-cardSecondary"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Account Settings</span>
              </button>
              <div className="my-1 border-t border-light-border/60 dark:border-dark-border/60" />
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs rounded-lg text-status-red hover:bg-status-redLight/40 dark:hover:bg-status-red/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
