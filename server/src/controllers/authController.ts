import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { loginSchema, registerSchema } from '../validators/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ca_proflow_super_secret_jwt_key_2026_xyz9876';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ca_proflow_super_refresh_jwt_key_2026_abc1234';

const generateTokens = (user: IUser) => {
  const payload = {
    userId: user._id.toString(),
    organizationId: user.organizationId.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const organization = await Organization.findById(user.organizationId);
    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        organization: organization
          ? {
              id: organization._id,
              name: organization.name,
              logo: organization.logo,
              settings: organization.settings,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validated.email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email is already registered' });
      return;
    }

    // Create Organization
    const organization = await Organization.create({
      name: validated.organizationName,
      email: validated.email.toLowerCase(),
      phone: validated.phone,
    });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    // Create Super Admin / CA Admin
    const user = await User.create({
      organizationId: organization._id,
      name: validated.name,
      email: validated.email.toLowerCase(),
      passwordHash,
      role: 'CA Admin',
      status: 'active',
    });

    const { accessToken } = generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        organization: {
          id: organization._id,
          name: organization.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      res.status(401).json({ success: false, message: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      res.status(401).json({ success: false, message: 'Invalid session' });
      return;
    }

    const tokens = generateTokens(user);
    res.json({
      success: true,
      data: { token: tokens.accessToken },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Expired or invalid refresh token' });
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const organization = await Organization.findById(user.organizationId);

    res.json({
      success: true,
      data: {
        user,
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
};
