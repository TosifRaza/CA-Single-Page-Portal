import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { WorkMaster } from '../models/WorkMaster.js';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { Employee } from '../models/Employee.js';
import { Client } from '../models/Client.js';
import { TaxMaster } from '../models/TaxMaster.js';
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
      const matchingTaxes = await TaxMaster.find({
        organizationId,
        $or: [
          { taxName: { $regex: search, $options: 'i' } },
          { taxGroup: { $regex: search, $options: 'i' } },
        ],
      });
      const matchingTaxIds = matchingTaxes.map((t) => t._id);

      query.$or = [
        { workName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { timeline: { $regex: search, $options: 'i' } },
        { taxId: { $in: matchingTaxIds } },
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

    // Compute assigned employees & clients for these Work Masters
    const orgId = new mongoose.Types.ObjectId(organizationId);
    const workIds = works.map((w) => new mongoose.Types.ObjectId(w._id));
    const assignmentStats = await WorkAssignment.aggregate([
      {
        $match: {
          organizationId: orgId,
          workMasterId: { $in: workIds },
          status: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: {
            workMasterId: '$workMasterId',
            employeeId: '$employeeId',
          },
          count: { $sum: 1 },
          clients: { $addToSet: '$clientId' },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id.employeeId',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: {
          path: '$employee',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    const workStatsMap = new Map<string, {
      totalAssignments: number;
      uniqueClients: Set<string>;
      assignedEmployees: Array<{
        employeeId: string;
        employeeName: string;
        employeeCode: string;
        designation?: string;
        count: number;
        clientsCount: number;
      }>;
    }>();

    assignmentStats.forEach((stat) => {
      const wId = stat._id.workMasterId.toString();
      if (!workStatsMap.has(wId)) {
        workStatsMap.set(wId, {
          totalAssignments: 0,
          uniqueClients: new Set<string>(),
          assignedEmployees: [],
        });
      }
      const entry = workStatsMap.get(wId)!;
      entry.totalAssignments += stat.count;
      (stat.clients || []).forEach((c: any) => entry.uniqueClients.add(c.toString()));

      if (stat.employee) {
        entry.assignedEmployees.push({
          employeeId: stat.employee._id.toString(),
          employeeName: stat.employee.name,
          employeeCode: stat.employee.employeeCode,
          designation: stat.employee.designation,
          count: stat.count,
          clientsCount: (stat.clients || []).length,
        });
      }
    });

    const worksWithStats = works.map((w) => {
      const wObj = w.toObject();
      const stats = workStatsMap.get(w._id.toString());
      return {
        ...wObj,
        totalAssignmentsCount: stats ? stats.totalAssignments : 0,
        assignedClientsCount: stats ? stats.uniqueClients.size : 0,
        assignedEmployeesCount: stats ? stats.assignedEmployees.length : 0,
        assignedEmployees: stats ? stats.assignedEmployees : [],
      };
    });

    res.json({
      success: true,
      data: {
        works: worksWithStats,
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

export const getWorkMasterAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const workMaster = await WorkMaster.findOne({ _id: id, organizationId });
    if (!workMaster) {
      res.status(404).json({ success: false, message: 'Work template not found' });
      return;
    }

    const assignments = await WorkAssignment.find({
      organizationId,
      workMasterId: id,
      status: { $ne: 'Cancelled' },
    })
      .populate('employeeId', 'name employeeCode designation email mobile department')
      .populate('clientId', 'name businessName clientCode pan mobile email')
      .sort({ dueDate: 1 });

    // Group by employee
    const employeeMap = new Map<string, any>();
    assignments.forEach((a) => {
      const emp = a.employeeId as any;
      if (!emp) return;
      const empId = emp._id ? emp._id.toString() : 'unknown';
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employeeId: empId,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          designation: emp.designation,
          department: emp.department,
          assignmentsCount: 0,
          clients: [],
          assignments: [],
        });
      }
      const group = employeeMap.get(empId);
      group.assignmentsCount += 1;
      const client = a.clientId as any;
      if (client && !group.clients.some((c: any) => c._id?.toString() === client._id?.toString())) {
        group.clients.push({
          _id: client._id,
          name: client.name,
          businessName: client.businessName,
          clientCode: client.clientCode,
          pan: client.pan,
        });
      }
      group.assignments.push(a);
    });

    res.json({
      success: true,
      workMaster: {
        _id: workMaster._id,
        workId: workMaster.workId,
        workName: workMaster.workName,
        category: workMaster.category,
        timeline: workMaster.timeline,
        defaultPriority: workMaster.defaultPriority,
      },
      data: assignments,
      employeeSummary: Array.from(employeeMap.values()),
      totalAssignments: assignments.length,
    });
  } catch (error) {
    next(error);
  }
};

export const assignWorkMasterToEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { employeeId, clientId, dueDate, priority, remarks } = req.body;

    const workMaster = await WorkMaster.findOne({ _id: id, organizationId });
    if (!workMaster) {
      res.status(404).json({ success: false, message: 'Work template not found' });
      return;
    }

    // Flow Rule 2: Cannot assign work if Tax Master has no taxes
    const taxMasterCount = await TaxMaster.countDocuments({
      organizationId,
      status: { $ne: 'Archived' },
    });

    if (taxMasterCount === 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot assign work. Work Master strictly depends on Tax Master & Compliance, but no active taxes are configured.',
      });
      return;
    }

    const employee = await Employee.findOne({ _id: employeeId, organizationId });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const client = await Client.findOne({ _id: clientId, organizationId });
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    const count = await WorkAssignment.countDocuments({ organizationId });
    const workCode = `WRK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const checklist = (workMaster.defaultChecklist || []).map((item) => ({
      title: item,
      completed: false,
    }));

    const assignment = await WorkAssignment.create({
      organizationId,
      workCode,
      clientId: client._id,
      workMasterId: workMaster._id,
      employeeId: employee._id,
      assignedBy: req.user!.userId,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: priority || workMaster.defaultPriority || 'Medium',
      remarks: remarks || `Assigned ${workMaster.workName} to ${employee.name}`,
      status: 'Pending',
      checklist,
    });

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Assigned ${workMaster.workName} for ${client.businessName || client.name} to ${employee.name}`,
      entityType: 'Work',
      entityId: assignment._id.toString(),
      icon: 'briefcase',
      color: 'blue',
    });

    res.status(201).json({
      success: true,
      message: `Assigned ${workMaster.workName} to ${employee.name} for ${client.businessName || client.name}`,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkMaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;

    // Flow Rule 2: Work Master strictly depends on Tax Master & Compliance
    const taxMasterCount = await TaxMaster.countDocuments({
      organizationId,
      status: { $ne: 'Archived' },
    });

    if (taxMasterCount === 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot create Work Template. Work Master strictly depends on Tax Master & Compliance. Please configure at least one Tax in Tax Master first.',
      });
      return;
    }

    const validated = workMasterSchema.parse(req.body);

    if (!validated.taxId) {
      res.status(400).json({
        success: false,
        message: 'Every Work Template must be linked to an Associated Tax from Tax Master & Compliance.',
      });
      return;
    }

    const matchedTax = await TaxMaster.findOne({
      _id: validated.taxId,
      organizationId,
      status: { $ne: 'Archived' },
    });

    if (!matchedTax) {
      res.status(400).json({
        success: false,
        message: 'Selected Associated Tax does not exist in Tax Master & Compliance.',
      });
      return;
    }

    const last = await WorkMaster.findOne({ organizationId }).sort({ workId: -1 });
    const nextId = (last?.workId || 0) + 1;

    const workData: any = {
      ...validated,
      workId: nextId,
      organizationId,
    };

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
