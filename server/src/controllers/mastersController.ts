import { Request, Response, NextFunction } from 'express';
import { FinancialYear, Branch, Service } from '../models/Masters.js';
import { DocumentCategory } from '../models/Document.js';

// Financial Years
export const getFinancialYears = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const years = await FinancialYear.find({ organizationId }).sort({ yearName: -1 });
    res.json({ success: true, data: years });
  } catch (error) {
    next(error);
  }
};

export const createFinancialYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { yearName, assessmentYear, startDate, endDate, isCurrent } = req.body;

    if (isCurrent) {
      await FinancialYear.updateMany({ organizationId }, { isCurrent: false });
    }

    const fy = await FinancialYear.create({
      organizationId,
      yearName,
      assessmentYear,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: !!isCurrent,
    });

    res.status(201).json({ success: true, message: 'Financial year created', data: fy });
  } catch (error) {
    next(error);
  }
};

export const setActiveFinancialYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    await FinancialYear.updateMany({ organizationId }, { isCurrent: false });
    const fy = await FinancialYear.findOneAndUpdate({ _id: id, organizationId }, { isCurrent: true }, { new: true });

    res.json({ success: true, message: 'Active financial year updated', data: fy });
  } catch (error) {
    next(error);
  }
};

// Branches
export const getBranches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const branches = await Branch.find({ organizationId }).populate('managerId', 'name email');
    res.json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

export const createBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const branch = await Branch.create({ ...req.body, organizationId });
    res.status(201).json({ success: true, message: 'Branch created', data: branch });
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const branch = await Branch.findOneAndUpdate({ _id: id, organizationId }, req.body, { new: true });
    res.json({ success: true, message: 'Branch updated', data: branch });
  } catch (error) {
    next(error);
  }
};

export const deleteBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    await Branch.findOneAndDelete({ _id: id, organizationId });
    res.json({ success: true, message: 'Branch deleted' });
  } catch (error) {
    next(error);
  }
};

// Services
export const getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const services = await Service.find({ organizationId }).sort({ category: 1, serviceName: 1 });
    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const service = await Service.create({ ...req.body, organizationId });
    res.status(201).json({ success: true, message: 'Service created', data: service });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const service = await Service.findOneAndUpdate({ _id: id, organizationId }, req.body, { new: true });
    res.json({ success: true, message: 'Service updated', data: service });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    await Service.findOneAndDelete({ _id: id, organizationId });
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    next(error);
  }
};

// Document Categories
export const getDocumentCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const categories = await DocumentCategory.find({ organizationId }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createDocumentCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const category = await DocumentCategory.create({ ...req.body, organizationId });
    res.status(201).json({ success: true, message: 'Document category created', data: category });
  } catch (error) {
    next(error);
  }
};
