import { Request, Response, NextFunction } from 'express';
import { Employee } from '../models/Employee.js';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { Client } from '../models/Client.js';
import { WorkMaster } from '../models/WorkMaster.js';
import { TaxMaster } from '../models/TaxMaster.js';
import { ActivityLog } from '../models/Operations.js';
import { employeeSchema } from '../validators/index.js';

export const getEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { department, status, search, page = '1', limit = '10' } = req.query;

    const query: any = { organizationId };

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    } else {
      query.status = { $ne: 'archived' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('branchId', 'branchName')
      .populate('managerId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute assigned works & client stats for each employee
    const statsMap = new Map<string, any>();
    const assignmentStats = await WorkAssignment.find({
      organizationId,
      employeeId: { $in: employees.map((employee: any) => employee._id) },
      status: { $ne: 'Cancelled' },
    });
    assignmentStats.forEach((assignment: any) => {
      const employeeKey = String(assignment.employeeId);
      const stats = statsMap.get(employeeKey) || {
        totalWorks: 0,
        clients: new Set<string>(),
        pendingWorks: 0,
        completedWorks: 0,
      };
      stats.totalWorks += 1;
      stats.clients.add(String(assignment.clientId));
      if (['Pending', 'In Progress', 'Under Review'].includes(assignment.status)) stats.pendingWorks += 1;
      if (['Completed', 'Filed'].includes(assignment.status)) stats.completedWorks += 1;
      statsMap.set(employeeKey, stats);
    });

    const employeesWithStats = employees.map((emp: any) => {
      const empObj = emp.toObject();
      const stats = statsMap.get(String(emp._id)) || {
        totalWorks: 0,
        clients: new Set<string>(),
        pendingWorks: 0,
        completedWorks: 0,
      };
      return {
        ...empObj,
        assignedWorksCount: stats.totalWorks,
        assignedClientsCount: stats.clients.size,
        pendingWorksCount: stats.pendingWorks,
        completedWorksCount: stats.completedWorks,
      };
    });

    res.json({
      success: true,
      data: {
        employees: employeesWithStats,
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

export const createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const validated = employeeSchema.parse(req.body);

    const count = await Employee.countDocuments({ organizationId });
    const employeeCode = `EMP-${String(count + 1).padStart(4, '0')}`;

    const { initialAssignments, ...empFields } = validated;

    const employee = await Employee.create({
      ...empFields,
      employeeCode,
      organizationId,
    });

    // If initial assignments were provided in employee creation
    if (initialAssignments && Array.isArray(initialAssignments) && initialAssignments.length > 0) {
      for (const item of initialAssignments) {
        if (!item.clientId || !item.workMasterId) continue;
        const client = await Client.findOne({ _id: item.clientId, organizationId });
        const workMaster = await WorkMaster.findOne({ _id: item.workMasterId, organizationId });
        if (client && workMaster) {
          const assignCount = await WorkAssignment.countDocuments({ organizationId });
          const workCode = `WRK-${new Date().getFullYear()}-${String(assignCount + 1).padStart(4, '0')}`;
          const checklist = (workMaster.defaultChecklist || []).map((t: any) => ({
            title: t,
            completed: false,
          }));

          await WorkAssignment.create({
            organizationId,
            workCode,
            clientId: client._id,
            workMasterId: workMaster._id,
            employeeId: employee._id,
            assignedBy: req.user!.userId,
            dueDate: item.dueDate ? new Date(item.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            priority: item.priority || workMaster.defaultPriority || 'Medium',
            remarks: item.remarks || `Assigned during employee onboarding: ${employee.name}`,
            status: 'Pending',
            checklist,
          });

          await ActivityLog.create({
            organizationId,
            actorId: req.user!.userId,
            actorName: req.user!.name,
            action: `Assigned ${workMaster.workName} for ${client.businessName || client.name} to ${employee.name}`,
            entityType: 'Work',
            icon: 'briefcase',
            color: 'blue',
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const employee = await Employee.findOneAndUpdate(
      { _id: id, organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const employee = await Employee.findOneAndUpdate(
      { _id: id, organizationId },
      { status: 'archived' },
      { new: true }
    );

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    res.json({ success: true, message: 'Employee archived successfully' });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeAssignedWorks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const employee = await Employee.findOne({ _id: id, organizationId });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const works = await WorkAssignment.find({
      organizationId,
      employeeId: id,
      status: { $ne: 'Cancelled' },
    })
      .populate('clientId', 'name businessName pan clientCode mobile email')
      .populate('workMasterId', 'workName category timeline defaultPriority defaultChecklist')
      .sort({ dueDate: 1 });

    // Client-wise grouping so you see which works are assigned for which client & count
    const clientMap = new Map<string, any>();
    works.forEach((w: any) => {
      const client = w.clientId as any;
      if (!client) return;
      const cid = client._id ? client._id.toString() : 'unknown';
      if (!clientMap.has(cid)) {
        clientMap.set(cid, {
          clientId: cid,
          clientName: client.businessName || client.name,
          clientCode: client.clientCode || 'N/A',
          pan: client.pan || 'N/A',
          mobile: client.mobile || '',
          email: client.email || '',
          worksCount: 0,
          works: [],
        });
      }
      const clientGroup = clientMap.get(cid);
      clientGroup.worksCount += 1;
      clientGroup.works.push(w);
    });

    const clientSummary = Array.from(clientMap.values());

    res.json({
      success: true,
      data: works,
      employee: {
        _id: employee._id,
        name: employee.name,
        employeeCode: employee.employeeCode,
        designation: employee.designation,
        department: employee.department,
        email: employee.email,
        mobile: employee.mobile,
      },
      clientSummary,
      stats: {
        totalWorks: works.length,
        uniqueClients: clientSummary.length,
        pending: works.filter((w: any) => ['Pending', 'In Progress', 'Under Review'].includes(w.status)).length,
        completed: works.filter((w: any) => ['Completed', 'Filed'].includes(w.status)).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const assignWorkToEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Flow Rule 2: Cannot assign work if Tax Master has no taxes
    const taxMasterCount = await TaxMaster.countDocuments({
      organizationId,
      status: { $ne: 'Archived' },
    });

    if (taxMasterCount === 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot assign work. Practice Management flow requires configured taxes in Tax Master & Compliance first.',
      });
      return;
    }

    const { clientId, workMasterId, dueDate, priority = 'Medium', remarks } = req.body;

    const employee = await Employee.findOne({ _id: id, organizationId });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const client = await Client.findOne({ _id: clientId, organizationId });
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    const workMaster = await WorkMaster.findOne({ _id: workMasterId, organizationId });
    if (!workMaster) {
      res.status(404).json({ success: false, message: 'Work template not found' });
      return;
    }

    const count = await WorkAssignment.countDocuments({ organizationId });
    const workCode = `WRK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const checklist = (workMaster.defaultChecklist || []).map((item: any) => ({
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
      remarks: remarks || `Assigned to ${employee.name} via Employee Master`,
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
      message: `Successfully assigned ${workMaster.workName} to ${employee.name}`,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};
