import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';

export const getGeneralSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organization = await Organization.findById(req.user!.organizationId);
    if (!organization) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    res.json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
};

export const updateGeneralSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { name, phone, email, address, settings } = req.body;

    const organization = await Organization.findByIdAndUpdate(
      organizationId,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(address && { address }),
        ...(settings && { settings }),
      },
      { new: true }
    );

    res.json({ success: true, message: 'Settings updated successfully', data: organization });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const users = await User.find({ organizationId }).select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ organizationId, email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'Password123!', salt);

    const user = await User.create({
      organizationId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'Employee',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const { role, status } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: id, organizationId },
      { ...(role && { role }), ...(status && { status }) },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};
