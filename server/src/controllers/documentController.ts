import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { DocumentModel } from '../models/Document.js';
import { ActivityLog } from '../models/Operations.js';

export const getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { clientId, workAssignmentId, categoryId, search, page = '1', limit = '10' } = req.query;

    const query: any = { organizationId };

    if (clientId) query.clientId = clientId;
    if (workAssignmentId) query.workAssignmentId = workAssignmentId;
    if (categoryId) query.categoryId = categoryId;
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await DocumentModel.countDocuments(query);
    const documents = await DocumentModel.find(query)
      .populate('clientId', 'name businessName')
      .populate('workAssignmentId', 'workCode')
      .populate('categoryId', 'name')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: {
        documents,
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

export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const { clientId, workAssignmentId, categoryId, description } = req.body;

    const doc = await DocumentModel.create({
      organizationId,
      clientId: clientId || undefined,
      workAssignmentId: workAssignmentId || undefined,
      categoryId: categoryId || undefined,
      filename: file.filename,
      originalName: file.originalname,
      storagePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy: req.user!.userId,
      description,
    });

    await ActivityLog.create({
      organizationId,
      actorId: req.user!.userId,
      actorName: req.user!.name,
      action: `Uploaded document: ${file.originalname}`,
      entityType: 'Document',
      entityId: doc._id.toString(),
      icon: 'file-text',
      color: 'blue',
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const doc = await DocumentModel.findOne({ _id: id, organizationId });
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    if (!fs.existsSync(doc.storagePath)) {
      res.status(404).json({ success: false, message: 'File is missing on server storage' });
      return;
    }

    res.download(doc.storagePath, doc.originalName);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const doc = await DocumentModel.findOneAndDelete({ _id: id, organizationId });
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    if (fs.existsSync(doc.storagePath)) {
      try {
        fs.unlinkSync(doc.storagePath);
      } catch (err) {}
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};
