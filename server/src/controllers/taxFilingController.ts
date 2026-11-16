import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TaxFiling } from '../models/TaxFiling.js';
import { TaxMaster } from '../models/TaxMaster.js';
import { FinancialYear } from '../models/Masters.js';
import { ActivityLog } from '../models/Operations.js';
import {
  taxFilingSchema,
  extendDeadlineSchema,
  updateFilingStatusSchema,
  updateReconciliationSchema,
} from '../validators/index.js';

export const getTaxFilings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = new mongoose.Types.ObjectId(req.user!.organizationId);
    const {
      clientId,
      taxRuleId,
      status,
      reconciliationStatus,
      search,
      page = '1',
      limit = '10',
      sortBy = 'effectiveDueDate',
      order = 'asc',
    } = req.query;

    const query: any = { organizationId };

    if (clientId && clientId !== 'All') {
      query.clientId = new mongoose.Types.ObjectId(clientId as string);
    }

    if (taxRuleId && taxRuleId !== 'All') {
      query.taxRuleId = new mongoose.Types.ObjectId(taxRuleId as string);
    }

    if (status && status !== 'All') {
      query.filingStatus = status;
    }

    if (reconciliationStatus && reconciliationStatus !== 'All') {
      query.reconciliationStatus = reconciliationStatus;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { acknowledgementNumber: searchRegex },
        { filingRemarks: searchRegex },
        { extensionReference: searchRegex },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'desc' ? -1 : 1;

    const total = await TaxFiling.countDocuments(query);
    const filings = await TaxFiling.find(query)
      .populate('clientId', 'name businessName clientCode pan email mobile')
      .populate('taxRuleId', 'taxName taxGroup taxCode filingFrequency')
      .populate('assignedEmployeeId', 'name designation')
      .sort({ [sortBy as string]: sortOrder })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: {
        filings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaxFilingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const filing = await TaxFiling.findOne({ _id: id, organizationId })
      .populate('clientId', 'name businessName clientCode pan gstin email mobile')
      .populate('taxRuleId')
      .populate('assignedEmployeeId', 'name designation email');

    if (!filing) {
      res.status(404).json({ success: false, message: 'Tax filing record not found' });
      return;
    }

    res.json({
      success: true,
      data: filing,
    });
  } catch (error) {
    next(error);
  }
};

export const createTaxFiling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;

    // Sanitize filingStatus if passed as 'Active' or other master status
    const validFilingStatuses = [
      'Not Started',
      'Pending',
      'In Progress',
      'Ready to File',
      'Submitted',
      'Filed',
      'Rejected',
      'Revised',
    ];
    if (req.body.filingStatus && !validFilingStatuses.includes(req.body.filingStatus)) {
      req.body.filingStatus = 'Pending';
    }

    const validated = taxFilingSchema.parse(req.body);

    const originalDue = new Date(validated.originalDueDate);
    const extendedDue = validated.extendedDueDate ? new Date(validated.extendedDueDate) : undefined;
    const effectiveDue = extendedDue || originalDue;

    const initialHistory: any[] = [];
    if (extendedDue) {
      initialHistory.push({
        previousDueDate: originalDue,
        newDueDate: extendedDue,
        reason: validated.extensionReason || 'Initial filing extension',
        reference: validated.extensionReference,
        changedBy: req.user!.name,
        changedAt: new Date(),
      });
    }

    const books = Number(validated.amountAsPerBooks) || 0;
    const stmt = Number(validated.amountAsPerStatement) || 0;
    const difference = validated.reconciliationRequired
      ? Math.round((books - stmt) * 100) / 100
      : 0;

    // Robust FinancialYear resolution: string "2026-27" -> ObjectId
    let resolvedFinancialYearId: mongoose.Types.ObjectId | undefined = undefined;
    const rawFy = validated.financialYearId || (req.body as any).financialYear;
    if (rawFy) {
      if (mongoose.Types.ObjectId.isValid(rawFy)) {
        resolvedFinancialYearId = new mongoose.Types.ObjectId(rawFy);
      } else {
        const fyDoc = await FinancialYear.findOne({ organizationId, yearName: rawFy });
        if (fyDoc) {
          resolvedFinancialYearId = fyDoc._id as mongoose.Types.ObjectId;
        } else {
          const currentFy = await FinancialYear.findOne({ organizationId, isCurrent: true });
          resolvedFinancialYearId = currentFy?._id as mongoose.Types.ObjectId | undefined;
        }
      }
    }

    // Check if an existing filing already exists for this rule and client
    const existingFiling = await TaxFiling.findOne({
      organizationId,
      taxRuleId: validated.taxRuleId,
      clientId: validated.clientId,
    });

    let filing;
    if (existingFiling) {
      existingFiling.filingStatus = validated.filingStatus;
      if (validated.actualSubmissionDate) {
        existingFiling.actualSubmissionDate = new Date(validated.actualSubmissionDate);
      }
      if (validated.acknowledgementNumber) {
        existingFiling.acknowledgementNumber = validated.acknowledgementNumber;
      }
      if (validated.submissionMethod) {
        existingFiling.submissionMethod = validated.submissionMethod;
      }
      if (validated.submittedBy) {
        existingFiling.submittedBy = validated.submittedBy;
      }
      if (validated.filingRemarks) {
        existingFiling.filingRemarks = validated.filingRemarks;
      }
      if (resolvedFinancialYearId) {
        existingFiling.financialYearId = resolvedFinancialYearId;
      }
      existingFiling.financialYear = typeof rawFy === 'string' ? rawFy : undefined;
      existingFiling.reconciliationRequired = validated.reconciliationRequired;
      if (validated.reconciliationRequired) {
        existingFiling.reconciliationType = validated.reconciliationType;
        existingFiling.reconciliationStatus = validated.reconciliationStatus;
        existingFiling.amountAsPerBooks = books;
        existingFiling.amountAsPerStatement = stmt;
        existingFiling.differenceAmount = difference;
      }
      filing = await existingFiling.save();
    } else {
      filing = await TaxFiling.create({
        ...validated,
        organizationId,
        financialYearId: resolvedFinancialYearId,
        financialYear: typeof rawFy === 'string' ? rawFy : undefined,
        periodFrom: new Date(validated.periodFrom),
        periodTo: new Date(validated.periodTo),
        originalDueDate: originalDue,
        extendedDueDate: extendedDue,
        effectiveDueDate: effectiveDue,
        extensionHistory: initialHistory,
        actualSubmissionDate: validated.actualSubmissionDate ? new Date(validated.actualSubmissionDate) : undefined,
        reconciliationStartDate: validated.reconciliationStartDate ? new Date(validated.reconciliationStartDate) : undefined,
        reconciliationCompletionDate: validated.reconciliationCompletionDate ? new Date(validated.reconciliationCompletionDate) : undefined,
        differenceAmount: difference,
      });
    }

    const populated = await TaxFiling.findById(filing._id)
      .populate('clientId', 'name businessName')
      .populate('taxRuleId', 'taxName taxGroup');

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Saved tax filing for ${(populated?.clientId as any)?.businessName || 'Client'}`,
      entityType: 'Work',
      entityId: filing._id.toString(),
      icon: 'file-text',
      color: 'blue',
    });

    res.status(201).json({
      success: true,
      message: 'Tax filing saved successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaxFiling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const filing = await TaxFiling.findOne({ _id: id, organizationId });
    if (!filing) {
      res.status(404).json({ success: false, message: 'Tax filing not found' });
      return;
    }

    // Assign allowed fields
    if (req.body.financialYearId && !mongoose.Types.ObjectId.isValid(req.body.financialYearId)) {
      const fyDoc = await FinancialYear.findOne({ organizationId, yearName: req.body.financialYearId });
      req.body.financialYearId = fyDoc?._id || undefined;
    }

    Object.assign(filing, req.body);

    if (req.body.extendedDueDate) {
      filing.effectiveDueDate = new Date(req.body.extendedDueDate);
    } else if (req.body.originalDueDate && !filing.extendedDueDate) {
      filing.effectiveDueDate = new Date(req.body.originalDueDate);
    }

    if (filing.reconciliationRequired) {
      const b = Number(filing.amountAsPerBooks) || 0;
      const s = Number(filing.amountAsPerStatement) || 0;
      filing.differenceAmount = Math.round((b - s) * 100) / 100;
    }

    await filing.save();

    res.json({
      success: true,
      message: 'Tax filing updated successfully',
      data: filing,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFilingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const validated = updateFilingStatusSchema.parse(req.body);

    const filing = await TaxFiling.findOne({ _id: id, organizationId });
    if (!filing) {
      res.status(404).json({ success: false, message: 'Tax filing not found' });
      return;
    }

    filing.filingStatus = validated.filingStatus;
    if (validated.actualSubmissionDate) {
      filing.actualSubmissionDate = new Date(validated.actualSubmissionDate);
    } else if (validated.filingStatus === 'Filed' && !filing.actualSubmissionDate) {
      filing.actualSubmissionDate = new Date();
    }

    if (validated.acknowledgementNumber) {
      filing.acknowledgementNumber = validated.acknowledgementNumber;
    }
    if (validated.submissionMethod) {
      filing.submissionMethod = validated.submissionMethod as any;
    }
    if (validated.submittedBy) {
      filing.submittedBy = validated.submittedBy;
    }
    if (validated.filingRemarks) {
      filing.filingRemarks = validated.filingRemarks;
    }

    await filing.save();

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Updated filing status to ${validated.filingStatus}`,
      entityType: 'Work',
      entityId: id,
      icon: 'check-circle',
      color: validated.filingStatus === 'Filed' ? 'green' : 'blue',
    });

    res.json({
      success: true,
      message: `Filing status updated to ${validated.filingStatus}`,
      data: filing,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReconciliation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const validated = updateReconciliationSchema.parse(req.body);

    const filing = await TaxFiling.findOne({ _id: id, organizationId });
    if (!filing) {
      res.status(404).json({ success: false, message: 'Tax filing not found' });
      return;
    }

    filing.reconciliationStatus = validated.reconciliationStatus;
    filing.reconciliationRequired = true;

    if (validated.reconciliationType) {
      filing.reconciliationType = validated.reconciliationType;
    }
    if (validated.amountAsPerBooks !== undefined) {
      filing.amountAsPerBooks = Number(validated.amountAsPerBooks);
    }
    if (validated.amountAsPerStatement !== undefined) {
      filing.amountAsPerStatement = Number(validated.amountAsPerStatement);
    }
    if (validated.reconciliationStartDate) {
      filing.reconciliationStartDate = new Date(validated.reconciliationStartDate);
    }
    if (validated.reconciliationCompletionDate) {
      filing.reconciliationCompletionDate = new Date(validated.reconciliationCompletionDate);
    }
    if (validated.reconciledBy) {
      filing.reconciledBy = validated.reconciledBy;
    }
    if (validated.reconciliationRemarks) {
      filing.reconciliationRemarks = validated.reconciliationRemarks;
    }

    const b = Number(filing.amountAsPerBooks) || 0;
    const s = Number(filing.amountAsPerStatement) || 0;
    filing.differenceAmount = Math.round((b - s) * 100) / 100;

    await filing.save();

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Updated reconciliation status to ${validated.reconciliationStatus}`,
      entityType: 'Work',
      entityId: id,
      icon: 'refresh-cw',
      color: validated.reconciliationStatus === 'Reconciled' ? 'green' : 'orange',
    });

    res.json({
      success: true,
      message: 'Reconciliation details updated',
      data: filing,
    });
  } catch (error) {
    next(error);
  }
};

export const extendDeadline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const validated = extendDeadlineSchema.parse(req.body);

    const filing = await TaxFiling.findOne({ _id: id, organizationId });
    if (!filing) {
      res.status(404).json({ success: false, message: 'Tax filing not found' });
      return;
    }

    const previousEffectiveDate = filing.effectiveDueDate || filing.originalDueDate;
    const newDueDate = new Date(validated.extendedDueDate);

    // Record in extension history for full audit trail
    filing.extensionHistory.push({
      previousDueDate: previousEffectiveDate,
      newDueDate,
      reason: validated.extensionReason,
      reference: validated.extensionReference,
      changedBy: req.user!.name,
      changedAt: new Date(),
    });

    // Update extendedDueDate and effectiveDueDate
    filing.extendedDueDate = newDueDate;
    filing.effectiveDueDate = newDueDate;
    filing.extensionReason = validated.extensionReason;
    if (validated.extensionReference) {
      filing.extensionReference = validated.extensionReference;
    }

    await filing.save();

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Extended filing deadline to ${newDueDate.toLocaleDateString()}: ${validated.extensionReason}`,
      entityType: 'Work',
      entityId: id,
      icon: 'clock',
      color: 'orange',
    });

    res.json({
      success: true,
      message: 'Filing deadline extended successfully with audit record',
      data: filing,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTaxFiling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const filing = await TaxFiling.findOneAndDelete({ _id: id, organizationId });
    if (!filing) {
      res.status(404).json({ success: false, message: 'Tax filing not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Tax filing deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
