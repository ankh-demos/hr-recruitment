import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

// Verify JWT token
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; username: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Токен хүчингүй эсвэл хугацаа дууссан' });
  }
}

// Check if user is admin
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Админ эрх шаардлагатай' });
  }
  next();
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string; username: string; role: string };
      req.user = decoded;
    } catch (error) {
      // Token invalid, but don't fail - just don't set user
    }
  }
  next();
}

// Generate JWT token
export function generateToken(user: { id: string; username: string; role: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: '7d' }
  );
}
