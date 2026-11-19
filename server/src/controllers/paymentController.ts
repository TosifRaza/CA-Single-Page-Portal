import { Request, Response, NextFunction } from 'express';
import { Payment } from '../models/Operations.js';
import { Client } from '../models/Client.js';
import { ActivityLog } from '../models/Operations.js';
import { paymentSchema } from '../validators/index.js';

export const getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { status, clientId, search, page = '1', limit = '10' } = req.query;

    const query: any = { organizationId };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (clientId && clientId !== 'All') {
      query.clientId = clientId;
    }

    if (search) {
      query.$or = [
        { paymentCode: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('clientId', 'name businessName pan')
      .populate('workAssignmentId', 'workCode')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limitNum);

    // Summary stats
    const organizationPayments = await Payment.find({ organizationId });
    const totalAmount = (organizationPayments as any[]).reduce(
      (totals, payment) => ({
        total: totals.total + (Number(payment.amount) || 0),
        paid: totals.paid + (Number(payment.paidAmount) || 0),
      }),
      { total: 0, paid: 0 }
    );

    res.json({
      success: true,
      data: {
        payments,
        summary: {
          totalBilled: totalAmount.total,
          totalCollected: totalAmount.paid,
          pendingAmount: totalAmount.total - totalAmount.paid,
        },
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

export const createPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const validated = paymentSchema.parse(req.body);

    const client = await Client.findOne({ _id: validated.clientId, organizationId });
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    const count = await Payment.countDocuments({ organizationId });
    const paymentCode = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payment = await Payment.create({
      ...validated,
      paymentCode,
      organizationId,
      paymentDate: validated.paymentDate ? new Date(validated.paymentDate) : new Date(),
    });

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Payment recorded: ₹${payment.paidAmount || payment.amount} from ${client.businessName || client.name}`,
      entityType: 'Payment',
      entityId: payment._id.toString(),
      icon: 'dollar-sign',
      color: 'orange',
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const payment = await Payment.findOneAndUpdate(
      { _id: id, organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    res.json({ success: true, message: 'Payment updated', data: payment });
  } catch (error) {
    next(error);
  }
};

export const deletePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    await Payment.findOneAndDelete({ _id: id, organizationId });
    res.json({ success: true, message: 'Payment deleted' });
  } catch (error) {
    next(error);
  }
};
