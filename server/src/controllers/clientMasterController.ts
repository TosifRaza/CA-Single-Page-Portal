import { Request, Response, NextFunction } from 'express';
import { Client } from '../models/Client.js';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { Payment } from '../models/Operations.js';
import { DocumentModel } from '../models/Document.js';
import { ActivityLog } from '../models/Operations.js';
import { clientSchema } from '../validators/index.js';

export const getClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { clientType, status, search, group, page = '1', limit = '10' } = req.query;

    const query: any = { organizationId };

    if (clientType && clientType !== 'All') {
      query.clientType = clientType;
    }

    if (group && group !== 'All') {
      query.groupName = group;
    }

    if (status && status !== 'All') {
      query.status = status;
    } else {
      query.status = { $ne: 'archived' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { groupName: { $regex: search, $options: 'i' } },
        { cin: { $regex: search, $options: 'i' } },
        { pan: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { clientCode: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .populate('assignedEmployeeId', 'name designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: {
        clients,
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

export const getClientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const client = await Client.findOne({ _id: id, organizationId })
      .populate('assignedEmployeeId', 'name designation email mobile')
      .populate('financialYearId', 'yearName');

    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    // Related works
    const works = await WorkAssignment.find({ organizationId, clientId: id })
      .populate('workMasterId', 'workName category timeline')
      .populate('employeeId', 'name')
      .sort({ createdAt: -1 });

    // Related payments
    const payments = await Payment.find({ organizationId, clientId: id }).sort({ paymentDate: -1 });

    // Related documents
    const documents = await DocumentModel.find({ organizationId, clientId: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        client,
        works,
        payments,
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const validated = clientSchema.parse(req.body);

    // Check duplicate within organization
    if (validated.gstin) {
      const existingGstin = await Client.findOne({ organizationId, gstin: validated.gstin });
      if (existingGstin) {
        res.status(409).json({ success: false, message: `A business with GSTIN ${validated.gstin} is already registered.` });
        return;
      }
    }

    const existingPan = await Client.findOne({
      organizationId,
      pan: validated.pan,
    });
    if (existingPan) {
      res.status(409).json({
        success: false,
        message: `A client with PAN ${validated.pan} is already registered.`,
      });
      return;
    }

    // Auto-generate clientCode
    const count = await Client.countDocuments({ organizationId });
    const clientCode = `CL-${String(count + 1).padStart(4, '0')}`;

    const client = await Client.create({
      ...validated,
      clientCode,
      organizationId,
    });

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `New client registered: ${client.businessName || client.name}`,
      entityType: 'Client',
      entityId: client._id.toString(),
      icon: 'user-plus',
      color: 'blue',
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const client = await Client.findOneAndUpdate(
      { _id: id, organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Updated client profile: ${client.businessName || client.name}`,
      entityType: 'Client',
      entityId: client._id.toString(),
      icon: 'edit',
      color: 'purple',
    });

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const client = await Client.findOneAndUpdate(
      { _id: id, organizationId },
      { status: 'archived' },
      { new: true }
    );

    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Archived client: ${client.businessName || client.name}`,
      entityType: 'Client',
      entityId: id,
      icon: 'archive',
      color: 'orange',
    });

    res.json({
      success: true,
      message: 'Client archived successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const exportClientsCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const clients = await Client.find({ organizationId, status: { $ne: 'archived' } }).sort({ clientCode: 1 });

    const header = 'Client Code,Name,Business Name,Client Type,Business Type,PAN,GSTIN,Email,Mobile,Status\n';
    const rows = clients.map((c: any) =>
      `"${c.clientCode}","${c.name}","${c.businessName || ''}","${c.clientType}","${c.businessType}","${c.pan}","${c.gstin || ''}","${c.email || ''}","${c.mobile}","${c.status}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"');
    res.send(header + rows);
  } catch (error) {
    next(error);
  }
};
