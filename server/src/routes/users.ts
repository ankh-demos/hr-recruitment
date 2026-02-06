import { Router, Request, Response } from 'express';
import { database } from '../database';
import { User, UserPublic } from '../types';

const router = Router();

// Helper to convert User to UserPublic (without password)
const toPublic = (user: User): UserPublic => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// Get all users (admin only)
router.get('/', (req: Request, res: Response) => {
  try {
    const users = database.getUsers();
    res.json(users.map(toPublic));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

// Get user by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const user = database.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    }
    res.json(toPublic(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

// Create new user (admin only)
router.post('/', (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email, role } = req.body;
    
    if (!username || !password || !fullName || !email || !role) {
      return res.status(400).json({ error: 'Бүх талбарыг бөглөнө үү' });
    }
    
    // Check if username already exists
    const existingUser = database.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Хэрэглэгчийн нэр бүртгэлтэй байна' });
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      fullName,
      email,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const created = database.createUser(newUser);
    res.status(201).json(toPublic(created));
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

// Update user
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { fullName, email, role, isActive, password } = req.body;
    
    const updates: Partial<User> = {
      updatedAt: new Date().toISOString()
    };
    
    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (password !== undefined) updates.password = password;
    
    const updated = database.updateUser(req.params.id, updates);
    
    if (!updated) {
      return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    }
    
    res.json(toPublic(updated));
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

// Delete user
router.delete('/:id', (req: Request, res: Response) => {
  try {
    // Prevent deleting the last admin
    const users = database.getUsers();
    const userToDelete = database.getUserById(req.params.id);
    
    if (!userToDelete) {
      return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    }
    
    if (userToDelete.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin' && u.id !== req.params.id).length;
      if (adminCount === 0) {
        return res.status(400).json({ error: 'Сүүлийн админыг устгах боломжгүй' });
      }
    }
    
    const deleted = database.deleteUser(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    }
    
    res.json({ message: 'Хэрэглэгч устгагдлаа' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

export default router;
