import { Request, Response, NextFunction } from 'express';
import { Client } from '../models/Client.js';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { TaxMaster } from '../models/TaxMaster.js';
import { WorkMaster } from '../models/WorkMaster.js';
import { Employee } from '../models/Employee.js';
import { Service } from '../models/Masters.js';

export const globalSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const query = (req.query.q as string)?.trim();

    if (!query || query.length < 2) {
      res.json({
        success: true,
        data: {
          clients: [],
          works: [],
          taxes: [],
          workTemplates: [],
          employees: [],
          services: [],
        },
      });
      return;
    }

    const regex = { $regex: query, $options: 'i' };

    const [clients, works, taxes, workTemplates, employees, services] = await Promise.all([
      Client.find({
        organizationId,
        $or: [{ name: regex }, { businessName: regex }, { pan: regex }, { gstin: regex }, { mobile: regex }],
      })
        .limit(5)
        .select('name businessName pan clientCode'),

      WorkAssignment.find({
        organizationId,
        $or: [{ workCode: regex }, { remarks: regex }, { filingReference: regex }],
      })
        .populate('clientId', 'name businessName')
        .populate('workMasterId', 'workName')
        .limit(5),

      TaxMaster.find({
        organizationId,
        $or: [{ taxName: regex }, { taxGroup: regex }],
      })
        .limit(5)
        .select('taxName taxGroup frequency dueDateRule'),

      WorkMaster.find({
        organizationId,
        $or: [{ workName: regex }, { category: regex }],
      })
        .limit(5)
        .select('workName category timeline'),

      Employee.find({
        organizationId,
        $or: [{ name: regex }, { email: regex }, { designation: regex }],
      })
        .limit(5)
        .select('name designation email mobile'),

      Service.find({
        organizationId,
        $or: [{ serviceName: regex }, { category: regex }],
      })
        .limit(5)
        .select('serviceName category defaultPrice'),
    ]);

    res.json({
      success: true,
      data: {
        clients,
        works,
        taxes,
        workTemplates,
        employees,
        services,
      },
    });
  } catch (error) {
    next(error);
  }
};
