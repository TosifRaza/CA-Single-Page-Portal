import { Request, Response, NextFunction } from 'express';
import { TaxMaster } from '../models/TaxMaster.js';
import { TaxGroup } from '../models/TaxGroup.js';
import { ActivityLog } from '../models/Operations.js';
import { taxMasterSchema, taxMasterUpdateSchema } from '../validators/index.js';

export const getTaxes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { group, status, search, page = '1', limit = '10' } = req.query;

    const query: any = { organizationId };

    if (group && group !== 'All' && group !== 'All Taxes') {
      query.taxGroup = group;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { taxName: { $regex: search, $options: 'i' } },
        { dueDateRule: { $regex: search, $options: 'i' } },
        { taxGroup: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { taxCode: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await TaxMaster.countDocuments(query);
    const taxes = await TaxMaster.find(query).sort({ taxId: 1 }).skip(skip).limit(limitNum);

    res.json({
      success: true,
      data: {
        taxes,
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

export const createTax = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;

    // Rule 1: Tax Master strictly depends on Tax Group Master
    const taxGroupCount = await TaxGroup.countDocuments({
      organizationId,
      status: { $ne: 'inactive' },
    });

    if (taxGroupCount === 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot create Tax. Tax Master strictly depends on Tax Group Master. Please create at least one Tax Group in Tax Group Master first.',
      });
      return;
    }

    const validated = taxMasterSchema.parse(req.body);

    // Verify taxGroup exists in Tax Group Master
    const groupExists = await TaxGroup.findOne({
      organizationId,
      $or: [
        { groupName: { $regex: `^${validated.taxGroup}$`, $options: 'i' } },
        { groupCode: { $regex: `^${validated.taxGroup}$`, $options: 'i' } },
      ],
      status: { $ne: 'inactive' },
    });

    if (!groupExists) {
      res.status(400).json({
        success: false,
        message: `Tax Group '${validated.taxGroup}' does not exist in Tax Group Master. Please select an active configured Tax Group.`,
      });
      return;
    }

    // Auto-generate next taxId
    const last = await TaxMaster.findOne({ organizationId }).sort({ taxId: -1 });
    const nextId = (last?.taxId || 0) + 1;

    const tax = await TaxMaster.create({
      ...validated,
      taxGroup: groupExists.groupName, // Store canonical group name
      taxId: nextId,
      organizationId,
    });

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Created tax rule: ${tax.taxName} (${tax.taxGroup})`,
      entityType: 'Tax',
      entityId: tax._id.toString(),
      icon: 'tax',
      color: 'blue',
    });

    res.status(201).json({
      success: true,
      message: 'Tax master created successfully',
      data: tax,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTax = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const validated = taxMasterUpdateSchema.parse(req.body);

    const tax = await TaxMaster.findOneAndUpdate(
      { _id: id, organizationId },
      validated,
      { new: true, runValidators: true }
    );

    if (!tax) {
      res.status(404).json({ success: false, message: 'Tax record not found' });
      return;
    }

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Updated tax rule: ${tax.taxName}`,
      entityType: 'Tax',
      entityId: tax._id.toString(),
      icon: 'edit',
      color: 'purple',
    });

    res.json({
      success: true,
      message: 'Tax updated successfully',
      data: tax,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaxById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const tax = await TaxMaster.findOne({ _id: id, organizationId });
    if (!tax) {
      res.status(404).json({ success: false, message: 'Tax record not found' });
      return;
    }

    res.json({
      success: true,
      data: tax,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTax = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const tax = await TaxMaster.findOneAndDelete({ _id: id, organizationId });
    if (!tax) {
      res.status(404).json({ success: false, message: 'Tax record not found' });
      return;
    }

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Deleted tax rule: ${tax.taxName}`,
      entityType: 'Tax',
      entityId: id,
      icon: 'trash',
      color: 'red',
    });

    res.json({
      success: true,
      message: 'Tax deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
