import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

import * as authCtrl from '../controllers/authController.js';
import * as dashCtrl from '../controllers/dashboardController.js';
import * as taxGroupCtrl from '../controllers/taxGroupController.js';
import * as taxCtrl from '../controllers/taxMasterController.js';
import * as taxFilingCtrl from '../controllers/taxFilingController.js';
import * as workMasterCtrl from '../controllers/workMasterController.js';
import * as clientCtrl from '../controllers/clientMasterController.js';
import * as workAssignCtrl from '../controllers/workAssignmentController.js';
import * as empCtrl from '../controllers/employeeMasterController.js';
import * as mastersCtrl from '../controllers/mastersController.js';
import * as docCtrl from '../controllers/documentController.js';
import * as paymentCtrl from '../controllers/paymentController.js';
import * as reportCtrl from '../controllers/reportController.js';
import * as notifCtrl from '../controllers/notificationController.js';
import * as searchCtrl from '../controllers/searchController.js';
import * as settingsCtrl from '../controllers/settingsController.js';

const router = Router();

// --- Auth Routes ---
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', authCtrl.register);
router.post('/auth/refresh', authCtrl.refreshToken);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.getMe);

// --- Dashboard Routes ---
router.get('/dashboard/stats', authenticate, dashCtrl.getDashboardStats);

// --- Tax Group Master Routes ---
router.get('/tax-groups', authenticate, taxGroupCtrl.getTaxGroups);
router.post('/tax-groups', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), taxGroupCtrl.createTaxGroup);
router.put('/tax-groups/:id', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), taxGroupCtrl.updateTaxGroup);
router.delete('/tax-groups/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), taxGroupCtrl.deleteTaxGroup);

// --- Tax Master & Tax Rule Routes ---
router.get('/taxes', authenticate, taxCtrl.getTaxes);
router.get('/taxes/:id', authenticate, taxCtrl.getTaxById);
router.post('/taxes', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), taxCtrl.createTax);
router.put('/taxes/:id', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), taxCtrl.updateTax);
router.patch('/taxes/:id', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), taxCtrl.updateTax);
router.delete('/taxes/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), taxCtrl.deleteTax);

// --- Tax Filing Compliance Routes ---
router.get('/tax-filings', authenticate, taxFilingCtrl.getTaxFilings);
router.get('/tax-filings/:id', authenticate, taxFilingCtrl.getTaxFilingById);
router.post('/tax-filings', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), taxFilingCtrl.createTaxFiling);
router.patch('/tax-filings/:id', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), taxFilingCtrl.updateTaxFiling);
router.patch('/tax-filings/:id/status', authenticate, taxFilingCtrl.updateFilingStatus);
router.patch('/tax-filings/:id/reconciliation', authenticate, taxFilingCtrl.updateReconciliation);
router.post('/tax-filings/:id/extend-deadline', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), taxFilingCtrl.extendDeadline);
router.delete('/tax-filings/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), taxFilingCtrl.deleteTaxFiling);

// --- Work Master Routes ---
router.get('/work-masters', authenticate, workMasterCtrl.getWorkMasters);
router.post('/work-masters', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), workMasterCtrl.createWorkMaster);
router.put('/work-masters/:id', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), workMasterCtrl.updateWorkMaster);
router.delete('/work-masters/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), workMasterCtrl.deleteWorkMaster);

// --- Client Routes ---
router.get('/clients', authenticate, clientCtrl.getClients);
router.get('/clients/export', authenticate, clientCtrl.exportClientsCSV);
router.get('/clients/:id', authenticate, clientCtrl.getClientById);
router.post('/clients', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), clientCtrl.createClient);
router.put('/clients/:id', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), clientCtrl.updateClient);
router.patch('/clients/:id', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), clientCtrl.updateClient);
router.delete('/clients/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), clientCtrl.deleteClient);

// --- Work Assignment Routes ---
router.get('/work-assignments', authenticate, workAssignCtrl.getWorkAssignments);
router.get('/work-assignments/:id', authenticate, workAssignCtrl.getWorkAssignmentById);
router.post('/work-assignments', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), workAssignCtrl.createWorkAssignment);
router.put('/work-assignments/:id', authenticate, workAssignCtrl.updateWorkAssignment);
router.patch('/work-assignments/:id/status', authenticate, workAssignCtrl.updateWorkStatus);
router.delete('/work-assignments/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), workAssignCtrl.deleteWorkAssignment);

// --- Employee Master Routes ---
router.get('/employees', authenticate, empCtrl.getEmployees);
router.post('/employees', authenticate, requireRole(['Super Admin', 'CA Admin']), empCtrl.createEmployee);
router.put('/employees/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), empCtrl.updateEmployee);
router.delete('/employees/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), empCtrl.deleteEmployee);
router.get('/employees/:id/works', authenticate, empCtrl.getEmployeeAssignedWorks);

// --- Other Masters (FY, Branch, Service, DocCategory) ---
router.get('/financial-years', authenticate, mastersCtrl.getFinancialYears);
router.post('/financial-years', authenticate, requireRole(['Super Admin', 'CA Admin']), mastersCtrl.createFinancialYear);
router.patch('/financial-years/:id/activate', authenticate, requireRole(['Super Admin', 'CA Admin']), mastersCtrl.setActiveFinancialYear);

router.get('/branches', authenticate, mastersCtrl.getBranches);
router.post('/branches', authenticate, requireRole(['Super Admin', 'CA Admin']), mastersCtrl.createBranch);
router.put('/branches/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), mastersCtrl.updateBranch);
router.delete('/branches/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), mastersCtrl.deleteBranch);

router.get('/services', authenticate, mastersCtrl.getServices);
router.post('/services', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), mastersCtrl.createService);
router.put('/services/:id', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), mastersCtrl.updateService);
router.delete('/services/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), mastersCtrl.deleteService);

router.get('/document-categories', authenticate, mastersCtrl.getDocumentCategories);
router.post('/document-categories', authenticate, requireRole(['Super Admin', 'CA Admin']), mastersCtrl.createDocumentCategory);

// --- Documents ---
router.get('/documents', authenticate, docCtrl.getDocuments);
router.post('/documents/upload', authenticate, upload.single('file'), docCtrl.uploadDocument);
router.get('/documents/:id/download', authenticate, docCtrl.downloadDocument);
router.delete('/documents/:id', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), docCtrl.deleteDocument);

// --- Payments ---
router.get('/payments', authenticate, paymentCtrl.getPayments);
router.post('/payments', authenticate, requireRole(['Super Admin', 'CA Admin', 'Manager']), paymentCtrl.createPayment);
router.put('/payments/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), paymentCtrl.updatePayment);
router.delete('/payments/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), paymentCtrl.deletePayment);

// --- Reports ---
router.get('/reports/overview', authenticate, reportCtrl.getReportsOverview);

// --- Notifications ---
router.get('/notifications', authenticate, notifCtrl.getNotifications);
router.patch('/notifications/:id/read', authenticate, notifCtrl.markAsRead);
router.post('/notifications/mark-all-read', authenticate, notifCtrl.markAllAsRead);

// --- Global Search ---
router.get('/search', authenticate, searchCtrl.globalSearch);

// --- Settings & Users ---
router.get('/settings/general', authenticate, settingsCtrl.getGeneralSettings);
router.put('/settings/general', authenticate, requireRole(['Super Admin', 'CA Admin']), settingsCtrl.updateGeneralSettings);
router.get('/settings/users', authenticate, requireRole(['Super Admin', 'CA Admin']), settingsCtrl.getUsers);
router.post('/settings/users', authenticate, requireRole(['Super Admin', 'CA Admin']), settingsCtrl.createUser);
router.patch('/settings/users/:id', authenticate, requireRole(['Super Admin', 'CA Admin']), settingsCtrl.updateUserRole);

export default router;
