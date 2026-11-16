import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { Employee } from '../models/Employee.js';
import { Client } from '../models/Client.js';
import { Payment } from '../models/Operations.js';

export const getReportsOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = new mongoose.Types.ObjectId(req.user!.organizationId);

    // Work status distribution
    const statusCounts = await WorkAssignment.aggregate([
      { $match: { organizationId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Work category breakdown
    const categoryCounts = await WorkAssignment.aggregate([
      { $match: { organizationId } },
      {
        $lookup: {
          from: 'workmasters',
          localField: 'workMasterId',
          foreignField: '_id',
          as: 'master',
        },
      },
      { $unwind: '$master' },
      { $group: { _id: '$master.category', count: { $sum: 1 } } },
    ]);

    // Employee productivity
    const employeeStats = await WorkAssignment.aggregate([
      { $match: { organizationId } },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employee.name',
          totalAssigned: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $in: ['$status', ['Completed', 'Filed']] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $in: ['$status', ['Pending', 'In Progress', 'Under Review']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { totalAssigned: -1 } },
    ]);

    // Financial revenue summary
    const paymentsSummary = await Payment.aggregate([
      { $match: { organizationId } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          collected: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: statusCounts.map((s) => ({ status: s._id, count: s.count })),
        categoryBreakdown: categoryCounts.map((c) => ({ category: c._id, count: c.count })),
        employeeProductivity: employeeStats.map((e) => ({
          employee: e._id,
          totalAssigned: e.totalAssigned,
          completed: e.completed,
          pending: e.pending,
          completionRate: e.totalAssigned > 0 ? Math.round((e.completed / e.totalAssigned) * 100) : 0,
        })),
        paymentsSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};
