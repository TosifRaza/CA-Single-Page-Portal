import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';

// Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { TaxGroupMasterPage } from './pages/masters/TaxGroupMasterPage';
import { TaxMasterPage } from './pages/masters/TaxMasterPage';
import { WorkMasterPage } from './pages/masters/WorkMasterPage';
import { ClientMasterPage } from './pages/masters/ClientMasterPage';
import { WorkAssignmentPage } from './pages/masters/WorkAssignmentPage';
import { EmployeeMasterPage } from './pages/masters/EmployeeMasterPage';
import { DocumentMasterPage } from './pages/masters/DocumentMasterPage';
import { FinancialYearPage } from './pages/masters/FinancialYearPage';
import { BranchMasterPage } from './pages/masters/BranchMasterPage';
import { ServiceMasterPage } from './pages/masters/ServiceMasterPage';
import { ClientsPage } from './pages/operations/ClientsPage';
import { WorksPage } from './pages/operations/WorksPage';
import { PaymentsPage } from './pages/operations/PaymentsPage';
import { ReportsPage } from './pages/operations/ReportsPage';
import { GeneralSettingsPage } from './pages/settings/GeneralSettingsPage';
import { UsersRolesPage } from './pages/settings/UsersRolesPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Application Shell */}
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Master Management */}
              <Route path="/masters/tax-groups" element={<TaxGroupMasterPage />} />
              <Route path="/masters/tax" element={<TaxMasterPage />} />
              <Route path="/masters/work" element={<WorkMasterPage />} />
              <Route path="/masters/clients" element={<ClientMasterPage />} />
              <Route path="/masters/employees" element={<EmployeeMasterPage />} />
              <Route path="/masters/work-assignment" element={<WorkAssignmentPage />} />
              <Route path="/masters/documents" element={<DocumentMasterPage />} />
              <Route path="/masters/financial-years" element={<FinancialYearPage />} />
              <Route path="/masters/branches" element={<BranchMasterPage />} />
              <Route path="/masters/services" element={<ServiceMasterPage />} />

              {/* Operations */}
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientsPage />} />
              <Route path="/works" element={<WorksPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* Settings */}
              <Route path="/settings/general" element={<GeneralSettingsPage />} />
              <Route path="/settings/users" element={<UsersRolesPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
