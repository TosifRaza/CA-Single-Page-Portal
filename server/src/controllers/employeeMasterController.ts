import { Request, Response, NextFunction } from 'express';
import { Employee } from '../models/Employee.js';
import { WorkAssignment } from '../models/WorkAssignment.js';
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

    res.json({
      success: true,
      data: {
        employees,
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

    const employee = await Employee.create({
      ...validated,
      employeeCode,
      organizationId,
    });

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

    const works = await WorkAssignment.find({ organizationId, employeeId: id })
      .populate('clientId', 'name businessName pan')
      .populate('workMasterId', 'workName category')
      .sort({ dueDate: 1 });

    res.json({ success: true, data: works });
  } catch (error) {
    next(error);
  }
};
