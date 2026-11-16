import { Request, Response, NextFunction } from 'express';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { WorkMaster } from '../models/WorkMaster.js';
import { Client } from '../models/Client.js';
import { Employee } from '../models/Employee.js';
import { ActivityLog, Notification } from '../models/Operations.js';
import { workAssignmentSchema } from '../validators/index.js';

export const getWorkAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { status, clientId, employeeId, priority, search, page = '1', limit = '10' } = req.query;

    const query: any = { organizationId };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (clientId && clientId !== 'All') {
      query.clientId = clientId;
    }

    if (employeeId && employeeId !== 'All') {
      query.employeeId = employeeId;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { workCode: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } },
        { filingReference: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await WorkAssignment.countDocuments(query);
    const works = await WorkAssignment.find(query)
      .populate('clientId', 'name businessName clientCode pan')
      .populate('workMasterId', 'workName category timeline defaultPriority defaultChecklist')
      .populate('employeeId', 'name designation email mobile')
      .populate('assignedBy', 'name')
      .sort({ dueDate: 1 })
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

export const getWorkAssignmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const work = await WorkAssignment.findOne({ _id: id, organizationId })
      .populate('clientId')
      .populate('workMasterId')
      .populate('employeeId')
      .populate('assignedBy', 'name email');

    if (!work) {
      res.status(404).json({ success: false, message: 'Work assignment not found' });
      return;
    }

    res.json({ success: true, data: work });
  } catch (error) {
    next(error);
  }
};

export const createWorkAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const validated = workAssignmentSchema.parse(req.body);

    const client = await Client.findOne({ _id: validated.clientId, organizationId });
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    const workMaster = await WorkMaster.findOne({ _id: validated.workMasterId, organizationId });
    if (!workMaster) {
      res.status(404).json({ success: false, message: 'Work master not found' });
      return;
    }

    const employee = await Employee.findOne({ _id: validated.employeeId, organizationId });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // Auto-generate work code
    const count = await WorkAssignment.countDocuments({ organizationId });
    const workCode = `WRK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Initialize checklist from template if present
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
      dueDate: new Date(validated.dueDate),
      priority: validated.priority || workMaster.defaultPriority || 'Medium',
      remarks: validated.remarks,
      status: validated.status || 'Pending',
      checklist,
    });

    // Activity Log
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

    // In-app Notification for Employee
    await Notification.create({
      organizationId,
      userId: employee.userId,
      type: 'info',
      title: 'New Work Assigned',
      message: `You have been assigned ${workMaster.workName} for ${client.businessName || client.name}. Due on ${new Date(validated.dueDate).toLocaleDateString()}.`,
      relatedEntity: {
        entityType: 'work',
        entityId: assignment._id.toString(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Work assigned successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const assignment = await WorkAssignment.findOneAndUpdate(
      { _id: id, organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Work assignment not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Work assignment updated',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { status, remarks, filingReference } = req.body;

    const updateData: any = { status };
    if (remarks) updateData.remarks = remarks;
    if (filingReference) updateData.filingReference = filingReference;

    if (status === 'Completed') {
      updateData.completedAt = new Date();
    }
    if (status === 'Filed') {
      updateData.filedAt = new Date();
    }

    const assignment = await WorkAssignment.findOneAndUpdate(
      { _id: id, organizationId },
      updateData,
      { new: true }
    )
      .populate('clientId', 'name businessName')
      .populate('workMasterId', 'workName');

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Work assignment not found' });
      return;
    }

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Status of ${assignment.workCode} changed to '${status}'`,
      entityType: 'Work',
      entityId: assignment._id.toString(),
      icon: status === 'Completed' || status === 'Filed' ? 'check-circle' : 'activity',
      color: status === 'Completed' || status === 'Filed' ? 'green' : 'blue',
    });

    res.json({
      success: true,
      message: `Work status updated to ${status}`,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const assignment = await WorkAssignment.findOneAndDelete({ _id: id, organizationId });
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Work assignment not found' });
      return;
    }

    res.json({ success: true, message: 'Work assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
