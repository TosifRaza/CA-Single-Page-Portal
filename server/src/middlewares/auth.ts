import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User.js';
import { Organization } from '../models/Organization.js';

export interface AuthUserPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'ca_proflow_super_secret_jwt_key_2026_xyz9876';
    const decoded = jwt.verify(token, secret) as AuthUserPayload;

    // Automatically synchronize with the active database user & organization
    if (decoded.email) {
      const activeUser = await User.findOne({ email: decoded.email }).sort({ createdAt: -1 });
      if (activeUser) {
        decoded.userId = activeUser._id.toString();
        decoded.organizationId = activeUser.organizationId.toString();
      }
    } else if (decoded.organizationId) {
      const orgExists = await Organization.exists({ _id: decoded.organizationId });
      if (!orgExists) {
        const defaultOrg = (await Organization.findOne({ name: 'RIZ & Associates' })) || (await Organization.findOne({}));
        if (defaultOrg) {
          decoded.organizationId = defaultOrg._id.toString();
        }
      }
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' lacks permission for this resource.`,
      });
      return;
    }

    next();
  };
};
