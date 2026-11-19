import { Request, Response, NextFunction } from 'express';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { Employee } from '../models/Employee.js';
import { WorkMaster } from '../models/WorkMaster.js';
import { Payment } from '../models/Operations.js';

export const getReportsOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const [assignments, payments] = await Promise.all([
      WorkAssignment.find({ organizationId }),
      Payment.find({ organizationId }),
    ]);

    const statusCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const employeeGroups = new Map<string, { totalAssigned: number; completed: number; pending: number }>();
    const workMasterIds = [...new Set(assignments.map((assignment: any) => assignment.workMasterId))];
    const employeeIds = [...new Set(assignments.map((assignment: any) => assignment.employeeId))];
    const [workMasters, employees] = await Promise.all([
      workMasterIds.length ? WorkMaster.find({ _id: { $in: workMasterIds } }) : [],
      employeeIds.length ? Employee.find({ _id: { $in: employeeIds } }) : [],
    ]);
    const workMasterById = new Map<string, any>(workMasters.map((work: any) => [work._id, work]));
    const employeeById = new Map<string, any>(employees.map((employee: any) => [employee._id, employee]));

    for (const assignment of assignments as any[]) {
      statusCounts.set(assignment.status, (statusCounts.get(assignment.status) || 0) + 1);

      const category = workMasterById.get(assignment.workMasterId)?.category;
      if (category) categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

      const employeeName = employeeById.get(assignment.employeeId)?.name;
      if (!employeeName) continue;
      const stats = employeeGroups.get(employeeName) || { totalAssigned: 0, completed: 0, pending: 0 };
      stats.totalAssigned += 1;
      if (['Completed', 'Filed'].includes(assignment.status)) stats.completed += 1;
      if (['Pending', 'In Progress', 'Under Review'].includes(assignment.status)) stats.pending += 1;
      employeeGroups.set(employeeName, stats);
    }

    const paymentsByStatus = new Map<string, { total: number; collected: number; count: number }>();
    for (const payment of payments as any[]) {
      const summary = paymentsByStatus.get(payment.status) || { total: 0, collected: 0, count: 0 };
      summary.total += Number(payment.amount) || 0;
      summary.collected += Number(payment.paidAmount) || 0;
      summary.count += 1;
      paymentsByStatus.set(payment.status, summary);
    }

    res.json({
      success: true,
      data: {
        statusBreakdown: [...statusCounts].map(([status, count]) => ({ status, count })),
        categoryBreakdown: [...categoryCounts].map(([category, count]) => ({ category, count })),
        employeeProductivity: [...employeeGroups].map(([employee, stats]) => ({
          employee,
          ...stats,
          completionRate: stats.totalAssigned > 0
            ? Math.round((stats.completed / stats.totalAssigned) * 100)
            : 0,
        })),
        paymentsSummary: [...paymentsByStatus].map(([_id, summary]) => ({ _id, ...summary })),
      },
    });
  } catch (error) {
    next(error);
  }
};
