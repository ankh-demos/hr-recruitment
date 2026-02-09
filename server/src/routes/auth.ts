import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/unifiedDb';
import { UserPublic } from '../types';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Хэрэглэгчийн нэр болон нууц үг оруулна уу' });
    }
    
    const user = await db.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });
    }
    
    // Check password (support both hashed and plain text for migration)
    const isValidPassword = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : user.password === password;
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'Хэрэглэгч идэвхгүй байна' });
    }

    // Generate JWT token
    const token = generateToken({ id: user.id, username: user.username, role: user.role });
    
    // Return user without password
    const userPublic: UserPublic = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json({ user: userPublic, token, message: 'Амжилттай нэвтэрлээ' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

// Get current user (using JWT)
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Нэвтрээгүй байна' });
    }
    
    const user = await db.getUserById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' });
    }
    
    const userPublic: UserPublic = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json(userPublic);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ valid: true, user: req.user });
});

export default router;
