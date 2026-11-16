import { Request, Response, NextFunction } from 'express';
import { WorkMaster } from '../models/WorkMaster.js';
import { ActivityLog } from '../models/Operations.js';
import { workMasterSchema } from '../validators/index.js';

export const getWorkMasters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { tab, category, status, search, page = '1', limit = '10' } = req.query;

    const query: any = { organizationId };

    if (tab && tab !== 'All' && tab !== 'All Works') {
      if (tab === 'Tax Related') {
        query.category = { $in: ['GST', 'Income Tax', 'TDS'] };
      } else {
        query.category = tab;
      }
    }

    if (category && category !== 'All' && category !== 'All Categories') {
      query.category = category;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { workName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { timeline: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await WorkMaster.countDocuments(query);
    const works = await WorkMaster.find(query)
      .populate('taxId', 'taxName taxGroup frequency dueDateRule description periodFrom periodTo submissionDate priority reconciliationRequired')
      .sort({ workId: 1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: {
        works,
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

export const createWorkMaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const validated = workMasterSchema.parse(req.body);

    const last = await WorkMaster.findOne({ organizationId }).sort({ workId: -1 });
    const nextId = (last?.workId || 0) + 1;

    const workData: any = {
      ...validated,
      workId: nextId,
      organizationId,
    };
    if (!workData.taxId) {
      delete workData.taxId;
    }

    const work = await WorkMaster.create(workData);

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Created work template: ${work.workName} (${work.category})`,
      entityType: 'Work',
      entityId: work._id.toString(),
      icon: 'briefcase',
      color: 'blue',
    });

    res.status(201).json({
      success: true,
      message: 'Work template created successfully',
      data: work,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkMaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const updateData = { ...req.body };
    if (!updateData.taxId) {
      updateData.taxId = null;
    }

    const work = await WorkMaster.findOneAndUpdate(
      { _id: id, organizationId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!work) {
      res.status(404).json({ success: false, message: 'Work template not found' });
      return;
    }

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Updated work template: ${work.workName}`,
      entityType: 'Work',
      entityId: work._id.toString(),
      icon: 'edit',
      color: 'purple',
    });

    res.json({
      success: true,
      message: 'Work template updated successfully',
      data: work,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkMaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const work = await WorkMaster.findOneAndDelete({ _id: id, organizationId });
    if (!work) {
      res.status(404).json({ success: false, message: 'Work template not found' });
      return;
    }

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Deleted work template: ${work.workName}`,
      entityType: 'Work',
      entityId: id,
      icon: 'trash',
      color: 'red',
    });

    res.json({
      success: true,
      message: 'Work template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
